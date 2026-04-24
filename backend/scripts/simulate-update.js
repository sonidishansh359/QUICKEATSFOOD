const axios = require('axios');
const mongoose = require('mongoose');
const Restaurant = require('../models/Restaurant');
const Owner = require('../models/Owner'); // Need Owner model
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Connect to local DB to get an owner ID and a restaurant ID
const uri = 'mongodb://localhost:27017/restaurant';

const simulateUpdate = async () => {
    try {
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        // Find Hariyali Hotel
        const restaurant = await Restaurant.findOne({ name: 'Hariyali Hotel' });
        if (!restaurant) {
            console.error('Hariyali Hotel not found!');
            return;
        }
        console.log('Found Restaurant:', restaurant.name, 'ID:', restaurant._id, 'Owner ID:', restaurant.owner);

        // Find the Owner document to get the User ID
        const ownerDoc = await Owner.findById(restaurant.owner);
        if (!ownerDoc) {
            console.error('Owner document not found for ID:', restaurant.owner);
            return;
        }

        console.log('Found Owner Document. User ID:', ownerDoc.user);

        // We need a token to hit the API. 
        const jwt = require('jsonwebtoken');
        // Hardcode from middleware fallback
        const secret = 'your_jwt_secret';
        console.log('Using Middleware Fallback Secret:', secret);

        // payload user.id must match the User ID linked to the Owner
        const token = jwt.sign(
            { user: { id: ownerDoc.user.toString(), role: 'owner' } },
            secret,
            { expiresIn: '1h' }
        );

        console.log('Generated Token for User ID:', ownerDoc.user);

        const apiUrl = 'http://localhost:5000/api/restaurants/' + restaurant._id;

        console.log('Sending PUT request to:', apiUrl);

        try {
            const response = await axios.put(apiUrl, {
                cuisine: 'Gujarati',
                name: restaurant.name // Keep name same
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            console.log('Response Status:', response.status);
            console.log('Response Data JSON:', JSON.stringify(response.data, null, 2));

            // Allow DB some time to update
            await new Promise(r => setTimeout(r, 1000));

            const updated = await Restaurant.findById(restaurant._id);
            console.log('--------------------------------------------------');
            console.log('Updated DB Value - Cuisine:', updated.cuisine);
            console.log('--------------------------------------------------');

        } catch (apiErr) {
            console.error('API Error:', apiErr.response ? apiErr.response.data : apiErr.message);
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
};

simulateUpdate();
