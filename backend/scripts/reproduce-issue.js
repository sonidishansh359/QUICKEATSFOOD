const mongoose = require('mongoose');
const Restaurant = require('../models/Restaurant');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const reproduceIssue = async () => {
    try {
        const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
        await mongoose.connect(uri);

        const cuisine = "Pizza";
        const matchStage = { isOpen: true, deleted: { $ne: true }, approved: true };

        if (cuisine && cuisine !== 'All') {
            matchStage.cuisine = { $regex: new RegExp(cuisine, 'i') };
        }

        console.log('Match Stage:', matchStage);

        // Mocking the geoNear part (simplifying by just matching)
        // In reality locations.js uses aggregate with $geoNear first. 
        // We will mock it with find() first to test the match logic.

        const count = await Restaurant.countDocuments(matchStage);
        console.log(`Found ${count} restaurants matching cuisine '${cuisine}'`);

        const restaurants = await Restaurant.find(matchStage);
        restaurants.forEach(r => console.log(`- ${r.name} (${r.cuisine})`));

        if (count > 0) {
            console.log('ISSUE REPRODUCED: Found restaurants that do NOT have Pizza cuisine.');
        } else {
            console.log('Correct behavior: No restaurants found for Pizza.');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
};

reproduceIssue();
