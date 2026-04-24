/**
 * Seed Location Data for Testing
 * Run: npm run seed:locations (from backend directory)
 * Creates test restaurants, users, and delivery boys with valid coordinates
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Owner = require('./models/Owner');
const Restaurant = require('./models/Restaurant');
const DeliveryBoy = require('./models/DeliveryBoy');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/restaurant';

/**
 * Sample Coordinates (Delhi, India)
 * All coordinates in [longitude, latitude] format for GeoJSON
 */
const RESTAURANT_LOCATIONS = [
  {
    name: 'Italian Pasta House',
    cuisine: 'Italian',
    address: 'Connaught Place, New Delhi',
    coordinates: [77.1871, 28.6328]
  },
  {
    name: 'Spice Garden',
    cuisine: 'Indian',
    address: 'Defense Colony, South Delhi',
    coordinates: [77.2310, 28.5688]
  },
  {
    name: 'Dragon Palace',
    cuisine: 'Chinese',
    address: 'Noida, Delhi NCR',
    coordinates: [77.3566, 28.5921]
  },
  {
    name: 'Burger Station',
    cuisine: 'American',
    address: 'Lajpat Nagar, New Delhi',
    coordinates: [77.2470, 28.5610]
  },
  {
    name: 'Sushi Delight',
    cuisine: 'Japanese',
    address: 'Sector 18, Noida',
    coordinates: [77.3474, 28.5862]
  },
  {
    name: 'Taco Fiesta',
    cuisine: 'Mexican',
    address: 'Rajouri Garden, Delhi',
    coordinates: [77.0715, 28.6705]
  }
];

const USER_LOCATIONS = [
  { latitude: 28.7041, longitude: 77.1025, address: 'Central Delhi' },
  { latitude: 28.6328, longitude: 77.1871, address: 'Delhi Center' },
  { latitude: 28.5688, longitude: 77.2310, address: 'South Delhi' },
  { latitude: 28.5862, longitude: 77.3474, address: 'Noida' }
];

const DELIVERY_BOY_LOCATIONS = [
  { latitude: 28.6139, longitude: 77.2090, address: 'South Delhi' },
  { latitude: 28.7041, longitude: 77.1025, address: 'Central Delhi' },
  { latitude: 28.5921, longitude: 77.3566, address: 'Noida' }
];

/**
 * Hash password
 */
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Seed database
 */
async function seedData() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Owner.deleteMany({});
    await Restaurant.deleteMany({});
    await DeliveryBoy.deleteMany({});
    console.log('✅ Cleared existing data');

    // Create test users (regular users)
    console.log('👤 Creating test users...');
    const hashedPassword = await hashPassword('password123');
    const users = [];

    for (let i = 0; i < USER_LOCATIONS.length; i++) {
      const location = USER_LOCATIONS[i];
      const user = await User.create({
        name: `Test User ${i + 1}`,
        email: `user${i + 1}@test.com`,
        phone: `9900000${i + 1}`,
        password: hashedPassword,
        role: 'user',
        location: {
          type: 'Point',
          coordinates: [location.longitude, location.latitude]
        },
        address: location.address,
        lastLocationUpdate: new Date()
      });
      users.push(user);
      console.log(`  ✅ Created user: ${user.name}`);
    }

    // Create test owners and restaurants
    console.log('\n🏪 Creating test owners and restaurants...');
    const owners = [];
    const restaurants = [];

    for (let i = 0; i < RESTAURANT_LOCATIONS.length; i++) {
      const restLocation = RESTAURANT_LOCATIONS[i];

      // Create owner user
      const ownerUser = await User.create({
        name: `Restaurant Owner ${i + 1}`,
        email: `owner${i + 1}@test.com`,
        phone: `9910000${i + 1}`,
        password: hashedPassword,
        role: 'owner',
        location: {
          type: 'Point',
          coordinates: [restLocation.coordinates[0], restLocation.coordinates[1]]
        },
        lastLocationUpdate: new Date()
      });

      // Create owner profile
      const owner = await Owner.create({
        user: ownerUser._id,
        location: {
          type: 'Point',
          coordinates: [restLocation.coordinates[0], restLocation.coordinates[1]]
        },
        address: restLocation.address,
        lastLocationUpdate: new Date()
      });

      // Create restaurant
      const restaurant = await Restaurant.create({
        name: restLocation.name,
        description: `Delicious ${restLocation.cuisine} food`,
        cuisine: restLocation.cuisine,
        address: restLocation.address,
        phone: `9920000${i + 1}`,
        image: 'https://via.placeholder.com/400x300',
        isOpen: true,
        rating: Math.floor(Math.random() * 5) + 1,
        deliveryTime: '30-40 mins',
        minOrder: 10,
        openingTime: '10:00 AM',
        closingTime: '11:00 PM',
        location: {
          type: 'Point',
          coordinates: restLocation.coordinates
        },
        city: 'Delhi',
        state: 'Delhi',
        zipCode: '110000',
        owner: owner._id
      });

      owner.restaurants.push(restaurant._id);
      await owner.save();

      owners.push(owner);
      restaurants.push(restaurant);
      console.log(`  ✅ Created restaurant: ${restaurant.name}`);
    }

    // Create test delivery boys
    console.log('\n🚴 Creating test delivery boys...');
    const deliveryBoys = [];

    for (let i = 0; i < DELIVERY_BOY_LOCATIONS.length; i++) {
      const dbLocation = DELIVERY_BOY_LOCATIONS[i];

      const dbUser = await User.create({
        name: `Delivery Boy ${i + 1}`,
        email: `delivery${i + 1}@test.com`,
        phone: `9930000${i + 1}`,
        password: hashedPassword,
        role: 'delivery_boy',
        location: {
          type: 'Point',
          coordinates: [dbLocation.longitude, dbLocation.latitude]
        },
        lastLocationUpdate: new Date()
      });

      const deliveryBoy = await DeliveryBoy.create({
        user: dbUser._id,
        phone: `9930000${i + 1}`,
        vehicleType: i % 3 === 0 ? 'bike' : i % 3 === 1 ? 'car' : 'scooter',
        licenseNumber: `LIC${100 + i}`,
        isAvailable: true,
        location: {
          type: 'Point',
          coordinates: [dbLocation.longitude, dbLocation.latitude]
        },
        address: dbLocation.address,
        lastLocationUpdate: new Date()
      });

      deliveryBoys.push(deliveryBoy);
      console.log(`  ✅ Created delivery boy: ${deliveryBoy.user} (${deliveryBoy.vehicleType})`);
    }

    console.log('\n✅ Seed Complete!');
    console.log('\n📊 Summary:');
    console.log(`  • ${users.length} regular users created`);
    console.log(`  • ${owners.length} owners created`);
    console.log(`  • ${restaurants.length} restaurants created`);
    console.log(`  • ${deliveryBoys.length} delivery boys created`);

    console.log('\n🔧 MongoDB Indexes Created:');
    console.log('  • users.location (2dsphere)');
    console.log('  • owners.location (2dsphere)');
    console.log('  • restaurants.location (2dsphere)');
    console.log('  • deliveryboys.location (2dsphere)');

    console.log('\n📍 Sample Coordinates (for testing):');
    console.log('  User: [28.7041, 77.1025]');
    console.log('  Restaurant: [77.1871, 28.6328]');
    console.log('  Delivery Boy: [28.6139, 77.2090]');

    console.log('\n🧪 Test Credentials:');
    console.log('  • Email: user1@test.com');
    console.log('  • Email: owner1@test.com');
    console.log('  • Email: delivery1@test.com');
    console.log('  • Password: password123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

// Run seed
seedData();
