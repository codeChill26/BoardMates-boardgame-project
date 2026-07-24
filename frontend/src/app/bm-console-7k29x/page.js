'use client';

import React from 'react';
import { teams } from '@/data/teams';

const API = 'http://localhost:8080/api/positions';

// Trang quan tri AN — dat o duong dan kho doan, khong link tu dau, khong co navbar.
// Bat/tat tung vi tri tuyen dung. Can nhap khoa quan tri (khop ADMIN_SECRET o backend).
export default function ConsolePage() {
  const [status, setStatus] = React.useState(null); // { slug: isOpen }
  const [key, setKey] = React.useState('');
  const [msg, setMsg] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState('');

  // Nho khoa trong phien cho tien
  React.useEffect(() => {
    const saved = sessionStorage.getItem('bm_admin_key');
    if (saved) setKey(saved);
  }, []);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(API);
      const json = await res.json();
      setStatus(json.data || {});
      setMsg('');
    } catch (e) {
      setMsg('Không kết nối được backend (localhost:8080). Hãy chạy backend trước.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const toggle = async (slug, nextOpen) => {
    setBusy(slug);
    setMsg('');
    try {
      const res = await fetch(`${API}/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
        body: JSON.stringify({ isOpen: nextOpen }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setMsg(res.status === 401 ? 'Sai khoá quản trị.' : (json?.message || 'Lỗi cập nhật.'));
        return;
      }
      sessionStorage.setItem('bm_admin_key', key);
      setStatus(json.data);
    } catch (e) {
      setMsg('Không kết nối được backend.');
    } finally {
      setBusy('');
    }
  };

  return (
    <main className="min-h-screen bg-surface px-6 py-16">
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="space-y-2">
          <span className="font-label text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
            console.exe
          </span>
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-on-surface">
            Quản trị vị trí
          </h1>
          <p className="font-body text-sm text-on-surface-variant">
            Bật/tắt việc nhận ứng tuyển cho từng ban. Vị trí đã tắt sẽ bị tô xám và
            không mở được ở trang Tham gia.
          </p>
        </header>

        {/* Khoa quan tri */}
        <div className="window-border bg-surface-container-low p-4 flex flex-col sm:flex-row gap-3 sm:items-center">
          <label className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant shrink-0">
            Khoá quản trị
          </label>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Nhập khoá để bật/tắt"
            className="flex-1 bg-surface-container-high border-b-2 border-outline-variant px-3 py-2 text-on-surface font-body focus:outline-none focus:border-b-primary"
          />
        </div>

        {msg ? (
          <p className="font-body text-sm text-error bg-error-container/10 border-l-4 border-error px-4 py-3 rounded-r-md">
            {msg}
          </p>
        ) : null}

        {loading ? (
          <p className="font-body text-on-surface-variant">Đang tải...</p>
        ) : (
          <ul className="space-y-3">
            {teams.map((team) => {
              const isOpen = status?.[team.slug] !== false;
              return (
                <li
                  key={team.slug}
                  className="window-border bg-surface-container-lowest p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="material-symbols-outlined text-primary text-2xl shrink-0">
                      {team.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="font-headline text-lg font-bold text-on-surface truncate">
                        {team.name.vi}
                      </p>
                      <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
                        {team.slug}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`font-label text-[10px] font-bold uppercase tracking-widest ${
                        isOpen ? 'text-secondary' : 'text-on-surface-variant'
                      }`}
                    >
                      {isOpen ? 'Đang mở' : 'Đã đóng'}
                    </span>
                    <button
                      type="button"
                      disabled={busy === team.slug}
                      onClick={() => toggle(team.slug, !isOpen)}
                      className={`relative w-14 h-8 rounded-full transition-colors disabled:opacity-50 ${
                        isOpen ? 'bg-secondary' : 'bg-outline/40'
                      }`}
                      aria-pressed={isOpen}
                      aria-label={`${isOpen ? 'Đóng' : 'Mở'} vị trí ${team.name.vi}`}
                    >
                      <span
                        className={`absolute top-1 w-6 h-6 rounded-full bg-surface-container-lowest shadow transition-all ${
                          isOpen ? 'left-7' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
