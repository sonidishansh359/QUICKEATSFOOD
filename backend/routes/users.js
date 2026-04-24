const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const crypto = require('crypto');
const { sendRecoveryRequestToAdmin, sendRecoveryApprovedToUser } = require('../config/email');

const ADMIN_KEY = process.env.ADMIN_API_KEY || 'quickeats-admin';

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, email, profilePicture, phone } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Prevent updates if account is deleted
    if (user.deleted) return res.status(403).json({ message: 'Account is deleted' });

    user.name = name || user.name;
    user.email = email || user.email;
    if (phone !== undefined) user.phone = phone;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;

    await user.save();
    const userSafe = user.toObject();
    delete userSafe.password;
    res.json(userSafe);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Soft-delete account (authenticated)
router.delete('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.deleted = true;
    user.deletedAt = new Date();
    await user.save();

    // Optionally notify user by email (simple): reuse sendOTPEmail as notification
    res.json({ success: true, message: 'Account deleted' });
  } catch (err) {
    console.error('Delete profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Public endpoint to request account recovery (user provides their email)
router.post('/recover-request', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No account found with this email' });

    if (!user.deleted) return res.status(400).json({ message: 'Account is not deleted' });

    // create recovery token
    const token = crypto.randomBytes(20).toString('hex');
    user.recoveryToken = token;
    user.recoveryRequested = true;
    await user.save();

    // Send email to admin for approval
    const adminEmail = 'sonidishansh359@gmail.com';
    await sendRecoveryRequestToAdmin(adminEmail, user.email, user.name, token);

    res.json({ success: true, message: 'Recovery request sent to admin' });
  } catch (err) {
    console.error('Recover request error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin approval link — approve recovery by token
router.get('/recover-approve', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).send('Missing token');

    const user = await User.findOne({ recoveryToken: token });
    if (!user) return res.status(404).send('Invalid token');

    user.deleted = false;
    user.recoveryRequested = false;
    user.recoveryToken = undefined;
    await user.save();

    // Notify user
    await sendRecoveryApprovedToUser(user.email, user.name);

    // Simple confirmation page
    res.send('<html><body><h2>Account recovery approved. The user can now login again.</h2></body></html>');
  } catch (err) {
    console.error('Recover approve error:', err);
    res.status(500).send('Server error');
  }
});

// Admin: list all accounts
router.get('/admin/all', async (req, res) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    if (!adminKey || adminKey !== ADMIN_KEY) {
      return res.status(403).json({ message: 'Invalid admin key' });
    }

    const users = await User.find()
      .select('-password -resetOTP -resetOTPExpiry -recoveryToken')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error('Admin list users error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: ban/unban account
router.put('/admin/:id/ban', async (req, res) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    if (!adminKey || adminKey !== ADMIN_KEY) {
      return res.status(403).json({ message: 'Invalid admin key' });
    }

    const { banned } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.banned = !!banned;
    user.bannedAt = banned ? new Date() : undefined;
    await user.save();

    const safeUser = user.toObject();
    delete safeUser.password;
    delete safeUser.resetOTP;
    delete safeUser.resetOTPExpiry;
    delete safeUser.recoveryToken;
    res.json({ message: banned ? 'User banned' : 'User unbanned', user: safeUser });
  } catch (err) {
    console.error('Admin ban user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
