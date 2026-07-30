// Minh hoạ cho 3 thẻ game ở trang chủ. Tách khỏi Icons.jsx vì đây là hình vẽ
// nhiều màu cỡ lớn (~180px), không phải icon UI 24px một màu currentColor.
//
// Thay cho 3 file PNG cũ trong assets/icons/ — chúng được vẽ theo tông kem/nâu
// của bảng màu cũ, và là ảnh raster 200px nên vỡ ở cỡ hiển thị thật.
//
// Màu lấy thẳng từ biến của bảng màu, không hardcode hex: đổi palette ở
// globals.css là hình tự đổi theo.
const MUC = 'var(--color-on-surface)';
const COBALT = 'var(--color-primary)';
const VANG = 'var(--color-tertiary)';
const XANH = 'var(--color-secondary)';
const TRANG = 'var(--color-surface-container-lowest)';

// Ba lớp, bỏ lớp nào cũng hỏng:
//   1. vienNgoai  fill + stroke mực dày -> gộp mọi mảnh thành một bóng liền, không lộ mạch nối
//   2. fill màu   không stroke          -> nằm gọn bên trong, chừa lại vành mực
//   3. net()      stroke mực, fill none -> đường bên trong (nắp rương, mép xu)
// Không có lớp 3 thì các mảnh cùng màu dính thành một cục đặc.
const vienNgoai = {
  fill: MUC,
  stroke: MUC,
  strokeWidth: 6,
  strokeLinejoin: 'round',
  strokeLinecap: 'round',
};

const net = (strokeWidth) => ({
  fill: 'none',
  stroke: MUC,
  strokeWidth,
  strokeLinejoin: 'round',
  strokeLinecap: 'round',
});

/* ── Meeple ────────────────────────────────────────────────────────────────
   Khe chữ V giữa hai chân phải rộng hơn strokeWidth của lớp 1: vành mực ăn vào
   cả hai mép nên khe hẹp hơn 6 đơn vị sẽ bị lấp kín. Miệng khe ở đây rộng 18. */
const MEEPLE_HINH = (
  <>
    <circle cx="50" cy="20" r="13.5" />
    <path d="M50 31C41 31 35 37 33 44C31 50 25 54 18 53C11 52 7 57 9 61C12 65 18 66 23 64C28 62 33 60 37 59C36 68 32 79 29 87C28 91 30 93 34 93L37 93C40 93 41 91 41 87L50 70L59 87C59 91 60 93 63 93L66 93C70 93 72 91 71 87C68 79 64 68 63 59C67 60 72 62 77 64C82 66 88 65 91 61C93 57 89 52 82 53C75 54 69 50 67 44C65 37 59 31 50 31Z" />
  </>
);

export function MeepleArt({ className }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <g {...vienNgoai}>{MEEPLE_HINH}</g>
      <g fill={COBALT}>{MEEPLE_HINH}</g>
    </svg>
  );
}

/* ── Rương ─────────────────────────────────────────────────────────────── */
const RUONG_HINH = (
  <>
    <path d="M15 54h70v28a7 7 0 0 1-7 7H22a7 7 0 0 1-7-7Z" />
    <path d="M15 54a35 21 0 0 1 70 0Z" />
  </>
);

export function ChestArt({ className }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <g {...vienNgoai}>{RUONG_HINH}</g>
      <g fill={VANG}>{RUONG_HINH}</g>
      {/* mạch nắp + hai đai dọc */}
      <path d="M15 54h70" {...net(5)} />
      <path d="M31 36v53M69 36v53" {...net(4)} />
      {/* ổ khoá */}
      <rect x="43" y="48" width="14" height="17" rx="2" fill={TRANG} stroke={MUC} strokeWidth="4" strokeLinejoin="round" />
      <circle cx="50" cy="57" r="3.2" fill={MUC} />
    </svg>
  );
}

/* ── Huy hiệu: xu nhìn thẳng + nguyệt quế ──────────────────────────────────
   Xếp ba đồng xu nhìn nghiêng chồng lên nhau thì cả cụm thành một khối vàng
   không đọc ra là xu; một đồng nhìn thẳng có ngôi sao thì đọc được ngay, hai
   đồng nghiêng phía dưới chỉ để gợi ý "chồng xu". */
const la = (x, y, goc) => (
  <g key={`${x}-${y}`} transform={`translate(${x} ${y}) rotate(${goc})`}>
    <path d="M0 0c6-4 13-2 15 4-6 4-13 2-15-4Z" />
  </g>
);

const NHANH = [la(30, 85, -20), la(23, 73, -38), la(18, 60, -55), la(17, 46, -72)];

const LA_HINH = (
  <>
    {NHANH}
    <g transform="translate(100 0) scale(-1 1)">{NHANH}</g>
  </>
);

const XU_SAU = (
  <>
    <path d="M32 84a18 7 0 0 0 36 0v-7a18 7 0 0 0-36 0Z" />
    <path d="M35 74a15 6 0 0 0 30 0v-7a15 6 0 0 0-30 0Z" />
  </>
);

export function MedalArt({ className }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <g {...vienNgoai}>{LA_HINH}</g>
      <g fill={XANH}>{LA_HINH}</g>

      <g {...vienNgoai}>{XU_SAU}</g>
      <g fill={VANG}>{XU_SAU}</g>
      {/* mép trên của hai đồng dưới, không có thì chúng dính vào nhau */}
      <path d="M32 77a18 7 0 0 0 36 0M35 67a15 6 0 0 0 30 0" {...net(4)} />

      <circle cx="50" cy="46" r="23" {...vienNgoai} />
      <circle cx="50" cy="46" r="23" fill={VANG} />
      <circle cx="50" cy="46" r="17" {...net(3.5)} />
      <path
        d="m50 35 3.4 6.9 7.6 1.1-5.5 5.3 1.3 7.6L50 52.3l-6.8 3.6 1.3-7.6-5.5-5.3 7.6-1.1Z"
        fill={TRANG}
        stroke={MUC}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
