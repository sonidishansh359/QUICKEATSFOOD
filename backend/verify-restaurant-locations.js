const mongoose = require('mongoose');
require('dotenv').config();

const Restaurant = require('./models/Restaurant');

async function verifyRestaurantLocations() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/food-delivery');
    console.log('✅ Connected to MongoDB');

    // Check indexes
    const indexes = await Restaurant.collection.getIndexes();
    console.log('\n📊 Restaurant Collection Indexes:');
    console.log(JSON.stringify(indexes, null, 2));

    // Check restaurants
    const restaurants = await Restaurant.find({});
    console.log(`\n🏪 Found ${restaurants.length} restaurants in database\n`);

    let withLocation = 0;
    let withoutLocation = 0;

    restaurants.forEach((restaurant, index) => {
      console.log(`${index + 1}. ${restaurant.name} (${restaurant._id})`);
      console.log(`   Address: ${restaurant.address}`);
      
      if (restaurant.location && 
          restaurant.location.coordinates && 
          restaurant.location.coordinates.length === 2 &&
          (restaurant.location.coordinates[0] !== 0 || restaurant.location.coordinates[1] !== 0)) {
        console.log(`   ✅ Location: [${restaurant.location.coordinates[0]}, ${restaurant.location.coordinates[1]}]`);
        withLocation++;
      } else {
        console.log(`   ❌ NO VALID LOCATION COORDINATES`);
        withoutLocation++;
      }
      console.log('');
    });

    console.log('\n📈 Summary:');
    console.log(`   Restaurants with location: ${withLocation}`);
    console.log(`   Restaurants without location: ${withoutLocation}`);
    
    if (withoutLocation > 0) {
      console.log('\n⚠️  WARNING: Some restaurants don\'t have valid location coordinates!');
      console.log('   These restaurants will NOT appear in geofenced queries.');
      console.log('   Solution: Delete these restaurants and recreate them after enabling location permissions.');
    }

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyRestaurantLocations();
