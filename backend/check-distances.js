const mongoose = require('mongoose');

// MongoDB connection  
mongoose.connect('mongodb://localhost:27017/foodswift')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

const User = require('./models/User');
const Order = require('./models/Order');
const DeliveryBoy = require('./models/DeliveryBoy');

// Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

async function checkDistances() {
  try {
    // Get a delivery boy
    const deliveryBoy = await DeliveryBoy.findOne().populate('user');
    
    if (!deliveryBoy) {
      console.log('❌ No delivery boy found');
      process.exit(1);
    }

    console.log('\n🚚 Delivery Boy:');
    console.log(`  Name: ${deliveryBoy.user?.name}`);
    console.log(`  Location: [${deliveryBoy.location.coordinates[1]}, ${deliveryBoy.location.coordinates[0]}]`);
    
    const [dbLon, dbLat] = deliveryBoy.location.coordinates;

    // Get all out_for_delivery orders
    const orders = await Order.find({ 
      status: 'out_for_delivery',
      deliveryBoy: null 
    }).populate('user', 'name location');

    console.log(`\n📦 Found ${orders.length} available orders\n`);

    orders.forEach((order, idx) => {
      if (order.user && order.user.location && order.user.location.coordinates) {
        const [userLon, userLat] = order.user.location.coordinates;
        const distance = calculateDistance(dbLat, dbLon, userLat, userLon);
        
        console.log(`Order ${idx + 1}:`);
        console.log(`  User: ${order.user.name}`);
        console.log(`  User Location: [${userLat.toFixed(4)}, ${userLon.toFixed(4)}]`);
        console.log(`  Distance: ${distance.toFixed(2)} km ${distance <= 5 ? '✅ WITHIN 5KM' : '❌ BEYOND 5KM'}`);
        console.log('');
      } else {
        console.log(`Order ${idx + 1}:`);
        console.log(`  ⚠️ No user location data\n`);
      }
    });

    console.log('✅ Distance check completed!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkDistances();
