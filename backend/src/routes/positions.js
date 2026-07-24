const express = require('express');
const router = express.Router();
const { getPositions, setPosition } = require('../controller/positionsController');

/**
 * @swagger
 * tags:
 *   name: Positions
 *   description: Trang thai mo/dong cac vi tri tuyen dung (luu file JSON, khong dung DB)
 */

/**
 * @swagger
 * /api/positions:
 *   get:
 *     summary: Lay trang thai mo/dong tat ca vi tri
 *     tags: [Positions]
 *     responses:
 *       200:
 *         description: Thanh cong
 */
router.get('/', getPositions);

/**
 * @swagger
 * /api/positions/{slug}:
 *   put:
 *     summary: Bat/tat mot vi tri (can header x-admin-key)
 *     tags: [Positions]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *     responses:
 *       200:
 *         description: Thanh cong
 */
router.put('/:slug', setPosition);

module.exports = router;
