const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner' },
    deliveryBoy: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryBoy' },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },

    amount: { type: Number, required: true }, // Positive for earning, Negative for withdrawal (or just positive with type)
    type: { type: String, enum: ['earning', 'withdrawal', 'refund'], required: true },
    status: { type: String, enum: ['success', 'pending', 'failed'], default: 'success' },
    referenceId: { type: String }, // orderId or paymentId/payoutId
    description: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', transactionSchema);
