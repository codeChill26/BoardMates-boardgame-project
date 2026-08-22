'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import logoMark from '@/assets/logo-mark.png';

export default function OfflinePage() {
  const handleRetry = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 font-body">
      <div className="w-full max-w-lg window-border window-shadow bg-surface-container-lowest overflow-hidden">
        {/* Retro Title Bar */}
        <div className="retro-title-bar bg-tertiary px-4 py-2 flex justify-between items-center text-on-tertiary">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full border border-on-tertiary bg-error"></span>
            <span className="font-label text-xs font-bold uppercase tracking-widest">
              SYSTEM_OFFLINE.EXE [404_NO_SIGNAL]
            </span>
          </div>
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full border border-on-tertiary"></div>
            <div className="w-2.5 h-2.5 rounded-full border border-on-tertiary bg-on-tertiary"></div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 space-y-6 text-center">
          <div className="w-20 h-20 mx-auto window-border bg-surface-container-high p-3 flex items-center justify-center">
            <Image
              src={logoMark}
              alt="BoardMates Offline"
              width={64}
              height={64}
              className="w-full h-full object-contain grayscale opacity-80"
            />
          </div>

          <div className="space-y-2">
            <span className="inline-block font-label text-primary font-bold uppercase tracking-wider bg-primary/10 px-2.5 py-1 text-[11px]">
              NETWORK_DISCONNECTED
            </span>
            <h1 className="font-headline font-bold text-3xl md:text-4xl text-on-surface">
              Chế Độ Ngoại Tuyến
            </h1>
            <p className="text-sm md:text-base text-on-surface-variant max-w-md mx-auto leading-relaxed">
              Thiết bị của bạn đang mất kết nối mạng. Hãy bật Wifi hoặc 4G để tiếp tục khám phá thế giới Board Game cùng BoardMates.
            </p>
          </div>

          <div className="p-4 bg-surface-container-high window-border text-left space-y-1.5 text-xs text-on-surface-variant font-label">
            <div className="flex items-center gap-2 text-primary font-bold">
              <span className="material-symbols-outlined text-sm">info</span>
              <span>PWA OFFLINE CACHE</span>
            </div>
            <p>
              • Các trang và tài nguyên đã xem gần đây vẫn được lưu trong bộ nhớ máy.
            </p>
            <p>• Dữ liệu mới sẽ tự động đồng bộ khi có kết nối trở lại.</p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleRetry}
              className="bg-tertiary text-on-tertiary px-6 py-3 rounded-sm font-label font-bold text-xs uppercase tracking-widest window-shadow hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              Thử kết nối lại
            </button>
            <Link
              href="/"
              className="bg-surface-container-high text-on-surface px-6 py-3 rounded-sm font-label font-bold text-xs uppercase tracking-widest window-border hover:bg-surface-container-highest transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">home</span>
              Về Trang chủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
