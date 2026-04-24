const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  // Delivery boy feedback fields
  deliveryBoy: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryBoy' },
  deliveryRating: { type: Number, min: 1, max: 5 },
  deliveryComment: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', reviewSchema);
