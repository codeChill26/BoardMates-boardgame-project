const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');

let io;

function userRoom(userId) {
  return `user:${userId}`;
}

function extractToken(socket) {
  const authToken = socket.handshake?.auth?.token;
  if (authToken) return authToken;

  const header = socket.handshake?.headers?.authorization;
  if (header && header.startsWith('Bearer ')) return header.slice('Bearer '.length);

  const queryToken = socket.handshake?.query?.token;
  if (queryToken) return queryToken;

  return null;
}

function initSocket(server) {
  if (io) return io;

  const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:3007',
  ].filter(Boolean);

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = extractToken(socket);
    if (!token) return next(new Error('Unauthorized'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };
      return next();
    } catch (error) {
      return next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(userRoom(socket.user.id));

    socket.on('chat:send', (payload, ack) => {
      try {
        const toUserId = Number(payload?.toUserId);
        const listingId = payload?.listingId != null ? Number(payload.listingId) : null;
        const message = String(payload?.message ?? '').trim();

        if (!Number.isFinite(toUserId)) {
          return ack?.({ success: false, message: 'Invalid toUserId' });
        }
        if (!message) {
          return ack?.({ success: false, message: 'Message is empty' });
        }

        const chatMessage = {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          fromUserId: socket.user.id,
          toUserId,
          listingId: Number.isFinite(listingId) ? listingId : null,
          message,
          createdAt: new Date().toISOString(),
        };

        io.to(userRoom(toUserId)).emit('chat:message', chatMessage);
        io.to(userRoom(socket.user.id)).emit('chat:message', chatMessage);

        return ack?.({ success: true, data: chatMessage });
      } catch (error) {
        return ack?.({ success: false, message: 'Failed to send message' });
      }
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}

function emitToUser(userId, event, payload) {
  if (!io) return;
  io.to(userRoom(userId)).emit(event, payload);
}

module.exports = {
  initSocket,
  getIO,
  emitToUser,
};
