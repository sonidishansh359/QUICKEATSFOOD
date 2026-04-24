const mongoose = require('mongoose');
const Restaurant = require('../models/Restaurant');
const Owner = require('../models/Owner');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const uri = 'mongodb://localhost:27017/restaurant';

const auditRestaurants = async () => {
    try {
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const restaurants = await Restaurant.find({});
        console.log(`\nFound ${restaurants.length} restaurants. Auditing...`);

        console.log('--------------------------------------------------');
        console.log('NAME | CUISINE | OWNER_STATUS');
        console.log('--------------------------------------------------');

        for (const r of restaurants) {
            let ownerStatus = 'OK';
            if (!r.owner) {
                ownerStatus = 'MISSING_FIELD';
            } else {
                try {
                    const owner = await Owner.findById(r.owner);
                    if (!owner) ownerStatus = 'BROKEN_LINK (' + r.owner + ')';
                } catch (e) {
                    ownerStatus = 'INVALID_ID (' + r.owner + ')';
                }
            }

            console.log(`${(r.name || 'Unnamed').padEnd(20)} | ${(r.cuisine || 'MISSING').padEnd(15)} | ${ownerStatus}`);
        }
        console.log('--------------------------------------------------');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
};

auditRestaurants();
