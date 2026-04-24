const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/foodswift')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

const User = require('./models/User');
const DeliveryBoy = require('./models/DeliveryBoy');

async function updateSpecificUser() {
  try {
    // Update the specific delivery boy from logs: het soni
    const userId = '696b53ec6759da022ba33400';
    
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }
    
    console.log(`\n📋 Found user: ${user.name} (${user.email})`);
    console.log(`Current phone: ${user.phone || 'NOT SET'}`);
    console.log(`Role: ${user.role}`);
    
    // Update phone
    const testPhone = '+919876543210';
    await User.findByIdAndUpdate(userId, { phone: testPhone });
    console.log(`✅ Updated phone to: ${testPhone}\n`);
    
    // Check DeliveryBoy profile
    const dbProfile = await DeliveryBoy.findOne({ user: userId }).populate('user');
    if (dbProfile) {
      console.log('📦 DeliveryBoy Profile exists:');
      console.log(`  Vehicle: ${dbProfile.vehicleType} - ${dbProfile.licenseNumber}`);
      console.log(`  Profile phone: ${dbProfile.phone || 'NOT SET'}`);
      console.log(`  Rating: ${dbProfile.rating}`);
    } else {
      console.log('⚠️ No DeliveryBoy profile found (will be auto-created on first order accept)');
    }
    
    console.log('\n✅ Update completed!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateSpecificUser();
