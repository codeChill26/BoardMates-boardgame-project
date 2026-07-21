const fs = require('fs');
const path = require('path');
let multer;
try {
  // Optional dependency until installed.
  // eslint-disable-next-line global-require
  multer = require('multer');
} catch (_) {
  multer = null;
}

const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'public', 'uploads', 'boardgames');

function ensureUploadDir() {
  try {
    fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
  } catch (_) {
    // ignore
  }
}

function safeExt(originalName) {
  const ext = path.extname(originalName || '').toLowerCase();
  if (!ext) return '';
  if (ext.length > 10) return '';
  return ext;
}

function generateFilename(originalName) {
  const ext = safeExt(originalName);
  const base = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${base}${ext}`;
}

ensureUploadDir();

function missingMulterError() {
  return new Error('File upload is not available. Please install multer in backend (npm install).');
}

if (!multer) {
  function maybeUploadSingle() {
    return (req, res, next) => {
      if (req.is('multipart/form-data')) return next(missingMulterError());
      return next();
    };
  }

  module.exports = {
    upload: null,
    maybeUploadSingle,
    UPLOAD_ROOT,
  };
} else {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, UPLOAD_ROOT);
    },
    filename: (req, file, cb) => {
      cb(null, generateFilename(file.originalname));
    },
  });

  function fileFilter(req, file, cb) {
    const mime = String(file.mimetype || '').toLowerCase();
    if (mime.startsWith('image/')) return cb(null, true);
    return cb(new Error('Only image uploads are allowed'));
  }

  const upload = multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  });

  function maybeUploadSingle(fieldName) {
    const handler = upload.single(fieldName);
    return (req, res, next) => {
      if (!req.is('multipart/form-data')) return next();
      handler(req, res, next);
    };
  }

  module.exports = {
    upload,
    maybeUploadSingle,
    UPLOAD_ROOT,
  };
}
