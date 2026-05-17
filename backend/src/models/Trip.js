const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fromCity: { type: String, required: true, trim: true },
    toCity: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    transportMode: {
      type: String,
      enum: ['train', 'flight', 'bus', 'car'],
      required: true,
    },
    availableWeight: { type: Number, required: true, min: 0.1 },
    pricePerKg: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
    notes:         { type: String, default: '' },
    departureTime: { type: String, default: '' }, // "HH:MM" 24-hour, optional
    arrivalTime:   { type: String, default: '' }, // expected arrival "HH:MM", optional
    pickupStation: { type: String, default: '' },
    dropStation: { type: String, default: '' },
    ticketUrl:    { type: String, default: '' },
    isVerified:   { type: Boolean, default: false },
    pnrNumber:    { type: String, default: '', trim: true },   // train PNR (10 digits)
    flightNumber: { type: String, default: '', trim: true },   // flight e.g. "AI302"
    trainNumber:  { type: String, default: '', trim: true },   // train number e.g. "12301"
  },
  { timestamps: true }
);

tripSchema.index({ fromCity: 1, toCity: 1, date: 1 });

module.exports = mongoose.model('Trip', tripSchema);
