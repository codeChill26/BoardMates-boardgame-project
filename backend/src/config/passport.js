const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const prisma = require('../middleware/prismaClient');

const getGoogleCallbackUrl = () => {
  if (process.env.GOOGLE_CALLBACK_URL) return process.env.GOOGLE_CALLBACK_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}/api/auth/google/callback`;
  return 'https://board-mates-boardgame-project-v45x-ax6pwse1m.vercel.app/api/auth/google/callback';
};

passport.use("google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID, 
      clientSecret: process.env.GOOGLE_CLIENT_SECRET, 
      callbackURL: getGoogleCallbackUrl()
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
            const crypto = require('crypto');
            const bcrypt = require('bcryptjs');
            const randomPassword = crypto.randomBytes(32).toString('hex');
            const hashedPassword = await bcrypt.hash(randomPassword, 10);

            // Tạo tài khoản mới hoàn toàn qua Google
            user = await prisma.user.create({
              data: {
                username: profile.displayName || email.split('@')[0] || 'User',
                email: email,
                googleId: profile.id,
                avatarUrl: profile.photos && profile.photos[0]?.value ? profile.photos[0].value : null,
                password: hashedPassword,
                role: 'USER',
                status: 'ACTIVE'
              },
            });
          }
        }
        return done(null, user);
      } catch (error) {
        console.error('Google Auth Strategy Error:', error);
        return done(error, null);
      }
    }
  )
);

module.exports = passport;