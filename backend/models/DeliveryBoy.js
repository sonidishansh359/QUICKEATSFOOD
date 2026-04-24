const mongoose = require('mongoose');

const deliveryHistorySchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  restaurantName: String,
  customerName: String,
  items: String,
  totalAmount: Number,
  earnings: Number,
  acceptedTime: String,
  deliveredTime: String,
  deliveryTime: Number,
  date: String
}, { _id: false });

const deliveryBoySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  phone: { type: String },
  vehicleType: { type: String, enum: ['bike', 'car', 'scooter'], required: true },
  licenseNumber: { type: String, required: true },
  isAvailable: { type: Boolean, default: true },
  // Delivery boy live location for real-time tracking
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    }
  },
  address: { type: String },
  lastLocationUpdate: { type: Date },
  currentOrders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  earnings: { type: Number, default: 0 },
  availableBalance: { type: Number, default: 0 },
  earningsBreakdown: {
    today: { type: Number, default: 0 },
    todayOrders: { type: Number, default: 0 },
    thisWeek: { type: Number, default: 0 },
    weeklyOrders: { type: Number, default: 0 },
    thisMonth: { type: Number, default: 0 },
    monthlyOrders: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
    lastResetDate: { type: String, default: () => new Date().toISOString().split('T')[0] }
  },
  deliveryHistory: [deliveryHistorySchema],
  totalDeliveries: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 }, // Total number of ratings
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }], // Array of review IDs
  createdAt: { type: Date, default: Date.now }
});

// Create 2dsphere index for geospatial queries
deliveryBoySchema.index({ 'location': '2dsphere' });

module.exports = mongoose.model('DeliveryBoy', deliveryBoySchema);
