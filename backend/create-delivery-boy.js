const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection  
mongoose.connect('mongodb://localhost:27017/foodswift')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

const User = require('./models/User');
const DeliveryBoy = require('./models/DeliveryBoy');

async function setupDeliveryBoy() {
  try {
    console.log('\n🚚 Setting up delivery boy...\n');

    // Check if delivery boy user exists
    let deliveryUser = await User.findOne({ role: 'delivery_boy' });

    if (!deliveryUser) {
      console.log('Creating new delivery boy user...');
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      deliveryUser = new User({
        name: 'Ravi Shah',
        email: 'ravi@delivery.com',
        phone: '+919876543210',
        password: hashedPassword,
        role: 'delivery_boy',
        // Location set to somewhere in Surat
        location: {
          type: 'Point',
          coordinates: [72.8311, 21.1702] // [longitude, latitude] - Surat, Gujarat
        },
        address: 'Adajan, Surat',
        city: 'Surat',
        state: 'Gujarat'
      });
      
      await deliveryUser.save();
      console.log(`✅ Created delivery boy user: ${deliveryUser.name}`);
      console.log(`   Email: ${deliveryUser.email}`);
      console.log(`   Phone: ${deliveryUser.phone}`);
      console.log(`   Password: password123`);
      console.log(`   Location: [${deliveryUser.location.coordinates[1]}, ${deliveryUser.location.coordinates[0]}]`);
    } else {
      console.log(`✅ Delivery boy user already exists: ${deliveryUser.name}`);
      console.log(`   Location: [${deliveryUser.location.coordinates[1]}, ${deliveryUser.location.coordinates[0]}]`);
    }

    // Check if delivery boy profile exists
    let deliveryBoyProfile = await DeliveryBoy.findOne({ user: deliveryUser._id });

    if (!deliveryBoyProfile) {
      console.log('\nCreating delivery boy profile...');
      
      deliveryBoyProfile = new DeliveryBoy({
        user: deliveryUser._id,
        phone: deliveryUser.phone,
        vehicleType: 'bike',
        licenseNumber: 'GJ05AB1234',
        isAvailable: true,
        // Location set to same as user location
        location: {
          type: 'Point',
          coordinates: [72.8311, 21.1702] // [longitude, latitude] - Surat, Gujarat
        },
        address: 'Adajan, Surat',
        lastLocationUpdate: new Date()
      });
      
      await deliveryBoyProfile.save();
      console.log(`✅ Created delivery boy profile: ${deliveryBoyProfile._id}`);
      console.log(`   Vehicle: ${deliveryBoyProfile.vehicleType}`);
      console.log(`   License: ${deliveryBoyProfile.licenseNumber}`);
      console.log(`   Location: [${deliveryBoyProfile.location.coordinates[1]}, ${deliveryBoyProfile.location.coordinates[0]}]`);
      console.log(`   Available: ${deliveryBoyProfile.isAvailable}`);
    } else {
      console.log(`\n✅ Delivery boy profile already exists: ${deliveryBoyProfile._id}`);
      console.log(`   Location: [${deliveryBoyProfile.location.coordinates[1]}, ${deliveryBoyProfile.location.coordinates[0]}]`);
      
      // Update location if it's [0,0]
      if (deliveryBoyProfile.location.coordinates[0] === 0 && deliveryBoyProfile.location.coordinates[1] === 0) {
        console.log('   ⚠️ Location is [0,0], updating...');
        deliveryBoyProfile.location.coordinates = [72.8311, 21.1702];
        deliveryBoyProfile.lastLocationUpdate = new Date();
        await deliveryBoyProfile.save();
        console.log(`   ✅ Updated location to [21.1702, 72.8311]`);
      }
    }

    console.log('\n✨ Setup Complete!\n');
    console.log('📌 You can now login as:');
    console.log('   Email: ravi@delivery.com');
    console.log('   Password: password123');
    console.log('');
    console.log('📍 Delivery boy location: Adajan, Surat (21.1702, 72.8311)');
    console.log('   This is approximately 5-10km from Athwa area');
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

setupDeliveryBoy();
