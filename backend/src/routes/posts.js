const express = require('express');
const router  = express.Router();
const Post    = require('../models/Post');
const { protect } = require('../middleware/auth');

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  next();
};

// GET /api/posts — public feed
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find({ active: true })
      .select('-__v')
      .sort({ featured: -1, createdAt: -1 })
      .limit(20);
    res.json({ posts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/posts/seed — admin: seed sample posts (only if empty)
router.post('/seed', protect, adminOnly, async (req, res) => {
  try {
    const count = await Post.countDocuments();
    if (count > 0) return res.json({ message: 'Already seeded', count });

    const samples = [
      {
        title: '🚨 Emergency documents delivered in 18 hours!',
        emoji: '🚨',
        content: 'Ramesh needed his marksheet urgently for a Sunday interview in Delhi. No courier was available. He posted on Kabutar at 6 AM. By 8 AM, Priya — already travelling to Delhi — had accepted. The marksheet reached safely, 18 hours before the interview. "Kabutar literally saved my career moment," says Ramesh. This is what we built Kabutar for. 🕊️',
        stats: { route: 'Patna → Delhi', time: '18 hours', saved: '₹1,200' },
        featured: true,
        createdBy: req.user._id,
      },
      {
        title: '📚 UPSC books delivered — and a study partner found!',
        emoji: '📚',
        content: 'Ankit from Muzaffarpur urgently needed his UPSC study material in Lucknow before his mock test. On Kabutar he found Sachin — a working professional making the same trip. Books delivered safely in a single day. Fast-forward 3 months: Ankit and Sachin are now weekly study partners on a call. "Kabutar connected us as more than just sender and traveller," Ankit shares. Community > courier. 🤝',
        stats: { route: 'Muzaffarpur → Lucknow', time: 'Same day', saved: '₹600' },
        featured: true,
        createdBy: req.user._id,
      },
      {
        title: '🎁 Diwali sweets home — fresh the next morning!',
        emoji: '🎁',
        content: 'Pooja, working in Bangalore, wanted to send her mom\'s favourite homemade sweets to Darbhanga for Diwali. Every courier quoted 5–7 days. She posted on Kabutar. Within hours, Vikram — a traveller heading home for the same festival — accepted. The sweets reached fresh the next morning. Her mom called in tears. "This is not just delivery, this is dil se delivery," Pooja says. 🏠❤️',
        stats: { route: 'Bangalore → Darbhanga', time: 'Next morning', saved: '₹2,000' },
        featured: false,
        createdBy: req.user._id,
      },
    ];

    await Post.insertMany(samples);
    res.json({ message: 'Seeded 3 sample posts', count: 3 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/posts — admin: create post
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { title, content, image, emoji, stats, featured } = req.body;
    if (!title?.trim() || !content?.trim())
      return res.status(400).json({ message: 'title and content required' });
    const post = await Post.create({
      title: title.trim(), content: content.trim(),
      image, emoji: emoji || '🕊️', stats, featured,
      createdBy: req.user._id,
    });
    res.status(201).json({ post });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/posts/:id/like — toggle like (auth required)
router.patch('/:id/like', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Not found' });
    const uid   = req.user._id.toString();
    const liked = post.likes.map(l => l.toString()).includes(uid);
    if (liked) post.likes = post.likes.filter(l => l.toString() !== uid);
    else        post.likes.push(req.user._id);
    await post.save();
    res.json({ likes: post.likes.length, liked: !liked });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/posts/:id/comment — add comment (auth required)
router.post('/:id/comment', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'text required' });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Not found' });
    const comment = {
      userId: req.user._id,
      name:   req.user.name,
      avatar: req.user.profileImage || '',
      text:   text.trim().slice(0, 300),
    };
    post.comments.push(comment);
    await post.save();
    res.json({ comment: post.comments[post.comments.length - 1] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/posts/:id — admin: update
router.patch('/:id', protect, adminOnly, async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!post) return res.status(404).json({ message: 'Not found' });
    res.json({ post });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/posts/:id — admin: delete
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
