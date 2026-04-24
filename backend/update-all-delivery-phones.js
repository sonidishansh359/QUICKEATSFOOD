const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/foodswift')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

const User = require('./models/User');

async function updateAllDeliveryBoys() {
  try {
    // Find all users with delivery role
    const deliveryUsers = await User.find({ 
      $or: [
        { role: 'delivery_boy' },
        { role: 'delivery' }
      ]
    });
    
    console.log(`\n📋 Found ${deliveryUsers.length} delivery users\n`);
    
    if (deliveryUsers.length === 0) {
      console.log('⚠️ No delivery users found in database');
      process.exit(0);
    }
    
    let phoneNumbers = ['+919876543210', '+919876543211', '+919876543212'];
    let index = 0;
    
    for (const user of deliveryUsers) {
      console.log(`User: ${user.name} (${user.email})`);
      console.log(`  ID: ${user._id}`);
      console.log(`  Current phone: ${user.phone || 'NOT SET'}`);
      
      if (!user.phone || user.phone === '') {
        const newPhone = phoneNumbers[index % phoneNumbers.length];
        await User.findByIdAndUpdate(user._id, { phone: newPhone });
        console.log(`  ✅ Updated to: ${newPhone}`);
        index++;
      } else {
        console.log(`  ✅ Already has phone`);
      }
      console.log('');
    }
    
    console.log('✅ All delivery users updated!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateAllDeliveryBoys();
