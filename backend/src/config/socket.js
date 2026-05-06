const Message = require('../models/Message');

const setupSocket = (io) => {
  const onlineUsers = new Map(); // userId → socketId
  const lastSeen    = new Map(); // userId → timestamp (ms)

  io.on('connection', (socket) => {
    // Register user as online
    socket.on('register', (userId) => {
      onlineUsers.set(userId, socket.id);
      socket.userId = userId;
      // Broadcast to everyone that this user came online
      socket.broadcast.emit('user_online', { userId });
    });

    // Join a chat room
    socket.on('join_room', (roomId) => {
      socket.join(roomId);
    });

    // Query online/last-seen status of another user
    socket.on('check_online', (targetUserId) => {
      socket.emit('online_status', {
        userId:      targetUserId,
        isOnline:    onlineUsers.has(targetUserId),
        lastSeenAt:  lastSeen.get(targetUserId) || null,
      });
    });

    // Typing indicator — broadcast to room partner only
    socket.on('typing', ({ roomId }) => {
      socket.to(roomId).emit('partner_typing', { userId: socket.userId });
    });

    socket.on('stop_typing', ({ roomId }) => {
      socket.to(roomId).emit('partner_stopped_typing', { userId: socket.userId });
    });

    // Send message
    socket.on('send_message', async (data) => {
      const { senderId, receiverId, text, roomId, type, amount, imageUrl } = data;
      try {
        const message = await Message.create({
          senderId,
          receiverId,
          text:     text || '',
          type:     type || 'text',
          amount:   amount || null,
          imageUrl: imageUrl || null,
        });
        io.to(roomId).emit('receive_message', {
          _id:       message._id,
          senderId,
          receiverId,
          text:      message.text,
          type:      message.type,
          amount:    message.amount,
          imageUrl:  message.imageUrl,
          timestamp: message.timestamp,
        });
      } catch (err) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('disconnect', () => {
      if (socket.userId) {
        lastSeen.set(socket.userId, Date.now());
        onlineUsers.delete(socket.userId);
        socket.broadcast.emit('user_offline', {
          userId:     socket.userId,
          lastSeenAt: Date.now(),
        });
      }
    });
  });
};

module.exports = { setupSocket };
