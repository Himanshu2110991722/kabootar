const express = require('express');
const router  = express.Router();
const Poll    = require('../models/Poll');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');

// GET active poll (public)
router.get('/active', async (req, res) => {
  try {
    const poll = await Poll.findOne({ active: true }).sort({ createdAt: -1 }).lean();
    res.json({ poll: poll || null });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET all polls (admin)
router.get('/', adminOnly, async (req, res) => {
  try {
    const polls = await Poll.find().sort({ createdAt: -1 }).lean();
    res.json({ polls });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST vote on a poll
router.post('/:id/vote', protect, async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const poll = await Poll.findById(req.params.id);
    if (!poll || !poll.active) return res.status(400).json({ message: 'Poll is not active' });
    if (optionIndex === undefined || optionIndex < 0 || optionIndex >= poll.options.length)
      return res.status(400).json({ message: 'Invalid option' });

    const alreadyVoted = poll.options.some(o => o.votes.map(v => v.toString()).includes(req.user._id.toString()));
    if (alreadyVoted) return res.status(400).json({ message: 'Already voted' });

    poll.options[optionIndex].votes.push(req.user._id);
    poll.totalVotes = (poll.totalVotes || 0) + 1;
    await poll.save();
    res.json({ poll });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST create poll (admin)
router.post('/', adminOnly, async (req, res) => {
  try {
    const { question, options, endsAt } = req.body;
    if (!question || !Array.isArray(options) || options.length < 2)
      return res.status(400).json({ message: 'question and at least 2 options required' });
    const poll = await Poll.create({
      question,
      options: options.map(text => ({ text, votes: [] })),
      endsAt,
    });
    res.status(201).json({ poll });
  } catch (e) { res.status(400).json({ message: e.message }); }
});

// PATCH end poll (admin)
router.patch('/:id/end', adminOnly, async (req, res) => {
  try {
    const poll = await Poll.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
    if (!poll) return res.status(404).json({ message: 'Poll not found' });
    res.json({ poll });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PATCH activate poll (admin)
router.patch('/:id/activate', adminOnly, async (req, res) => {
  try {
    // deactivate all others first
    await Poll.updateMany({}, { active: false });
    const poll = await Poll.findByIdAndUpdate(req.params.id, { active: true }, { new: true });
    if (!poll) return res.status(404).json({ message: 'Poll not found' });
    res.json({ poll });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// DELETE poll (admin)
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    await Poll.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST seed demo polls (admin)
router.post('/seed', adminOnly, async (req, res) => {
  try {
    await Poll.deleteMany({});
    const poll = await Poll.create({
      question: "What's the hardest part of train travel?",
      options: [
        { text: 'RAC Seat',         votes: [] },
        { text: 'Upper Berth',      votes: [] },
        { text: 'Sleeper Washroom', votes: [] },
        { text: 'Network Problem',  votes: [] },
      ],
      active: true,
    });
    res.json({ poll });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
