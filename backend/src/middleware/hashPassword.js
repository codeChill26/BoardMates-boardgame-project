const bcrypt = require('bcryptjs');

const hashPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    
    // Nếu không truyền password thì đi tiếp để Controller báo lỗi thiều trường
    if (!password) {
      return next();
    }

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Gắn mật khẩu đã mã hóa vào đối tượng req để truyền sang Controller
    req.hashedPassword = hashedPassword;
    
    next(); // Chuyển luồng sang hàm tiếp theo (Controller)
  } catch (error) {
    console.error('Lỗi mã hóa mật khẩu:', error);
    return res.status(500).json({ success: false, message: 'Lỗi trong quá trình xử lý bảo mật' });
  }
};

module.exports = hashPassword;