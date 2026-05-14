const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  phone:     { type: String, required: true, index: true },
  code:      { type: String, required: true },
  attempts:  { type: Number, default: 0 },
  expiresAt: { type: Date,   required: true },
});

// MongoDB auto-deletes documents once expiresAt passes
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Otp', schema);
