const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const User = require('./models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function fixAdminWallet() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // 1. Find Admin User
        const ADMIN_EMAIL = 'quickeatsfoodadmin@gmail.com';
        let adminUser = await User.findOne({ email: ADMIN_EMAIL });

        if (!adminUser) {
            console.log('⚠️ Admin not found by email, trying role check...');
            adminUser = await User.findOne({ role: 'admin' });
        }

        if (adminUser) {
            console.log('✅ Admin User Found:', adminUser.email, `(${adminUser._id})`);

            let adminWallet = await Admin.findOne({ user: adminUser._id });

            if (!adminWallet) {
                console.log('⚠️ Admin Wallet NOT FOUND. Creating new one...');
                adminWallet = new Admin({
                    user: adminUser._id,
                    availableBalance: 0,
                    totalEarnings: 0
                });
                await adminWallet.save();
                console.log('✅ Admin Wallet Created Successfully!');
            } else {
                console.log('✅ Admin Wallet already exists.');
            }

            console.log('Current Balance:', adminWallet.availableBalance);

        } else {
            console.error('❌ Admin User NOT FOUND - Cannot create wallet!');
        }

        process.exit();
    } catch (err) {
        console.error('SERVER ERROR:', err);
        process.exit(1);
    }
}

fixAdminWallet();
