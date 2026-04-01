const Message = require('../models/Message');

const setupSocket = (io) => {
  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Register user
    socket.on('register', (userId) => {
      onlineUsers.set(userId, socket.id);
      socket.userId = userId;
      console.log(`User ${userId} registered`);
    });

    // Join a chat room (roomId = sorted userId1_userId2)
    socket.on('join_room', (roomId) => {
      socket.join(roomId);
    });

    // Send message
    socket.on('send_message', async (data) => {
      const { senderId, receiverId, text, roomId } = data;
      try {
        const message = await Message.create({ senderId, receiverId, text });
        io.to(roomId).emit('receive_message', {
          _id: message._id,
          senderId,
          receiverId,
          text,
          timestamp: message.timestamp,
        });
      } catch (err) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('disconnect', () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
      }
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = { setupSocket };
