const mongoose = require('mongoose');
require('dotenv').config();

async function fixIndex() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/restaurant', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB');

    // Get the orders collection
    const db = mongoose.connection.db;
    const collection = db.collection('orders');

    // List all indexes
    const indexes = await collection.indexes();
    console.log('\n📋 Current indexes on orders collection:');
    indexes.forEach(idx => {
      console.log(`  - ${JSON.stringify(idx)}`);
    });

    // Drop the problematic deliveryAddress index if it exists
    try {
      await collection.dropIndex('deliveryAddress_2dsphere');
      console.log('\n✅ Dropped deliveryAddress_2dsphere index');
    } catch (err) {
      console.log('\nℹ️  deliveryAddress_2dsphere index not found or already dropped');
    }

    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixIndex();
