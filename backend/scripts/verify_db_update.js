const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const verifyPersistence = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/restaurant');
        console.log('Connected to MongoDB');

        // 1. Create a dummy delivery boy if not exists
        const testEmail = 'test_tracker@example.com';
        let user = await User.findOne({ email: testEmail });

        if (!user) {
            user = new User({
                name: 'Test Tracker',
                email: testEmail,
                password: 'password123',
                role: 'delivery_boy',
                phone: '1234567890'
            });
            await user.save();
            console.log('Created test user:', user._id);
        } else {
            console.log('Found test user:', user._id);
        }

        // 2. Simulate the Socket Logic directly (Unit Test Style)
        // We are testing: User.findByIdAndUpdate(userId, { location: ... })

        const testLat = 20.5 + Math.random();
        const testLng = 78.9 + Math.random();

        console.log(`Simulating update to: [${testLng}, ${testLat}]`);

        await User.findByIdAndUpdate(user._id, {
            location: {
                type: 'Point',
                coordinates: [testLng, testLat]
            },
            lastLocationUpdate: new Date()
        });

        // 3. Verify
        const updatedUser = await User.findById(user._id);
        console.log('Updated User Location from DB:', updatedUser.location);

        if (updatedUser.location.coordinates[0] === testLng && updatedUser.location.coordinates[1] === testLat) {
            console.log('✅ VERIFICATION SUCCESS: Location persisted correctly.');
        } else {
            console.error('❌ VERIFICATION FAILED: Location mismatch.');
        }

        mongoose.disconnect();
    } catch (err) {
        console.error(err);
        mongoose.disconnect();
    }
};

verifyPersistence();
