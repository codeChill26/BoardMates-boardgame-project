'use client';

import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useLanguageStore } from '@/hooks/useLanguageStore';
import { translations } from '@/data/translations';
import dynamic from 'next/dynamic';

// three.js chi chay duoc o trinh duyet va la mieng nang nhat trang nay, nen tai
// dong + tat SSR: khong nem WebGL vao bundle server, khong chan lan render dau.
const Dice3D = dynamic(() => import('@/components/common/Dice3D'), {
  ssr: false,
  loading: () => <div className="w-40 h-40 md:w-52 md:h-52" />,
});

// Chia bai cho cac luoi con ben trong tung muc.
const dealContainer = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const dealCard = {
  hidden: { opacity: 0, y: 20, rotate: -6, scale: 0.86 },
  show: {
    opacity: 1,
    y: 0,
    rotate: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 420, damping: 26 },
  },
};

function Deal({ children, reducedMotion, className }) {
  return (
    <motion.div
      className={className}
      variants={reducedMotion ? undefined : dealContainer}
      initial={reducedMotion ? false : 'hidden'}
      animate={reducedMotion ? undefined : 'show'}
    >
      {children}
    </motion.div>
  );
}

function DealItem({ children, reducedMotion, className }) {
  return (
    <motion.div variants={reducedMotion ? undefined : dealCard} className={className}>
      {children}
    </motion.div>
  );
}

// Moi "kind" mot cach trinh bay rieng.
function SectionBody({ section, reducedMotion }) {
  if (section.kind === 'prose') {
    return (
      <p className="font-body text-lg md:text-xl text-on-surface leading-relaxed max-w-2xl">
        {section.body}
      </p>
    );
  }

  if (section.kind === 'lines') {
    return (
      <div className="space-y-6">
        <Deal reducedMotion={reducedMotion} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {section.lines.map((line) => (
            <DealItem key={line} reducedMotion={reducedMotion} className="window-border bg-surface-container-low p-5">
              <p className="font-headline italic text-xl text-on-surface leading-tight">{line}</p>
            </DealItem>
          ))}
        </Deal>
        <p className="font-body text-base text-on-surface-variant max-w-2xl">{section.closing}</p>
      </div>
    );
  }

  if (section.kind === 'chain') {
    return (
      <div className="space-y-6">
        <p className="font-body text-base md:text-lg text-on-surface max-w-2xl">{section.body}</p>
        <Deal reducedMotion={reducedMotion} className="flex flex-wrap gap-2 items-center">
          {section.nodes.map((node, idx) => (
            <DealItem key={node} reducedMotion={reducedMotion} className="flex items-center gap-2">
              <span className="window-border bg-surface-container-lowest px-3 py-2 font-label text-[10px] font-bold uppercase tracking-widest text-on-surface">
                {node}
              </span>
              {idx < section.nodes.length - 1 ? (
                <span className="material-symbols-outlined text-on-surface-variant text-base">arrow_forward</span>
              ) : null}
            </DealItem>
          ))}
        </Deal>
      </div>
    );
  }

  if (section.kind === 'roadmap') {
    return (
      <Deal reducedMotion={reducedMotion} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {section.phases.map((p) => (
          <DealItem key={p.phase} reducedMotion={reducedMotion} className="window-border bg-surface-container-lowest p-5 space-y-3">
            <span className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              {p.phase}
            </span>
            <h3 className="font-headline text-xl font-bold text-on-surface">{p.name}</h3>
            <div className="space-y-2">
              <div className="w-full h-3 window-border bg-surface-container-high overflow-hidden">
                <motion.div
                  className="h-full bg-tertiary"
                  initial={reducedMotion ? false : { width: 0 }}
                  animate={{ width: `${p.percent}%` }}
                  transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
                />
              </div>
              <span className="font-label text-[10px] font-bold text-on-surface-variant">{p.percent}%</span>
            </div>
          </DealItem>
        ))}
      </Deal>
    );
  }

  if (section.kind === 'groups') {
    return (
      <Deal reducedMotion={reducedMotion} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {section.groups.map((g) => (
          <DealItem key={g.name} reducedMotion={reducedMotion} className="window-border bg-surface-container-lowest p-5 space-y-3">
            <h3 className="font-label text-[10px] font-bold uppercase tracking-widest text-primary">{g.name}</h3>
            <ul className="space-y-1.5">
              {g.items.map((it) => (
                <li key={it} className="font-body text-sm text-on-surface flex gap-2">
                  <span className="text-primary shrink-0">—</span>
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </DealItem>
        ))}
      </Deal>
    );
  }

  if (section.kind === 'metrics') {
    return (
      <Deal reducedMotion={reducedMotion} className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {section.metrics.map((m) => (
          <DealItem key={m.name} reducedMotion={reducedMotion} className="window-border bg-surface-container-lowest p-5 space-y-1">
            <div className="font-headline text-3xl md:text-4xl font-bold text-primary">{m.value}</div>
            <div className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">{m.name}</div>
          </DealItem>
        ))}
      </Deal>
    );
  }

  return null;
}

export default function AboutPage() {
  const { language } = useLanguageStore();
  const t = translations[language].about;
  const reducedMotion = useReducedMotion();
  const [face, setFace] = useState(1);

  const section = t.sections.find((s) => s.face === face) ?? t.sections[0];

  return (
    <div className="pt-28 md:pt-32 pb-20 px-6 md:px-8 max-w-7xl mx-auto w-full">
      <section className="window-border window-shadow bg-surface-container-lowest overflow-hidden">
        <div className="retro-title-bar bg-surface-container-high px-4 py-2 flex justify-between items-center">
          <span className="font-label text-[10px] md:text-xs font-bold uppercase tracking-widest text-on-surface truncate pr-2">
            about.exe
          </span>
          <div className="flex gap-2 shrink-0">
            <div className="w-2 h-2 md:w-3 md:h-3 rounded-full border border-on-surface"></div>
            <div className="w-2 h-2 md:w-3 md:h-3 rounded-full border border-on-surface bg-primary"></div>
          </div>
        </div>

        <div className="p-6 md:p-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Trai: noi dung mat dang mo */}
          <div className="lg:col-span-8 min-h-[26rem] space-y-6">
            <div className="space-y-2">
              <span className="font-label text-xs font-bold uppercase tracking-widest text-primary">
                {t.title}
              </span>
              <p className="font-body text-sm text-on-surface-variant">{t.intro}</p>
            </div>

            {/* key={face} -> doi mat la ca khoi remount, chay lai animation vao */}
            <motion.div
              key={face}
              initial={reducedMotion ? false : { opacity: 0, x: -28 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              className="space-y-6"
            >
              <h2 className="text-3xl md:text-5xl font-headline font-bold leading-[0.95] tracking-tighter text-on-surface">
                {section.label}
              </h2>
              <SectionBody section={section} reducedMotion={reducedMotion} />
            </motion.div>
          </div>

          {/* Phai: xuc xac 3D */}
          <div className="lg:col-span-4 flex flex-col items-center gap-5 lg:sticky lg:top-32">
            <button
              type="button"
              onClick={() => setFace((f) => (f % 6) + 1)}
              aria-label={`${t.diceHint} — ${section.label}`}
              className="cursor-pointer bg-transparent"
            >
              <Dice3D face={face} className="w-40 h-40 md:w-52 md:h-52" />
            </button>

            <div className="text-center space-y-1">
              <div className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                {t.diceHint}
              </div>
              <div className="font-label text-xs font-bold text-on-surface">
                {face} {t.of} {t.sections.length}
              </div>
            </div>

            {/* Cham danh dau da di toi dau */}
            <div className="flex gap-1.5" aria-hidden="true">
              {t.sections.map((s) => (
                <span
                  key={s.face}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    s.face === face ? 'bg-primary' : 'bg-outline/40'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
