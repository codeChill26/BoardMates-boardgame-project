'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { DiceFaces } from '@/components/common/RollingDice';

// LUU Y: component nay hien chua duoc dung o dau. De no thuc su hien ra, can tao
// loading.js cho mot route co fetch du lieu phia server — cac trang hien tai deu
// la client component nen React khong co gi de cho.
function Loading() {
  const reducedMotion = useReducedMotion();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      <div className="[--s:4rem] w-[var(--s)] h-[var(--s)]" style={{ perspective: '600px' }}>
        <motion.div
          className="relative w-full h-full"
          style={{ transformStyle: 'preserve-3d' }}
          // Lan khong ngung: moi vong dung o mot goc khac -> mat xuat hien doi so lien tuc
          animate={reducedMotion ? undefined : { rotateX: [0, 360, 450, 720], rotateY: [0, 180, 450, 720] }}
          transition={
            reducedMotion
              ? undefined
              : { duration: 2.4, repeat: Infinity, ease: 'easeInOut', times: [0, 0.35, 0.7, 1] }
          }
        >
          <DiceFaces />
        </motion.div>
      </div>

      <p className="font-label text-sm uppercase tracking-widest text-primary">
        Loading...
      </p>
    </div>
  );
}

export default Loading;
