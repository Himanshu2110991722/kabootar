const express = require('express');
const router  = express.Router();
const Announcement = require('../models/Announcement');
const { protect }  = require('../middleware/auth');

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  next();
};

// GET /api/announcements — public, returns active non-expired announcements
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const announcements = await Announcement.find({
      active: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    }).sort({ pinned: -1, createdAt: -1 }).limit(20);
    res.json({ announcements });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/announcements/all — admin: all including inactive
router.get('/all', protect, adminOnly, async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name');
    res.json({ announcements });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/announcements — admin: create
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { title, body, icon, type, pinned, expiresAt } = req.body;
    if (!title?.trim() || !body?.trim())
      return res.status(400).json({ message: 'title and body required' });
    const ann = await Announcement.create({
      title: title.trim(), body: body.trim(), icon, type, pinned,
      expiresAt: expiresAt || null,
      createdBy: req.user._id,
    });
    res.status(201).json({ announcement: ann });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/announcements/:id — admin: update
router.patch('/:id', protect, adminOnly, async (req, res) => {
  try {
    const ann = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!ann) return res.status(404).json({ message: 'Not found' });
    res.json({ announcement: ann });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/announcements/:id — admin: delete
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
