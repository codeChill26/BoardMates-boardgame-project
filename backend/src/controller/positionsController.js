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

// Trang thai mo/dong luu trong file JSON (khong dung DB — DB co the chua chay).
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

// Tra ve map { slug: isOpen } cho MOI slug hop le. Khong co trong file => mac dinh MO.
function buildStatus() {
  const store = readStore();
  const out = {};
  for (const slug of KNOWN_SLUGS) {
    out[slug] = store[slug] === undefined ? true : Boolean(store[slug]);
  }
  return out;
}

// GET /api/positions — cong khai
const getPositions = (req, res) => {
  res.json({ success: true, data: buildStatus() });
};

// PUT /api/positions/:slug  body { isOpen }  header x-admin-key
const setPosition = (req, res) => {
  const key = req.headers['x-admin-key'];
  if (key !== ADMIN_SECRET) {
    return res.status(401).json({ success: false, message: 'Sai khoa quan tri' });
  }

  const { slug } = req.params;
  if (!KNOWN_SLUGS.includes(slug)) {
    return res.status(404).json({ success: false, message: 'Khong tim thay vi tri' });
  }

  const { isOpen } = req.body;
  if (typeof isOpen !== 'boolean') {
    return res.status(400).json({ success: false, message: 'isOpen phai la boolean' });
  }

  const store = readStore();
  store[slug] = isOpen;
  writeStore(store);

  res.json({ success: true, data: buildStatus() });
};

module.exports = { getPositions, setPosition, KNOWN_SLUGS };
