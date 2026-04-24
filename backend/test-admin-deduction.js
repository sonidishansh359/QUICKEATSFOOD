const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const User = require('./models/User');
const Transaction = require('./models/Transaction');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function testDeduction() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        console.log('--- STARTING DEDUCTION TEST ---');

        // 1. Find Admin User (Exact copy of route logic)
        const ADMIN_EMAIL = 'quickeatsfoodadmin@gmail.com';
        let adminUser = await User.findOne({ email: ADMIN_EMAIL });

        if (!adminUser) {
            console.log('⚠️ Admin not found by email, trying role check...');
            adminUser = await User.findOne({ role: 'admin' });
        }

        if (adminUser) {
            console.log('✅ Admin User Found:', adminUser.email, `(${adminUser._id})`);

            let adminWallet = await Admin.findOne({ user: adminUser._id });

            if (adminWallet) {
                console.log('✅ Admin Wallet Found. Balance:', adminWallet.availableBalance);

                const amount = 50;
                adminWallet.availableBalance -= amount;
                await adminWallet.save();

                console.log(`✅ Deducted ${amount}. New Balance:`, adminWallet.availableBalance);

                // Create Dummy Transaction
                await Transaction.create({
                    admin: adminWallet._id,
                    amount: -amount,
                    type: 'withdrawal',
                    status: 'success',
                    description: `TEST DEDUCTION`,
                    referenceId: new mongoose.Types.ObjectId()
                });
                console.log('✅ Transaction Created');

            } else {
                console.error('❌ Admin Wallet NOT FOUND');
                // Try to see if ANY admin wallet exists
                const anyWallet = await Admin.findOne({});
                console.log('   Any Admin Wallet in DB?', anyWallet);
            }
        } else {
            console.error('❌ Admin User NOT FOUND');
        }

        console.log('--- TEST FINISHED ---');
        process.exit();
    } catch (err) {
        console.error('SERVER ERROR:', err);
        process.exit(1);
    }
}

testDeduction();
