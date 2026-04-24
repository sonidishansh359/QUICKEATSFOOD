
const mongoose = require('mongoose');
const Order = require('./backend/models/Order');
const Owner = require('./backend/models/Owner');
const Admin = require('./backend/models/Admin');
const User = require('./backend/models/User');

async function checkBalances() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/food-delivery');
    console.log('Connected to MongoDB');

    const owners = await Owner.find().populate('user', 'email name');
    console.log(`Found ${owners.length} owners`);

    for (const owner of owners) {
      const restaurants = owner.restaurants;
      
      const orders = await Order.find({
        restaurant: { $in: restaurants },
        status: { $in: ['delivered', 'out_for_delivery'] }
      });

      let totalShouldEarn = 0;
      orders.forEach(o => {
        totalShouldEarn += (o.ownerEarning || (o.totalAmount * 0.85));
      });

      console.log(`Owner: ${owner.user?.name} (${owner.user?.email})`);
      console.log(`  Balance in DB: ${owner.availableBalance}`);
      console.log(`  Total orders (delivered/out): ${orders.length}`);
      console.log(`  Sum of ownerEarnings: ${totalShouldEarn}`);
      
      if (Math.abs(owner.availableBalance - totalShouldEarn) > 1) {
          console.log(`  ⚠️ MISMATCH! Balance should likely be ${totalShouldEarn}`);
      }
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkBalances();
