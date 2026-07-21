# Backend (Express + Prisma)
FROM node:20-bookworm-slim

WORKDIR /app/backend

ENV PORT=8080

# Install dependencies first for better layer caching
COPY backend/package.json backend/package-lock.json ./

# Prisma schema/config are needed for @prisma/client generation
COPY backend/prisma ./prisma
COPY backend/prisma.config.ts ./prisma.config.ts

RUN npm ci --include=dev

# Ensure Prisma client is generated (does not require a live DB connection)
ARG DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
ENV DATABASE_URL=${DATABASE_URL}
RUN npx prisma generate

# Copy the rest of the backend source
COPY backend/ ./

# Runtime defaults
ENV NODE_ENV=production

EXPOSE 8080

CMD ["npm", "start"]
