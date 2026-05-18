const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  text:  { type: String, required: true },
  votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { _id: false });

const pollSchema = new mongoose.Schema({
  question:   { type: String, required: true },
  options:    { type: [optionSchema], validate: v => v.length >= 2 && v.length <= 6 },
  active:     { type: Boolean, default: true },
  endsAt:     { type: Date },
  totalVotes: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Poll', pollSchema);
