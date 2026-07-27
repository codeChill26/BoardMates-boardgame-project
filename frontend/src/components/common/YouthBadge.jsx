'use client';

import React from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useLanguageStore } from '@/hooks/useLanguageStore';
import { translations } from '@/data/translations';
import { YOUTH_FANPAGE_URL } from '@/data/links';
import youthMark from '@/assets/youth-plus-mark.png';

// Huy hieu "truc thuoc Youth+" ghim cung o goc phai duoi, khong troi theo cuon.
// An o /about vi trang do da co han mot the youth_plus.exe day du roi.
function YouthBadge() {
  const pathname = usePathname();
  const { language } = useLanguageStore();
  const badge = translations[language].about.youth.badge;

  if (pathname === '/about') return null;

  return (
    <a
      href={YOUTH_FANPAGE_URL}
      target="_blank"
      rel="noopener noreferrer"
      title={`${badge}: Youth+`}
      aria-label={`${badge}: Youth+`}
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center p-2 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest window-shadow hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
    >
      <Image
        src={youthMark}
        alt="Youth+"
        className="h-10 md:h-12 w-auto object-contain"
      />
    </a>
  );
}

export default YouthBadge;
