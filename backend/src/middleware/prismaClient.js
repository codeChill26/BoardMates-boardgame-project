const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

let prisma;

try {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('Missing DATABASE_URL environment variable');
  }

  // Khởi tạo connection pool từ thư viện pg
  const pool = new Pool({
    connectionString,
  });

  // Gắn adapter pg vào Prisma
  const adapter = new PrismaPg(pool);

  // Khởi tạo Prisma Client với adapter
  prisma = new PrismaClient({ adapter });
} catch (error) {
  console.error('[prismaClient] Prisma initialization failed:', error?.message || error);
  // Export a stub that throws when used, but does not crash server on startup.
  prisma = new Proxy(
    {},
    {
      get() {
        throw new Error('Database is not configured (DATABASE_URL)');
      },
    }
  );
}

module.exports = prisma;
