const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:   { type: String, required: true },
  avatar: { type: String },
  text:   { type: String, required: true, maxlength: 300 },
}, { timestamps: true });

const schema = new mongoose.Schema({
  title:    { type: String, required: true },
  content:  { type: String, required: true },
  image:    { type: String },
  emoji:    { type: String, default: '🕊️' },
  stats: {
    route: String,
    time:  String,
    saved: String,
  },
  likes:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [commentSchema],
  active:   { type: Boolean, default: true },
  featured: { type: Boolean, default: false }, // appears in stories strip
  createdBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

schema.index({ active: 1, featured: -1, createdAt: -1 });

module.exports = mongoose.model('Post', schema);
