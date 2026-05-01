const { protect } = require('./auth');

const adminOnly = async (req, res, next) => {
  await new Promise((resolve) => protect(req, res, resolve));
  if (res.headersSent) return; // protect already replied with 401
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

module.exports = { adminOnly };
