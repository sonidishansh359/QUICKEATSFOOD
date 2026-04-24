const mongoose = require('mongoose');
const User = require('../backend/models/User');
const Order = require('../backend/models/Order');
const Restaurant = require('../backend/models/Restaurant');
const Owner = require('../backend/models/Owner');
const DeliveryBoy = require('../backend/models/DeliveryBoy');
const Admin = require('../backend/models/Admin');
const Transaction = require('../backend/models/Transaction');
const MenuItem = require('../backend/models/MenuItem');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/restaurant';

async function verifyFlow() {
    try {
        await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('✅ Connected to MongoDB');

        // --- SETUP TEST DATA ---
        const suffix = Date.now();

        // 1. Create Admin
        const adminUser = await User.create({
            name: `Test Admin ${suffix}`,
            email: `admin${suffix}@test.com`,
            password: 'password123',
            role: 'admin'
        });

        // Reset Admin Wallet to 1000 for clear testing (Start with float)
        let adminParams = { user: adminUser._id, availableBalance: 1000, totalEarnings: 0 };
        const admin = await Admin.create(adminParams);
        console.log(`✅ Created Admin: ${adminUser.email} (Balance: ${admin.availableBalance})`);

        // 2. Create Owner & Restaurant
        const ownerUser = await User.create({
            name: `Test Owner ${suffix}`,
            email: `owner${suffix}@test.com`,
            password: 'password123',
            role: 'owner'
        });
        const owner = await Owner.create({ user: ownerUser._id, availableBalance: 0 });

        const restaurant = await Restaurant.create({
            name: `Test Resto ${suffix}`,
            owner: owner._id,
            address: 'Test Address',
            location: { type: 'Point', coordinates: [0, 0] },
            isOpen: true
        });

        const menuItem = await MenuItem.create({
            restaurant: restaurant._id,
            name: 'Test Item',
            price: 100,
            description: 'Yummy'
        });
        console.log(`✅ Created Restaurant & Owner (Balance: ${owner.availableBalance})`);

        // 3. Create Delivery Boy
        const deliveryUser = await User.create({
            name: `Test Rider ${suffix}`,
            email: `rider${suffix}@test.com`,
            phone: '1234567890',
            password: 'password123',
            role: 'delivery_boy'
        });
        const deliveryBoy = await DeliveryBoy.create({
            user: deliveryUser._id,
            availableBalance: 0,
            isAvailable: true
        });
        console.log(`✅ Created Delivery Boy (Balance: ${deliveryBoy.availableBalance})`);

        // 4. Create Customer
        const customer = await User.create({
            name: `Test Cust ${suffix}`,
            email: `cust${suffix}@test.com`,
            password: 'password123',
            role: 'user'
        });
        console.log(`✅ Created Customer`);


        // --- SIMULATE FLOW ---
        // Instead of API, we test the logic via manual steps here to confirm DB constraints work
        // (Actual API testing requires server, which we assume is not running for this script)

        const orderTotal = 100;

        // Step 1: Admin Credited (logic from POST /orders)
        // Admin Balance Start: 1000
        // Order: 100
        // Admin New: 1100

        admin.availableBalance += orderTotal;
        admin.totalEarnings += orderTotal;
        await admin.save();
        console.log(`💰 Order Placed -> Admin Balance: ${admin.availableBalance} (Expected: 1100)`);

        // Step 2: Owner Payout (logic from PUT /orders/:id/status -> out_for_delivery)
        // Owner Share: 100 (Total Amount for now)
        // Admin Balance: 1100
        // Remainder: 1000

        const ownerEarning = 100;
        if (admin.availableBalance >= ownerEarning) {
            admin.availableBalance -= ownerEarning;
            await admin.save();

            owner.availableBalance += ownerEarning;
            await owner.save();
            console.log(`🚚 Out for Delivery -> Admin Deducted: ${ownerEarning}. New Balance: ${admin.availableBalance} (Expected: 1000)`);
            console.log(`   Owner Credited: ${ownerEarning}. New Balance: ${owner.availableBalance} (Expected: 100)`);
        } else {
            console.error('❌ Owner Payout Failed (Insufficient Admin Funds)');
        }

        // Step 3: Delivery Payout (logic from PUT /orders/:id/verify-delivery-otp -> delivered)
        // Delivery Share: 10 (10%)
        // Admin Balance: 1000
        // New Balance: 990

        const deliveryEarning = 10;
        if (admin.availableBalance >= deliveryEarning) {
            admin.availableBalance -= deliveryEarning;
            await admin.save();

            deliveryBoy.earnings += deliveryEarning;
            deliveryBoy.availableBalance += deliveryEarning;
            await deliveryBoy.save();
            console.log(`✅ Delivered -> Admin Deducted: ${deliveryEarning}. New Balance: ${admin.availableBalance} (Expected: 990)`);
            console.log(`   Delivery Credited: ${deliveryEarning}. New Balance: ${deliveryBoy.availableBalance} (Expected: 10)`);
        } else {
            console.error('❌ Delivery Payout Failed (Insufficient Admin Funds)');
        }

        // CONCLUSION:
        // With 1000 float, logic holds.
        // Without float (0 start), 100 credit -> 100 pay owner -> 0 rem -> 10 pay delivery FAIL (negative).
        // This confirms the Business Logic Gaps. I will notify user about "Commission Fee" needs.

    } catch (err) {
        console.error('Verify failed:', err);
    } finally {
        await mongoose.disconnect();
    }
}

verifyFlow();
