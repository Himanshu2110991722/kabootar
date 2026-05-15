const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  reporter:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reportedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: {
    type: String,
    enum: ['spam', 'harassment', 'fake_account', 'fraud', 'inappropriate_content', 'other'],
    required: true,
  },
  description: { type: String, maxlength: 500, default: '' },
  status: { type: String, enum: ['pending', 'reviewed', 'resolved'], default: 'pending' },
}, { timestamps: true });

schema.index({ reportedUser: 1, status: 1 });
schema.index({ reporter: 1, reportedUser: 1 }, { unique: true }); // one report per pair

module.exports = mongoose.model('Report', schema);
