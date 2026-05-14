const express = require('express');
const router  = express.Router();
const AppNotification = require('../models/AppNotification');
const { protect }     = require('../middleware/auth');

// GET /api/notifications/me — last 50 notifications for the user
router.get('/me', protect, async (req, res) => {
  try {
    const notifications = await AppNotification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    const unread = await AppNotification.countDocuments({ userId: req.user._id, read: false });
    res.json({ notifications, unread });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/notifications/:id/read — mark one as read
router.patch('/:id/read', protect, async (req, res) => {
  try {
    await AppNotification.updateOne(
      { _id: req.params.id, userId: req.user._id },
      { read: true }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/notifications/read-all — mark all as read
router.patch('/read-all', protect, async (req, res) => {
  try {
    await AppNotification.updateMany({ userId: req.user._id, read: false }, { read: true });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/notifications/clear — delete read notifications
router.delete('/clear', protect, async (req, res) => {
  try {
    await AppNotification.deleteMany({ userId: req.user._id, read: true });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
