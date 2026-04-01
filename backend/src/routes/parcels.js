const express = require('express');
const router = express.Router();
const Parcel = require('../models/Parcel');
const { protect } = require('../middleware/auth');

// GET /api/parcels - List all open parcels
router.get('/', async (req, res) => {
  try {
    const { from, to, status } = req.query;
    const filter = {};

    if (status) filter.status = status;
    else filter.status = 'open';

    if (from) filter.fromCity = { $regex: new RegExp(from, 'i') };
    if (to) filter.toCity = { $regex: new RegExp(to, 'i') };

    const parcels = await Parcel.find(filter)
      .populate('userId', 'name phone rating totalRatings')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ parcels });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/parcels/my - My parcels
router.get('/my', protect, async (req, res) => {
  try {
    const parcels = await Parcel.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ parcels });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/parcels - Create parcel request
router.post('/', protect, async (req, res) => {
  try {
    const { fromCity, toCity, weight, itemType, description } = req.body;

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
    });

    await parcel.populate('userId', 'name phone rating');
    res.status(201).json({ parcel });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/parcels/:id
router.patch('/:id', protect, async (req, res) => {
  try {
    const parcel = await Parcel.findOne({ _id: req.params.id, userId: req.user._id });
    if (!parcel) return res.status(404).json({ message: 'Parcel not found or not authorized' });

    Object.assign(parcel, req.body);
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
