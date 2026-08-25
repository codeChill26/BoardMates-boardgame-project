'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function QuickJoinModal({
  isOpen,
  onClose,
  event,
  user,
  language = 'vi',
  onConfirmJoin,
}) {
  const isEn = language === 'en';

  const [displayName, setDisplayName] = useState('');
  const [contact, setContact] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Nạp tên mặc định từ User hoặc LocalStorage
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      if (user?.username) {
        setDisplayName(user.username);
      } else if (typeof window !== 'undefined') {
        const savedName = localStorage.getItem('bm_guest_display_name') || '';
        const savedContact = localStorage.getItem('bm_guest_contact') || '';
        setDisplayName(savedName);
        setContact(savedContact);
      }
    }
  }, [isOpen, user]);

  if (!isOpen || !event) return null;

  const spotsLeft = Math.max(0, (event.maxParticipants || 4) - (event.participants?.length || event.joinedCount || 0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanName = displayName.trim();

    if (!cleanName) {
      setErrorMsg(isEn ? 'Please enter your display name / nickname' : 'Vui lòng nhập tên hiển thị của bạn');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      // Lưu lại vào LocalStorage để lần sau không cần gõ lại
      if (typeof window !== 'undefined') {
        localStorage.setItem('bm_guest_display_name', cleanName);
        if (contact.trim()) {
          localStorage.setItem('bm_guest_contact', contact.trim());
        }
      }

      await onConfirmJoin(event.id, {
        displayName: cleanName,
        contact: contact.trim() || null,
        notes: notes.trim() || null,
      });

      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || (isEn ? 'Failed to join match' : 'Không thể tham gia kèo'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="window-border window-shadow bg-surface-bright w-full max-w-lg rounded-sm overflow-hidden flex flex-col my-auto max-h-[92vh]"
      >
        {/* Retro Title Bar */}
        <div className="retro-title-bar bg-surface-container-high px-4 py-2.5 flex items-center justify-between font-mono text-xs select-none shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[17px]">
              group_add
            </span>
            <span className="font-bold tracking-wider text-on-surface uppercase truncate">
              {isEn ? 'join_match.exe' : 'tham_gia_keo.exe'}
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

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 font-sans overflow-y-auto">
          {/* Quick Event Summary */}
          <div className="p-3 rounded-sm bg-surface-container border border-outline/20 flex items-center gap-3">
            <img
              src={event.imageUrl || 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=400&q=80'}
              alt={event.title}
              className="w-12 h-12 rounded-sm object-cover border border-outline/30 shrink-0"
            />
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-primary uppercase truncate">
                🎲 {event.customGameName || event.game?.name || 'Board Game Match'}
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-on-surface truncate font-headline">
                {event.title}
              </h4>
              <div className="text-[11px] text-on-surface-variant flex items-center gap-1.5 mt-0.5">
                <span className="material-symbols-outlined text-[13px] text-primary">schedule</span>
                <span>{event.location}</span>
                <span>•</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-300">
                  {isEn ? `${spotsLeft} slots left` : `Còn ${spotsLeft} slot`}
                </span>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded bg-rose-500/10 border-2 border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Display Name Input */}
            <div>
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wide mb-1">
                {isEn ? 'Your Display Name / Nickname *' : 'Tên hiển thị của bạn (Nickname) *'}
              </label>
              <input
                type="text"
                required
                autoFocus
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={isEn ? 'e.g. Alex, BoardgameLover...' : 'Vd: Minh Đức, Trâm Anh, Nam Catan...'}
                className="w-full px-3 py-2 text-sm border-2 border-on-surface/40 focus:border-primary rounded-sm bg-surface text-on-surface outline-hidden"
              />
              <p className="text-[11px] text-on-surface-variant mt-1">
                {isEn
                  ? 'This name will appear in the player list for this session.'
                  : 'Tên này sẽ hiển thị trong danh sách người chơi tham gia kèo.'}
              </p>
            </div>

            {/* Contact (Optional) */}
            <div>
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wide mb-1">
                {isEn ? 'Phone / Zalo / Telegram (Optional)' : 'Số điện thoại / Zalo / Telegram (Tùy chọn)'}
              </label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder={isEn ? 'e.g. 0901234567 or @telegram' : 'Vd: 0912345678 hoặc nick Zalo/Telegram'}
                className="w-full px-3 py-2 text-sm border-2 border-on-surface/40 focus:border-primary rounded-sm bg-surface text-on-surface outline-hidden"
              />
              <p className="text-[11px] text-on-surface-variant mt-1">
                {isEn
                  ? 'To help the Host contact you or add you to the game chat.'
                  : 'Để Chủ kèo (Host) có thể liên hệ chốt bàn hoặc tạo nhóm trước giờ chơi.'}
              </p>
            </div>

            {/* Note / Message for Host */}
            <div>
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wide mb-1">
                {isEn ? 'Note for Host (Optional)' : 'Ghi chú cho Chủ kèo (Tùy chọn)'}
              </label>
              <textarea
                rows="2"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={isEn ? 'e.g. I am a beginner, can I bring a friend...' : 'Vd: Mình là người mới chơi, mình có mang theo bản mở rộng...'}
                className="w-full px-3 py-2 text-sm border-2 border-on-surface/40 focus:border-primary rounded-sm bg-surface text-on-surface outline-hidden"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-outline/20 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold border-2 border-on-surface rounded-sm bg-surface hover:bg-surface-container active:translate-y-0.5 text-on-surface transition-all cursor-pointer"
              >
                {isEn ? 'Cancel' : 'Hủy'}
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 text-xs font-bold border-2 border-on-surface rounded-sm bg-primary hover:bg-primary-dim text-on-primary shadow-xs active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer font-sans"
              >
                {isSubmitting ? (
                  <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                )}
                <span>{isSubmitting ? (isEn ? 'Joining...' : 'Đang xử lý...') : (isEn ? 'Confirm Join' : 'Xác Nhận Tham Gia')}</span>
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
