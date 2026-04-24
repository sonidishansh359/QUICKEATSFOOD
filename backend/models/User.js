const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String }, // Required for delivery boys, optional for others
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'owner', 'delivery_boy', 'admin'], required: true },
  // Geospatial location field
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
  // Soft-delete flag and recovery fields
  deleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  recoveryToken: { type: String },
  recoveryRequested: { type: Boolean, default: false },
  // Ban flag (admin-controlled)
  banned: { type: Boolean, default: false },
  bannedAt: { type: Date },
  // Address components for display
  address: { type: String },
  city: { type: String },
  state: { type: String },
  zipCode: { type: String },
  // Last location update timestamp
  lastLocationUpdate: { type: Date },
  profilePicture: { type: String }, // Base64 encoded image string
  createdAt: { type: Date, default: Date.now }
});

// Create indexes
userSchema.index({ 'location': '2dsphere' });
// Make phone index unique but sparse to allow multiple nulls (for users who don't provide phone)
userSchema.index({ 'phone': 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('User', userSchema);
