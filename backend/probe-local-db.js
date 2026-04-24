const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const User = require('./models/User');

async function probeLocalDB() {
    try {
        const mongoURI = 'mongodb://localhost:27017/restaurant';
        console.log('Connecting to Local DB:', mongoURI);
        await mongoose.connect(mongoURI);
        console.log('Connected to Local DB');

        // 1. Find Admin User
        const ADMIN_EMAIL = 'quickeatsfoodadmin@gmail.com';
        let adminUser = await User.findOne({ email: ADMIN_EMAIL });

        if (adminUser) {
            console.log('✅ Admin User Found by Email:', adminUser.email, `(${adminUser._id})`);
        } else {
            console.log('⚠️ Admin not found by email, trying role check...');
            adminUser = await User.findOne({ role: 'admin' });
            if (adminUser) console.log('✅ Admin User Found by Role:', adminUser.email);
        }

        if (adminUser) {
            let adminWallet = await Admin.findOne({ user: adminUser._id });

            if (adminWallet) {
                console.log('✅ Admin Wallet Found. Balance:', adminWallet.availableBalance);
            } else {
                console.log('⚠️ Admin Wallet NOT FOUND. Creating new one...');
                adminWallet = new Admin({
                    user: adminUser._id,
                    availableBalance: 0,
                    totalEarnings: 0
                });
                await adminWallet.save();
                console.log('✅ Admin Wallet Created Successfully!');
            }
        } else {
            console.error('❌ Admin User NOT FOUND in Local DB!');
        }

        process.exit();
    } catch (err) {
        console.error('SERVER ERROR:', err);
        process.exit(1);
    }
}

probeLocalDB();
