const mongoose = require('mongoose');
const User = require('./models/User');
const Admin = require('./models/Admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function checkAdmin() {
    try {
        console.log('Connecting to Mongo URI:', process.env.MONGO_URI ? 'FOUND' : 'MISSING');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const adminEmail = 'quickeatsfoodadmin@gmail.com';
        const userByEmail = await User.findOne({ email: adminEmail });

        if (userByEmail) {
            console.log('User by Email FOUND:', userByEmail._id);
            const adminWallet = await Admin.findOne({ user: userByEmail._id });
            console.log('Admin Wallet (by Email User):', adminWallet ? 'FOUND (Balance: ' + adminWallet.availableBalance + ')' : 'NOT FOUND');
        } else {
            console.log('User by Email NOT FOUND');
        }

        const userByRole = await User.findOne({ role: 'admin' });
        if (userByRole) {
            console.log('User by Role (admin) FOUND:', userByRole._id);
            if (!userByEmail || userByRole._id.toString() !== userByEmail._id.toString()) {
                const adminWallet = await Admin.findOne({ user: userByRole._id });
                console.log('Admin Wallet (by Role User):', adminWallet ? 'FOUND (Balance: ' + adminWallet.availableBalance + ')' : 'NOT FOUND');
            }
        } else {
            console.log('User by Role (admin) NOT FOUND');
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkAdmin();
