const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/foodswift')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const User = require('./models/User');
const DeliveryBoy = require('./models/DeliveryBoy');

async function updateDeliveryBoyPhone() {
  try {
    // Find all delivery boys
    const deliveryBoys = await DeliveryBoy.find().populate('user');
    
    console.log(`\n📋 Found ${deliveryBoys.length} delivery boys\n`);
    
    for (const db of deliveryBoys) {
      console.log('---');
      console.log(`Delivery Boy ID: ${db._id}`);
      console.log(`Name: ${db.user?.name || 'Unknown'}`);
      console.log(`User Phone: ${db.user?.phone || 'NOT SET'}`);
      console.log(`DeliveryBoy Phone: ${db.phone || 'NOT SET'}`);
      
      // If user has no phone but delivery boy profile has a phone field, you could sync
      // For this test, let's just set a test phone if both are empty
      if (!db.user?.phone && !db.phone) {
        console.log('⚠️ No phone number found, setting test phone...');
        
        // Update the user's phone
        await User.findByIdAndUpdate(db.user._id, {
          phone: '+919876543210' // Test phone number
        });
        
        console.log('✅ Updated user phone to: +919876543210');
      }
      
      console.log('');
    }
    
    console.log('✅ Phone update check completed!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateDeliveryBoyPhone();
