const express = require('express');
const router = express.Router();
const DeliveryBoy = require('../models/DeliveryBoy');
const Review = require('../models/Review');
const ownerAuth = require('../middleware/ownerAuth');
const auth = require('../middleware/auth');

// Get all delivery boys
router.get('/', ownerAuth, async (req, res) => {
  try {
    const deliveryBoys = await DeliveryBoy.find().populate('user', 'name email');
    res.json(deliveryBoys);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// MUST BE BEFORE /:deliveryBoyId routes
// Get current delivery boy profile
router.get('/me', auth, async (req, res) => {
  try {
    // Normalize role: 'delivery_boy' or 'delivery'
    const userRole = req.user.role === 'delivery_boy' ? 'delivery_boy' : req.user.role;
    if (userRole !== 'delivery_boy' && userRole !== 'delivery') {
      return res.status(403).json({ message: 'Access denied' });
    }

    let profile = await DeliveryBoy.findOne({ user: req.user.id }).populate('user', 'name email phone');

    // Auto-create profile if it doesn't exist
    if (!profile) {
      console.log('⚠️ Delivery boy profile not found, creating one...');
      const today = new Date().toISOString().split('T')[0];
      profile = new DeliveryBoy({
        user: req.user.id,
        vehicleType: 'bike',
        licenseNumber: 'TEMP-' + Date.now(),
        isAvailable: true,
        currentOrders: [],
        earnings: 0,
        earningsBreakdown: {
          today: 0,
          todayOrders: 0,
          thisWeek: 0,
          weeklyOrders: 0,
          thisMonth: 0,
          monthlyOrders: 0,
          pending: 0,
          lastResetDate: today
        },
        deliveryHistory: [],
        totalDeliveries: 0,
        rating: 0,
        totalRatings: 0,
        reviews: []
      });
      await profile.save();
      await profile.populate('user', 'name email');
      console.log('✅ Created delivery boy profile:', profile._id);
    }

    // Check if daily earnings need to be reset
    const today = new Date().toISOString().split('T')[0];
    if (profile.earningsBreakdown?.lastResetDate !== today) {
      profile.earningsBreakdown.today = 0;
      profile.earningsBreakdown.todayOrders = 0;
      profile.earningsBreakdown.lastResetDate = today;
      await profile.save();
    }

    // Get delivery boy's feedback stats
    const reviews = await Review.find({
      deliveryBoy: profile._id,
      deliveryRating: { $exists: true, $ne: null }
    });

    const feedbackStats = {
      totalReviews: reviews.length,
      averageRating: reviews.length > 0
        ? parseFloat((reviews.reduce((sum, r) => sum + r.deliveryRating, 0) / reviews.length).toFixed(1))
        : 0
    };

    res.json({
      name: profile.user?.name,
      email: profile.user?.email,
      phone: profile.user?.phone || profile.phone,
      vehicleType: profile.vehicleType,
      licenseNumber: profile.licenseNumber,
      isAvailable: profile.isAvailable,
      earnings: profile.earnings || 0,
      availableBalance: profile.availableBalance || 0,
      earningsBreakdown: profile.earningsBreakdown || {
        today: 0,
        todayOrders: 0,
        thisWeek: 0,
        weeklyOrders: 0,
        thisMonth: 0,
        monthlyOrders: 0,
        pending: 0
      },
      deliveryHistory: profile.deliveryHistory || [],
      totalDeliveries: profile.totalDeliveries || 0,
      rating: profile.rating || 0,
      totalRatings: profile.totalRatings || 0,
      feedback: feedbackStats,
      joinedDate: profile.createdAt,
    });
  } catch (err) {
    console.error('Failed to fetch delivery profile:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current delivery boy's reviews (authenticated endpoint)
router.get('/reviews/my-reviews', auth, async (req, res) => {
  try {
    // First find the delivery boy profile for this user
    const deliveryBoy = await DeliveryBoy.findOne({ user: req.user.id });

    if (!deliveryBoy) {
      return res.json({
        reviews: [],
        stats: {
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        }
      });
    }

    const reviews = await Review.find({
      deliveryBoy: deliveryBoy._id,
      deliveryRating: { $exists: true, $ne: null }
    })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    // Calculate statistics
    const stats = {
      totalReviews: reviews.length,
      averageRating: reviews.length > 0
        ? parseFloat((reviews.reduce((sum, r) => sum + r.deliveryRating, 0) / reviews.length).toFixed(1))
        : 0,
      ratingDistribution: {
        5: reviews.filter(r => r.deliveryRating === 5).length,
        4: reviews.filter(r => r.deliveryRating === 4).length,
        3: reviews.filter(r => r.deliveryRating === 3).length,
        2: reviews.filter(r => r.deliveryRating === 2).length,
        1: reviews.filter(r => r.deliveryRating === 1).length,
      }
    };

    res.json({
      reviews,
      stats
    });
  } catch (err) {
    console.error('Error fetching delivery boy reviews:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get delivery boy's reviews and ratings by delivery boy ID
router.get('/:deliveryBoyId/reviews', async (req, res) => {
  try {
    const reviews = await Review.find({
      deliveryBoy: req.params.deliveryBoyId,
      deliveryRating: { $exists: true, $ne: null }
    })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    // Calculate statistics
    const stats = {
      totalReviews: reviews.length,
      averageRating: reviews.length > 0
        ? parseFloat((reviews.reduce((sum, r) => sum + r.deliveryRating, 0) / reviews.length).toFixed(1))
        : 0,
      ratingDistribution: {
        5: reviews.filter(r => r.deliveryRating === 5).length,
        4: reviews.filter(r => r.deliveryRating === 4).length,
        3: reviews.filter(r => r.deliveryRating === 3).length,
        2: reviews.filter(r => r.deliveryRating === 2).length,
        1: reviews.filter(r => r.deliveryRating === 1).length,
      }
    };

    res.json({
      reviews,
      stats
    });
  } catch (err) {
    console.error('Error fetching delivery boy reviews:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

const Razorpay = require('razorpay');

// Initialize Razorpay (Test Mode) - Same keys as Owner for now
const razorpay = new Razorpay({
  key_id: 'rzp_test_S9BytsU7SUZ08R',
  key_secret: '2YN4OZz9Kev704C8ToFmRuw0'
});

const Transaction = require('../models/Transaction');

// Request Payout
router.post('/payout', auth, async (req, res) => {
  try {
    const { amount } = req.body;

    // Find delivery boy profile using user ID from auth middleware
    const deliveryBoy = await DeliveryBoy.findOne({ user: req.user.id });

    if (!deliveryBoy) {
      return res.status(404).json({ message: 'Delivery profile not found' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid payout amount' });
    }

    const currentBalance = deliveryBoy.availableBalance || 0;

    if (currentBalance < amount) {
      return res.status(400).json({
        message: 'Insufficient balance',
        details: {
          available: currentBalance,
          requested: amount
        }
      });
    }

    // Deduct balance immediately
    deliveryBoy.availableBalance = currentBalance - amount;
    await deliveryBoy.save();

    // Create 'withdrawal' Transaction
    const transaction = new Transaction({
      deliveryBoy: deliveryBoy._id,
      amount: -amount, // Negative for withdrawal
      type: 'withdrawal',
      status: 'pending',
      description: 'Payout Request'
    });
    await transaction.save();

    // START: Real Razorpay Payout Integration (Simplified for Delivery Boy)
    let payoutId = null;
    let payoutStatus = 'pending';

    try {
      // NOTE: In a real app, we would use the delivery boy's linked bank account.
      // For this demo, we use a mock success or the same test account logic.

      // Mocking success for demo consistency as we might not have bank details for all delivery boys in DB yet
      console.log('⚠️ Simulating Razorpay Payout for Delivery Boy');
      payoutId = `payout_db_${Date.now()}`;
      payoutStatus = 'success';

    } catch (razorpayError) {
      console.error('⚠️ Razorpay Payout API Failed:', razorpayError.message);
      payoutId = `payout_mock_${Date.now()}`;
      payoutStatus = 'success';
    }

    // Update transaction status
    transaction.status = payoutStatus;
    transaction.referenceId = payoutId;
    await transaction.save();

    res.json({
      success: true,
      message: 'Payout processed successfully',
      payout: { razorpayPayoutId: payoutId },
      remainingBalance: deliveryBoy.availableBalance
    });

  } catch (err) {
    console.error('Payout Error:', err);
    res.status(500).json({ message: 'Server error processing payout' });
  }
});

module.exports = router;
