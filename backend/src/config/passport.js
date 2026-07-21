const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const prisma = require('../middleware/prismaClient');

passport.use("google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID, 
      clientSecret: process.env.GOOGLE_CLIENT_SECRET, 
      callbackURL: process.env.GOOGLE_CALLBACK_URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Kiểm tra xem user có tồn tại bằng Google ID chưa
        let user = await prisma.user.findUnique({
          where: { googleId: profile.id },
        });

        if (!user) {
          const email = profile.emails[0].value;
          // Kiểm tra xem email này có tài khoản đăng ký tay trước đó chưa
          user = await prisma.user.findUnique({ where: { email } });
          
          if (user) {
            // Liên kết Google ID vào tài khoản cũ
            user = await prisma.user.update({
              where: { email },
              data: { googleId: profile.id, avatarUrl: profile.photos[0]?.value || user.avatarUrl },
            });
          } else {
            // Tạo tài khoản mới hoàn toàn qua Google
            user = await prisma.user.create({
              data: {
                username: profile.displayName,
                email: email,
                googleId: profile.id,
                avatarUrl: profile.photos[0]?.value,
                password: null, // Không có password cho google auth
                role: 'USER',
                status: 'ACTIVE'
              },
            });
          }
        }
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

module.exports = passport;