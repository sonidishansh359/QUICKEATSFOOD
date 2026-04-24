const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  cuisine: { type: String },
  address: { type: String, required: true },
  phone: { type: String },
  image: { type: String, required: true },
  isOpen: { type: Boolean, default: true },
  rating: { type: Number, default: 0 },
  deliveryTime: { type: String },
  minOrder: { type: Number, default: 10 },
  openingTime: { type: String }, // Format: "HH:mm"
  openingPeriod: { type: String, enum: ['AM', 'PM'] },
  closingTime: { type: String }, // Format: "HH:mm"
  closingPeriod: { type: String, enum: ['AM', 'PM'] },
  // Geospatial location field for proximity queries
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
  city: { type: String },
  state: { type: String },
  zipCode: { type: String },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner' },
  createdAt: { type: Date, default: Date.now },
  approved: { type: Boolean, default: false }, // Admin approval required
  deleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  deletedBy: { type: String },
  // Verification for Admin Approval
  verification: {
    aadharRequested: { type: Boolean, default: false },
    aadharImage: { type: String }, // Base64
    adminMessage: { type: String },
    ownerResponse: { type: String },
    status: {
      type: String,
      enum: ['none', 'requested', 'submitted', 'verified', 'rejected'],
      default: 'none'
    }
  }
});

// Create 2dsphere index for geospatial queries
restaurantSchema.index({ 'location': '2dsphere' });

module.exports = mongoose.model('Restaurant', restaurantSchema);
