import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const connectSocket = (token) => {
  if (socket?.connected) return socket;
  socket = io(SOCKET_URL, {
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => console.log('Socket connected:', socket.id));
  socket.on('disconnect', (reason) => console.log('Socket disconnected:', reason));
  socket.on('connect_error', (err) => console.error('Socket error:', err.message));

  return socket;
};

export const disconnectSocket = () => {
  if (socket) { socket.disconnect(); socket = null; }
};

export const getSocket = () => socket;

export const trackOrder = (orderId) => {
  if (socket) socket.emit('order:track', orderId);
};

export const untrackOrder = (orderId) => {
  if (socket) socket.emit('order:untrack', orderId);
};

export const sendLocationUpdate = (lat, lng, orderId) => {
  if (socket) socket.emit('location:update', { lat, lng, orderId });
};
