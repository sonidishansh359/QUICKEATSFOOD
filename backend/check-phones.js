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

async function checkAndUpdatePhones() {
  try {
    // Find delivery boy users
    const deliveryUsers = await User.find({ role: { $in: ['delivery_boy', 'delivery'] } });
    
    console.log(`\n📋 Found ${deliveryUsers.length} delivery boy users:\n`);
    
    for (const user of deliveryUsers) {
      console.log(`User: ${user.name} (${user.email})`);
      console.log(`  Current phone: ${user.phone || 'NOT SET'}`);
      
      // Update phone if not set
      if (!user.phone || user.phone === '') {
        const testPhone = '+919876543210'; // You can customize per user
        await User.findByIdAndUpdate(user._id, { phone: testPhone });
        console.log(`  ✅ Updated phone to: ${testPhone}`);
      }
      console.log('');
    }
    
    // Also check DeliveryBoy profiles
    const dbProfiles = await DeliveryBoy.find().populate('user');
    console.log(`\n📦 Found ${dbProfiles.length} DeliveryBoy profiles:\n`);
    
    for (const db of dbProfiles) {
      console.log(`Profile ID: ${db._id}`);
      console.log(`  User: ${db.user?.name} (${db.user?.email})`);
      console.log(`  User phone: ${db.user?.phone || 'NOT SET'}`);
      console.log(`  Profile phone: ${db.phone || 'NOT SET'}`);
      console.log(`  Vehicle: ${db.vehicleType} - ${db.licenseNumber}`);
      console.log('');
    }
    
    console.log('✅ Check completed!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAndUpdatePhones();
