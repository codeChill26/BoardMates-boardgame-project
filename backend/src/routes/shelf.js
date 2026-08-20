const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const shelfController = require('../controller/shelf.controller');

// Tải file template CSV mẫu
router.get('/template-csv', shelfController.downloadCsvTemplate);

// Lấy danh sách game trên kệ của user (phân trang, lọc, tìm kiếm)
router.get('/', authenticate, shelfController.getShelfGames);

// Lấy danh sách master boardgames để gợi ý
router.get('/master-games', authenticate, shelfController.getMasterGames);

// Lấy thống kê kho game
router.get('/stats', authenticate, shelfController.getShelfStats);

// Thêm 1 game vào kho
router.post('/', authenticate, shelfController.addGameToShelf);

// Nhập hàng loạt game từ CSV vào kho
router.post('/batch-import', authenticate, shelfController.batchImportShelfGames);

// ==========================================
// TÍCH HỢP BOARDGAMEGEEK (BGG API)
// ==========================================
// Tìm kiếm game từ BGG theo Tên hoặc ID
router.get('/bgg/search', shelfController.searchBgg);

// Lấy danh sách Hotness từ BGG
router.get('/bgg/hotness', shelfController.fetchBggHotness);

// Lấy chi tiết game từ BGG theo BGG ID
router.get('/bgg/details/:bggId', shelfController.fetchBggDetails);

// Nhập trực tiếp game từ BGG vào kho
router.post('/bgg/import', authenticate, shelfController.importBggToShelf);

// Cập nhật game trong kho
router.put('/:id', authenticate, shelfController.updateShelfGame);

// Xóa game khỏi kho
router.delete('/:id', authenticate, shelfController.deleteShelfGame);

module.exports = router;
