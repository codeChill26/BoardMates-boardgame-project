'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';

/**
 * Man mo dau trang chu kieu "nap hop / man san khau": mot tam nap che KIN ca man
 * hinh (KE CA navbar), tren nap ghi "Chao mung". Cuon xuong -> nap mo len quanh
 * ban le tren, chu chao mung mo di, lo ra san khau roi vao trang Home.
 *
 * Lop phu duoc PORTAL ra document.body -> thoat stacking context cua template
 * (template co transform, se nhot moi z-index ben trong duoi navbar z-50).
 * Nho vay fixed z-[100] moi che duoc navbar.
 *
 * section cao 220vh chi lam DUONG RAY cuon (khong hien gi); scrollYProgress cua
 * no dieu khien lop phu portal.
 */
export default function HomeIntro() {
  const ref = React.useRef(null);
  const [mounted, setMounted] = React.useState(false);
  const reducedMotion = useReducedMotion();

  React.useEffect(() => setMounted(true), []);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });

  const lidRotate = useTransform(scrollYProgress, [0, 0.72], [0, -108]);
  const lidOpacity = useTransform(scrollYProgress, [0.6, 0.9], [1, 0]);
  const welcomeOpacity = useTransform(scrollYProgress, [0, 0.28], [1, 0]);
  const stageOpacity = useTransform(scrollYProgress, [0.25, 0.7, 0.95], [0, 1, 0]);
  const stageScale = useTransform(scrollYProgress, [0.25, 0.9], [0.92, 1]);
  const hintOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);
  // Ca lop phu mo di han khi da mo xong -> lo trang Home that ben duoi
  const overlayOpacity = useTransform(scrollYProgress, [0.9, 1], [1, 0]);

  const R = { transformOrigin: 'top center' };

  const overlay = (
    <motion.div
      aria-hidden="true"
      className="fixed inset-0 z-[100] pointer-events-none overflow-hidden"
      style={reducedMotion ? { perspective: '1600px' } : { perspective: '1600px', opacity: overlayOpacity }}
    >
      {/* SAN KHAU he lo khi nap mo */}
      <motion.div
        style={reducedMotion ? undefined : { opacity: stageOpacity, scale: stageScale }}
        className="absolute inset-0 bg-surface flex flex-col items-center justify-center gap-4"
      >
        <span className="material-symbols-outlined text-5xl text-primary/70">casino</span>
        <p className="font-headline italic text-2xl md:text-3xl text-on-surface-variant">
          Mời bạn vào cuộc chơi
        </p>
      </motion.div>

      {/* NAP che kin, mo quanh ban le tren */}
      <motion.div
        style={reducedMotion ? R : { rotateX: lidRotate, opacity: lidOpacity, ...R }}
        className="absolute inset-0 bg-inverse-surface flex items-center justify-center will-change-transform"
      >
        <div className="absolute inset-5 md:inset-10 border-[3px] border-tertiary/40 rounded-xl" />
        <div className="absolute inset-8 md:inset-14 border border-inverse-on-surface/10 rounded-lg" />

        <motion.div
          style={reducedMotion ? undefined : { opacity: welcomeOpacity }}
          className="flex flex-col items-center gap-4 md:gap-6 text-center px-6"
        >
          <span className="font-label text-[10px] md:text-xs font-bold uppercase tracking-[0.35em] text-tertiary">
            welcome.exe
          </span>
          <h2 className="font-headline text-4xl md:text-7xl font-bold tracking-tighter leading-[0.9] text-inverse-on-surface">
            Chào mừng đến với
          </h2>
          <div className="font-headline text-5xl md:text-8xl font-bold tracking-tighter leading-none">
            <span className="text-inverse-on-surface">Board</span>
            <span className="text-tertiary">Mates</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Goi y cuon */}
      <motion.div
        style={reducedMotion ? undefined : { opacity: hintOpacity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5 text-tertiary"
      >
        <span className="font-label text-[10px] uppercase tracking-widest">Cuộn để mở hộp</span>
        <motion.span
          className="material-symbols-outlined"
          animate={reducedMotion ? undefined : { y: [0, 6, 0] }}
          transition={reducedMotion ? undefined : { duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          keyboard_arrow_down
        </motion.span>
      </motion.div>
    </motion.div>
  );

  return (
    <section ref={ref} className="relative h-[220vh]" aria-hidden="true">
      {mounted ? createPortal(overlay, document.body) : null}
    </section>
  );
}
