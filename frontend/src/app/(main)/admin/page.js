'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/hooks/useAuthStore';

export default function AdminPage() {
  const user = useAuthStore((state) => state.user);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError('');

        if (!user?.token) {
          setError('Vui lòng đăng nhập.');
          return;
        }

        const response = await fetch('http://localhost:8080/api/admin/stats', {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        const result = await response.json().catch(() => null);
        if (!response.ok || !result?.success) {
          if (response.status === 403) {
            throw new Error('Bạn không có quyền truy cập trang admin.');
          }
          throw new Error(result?.message || 'Không thể tải dữ liệu admin');
        }

        setStats(result.data);
      } catch (e) {
        setError(e?.message || 'Không thể tải dữ liệu admin');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [user?.token]);

  return (
    <main className="pt-28 pb-20 max-w-5xl mx-auto px-6 md:px-8">
      <header className="mb-8">
        <h1 className="font-headline text-4xl md:text-5xl italic text-on-surface">Admin</h1>
        <p className="mt-2 font-body text-sm text-on-surface-variant">Trang admin tối thiểu.</p>
      </header>

      <section className="rounded-2xl border border-outline/30 bg-surface-container-low p-6">
        {loading ? (
          <p className="font-body text-on-surface-variant">Đang tải...</p>
        ) : error ? (
          <p className="font-body text-error">{error}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-outline-variant/20 bg-surface p-5">
              <p className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Users</p>
              <p className="mt-2 font-headline text-3xl font-bold text-on-surface">{stats?.users ?? '-'}</p>
            </div>
            <div className="rounded-2xl border border-outline-variant/20 bg-surface p-5">
              <p className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Listings</p>
              <p className="mt-2 font-headline text-3xl font-bold text-on-surface">{stats?.listings ?? '-'}</p>
            </div>
            <div className="rounded-2xl border border-outline-variant/20 bg-surface p-5">
              <p className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Orders</p>
              <p className="mt-2 font-headline text-3xl font-bold text-on-surface">{stats?.orders ?? '-'}</p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
