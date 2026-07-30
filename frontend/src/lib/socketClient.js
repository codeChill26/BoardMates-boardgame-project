'use client';

import { io } from 'socket.io-client';
import { getBackendUrl } from './apiConfig';

let socket;
let socketToken;

export function getSocket(token) {
  if (!token) return null;

  if (socket && socketToken === token) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
    socket = undefined;
    socketToken = undefined;
  }

  socketToken = token;
  socket = io(getBackendUrl(), {
    auth: { token },
    transports: ['websocket'],
  });

  return socket;
}

export function disconnectSocket() {
  if (!socket) return;
  socket.disconnect();
  socket = undefined;
  socketToken = undefined;
}
