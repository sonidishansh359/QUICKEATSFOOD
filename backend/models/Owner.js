const mongoose = require('mongoose');

const ownerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  restaurants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' }],
  earnings: { type: Number, default: 0 },
  availableBalance: { type: Number, default: 0 }, // Fund available for withdrawal
  // Owner's live location for real-time tracking
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
  // Bank Details for Payouts
  bankDetails: {
    accountNumber: { type: String, default: '1234567890' }, // Default test account
    ifsc: { type: String, default: 'SBIN0001234' },
    beneficiaryName: { type: String, default: 'Test Owner' }
  },
  createdAt: { type: Date, default: Date.now }
});

// Create 2dsphere index for geospatial queries
ownerSchema.index({ 'location': '2dsphere' });

module.exports = mongoose.model('Owner', ownerSchema);
