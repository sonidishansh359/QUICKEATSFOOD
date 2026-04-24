const mongoose = require('mongoose');
const Restaurant = require('./models/Restaurant');

mongoose.connect('mongodb://localhost:27017/restaurant', {useNewUrlParser: true, useUnifiedTopology: true})
  .then(async () => {
    // Update all restaurants with random ratings between 3.5 and 4.9
    const restaurants = await Restaurant.find();
    for (let restaurant of restaurants) {
      restaurant.rating = parseFloat((Math.random() * 1.4 + 3.5).toFixed(1));
      await restaurant.save();
    }
    
    // Get new average
    const updated = await Restaurant.find({ rating: { $gt: 0 } });
    const avgRating = (updated.reduce((sum, r) => sum + parseFloat(r.rating), 0) / updated.length).toFixed(1);
    
    console.log('Updated', restaurants.length, 'restaurants with ratings');
    console.log('New average rating:', avgRating);
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
