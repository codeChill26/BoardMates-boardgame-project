'use client';

import React from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { useLanguageStore } from '@/hooks/useLanguageStore';
import { translations } from '@/data/translations';
import { teams, APPLY_URL } from '@/data/teams';
import { getBackendUrl } from '@/lib/apiConfig';

// Chia bai: moi cua so ban duoc "chia" ra lan luot nhu chia bai tu co bai —
// bay len, xoay tu -8deg ve 0, phong tu 0.86 len 1, spring nay nhe khi dap.
// Con (item) khong can khai bao initial/animate — framer tu lay ten trang thai
// "hidden"/"show" tu cha (container) truyen xuong.
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 26, rotate: -8, scale: 0.86 },
  show: {
    opacity: 1,
    y: 0,
    rotate: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 420, damping: 26 },
  },
};

// Bong cung cua .window-shadow la 4px muc navy. Hover thi day len, keo bong dai
// ra 8px VA doi bong sang mau quan cua ban do — luc nghi ca luoi deu mot mau muc
// cho gon, chi the dang tro toi moi hien mau cua no.
const hoverNang = (color) => ({ y: -4, x: -4, boxShadow: `8px 8px 0px 0px ${color}` });

function TeamWindow({ team, t, language, reducedMotion, isOpen, headcount }) {
  // Vi tri da dong: to xam, khong bam duoc (pointer-events-none chan moi click),
  // khong nhac len khi hover, hien nhan "Da dong".
  const closedCls = isOpen ? '' : 'grayscale opacity-55 pointer-events-none select-none';

  // The tren card chi hien icon + so cho gon, nen nhan day du day vao title/aria.
  // headcountUnit rong (ban EN) -> bo luon khoang trang thua.
  const headcountLabel = `${t.headcount}: ${headcount}${t.headcountUnit ? ` ${t.headcountUnit}` : ''}`;

  return (
    <motion.article
      // layout: trang thai mo/dong ve tu backend sau khi trang da ve xong, nen thu
      // tu the doi mot lan ngay sau do — cho framer truot chung sang cho moi thay
      // vi nhay cai rup.
      layout={!reducedMotion}
      variants={reducedMotion ? undefined : item}
      whileHover={reducedMotion || !isOpen ? undefined : hoverNang(team.color)}
      aria-disabled={!isOpen}
      // --team: mau quan cua ban, cac lop .token-* trong globals.css doc lai bien nay.
      style={{ '--team': team.color }}
      className={`window-border window-shadow bg-surface-container-lowest overflow-hidden flex flex-col h-full ${closedCls}`}
    >
      {isOpen ? (
        <Link
          href={`/join-us/${team.slug}`}
          className="w-full retro-title-bar token-bar token-bar-link px-4 py-2 flex items-center gap-2.5 cursor-pointer transition-colors"
        >
          <span className="token-dot w-2.5 h-2.5 rounded-full shrink-0" aria-hidden="true" />
          <span className="font-label text-[10px] md:text-xs font-bold uppercase tracking-widest text-on-surface truncate pr-2">
            {team.slug.replace(/-/g, '_')}.exe
          </span>
          <span className="material-symbols-outlined text-on-surface-variant text-sm ml-auto">open_in_new</span>
        </Link>
      ) : (
        <div className="w-full retro-title-bar token-bar px-4 py-2 flex items-center gap-2.5">
          <span className="token-dot w-2.5 h-2.5 rounded-full shrink-0" aria-hidden="true" />
          <span className="font-label text-[10px] md:text-xs font-bold uppercase tracking-widest text-on-surface truncate pr-2">
            {team.slug.replace(/-/g, '_')}.exe
          </span>
          <span className="font-label text-[9px] font-bold uppercase tracking-widest text-on-surface-variant ml-auto shrink-0">
            {language === 'vi' ? 'Đã đóng' : 'Closed'}
          </span>
        </div>
      )}

      {/* flex-1 flex-col + mt-auto o nut -> moi the cao bang nhau, nut luon o day.
          line-clamp gioi han so dong -> noi dung dong deu giua cac the. */}
      <div className="p-6 flex flex-col flex-1 gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="material-symbols-outlined token-ink text-2xl shrink-0">{team.icon}</span>
            <h3 className="font-headline text-2xl md:text-3xl font-bold text-on-surface">
              {team.name[language]}
            </h3>
          </div>

          {/* headcount = 0 hoac chua khai bao -> an han, khong hien "0 nguoi". */}
          {headcount ? (
            <span
              title={headcountLabel}
              aria-label={headcountLabel}
              className="shrink-0 mt-1 inline-flex items-center gap-1 border-2 border-outline-variant bg-surface-container px-2 py-1 rounded-md font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant"
            >
              <span className="material-symbols-outlined text-sm" aria-hidden="true">group</span>
              {headcount}
            </span>
          ) : null}
        </div>

        <div className="space-y-2">
          <h4 className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            {t.mission}
          </h4>
          <p className="font-body text-sm md:text-base text-on-surface line-clamp-2 min-h-[2.8em]">{team.mission[language]}</p>
        </div>

        <div className="pt-4 border-t-2 border-outline-variant space-y-2">
          <h4 className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            {t.responsibilities}
          </h4>
          <ul className="space-y-1">
            {team.responsibilities[language].slice(0, 2).map((item, idx) => (
              <li key={idx} className="font-body text-sm text-on-surface flex gap-2">
                <span className="token-ink shrink-0">-</span>
                <span className="line-clamp-1">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {isOpen ? (
          <Link
            href={`/join-us/${team.slug}`}
            className="mt-auto self-start inline-flex items-center gap-2 bg-tertiary text-on-tertiary px-4 py-2 rounded-md font-label font-bold uppercase tracking-widest text-[10px] hover:bg-tertiary-fixed-dim transition-colors"
          >
            {language === 'vi' ? 'Xem Job Description' : 'View Job Description'}
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        ) : (
          <span className="mt-auto self-start inline-flex items-center gap-2 bg-surface-container-high text-on-surface-variant px-4 py-2 rounded-md font-label font-bold uppercase tracking-widest text-[10px]">
            {language === 'vi' ? 'Đã đóng ứng tuyển' : 'Applications closed'}
          </span>
        )}
      </div>
    </motion.article>
  );
}

export default function JoinUsPage() {
  const { language } = useLanguageStore();
  const t = translations[language].joinUs;
  const reducedMotion = useReducedMotion();

  // Lay trang thai { slug: { isOpen, headcount } } tu backend.
  // Loi mang -> map rong -> coi nhu tat ca dang mo, so luong lay tu teams.js.
  const [positions, setPositions] = React.useState({});
  React.useEffect(() => {
    fetch(`${getBackendUrl()}/api/positions`)
      .then((r) => r.json())
      .then((j) => setPositions(j?.data || {}))
      .catch(() => {});
  }, []);

  // Vi tri con mo len tren, da dong dan xuong duoi. sort() cua JS on dinh, nen
  // trong tung nhom van giu nguyen thu tu goc khai bao o teams.js.
  const orderedTeams = React.useMemo(() => {
    return [...teams].sort((a, b) => {
      const aOpen = positions[a.slug]?.isOpen !== false;
      const bOpen = positions[b.slug]?.isOpen !== false;
      if (aOpen === bOpen) return 0;
      return aOpen ? -1 : 1;
    });
  }, [positions]);

  return (
    <div className="pt-28 md:pt-32 pb-20 px-6 md:px-8 max-w-7xl mx-auto w-full space-y-16">
      {/* Cua so bat mo: scale 0.94 -> 1.02 -> 1 bang spring, nhu mo mot phan mem */}
      <motion.section
        initial={reducedMotion ? false : { opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        className="window-border window-shadow bg-surface-container-lowest overflow-hidden"
      >
        <div className="retro-title-bar bg-surface-container-high px-4 py-2 flex justify-between items-center">
          <span className="font-label text-[10px] md:text-xs font-bold uppercase tracking-widest text-on-surface truncate pr-2">
            join_us.exe
          </span>
          <div className="flex gap-2 shrink-0">
            <div className="w-2 h-2 md:w-3 md:h-3 rounded-full border border-on-surface"></div>
            <div className="w-2 h-2 md:w-3 md:h-3 rounded-full border border-on-surface bg-primary"></div>
          </div>
        </div>
        <div className="p-6 md:p-12 space-y-6">
          <h1 className="text-4xl md:text-6xl font-headline font-bold leading-[0.9] tracking-tighter text-on-surface">
            {t.title}
          </h1>
          <p className="text-base md:text-lg text-on-surface-variant font-body max-w-2xl">
            {t.intro}
          </p>
        </div>
      </motion.section>

      <section className="space-y-8">
        <h2 className="text-3xl md:text-4xl font-headline font-bold text-on-surface">
          {t.openPositions}
        </h2>

        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 auto-rows-fr gap-8 items-stretch"
          variants={reducedMotion ? undefined : container}
          initial={reducedMotion ? false : 'hidden'}
          whileInView={reducedMotion ? undefined : 'show'}
          viewport={{ once: true, amount: 0.1 }}
        >
          {orderedTeams.map((team) => (
            <TeamWindow
              key={team.slug}
              team={team}
              t={t}
              language={language}
              reducedMotion={reducedMotion}
              isOpen={positions[team.slug]?.isOpen !== false}
              // Console ghi de duoc so luong; khong ghi de (null) thi lay so
              // mac dinh khai bao trong teams.js.
              headcount={positions[team.slug]?.headcount ?? team.headcount}
            />
          ))}
        </motion.div>
      </section>

      <section className="window-border window-shadow bg-secondary-container p-6 md:p-12 flex flex-col items-center text-center gap-4">
        <h2 className="text-3xl md:text-4xl font-headline font-bold text-on-secondary-container">
          {t.applyTitle}
        </h2>
        <p className="font-body text-base text-on-secondary-container max-w-xl">{t.applyDesc}</p>

        {APPLY_URL ? (
          <a
            href={APPLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            // Nut nay nam TREN panel vang mat (bg-secondary-container) — vang tren
            // vang thi chim, nen dao lai: khoi muc, chu giay.
            className="mt-2 inline-flex items-center gap-2 bg-on-surface text-surface px-8 py-4 rounded-md font-label font-bold uppercase tracking-widest window-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer"
          >
            {t.applyCta}
            <span className="material-symbols-outlined text-base">open_in_new</span>
          </a>
        ) : (
          <>
            <button
              type="button"
              disabled
              className="mt-2 bg-on-surface text-surface px-8 py-4 rounded-md font-label font-bold uppercase tracking-widest opacity-50 cursor-not-allowed"
            >
              {t.applyCta}
            </button>
            <p className="font-label text-[10px] uppercase tracking-widest text-on-secondary-container">
              {t.applyPending}
            </p>
          </>
        )}
      </section>
    </div>
  );
}
