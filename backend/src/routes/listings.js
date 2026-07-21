const express = require('express');
const router = express.Router();
const listingController = require('../controller/listingController');
const authenticate = require('../middleware/authenticate');
const { maybeUploadSingle } = require('../middleware/upload');

/**
 * @swagger
 * tags:
 *   name: Listings
 *   description: API cho tin đăng marketplace
 */

/**
 * @swagger
 * /api/listings:
 *   get:
 *     summary: Lấy danh sách tin đăng
 *     tags: [Listings]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', listingController.getAllListings);

/**
 * @swagger
 * /api/listings/{id}:
 *   get:
 *     summary: Lấy chi tiết tin đăng
 *     tags: [Listings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/:id', listingController.getListingById);

/**
 * @swagger
 * /api/listings:
 *   post:
 *     summary: Tạo tin đăng mới
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               priceSell:
 *                 type: number
 *               priceRent:
 *                 type: number
 *               imageUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Đã tạo
 */
router.post('/', authenticate, maybeUploadSingle('image'), listingController.createListing);

/**
 * @swagger
 * /api/listings/{id}:
 *   put:
 *     summary: Cập nhật tin đăng
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Thành công
 */
router.put('/:id', authenticate, listingController.updateListing);

/**
 * @swagger
 * /api/listings/{id}:
 *   delete:
 *     summary: Xóa tin đăng
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Thành công
 */
router.delete('/:id', authenticate, listingController.deleteListing);

module.exports = router;
