const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    availableBalance: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    // Administrative settings or other fields can go here
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Middleware to update updatedAt
adminSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Admin', adminSchema);
