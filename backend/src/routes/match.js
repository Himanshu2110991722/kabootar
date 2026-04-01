const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');
const Parcel = require('../models/Parcel');
const { protect } = require('../middleware/auth');

// GET /api/match/parcel/:parcelId - Find matching trips for a parcel
router.get('/parcel/:parcelId', protect, async (req, res) => {
  try {
    const parcel = await Parcel.findById(req.params.parcelId);
    if (!parcel) return res.status(404).json({ message: 'Parcel not found' });

    const { fromCity, toCity, weight } = parcel;

    // Date window: ±3 days from today
    const now = new Date();
    const windowEnd = new Date();
    windowEnd.setDate(windowEnd.getDate() + 30);

    const trips = await Trip.find({
      fromCity: { $regex: new RegExp(`^${fromCity}$`, 'i') },
      toCity: { $regex: new RegExp(`^${toCity}$`, 'i') },
      availableWeight: { $gte: weight },
      date: { $gte: now, $lte: windowEnd },
      status: 'active',
    })
      .populate('userId', 'name phone rating totalRatings createdAt')
      .sort({ date: 1 })
      .limit(20);

    res.json({ trips, parcel });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/match/trip/:tripId - Find matching parcels for a trip
router.get('/trip/:tripId', protect, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const { fromCity, toCity, availableWeight, date } = trip;

    const windowStart = new Date(date);
    windowStart.setDate(windowStart.getDate() - 2);
    const windowEnd = new Date(date);
    windowEnd.setDate(windowEnd.getDate() + 2);

    const parcels = await Parcel.find({
      fromCity: { $regex: new RegExp(`^${fromCity}$`, 'i') },
      toCity: { $regex: new RegExp(`^${toCity}$`, 'i') },
      weight: { $lte: availableWeight },
      status: 'open',
    })
      .populate('userId', 'name phone rating totalRatings createdAt')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ parcels, trip });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
