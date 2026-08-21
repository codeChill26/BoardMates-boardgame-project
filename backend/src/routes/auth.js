const express = require('express');
const router = express.Router();
const authController = require('../controller/auth.controller');
const hashPassword = require('../middleware/hashPassword');
const { validateRegister, validateLogin } = require('../middleware/validateAuth');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Các API phục vụ Đăng nhập & Đăng ký
 */

// ==============================================================
//                    GOOGLE / FIREBASE AUTH
// ==============================================================

// Đăng nhập Google qua Firebase / Client ID Token
router.post('/google', authController.googleLogin);


/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Đăng ký tài khoản mới
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: Ngữ Khắc
 *               email:
 *                 type: string
 *                 example: ngu.khac@gmail.com
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *       400:
 *         description: Thiếu dữ liệu hoặc Email đã tồn tại
 *       500:
 *         description: Lỗi máy chủ
 */
// Đăng ký (POST /api/auth/register)
// Luồng xử lý: Validate Data -> Hash Mật khẩu -> Controller Xử lý Logic
router.post('/register', validateRegister, hashPassword, authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Đăng nhập vào hệ thống
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: ngu.khac@gmail.com
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Đăng nhập thành công và cấp Token
 *       400:
 *         description: Thiếu email/password hoặc sai mật khẩu
 *       404:
 *         description: Không tìm thấy email
 *       500:
 *         description: Lỗi máy chủ
 */
// Đăng nhập (POST /api/auth/login)
router.post('/login', validateLogin, authController.login);

module.exports = router;
