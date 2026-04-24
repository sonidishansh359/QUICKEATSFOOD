const mongoose = require('mongoose');
const Owner = require('../models/Owner');
const Restaurant = require('../models/Restaurant');

const uri = 'mongodb://localhost:27017/restaurant';

const checkOwner = async () => {
    try {
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const restaurant = await Restaurant.findOne({ name: 'Hariyali Hotel' });
        if (!restaurant) {
            console.log('Hariyali Hotel not found');
            return;
        }
        console.log(`Restaurant: ${restaurant.name}, Owner Ref: ${restaurant.owner}`);

        const owner = await Owner.findById(restaurant.owner);
        if (owner) {
            console.log(`Owner FOUND: ID: ${owner._id}, User: ${owner.user}`);
        } else {
            console.log('Owner NOT FOUND. This is the issue.');

            // Fix it by assigning to a valid owner (users usually have one)
            const anyOwner = await Owner.findOne();
            if (anyOwner) {
                console.log(`Assigning to valid owner: ${anyOwner._id} (User: ${anyOwner.user})`);
                restaurant.owner = anyOwner._id;
                await restaurant.save();
                console.log('Restaurant updated with valid owner.');
            }
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
};

checkOwner();
