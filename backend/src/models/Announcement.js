const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  title:     { type: String, required: true },
  body:      { type: String, required: true },
  icon:      { type: String, default: '📢' },
  type:      { type: String, enum: ['info', 'warning', 'alert', 'feature'], default: 'info' },
  pinned:    { type: Boolean, default: false },
  active:    { type: Boolean, default: true },
  expiresAt: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

schema.index({ active: 1, pinned: -1, createdAt: -1 });

module.exports = mongoose.model('Announcement', schema);
