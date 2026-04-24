const mongoose = require('mongoose');
const Restaurant = require('../models/Restaurant');
const Owner = require('../models/Owner');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const uri = 'mongodb://localhost:27017/restaurant';

const fixData = async () => {
    try {
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        // 1. Get a valid fallback owner
        const fallbackOwner = await Owner.findOne({});
        if (!fallbackOwner) {
            console.error('CRITICAL: No owners found in DB!');
            return;
        }
        console.log(`Using fallback owner: ${fallbackOwner._id} (User: ${fallbackOwner.user})`);

        const restaurants = await Restaurant.find({});
        console.log(`Found ${restaurants.length} restaurants to check.`);

        const cuisines = [
            'Kathiyawadi', 'Punjabi', 'Chinese', 'South Indian', 'Gujarati',
            'Indian', 'Italian', 'Mexican', 'American', 'Thai',
            'Japanese', 'Mediterranean', 'Fast Food', 'Pizza', 'Burgers'
        ];

        for (const r of restaurants) {
            let updated = false;

            // Fix Owner Link
            if (!r.owner) {
                console.log(`[${r.name}] Missing owner. Assigning fallback.`);
                r.owner = fallbackOwner._id;
                updated = true;
            } else {
                const ownerExists = await Owner.exists({ _id: r.owner });
                if (!ownerExists) {
                    console.log(`[${r.name}] Broken owner link (${r.owner}). Assigning fallback.`);
                    r.owner = fallbackOwner._id;
                    updated = true;
                }
            }

            // Fix Cuisine
            if (!r.cuisine || r.cuisine === 'Various' || r.cuisine === 'undefined') {
                // Assign a random valid cuisine to make it filterable
                const randomCuisine = cuisines[Math.floor(Math.random() * cuisines.length)];
                console.log(`[${r.name}] Missing/Invalid cuisine '${r.cuisine}'. Setting to '${randomCuisine}'.`);
                r.cuisine = randomCuisine;
                updated = true;
            }

            if (updated) {
                await r.save();
                console.log(`-> Saved updates for ${r.name}`);
            }
        }

        console.log('Done fixing data.');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
};

fixData();
