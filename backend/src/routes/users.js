const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Parcel = require('../models/Parcel');

// GET /api/users/:id — public traveler profile + delivered parcel count
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('name profileImage rating totalRatings kycStatus tripsCompleted createdAt')
      .lean({ virtuals: true });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const deliveredCount = await Parcel.countDocuments({
      travelerId: req.params.id,
      status: 'delivered',
    });

    res.json({ user: { ...user, deliveredCount } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
