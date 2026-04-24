const mongoose = require('mongoose');
const User = require('./models/User');
const Admin = require('./models/Admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function findAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // Find by role
        const admins = await User.find({ role: 'admin' });
        console.log('Admins found by role:', admins.length);
        for (const u of admins) {
            console.log(`ADMIN USER: ID=${u._id}, Name=${u.name}, Email=${u.email}`);
            const wallet = await Admin.findOne({ user: u._id });
            console.log(`WALLET: ${wallet ? 'Found (Bal: ' + wallet.availableBalance + ')' : 'MISSING'}`);
        }

        // Find by email specifically
        const email = 'quickeatsfoodadmin@gmail.com';
        const byEmail = await User.findOne({ email });
        if (byEmail) {
            console.log(`\nUser with email ${email}: ID=${byEmail._id}, Role=${byEmail.role}`);
        } else {
            console.log(`\nUser with email ${email}: NOT FOUND`);
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

findAdmin();
