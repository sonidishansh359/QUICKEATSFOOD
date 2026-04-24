const express = require('express');
const router = express.Router();
const PromoCode = require('../models/PromoCode');
const Restaurant = require('../models/Restaurant');
const ownerAuth = require('../middleware/ownerAuth');
const auth = require('../middleware/auth');

// Generate new promo code (owner only)
router.post('/generate', ownerAuth, async (req, res) => {
  try {
    console.log('\n=== GENERATE PROMO CODE REQUEST ===');
    console.log('Owner ID:', req.owner?._id);
    console.log('Request body:', req.body);
    
    const { restaurantId, code, description, discountPercentage, minOrderAmount, expiryDate } = req.body;

    // Validate input
    if (!code || !restaurantId) {
      console.log('❌ Validation failed: Missing code or restaurantId');
      return res.status(400).json({ message: 'Code and restaurant ID are required' });
    }

    // Check if promo code already exists
    const existingCode = await PromoCode.findOne({ code: code.toUpperCase() });
    if (existingCode) {
      return res.status(400).json({ message: 'This promo code already exists' });
    }

    // Verify restaurant belongs to owner
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant || restaurant.owner.toString() !== req.owner._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized: Restaurant does not belong to you' });
    }

    // Create new promo code
    const promoCode = new PromoCode({
      code: code.toUpperCase(),
      restaurant: restaurantId,
      owner: req.owner._id,
      description: description || '',
      discountPercentage: discountPercentage || 10,
      minOrderAmount: minOrderAmount || 0,
      expiryDate: expiryDate || null,
      isActive: true
    });

    await promoCode.save();

    console.log('✅ Promo code generated:', {
      code: promoCode.code,
      restaurant: restaurant.name,
      discount: promoCode.discountPercentage + '%'
    });

    res.status(201).json({
      message: 'Promo code generated successfully',
      promoCode
    });
  } catch (err) {
    console.error('❌ Error generating promo code:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get promo codes for owner's restaurants
router.get('/owner/list', ownerAuth, async (req, res) => {
  try {
    const promoCodes = await PromoCode.find({ owner: req.owner._id })
      .populate('restaurant', 'name')
      .sort({ createdAt: -1 });

    res.json(promoCodes);
  } catch (err) {
    console.error('❌ Error fetching promo codes:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get promo codes for a specific restaurant (public)
router.get('/restaurant/:restaurantId', async (req, res) => {
  try {
    const promoCodes = await PromoCode.find({
      restaurant: req.params.restaurantId,
      isActive: true,
      $or: [
        { expiryDate: null },
        { expiryDate: { $gte: new Date() } }
      ]
    }).select('code discountPercentage description minOrderAmount');

    res.json(promoCodes);
  } catch (err) {
    console.error('❌ Error fetching promo codes:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Validate promo code
router.post('/validate', auth, async (req, res) => {
  try {
    console.log('\n=== VALIDATE PROMO CODE ===');
    console.log('Request body:', req.body);
    
    const { code, restaurantId, orderAmount } = req.body;

    if (!code) {
      console.log('❌ Validation failed: Missing code');
      return res.status(400).json({ valid: false, message: 'Promo code is required' });
    }
    
    if (!restaurantId) {
      console.log('❌ Validation failed: Missing restaurantId');
      return res.status(400).json({ valid: false, message: 'Restaurant ID is required' });
    }

    if (!orderAmount || orderAmount <= 0) {
      console.log('❌ Validation failed: Invalid orderAmount');
      return res.status(400).json({ valid: false, message: 'Valid order amount is required' });
    }

    console.log(`🔍 Looking for promo code: ${code} for restaurant: ${restaurantId}`);

    const promoCode = await PromoCode.findOne({
      code: code.toUpperCase(),
      restaurant: restaurantId,
      isActive: true
    });

    if (!promoCode) {
      console.log('❌ Promo code not found or inactive');
      return res.status(400).json({ valid: false, message: 'Invalid promo code' });
    }

    console.log('✅ Promo code found:', promoCode.code);

    // Check expiry
    if (promoCode.expiryDate && promoCode.expiryDate < new Date()) {
      return res.status(400).json({ valid: false, message: 'Promo code has expired' });
    }

    // Check usage limit
    if (promoCode.usageLimit && promoCode.usageCount >= promoCode.usageLimit) {
      return res.status(400).json({ valid: false, message: 'Promo code usage limit exceeded' });
    }

    // Check minimum order amount
    if (orderAmount < promoCode.minOrderAmount) {
      return res.status(400).json({ 
        valid: false, 
        message: `Minimum order amount of ₹${promoCode.minOrderAmount} required` 
      });
    }

    // Calculate discount
    const discountAmount = (orderAmount * promoCode.discountPercentage) / 100;

    res.json({
      valid: true,
      message: 'Promo code is valid',
      promoCode: {
        id: promoCode._id,
        code: promoCode.code,
        discountPercentage: promoCode.discountPercentage,
        discountAmount: discountAmount,
        description: promoCode.description
      }
    });
  } catch (err) {
    console.error('❌ Error validating promo code:', err);
    res.status(500).json({ valid: false, message: 'Server error' });
  }
});

// Delete promo code (owner only)
router.delete('/:id', ownerAuth, async (req, res) => {
  try {
    const promoCode = await PromoCode.findById(req.params.id);

    if (!promoCode) {
      return res.status(404).json({ message: 'Promo code not found' });
    }

    // Verify ownership
    if (promoCode.owner.toString() !== req.owner._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await PromoCode.findByIdAndDelete(req.params.id);

    console.log('✅ Promo code deleted:', promoCode.code);

    res.json({ message: 'Promo code deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting promo code:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle promo code active status (owner only)
router.patch('/:id/toggle', ownerAuth, async (req, res) => {
  try {
    const promoCode = await PromoCode.findById(req.params.id);

    if (!promoCode) {
      return res.status(404).json({ message: 'Promo code not found' });
    }

    // Verify ownership
    if (promoCode.owner.toString() !== req.owner._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    promoCode.isActive = !promoCode.isActive;
    await promoCode.save();

    res.json({
      message: `Promo code ${promoCode.isActive ? 'activated' : 'deactivated'}`,
      promoCode
    });
  } catch (err) {
    console.error('❌ Error toggling promo code:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
