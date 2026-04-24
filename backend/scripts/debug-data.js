const mongoose = require('mongoose');
const Restaurant = require('../models/Restaurant');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const inspectData = async () => {
    try {
        const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
        if (!uri) throw new Error('MONGO_URI is not defined in .env');
        await mongoose.connect(uri);
        console.log(`Connected to MongoDB: ${mongoose.connection.name}`);

        const count = await Restaurant.countDocuments();
        console.log(`Total restaurants: ${count}`);

        const restaurants = await Restaurant.find().limit(5);
        console.log('Sample restaurants:');
        restaurants.forEach(r => {
            console.log(`- Name: "${r.name}"`);
            console.log(`  Cuisine: "${r.cuisine}"`);
        });

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
};

inspectData();
