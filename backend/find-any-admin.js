const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const User = require('./models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function findAnyAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // 1. Find ANY Admin Wallet
        const wallets = await Admin.find({});
        console.log('Total Admin Wallets:', wallets.length);

        for (const w of wallets) {
            console.log(`Wallet found: ID=${w._id}, UserID=${w.user}, Bal=${w.availableBalance}`);
            const u = await User.findById(w.user);
            console.log(`   -> User: ${u ? u.email + ' (' + u.role + ')' : 'MISSING'}`);
        }

        if (wallets.length === 0) {
            console.log('❌ NO WALLETS FOUND AT ALL.');
            // List top 5 users again
            const users = await User.find({}).limit(5);
            console.log('Top 5 users:', users.map(u => `${u.email} (${u.role})`));
        }

        process.exit();
    } catch (err) {
        console.error('SERVER ERROR:', err);
        process.exit(1);
    }
}

findAnyAdmin();
