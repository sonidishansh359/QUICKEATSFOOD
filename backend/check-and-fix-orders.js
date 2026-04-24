const mongoose = require('mongoose');
require('dotenv').config();

const Order = require('./models/Order');
const DeliveryBoy = require('./models/DeliveryBoy');
const User = require('./models/User');

async function checkOrdersAndFix() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/restaurant', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB');

    // Find recent orders
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('deliveryBoy')
      .populate('user', 'name');

    console.log('\n📦 Recent Orders:');
    orders.forEach((order, index) => {
      console.log(`${index + 1}. Order ID: ${order._id}`);
      console.log(`   Status: ${order.status}, Delivery: ${order.deliveryStatus}`);
      console.log(`   User: ${order.user?.name}`);
      console.log(`   Delivery Boy: ${order.deliveryBoy ? 'Assigned' : 'NOT ASSIGNED'}`);
      console.log('');
    });

    // Find all delivery boys
    const deliveryBoys = await DeliveryBoy.find().populate('user');
    
    console.log('🏍️ Available Delivery Boys:');
    deliveryBoys.forEach((db, index) => {
      console.log(`${index + 1}. ${db.user?.name} (User ID: ${db.user?._id}, DB ID: ${db._id})`);
    });

    // Find users with delivery_boy role
    const deliveryUsers = await User.find({ role: 'delivery_boy' });
    console.log('\n👤 Users with delivery_boy role:');
    deliveryUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (User ID: ${user._id}, Email: ${user.email})`);
    });

    // Create or find delivery boy profile if needed
    let deliveryBoy = deliveryBoys[0];
    
    if (!deliveryBoy && deliveryUsers.length > 0) {
      console.log('\n🔧 Creating delivery boy profile...');
      deliveryBoy = new DeliveryBoy({
        user: deliveryUsers[0]._id,
        vehicleType: 'bike',
        vehicleNumber: 'TEST123',
        currentLocation: {
          type: 'Point',
          coordinates: [72.863376, 22.695190]
        },
        isAvailable: true
      });
      await deliveryBoy.save();
      console.log('✅ Created delivery boy profile for:', deliveryUsers[0].name);
    }

    // Assign delivery boy to orders that need one
    if (deliveryBoy) {
      for (const order of orders) {
        if (!order.deliveryBoy && ['pending', 'confirmed', 'preparing'].includes(order.status)) {
          console.log(`\n🔧 Assigning delivery boy to order ${order._id}...`);
          order.deliveryBoy = deliveryBoy._id;
          order.deliveryStatus = 'assigned';
          await order.save();
          console.log('✅ Assigned');
        }
      }
    }

    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkOrdersAndFix();
