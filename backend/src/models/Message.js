const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId:{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:      { type: String, default: '', trim: true },
  imageUrl:  { type: String, default: null },
  read:      { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
  type:      { type: String, enum: ['text', 'offer', 'image'], default: 'text' },
  amount:    { type: Number, default: null },
});

messageSchema.index({ senderId: 1, receiverId: 1, timestamp: -1 });

module.exports = mongoose.model('Message', messageSchema);
