const jwt = require('jsonwebtoken');
const Owner = require('../models/Owner');

const ownerAuth = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '') || req.query.token;
  if (!token) {
    console.log('ownerAuth failed: No token provided');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.user = decoded.user;
    console.log('Auth token verified for user:', req.user.id, 'role:', req.user.role);

    // Fetch owner with restaurants populated
    const owner = await Owner.findOne({ user: req.user.id });
    if (!owner) {
      console.log('ownerAuth failed: No owner found for user', req.user.id);
      return res.status(403).json({ message: 'Not authorized as owner' });
    }

    console.log('ownerAuth successful for owner:', owner._id);

    req.owner = owner;
    next();
  } catch (err) {
    console.log('ownerAuth failed: Token verification error -', err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = ownerAuth;
