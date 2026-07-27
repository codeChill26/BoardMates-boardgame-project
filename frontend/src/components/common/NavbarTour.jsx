'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { useLanguageStore } from '@/hooks/useLanguageStore';
import { translations } from '@/data/translations';

// Tour dan khach lan dau qua thanh navbar. Chi chay o trang chu, chi mot lan,
// nho lai bang localStorage. Them ?tour=1 vao URL de bat lai (de demo/test).
const STORAGE_KEY = 'boardmates-tour-seen';

// key  -> tra chuoi trong translations[lang].tour.steps
// target -> data-tour dat tren Navbar. null = the noi giua man hinh, khong xoi den.
const STEPS = [
  { key: 'welcome', target: null },
  { key: 'home', target: 'nav-home' },
  { key: 'community', target: 'nav-community' },
  { key: 'events', target: 'nav-events' },
  { key: 'joinUs', target: 'nav-join-us' },
  { key: 'about', target: 'nav-about' },
  { key: 'language', target: 'nav-language' },
];

const HOLE_PAD = 8; // khoang ho ra quanh muc duoc xoi sang
const CARD_MAX = 320;
const EDGE = 16; // le toi thieu tinh tu mep man hinh
const DIM = 'rgba(24, 45, 69, 0.72)'; // navy --color-on-surface, do trong

function rectOf(selector) {
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  // width/height = 0 nghia la dang bi an (vd: link desktop tren man hinh mobile).
  if (r.width === 0 || r.height === 0) return null;
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

// Man hinh hep: cac link desktop bi an, moi muc do nam trong hamburger — nen
// chieu den nut menu thay vi bo qua buoc. viaMenu = dang o truong hop nay, de
// the huong dan noi them cho khach biet muc do nam trong menu.
// Khong tim thay gi -> the noi giua man hinh.
function resolveRect(target) {
  if (!target) return null;

  const direct = rectOf(`[data-tour="${target}"]`);
  if (direct) return { ...direct, viaMenu: false };

  const menu = rectOf('[data-tour="nav-menu"]');
  return menu ? { ...menu, viaMenu: true } : null;
}

function NavbarTour() {
  const pathname = usePathname();
  const { language } = useLanguageStore();
  const reducedMotion = useReducedMotion();
  const t = translations[language].tour;

  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const cardRef = useRef(null);

  const step = STEPS[index];
  const isLast = index === STEPS.length - 1;

  // Mo tour: chi o trang chu, chi khi chua tung xem.
  useEffect(() => {
    if (pathname !== '/') return undefined;

    let seen = false;
    try {
      seen = window.localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      seen = false;
    }
    const forced = new URLSearchParams(window.location.search).get('tour') === '1';
    if (seen && !forced) return undefined;

    // Cho navbar dung xong (font, anh logo) roi moi do toa do, khong thi hop
    // huong dan sang len o sai cho rebound theo layout.
    const id = window.setTimeout(() => setActive(true), 800);
    return () => window.clearTimeout(id);
  }, [pathname]);

  const measure = useCallback(() => {
    setRect(resolveRect(step.target));
    setViewport({ w: window.innerWidth, h: window.innerHeight });
  }, [step.target]);

  useEffect(() => {
    if (!active) return undefined;

    // Do trong rAF chu khong goi thang: doi trinh duyet chot layout xong da, va
    // tranh setState dong bo ngay trong than effect (react-hooks/set-state-in-effect).
    const raf = window.requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    // capture = true: bat ca scroll cua cac vung con, khong chi cua window.
    window.addEventListener('scroll', measure, true);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [active, measure]);

  const finish = useCallback(() => {
    setActive(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* localStorage bi chan (private mode) -> tour hien lai lan sau, chap nhan duoc */
    }
  }, []);

  const goNext = useCallback(() => {
    if (index >= STEPS.length - 1) {
      finish();
      return;
    }
    setIndex(index + 1);
  }, [index, finish]);

  const goBack = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  useEffect(() => {
    if (!active) return undefined;

    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        finish();
      } else if (event.key === 'ArrowRight' || event.key === 'Enter') {
        event.preventDefault();
        goNext();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goBack();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, finish, goNext, goBack]);

  // Dua focus vao the huong dan mot lan khi mo, de dieu khien bang ban phim duoc ngay.
  useEffect(() => {
    if (!active) return;
    cardRef.current?.focus({ preventScroll: true });
  }, [active]);

  if (!active || viewport.w === 0) return null;

  const hole = rect
    ? {
        top: rect.top - HOLE_PAD,
        left: rect.left - HOLE_PAD,
        width: rect.width + HOLE_PAD * 2,
        height: rect.height + HOLE_PAD * 2,
      }
    : null;

  const cardW = Math.min(CARD_MAX, viewport.w - EDGE * 2);
  const anchorX = rect ? rect.left + rect.width / 2 : viewport.w / 2;
  // Ghim the vao giua muc dang xoi sang, nhung khong de tran ra ngoai mep man hinh.
  const cardLeft = Math.min(
    Math.max(EDGE, anchorX - cardW / 2),
    Math.max(EDGE, viewport.w - cardW - EDGE)
  );
  const cardTop = hole
    ? hole.top + hole.height + 14
    : Math.max(96, Math.round(viewport.h * 0.32));

  const spring = reducedMotion
    ? { duration: 0 }
    : { type: 'spring', stiffness: 380, damping: 32 };

  const copy = t.steps[step.key];

  const overlay = (
    <div
      className="fixed inset-0 z-100"
      role="dialog"
      aria-modal="true"
      aria-label={copy.title}
    >
      {/* Tam chan: nuot moi click xuong trang ben duoi trong luc dan tour.
          Nam duoi cung, trong suot — phan toi la do box-shadow cua o xoi sang. */}
      <div className="absolute inset-0" />

      {hole ? (
        <motion.div
          initial={false}
          animate={{ top: hole.top, left: hole.left, width: hole.width, height: hole.height }}
          transition={spring}
          aria-hidden="true"
          className="absolute rounded-md border-2 border-primary pointer-events-none"
          // Bong trai rong 9999px = phu kin phan con lai cua man hinh, chua o nay
          // lai sang: cach xoi mot "lo" ma khong can SVG mask.
          style={{ boxShadow: `0 0 0 9999px ${DIM}` }}
        />
      ) : (
        <div aria-hidden="true" className="absolute inset-0" style={{ backgroundColor: DIM }} />
      )}

      {hole ? (
        <motion.span
          initial={false}
          animate={{ top: cardTop - 10, left: anchorX - 10 }}
          transition={spring}
          aria-hidden="true"
          className="absolute w-0 h-0 border-x-10 border-x-transparent border-b-10 border-b-on-surface pointer-events-none"
        />
      ) : null}

      <motion.div
        ref={cardRef}
        tabIndex={-1}
        initial={false}
        animate={{ top: cardTop, left: cardLeft }}
        transition={spring}
        style={{ width: cardW }}
        className="absolute window-border window-shadow bg-surface-container-lowest focus:outline-none"
      >
        <div className="retro-title-bar bg-surface-container-high px-4 py-2 flex justify-between items-center gap-2">
          <span className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface truncate">
            {t.titleBar}
          </span>
          <span className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant shrink-0">
            {t.step} {index + 1}/{STEPS.length}
          </span>
        </div>

        <motion.div
          key={step.key}
          initial={reducedMotion ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reducedMotion ? { duration: 0 } : { duration: 0.18 }}
          className="p-5 space-y-2"
        >
          <h2 className="font-headline text-2xl font-bold leading-tight text-on-surface">
            {copy.title}
          </h2>
          <p className="font-body text-sm text-on-surface-variant">{copy.body}</p>

          {rect?.viaMenu ? (
            <p className="font-label text-[10px] font-bold uppercase tracking-widest text-primary pt-1">
              {t.inMenu}
            </p>
          ) : null}
        </motion.div>

        <div className="px-5 pb-4 flex gap-1.5" aria-hidden="true">
          {STEPS.map((s, i) => (
            <span
              key={s.key}
              className={`h-1 flex-1 rounded-full ${i <= index ? 'bg-primary' : 'bg-outline-variant'}`}
            />
          ))}
        </div>

        <div className="border-t-2 border-outline-variant px-5 py-3 flex items-center justify-between gap-3">
          {/* Buoc cuoi: bo nut "Bo qua" — no trung chuc nang voi nut chinh, va nhan
              nut chinh dai hon nen can cho de khong bi vo chu. */}
          {!isLast ? (
            <button
              type="button"
              onClick={finish}
              className="font-label text-[10px] font-bold uppercase tracking-widest whitespace-nowrap text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            >
              {t.skip}
            </button>
          ) : null}

          <div className="flex items-center gap-2 ml-auto">
            {index > 0 ? (
              <button
                type="button"
                onClick={goBack}
                className="border-2 border-outline-variant text-on-surface px-3 py-2 rounded-md font-label text-[10px] font-bold uppercase tracking-widest whitespace-nowrap hover:border-primary hover:text-primary transition-colors cursor-pointer"
              >
                {t.back}
              </button>
            ) : null}

            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center gap-1.5 bg-primary text-on-primary px-4 py-2 rounded-md font-label text-[10px] font-bold uppercase tracking-widest whitespace-nowrap hover:bg-primary-dim transition-colors cursor-pointer"
            >
              {isLast ? t.done : t.next}
              <span className="material-symbols-outlined text-sm">
                {isLast ? 'check' : 'arrow_forward'}
              </span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );

  // Portal ra body: navbar co z-50 va tao stacking context rieng, long trong do
  // thi lop phu khong the nam tren no.
  return createPortal(overlay, document.body);
}

export default NavbarTour;
