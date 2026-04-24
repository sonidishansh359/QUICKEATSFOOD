const mongoose = require('mongoose');
require('dotenv').config();

const Order = require('./models/Order');
const DeliveryBoy = require('./models/DeliveryBoy');
const User = require('./models/User');

async function setupDeliveryBoy() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/restaurant', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB\n');

    // Get the currently logged in user ID from the error context
    // We need to find the user who is trying to access the tracking
    
    // Find all users and their roles
    const allUsers = await User.find().select('name email phone role');
    console.log('👥 All Users in Database:');
    allUsers.forEach((user, i) => {
      console.log(`${i + 1}. ${user.name} - ${user.email} - Role: ${user.role} - ID: ${user._id}`);
    });
    console.log('');

    // Find users with delivery_boy role
    const deliveryUsers = await User.find({ role: { $in: ['delivery_boy', 'delivery'] } });
    console.log(`🏍️ Found ${deliveryUsers.length} users with delivery role\n`);

    if (deliveryUsers.length === 0) {
      console.log('❌ No users with delivery_boy role found!');
      console.log('💡 Please create a user with role "delivery_boy" first.');
      process.exit(1);
    }

    // Check existing delivery boy profiles
    const existingDeliveryBoys = await DeliveryBoy.find().populate('user');
    console.log('📋 Existing Delivery Boy Profiles:');
    if (existingDeliveryBoys.length === 0) {
      console.log('   None found.\n');
    } else {
      existingDeliveryBoys.forEach((db, i) => {
        console.log(`${i + 1}. ${db.user?.name} (User: ${db.user?._id}, Profile: ${db._id})`);
      });
      console.log('');
    }

    // Create delivery boy profiles for users who don't have one
    for (const user of deliveryUsers) {
      const existingProfile = await DeliveryBoy.findOne({ user: user._id });
      
      if (!existingProfile) {
        console.log(`🔧 Creating delivery boy profile for: ${user.name}`);
        const newDeliveryBoy = new DeliveryBoy({
          user: user._id,
          vehicleType: 'bike',
          vehicleNumber: `BIKE-${Math.floor(Math.random() * 1000)}`,
          currentLocation: {
            type: 'Point',
            coordinates: [72.863376, 22.695190] // Default: Surat, Gujarat
          },
          isAvailable: true,
          ratings: []
        });
        await newDeliveryBoy.save();
        console.log(`   ✅ Profile created: ${newDeliveryBoy._id}\n`);
      } else {
        console.log(`   ✅ ${user.name} already has a profile: ${existingProfile._id}\n`);
      }
    }

    // Get all delivery boy profiles again
    const allDeliveryBoys = await DeliveryBoy.find().populate('user');
    
    if (allDeliveryBoys.length === 0) {
      console.log('❌ No delivery boy profiles available');
      process.exit(1);
    }

    // Find orders and assign them
    const orders = await Order.find({ status: { $in: ['pending', 'confirmed', 'preparing', 'ready'] } })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'name');

    console.log(`📦 Found ${orders.length} orders that need delivery assignment:\n`);
    
    if (orders.length === 0) {
      console.log('ℹ️ No pending orders to assign.\n');
    } else {
      // Assign first delivery boy to all pending orders
      const deliveryBoy = allDeliveryBoys[0];
      console.log(`📍 Assigning ${deliveryBoy.user.name} to orders...\n`);

      for (const order of orders) {
        if (!order.deliveryBoy) {
          order.deliveryBoy = deliveryBoy._id;
          if (!order.deliveryStatus || order.deliveryStatus === 'pending') {
            order.deliveryStatus = 'assigned';
          }
          await order.save();
          console.log(`   ✅ Order ${order._id} assigned to ${deliveryBoy.user.name}`);
        } else {
          console.log(`   ⏭️ Order ${order._id} already assigned`);
        }
      }
      console.log('');
    }

    console.log('✨ Setup Complete!\n');
    console.log('📌 Summary:');
    console.log(`   - Delivery Boy Users: ${deliveryUsers.length}`);
    console.log(`   - Delivery Boy Profiles: ${allDeliveryBoys.length}`);
    console.log(`   - Orders Assigned: ${orders.filter(o => o.deliveryBoy).length}`);
    console.log('');
    console.log('💡 Now you can access the tracking page with the order ID from the orders listed above.');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setupDeliveryBoy();
