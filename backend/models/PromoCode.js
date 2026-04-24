const mongoose = require('mongoose');

const promoCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner', required: true },
  discountPercentage: { type: Number, default: 10, min: 0, max: 100 },
  description: { type: String },
  isActive: { type: Boolean, default: true },
  usageLimit: { type: Number, default: null }, // null = unlimited
  usageCount: { type: Number, default: 0 },
  minOrderAmount: { type: Number, default: 0 }, // Minimum order amount to use this code
  expiryDate: { type: Date, default: null }, // null = never expires
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PromoCode', promoCodeSchema);
