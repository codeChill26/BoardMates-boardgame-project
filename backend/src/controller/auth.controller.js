const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../middleware/prismaClient'); // Prisma client

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("CRITICAL ERROR: Chưa config JWT_SECRET trong file .env!");
  process.exit(1); // Dừng server nếu quên config JWT_SECRET để đảm bảo an mật
}

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // KHÔNG CẦN CHẶN CÁC TRƯỜNG TRỐNG NỮA:
    // Vì express-validator ở src/middleware/validateAuth.js đã chặn giúp trước rồi!

    // 2. Kiểm tra email đã tồn tại trong database chưa?
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email đã được sử dụng' });
    }

    // 3. (Mã hóa password đã được thực hiện bằng middleware hashPassword.js)

    // 4. Tạo user mới trong DB
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: req.hashedPassword, // Lấy mật khẩu đã mã hóa từ req do Middleware đưa sang
        status: 'ACTIVE',
        role: 'USER'
      }
    });

    // 5. Thành công! Trả về data (bỏ password đi)
    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      data: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email
      }
    });
  } catch (error) {
    console.error('Lỗi Register:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Bỏ check rỗng đi vì validateLogin đã check bên file Middleware trước khi chạy vào đây
    
    // 1. Tìm user theo email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng với email này' });
    }

    // 2. So sánh password nhập vào với password đã mã hóa trong DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Mật khẩu không chính xác' });
    }

    // 3. Tạo JSON Web Token (JWT)
    // Token này sẽ dùng để phân quyền (Auth) cho các API sau này
    const payload = { userId: user.id, email: user.email, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

    // 4. Trả về token kèm thông tin user (loại bỏ password)
    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      token,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Lỗi Login:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

module.exports = {
  register,
  login
};
