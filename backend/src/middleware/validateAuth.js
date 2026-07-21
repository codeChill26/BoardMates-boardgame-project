const { body, validationResult } = require('express-validator');

// Validation cho API Đăng ký
const validateRegister = [
  body('username')
    .notEmpty().withMessage('Username không được để trống')
    .isLength({ min: 3, max: 30 }).withMessage('Username phải dài từ 3 đến 30 ký tự')
    .trim().escape(),
    
  body('email')
    .notEmpty().withMessage('Email không được để trống')
    .isEmail().withMessage('Định dạng email không hợp lệ (ví dụ: test@gmail.com)')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Mật khẩu không được để trống')
    .isLength({ min: 6 }).withMessage('Mật khẩu phải chứa ít nhất 6 ký tự'),

  // Hàm hứng lỗi
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Dữ liệu đầu vào không hợp lệ',
        errors: errors.array() 
      });
    }
    next(); // Dữ liệu ok -> Đi tiếp
  }
];

// Validation cho API Đăng nhập
const validateLogin = [
  body('email')
    .notEmpty().withMessage('Vui lòng nhập Email')
    .isEmail().withMessage('Email không hợp lệ')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Vui lòng nhập mật khẩu'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Dữ liệu đầu vào không hợp lệ',
        errors: errors.array() 
      });
    }
    next();
  }
];

module.exports = {
  validateRegister,
  validateLogin
};