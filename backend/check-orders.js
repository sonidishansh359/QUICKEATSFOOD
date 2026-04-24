const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/foodswift')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

const Order = require('./models/Order');

async function checkOrders() {
  try {
    const orders = await Order.find().populate('user', 'name location').sort({ createdAt: -1 }).limit(10);
    
    console.log(`\n📦 Recent ${orders.length} orders:\n`);
    
    orders.forEach((order, idx) => {
      console.log(`${idx + 1}. Order ID: ${order._id}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   User: ${order.user?.name || 'Unknown'}`);
      console.log(`   User Location: [${order.user?.location?.coordinates[1] || 0}, ${order.user?.location?.coordinates[0] || 0}]`);
      console.log(`   Delivery Boy: ${order.deliveryBoy || 'None'}`);
      console.log(`   Total: ₹${order.totalAmount}`);
      console.log('');
    });
    
    // Count by status
    const statuses = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    console.log('📊 Orders by status:');
    statuses.forEach(s => {
      console.log(`   ${s._id}: ${s.count}`);
    });
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkOrders();
