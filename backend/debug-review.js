const mongoose = require('mongoose');
require('dotenv').config();

const Order = require('./models/Order');
const Review = require('./models/Review');

async function debugReviewIssue() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/restaurant', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB\n');

    // Get the first order
    const order = await Order.findOne().sort({ createdAt: -1 });
    
    if (!order) {
      console.log('❌ No orders found');
      process.exit(1);
    }

    console.log('📦 Order Details:');
    console.log('   ID:', order._id);
    console.log('   User:', order.user);
    console.log('   Status:', order.status);
    console.log('   Delivery Status:', order.deliveryStatus);
    console.log('   Is OTP Verified:', order.isOTPVerified);
    console.log('   Delivered At:', order.deliveredAt);
    console.log('');

    console.log('✅ Can be reviewed:', 
      order.status === 'delivered' ||
      order.deliveryStatus === 'delivered' ||
      order.isOTPVerified === true ||
      (order.deliveredAt !== null && order.deliveredAt !== undefined)
    );
    console.log('');

    // Check if review already exists
    const existingReview = await Review.findOne({
      order: order._id,
      user: order.user
    });

    if (existingReview) {
      console.log('⚠️ Review already exists for this order:');
      console.log('   Review ID:', existingReview._id);
      console.log('   Rating:', existingReview.rating);
      console.log('   Comment:', existingReview.comment);
      console.log('');
      console.log('💡 To test again, delete this review first:');
      console.log(`   Review.deleteOne({ _id: '${existingReview._id}' })`);
    } else {
      console.log('✅ No existing review - ready to accept new review');
    }

    console.log('');
    console.log('📋 To submit a review, use:');
    console.log('   Order ID:', order._id);
    console.log('   User ID:', order.user);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugReviewIssue();
