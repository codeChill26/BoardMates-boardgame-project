'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function FloatingNavButtons() {
  const router = useRouter();
  const pathname = usePathname();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 200);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      {/* An o trang chu — day la diem dau cua site, khong co gi de "quay lai". */}
      {pathname !== '/' ? (
        <div className="fixed top-24 left-6 z-50">
          <button
            type="button"
            onClick={() => router.back()}
            className="h-11 w-11 rounded-2xl border border-outline-variant/30 bg-surface-container-high text-on-surface window-shadow hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
            title="Quay lại"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        </div>
      ) : null}

      {/* Xep tren huy hieu Youth+ (YouthBadge dang giu goc bottom-6 right-6).
          Nut nay chi hien khi da cuon >200px nen khong lam nhay layout. */}
      <div className="fixed bottom-26 right-6 z-50">
        {showScrollTop ? (
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="h-11 w-11 rounded-2xl border border-outline-variant/30 bg-surface-container-high text-on-surface window-shadow hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
            title="Cuộn lên đầu"
          >
            <span className="material-symbols-outlined">vertical_align_top</span>
          </button>
        ) : null}
      </div>
    </>
  );
}
