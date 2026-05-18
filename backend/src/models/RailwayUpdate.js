const mongoose = require('mongoose');

const railwayUpdateSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String },
  image:       { type: String },
  source:      { type: String, default: 'Indian Railways' },
  link:        { type: String },
  active:      { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('RailwayUpdate', railwayUpdateSchema);
