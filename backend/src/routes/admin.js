const express = require('express');
const router = express.Router();
const adminController = require('../controller/admin.controller');
const authenticate = require('../middleware/authenticate');
const { requireRole } = require('../middleware/authorizeRole');

// Áp dụng middleware kiểm tra quyền ADMIN cho toàn bộ router
router.use(authenticate, requireRole('ADMIN'));

// 1. TỔNG QUAN & METRICS ANALYTICS
router.get('/overview', adminController.getOverviewStats);
router.get('/stats', adminController.getOverviewStats); // tương thích ngược

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
