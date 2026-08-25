'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

const TYPE_CONFIG = {
  CASUAL: {
    labelVi: 'Kèo giao lưu',
    labelEn: 'Casual Play',
    bg: 'bg-amber-500/15 text-amber-900 dark:text-amber-300 border-amber-500/40',
    icon: 'sports_esports',
  },
  TOURNAMENT: {
    labelVi: 'Giải đấu',
    labelEn: 'Tournament',
    bg: 'bg-purple-500/15 text-purple-900 dark:text-purple-300 border-purple-500/40',
    icon: 'emoji_events',
  },
  WORKSHOP: {
    labelVi: 'Workshop',
    labelEn: 'Workshop',
    bg: 'bg-blue-500/15 text-blue-900 dark:text-blue-300 border-blue-500/40',
    icon: 'school',
  },
  NIGHT: {
    labelVi: 'Game Night',
    labelEn: 'Game Night',
    bg: 'bg-rose-500/15 text-rose-900 dark:text-rose-300 border-rose-500/40',
    icon: 'nightlife',
  },
};

const SKILL_CONFIG = {
  ALL: { labelVi: 'Mọi trình độ', labelEn: 'All levels' },
  BEGINNER: { labelVi: 'Nhập môn', labelEn: 'Beginner' },
  INTERMEDIATE: { labelVi: 'Có kinh nghiệm', labelEn: 'Intermediate' },
  EXPERT: { labelVi: 'Cao thủ', labelEn: 'Expert' },
};

function formatEventDate(dateString, isEn = false) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;

  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');

  const daysOfWeekVi = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const daysOfWeekEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayName = isEn ? daysOfWeekEn[d.getDay()] : daysOfWeekVi[d.getDay()];

  return `${dayName}, ${day}/${month} • ${hours}:${minutes}`;
}

export default function EventCard({
  event,
  currentUserId,
  language = 'vi',
  onViewDetails,
  onJoin,
  onLeave,
}) {
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

  const feeText = event.entryFee && event.entryFee > 0
    ? `${Number(event.entryFee).toLocaleString('vi-VN')} đ`
    : (isEn ? 'Free / Split drinks' : 'Miễn phí / Tự túc');

  const defaultImage = 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=800&q=80';
  const imageUrl = event.imageUrl || event.game?.imageUrl || defaultImage;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="window-border window-shadow bg-surface-bright flex flex-col rounded-sm overflow-hidden group hover:border-primary transition-colors"
    >
      {/* Title Bar Retro */}
      <div className="retro-title-bar bg-surface-container-high px-3 py-1.5 flex items-center justify-between text-xs font-mono select-none">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="material-symbols-outlined text-[15px] text-primary shrink-0">
            {typeInfo.icon}
          </span>
          <span className="font-bold tracking-wider uppercase text-on-surface truncate">
            {isEn ? typeInfo.labelEn : typeInfo.labelVi}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] font-sans text-on-surface-variant">
            {event.city || 'TP.HCM'}
          </span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-tight border ${
            isFull
              ? 'bg-rose-500/10 text-rose-700 border-rose-500/30'
              : 'bg-emerald-500/10 text-emerald-800 border-emerald-500/30 font-semibold'
          }`}>
            {isFull ? (isEn ? 'Full' : 'Đã đủ') : (isEn ? `${spotsLeft} slots left` : `Còn ${spotsLeft} slot`)}
          </span>
        </div>
      </div>

      {/* Image Banner */}
      <div className="relative h-44 sm:h-48 w-full bg-surface-container overflow-hidden shrink-0">
        <img
          src={imageUrl}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            e.target.src = defaultImage;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

        {/* Badge Fee & Skill on image */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs text-white">
          <span className="bg-primary/90 backdrop-blur-md text-white font-bold px-2 py-0.5 rounded text-[11px] window-border border-white/20">
            {feeText}
          </span>
          <span className="bg-black/60 backdrop-blur-md text-gray-200 px-2 py-0.5 rounded text-[11px] border border-white/20 flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">grade</span>
            {isEn ? skillInfo.labelEn : skillInfo.labelVi}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3.5">
        <div>
          {/* Game name / tag */}
          <div className="text-xs font-bold text-primary tracking-wide uppercase mb-1 flex items-center gap-1.5 flex-wrap">
            <span className="material-symbols-outlined text-[14px]">casino</span>
            {Array.isArray(event.games) && event.games.length > 1 ? (
              <span className="truncate flex items-center gap-1">
                <span>{event.games[0]?.name}</span>
                <span className="text-[10px] text-on-surface font-semibold bg-tertiary/30 border border-tertiary/50 px-1.5 py-0.2 rounded-xs">
                  +{event.games.length - 1} {isEn ? 'more' : 'game khác'}
                </span>
              </span>
            ) : (
              <span className="truncate">{event.customGameName || event.game?.name || 'Board Game Event'}</span>
            )}
          </div>

          {/* Event Title */}
          <h3
            onClick={() => onViewDetails(event)}
            className="font-headline font-bold text-lg sm:text-xl text-on-surface line-clamp-2 hover:text-primary cursor-pointer transition-colors leading-tight"
          >
            {event.title}
          </h3>

          {/* Time & Venue */}
          <div className="mt-2.5 space-y-1.5 text-xs text-on-surface-variant font-sans">
            <div className="flex items-center gap-1.5 text-on-surface font-semibold">
              <span className="material-symbols-outlined text-[16px] text-primary shrink-0">
                schedule
              </span>
              <span>{formatEventDate(event.startDate, isEn)}</span>
            </div>

            <div className="flex items-start gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-outline shrink-0 mt-0.5">
                location_on
              </span>
              <span className="line-clamp-1">
                <strong className="text-on-surface">{event.location}</strong>
                {event.address ? ` — ${event.address}` : ''}
              </span>
            </div>

            {event.distanceKm != null && (
              <div className="flex items-center gap-1 text-[11px] font-bold text-amber-900 dark:text-amber-200 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30 w-fit mt-1">
                <span className="material-symbols-outlined text-[13px] text-primary">near_me</span>
                <span>{isEn ? `${event.distanceKm} km away` : `Cách bạn ${event.distanceKm} km`}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer: Host, Participants & Actions */}
        <div className="pt-3 border-t border-outline/15 flex flex-col gap-3">
          {/* Host & Participant Avatar Stack */}
          <div className="flex items-center justify-between">
            {/* Host */}
            <div className="flex items-center gap-1.5 min-w-0">
              <img
                src={event.host?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                alt={event.host?.username || 'Host'}
                className="w-6 h-6 rounded-full object-cover border border-outline/30 shrink-0"
              />
              <span className="text-xs text-on-surface-variant truncate font-sans">
                <span className="text-[10px] text-outline uppercase block">{isEn ? 'Host' : 'Chủ kèo'}</span>
                <span className="font-semibold text-on-surface">{event.host?.username || 'Người chơi'}</span>
              </span>
            </div>

            {/* Participants Slots Bar / Avatars */}
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-1.5 overflow-hidden">
                {event.participants?.slice(0, 3).map((p, idx) => (
                  <img
                    key={idx}
                    src={p.user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                    alt={p.user?.username || 'Player'}
                    title={p.user?.username}
                    className="inline-block h-6 w-6 rounded-full ring-2 ring-surface object-cover"
                  />
                ))}
              </div>
              <span className="text-xs font-mono font-bold text-on-surface bg-surface-container px-2 py-0.5 rounded border border-outline/20">
                {joinedCount}/{maxSlots}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onViewDetails(event)}
              className="px-3 py-2 text-xs font-bold border-2 border-on-surface rounded-sm bg-surface-container hover:bg-surface-container-high active:translate-y-0.5 transition-all text-on-surface flex items-center justify-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">info</span>
              {isEn ? 'Details' : 'Chi tiết'}
            </button>

            {isHost ? (
              <button
                type="button"
                onClick={() => onViewDetails(event)}
                className="px-3 py-2 text-xs font-bold rounded-sm bg-surface-container-highest border-2 border-on-surface text-primary flex items-center justify-center gap-1 cursor-pointer font-sans"
              >
                <span className="material-symbols-outlined text-[15px]">settings</span>
                {isEn ? 'Manage' : 'Quản lý'}
              </button>
            ) : isUserJoined ? (
              <button
                type="button"
                onClick={() => onLeave(event.id)}
                className="px-3 py-2 text-xs font-bold rounded-sm bg-rose-500/10 border-2 border-rose-500/50 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 flex items-center justify-center gap-1 cursor-pointer transition-colors font-sans"
              >
                <span className="material-symbols-outlined text-[15px]">check_circle</span>
                {isEn ? 'Joined (Leave)' : 'Đã vào (Hủy)'}
              </button>
            ) : isFull ? (
              <button
                type="button"
                disabled
                className="px-3 py-2 text-xs font-bold rounded-sm bg-surface-container-highest/60 border-2 border-outline/30 text-outline cursor-not-allowed flex items-center justify-center gap-1 font-sans"
              >
                <span className="material-symbols-outlined text-[15px]">lock</span>
                {isEn ? 'Full' : 'Đủ người'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onJoin(event)}
                className="px-3 py-2 text-xs font-bold rounded-sm bg-primary hover:bg-primary-dim text-on-primary border-2 border-on-surface shadow-xs active:translate-y-0.5 transition-all flex items-center justify-center gap-1 cursor-pointer font-sans"
              >
                <span className="material-symbols-outlined text-[15px]">group_add</span>
                {isEn ? 'Join' : 'Tham gia'}
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
