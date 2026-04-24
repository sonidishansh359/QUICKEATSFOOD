const mongoose = require('mongoose');
const Restaurant = require('../models/Restaurant');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const checkCuisines = async () => {
    try {
        // Use MONGO_URI or MONGODB_URI
        const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
        if (!uri) throw new Error('MONGO_URI is not defined in .env');
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const cuisines = ['Kathiyawadi', 'South Indian', 'Gujarati', 'Punjabi'];

        for (const cuisine of cuisines) {
            // Case-insensitive regex search
            const count = await Restaurant.countDocuments({
                cuisine: { $regex: new RegExp(cuisine, 'i') }
            });
            console.log(`Restaurants with cuisine '${cuisine}': ${count}`);

            if (count > 0) {
                const sample = await Restaurant.findOne({ cuisine: { $regex: new RegExp(cuisine, 'i') } }).select('name cuisine');
                console.log(`  - Sample: ${sample.name} (${sample.cuisine})`);
            }
        }

        // Also list all unique cuisines present
        const allCuisines = await Restaurant.distinct('cuisine');
        console.log('\nAll distinct cuisines in DB:', allCuisines);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
};

checkCuisines();
