'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

// Bo cuc cham (pip) chuan, theo luoi 3x3. Toa do [cot, hang], 0..2.
const PIPS = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [2, 0], [0, 2], [2, 2]],
  5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]],
  6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]],
};

// Xuc xac that: hai mat doi nhau cong lai bang 7 (1-6, 2-5, 3-4).
// Dat: truoc=1, sau=6, phai=3, trai=4, tren=2, duoi=5.
const FACES = [
  { value: 1, transform: 'rotateY(0deg)' },
  { value: 6, transform: 'rotateY(180deg)' },
  { value: 3, transform: 'rotateY(90deg)' },
  { value: 4, transform: 'rotateY(-90deg)' },
  { value: 2, transform: 'rotateX(90deg)' },
  { value: 5, transform: 'rotateX(-90deg)' },
];

// Goc phai xoay ca khoi de dua mat N ra truoc mat nguoi xem (nghich dao cua FACES).
const FACE_ROT = {
  1: { x: 0, y: 0 },
  2: { x: -90, y: 0 },
  3: { x: 0, y: -90 },
  4: { x: 0, y: 90 },
  5: { x: 90, y: 0 },
  6: { x: 0, y: 180 },
};

function Pips({ value }) {
  return (
    <div className="grid grid-cols-3 grid-rows-3 gap-[8%] w-full h-full p-[15%]">
      {Array.from({ length: 9 }).map((_, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const co = PIPS[value]?.some(([c, r]) => c === col && r === row);

        return (
          <div key={i} className="flex items-center justify-center">
            {co ? (
              <span className="block w-full aspect-square rounded-full bg-on-tertiary shadow-inner" />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

const chuanHoa = (goc) => ((goc % 360) + 360) % 360;

/**
 * 6 mat cua khoi lap phuong, da dat dung vi tri trong khong gian 3D.
 * Tach rieng de Loading.jsx dung lai duoc cung khoi xuc xac.
 * Cha PHAI co transformStyle: 'preserve-3d' va bien CSS --s (canh khoi).
 */
export function DiceFaces() {
  return (
    <>
      {FACES.map((mat) => (
        <div
          key={mat.value}
          className="absolute inset-0 window-border bg-tertiary text-on-tertiary"
          style={{
            transform: `${mat.transform} translateZ(calc(var(--s) / 2))`,
            backfaceVisibility: 'hidden',
          }}
        >
          <Pips value={mat.value} />
        </div>
      ))}
    </>
  );
}

/**
 * Xuc xac 3D. Khoi lap phuong 6 mat dung bang CSS transform (preserve-3d), xoay
 * that trong khong gian 3 chieu roi dap dung mat can hien.
 *
 * Moi lan bam lan sang mat KE TIEP (1->2->...->6->1), khong ngau nhien: nguoi doc
 * phai di het duoc 6 muc noi dung.
 *
 * Goc xoay chi TANG dan, khong bao gio reset ve 0 — neu reset thi framer se animate
 * nguoc lai va xuc xac quay giat lui.
 */
export default function RollingDice({ value, onRollEnd, label }) {
  const reducedMotion = useReducedMotion();
  const [rot, setRot] = React.useState(() => FACE_ROT[value] ?? FACE_ROT[1]);
  const [dangLan, setDangLan] = React.useState(false);

  const lan = () => {
    if (dangLan) return;

    const next = (value % 6) + 1;
    const dich = FACE_ROT[next];

    if (reducedMotion) {
      setRot(dich);
      onRollEnd(next);
      return;
    }

    setDangLan(true);
    // Cong them 2 vong tron moi truc roi moi ve dung goc dich -> tumble that su.
    setRot((truoc) => ({
      x: truoc.x + 720 + chuanHoa(dich.x - truoc.x),
      y: truoc.y + 720 + chuanHoa(dich.y - truoc.y),
    }));
    onRollEnd(next);
  };

  return (
    <motion.button
      type="button"
      onClick={lan}
      aria-label={label}
      className="[--s:8rem] md:[--s:11rem] w-[var(--s)] h-[var(--s)] cursor-pointer select-none bg-transparent"
      style={{ perspective: '900px' }}
      whileHover={reducedMotion || dangLan ? undefined : { scale: 1.05 }}
      whileTap={reducedMotion || dangLan ? undefined : { scale: 0.95 }}
    >
      {/* Nghieng co dinh ca khoi -> luc dung yen van thay 3 mat, ra dang khoi 3D
          nam tren ban. Khoi ben trong van xoay de dua dung mat can hien ra truoc.
          scale3d(0.74): khoi nghieng + phoi canh chieu ra rong hon canh that
          (~176px * (cos24 + sin24) = ~232px), khong thu lai thi no tran ra ngoai
          khung va de len chu ben duoi. */}
      <div
        className="w-full h-full"
        style={{
          transformStyle: 'preserve-3d',
          transform: 'rotateX(-16deg) rotateY(24deg) scale3d(0.74, 0.74, 0.74)',
        }}
      >
        <motion.div
          className="relative w-full h-full"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateX: rot.x, rotateY: rot.y }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : { type: 'spring', stiffness: 55, damping: 12, mass: 1.1 }
          }
          onAnimationComplete={() => setDangLan(false)}
        >
          <DiceFaces />
        </motion.div>
      </div>
    </motion.button>
  );
}
