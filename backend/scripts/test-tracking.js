const http = require('http');
const mongoose = require('mongoose');
const User = require('../models/User');
const Order = require('../models/Order');
const jwt = require('jsonwebtoken');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/quickeats', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log('Connected to DB');

    const order = await Order.findOne({ status: 'out_for_delivery' }).populate('deliveryBoy');
    if (!order) {
        console.log('No order found. Finding any accepted order...');
        const anyOrder = await Order.findOne({ status: { $in: ['accepted', 'preparing', 'out_for_delivery'] } }).populate('deliveryBoy');
        if (!anyOrder) { console.log('No orders to test. Exiting.'); process.exit(); }
        Object.assign(order || {}, anyOrder.toObject());
    }

    const deliveryBoyUserId = order.deliveryBoy ? order.deliveryBoy.user : null;
    if (!deliveryBoyUserId) {
        console.log('No delivery boy assigned to this order');
        process.exit();
    }

    const user = await User.findById(deliveryBoyUserId);
    const token = jwt.sign(
        { user: { id: user.id, role: user.role } },
        process.env.JWT_SECRET || 'your_jwt_secret',
        { expiresIn: '1h' }
    );

    console.log(`Testing GET /api/tracking/delivery-boy/${order._id}`);

    const req = http.request(`http://localhost:5000/api/tracking/delivery-boy/${order._id}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    }, (res) => {
        let raw = '';
        res.on('data', chunk => raw += chunk);
        res.on('end', () => {
            console.log(`Status: ${res.statusCode}`);
            console.log(`Body: ${raw}`);
            process.exit();
        });
    });
    req.end();
});
