const express = require('express');
const router = express.Router();
const Parcel = require('../models/Parcel');
const { protect } = require('../middleware/auth');
const { notify } = require('../utils/notifications');

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// POST /api/otp/pickup/generate
router.post('/pickup/generate', protect, async (req, res) => {
  try {
    const { parcelId } = req.body;
    const parcel = await Parcel.findById(parcelId);
    if (!parcel) return res.status(404).json({ message: 'Parcel not found' });

    if (parcel.travelerId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the traveler can generate pickup OTP' });
    }
    if (parcel.status !== 'accepted') {
      return res.status(400).json({ message: 'Parcel must be in accepted state' });
    }

    const otp = generateOtp();
    parcel.pickupOtp = otp;
    parcel.pickupOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await parcel.save();

    // In production: SMS the OTP to parcel.userId's phone number
    res.json({ message: 'OTP sent to sender', otp });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/otp/pickup/verify
router.post('/pickup/verify', protect, async (req, res) => {
  try {
    const { parcelId, otp } = req.body;
    const parcel = await Parcel.findById(parcelId);
    if (!parcel) return res.status(404).json({ message: 'Parcel not found' });

    if (parcel.travelerId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (parcel.pickupOtp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
    if (!parcel.pickupOtpExpiry || parcel.pickupOtpExpiry < new Date()) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    parcel.status = 'picked';
    parcel.pickedAt = new Date();
    parcel.pickupOtp = null;
    parcel.pickupOtpExpiry = null;
    await parcel.save();

    res.json({ parcel, message: 'Pickup confirmed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/otp/delivery/generate
router.post('/delivery/generate', protect, async (req, res) => {
  try {
    const { parcelId } = req.body;
    const parcel = await Parcel.findById(parcelId);
    if (!parcel) return res.status(404).json({ message: 'Parcel not found' });

    if (parcel.travelerId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the traveler can generate delivery OTP' });
    }
    if (parcel.status !== 'picked') {
      return res.status(400).json({ message: 'Parcel must be picked up first' });
    }

    const otp = generateOtp();
    parcel.deliveryOtp = otp;
    parcel.deliveryOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    parcel.status = 'in_transit';
    await parcel.save();

    res.json({ message: 'OTP sent to sender', otp });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/otp/delivery/verify
router.post('/delivery/verify', protect, async (req, res) => {
  try {
    const { parcelId, otp } = req.body;
    const parcel = await Parcel.findById(parcelId);
    if (!parcel) return res.status(404).json({ message: 'Parcel not found' });

    if (parcel.travelerId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (parcel.deliveryOtp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
    if (!parcel.deliveryOtpExpiry || parcel.deliveryOtpExpiry < new Date()) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    parcel.status = 'delivered';
    parcel.deliveredAt = new Date();
    parcel.deliveryOtp = null;
    parcel.deliveryOtpExpiry = null;
    await parcel.save();

    // Notify sender to confirm receipt (button appears in their My Parcels)
    notify(parcel.userId, {
      title: '📦 Parcel arrived! Please confirm receipt',
      body:  `Your parcel from ${parcel.fromCity} → ${parcel.toCity} has been delivered. Tap to confirm.`,
      type:  'parcel',
      data:  { type: 'awaiting_confirmation', parcelId: String(parcel._id), screen: '/my-parcels' },
    });

    // Real-time prompt to sender
    const User = require('../models/User');
    const sender = await User.findById(parcel.userId).select('_id');
    if (sender) {
      req.io?.to(String(sender._id)).emit('parcel_awaiting_confirmation', {
        parcelId: String(parcel._id),
        message:  'Your parcel has arrived! Please confirm receipt.',
      });
    }

    res.json({ parcel, message: 'Delivery confirmed — awaiting sender confirmation' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
