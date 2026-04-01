const mongoose = require('mongoose');

const parcelSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fromCity: { type: String, required: true, trim: true },
    toCity: { type: String, required: true, trim: true },
    weight: { type: Number, required: true, min: 0.1 },
    itemType: {
      type: String,
      enum: ['documents', 'electronics', 'clothes', 'others'],
      required: true,
    },
    description: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['open', 'matched', 'in_transit', 'delivered'],
      default: 'open',
    },
    matchedTripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', default: null },
    offeredPrice: { type: Number, default: null },
  },
  { timestamps: true }
);

parcelSchema.index({ fromCity: 1, toCity: 1, status: 1 });

module.exports = mongoose.model('Parcel', parcelSchema);
