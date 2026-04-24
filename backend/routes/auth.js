const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Owner = require('../models/Owner');
const DeliveryBoy = require('../models/DeliveryBoy');
const { sendWelcomeEmail, sendOTPEmail } = require('../config/email');

const router = express.Router();

// In-memory OTP store
const otpStore = new Map();

// Register user
router.post('/register', [
  body('name', 'Name is required').not().isEmpty(),
  body('email', 'Please include a valid email').isEmail(),
  body('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
  body('role', 'Role is required').isIn(['user', 'owner', 'delivery_boy']),
  // Phone required for delivery boys only
  body('phone').custom((value, { req }) => {
    if (req.body.role === 'delivery_boy') {
      if (!value || value.replace(/\D/g, '').length < 10) {
        throw new Error('Valid mobile number is required for delivery partners');
      }
    }
    return true;
  })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, role, phone, ...additionalData } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    user = new User({
      name,
      email,
      password,
      role,
      ...(role === 'delivery_boy' && { phone })
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    // Create role-specific document
    if (role === 'owner') {
      const owner = new Owner({
        user: user._id,
        ...additionalData
      });
      await owner.save();
    } else if (role === 'delivery_boy') {
      const deliveryBoy = new DeliveryBoy({
        user: user._id,
        ...additionalData
      });
      await deliveryBoy.save();
    }

    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(payload, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '7d' }, async (err, token) => {
      if (err) throw err;

      // Send welcome email (don't wait for it to complete)
      sendWelcomeEmail(user.email, user.name, user.role)
        .then(result => {
          if (result.success) {
            console.log(`📧 Welcome email sent successfully to ${user.email}`);
          } else {
            console.error(`📧 Failed to send welcome email: ${result.error}`);
          }
        })
        .catch(error => {
          console.error('📧 Email error:', error.message);
        });

      res.json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone || null, role: user.role, profilePicture: user.profilePicture } });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Login user
router.post('/login', [
  body('email', 'Please include a valid email').isEmail(),
  body('password', 'Password is required').exists()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Block login for banned accounts
    if (user.banned) {
      return res.status(403).json({ message: 'your account is blocked' });
    }

    // Block login for deleted accounts
    if (user.deleted) {
      return res.status(403).json({ message: 'your account is deleted' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(payload, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '7d' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, profilePicture: user.profilePicture } });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Google Login/Signup
router.post('/google-login', async (req, res) => {
  const { name, email, googleId, profilePicture, role } = req.body;

  try {
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user if not exists
      user = new User({
        name,
        email,
        password: Math.random().toString(36).slice(-8), // Random password
        role: role || 'user',
        profilePicture
      });
      await user.save();

      // Create role-specific document
      if (user.role === 'owner') {
        const owner = new Owner({ user: user._id });
        await owner.save();
      } else if (user.role === 'delivery_boy') {
        const deliveryBoy = new DeliveryBoy({ user: user._id });
        await deliveryBoy.save();
      }
      
      // Send welcome email
      if (sendWelcomeEmail) {
        sendWelcomeEmail(user.email, user.name, user.role).catch(err => console.error('Email error:', err));
      }
    } else {
      // Check if account is deleted or banned
      if (user.banned) {
        return res.status(403).json({ message: 'your account is blocked' });
      }
      if (user.deleted) {
        return res.status(403).json({ message: 'your account is deleted' });
      }
    }

    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(payload, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '7d' }, (err, token) => {
      if (err) throw err;
      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone || null,
          role: user.role,
          profilePicture: user.profilePicture || profilePicture
        }
      });
    });
  } catch (err) {
    console.error('Google login error:', err.message);
    res.status(500).send('Server error');
  }
});

// Forgot Password - Send OTP
router.post('/forgot-password', [
  body('email', 'Please include a valid email').isEmail()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in memory (10 minutes expiry)
    const expiry = Date.now() + 10 * 60 * 1000;
    otpStore.set(email, { otp, expiry });

    // No need to save to User DB
    // user.resetOTP = otp;
    // user.resetOTPExpiry = new Date(Date.now() + 10 * 60 * 1000);
    // await user.save();

    // Send OTP email
    const emailResult = await sendOTPEmail(user.email, user.name, otp, user.role);

    if (emailResult.success) {
      console.log(`🔐 Password reset OTP sent to ${user.email}`);
      res.json({
        success: true,
        message: 'OTP sent to your email. Please check your inbox.',
        email: user.email
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please try again.'
      });
    }
  } catch (err) {
    console.error('Forgot password error:', err.message);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

// Verify OTP
router.post('/verify-otp', [
  body('email', 'Please include a valid email').isEmail(),
  body('otp', 'OTP is required').not().isEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otpData = otpStore.get(email);

    if (!otpData) {
      return res.status(400).json({ message: 'No OTP request found. Please request a new OTP.' });
    }

    // Check if OTP expired
    if (Date.now() > otpData.expiry) {
      otpStore.delete(email); // Clean up expired OTP
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // Verify OTP
    if (otpData.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }

    console.log(`✅ OTP verified successfully for ${user.email}`);
    res.json({
      success: true,
      message: 'OTP verified successfully. You can now reset your password.'
    });
  } catch (err) {
    console.error('Verify OTP error:', err.message);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

// Reset Password
router.post('/reset-password', [
  body('email', 'Please include a valid email').isEmail(),
  body('otp', 'OTP is required').not().isEmpty(),
  body('newPassword', 'Password must be 6 or more characters').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, otp, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otpData = otpStore.get(email);

    if (!otpData) {
      return res.status(400).json({ message: 'No OTP request found. Please request a new OTP.' });
    }

    // Check if OTP expired
    if (Date.now() > otpData.expiry) {
      otpStore.delete(email);
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // Verify OTP
    if (otpData.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Clear OTP from memory
    otpStore.delete(email);

    await user.save();

    console.log(`✅ Password reset successfully for ${user.email}`);
    res.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    });
  } catch (err) {
    console.error('Reset password error:', err.message);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

module.exports = router;
