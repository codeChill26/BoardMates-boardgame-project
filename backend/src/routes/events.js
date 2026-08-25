const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const authenticate = require('../middleware/authenticate');
const eventController = require('../controller/event.controller');

// Optional auth middleware: nếu có token thì gán req.user, nếu không thì vẫn cho qua
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { id: decoded.userId, email: decoded.email, role: decoded.role };
    } catch (err) {
      // Bỏ qua lỗi nếu token hết hạn/không hợp lệ khi xem công khai
    }
  }
  next();
};

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Quản lý sự kiện và lên kèo chơi Board Game
 */

// Lấy danh sách địa điểm gợi ý
router.get('/venues', eventController.getVenues);

// Lấy danh sách sự kiện (có lọc, phân trang, tìm kiếm)
router.get('/', optionalAuth, eventController.getEvents);

// Lấy chi tiết 1 sự kiện
router.get('/:id', optionalAuth, eventController.getEventById);

// Tạo mới sự kiện / lên kèo (yêu cầu đăng nhập)
router.post('/', authenticate, eventController.createEvent);

// Chỉnh sửa sự kiện (Host hoặc Admin)
router.put('/:id', authenticate, eventController.updateEvent);

// Hủy sự kiện (Host hoặc Admin)
router.delete('/:id', authenticate, eventController.cancelEvent);

// Đăng ký tham gia kèo
router.post('/:id/join', authenticate, eventController.joinEvent);

// Rút khỏi kèo
router.post('/:id/leave', authenticate, eventController.leaveEvent);

module.exports = router;
