const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');
const { protect } = require('../middleware/auth');

// GET /api/trips - List all active trips (public)
router.get('/', async (req, res) => {
  try {
    const { from, to, date } = req.query;
    const filter = { status: 'active' };

    // Always hide past trips from the public listing
    const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);

    if (from) filter.fromCity = { $regex: new RegExp(from, 'i') };
    if (to)   filter.toCity   = { $regex: new RegExp(to,   'i') };
    if (date) {
      const d    = new Date(date);
      const next = new Date(date); next.setDate(next.getDate() + 1);
      // If searching a past date, return nothing (trips are already gone)
      filter.date = { $gte: d < startOfToday ? startOfToday : d, $lt: next };
    } else {
      filter.date = { $gte: startOfToday };
    }

    const trips = await Trip.find(filter)
      .populate('userId', 'name profileImage maskedPhone rating totalRatings kycStatus tripsCompleted city createdAt')
      .sort({ date: 1 })
      .limit(50);

    res.json({ trips });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/trips/my - My trips (all, including past — used for travel history)
router.get('/my', protect, async (req, res) => {
  try {
    const trips = await Trip.find({ userId: req.user._id }).sort({ date: -1 });
    res.json({ trips });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/trips - Create trip
router.post('/', protect, async (req, res) => {
  try {
    const { fromCity, toCity, date, transportMode, availableWeight, pricePerKg, notes, pickupStation, dropStation, departureTime, arrivalTime } = req.body;

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
      pickupStation:  pickupStation  || '',
      dropStation:    dropStation    || '',
      departureTime:  departureTime  || '',
      arrivalTime:    arrivalTime    || '',
    });

    await trip.populate('userId', 'name profileImage maskedPhone rating kycStatus tripsCompleted city');
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
