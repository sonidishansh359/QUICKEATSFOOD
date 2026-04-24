const mongoose = require('mongoose');
require('dotenv').config();

const Order = require('./models/Order');
const DeliveryBoy = require('./models/DeliveryBoy');
const User = require('./models/User');

async function fixDeliveryAssignment() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/restaurant', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB');

    // Find the order from the URL in the image: 6977343592b077e9ac1dee39
    const orderId = '6977343592b077e9ac1dee39';
    
    const order = await Order.findById(orderId)
      .populate('deliveryBoy')
      .populate('user');

    if (!order) {
      console.log('❌ Order not found');
      process.exit(1);
    }

    console.log('\n📦 Order Details:');
    console.log('- Order ID:', order._id);
    console.log('- Status:', order.status);
    console.log('- Delivery Status:', order.deliveryStatus);
    console.log('- User:', order.user?.name, order.user?._id);
    console.log('- Delivery Boy Assigned:', order.deliveryBoy?._id || 'NONE');

    // Find all delivery boys
    const deliveryBoys = await DeliveryBoy.find().populate('user');
    
    console.log('\n🏍️ Available Delivery Boys:');
    deliveryBoys.forEach((db, index) => {
      console.log(`${index + 1}. ${db.user?.name} (User ID: ${db.user?._id}, DB ID: ${db._id})`);
    });

    // Find users with delivery_boy role
    const deliveryUsers = await User.find({ role: 'delivery_boy' });
    console.log('\n👤 Users with delivery_boy role:');
    deliveryUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (User ID: ${user._id}, Role: ${user.role})`);
    });

    // If order has no delivery boy, assign the first one
    if (!order.deliveryBoy && deliveryBoys.length > 0) {
      console.log('\n🔧 Assigning first delivery boy to order...');
      order.deliveryBoy = deliveryBoys[0]._id;
      order.deliveryStatus = 'assigned';
      await order.save();
      console.log('✅ Delivery boy assigned:', deliveryBoys[0].user?.name);
    } else if (order.deliveryBoy) {
      console.log('\n✅ Order already has a delivery boy assigned');
    } else {
      console.log('\n⚠️ No delivery boys available in the database');
      console.log('Creating a delivery boy profile for the first delivery_boy user...');
      
      if (deliveryUsers.length > 0) {
        const newDeliveryBoy = new DeliveryBoy({
          user: deliveryUsers[0]._id,
          vehicleType: 'bike',
          vehicleNumber: 'TEST123',
          currentLocation: {
            type: 'Point',
            coordinates: [72.863376, 22.695190] // Default location
          },
          isAvailable: true
        });
        await newDeliveryBoy.save();
        console.log('✅ Created delivery boy profile for:', deliveryUsers[0].name);
        
        order.deliveryBoy = newDeliveryBoy._id;
        order.deliveryStatus = 'assigned';
        await order.save();
        console.log('✅ Assigned to order');
      }
    }

    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixDeliveryAssignment();
