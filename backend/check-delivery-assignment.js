require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/Order');
const DeliveryBoy = require('./models/DeliveryBoy');
const User = require('./models/User');

async function checkDeliveryBoyAssignment() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find delivery boy user
    const deliveryBoyUser = await User.findOne({ email: 'delivery@test.com' });
    if (!deliveryBoyUser) {
      console.log('❌ Delivery boy user not found');
      return;
    }

    console.log('\n👤 Delivery Boy User:');
    console.log('   ID:', deliveryBoyUser._id);
    console.log('   Email:', deliveryBoyUser.email);
    console.log('   Role:', deliveryBoyUser.role);

    // Find delivery boy profile
    const deliveryBoy = await DeliveryBoy.findOne({ user: deliveryBoyUser._id });
    if (!deliveryBoy) {
      console.log('\n❌ Delivery boy profile not found');
      return;
    }

    console.log('\n🚗 Delivery Boy Profile:');
    console.log('   ID:', deliveryBoy._id);
    console.log('   User ID:', deliveryBoy.user);
    console.log('   Name:', deliveryBoy.name);

    // Check orders
    console.log('\n📋 Looking for orders assigned to this delivery boy:');
    const assignedOrders = await Order.find({ deliveryBoy: deliveryBoy._id }).select('_id status deliveryStatus deliveryBoy user');
    console.log(`   Found ${assignedOrders.length} orders`);
    assignedOrders.forEach((order, idx) => {
      console.log(`   [${idx + 1}] Order: ${order._id}, Status: ${order.status}, DeliveryStatus: ${order.deliveryStatus}`);
    });

    // Check all orders with status 'out_for_delivery' but no deliveryBoy
    console.log('\n📋 Orders without delivery boy assignment:');
    const unassignedOrders = await Order.find({ 
      deliveryStatus: 'on_the_way',
      $or: [
        { deliveryBoy: null },
        { deliveryBoy: { $exists: false } }
      ]
    }).select('_id status deliveryStatus deliveryBoy user');
    console.log(`   Found ${unassignedOrders.length} unassigned orders`);
    unassignedOrders.slice(0, 5).forEach((order, idx) => {
      console.log(`   [${idx + 1}] Order: ${order._id}`);
    });

    if (unassignedOrders.length > 0) {
      console.log('\n🔧 Assigning first unassigned order to delivery boy...');
      const orderToAssign = unassignedOrders[0];
      orderToAssign.deliveryBoy = deliveryBoy._id;
      await orderToAssign.save();
      console.log('✅ Order assigned:', orderToAssign._id);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkDeliveryBoyAssignment();
