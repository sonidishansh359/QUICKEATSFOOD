const mongoose = require('mongoose');

// MongoDB connection  
mongoose.connect('mongodb://localhost:27017/foodswift')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

const User = require('./models/User');
const DeliveryBoy = require('./models/DeliveryBoy');

async function checkDeliveryBoys() {
  try {
    // Check users with delivery_boy role
    const deliveryBoyUsers = await User.find({ role: 'delivery_boy' }).select('name email phone location');
    console.log(`\n📋 Delivery Boy Users: ${deliveryBoyUsers.length}`);
    deliveryBoyUsers.forEach((user, idx) => {
      console.log(`  ${idx + 1}. ${user.name} (${user.email})`);
      console.log(`     Phone: ${user.phone}`);
      console.log(`     Location: [${user.location.coordinates[0]}, ${user.location.coordinates[1]}]`);
    });

    // Check DeliveryBoy profiles
    const deliveryBoys = await DeliveryBoy.find().populate('user', 'name email phone');
    console.log(`\n🚚 DeliveryBoy Profiles: ${deliveryBoys.length}`);
    deliveryBoys.forEach((db, idx) => {
      console.log(`  ${idx + 1}. ${db.user?.name} (${db.user?.email})`);
      console.log(`     Profile ID: ${db._id}`);
      console.log(`     Location: [${db.location.coordinates[0]}, ${db.location.coordinates[1]}]`);
      console.log(`     Available: ${db.isAvailable}`);
    });

    console.log('\n✅ Check completed!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkDeliveryBoys();
