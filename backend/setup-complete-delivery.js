const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const DeliveryBoy = require('./models/DeliveryBoy');
const Order = require('./models/Order');

async function setupCompleteDeliverySystem() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/restaurant', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB\n');

    // Check existing users
    const allUsers = await User.find();
    console.log('👥 Existing Users:');
    allUsers.forEach((user, i) => {
      console.log(`${i + 1}. ${user.name} (${user.email}) - Role: ${user.role}`);
    });
    console.log('');

    let deliveryUser;

    // Check if there's already a delivery boy
    const existingDeliveryUser = allUsers.find(u => u.role === 'delivery_boy' || u.role === 'delivery');
    
    if (existingDeliveryUser) {
      console.log(`✅ Found existing delivery user: ${existingDeliveryUser.name}`);
      deliveryUser = existingDeliveryUser;
    } else if (allUsers.length > 0) {
      // Convert first user to delivery boy
      console.log(`🔄 Converting first user "${allUsers[0].name}" to delivery_boy role...`);
      allUsers[0].role = 'delivery_boy';
      await allUsers[0].save();
      deliveryUser = allUsers[0];
      console.log(`   ✅ User role updated to delivery_boy\n`);
    } else {
      // Create a new delivery boy user
      console.log('🆕 Creating new delivery boy user...');
      const hashedPassword = await bcrypt.hash('delivery123', 10);
      
      deliveryUser = new User({
        name: 'Test Delivery Boy',
        email: 'delivery@test.com',
        phone: '9876543210',
        password: hashedPassword,
        role: 'delivery_boy',
        address: 'Delivery Hub, Surat'
      });
      await deliveryUser.save();
      console.log(`   ✅ Created: ${deliveryUser.name} (${deliveryUser.email})`);
      console.log(`   🔑 Password: delivery123\n`);
    }

    // Create or find delivery boy profile
    let deliveryBoyProfile = await DeliveryBoy.findOne({ user: deliveryUser._id });
    
    if (!deliveryBoyProfile) {
      console.log('🏍️ Creating delivery boy profile...');
      deliveryBoyProfile = new DeliveryBoy({
        user: deliveryUser._id,
        vehicleType: 'bike',
        vehicleNumber: 'GJ05AB1234',
        licenseNumber: 'DL1234567890',
        currentLocation: {
          type: 'Point',
          coordinates: [72.863376, 22.695190]
        },
        isAvailable: true,
        ratings: []
      });
      await deliveryBoyProfile.save();
      console.log(`   ✅ Profile created: ${deliveryBoyProfile._id}\n`);
    } else {
      console.log(`   ✅ Profile already exists: ${deliveryBoyProfile._id}\n`);
    }

    // Find or create an order
    let order = await Order.findOne().populate('user restaurant');
    
    if (!order) {
      console.log('📦 No orders found. Creating a test order...');
      
      // Find or create a test user
      let testUser = await User.findOne({ role: 'user' });
      if (!testUser) {
        const hashedPassword = await bcrypt.hash('user123', 10);
        testUser = new User({
          name: 'Test Customer',
          email: 'customer@test.com',
          phone: '9876543211',
          password: hashedPassword,
          role: 'user',
          address: 'Test Address, Surat'
        });
        await testUser.save();
        console.log(`   ✅ Created test customer: ${testUser.email}`);
      }

      // Find or create a restaurant
      const Restaurant = require('./models/Restaurant');
      let restaurant = await Restaurant.findOne();
      if (!restaurant) {
        // Create a restaurant owner if needed
        let restaurantOwner = allUsers.find(u => u.role === 'owner');
        if (!restaurantOwner) {
          console.log('   🏪 Creating restaurant owner...');
          const hashedPassword = await bcrypt.hash('owner123', 10);
          restaurantOwner = new User({
            name: 'Test Restaurant Owner',
            email: 'owner@test.com',
            phone: '9876543213',
            password: hashedPassword,
            role: 'owner',
            address: 'Restaurant Address, Surat'
          });
          await restaurantOwner.save();
          console.log(`   ✅ Created owner: ${restaurantOwner.email}`);
        }

        restaurant = new Restaurant({
          name: 'Test Restaurant',
          owner: restaurantOwner._id,
          cuisine: 'Multi-Cuisine',
          address: 'Test Restaurant Address, Surat',
          phone: '9876543212',
                   image: '/placeholder-restaurant.jpg',
          rating: 4.5,
          deliveryTime: '30-40 mins',
          priceForTwo: 500,
          location: {
            type: 'Point',
            coordinates: [72.863376, 22.695190]
          },
          isOpen: true
        });
        await restaurant.save();
        console.log(`   ✅ Created test restaurant: ${restaurant.name}`);
      }

      order = new Order({
        user: testUser._id,
        restaurant: restaurant._id,
        items: [],
        totalAmount: 500,
        deliveryAddress: testUser.address,
               deliveryLocation: {
                 type: 'Point',
                 coordinates: [72.863376, 22.695190]
               },
        status: 'accepted',
        deliveryStatus: 'assigned',
        deliveryBoy: deliveryBoyProfile._id
      });
      await order.save();
      console.log(`   ✅ Created test order: ${order._id}\n`);
    } else {
      // Assign delivery boy to existing order
      console.log(`📦 Assigning delivery boy to order: ${order._id}`);
      order.deliveryBoy = deliveryBoyProfile._id;
      if (!order.deliveryStatus || order.deliveryStatus === 'pending') {
        order.deliveryStatus = 'assigned';
      }
      await order.save();
      console.log(`   ✅ Order assigned\n`);
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log('✨ SETUP COMPLETE! ✨');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log('📱 Login Credentials:');
    console.log(`   Email: ${deliveryUser.email}`);
    console.log(`   Password: ${deliveryUser.email === 'delivery@test.com' ? 'delivery123' : '(use existing password)'}`);
    console.log(`   Role: ${deliveryUser.role}\n`);
    
    console.log('📦 Order Details:');
    console.log(`   Order ID: ${order._id}`);
    console.log(`   Status: ${order.status}`);
    console.log(`   Delivery Status: ${order.deliveryStatus}\n`);
    
    console.log('🔗 Access Tracking Page:');
    console.log(`   http://localhost:5173/delivery/tracking/${order._id}`);
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setupCompleteDeliverySystem();
