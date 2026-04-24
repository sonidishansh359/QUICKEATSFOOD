const mongoose = require('mongoose');
const User = require('./models/User');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function listUsersToFile() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const users = await User.find({}, 'name email role');
        const output = users.map(u => `ID: ${u._id}, Name: ${u.name}, Email: ${u.email}, Role: ${u.role}`).join('\n');

        fs.writeFileSync('users_dump.txt', 'Total Users: ' + users.length + '\n' + output);
        console.log('Written to users_dump.txt');

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listUsersToFile();
