require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/Order');
const DeliveryBoy = require('./models/DeliveryBoy');
const User = require('./models/User');
const Restaurant = require('./models/Restaurant');

async function setupDeliveryOrder() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get delivery boy
    const deliveryBoyUser = await User.findOne({ email: 'delivery@test.com' });
    const deliveryBoy = await DeliveryBoy.findOne({ user: deliveryBoyUser._id });
    
    // Get customer
    const customer = await User.findOne({ email: 'customer@test.com' });
    
    // Get restaurant
    const restaurant = await Restaurant.findOne({}).limit(1);

    console.log('\n📋 Current Orders for Delivery Boy:');
    const currentOrders = await Order.find({ deliveryBoy: deliveryBoy._id });
    console.log(`   Found ${currentOrders.length} orders`);
    currentOrders.forEach((o, i) => {
      console.log(`   [${i+1}] ${o._id} - Status: ${o.status}, DeliveryStatus: ${o.deliveryStatus}`);
    });

    // Check for non-delivered orders
    const availableOrder = await Order.findOne({
      deliveryBoy: deliveryBoy._id,
      $or: [
        { status: { $ne: 'delivered' } },
        { deliveryStatus: { $ne: 'delivered' } }
      ]
    });

    if (availableOrder) {
      console.log('\n✅ Found available order to test:', availableOrder._id);
      console.log('   Status:', availableOrder.status);
      console.log('   DeliveryStatus:', availableOrder.deliveryStatus);
      return;
    }

    console.log('\n⚠️ No available orders. Resetting existing order to testable state...');
    
    const existingOrder = currentOrders[0];
    if (existingOrder) {
      existingOrder.status = 'out_for_delivery';
      existingOrder.deliveryStatus = 'on_the_way';
      existingOrder.deliveredAt = null;
      existingOrder.isOTPVerified = false;
      existingOrder.deliveryOTP = null;
      existingOrder.deliveryOTPExpiry = null;
      
      await existingOrder.save();
      console.log('✅ Reset order to out_for_delivery state:', existingOrder._id);
      return;
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

setupDeliveryOrder();
