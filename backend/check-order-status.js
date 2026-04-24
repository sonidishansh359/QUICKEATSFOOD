const mongoose = require('mongoose');
require('dotenv').config();

const Order = require('./models/Order');

async function checkOrderStatus() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/restaurant', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB\n');

    // Find all orders
    const orders = await Order.find().sort({ createdAt: -1 }).limit(10);

    console.log('📦 Recent Orders:\n');
    orders.forEach((order, i) => {
      console.log(`${i + 1}. Order ID: ${order._id}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Delivery Status: ${order.deliveryStatus}`);
      console.log(`   Is OTP Verified: ${order.isOTPVerified}`);
      console.log(`   Delivered At: ${order.deliveredAt || 'Not set'}`);
      console.log(`   User: ${order.user}`);
      console.log(`   Can Review: ${
        order.status === 'delivered' || 
        order.deliveryStatus === 'delivered' ||
        order.isOTPVerified === true ||
        order.deliveredAt !== null && order.deliveredAt !== undefined
      }`);
      console.log('');
    });

    // Update test order to be reviewable
    const testOrder = orders[0];
    if (testOrder) {
      console.log('🔧 Updating first order to be reviewable...\n');
      
      testOrder.status = 'delivered';
      testOrder.deliveryStatus = 'delivered';
      testOrder.isOTPVerified = true;
      testOrder.deliveredAt = new Date();
      
      await testOrder.save();
      
      console.log('✅ Order updated:');
      console.log(`   Order ID: ${testOrder._id}`);
      console.log(`   Status: ${testOrder.status}`);
      console.log(`   Delivery Status: ${testOrder.deliveryStatus}`);
      console.log(`   Is OTP Verified: ${testOrder.isOTPVerified}`);
      console.log(`   Delivered At: ${testOrder.deliveredAt}`);
      console.log('');
      console.log('✅ This order can now be reviewed!');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkOrderStatus();
