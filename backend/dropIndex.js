// Script to drop indexes if needed
const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://dishansh:dishansh@cluster1.huxpfpq.mongodb.net/?appName=Cluster1', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('Connected to MongoDB');

  // Drop all indexes for all collections
  const collections = await mongoose.connection.db.listCollections().toArray();
  for (const collection of collections) {
    await mongoose.connection.db.collection(collection.name).dropIndexes();
    console.log(`Dropped indexes for ${collection.name}`);
  }

  console.log('All indexes dropped');
  process.exit();
})
.catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
