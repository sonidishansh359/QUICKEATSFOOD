const mongoose = require('mongoose');
const Owner = require('../models/Owner');
const Restaurant = require('../models/Restaurant');

const uri = 'mongodb://localhost:27017/restaurant';

const listOwners = async () => {
    try {
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const owners = await Owner.find({});
        console.log(`Found ${owners.length} owners:`);
        owners.forEach(o => {
            console.log(`- ID: ${o._id}, User: ${o.user}, Restaurants: ${o.restaurants}`);
        });

        // Also list existing restaurants and their owner IDs
        const restaurants = await Restaurant.find({}).limit(5);
        console.log(`\nRestaurants checking (top 5):`);
        restaurants.forEach(r => {
            console.log(`- Name: ${r.name}, Owner Ref: ${r.owner}`);
        });

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
};

listOwners();
