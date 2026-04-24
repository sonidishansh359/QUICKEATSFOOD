const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Order = require('../models/Order');
const DeliveryBoy = require('../models/DeliveryBoy');
const auth = require('../middleware/auth');

// Admin/read-only: fetch latest reviews across system
router.get('/all', async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('user', 'name email')
      .populate('restaurant', 'name')
      .populate({
        path: 'deliveryBoy',
        populate: { path: 'user', select: 'name email phone' }
      })
      .sort({ createdAt: -1 })
      .limit(200);

    res.json(reviews);
  } catch (err) {
    console.error('Error fetching all reviews:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get high-rated reviews for landing page testimonials
router.get('/testimonials', async (req, res) => {
  try {
    const reviews = await Review.find({
      rating: { $gte: 4 },
      comment: { $exists: true, $ne: "" }
    })
      .populate('user', 'name profilePicture')
      .populate('restaurant', 'name')
      .sort({ createdAt: -1 })
      .limit(6);

    res.json(reviews);
  } catch (err) {
    console.error('Error fetching testimonials:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get reviews for a restaurant
router.get('/restaurant/:restaurantId', async (req, res) => {
  try {
    const reviews = await Review.find({ restaurant: req.params.restaurantId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's own reviews
router.get('/my-reviews', auth, async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user.id })
      .populate('restaurant', 'name')
      .sort({ createdAt: -1 });

    // Map to include orderId from the review
    const reviewsWithOrders = reviews.map(review => ({
      orderId: review.order?.toString() || review._id.toString(),
      rating: review.rating,
      comment: review.comment,
      deliveryRating: review.deliveryRating || null,
      deliveryComment: review.deliveryComment || null,
      createdAt: review.createdAt,
      restaurantName: review.restaurant?.name
    }));

    res.json(reviewsWithOrders);
  } catch (err) {
    console.error('Error fetching user reviews:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get delivery boy reviews/ratings
router.get('/delivery-boy/:deliveryBoyId', async (req, res) => {
  try {
    const reviews = await Review.find({
      deliveryBoy: req.params.deliveryBoyId,
      deliveryRating: { $exists: true, $ne: null }
    })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    console.error('Error fetching delivery boy reviews:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create review (for restaurant)
router.post('/', auth, async (req, res) => {
  try {
    console.log('\n📝 Creating review...');
    console.log('User ID:', req.user.id);
    console.log('Request body:', req.body);

    // Minimal required: orderId and rating; restaurantId will be derived from the order
    const { orderId, rating, comment, deliveryBoyId, deliveryRating, deliveryComment, restaurantId: inputRestaurantId } = req.body;

    // Validate required fields
    if (!orderId || !rating) {
      console.log('❌ Missing required fields:', { orderId, rating });
      return res.status(400).json({ message: 'Missing required fields: orderId, rating' });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Validate delivery rating if provided
    if (deliveryRating && (deliveryRating < 1 || deliveryRating > 5)) {
      return res.status(400).json({ message: 'Delivery rating must be between 1 and 5' });
    }

    // Check if user has already reviewed this order
    const existingReview = await Review.findOne({
      order: orderId,
      user: req.user.id
    });

    if (existingReview) {
      console.log('⚠️ Review already exists for this order');
      return res.status(400).json({ message: 'You have already reviewed this order' });
    }

    // Check if user has ordered from this restaurant
    // Accept delivered orders by primary status OR deliveryStatus OR deliveredAt timestamp
    console.log('🔍 Looking for order:', {
      orderId,
      userId: req.user.id,
      lookingFor: 'delivered status or OTP verified'
    });

    const order = await Order.findOne({
      _id: orderId,
      user: req.user.id,
      $or: [
        { status: 'delivered' },
        { status: 'completed' }, // Allow 'completed' status as well
        { deliveryStatus: 'delivered' },
        { deliveredAt: { $exists: true, $ne: null } },
        { isOTPVerified: true }
      ]
    }).populate('deliveryBoy');

    console.log('📦 Order query result:', {
      found: !!order,
      orderId: order?._id,
      status: order?.status,
      deliveryStatus: order?.deliveryStatus,
      isOTPVerified: order?.isOTPVerified,
      hasDeliveredAt: !!order?.deliveredAt
    });
    if (!order) {
      // Fallback: fetch by ID and validate ownership + delivered state
      const debugOrder = await Order.findById(orderId).populate('deliveryBoy');
      console.log('Debug - Order by ID exists:', !!debugOrder);
      if (debugOrder) {
        const userMatches = debugOrder.user.toString() === req.user.id;
        const deliveredState = (
          debugOrder.status === 'delivered' ||
          debugOrder.status === 'completed' || // Allow completed
          debugOrder.deliveryStatus === 'delivered' ||
          (debugOrder.deliveredAt && debugOrder.deliveredAt !== null) ||
          debugOrder.isOTPVerified === true
        );
        console.log('Debug - Ownership matches:', userMatches, 'Delivered state:', deliveredState);
        if (userMatches && deliveredState) {
          console.log('✅ Using fallback order for review');
          // Use fallback order for review processing
          order = debugOrder;
        }
      }
    }

    if (!order) {
      console.log('❌ Order not found or not delivered');
      console.log('💡 Possible reasons:');
      console.log('   - Order status is not "delivered"');
      console.log('   - Delivery status is not "delivered"');
      console.log('   - OTP not verified');
      console.log('   - Order not found or belongs to different user');
      return res.status(400).json({
        message: 'You can only review completed orders',
        hint: 'Order must be delivered and OTP verified before reviewing'
      });
    }

    // Derive restaurantId from the order to avoid mismatches
    const restaurantId = order.restaurant?.toString ? order.restaurant.toString() : order.restaurant;
    // Get actual delivery boy ID from order if not provided
    const actualDeliveryBoyId = deliveryBoyId || (order.deliveryBoy?._id || order.deliveryBoy);

    const review = new Review({
      user: req.user.id,
      restaurant: restaurantId,
      order: orderId,
      rating,
      comment,
      deliveryBoy: actualDeliveryBoyId,
      deliveryRating: deliveryRating || null,
      deliveryComment: deliveryComment || null
    });

    await review.save();
    await review.populate('user', 'name');

    console.log('✅ Review saved:', review._id);

    // Update restaurant rating
    const Restaurant = require('../models/Restaurant');
    const allReviews = await Review.find({ restaurant: restaurantId, rating: { $exists: true } });
    const totalRatings = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRatings / allReviews.length;

    await Restaurant.findByIdAndUpdate(restaurantId, {
      rating: parseFloat(averageRating.toFixed(1))
    });

    console.log(`✅ Restaurant rating updated: ${averageRating.toFixed(1)} (based on ${allReviews.length} reviews)`);

    // Update delivery boy rating if delivery feedback provided
    if (deliveryRating && actualDeliveryBoyId) {
      console.log('📦 Updating delivery boy rating...');

      const deliveryBoy = await DeliveryBoy.findById(actualDeliveryBoyId);
      if (deliveryBoy) {
        // Add review to delivery boy's reviews array
        if (!deliveryBoy.reviews) {
          deliveryBoy.reviews = [];
        }
        deliveryBoy.reviews.push(review._id);

        // Recalculate delivery boy rating
        const dbReviews = await Review.find({
          deliveryBoy: actualDeliveryBoyId,
          deliveryRating: { $exists: true, $ne: null }
        });

        if (dbReviews.length > 0) {
          const totalDeliveryRatings = dbReviews.reduce((sum, r) => sum + r.deliveryRating, 0);
          const avgDeliveryRating = totalDeliveryRatings / dbReviews.length;
          deliveryBoy.rating = parseFloat(avgDeliveryRating.toFixed(1));
          deliveryBoy.totalRatings = dbReviews.length;
        }

        await deliveryBoy.save();
        console.log(`✅ Delivery boy rating updated: ${deliveryBoy.rating} (based on ${deliveryBoy.totalRatings} reviews)`);
      }
    }

    // Emit to Admin
    const io = req.app.get('io');
    const enrichedReview = await Review.findById(review._id)
      .populate('user', 'name')
      .populate('restaurant', 'name');

    io.to('admin_tracking').emit('newReview', enrichedReview);

    res.json(review);
  } catch (err) {
    console.error('❌ Error creating review:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
