const mongoose = require('mongoose');
const User = require('./backend/models/User');
const Admin = require('./backend/models/Admin');
require('dotenv').config({ path: './backend/.env' });

async function checkAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const adminEmail = 'quickeatsfoodadmin@gmail.com';
        const userByEmail = await User.findOne({ email: adminEmail });
        console.log('User by Email:', userByEmail ? userByEmail._id : 'Not Found');

        const userByRole = await User.findOne({ role: 'admin' });
        console.log('User by Role (admin):', userByRole ? userByRole._id : 'Not Found');

        if (userByEmail) {
            const adminWallet = await Admin.findOne({ user: userByEmail._id });
            console.log('Admin Wallet (by Email User):', adminWallet);
        }

        if (userByRole && (!userByEmail || userByRole._id.toString() !== userByEmail._id.toString())) {
            const adminWallet = await Admin.findOne({ user: userByRole._id });
            console.log('Admin Wallet (by Role User):', adminWallet);
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkAdmin();
