// Seed tạo sẵn tài khoản ADMIN.
// Chạy: node prisma/seed.js  (từ thư mục backend/)
// Có thể override qua .env: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_USERNAME
const bcrypt = require('bcryptjs');
const prisma = require('../src/middleware/prismaClient'); // dùng lại client + adapter pg

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@bg.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const username = process.env.ADMIN_USERNAME || 'Admin';

  const hashedPassword = await bcrypt.hash(password, 10);

  // upsert: đã có thì cập nhật lên ADMIN + reset password, chưa có thì tạo mới
  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
    create: {
      username,
      email,
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Đã seed tài khoản ADMIN:');
  console.log('   email:    ', admin.email);
  console.log('   password: ', password);
  console.log('   role:     ', admin.role);
}

main()
  .catch((err) => {
    console.error('❌ Seed thất bại:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
