require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/Order');

async function findOrderByPartialId() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // The error shows 6977813... let's list recent orders
    const orders = await Order.find({}).sort({ createdAt: -1 }).limit(10).select('_id status deliveryStatus deliveryBoy user createdAt');

    console.log('\n📋 Orders matching 6977813:');
    console.log(`Found ${orders.length} orders`);
    
    orders.forEach((order, idx) => {
      console.log(`\n[${idx + 1}] Order ID: ${order._id}`);
      console.log(`    Status: ${order.status}`);
      console.log(`    DeliveryStatus: ${order.deliveryStatus}`);
      console.log(`    DeliveryBoy assigned: ${order.deliveryBoy ? 'YES' : 'NO'}`);
      console.log(`    DeliveryBoy ID: ${order.deliveryBoy}`);
      console.log(`    User ID: ${order.user}`);
      console.log(`    Created: ${order.createdAt}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

findOrderByPartialId();
