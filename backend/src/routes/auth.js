const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const User = require('../models/User');

// Initialize firebase admin lazily
let firebaseInitialized = false;
const initFirebase = () => {
  if (!firebaseInitialized && !admin.apps.length) {
    try {
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        : null;
      if (serviceAccount) {
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
        firebaseInitialized = true;
      }
    } catch (e) {
      console.warn('Firebase init warning:', e.message);
    }
  }
};

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// POST /api/auth/verify
// Verify Firebase ID token and create/login user
router.post('/verify', async (req, res) => {
  const body = req.body || {};
  const { idToken, name } = body;
  if (!idToken) return res.status(400).json({ message: 'idToken required' });

  try {
    initFirebase();

    let firebaseUid, phone;

    // Try real firebase verification
    if (admin.apps.length) {
      const decoded = await admin.auth().verifyIdToken(idToken);
      firebaseUid = decoded.uid;
      phone = decoded.phone_number;
    } else {
      // Dev fallback: decode JWT without verification (NOT for production)
      const parts = idToken.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        firebaseUid = payload.user_id || payload.sub || 'dev_uid';
        phone = payload.phone_number || '+910000000000';
      } else {
        return res.status(400).json({ message: 'Invalid token format' });
      }
    }

    // Find or create user
    let user = await User.findOne({ firebaseUid });

    if (!user) {
      if (!name) return res.status(400).json({ message: 'Name required for new users', newUser: true });
      // Google users may not have a phone number
      const resolvedPhone = phone || `google_${firebaseUid.slice(0, 10)}`;
      user = await User.create({ firebaseUid, name, phone: resolvedPhone });
    }

    const token = generateToken(user._id);
    res.json({
      token,
      user,
      requiresProfileCompletion: !user.isProfileComplete,
    });
  } catch (err) {
    console.error('Auth error:', err);
    res.status(401).json({ message: 'Authentication failed', error: err.message });
  }
});

// POST /api/auth/profile - Update profile
router.post('/profile', async (req, res) => {
  const { idToken, name } = req.body;
  if (!idToken || !name) return res.status(400).json({ message: 'idToken and name required' });

  try {
    initFirebase();
    let firebaseUid;
    if (admin.apps.length) {
      const decoded = await admin.auth().verifyIdToken(idToken);
      firebaseUid = decoded.uid;
    } else {
      const parts = idToken.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      firebaseUid = payload.user_id || payload.sub;
    }

    const user = await User.findOneAndUpdate({ firebaseUid }, { name }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me
const { protect } = require('../middleware/auth');
router.get('/me', protect, async (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/rate/:userId
router.post('/rate/:userId', protect, async (req, res) => {
  const { rating } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5' });
  }
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.ratingSum += rating;
    user.totalRatings += 1;
    user.rating = parseFloat((user.ratingSum / user.totalRatings).toFixed(1));
    await user.save();
    res.json({ rating: user.rating, totalRatings: user.totalRatings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/auth/me — update profile fields
router.patch('/me', protect, async (req, res) => {
  try {
    const allowed = ['name', 'bio', 'city', 'frequentRoute', 'profileImage'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (updates.name !== undefined && !String(updates.name).trim())
      return res.status(400).json({ message: 'Name cannot be empty' });
    if (updates.name) updates.name = updates.name.trim();
    if (updates.bio) updates.bio = String(updates.bio).slice(0, 160);
    if (updates.city) updates.city = updates.city.trim();

    if (req.body.phone !== undefined) {
      const phoneRegex = /^\+91[6-9]\d{9}$/;
      if (!phoneRegex.test(req.body.phone)) {
        return res.status(400).json({ message: 'Invalid phone. Use format +91XXXXXXXXXX' });
      }
      const taken = await User.findOne({
        phone: req.body.phone,
        _id: { $ne: req.user._id },
      });
      if (taken) {
        return res.status(409).json({ message: 'Phone number already registered to another account' });
      }
      updates.phone = req.body.phone;
      updates.isPhoneVerified = false;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-reviews');
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/me/image — upload profile photo (multer file → stored URL)
// Also accepts legacy { imageUrl } JSON body for backward compat
const { upload, getFileUrl } = require('../utils/upload');
router.post('/me/image', protect, upload.single('image'), async (req, res) => {
  try {
    let imageUrl;
    if (req.file) {
      imageUrl = getFileUrl(req, req.file.filename);
    } else if (req.body.imageUrl) {
      imageUrl = req.body.imageUrl; // legacy base64 fallback
    } else {
      return res.status(400).json({ message: 'Image file or imageUrl required' });
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profileImage: imageUrl },
      { new: true }
    ).select('-reviews');
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

