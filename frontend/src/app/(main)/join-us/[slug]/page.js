'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useLanguageStore } from '@/hooks/useLanguageStore';
import { translations } from '@/data/translations';
import { teams } from '@/data/teams';

// TODO: điền email hoặc link form tuyển dụng, ví dụ:
//   'mailto:hello@boardmates.vn'  hoặc  'https://forms.gle/...'
const APPLY_URL = '';

function FieldList({ label, items }) {
  return (
    <div className="space-y-2">
      <h4 className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
        {label}
      </h4>
      <ul className="space-y-1">
        {items.map((item, idx) => (
          <li key={idx} className="font-body text-sm text-on-surface flex gap-2">
            <span className="text-primary shrink-0">—</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function JobDetailPage() {
  const { language } = useLanguageStore();
  const t = translations[language].joinUs;
  const params = useParams();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const team = teams.find((item) => item.slug === slug);

  if (!team) {
    return (
      <div className="pt-28 md:pt-32 pb-20 px-6 md:px-8 max-w-4xl mx-auto w-full space-y-8">
        <section className="window-border window-shadow bg-surface-container-lowest p-8 text-center space-y-4">
          <h1 className="text-3xl font-headline font-bold text-on-surface">
            {language === 'vi' ? 'Không tìm thấy vị trí' : 'Position not found'}
          </h1>
          <p className="font-body text-on-surface-variant">
            {language === 'vi'
              ? 'Vị trí bạn chọn không tồn tại hoặc đã được cập nhật.'
              : 'The position you requested does not exist or has been updated.'}
          </p>
          <Link
            href="/join-us"
            className="inline-flex items-center gap-2 bg-primary text-on-primary px-5 py-3 rounded-md font-label font-bold uppercase tracking-widest text-[10px] hover:bg-primary-dim transition-colors"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            {language === 'vi' ? 'Về trang Tham gia' : 'Back to Join Us'}
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="pt-28 md:pt-32 pb-20 px-6 md:px-8 max-w-5xl mx-auto w-full space-y-10">
      <Link
        href="/join-us"
        className="inline-flex items-center gap-2 font-label text-[10px] md:text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors"
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        {language === 'vi' ? 'Quay lại Vị trí đang mở' : 'Back to Open Positions'}
      </Link>

      <section className="window-border window-shadow bg-surface-container-lowest overflow-hidden">
        <div className="retro-title-bar bg-surface-container-high px-4 py-2 flex justify-between items-center">
          <span className="font-label text-[10px] md:text-xs font-bold uppercase tracking-widest text-on-surface truncate pr-2">
            {team.slug.replace(/-/g, '_')}.job
          </span>
          <span className="material-symbols-outlined text-on-surface-variant text-sm">description</span>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-3xl">{team.icon}</span>
              <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight text-on-surface">
                {team.name[language]}
              </h1>
            </div>

            <div className="space-y-2">
              <h3 className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                {t.mission}
              </h3>
              <p className="font-body text-base text-on-surface">{team.mission[language]}</p>
            </div>
          </div>

          <div className="border-t-2 border-outline-variant pt-6 space-y-6">
            <FieldList label={t.responsibilities} items={team.responsibilities[language]} />
            <FieldList label={t.requirements} items={team.requirements[language]} />
            <FieldList label={t.benefits} items={team.benefits[language]} />

            <div className="space-y-2">
              <h4 className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                {t.growthPath}
              </h4>
              <p className="font-body text-sm text-on-surface">{team.growthPath[language]}</p>
            </div>
          </div>

          <div className="border-t-2 border-outline-variant pt-6 flex flex-wrap gap-3">
            {APPLY_URL ? (
              <a
                href={APPLY_URL}
                className="inline-flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-md font-label font-bold uppercase tracking-widest text-[10px] hover:bg-primary-dim transition-colors"
              >
                {t.applyCta}
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-md font-label font-bold uppercase tracking-widest text-[10px] opacity-50 cursor-not-allowed"
              >
                {t.applyCta}
              </button>
            )}

            <Link
              href="/join-us"
              className="inline-flex items-center gap-2 border-2 border-outline-variant text-on-surface px-6 py-3 rounded-md font-label font-bold uppercase tracking-widest text-[10px] hover:border-primary hover:text-primary transition-colors"
            >
              {language === 'vi' ? 'Xem vị trí khác' : 'Explore More Positions'}
            </Link>
          </div>

          {!APPLY_URL ? (
            <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
              {t.applyPending}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
