const mongoose = require('mongoose');
const User = require('./models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function listUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const users = await User.find({}, 'name email role');
        console.log('Total Users:', users.length);
        users.forEach(u => {
            console.log(`User: ${u.name} (${u.email}) - Role: ${u.role} - ID: ${u._id}`);
        });

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listUsers();
