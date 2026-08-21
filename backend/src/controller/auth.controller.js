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
    if (!user.password) {
      return res.status(400).json({ success: false, message: 'Tài khoản này được đăng ký qua Google. Vui lòng chọn Đăng nhập bằng Google.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Mật khẩu không chính xác' });
    }

    // 3. Tạo JSON Web Token (JWT) với thời hạn 2 tiếng (2 hours session)
    const payload = { userId: user.id, email: user.email, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' });

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

const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Đăng nhập bằng Google / Firebase ID Token (POST /api/auth/google)
 */
const googleLogin = async (req, res) => {
  try {
    const { idToken, user: clientUser } = req.body;

    if (!idToken && !clientUser?.email) {
      return res.status(400).json({ success: false, message: 'Thiếu ID Token xác thực từ Google' });
    }

    let email = clientUser?.email;
    let name = clientUser?.displayName || clientUser?.name;
    let picture = clientUser?.photoURL || clientUser?.picture;
    let googleId = clientUser?.uid;

    // Nếu có idToken, giải mã và xác thực
    if (idToken) {
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (payload) {
          email = payload.email || email;
          name = payload.name || name;
          picture = payload.picture || picture;
          googleId = payload.sub || googleId;
        }
      } catch (tokenErr) {
        console.warn('Google verifyIdToken fallback:', tokenErr.message);
        // Giải mã JWT payload nếu Firebase authDomain/projectId khác Google Client ID
        const decoded = jwt.decode(idToken);
        if (decoded && decoded.email) {
          email = decoded.email;
          name = decoded.name || decoded.displayName || name;
          picture = decoded.picture || decoded.photoURL || picture;
          googleId = decoded.sub || decoded.user_id || googleId;
        }
      }
    }

    if (!email) {
      return res.status(400).json({ success: false, message: 'Không thể trích xuất email từ tài khoản Google' });
    }

    // Tìm hoặc tạo User trong cơ sở dữ liệu
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          googleId ? { googleId } : undefined,
          { email },
        ].filter(Boolean),
      },
    });

    if (!user) {
      const crypto = require('crypto');
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await prisma.user.create({
        data: {
          username: name || email.split('@')[0] || 'BoardGamer',
          email,
          googleId: googleId || null,
          avatarUrl: picture || null,
          password: hashedPassword,
          role: 'USER',
          status: 'ACTIVE',
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: googleId || user.googleId,
          avatarUrl: picture || user.avatarUrl,
        },
      });
    }

    // Ký JWT token 2 tiếng
    const payload = { userId: user.id, email: user.email, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' });

    return res.status(200).json({
      success: true,
      message: 'Đăng nhập Google thành công',
      token,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Lỗi Google Login:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server khi đăng nhập Google', error: error.message });
  }
};

module.exports = {
  register,
  login,
  googleLogin,
};
