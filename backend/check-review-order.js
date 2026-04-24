require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/Order');
const User = require('./models/User');

async function checkReviewOrders() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find customer user
    const customer = await User.findOne({ email: 'customer@test.com' });
    if (!customer) {
      console.log('❌ Customer not found');
      return;
    }

    console.log('\n📋 Customer orders:');
    const orders = await Order.find({ user: customer._id })
      .sort({ createdAt: -1 })
      .limit(5);

    if (orders.length === 0) {
      console.log('No orders found for this customer');
      return;
    }

    orders.forEach((order, idx) => {
      console.log(`\n[${idx + 1}] Order ID: ${order._id}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   DeliveryStatus: ${order.deliveryStatus}`);
      console.log(`   IsOTPVerified: ${order.isOTPVerified}`);
      console.log(`   DeliveredAt: ${order.deliveredAt || 'N/A'}`);
      console.log(`   Can review: ${
        order.status === 'delivered' ||
        order.deliveryStatus === 'delivered' ||
        order.isOTPVerified === true ||
        (order.deliveredAt && order.deliveredAt !== null)
          ? '✅ YES'
          : '❌ NO'
      }`);
    });

    // Find first order that needs fixing
    const needsFixing = orders.find(o => 
      o.status !== 'delivered' || 
      o.deliveryStatus !== 'delivered' || 
      !o.isOTPVerified
    );

    if (needsFixing) {
      console.log(`\n🔧 Fixing first incomplete order: ${needsFixing._id}`);
      
      needsFixing.status = 'delivered';
      needsFixing.deliveryStatus = 'delivered';
      needsFixing.isOTPVerified = true;
      needsFixing.deliveredAt = new Date();
      
      await needsFixing.save();
      console.log('✅ Order marked as delivered and verified');
    } else {
      console.log('\n✅ All orders are already reviewable');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkReviewOrders();
