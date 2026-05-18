const express = require('express');
const router  = express.Router();
const RailwayUpdate = require('../models/RailwayUpdate');
const { adminOnly } = require('../middleware/admin');

const SEED_UPDATES = [
  {
    title: 'Indian Railways to run special trains for summer rush',
    description: 'Over 200 special trains announced for peak summer travel season. Book early on IRCTC.',
    source: 'IRCTC News',
  },
  {
    title: 'New Vande Bharat route announced: Patna to Howrah',
    description: 'The Vande Bharat Express will connect Patna and Howrah in just 5 hours, cutting travel time by 2 hours.',
    source: 'Railway Ministry',
  },
  {
    title: 'Tatkal ticket booking rules updated for AC classes',
    description: 'IRCTC updates Tatkal quota opening time to 10 AM for all AC classes starting June 2025.',
    source: 'IRCTC',
  },
  {
    title: 'New AC 3-tier Economy coaches on popular routes',
    description: 'Budget-friendly AC travel now available on 50+ major routes including Patna–Delhi and Mumbai–Pune.',
    source: 'Indian Railways',
  },
];

// GET latest updates (public) — auto-seeds if empty
router.get('/', async (req, res) => {
  try {
    let updates = await RailwayUpdate.find({ active: true }).sort({ createdAt: -1 }).limit(10).lean();
    if (updates.length === 0) {
      await RailwayUpdate.insertMany(SEED_UPDATES);
      updates = await RailwayUpdate.find({ active: true }).sort({ createdAt: -1 }).limit(10).lean();
    }
    res.json({ updates });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST seed (admin)
router.post('/seed', adminOnly, async (req, res) => {
  try {
    await RailwayUpdate.deleteMany({});
    const updates = await RailwayUpdate.insertMany(SEED_UPDATES);
    res.json({ updates });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST create update (admin)
router.post('/', adminOnly, async (req, res) => {
  try {
    const update = await RailwayUpdate.create(req.body);
    res.status(201).json({ update });
  } catch (e) { res.status(400).json({ message: e.message }); }
});

// PATCH update (admin)
router.patch('/:id', adminOnly, async (req, res) => {
  try {
    const update = await RailwayUpdate.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!update) return res.status(404).json({ message: 'Not found' });
    res.json({ update });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// DELETE update (admin)
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    await RailwayUpdate.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
