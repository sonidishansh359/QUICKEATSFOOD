const mongoose = require('mongoose');

const reportLogSchema = new mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reportType: {
        type: String,
        required: true,
        enum: ['orders', 'revenue', 'users', 'restaurants', 'delivery', 'profit_loss']
    },
    filtersUsed: {
        type: Object,
        default: {}
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ReportLog', reportLogSchema);
