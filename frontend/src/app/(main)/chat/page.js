'use client';

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/hooks/useAuthStore';
import { getSocket } from '@/lib/socketClient';
import Loading from '@/components/Loading';

// Tach phan goi useSearchParams ra component rieng de boc trong Suspense.
// Docs: node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-search-params.md:179
// "During production builds, a static page that calls useSearchParams from a Client
//  Component must be wrapped in a Suspense boundary, otherwise the build fails."
// Khong boc thi `npm run build` chet o /chat -> ca project khong deploy duoc.
function ChatContent() {
  const searchParams = useSearchParams();
  const user = useAuthStore((state) => state.user);

  const initialToUserId = searchParams.get('toUserId');
  const initialListingId = searchParams.get('listingId');

  const [toUserId, setToUserId] = useState(initialToUserId || '');
  const [listingId, setListingId] = useState(initialListingId || '');
  const [attachedListing, setAttachedListing] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');

  const socket = useMemo(() => (user?.token ? getSocket(user.token) : null), [user?.token]);
  const bottomRef = useRef(null);

  const inContextMode = Boolean(initialListingId);

  useEffect(() => {
    setToUserId(initialToUserId || '');
    setListingId(initialListingId || '');
  }, [initialToUserId, initialListingId]);

  useEffect(() => {
    const run = async () => {
      if (!initialListingId) {
        setAttachedListing(null);
        return;
      }

      const id = Number(initialListingId);
      if (!Number.isFinite(id)) {
        setAttachedListing(null);
        return;
      }

      try {
        const response = await fetch(`http://localhost:8080/api/listings/${id}`);
        const result = await response.json().catch(() => null);
        if (!response.ok || !result?.success) return;

        const listing = result.data;
        setAttachedListing(listing);

        if (listing?.userId && !initialToUserId) {
          setToUserId(String(listing.userId));
        }
      } catch (_) {
        // ignore
      }
    };

    run();
  }, [initialListingId, initialToUserId]);

  useEffect(() => {
    if (!socket) return;

    const handleIncoming = (payload) => {
      const next = {
        id: payload?.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        fromUserId: payload?.fromUserId,
        toUserId: payload?.toUserId,
        listingId: payload?.listingId ?? null,
        message: payload?.message ?? '',
        createdAt: payload?.createdAt ?? new Date().toISOString(),
      };

      setMessages((prev) => {
        if (prev.some((m) => m.id === next.id)) return prev;
        return [...prev, next];
      });
    };

    socket.on('chat:message', handleIncoming);
    return () => {
      socket.off('chat:message', handleIncoming);
    };
  }, [socket]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toIdNumber = Number(toUserId);
  const listingIdNumber = listingId ? Number(listingId) : null;
  const filteredMessages = useMemo(() => {
    if (!Number.isFinite(toIdNumber)) return [];
    return messages.filter((m) => {
      const between =
        (m.fromUserId === user?.id && m.toUserId === toIdNumber) ||
        (m.fromUserId === toIdNumber && m.toUserId === user?.id);
      if (!between) return false;

      if (listingIdNumber == null || !Number.isFinite(listingIdNumber)) return true;
      return Number(m.listingId) === listingIdNumber;
    });
  }, [messages, toIdNumber, listingIdNumber, user?.id]);

  const conversationItems = useMemo(() => {
    const myId = user?.id;
    if (!Number.isFinite(Number(myId))) return [];

    const items = new Map();

    const ensureItem = (partnerId) => {
      if (!Number.isFinite(partnerId)) return;
      if (!items.has(partnerId)) {
        items.set(partnerId, {
          partnerId,
          lastMessage: null,
        });
      }
    };

    // Always include currently selected conversation if valid.
    if (Number.isFinite(toIdNumber)) ensureItem(toIdNumber);

    // Derive a simple chat list from in-memory messages.
    messages.forEach((m) => {
      const from = Number(m.fromUserId);
      const to = Number(m.toUserId);
      if (!Number.isFinite(from) || !Number.isFinite(to)) return;
      if (from !== myId && to !== myId) return;
      const partnerId = from === myId ? to : from;
      ensureItem(partnerId);

      const current = items.get(partnerId);
      const currentTime = current?.lastMessage?.createdAt ? new Date(current.lastMessage.createdAt).getTime() : -Infinity;
      const nextTime = m?.createdAt ? new Date(m.createdAt).getTime() : Date.now();
      if (!current?.lastMessage || nextTime >= currentTime) {
        items.set(partnerId, { ...current, lastMessage: m });
      }
    });

    return Array.from(items.values()).sort((a, b) => {
      const aTime = a?.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : -Infinity;
      const bTime = b?.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : -Infinity;
      return bTime - aTime;
    });
  }, [messages, toIdNumber, user?.id]);

  if (!user?.token) {
    return (
      <main className="pt-28 pb-20 max-w-3xl mx-auto px-6 md:px-8">
        <div className="rounded-2xl border border-outline/30 bg-surface-container-low p-6">
          <p className="font-body text-on-surface">Vui lòng đăng nhập để chat.</p>
        </div>
      </main>
    );
  }

  const handleSend = async (e) => {
    e.preventDefault();
    setError('');

    const toId = Number(toUserId);
    const lId = listingId ? Number(listingId) : null;

    if (!Number.isFinite(toId)) {
      setError('toUserId không hợp lệ');
      return;
    }

    const text = message.trim();
    if (!text) return;

    if (!socket) {
      setError('Socket chưa sẵn sàng');
      return;
    }

    socket.emit('chat:send', { toUserId: toId, listingId: Number.isFinite(lId) ? lId : null, message: text }, (ack) => {
      if (!ack?.success) {
        setError(ack?.message || 'Gửi tin nhắn thất bại');
      }
    });

    setMessage('');
  };

  return (
    <main className="pt-28 pb-20 mx-auto max-w-7xl px-6 md:px-8">
      <header className="mb-6">
        <h1 className="font-headline text-4xl md:text-5xl italic text-on-surface">Chat</h1>
        {inContextMode && attachedListing ? (
          <p className="mt-2 font-body text-sm text-on-surface-variant">
            Chat với{' '}
            <span className="font-semibold text-on-surface">
              {attachedListing?.user?.username || attachedListing?.user?.email || `User ${attachedListing?.userId}`}
            </span>{' '}
            • Về:
            <span className="font-semibold text-on-surface"> {attachedListing?.game?.name || 'Boardgame'}</span>
          </p>
        ) : (
          <p className="mt-2 font-body text-sm text-on-surface-variant">Chat 1-1 (chưa lưu lịch sử).</p>
        )}
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: chat list */}
        <aside className="lg:col-span-3 rounded-2xl border border-outline/30 bg-surface-container-low overflow-hidden">
          <div className="border-b border-outline-variant/20 px-5 py-4">
            <p className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Chats</p>
            <p className="mt-1 font-headline text-lg font-bold text-on-surface">Tin nhắn</p>
          </div>
          <div className="max-h-[70vh] overflow-auto">
            {conversationItems.length === 0 ? (
              <div className="p-5">
                <p className="font-body text-sm text-on-surface-variant">Chưa có cuộc trò chuyện.</p>
              </div>
            ) : (
              <div className="divide-y divide-outline-variant/10">
                {conversationItems.map((item) => {
                  const active = Number(item.partnerId) === toIdNumber;
                  const label =
                    inContextMode && attachedListing && Number(attachedListing?.userId) === Number(item.partnerId)
                      ? attachedListing?.user?.username || attachedListing?.user?.email || `User ${item.partnerId}`
                      : `User ${item.partnerId}`;

                  return (
                    <button
                      key={item.partnerId}
                      type="button"
                      onClick={() => setToUserId(String(item.partnerId))}
                      className={`w-full text-left px-5 py-4 transition-colors ${
                        active ? 'bg-surface-container-highest' : 'hover:bg-surface-container-high'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-body font-semibold text-on-surface truncate">{label}</p>
                        {active ? (
                          <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                        ) : null}
                      </div>
                      <p className="mt-1 font-body text-xs text-on-surface-variant truncate">
                        {item?.lastMessage?.message ? item.lastMessage.message : 'Chưa có tin nhắn'}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* Middle: conversation */}
        <section className="lg:col-span-6 rounded-2xl border border-outline/30 bg-surface-container-low overflow-hidden">
          <div className="border-b border-outline-variant/20 px-5 py-4">
            <p className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Conversation</p>
            <p className="mt-1 font-headline text-lg font-bold text-on-surface truncate">
              {inContextMode && attachedListing
                ? attachedListing?.user?.username || attachedListing?.user?.email || `User ${attachedListing?.userId}`
                : Number.isFinite(toIdNumber)
                  ? `User ${toIdNumber}`
                  : 'Chọn một cuộc trò chuyện'}
            </p>
          </div>

          {error ? (
            <div className="mx-5 mt-4 rounded-xl border border-error/30 bg-error-container/10 px-4 py-3 font-body text-sm text-error">
              {error}
            </div>
          ) : null}

          <div className="px-5 pt-4">
            <div className="h-95 overflow-auto rounded-2xl border border-outline-variant/20 bg-surface p-4">
              {filteredMessages.length === 0 ? (
                <p className="font-body text-sm text-on-surface-variant">Chưa có tin nhắn.</p>
              ) : (
                <div className="space-y-3">
                  {filteredMessages.map((m) => {
                    const mine = m.fromUserId === user?.id;
                    return (
                      <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-3 border ${
                            mine
                              ? 'bg-secondary-container text-on-secondary-container border-on-secondary-container/20'
                              : 'bg-surface-container-high text-on-surface border-outline-variant/20'
                          }`}
                        >
                          <p className="font-body text-sm whitespace-pre-wrap break-words">{m.message}</p>
                          <div
                            className={`mt-2 font-label text-[10px] uppercase tracking-widest ${
                              mine ? 'text-on-secondary-container/70' : 'text-on-surface-variant'
                            }`}
                          >
                            from {m.fromUserId} to {m.toUserId}
                            {m.listingId ? ` • listing ${m.listingId}` : ''}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            <form onSubmit={handleSend} className="mt-4 flex gap-3 pb-5">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 font-body outline-none focus:border-primary"
                placeholder="Nhập tin nhắn..."
              />
              <button
                type="submit"
                className="rounded-xl bg-tertiary px-5 py-3 font-label text-[10px] font-bold uppercase tracking-widest text-on-tertiary"
              >
                Gửi
              </button>
            </form>
          </div>
        </section>

        {/* Right: details */}
        <aside className="lg:col-span-3 rounded-2xl border border-outline/30 bg-surface-container-low overflow-hidden">
          <div className="border-b border-outline-variant/20 px-5 py-4">
            <p className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Details</p>
            <p className="mt-1 font-headline text-lg font-bold text-on-surface">Thông tin</p>
          </div>

          <div className="p-5 space-y-4">
            {!inContextMode ? (
              <div className="space-y-4">
                <label className="block">
                  <span className="block font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
                    To User ID
                  </span>
                  <input
                    value={toUserId}
                    onChange={(e) => setToUserId(e.target.value)}
                    className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 font-body outline-none focus:border-primary"
                    placeholder="Ví dụ: 2"
                  />
                </label>

                <label className="block">
                  <span className="block font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
                    Listing ID (optional)
                  </span>
                  <input
                    value={listingId}
                    onChange={(e) => setListingId(e.target.value)}
                    className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 font-body outline-none focus:border-primary"
                    placeholder="Ví dụ: 10"
                  />
                </label>
              </div>
            ) : attachedListing ? (
              <div className="overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface">
                <div className="flex gap-4 p-4">
                  <div className="h-16 w-16 overflow-hidden rounded-xl bg-surface-container-high shrink-0">
                    {attachedListing?.game?.imageUrl ? (
                      <img
                        src={attachedListing.game.imageUrl}
                        alt={attachedListing.game.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-outline">
                        <span className="material-symbols-outlined">image</span>
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Đính kèm</p>
                    <p className="mt-1 font-headline text-lg font-bold text-on-surface truncate">
                      {attachedListing?.game?.name || 'Boardgame'}
                    </p>
                    <p className="mt-1 font-body text-sm text-on-surface-variant truncate">
                      Người đăng:{' '}
                      {attachedListing?.user?.username || attachedListing?.user?.email || `User ${attachedListing?.userId}`}
                    </p>
                  </div>
                </div>

                <div className="border-t border-outline-variant/10 p-4">
                  <a
                    href={`/marketplace/${attachedListing.id}`}
                    className="block w-full text-center rounded-xl border border-outline-variant/30 px-4 py-3 font-label text-[10px] font-bold uppercase tracking-widest text-on-surface"
                  >
                    Xem tin
                  </a>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-outline-variant/20 bg-surface p-4">
                <p className="font-body text-sm text-on-surface-variant">Không tải được dữ liệu tin.</p>
              </div>
            )}

            <div className="rounded-2xl border border-outline-variant/20 bg-surface p-4">
              <p className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Bạn</p>
              <p className="mt-1 font-body font-semibold text-on-surface truncate">User {user?.id}</p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ChatContent />
    </Suspense>
  );
}
