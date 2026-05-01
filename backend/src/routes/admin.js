const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');

// POST /api/admin/promote
// Current user promotes themselves to admin using the ADMIN_SECRET env var
router.post('/promote', protect, async (req, res) => {
  try {
    const { secret } = req.body;
    if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ message: 'Invalid admin secret' });
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { role: 'admin' },
      { new: true }
    ).select('-reviews');
    res.json({ user, message: 'You are now an admin' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/kyc — list users with pending KYC
router.get('/kyc', adminOnly, async (req, res) => {
  try {
    const users = await User.find({ kycStatus: 'pending' })
      .select('name phone profileImage kycStatus kycDocumentUrl selfieUrl kycSubmittedAt createdAt')
      .sort({ kycSubmittedAt: 1 })
      .limit(100);
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/users — list all users (paginated)
router.get('/users', adminOnly, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 30;
    const search = req.query.search || '';

    const filter = search
      ? { $or: [{ name: { $regex: search, $options: 'i' } }, { phone: { $regex: search, $options: 'i' } }] }
      : {};

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('name phone profileImage role kycStatus rating totalRatings createdAt')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    res.json({ users, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/kyc/:userId/approve
router.post('/kyc/:userId/approve', adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { kycStatus: 'verified', kycApprovedAt: new Date(), kycRejectedReason: '' },
      { new: true }
    ).select('-reviews');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user, message: 'KYC approved' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/kyc/:userId/reject
router.post('/kyc/:userId/reject', adminOnly, async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      {
        kycStatus: 'rejected',
        kycRejectedAt: new Date(),
        kycRejectedReason: reason || 'Documents unclear or invalid',
      },
      { new: true }
    ).select('-reviews');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user, message: 'KYC rejected' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
