const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');
const { protect } = require('../middleware/auth');

// GET /api/trips - List all active trips
router.get('/', async (req, res) => {
  try {
    const { from, to, date } = req.query;
    const filter = { status: 'active' };

    if (from) filter.fromCity = { $regex: new RegExp(from, 'i') };
    if (to) filter.toCity = { $regex: new RegExp(to, 'i') };
    if (date) {
      const d = new Date(date);
      const next = new Date(date);
      next.setDate(next.getDate() + 1);
      filter.date = { $gte: d, $lt: next };
    }

    const trips = await Trip.find(filter)
      .populate('userId', 'name phone rating totalRatings')
      .sort({ date: 1 })
      .limit(50);

    res.json({ trips });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/trips/my - My trips
router.get('/my', protect, async (req, res) => {
  try {
    const trips = await Trip.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ trips });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/trips - Create trip
router.post('/', protect, async (req, res) => {
  try {
    const { fromCity, toCity, date, transportMode, availableWeight, pricePerKg, notes } = req.body;

    if (!fromCity || !toCity || !date || !transportMode || !availableWeight || pricePerKg === undefined) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    const trip = await Trip.create({
      userId: req.user._id,
      fromCity,
      toCity,
      date,
      transportMode,
      availableWeight,
      pricePerKg,
      notes,
    });

    await trip.populate('userId', 'name phone rating');
    res.status(201).json({ trip });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/trips/:id - Update trip
router.patch('/:id', protect, async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user._id });
    if (!trip) return res.status(404).json({ message: 'Trip not found or not authorized' });

    Object.assign(trip, req.body);
    await trip.save();
    res.json({ trip });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/trips/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const trip = await Trip.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!trip) return res.status(404).json({ message: 'Trip not found or not authorized' });
    res.json({ message: 'Trip deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
