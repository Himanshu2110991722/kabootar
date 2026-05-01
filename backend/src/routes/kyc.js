const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { upload, getFileUrl } = require('../utils/upload');

// POST /api/kyc/upload — upload ID document
router.post('/upload', protect, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Document file required' });
    const url = getFileUrl(req, req.file.filename);
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { kycDocumentUrl: url, kycStatus: 'pending', kycSubmittedAt: new Date() },
      { new: true }
    ).select('-reviews');
    res.json({ user, message: 'Document uploaded successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/kyc/selfie — upload selfie
router.post('/selfie', protect, upload.single('selfie'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Selfie file required' });
    const url = getFileUrl(req, req.file.filename);
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { selfieUrl: url },
      { new: true }
    ).select('-reviews');
    res.json({ user, message: 'Selfie uploaded successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/kyc/status
router.get('/status', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      'kycStatus kycDocumentUrl kycSubmittedAt selfieUrl faceVerified'
    );
    res.json({
      kycStatus: user.kycStatus,
      kycDocumentUrl: user.kycDocumentUrl,
      kycSubmittedAt: user.kycSubmittedAt,
      selfieUrl: user.selfieUrl,
      faceVerified: user.faceVerified,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/kyc/approve/:userId — admin action
router.post('/approve/:userId', protect, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be verified or rejected' });
    }
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { kycStatus: status },
      { new: true }
    ).select('-reviews');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
