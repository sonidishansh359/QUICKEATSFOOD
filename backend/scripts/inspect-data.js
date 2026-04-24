const mongoose = require('mongoose');
const Restaurant = require('../models/Restaurant');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const inspectData = async () => {
    try {
        const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
        if (!uri) {
            console.error('No MONGO_URI');
            process.exit(1);
        }
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const restaurants = await Restaurant.find({});
        console.log(`Found ${restaurants.length} restaurants.`);

        restaurants.forEach(r => {
            console.log(`ID: ${r._id}`);
            console.log(`Name: ${r.name}`);
            console.log(`Cuisine (${typeof r.cuisine}): "${r.cuisine}"`);
            if (Array.isArray(r.cuisine)) {
                console.log('WARNING: Cuisine is an ARRAY');
            }
            console.log('---');
        });

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
};

inspectData();
