'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/hooks/useAuthStore';

function formatPrice(listing) {
  if (!listing) return '';
  if (listing.type === 'RENT') {
    return listing.rentPrice != null ? `${Number(listing.rentPrice).toLocaleString('vi-VN')}đ/ngày` : 'Liên hệ';
  }
  return listing.price != null ? `${Number(listing.price).toLocaleString('vi-VN')}đ` : 'Liên hệ';
}

export default function ListingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuthStore();

  const listingId = useMemo(() => Number(params?.id), [params?.id]);

  const [listing, setListing] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const run = async () => {
      if (!Number.isFinite(listingId)) {
        setError('Listing ID không hợp lệ');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError('');

        const response = await fetch(`http://localhost:8080/api/listings/${listingId}`);
        const result = await response.json().catch(() => null);
        if (!response.ok || !result?.success) {
          throw new Error(result?.message || 'Không thể tải chi tiết');
        }

        setListing(result.data);
      } catch (e) {
        console.error('Error fetching listing detail:', e);
        setError(e?.message || 'Không thể tải chi tiết');
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, [listingId]);

  const canChat = user && listing?.userId && user.id !== listing.userId;
  const canOrder = user && listing?.id && listing?.userId && user.id !== listing.userId;

  const handleChat = () => {
    if (!canChat) return;
    router.push(`/chat?toUserId=${listing.userId}&listingId=${listing.id}`);
  };

  const handleCreateOrder = async () => {
    if (!canOrder) return;

    try {
      const response = await fetch('http://localhost:8080/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          listingId: Number(listing.id),
          type: listing.type,
        }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Không thể tạo giao dịch');
      }

      alert('Đã tạo giao dịch (PENDING). Seller sẽ nhận thông báo realtime.');
    } catch (e) {
      console.error('Error creating order:', e);
      alert(e?.message || 'Lỗi khi tạo giao dịch');
    }
  };

  if (isLoading) {
    return (
      <main className="pt-28 pb-20 max-w-5xl mx-auto px-6 md:px-8">
        <div className="animate-pulse grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="aspect-4/5 rounded-3xl bg-surface-container-high" />
          <div className="space-y-4">
            <div className="h-10 w-3/4 rounded bg-surface-container-high" />
            <div className="h-6 w-1/2 rounded bg-surface-container-high" />
            <div className="h-24 w-full rounded bg-surface-container-high" />
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="pt-28 pb-20 max-w-3xl mx-auto px-6 md:px-8">
        <div className="rounded-2xl border border-error/30 bg-error-container/10 p-6">
          <p className="font-body text-error">{error}</p>
          <button
            type="button"
            onClick={() => router.back()}
            className="mt-4 rounded-xl border border-outline-variant/30 px-4 py-3 font-label text-xs font-bold uppercase tracking-widest text-on-surface"
          >
            Quay lại
          </button>
        </div>
      </main>
    );
  }

  const game = listing?.game;
  const seller = listing?.user;

  return (
    <main className="pt-28 pb-20 max-w-5xl mx-auto px-6 md:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section className="overflow-hidden rounded-3xl border border-outline-variant/20 bg-surface-container-low window-shadow">
          <div className="aspect-4/5 bg-surface-container-high">
            {game?.imageUrl ? (
              <img src={game.imageUrl} alt={game.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-outline-variant">
                <span className="material-symbols-outlined text-6xl">image</span>
              </div>
            )}
          </div>
        </section>

        <section className="space-y-6">
          <header>
            <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
              {listing?.type === 'SELL' ? 'Bán' : listing?.type === 'RENT' ? 'Cho thuê' : listing?.type}
            </p>
            <h1 className="mt-2 text-4xl md:text-5xl font-headline font-bold text-on-surface italic">
              {game?.name || 'Boardgame'}
            </h1>
            <p className="mt-3 font-body text-sm text-on-surface-variant">
              Người đăng: <span className="font-semibold text-on-surface">{seller?.username || seller?.email || '-'}</span>
            </p>
          </header>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-primary/10 px-3 py-1 font-label text-[10px] font-bold uppercase tracking-widest text-primary">
              {game?.minPlayers ?? '?'}-{game?.maxPlayers ?? '?'} người
            </span>
            <span className="rounded-full bg-surface-container-high px-3 py-1 font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant border border-outline-variant/20">
              {formatPrice(listing)}
            </span>
          </div>

          <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5">
            <p className="font-body text-sm text-on-surface whitespace-pre-wrap">
              {listing?.description || game?.description || 'Chưa có mô tả.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              disabled={!canOrder}
              onClick={handleCreateOrder}
              className="rounded-xl bg-tertiary px-5 py-3 font-label text-[10px] font-bold uppercase tracking-widest text-on-tertiary disabled:opacity-50"
            >
              {listing?.type === 'RENT' ? 'Thuê' : 'Mua'}
            </button>
            <button
              type="button"
              disabled={!canChat}
              onClick={handleChat}
              className="rounded-xl border border-outline-variant/30 px-5 py-3 font-label text-[10px] font-bold uppercase tracking-widest text-on-surface disabled:opacity-50"
            >
              Chat
            </button>
          </div>

          <button
            type="button"
            onClick={() => router.back()}
            className="w-full rounded-xl border border-outline-variant/30 px-5 py-3 font-label text-[10px] font-bold uppercase tracking-widest text-on-surface"
          >
            Quay lại marketplace
          </button>
        </section>
      </div>
    </main>
  );
}
