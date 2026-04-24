const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const User = require('./models/User');
const Transaction = require('./models/Transaction');

async function testLocalDeduction() {
    try {
        const mongoURI = 'mongodb://localhost:27017/restaurant';
        console.log('Connecting to Local DB:', mongoURI);
        await mongoose.connect(mongoURI);
        console.log('Connected to Local DB');

        // 1. Find Admin User
        const ADMIN_EMAIL = 'quickeatsfoodadmin@gmail.com';
        let adminUser = await User.findOne({ email: ADMIN_EMAIL });

        if (adminUser) {
            let adminWallet = await Admin.findOne({ user: adminUser._id });

            if (adminWallet) {
                console.log('✅ Admin Wallet Found. Current Balance:', adminWallet.availableBalance);

                const amount = 10;
                const oldBalance = adminWallet.availableBalance;
                adminWallet.availableBalance -= amount;
                await adminWallet.save();

                console.log(`✅ TEST DEDUCTION SUCESS: ${oldBalance} -> ${adminWallet.availableBalance}`);

                // Create Dummy Transaction
                await Transaction.create({
                    admin: adminWallet._id,
                    amount: -amount,
                    type: 'withdrawal',
                    status: 'success',
                    description: `TEST DEDUCTION SCRIPT`,
                    referenceId: new mongoose.Types.ObjectId()
                });
                console.log('✅ Transaction Created');

            } else {
                console.error('❌ Admin Wallet NOT FOUND');
            }
        } else {
            console.error('❌ Admin User NOT FOUND');
        }

        process.exit();
    } catch (err) {
        console.error('SERVER ERROR:', err);
        process.exit(1);
    }
}

testLocalDeduction();
