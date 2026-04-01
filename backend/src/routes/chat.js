const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// GET /api/chat/conversations - Get all unique conversations for the user
router.get('/conversations', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all messages where user is sender or receiver
    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    }).sort({ timestamp: -1 });

    // Extract unique partner IDs
    const partnerMap = new Map();
    for (const msg of messages) {
      const partnerId = msg.senderId.toString() === userId.toString()
        ? msg.receiverId.toString()
        : msg.senderId.toString();

      if (!partnerMap.has(partnerId)) {
        partnerMap.set(partnerId, msg);
      }
    }

    // Fetch partner details
    const conversations = await Promise.all(
      Array.from(partnerMap.entries()).map(async ([partnerId, lastMsg]) => {
        const partner = await User.findById(partnerId).select('name phone rating');
        const unreadCount = await Message.countDocuments({
          senderId: partnerId,
          receiverId: userId,
          read: false,
        });
        return { partner, lastMessage: lastMsg, unreadCount };
      })
    );

    res.json({ conversations });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/chat/:userId - Get messages between logged-in user and another user
router.get('/:userId', protect, async (req, res) => {
  try {
    const myId = req.user._id;
    const otherId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = 50;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: otherId },
        { senderId: otherId, receiverId: myId },
      ],
    })
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Mark messages as read
    await Message.updateMany(
      { senderId: otherId, receiverId: myId, read: false },
      { read: true }
    );

    const partner = await User.findById(otherId).select('name phone rating totalRatings');

    res.json({ messages: messages.reverse(), partner });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/chat/:userId - Send message (fallback for non-socket clients)
router.post('/:userId', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Text required' });

    const message = await Message.create({
      senderId: req.user._id,
      receiverId: req.params.userId,
      text,
    });

    // Emit via socket if available
    if (req.io) {
      const roomId = [req.user._id.toString(), req.params.userId].sort().join('_');
      req.io.to(roomId).emit('receive_message', {
        _id: message._id,
        senderId: req.user._id,
        receiverId: req.params.userId,
        text,
        timestamp: message.timestamp,
      });
    }

    res.status(201).json({ message });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
