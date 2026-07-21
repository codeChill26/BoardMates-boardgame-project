'use client';

import React from 'react';
import { motion, useSpring, useReducedMotion } from 'framer-motion';

// Vong tron bam theo chuot co do tre, phinh to khi ro qua thu bam duoc.
// GIU nguyen mui ten he thong -> khong ai lac chuot. Chi hien tren thiet bi co
// chuot that (pointer: fine) va khi nguoi dung khong bat giam chuyen dong.
export default function CursorFollower() {
  const reducedMotion = useReducedMotion();
  const [enabled, setEnabled] = React.useState(false);
  const [hien, setHien] = React.useState(false);

  const x = useSpring(0, { stiffness: 500, damping: 30, mass: 0.4 });
  const y = useSpring(0, { stiffness: 500, damping: 30, mass: 0.4 });
  const scale = useSpring(1, { stiffness: 300, damping: 20 });

  React.useEffect(() => {
    if (reducedMotion) return;
    if (typeof window === 'undefined' || !window.matchMedia('(pointer: fine)').matches) return;

    setEnabled(true);

    const onMove = (e) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setHien(true);
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const bamDuoc = el?.closest('a, button, [role="button"], input, textarea, select');
      scale.set(bamDuoc ? 2.4 : 1);
    };
    const onLeave = () => setHien(false);

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, [reducedMotion, x, y, scale]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="fixed top-0 left-0 z-[100] pointer-events-none rounded-full border-2 border-primary"
      style={{
        x,
        y,
        scale,
        translateX: '-50%',
        translateY: '-50%',
        width: 22,
        height: 22,
        opacity: hien ? 0.7 : 0,
      }}
    />
  );
}
