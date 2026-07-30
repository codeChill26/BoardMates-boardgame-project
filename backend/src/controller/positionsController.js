const fs = require('fs');
const path = require('path');

// Danh sach slug hop le (dong bo voi frontend/src/data/teams.js)
const KNOWN_SLUGS = [
  'marketing',
  'design',
  'community',
  'event',
  'business-development',
  'product',
  'technology',
];

// Trang thai luu trong file JSON (khong dung DB — DB co the chua chay).
// Shape: { slug: { isOpen: boolean, headcount: number|null } }
// headcount = null nghia la KHONG ghi de — frontend tu lay so mac dinh trong
// teams.js. Nho vay so luong chi khai bao mot cho, backend khong phai dong bo lai.
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'positions.json');

// Khoa cho thao tac ghi. Doc tu env; neu chua dat thi dung mac dinh (nen doi trong .env).
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'boardmates-admin-2026';

function readStore() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (_) {
    return {};
  }
}

function writeStore(store) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (_) {
    // ignore
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf8');
}

function isValidHeadcount(n) {
  return Number.isInteger(n) && n >= 0;
}

const DEFAULT_ENTRY = { isOpen: true, headcount: null };

// File co the con shape cu ({ slug: true|false }) tu truoc khi co headcount —
// doc len van hieu duoc, khong can migrate tay.
function normalizeEntry(value) {
  if (typeof value === 'boolean') return { isOpen: value, headcount: null };

  if (value && typeof value === 'object') {
    return {
      isOpen: value.isOpen === undefined ? true : Boolean(value.isOpen),
      headcount: isValidHeadcount(value.headcount) ? value.headcount : null,
    };
  }

  return { ...DEFAULT_ENTRY };
}

// Tra ve map { slug: { isOpen, headcount } } cho MOI slug hop le.
// Khong co trong file => mac dinh MO va khong ghi de so luong.
function buildStatus() {
  const store = readStore();
  const out = {};
  for (const slug of KNOWN_SLUGS) {
    out[slug] = store[slug] === undefined ? { ...DEFAULT_ENTRY } : normalizeEntry(store[slug]);
  }
  return out;
}

// GET /api/positions — cong khai
const getPositions = (req, res) => {
  res.json({ success: true, data: buildStatus() });
};

// PUT /api/positions/:slug  body { isOpen?, headcount? }  header x-admin-key
// Gui rieng tung truong cung duoc — truong khong gui thi giu nguyen gia tri cu.
// headcount = null de xoa ghi de, quay ve so mac dinh trong teams.js.
const setPosition = (req, res) => {
  const key = req.headers['x-admin-key'];
  if (key !== ADMIN_SECRET) {
    return res.status(401).json({ success: false, message: 'Sai khoa quan tri' });
  }

  const { slug } = req.params;
  if (!KNOWN_SLUGS.includes(slug)) {
    return res.status(404).json({ success: false, message: 'Khong tim thay vi tri' });
  }

  const { isOpen, headcount } = req.body || {};
  const hasIsOpen = isOpen !== undefined;
  const hasHeadcount = headcount !== undefined;

  if (!hasIsOpen && !hasHeadcount) {
    return res.status(400).json({ success: false, message: 'Can it nhat isOpen hoac headcount' });
  }
  if (hasIsOpen && typeof isOpen !== 'boolean') {
    return res.status(400).json({ success: false, message: 'isOpen phai la boolean' });
  }
  if (hasHeadcount && headcount !== null && !isValidHeadcount(headcount)) {
    return res.status(400).json({ success: false, message: 'headcount phai la so nguyen >= 0 hoac null' });
  }

  const store = readStore();
  const current = store[slug] === undefined ? { ...DEFAULT_ENTRY } : normalizeEntry(store[slug]);

  store[slug] = {
    isOpen: hasIsOpen ? isOpen : current.isOpen,
    headcount: hasHeadcount ? headcount : current.headcount,
  };
  writeStore(store);

  res.json({ success: true, data: buildStatus() });
};

module.exports = { getPositions, setPosition, KNOWN_SLUGS };
