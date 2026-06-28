const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

let io;
const connectedUsers = new Map(); // userId -> socketId

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [process.env.FRONTEND_URL, 'http://localhost:3000'],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // Auth middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('_id name role');
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    connectedUsers.set(userId, socket.id);
    logger.info(`Socket connected: ${userId} (${socket.user.role})`);

    // Join role-based rooms
    socket.join(`user:${userId}`);
    socket.join(`role:${socket.user.role}`);

    // Delivery partner location update
    socket.on('location:update', (data) => {
      const { lat, lng, orderId } = data;
      if (socket.user.role === 'delivery' && orderId) {
        io.to(`order:${orderId}`).emit('delivery:location', { lat, lng, timestamp: Date.now() });
      }
    });

    // Join order tracking room
    socket.on('order:track', (orderId) => {
      socket.join(`order:${orderId}`);
      logger.info(`User ${userId} tracking order ${orderId}`);
    });

    socket.on('order:untrack', (orderId) => {
      socket.leave(`order:${orderId}`);
    });

    socket.on('disconnect', () => {
      connectedUsers.delete(userId);
      logger.info(`Socket disconnected: ${userId}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

// Emit to specific user
const emitToUser = (userId, event, data) => {
  if (io) io.to(`user:${userId.toString()}`).emit(event, data);
};

// Emit to all in order room
const emitToOrder = (orderId, event, data) => {
  if (io) io.to(`order:${orderId.toString()}`).emit(event, data);
};

// Emit to role (admin, vendor, delivery)
const emitToRole = (role, event, data) => {
  if (io) io.to(`role:${role}`).emit(event, data);
};

// Order status broadcast
const broadcastOrderStatus = (order) => {
  const data = {
    orderId: order._id,
    orderNumber: order.orderNumber,
    status: order.status,
    timestamp: new Date(),
  };
  emitToUser(order.customer, 'order:status_update', data);
  emitToOrder(order._id, 'order:status_update', data);
  if (order.deliveryPartner) emitToUser(order.deliveryPartner, 'order:status_update', data);
};

module.exports = { initSocket, getIO, emitToUser, emitToOrder, emitToRole, broadcastOrderStatus, connectedUsers };
