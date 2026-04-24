const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Get token from header - support both 'Authorization: Bearer <token>' and 'x-auth-token' formats
  let token = req.header('Authorization')?.replace('Bearer ', '');

  // Fallback to x-auth-token for backward compatibility
  if (!token) {
    token = req.header('x-auth-token');
  }

  // Log the received token for debugging
  console.log('--- AUTH DEBUG ---');
  console.log('Received token:', token);
  console.log('JWT_SECRET in use:', process.env.JWT_SECRET);

  // Check if no token
  if (!token) {
    console.log('Auth failed: No token provided');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.user = decoded.user;
    console.log('Auth successful for user:', req.user.id);
    console.log('Decoded payload:', decoded);
    next();
  } catch (err) {
    console.log('Auth failed: Invalid token -', err.message);
    // Log the error stack for more details
    console.log('JWT verification error stack:', err.stack);
    res.status(401).json({ message: 'Token is not valid' });
  }
};
