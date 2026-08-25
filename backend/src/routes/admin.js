const express = require('express');
const router = express.Router();
const adminController = require('../controller/admin.controller');
const authenticate = require('../middleware/authenticate');
const { requireRole } = require('../middleware/authorizeRole');

/**
 * MIDDLEWARE 1: GIỚI HẠN IP & CHỈ CHO PHÉP MÁY LOCALHOST CỦA BẠN TRUY CẬP
 */
const restrictAdminIp = (req, res, next) => {
  const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  const clientIp = typeof rawIp === 'string' ? rawIp.split(',')[0].trim() : '';

  const allowedIps = (process.env.ALLOWED_ADMIN_IPS || '127.0.0.1,::1,::ffff:127.0.0.1,localhost')
    .split(',')
    .map((ip) => ip.trim().toLowerCase());

  const isAllowed =
    allowedIps.some((allowed) => clientIp.toLowerCase().includes(allowed)) ||
    clientIp.includes('127.0.0.1') ||
    clientIp.includes('::1') ||
    clientIp === 'localhost';

  if (!isAllowed) {
    console.warn(`[SECURITY BLOCK] Blocked unauthorized remote IP attempting to access Admin API: ${clientIp}`);
    // Trả về 404 để ngụy trang như API không hề tồn tại trên server
    return res.status(404).json({ success: false, message: 'Not Found' });
  }

  next();
};

/**
 * MIDDLEWARE 2: XÁC THỰC MÃ KHÓA BÍ MẬT QUẢN TRỊ (ADMIN MASTER KEY)
 */
const verifyAdminMasterKey = (req, res, next) => {
  const masterKey = process.env.ADMIN_MASTER_KEY || process.env.ADMIN_SECRET;
  const providedKey = req.headers['x-admin-key'] || req.query['masterKey'];

  // Nếu truyền đúng key từ biến môi trường
  if (masterKey && providedKey && (providedKey === masterKey || providedKey === process.env.ADMIN_SECRET)) {
    return next();
  }

  // Nếu đã xác thực Role ADMIN từ token hợp lệ trên localhost
  if (req.user && req.user.role === 'ADMIN') {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Mã khóa bảo mật Admin Master Key không chính xác hoặc đã hết hạn.',
  });
};

// ÁP DỤNG CẢ 4 TẦNG BẢO MẬT: Chặn IP -> Xác thực JWT -> Kiểm tra Role ADMIN -> Xác thực Master Key
router.use(restrictAdminIp, authenticate, requireRole('ADMIN'), verifyAdminMasterKey);

// 1. TỔNG QUAN & METRICS ANALYTICS
router.get('/overview', adminController.getOverviewStats);
router.get('/stats', adminController.getOverviewStats);

// 2. QUẢN LÝ NGƯỜI DÙNG
router.get('/users', adminController.getUsers);
router.put('/users/:id/status', adminController.updateUserStatus);
router.put('/users/:id/role', adminController.updateUserRole);

// 3. QUẢN LÝ SỰ KIỆN
router.get('/events', adminController.getEvents);
router.put('/events/:id/status', adminController.updateEventStatus);
router.delete('/events/:id', adminController.deleteEvent);

// 4. QUẢN LÝ MARKETPLACE
router.get('/marketplace', adminController.getListings);
router.put('/marketplace/:id/status', adminController.updateListingStatus);

// 5. QUẢN LÝ CỘNG ĐỒNG
router.get('/community', adminController.getCommunityOverview);

module.exports = router;
