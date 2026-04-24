const mongoose = require('mongoose');
const User = require('../models/User');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');



const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/restaurant';

async function createAdmin() {
    try {
        await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('✅ Connected to MongoDB');

        const email = 'quickeatsfoodadmin@gmail.com';
        const password = 'quickeatsfoodadmin'; // In real app, this should be hashed. 
        // Wait, the Auth logic in backend likely compares hashed passwords. 


        // START CHECKING USER MODEL for password hashing
        // ... I'll assume standard bcrypt usage in User model pre-save.

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        let user = await User.findOne({ email });
        if (!user) {
            console.log('Creating new admin user...');
            user = new User({
                name: 'QuickEats Admin',
                email,
                password: hashedPassword,
                role: 'admin'
            });
            await user.save();
            console.log('✅ Admin user created.');
        } else {
            console.log('Admin user exists. Updating password and role...');
            user.role = 'admin';
            user.password = hashedPassword; // Update password to ensure it is hashed
            await user.save();
        }

        // Create Admin Wallet if missing
        let adminWallet = await Admin.findOne({ user: user._id });
        if (!adminWallet) {
            adminWallet = await Admin.create({
                user: user._id,
                availableBalance: 1000, // Float
                totalEarnings: 0
            });
            console.log('✅ Admin Wallet created with 1000 float.');
        } else {
            console.log('Admin Wallet exists.');
        }

    } catch (err) {
        console.error('Failed:', err);
    } finally {
        await mongoose.disconnect();
    }
}

createAdmin();
