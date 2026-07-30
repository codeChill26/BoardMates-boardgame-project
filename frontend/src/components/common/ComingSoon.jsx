'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguageStore } from '@/hooks/useLanguageStore';
import { translations } from '@/data/translations';

function ComingSoon({ section }) {
  const { language } = useLanguageStore();
  const t = translations[language].comingSoon;
  const content = t[section];

  return (
    <div className="pt-28 md:pt-32 pb-20 px-6 md:px-8 max-w-7xl mx-auto w-full">
      <section className="window-border window-shadow bg-surface-container-lowest overflow-hidden">
        <div className="retro-title-bar bg-surface-container-high px-4 py-2 flex justify-between items-center">
          <span className="font-label text-[10px] md:text-xs font-bold uppercase tracking-widest text-on-surface truncate pr-2">
            {section}.exe
          </span>
          <div className="flex gap-2 shrink-0">
            <div className="w-2 h-2 md:w-3 md:h-3 rounded-full border border-on-surface"></div>
            <div className="w-2 h-2 md:w-3 md:h-3 rounded-full border border-on-surface bg-primary"></div>
          </div>
        </div>

        <div className="p-6 md:p-16 flex flex-col items-center text-center gap-6">
          <span className="inline-block font-label text-on-tertiary font-bold uppercase tracking-widest bg-tertiary px-3 py-1 text-[10px]">
            {t.badge}
          </span>

          <h1 className="text-4xl md:text-6xl font-headline font-bold leading-[0.9] tracking-tighter text-on-surface">
            {content.title}
          </h1>

          <p className="text-base md:text-lg text-on-surface-variant font-body max-w-xl">
            {content.desc}
          </p>

          <div className="w-full max-w-md aspect-video window-border bg-surface-container-high flex flex-col items-center justify-center font-label font-bold text-on-surface-variant uppercase tracking-widest text-center p-4 mt-2">
            <span className="material-symbols-outlined text-5xl md:text-6xl mb-4">hourglass_empty</span>
            <span className="text-[10px] md:text-xs tracking-[0.2em]">{section.toUpperCase()}_MODULE.IMG</span>
          </div>

          <Link
            href="/join-us"
            className="mt-2 bg-tertiary text-on-tertiary px-8 py-4 rounded-md font-label font-bold uppercase tracking-widest window-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer"
          >
            {t.cta}
          </Link>
        </div>
      </section>
    </div>
  );
}

export default ComingSoon;
