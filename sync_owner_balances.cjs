
const mongoose = require('mongoose');
const path = require('path');

// Models
const Order = require('./backend/models/Order');
const Owner = require('./backend/models/Owner');
const Admin = require('./backend/models/Admin');
const Transaction = require('./backend/models/Transaction');
const User = require('./backend/models/User');
const Restaurant = require('./backend/models/Restaurant');

async function syncBalances() {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://dishansh:dishansh@cluster1.huxpfpq.mongodb.net/quickeats?retryWrites=true&w=majority&appName=Cluster1';
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Find all orders that are 'delivered' or 'out_for_delivery'
    const orders = await Order.find({
      status: { $in: ['delivered', 'out_for_delivery'] }
    });

    console.log(`🔍 Found ${orders.length} orders to verify for owner payouts.`);

    let totalProcessed = 0;
    let totalAlreadyPaid = 0;
    let totalFailed = 0;

    for (const order of orders) {
      // Check if payout already exists for this order
      const existingTx = await Transaction.findOne({
        referenceId: order._id.toString(),
        type: 'earning',
        description: { $regex: 'Earnings from Order' }
      });

      if (existingTx) {
        totalAlreadyPaid++;
        continue;
      }

      console.log(`💰 Processing missing payout for Order #${order._id.toString().slice(-6)}...`);

      // Process Payout (Copied logic from processOwnerPayout for autonomy)
      const earningAmount = order.ownerEarning || (order.totalAmount * 0.85);

      // Find Admin
      const ADMIN_EMAIL = 'quickeatsfoodadmin@gmail.com';
      let adminUser = await User.findOne({ email: ADMIN_EMAIL }) || await User.findOne({ role: 'admin' });
      if (!adminUser) {
        console.error('   ❌ Admin user not found');
        totalFailed++;
        continue;
      }
      const admin = await Admin.findOne({ user: adminUser._id });
      if (!admin) {
        console.error('   ❌ Admin wallet not found');
        totalFailed++;
        continue;
      }

      // Find Owner
      const restaurant = await Restaurant.findById(order.restaurant);
      if (!restaurant || !restaurant.owner) {
        console.error('   ❌ Restaurant owner not found');
        totalFailed++;
        continue;
      }
      const owner = await Owner.findById(restaurant.owner);
      if (!owner) {
        console.error('   ❌ Owner profile not found');
        totalFailed++;
        continue;
      }

      // Transfer Funds
      admin.availableBalance = (admin.availableBalance || 0) - earningAmount;
      await admin.save();

      owner.availableBalance = (owner.availableBalance || 0) + earningAmount;
      await owner.save();

      // Create Transactions
      await Transaction.create({
        owner: owner._id,
        amount: earningAmount,
        type: 'earning',
        status: 'success',
        referenceId: order._id.toString(),
        description: `Earnings from Order #${order._id.toString().slice(-6)} (Sync)`
      });

      await Transaction.create({
        admin: admin._id,
        amount: -earningAmount,
        type: 'withdrawal',
        status: 'success',
        referenceId: order._id.toString(),
        description: `Payout to Owner for Order #${order._id.toString().slice(-6)} (Sync)`
      });

      console.log(`   ✅ Success! Transferred ₹${earningAmount} to ${owner._id}`);
      totalProcessed++;
    }

    console.log('\n=== SYNC SUMMARY ===');
    console.log(`Total Orders Checked: ${orders.length}`);
    console.log(`Already Paid:        ${totalAlreadyPaid}`);
    console.log(`Newly Processed:     ${totalProcessed}`);
    console.log(`Failed:              ${totalFailed}`);
    console.log('====================\n');

    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  } catch (err) {
    console.error('❌ Sync Failed:', err);
  }
}

syncBalances();
