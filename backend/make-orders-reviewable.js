const mongoose = require('mongoose');
require('dotenv').config();

const Order = require('./models/Order');

async function makeAllOrdersReviewable() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/restaurant', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB\n');

    // Find all orders that are not cancelled
    const orders = await Order.find({ 
      status: { $ne: 'cancelled' }
    });

    console.log(`📦 Found ${orders.length} orders to update\n`);

    let updated = 0;
    for (const order of orders) {
      // Only update if not already fully delivered
      if (order.status !== 'delivered' || order.deliveryStatus !== 'delivered') {
        order.status = 'delivered';
        order.deliveryStatus = 'delivered';
        order.isOTPVerified = true;
        if (!order.deliveredAt) {
          order.deliveredAt = new Date();
        }
        await order.save();
        updated++;
        console.log(`✅ Updated order ${order._id}`);
      }
    }

    console.log(`\n✨ Updated ${updated} orders to be reviewable!`);
    console.log('\n📝 All non-cancelled orders are now marked as delivered and can be reviewed.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

makeAllOrdersReviewable();
