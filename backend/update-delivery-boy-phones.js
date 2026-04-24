const mongoose = require('mongoose');
const User = require('./models/User');
const DeliveryBoy = require('./models/DeliveryBoy');

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/restaurant', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('📱 MongoDB connected - Starting to update delivery boy phones...\n');

  try {
    // Get all delivery boys
    const deliveryBoys = await DeliveryBoy.find().populate('user');
    
    console.log(`Found ${deliveryBoys.length} delivery boys\n`);

    let updated = 0;
    for (let i = 0; i < deliveryBoys.length; i++) {
      const deliveryBoy = deliveryBoys[i];
      
      if (!deliveryBoy.user) {
        console.log(`⚠️  Delivery boy ${deliveryBoy._id} has no user reference`);
        continue;
      }

      // Generate a test phone number
      const testPhone = `786${String(2885800 + i).padStart(7, '0')}`;
      
      // Update both User and DeliveryBoy models
      await User.updateOne(
        { _id: deliveryBoy.user._id },
        { phone: testPhone }
      );
      
      await DeliveryBoy.updateOne(
        { _id: deliveryBoy._id },
        { phone: testPhone }
      );
      
      console.log(`✅ Updated delivery boy ${deliveryBoy.user.name}: ${testPhone}`);
      updated++;
    }

    console.log(`\n✅ Successfully updated ${updated} delivery boys with phone numbers!`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});
