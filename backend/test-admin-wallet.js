const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Admin = require('./models/Admin');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(async () => {
    console.log('MongoDB Connected');

    const ADMIN_EMAIL = 'quickeatsfoodadmin@gmail.com';
    let adminUser = await User.findOne({ email: ADMIN_EMAIL });

    if (!adminUser) {
        console.log('Admin user not found by email, trying role check...');
        adminUser = await User.findOne({ role: 'admin' });
    }

    if (!adminUser) {
        console.log('No admin user found at all!');
    } else {
        console.log('Admin user found:', adminUser.email, adminUser._id);
        let admin = await Admin.findOne({ user: adminUser._id });
        if (!admin) {
            console.log('Admin wallet not found for this user!');
        } else {
            console.log('Admin wallet found:', admin.availableBalance, admin.totalEarnings);
        }
    }

    mongoose.disconnect();
}).catch(err => console.error(err));
