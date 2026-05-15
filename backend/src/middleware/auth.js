const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-__v');
    if (!user) return res.status(401).json({ message: 'User not found' });

    // 3-day soft delete — if user hasn't logged in within 3 days of requesting deletion, delete now
    if (user.pendingDeletion && user.deletionRequestedAt) {
      const daysSinceRequest = (Date.now() - new Date(user.deletionRequestedAt)) / (1000 * 60 * 60 * 24);
      if (daysSinceRequest >= 3) {
        await User.findByIdAndDelete(user._id);
        return res.status(401).json({ message: 'Account has been permanently deleted', deleted: true });
      }
      // User logged in within 3 days — cancel the deletion automatically
      await User.findByIdAndUpdate(user._id, { pendingDeletion: false, deletionRequestedAt: null });
      user.pendingDeletion = false;
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalid or expired' });
  }
};

module.exports = { protect };
