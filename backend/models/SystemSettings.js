const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
    commissionRate: {
        type: Number,
        required: true,
        default: 15, // Default 15%
        min: 0,
        max: 100
    },
    taxRate: {
        type: Number,
        required: true,
        default: 5, // Default 5%
        min: 0,
        max: 100
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure only one settings document exists
systemSettingsSchema.statics.getSettings = async function () {
    const settings = await this.findOne();
    if (settings) return settings;
    return await this.create({ commissionRate: 15, taxRate: 5 });
};

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
