const express = require('express');
const router = express.Router();
const Parcel = require('../models/Parcel');
const { protect } = require('../middleware/auth');
const { upload, getFileUrl } = require('../utils/upload');

// GET /api/parcels - List all open parcels (public)
router.get('/', async (req, res) => {
  try {
    const { from, to, status } = req.query;
    const filter = {};

    if (status) filter.status = status;
    else filter.status = 'open';

    if (from) filter.fromCity = { $regex: new RegExp(from, 'i') };
    if (to) filter.toCity = { $regex: new RegExp(to, 'i') };

    const parcels = await Parcel.find(filter)
      .populate('userId', 'name profileImage maskedPhone rating totalRatings kycStatus')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ parcels });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/parcels/my - My parcels (as sender OR traveler)
router.get('/my', protect, async (req, res) => {
  try {
    const parcels = await Parcel.find({
      $or: [{ userId: req.user._id }, { travelerId: req.user._id }],
    })
      .populate('userId', 'name maskedPhone rating kycStatus')
      .populate('travelerId', 'name maskedPhone rating kycStatus')
      .sort({ createdAt: -1 });
    res.json({ parcels });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/parcels - Create parcel request
router.post('/', protect, async (req, res) => {
  try {
    const { fromCity, toCity, weight, itemType, description, pickupStation, dropStation } = req.body;

    if (!fromCity || !toCity || !weight || !itemType || !description) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    const parcel = await Parcel.create({
      userId: req.user._id,
      fromCity,
      toCity,
      weight,
      itemType,
      description,
      pickupStation: pickupStation || '',
      dropStation: dropStation || '',
    });

    await parcel.populate('userId', 'name profileImage maskedPhone rating kycStatus');
    res.status(201).json({ parcel });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/parcels/by-sender/:userId — active parcels posted by a given user (for offer linking)
router.get('/by-sender/:userId', protect, async (req, res) => {
  try {
    const parcels = await Parcel.find({
      userId: req.params.userId,
      status: { $nin: ['delivered', 'cancelled'] },
    })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json({ parcels });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/parcels/:id/accept — traveler accepts parcel; optionally locks in offeredPrice
router.post('/:id/accept', protect, async (req, res) => {
  try {
    const parcel = await Parcel.findById(req.params.id);
    if (!parcel) return res.status(404).json({ message: 'Parcel not found' });
    if (parcel.status !== 'open') return res.status(400).json({ message: 'Parcel is not available' });
    if (parcel.userId.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot accept your own parcel' });
    }

    parcel.travelerId = req.user._id;
    parcel.status = 'accepted';
    parcel.acceptedAt = new Date();
    if (req.body.offeredPrice) parcel.offeredPrice = Number(req.body.offeredPrice);
    await parcel.save();
    await parcel.populate('userId', 'name maskedPhone rating');
    await parcel.populate('travelerId', 'name maskedPhone rating');
    res.json({ parcel });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/parcels/:id/cancel
router.post('/:id/cancel', protect, async (req, res) => {
  try {
    const parcel = await Parcel.findById(req.params.id);
    if (!parcel) return res.status(404).json({ message: 'Parcel not found' });

    const isOwner = parcel.userId.toString() === req.user._id.toString();
    const isTraveler = parcel.travelerId?.toString() === req.user._id.toString();
    if (!isOwner && !isTraveler) return res.status(403).json({ message: 'Not authorized' });

    parcel.status = 'cancelled';
    await parcel.save();
    res.json({ parcel });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/parcels/:id/pickup-photo
router.post('/:id/pickup-photo', protect, upload.single('photo'), async (req, res) => {
  try {
    const parcel = await Parcel.findById(req.params.id);
    if (!parcel) return res.status(404).json({ message: 'Parcel not found' });
    if (parcel.travelerId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the traveler can upload pickup photo' });
    }
    if (parcel.status !== 'accepted') {
      return res.status(400).json({ message: 'Parcel must be accepted before pickup photo' });
    }
    if (!req.file) return res.status(400).json({ message: 'Photo required' });

    parcel.pickupPhotoUrl = getFileUrl(req, req.file.filename);
    await parcel.save();
    res.json({ parcel });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/parcels/:id/delivery-photo
router.post('/:id/delivery-photo', protect, upload.single('photo'), async (req, res) => {
  try {
    const parcel = await Parcel.findById(req.params.id);
    if (!parcel) return res.status(404).json({ message: 'Parcel not found' });
    if (parcel.travelerId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the traveler can upload delivery photo' });
    }
    if (parcel.status !== 'picked') {
      return res.status(400).json({ message: 'Parcel must be picked up before delivery photo' });
    }
    if (!req.file) return res.status(400).json({ message: 'Photo required' });

    parcel.deliveryPhotoUrl = getFileUrl(req, req.file.filename);
    await parcel.save();
    res.json({ parcel });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/parcels/:id
router.patch('/:id', protect, async (req, res) => {
  try {
    const parcel = await Parcel.findById(req.params.id);
    if (!parcel) return res.status(404).json({ message: 'Parcel not found' });

    const isOwner = parcel.userId.toString() === req.user._id.toString();
    const isTraveler = parcel.travelerId?.toString() === req.user._id.toString();
    if (!isOwner && !isTraveler) return res.status(403).json({ message: 'Not authorized' });

    const allowedFields = ['offeredPrice', 'description', 'notes'];
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) parcel[key] = req.body[key];
    }
    await parcel.save();
    res.json({ parcel });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/parcels/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const parcel = await Parcel.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!parcel) return res.status(404).json({ message: 'Parcel not found or not authorized' });
    res.json({ message: 'Parcel deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
