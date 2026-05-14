const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title:  { type: String, required: true },
  body:   { type: String, default: '' },
  type:   { type: String, default: 'system' }, // system | parcel | trip | message | kyc
  data:   { type: mongoose.Schema.Types.Mixed, default: {} },
  read:   { type: Boolean, default: false },
}, { timestamps: true });

// Auto-delete after 30 days
schema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('AppNotification', schema);
