const mongoose = require('mongoose');
require('dotenv').config();

const Order = require('../models/Order');
const DeliveryBoy = require('../models/DeliveryBoy');
const User = require('../models/User');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/quickeats', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log('Connected to DB');

    // Find an order that is out for delivery
    const order = await Order.findOne({ status: 'out_for_delivery' }).populate('deliveryBoy');
    if (!order) {
        console.log('No order found');
        process.exit();
    }

    console.log('Found order:', order._id);
    console.log('Order status:', order.status);
    console.log('Assigned delivery boy:', order.deliveryBoy);

    if (order.deliveryBoy) {
        console.log('Delivery Boy Object:', order.deliveryBoy);
        console.log('Delivery Boy ID:', order.deliveryBoy._id);

        const dboy = await DeliveryBoy.findById(order.deliveryBoy._id);
        console.log('Delivery Boy from DB:', dboy);
    }

    process.exit();
});
