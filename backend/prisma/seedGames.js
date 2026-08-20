// Script seed 100 BoardGame phổ biến nhất vào cơ sở dữ liệu Postgres (Prisma)
// Chạy từ thư mục backend: node prisma/seedGames.js

const fs = require('fs');
const path = require('path');
const prisma = require('../src/middleware/prismaClient');

async function seedGames() {
  console.log('🚀 Bắt đầu quá trình nạp 100 BoardGame phổ biến vào Database...');

  const dataFilePath = path.join(__dirname, '..', 'data', 'top100_boardgames.json');
  if (!fs.existsSync(dataFilePath)) {
    throw new Error(`Không tìm thấy file dữ liệu tại: ${dataFilePath}`);
  }

  const rawData = fs.readFileSync(dataFilePath, 'utf8');
  const games = JSON.parse(rawData);

  console.log(`📦 Đã đọc ${games.length} trò chơi từ file JSON.`);

  let insertedCount = 0;
  let updatedCount = 0;

  for (const game of games) {
    const existing = await prisma.boardGame.findFirst({
      where: {
        name: {
          equals: game.name,
          mode: 'insensitive',
        },
      },
    });

    if (existing) {
      // Cập nhật thông tin chi tiết nếu game đã tồn tại
      await prisma.boardGame.update({
        where: { id: existing.id },
        data: {
          description: game.description || existing.description,
          categories: game.categories || existing.categories,
          minPlayers: game.minPlayers ?? existing.minPlayers,
          maxPlayers: game.maxPlayers ?? existing.maxPlayers,
          playTime: game.playTime ?? existing.playTime,
          age: game.age ?? existing.age,
          publisher: game.publisher || existing.publisher,
          imageUrl: game.imageUrl || existing.imageUrl,
        },
      });
      updatedCount++;
    } else {
      // Tạo mới bản ghi
      await prisma.boardGame.create({
        data: {
          name: game.name,
          description: game.description,
          categories: game.categories,
          minPlayers: game.minPlayers,
          maxPlayers: game.maxPlayers,
          playTime: game.playTime,
          age: game.age,
          publisher: game.publisher,
          imageUrl: game.imageUrl,
        },
      });
      insertedCount++;
    }
  }

  console.log('====================================================');
  console.log(`✅ Hoàn tất Seed BoardGame!`);
  console.log(`   ➕ Thêm mới: ${insertedCount} game`);
  console.log(`   🔄 Cập nhật: ${updatedCount} game`);
  console.log(`   🎉 Tổng cộng xử lý: ${games.length} game`);
  console.log('====================================================');
}

seedGames()
  .catch((err) => {
    console.error('❌ Lỗi khi seed BoardGame:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
