'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { usePWA } from '@/hooks/usePWA';
import { useLanguageStore } from '@/hooks/useLanguageStore';
import logoMark from '@/assets/logo-mark.png';

export default function PWAInstallPrompt() {
  const { isInstallable, isInstalled, isIOS, isDismissed, promptInstall, dismissPrompt } =
    usePWA();
  const { language } = useLanguageStore();
  const [showIOSModal, setShowIOSModal] = useState(false);

  // If already installed as standalone app or user dismissed prompt in this session
  if (isInstalled || isDismissed) {
    return null;
  }

  const isVi = language === 'vi';

  return (
    <AnimatePresence>
      {/* Android / Chromium / Desktop Install Banner */}
      {isInstallable && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 pointer-events-auto"
        >
          <div className="window-border window-shadow bg-surface-container-lowest overflow-hidden">
            {/* Retro Window Title Bar */}
            <div className="retro-title-bar bg-tertiary px-3 py-1.5 flex justify-between items-center text-on-tertiary">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full border border-on-tertiary bg-on-tertiary"></span>
                <span className="font-label text-[11px] font-bold uppercase tracking-wider">
                  INSTALL_BOARDMATES.EXE
                </span>
              </div>
              <button
                onClick={dismissPrompt}
                className="font-label text-xs font-bold px-1 hover:bg-black/10 transition-colors cursor-pointer"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Window Content */}
            <div className="p-4 flex items-start gap-4">
              <div className="w-12 h-12 shrink-0 window-border bg-surface-container-high p-1.5 flex items-center justify-center">
                <Image
                  src={logoMark}
                  alt="BoardMates Icon"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <h4 className="font-headline font-bold text-base text-on-surface leading-tight">
                  {isVi ? 'Cài đặt BoardMates App' : 'Install BoardMates App'}
                </h4>
                <p className="font-body text-xs text-on-surface-variant leading-snug">
                  {isVi
                    ? 'Mở nhanh tức thì, không viền trình duyệt và hoạt động cả khi ngoại tuyến.'
                    : 'Instant launch, standalone screen, and works smoothly offline.'}
                </p>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={promptInstall}
                    className="bg-tertiary text-on-tertiary px-4 py-1.5 rounded-sm font-label font-bold text-xs uppercase tracking-wider window-shadow hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">download</span>
                    {isVi ? 'Cài đặt' : 'Install'}
                  </button>
                  <button
                    onClick={dismissPrompt}
                    className="px-3 py-1.5 rounded-sm font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer"
                  >
                    {isVi ? 'Để sau' : 'Later'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* iOS Safari Add-to-Home-Screen Notification Button / Banner */}
      {isIOS && !isInstallable && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-50 pointer-events-auto"
          >
            <div className="window-border window-shadow bg-surface-container-lowest overflow-hidden">
              <div className="retro-title-bar bg-surface-container-high px-3 py-1 flex justify-between items-center">
                <span className="font-label text-[10px] font-bold uppercase tracking-wider text-on-surface">
                  PWA_SAFARI_SETUP.EXE
                </span>
                <button
                  onClick={dismissPrompt}
                  className="font-label text-xs font-bold hover:bg-black/10 px-1 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 flex items-center gap-3">
                <div className="w-10 h-10 shrink-0 window-border bg-surface-container-high p-1 flex items-center justify-center">
                  <Image
                    src={logoMark}
                    alt="BoardMates Icon"
                    width={32}
                    height={32}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-headline font-bold text-xs text-on-surface leading-tight">
                    {isVi ? 'Thêm BoardMates vào Màn hình chính' : 'Add BoardMates to Home Screen'}
                  </p>
                  <p className="font-body text-[11px] text-on-surface-variant">
                    {isVi ? 'Trải nghiệm như ứng dụng iOS native' : 'Enjoy full native iOS app feel'}
                  </p>
                </div>

                <button
                  onClick={() => setShowIOSModal(true)}
                  className="shrink-0 bg-primary text-on-primary px-3 py-1.5 rounded-sm font-label font-bold text-[11px] uppercase tracking-wider window-shadow hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
                >
                  {isVi ? 'Xem' : 'Guide'}
                </button>
              </div>
            </div>
          </motion.div>

          {/* iOS Safari Instruction Modal */}
          {showIOSModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                className="w-full max-w-md window-border window-shadow bg-surface-container-lowest overflow-hidden pb-6 md:pb-4"
              >
                {/* Modal Title Bar */}
                <div className="retro-title-bar bg-tertiary px-4 py-2 flex justify-between items-center text-on-tertiary">
                  <span className="font-label text-xs font-bold uppercase tracking-wider">
                    {isVi ? 'HƯỚNG DẪN CÀI ĐẶT TRÊN IPHONE / IPAD' : 'IOS INSTALLATION GUIDE'}
                  </span>
                  <button
                    onClick={() => setShowIOSModal(false)}
                    className="font-bold text-sm hover:bg-black/10 px-1.5 transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-6 space-y-4 font-body">
                  <div className="flex items-center gap-3 border-b-2 border-outline-variant pb-3">
                    <div className="w-12 h-12 window-border bg-surface p-1">
                      <Image
                        src={logoMark}
                        alt="BoardMates"
                        width={44}
                        height={44}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <h3 className="font-headline font-bold text-lg text-on-surface">BoardMates PWA</h3>
                      <p className="text-xs text-on-surface-variant">
                        {isVi ? 'Cài đặt trực tiếp từ Safari không cần App Store' : 'Direct install via Safari without App Store'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm text-on-surface">
                    {/* Step 1 */}
                    <div className="flex items-start gap-3 p-3 bg-surface-container-high window-border">
                      <span className="font-label font-bold text-primary text-base">01</span>
                      <div className="space-y-0.5">
                        <p className="font-bold text-xs uppercase font-label">
                          {isVi ? 'Bấm nút Chia sẻ' : 'Tap the Share button'}
                        </p>
                        <p className="text-xs text-on-surface-variant flex items-center gap-1.5 flex-wrap">
                          {isVi ? (
                            <>
                              Nhấn biểu tượng{' '}
                              <span className="inline-flex items-center justify-center w-6 h-6 bg-white window-border text-primary font-bold">
                                ⎋
                              </span>{' '}
                              ở thanh công cụ dưới cùng của Safari.
                            </>
                          ) : (
                            <>
                              Tap the{' '}
                              <span className="inline-flex items-center justify-center w-6 h-6 bg-white window-border text-primary font-bold">
                                ⎋
                              </span>{' '}
                              Share icon at the bottom of Safari toolbar.
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start gap-3 p-3 bg-surface-container-high window-border">
                      <span className="font-label font-bold text-primary text-base">02</span>
                      <div className="space-y-0.5">
                        <p className="font-bold text-xs uppercase font-label">
                          {isVi ? 'Thêm vào Màn hình chính' : 'Add to Home Screen'}
                        </p>
                        <p className="text-xs text-on-surface-variant flex items-center gap-1.5 flex-wrap">
                          {isVi ? (
                            <>
                              Cuộn xuống và chọn{' '}
                              <span className="font-bold text-on-surface">
                                "Thêm vào MH chính" (Add to Home Screen ⊞)
                              </span>
                              .
                            </>
                          ) : (
                            <>
                              Scroll down and select{' '}
                              <span className="font-bold text-on-surface">
                                "Add to Home Screen ⊞"
                              </span>
                              .
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setShowIOSModal(false);
                        dismissPrompt();
                      }}
                      className="w-full bg-tertiary text-on-tertiary py-2.5 rounded-sm font-label font-bold text-xs uppercase tracking-wider window-shadow hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
                    >
                      {isVi ? 'Đã hiểu' : 'Got it'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
