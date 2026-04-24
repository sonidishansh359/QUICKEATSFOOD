const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/foodswift')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

const User = require('./models/User');

async function ensureAllDeliveryBoysHavePhone() {
  try {
    console.log('\n🔍 Checking all delivery boy users for phone numbers...\n');
    
    // Find all delivery boy users
    const deliveryUsers = await User.find({ 
      $or: [
        { role: 'delivery_boy' },
        { role: 'delivery' }
      ]
    });
    
    console.log(`📋 Found ${deliveryUsers.length} delivery boy users\n`);
    
    if (deliveryUsers.length === 0) {
      console.log('⚠️ No delivery boy users found. Please create at least one delivery boy account.');
      process.exit(0);
    }
    
    let fixedCount = 0;
    const testPhones = [
      '+919876543210',
      '+919876543211', 
      '+919876543212',
      '+919876543213',
      '+919876543214'
    ];
    
    for (let i = 0; i < deliveryUsers.length; i++) {
      const user = deliveryUsers[i];
      console.log(`\n${i + 1}. User: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Current Phone: ${user.phone || '❌ NOT SET'}`);
      
      if (!user.phone || user.phone === '' || user.phone === 'undefined') {
        const newPhone = testPhones[i % testPhones.length];
        await User.findByIdAndUpdate(user._id, { phone: newPhone });
        console.log(`   ✅ FIXED: Updated phone to ${newPhone}`);
        fixedCount++;
      } else {
        console.log(`   ✅ OK: Phone already set`);
      }
    }
    
    console.log(`\n${'='.repeat(50)}`);
    console.log(`\n📊 Summary:`);
    console.log(`   Total delivery boys: ${deliveryUsers.length}`);
    console.log(`   Fixed: ${fixedCount}`);
    console.log(`   Already had phone: ${deliveryUsers.length - fixedCount}`);
    
    if (fixedCount > 0) {
      console.log(`\n✅ ${fixedCount} phone number(s) were updated!`);
      console.log(`\n⚠️ IMPORTANT: Have the delivery boy(s) re-accept any pending orders`);
      console.log(`   for the phone numbers to be sent to users.`);
    } else {
      console.log(`\n✅ All delivery boys already have phone numbers!`);
    }
    
    console.log(`\n${'='.repeat(50)}\n`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

ensureAllDeliveryBoysHavePhone();
