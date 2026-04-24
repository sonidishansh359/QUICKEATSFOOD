const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner', required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'processed', 'failed'], default: 'pending' },
    razorpayPayoutId: { type: String },
    method: { type: String, default: 'bank_transfer' }, // bank, upi, etc.
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payout', payoutSchema);
