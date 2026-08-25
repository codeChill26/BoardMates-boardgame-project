'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import EventMapPicker from './EventMapPicker';

const TYPE_CONFIG = {
  CASUAL: { labelVi: 'Kèo giao lưu', labelEn: 'Casual Play', bg: 'bg-amber-500/15 text-amber-900 dark:text-amber-300 border-amber-500/40', icon: 'sports_esports' },
  TOURNAMENT: { labelVi: 'Giải đấu', labelEn: 'Tournament', bg: 'bg-purple-500/15 text-purple-900 dark:text-purple-300 border-purple-500/40', icon: 'emoji_events' },
  WORKSHOP: { labelVi: 'Workshop', labelEn: 'Workshop', bg: 'bg-blue-500/15 text-blue-900 dark:text-blue-300 border-blue-500/40', icon: 'school' },
  NIGHT: { labelVi: 'Game Night', labelEn: 'Game Night', bg: 'bg-rose-500/15 text-rose-900 dark:text-rose-300 border-rose-500/40', icon: 'nightlife' },
};

const SKILL_CONFIG = {
  ALL: { labelVi: 'Mọi trình độ', labelEn: 'All levels' },
  BEGINNER: { labelVi: 'Nhập môn / Người mới', labelEn: 'Beginner' },
  INTERMEDIATE: { labelVi: 'Có kinh nghiệm', labelEn: 'Intermediate' },
  EXPERT: { labelVi: 'Cao thủ / Chuyên sâu', labelEn: 'Expert' },
};

function formatEventDate(dateString, isEn = false) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;

  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');

  const daysOfWeekVi = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const daysOfWeekEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = isEn ? daysOfWeekEn[d.getDay()] : daysOfWeekVi[d.getDay()];

  return `${dayName}, ngày ${day}/${month}/${year} lúc ${hours}:${minutes}`;
}

export default function EventDetailsModal({
  event,
  isOpen,
  onClose,
  currentUserId,
  language = 'vi',
  onJoin,
  onLeave,
  onCancelEvent,
}) {
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !event) return null;

  const isEn = language === 'en';
  const typeInfo = TYPE_CONFIG[event.eventType] || TYPE_CONFIG.CASUAL;
  const skillInfo = SKILL_CONFIG[event.skillLevel] || SKILL_CONFIG.ALL;

  const joinedCount = event.participants?.length || event.joinedCount || 0;
  const maxSlots = event.maxParticipants || 4;
  const spotsLeft = Math.max(0, maxSlots - joinedCount);
  const isFull = event.status === 'FULL' || spotsLeft === 0;

  const isUserJoined = currentUserId
    ? (event.participants?.some((p) => p.userId === currentUserId || p.user?.id === currentUserId) || event.isUserJoined)
    : false;

  const isHost = currentUserId
    ? (event.hostId === currentUserId || event.host?.id === currentUserId || event.isHost)
    : false;

  const defaultImage = 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=800&q=80';
  const imageUrl = event.imageUrl || event.game?.imageUrl || defaultImage;

  const feeText = event.entryFee && event.entryFee > 0
    ? `${Number(event.entryFee).toLocaleString('vi-VN')} VNĐ / người`
    : (isEn ? 'Free (Split drink orders)' : 'Miễn phí (Tự túc tiền nước/quán)');

  // Danh sách games
  const gamesList = Array.isArray(event.games) && event.games.length > 0
    ? event.games
    : [
        {
          name: event.customGameName || event.game?.name || 'Board Game',
          imageUrl: imageUrl,
          bggId: event.game?.bggId || null,
          playTime: event.game?.playTime || null,
          weight: event.game?.weight || null,
        },
      ];

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleGoogleCalendar = () => {
    const title = encodeURIComponent(`[BoardMates] ${event.title}`);
    const details = encodeURIComponent(`${event.description || ''}\n\nGame: ${gamesList.map((g) => g.name).join(', ')}\nĐịa điểm: ${event.location} - ${event.address || ''}`);
    const location = encodeURIComponent(`${event.location}, ${event.address || ''}, ${event.city || ''}`);

    const startDate = new Date(event.startDate);
    const endDate = event.endDate ? new Date(event.endDate) : new Date(startDate.getTime() + 3 * 60 * 60 * 1000);

    const formatGoogleTime = (d) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const dates = `${formatGoogleTime(startDate)}/${formatGoogleTime(endDate)}`;

    const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${dates}`;
    window.open(calUrl, '_blank');
  };

  const handleAction = async (actionFn, ...args) => {
    try {
      setIsProcessing(true);
      await actionFn(...args);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="window-border window-shadow bg-surface-bright w-full max-w-3xl rounded-sm overflow-hidden flex flex-col my-auto max-h-[92vh]"
      >
        {/* Title Bar Retro */}
        <div className="retro-title-bar bg-surface-container-high px-4 py-2.5 flex items-center justify-between font-mono text-xs select-none shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[17px]">
              visibility
            </span>
            <span className="font-bold tracking-wider text-on-surface uppercase truncate">
              {isEn ? 'event_details.exe' : 'chi_tiet_keo.exe'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center border border-on-surface hover:bg-rose-500 hover:text-white font-bold transition-colors cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 font-sans">
          {/* Banner & Badges */}
          <div className="relative h-48 sm:h-60 w-full rounded-sm overflow-hidden border-2 border-on-surface/20 shrink-0">
            <img
              src={imageUrl}
              alt={event.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = defaultImage;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />

            {/* Top Badges */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
              <span className={`px-2.5 py-1 rounded text-xs font-bold border ${typeInfo.bg} backdrop-blur-md flex items-center gap-1.5`}>
                <span className="material-symbols-outlined text-[15px]">{typeInfo.icon}</span>
                <span>{isEn ? typeInfo.labelEn : typeInfo.labelVi}</span>
              </span>

              <span className={`px-2.5 py-1 rounded text-xs font-bold border backdrop-blur-md ${
                isFull
                  ? 'bg-rose-500/20 text-rose-200 border-rose-400/40'
                  : 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40'
              }`}>
                {isFull ? (isEn ? 'Full (0 spots left)' : 'Đã đủ người') : (isEn ? `${spotsLeft} / ${maxSlots} spots available` : `Còn ${spotsLeft} / ${maxSlots} slot trống`)}
              </span>
            </div>

            {/* Bottom Title in Banner */}
            <div className="absolute bottom-3 left-4 right-4 text-white">
              <div className="text-xs font-bold text-tertiary uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px]">casino</span>
                <span>{gamesList.map((g) => g.name).join(' • ')}</span>
              </div>
              <h2 className="font-headline font-bold text-xl sm:text-2xl text-white drop-shadow-md leading-tight">
                {event.title}
              </h2>
            </div>
          </div>

          {/* Multiple Board Games Showcase Section */}
          <div className="p-4 rounded-sm bg-surface-container border border-outline/20 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-on-surface uppercase tracking-wide flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">casino</span>
                <span>{isEn ? `Board Games to Play (${gamesList.length})` : `Board Games Sẽ Chơi Trong Kèo (${gamesList.length} game)`}</span>
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {gamesList.map((game, gIdx) => {
                const bggSearchUrl = game.bggId
                  ? `https://boardgamegeek.com/boardgame/${game.bggId}`
                  : `https://boardgamegeek.com/geeksearch.php?action=search&objecttype=boardgame&q=${encodeURIComponent(game.name)}`;

                return (
                  <div
                    key={gIdx}
                    className="p-2.5 rounded-sm bg-surface-bright border border-outline/30 flex items-center justify-between gap-3 hover:border-primary transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={game.imageUrl || game.image || defaultImage}
                        alt={game.name}
                        className="w-10 h-10 rounded-xs object-cover border border-outline/20 shrink-0"
                        onError={(e) => { e.target.src = defaultImage; }}
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-on-surface truncate">
                          {game.name}
                        </div>
                        <div className="text-[10px] text-on-surface-variant flex items-center gap-2 mt-0.5">
                          {game.playTime && <span>⏱️ {game.playTime}m</span>}
                          {game.weight && <span>⚖️ Độ khó: {game.weight}/5</span>}
                        </div>
                      </div>
                    </div>

                    <a
                      href={bggSearchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 text-[10px] font-bold rounded-xs bg-surface-container hover:bg-primary hover:text-white border border-outline/20 text-primary transition-colors shrink-0 flex items-center gap-0.5"
                    >
                      <span>{isEn ? 'Game Info' : 'Xem Game'}</span>
                      <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                    </a>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Time */}
            <div className="p-3.5 rounded-sm bg-surface-container border border-outline/20 flex items-start gap-3">
              <span className="material-symbols-outlined text-primary text-2xl mt-0.5 shrink-0">
                event
              </span>
              <div>
                <div className="text-[11px] font-bold text-outline uppercase tracking-wider">
                  {isEn ? 'Date & Time' : 'Thời gian diễn ra'}
                </div>
                <div className="text-sm font-bold text-on-surface mt-0.5">
                  {formatEventDate(event.startDate, isEn)}
                </div>
                <button
                  type="button"
                  onClick={handleGoogleCalendar}
                  className="mt-1.5 text-xs text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">calendar_add_on</span>
                  {isEn ? '+ Add to Google Calendar' : '+ Thêm vào Google Calendar'}
                </button>
              </div>
            </div>

            {/* Fee */}
            <div className="p-3.5 rounded-sm bg-surface-container border border-outline/20 flex items-start gap-3">
              <span className="material-symbols-outlined text-primary text-2xl mt-0.5 shrink-0">
                payments
              </span>
              <div>
                <div className="text-[11px] font-bold text-outline uppercase tracking-wider">
                  {isEn ? 'Participation Fee' : 'Chi phí tham gia'}
                </div>
                <div className="text-sm font-bold text-on-surface mt-0.5">
                  {feeText}
                </div>
              </div>
            </div>
          </div>

          {/* Google Maps Interactive Frame */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-on-surface uppercase tracking-wide flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary">location_on</span>
              <span>{isEn ? 'Venue Location & Map' : 'Địa Điểm & Bản Đồ Google Maps'}</span>
            </h4>
            <EventMapPicker
              location={event.location}
              address={event.address}
              city={event.city}
              lat={event.lat}
              lng={event.lng}
              isReadOnly={true}
              language={language}
            />
          </div>

          {/* Description & Rules */}
          {event.description && (
            <div className="p-4 rounded-sm bg-surface-container-low border border-outline/20 space-y-2">
              <div className="text-xs font-bold text-on-surface uppercase tracking-wide flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">
                  description
                </span>
                <span>{isEn ? 'Event Description & House Rules' : 'Mô tả & Ghi chú luật chơi'}</span>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-line font-sans">
                {event.description}
              </p>
            </div>
          )}

          {/* Host Info */}
          <div className="p-4 rounded-sm bg-surface-container border border-outline/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={event.host?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                alt={event.host?.username || 'Host'}
                className="w-11 h-11 rounded-full object-cover border-2 border-primary"
              />
              <div>
                <div className="text-xs font-bold text-primary uppercase tracking-wide flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">shield_person</span>
                  <span>{isEn ? 'Event Host' : 'Chủ Kèo (Host)'}</span>
                </div>
                <div className="text-sm font-bold text-on-surface">
                  {event.host?.username || 'Người chơi ẩn danh'}
                </div>
                {event.host?.email && (
                  <div className="text-xs text-on-surface-variant">
                    {event.host.email}
                  </div>
                )}
              </div>
            </div>

            {isHost && (
              <span className="px-2.5 py-1 rounded bg-primary/15 text-primary text-xs font-bold border border-primary/30">
                {isEn ? 'You are Host' : 'Bạn là Host'}
              </span>
            )}
          </div>

          {/* Participants List */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-bold text-on-surface uppercase tracking-wide flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">
                  group
                </span>
                <span>{isEn ? `Joined Players (${joinedCount}/${maxSlots})` : `Thành viên tham gia (${joinedCount}/${maxSlots})`}</span>
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {event.participants && event.participants.length > 0 ? (
                event.participants.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-sm bg-surface-container border border-outline/20 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={p.user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                        alt={p.user?.username || 'Player'}
                        className="w-8 h-8 rounded-full object-cover border border-outline/30 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-on-surface truncate">
                          {p.user?.username || `Người chơi #${idx + 1}`}
                        </div>
                        <div className="text-[10px] text-outline">
                          {p.role === 'HOST' ? (isEn ? '👑 Host' : '👑 Người tạo kèo') : (isEn ? '🎲 Player' : '🎲 Người chơi')}
                        </div>
                      </div>
                    </div>

                    {p.userId === currentUserId && (
                      <span className="text-[10px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded">
                        {isEn ? 'You' : 'Bạn'}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-2 py-4 text-center text-xs text-outline bg-surface-container rounded-sm border border-outline/20">
                  {isEn ? 'No other participants yet. Be the first to join!' : 'Chưa có thành viên nào khác tham gia. Hãy là người đầu tiên!'}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons Bar */}
          <div className="pt-4 border-t border-outline/20 flex flex-wrap items-center justify-between gap-3">
            {/* Share link button */}
            <button
              type="button"
              onClick={handleShare}
              className="px-3.5 py-2 text-xs font-bold border-2 border-on-surface rounded-sm bg-surface hover:bg-surface-container active:translate-y-0.5 transition-all text-on-surface flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">
                {copied ? 'check' : 'share'}
              </span>
              <span>{copied ? (isEn ? 'Copied Link!' : 'Đã copy link!') : (isEn ? 'Share Event' : 'Chia sẻ kèo')}</span>
            </button>

            <div className="flex items-center gap-2.5">
              {isHost ? (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleAction(onCancelEvent, event.id)}
                  className="px-4 py-2 text-xs font-bold rounded-sm border-2 border-rose-500 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer font-sans"
                >
                  <span className="material-symbols-outlined text-[16px]">cancel</span>
                  <span>{isEn ? 'Cancel Event' : 'Hủy Kèo Sự Kiện'}</span>
                </button>
              ) : isUserJoined ? (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleAction(onLeave, event.id)}
                  className="px-4 py-2 text-xs font-bold rounded-sm border-2 border-rose-500 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer font-sans"
                >
                  <span className="material-symbols-outlined text-[16px]">logout</span>
                  <span>{isEn ? 'Leave Match' : 'Rút Khỏi Kèo'}</span>
                </button>
              ) : isFull ? (
                <button
                  type="button"
                  disabled
                  className="px-5 py-2 text-xs font-bold rounded-sm border-2 border-outline/30 bg-surface-container-highest/50 text-outline cursor-not-allowed flex items-center gap-1.5 font-sans"
                >
                  <span className="material-symbols-outlined text-[16px]">lock</span>
                  <span>{isEn ? 'Match Full' : 'Kèo Đã Hết Chỗ'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => onJoin(event)}
                  className="px-6 py-2.5 text-xs font-bold border-2 border-on-surface bg-primary hover:bg-primary-dim text-on-primary shadow-xs active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer font-sans"
                >
                  {isProcessing ? (
                    <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                  ) : (
                    <span className="material-symbols-outlined text-[16px]">group_add</span>
                  )}
                  <span>{isEn ? 'Join This Match' : 'Tham Gia Kèo Này'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
