const User = require('../models/User');

module.exports = async function (req, res, next) {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        // Allow both 'admin' role, or fallback to checking the known admin email
        // since some setups might not set the precise 'role' field to 'admin' initially.
        const isAdminRole = user.role === 'admin';
        const isAdminEmail = user.email === 'quickeatsfoodadmin@gmail.com';

        if (!isAdminRole && !isAdminEmail) {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        // Keep a reference to the admin user
        req.adminUser = user;
        next();
    } catch (err) {
        console.error('Admin Auth Middleware Error:', err.message);
        res.status(500).send('Server Error');
    }
};
