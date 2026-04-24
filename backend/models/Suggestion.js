const mongoose = require('mongoose');

const suggestionSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, trim: true, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Suggestion', suggestionSchema);
