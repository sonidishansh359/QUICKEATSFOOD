const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Admin = require('../models/Admin');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Order = require('../models/Order');

// Simple Admin Key verification middleware (matches restaurants.js structure)
const verifyAdminKey = (req, res, next) => {
    const adminKey = req.headers['x-admin-key'];
    const expected = process.env.ADMIN_API_KEY || 'quickeats-admin';
    if (!adminKey || adminKey !== expected) {
        return res.status(403).json({ message: 'Invalid admin key' });
    }
    // Setup a dummy admin ID for wallet tracking since there's no real admin user
    // Must be a valid 24-character ObjectId hex string
    req.adminId = '000000000000000000000000';
    next();
};

// Helper: Get or Create Admin Wallet Document
const getAdminWallet = async () => {
    const ADMIN_EMAIL = 'quickeatsfoodadmin@gmail.com';
    let adminUser = await User.findOne({ email: ADMIN_EMAIL });

    if (!adminUser) {
        adminUser = await User.findOne({ role: 'admin' });
    }

    if (!adminUser) {
        throw new Error('No admin user found in database');
    }

    let admin = await Admin.findOne({ user: adminUser._id });
    if (!admin) {
        admin = new Admin({ user: adminUser._id });
        await admin.save();
    }

    return admin;
};

// Get Admin Wallet Balance and Stats
router.get('/balance', verifyAdminKey, async (req, res) => {
    try {
        const admin = await getAdminWallet();

        res.json({
            availableBalance: admin.availableBalance || 0,
            totalEarnings: admin.totalEarnings || 0
        });
    } catch (err) {
        console.error('Error fetching admin balance:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Get Admin Transaction History
router.get('/transactions', verifyAdminKey, async (req, res) => {
    try {
        const admin = await getAdminWallet();

        // Fetch transactions specifically tied to the admin wallet
        const transactions = await Transaction.find({ admin: admin._id })
            .sort({ createdAt: -1 })
            .limit(100)
            .lean();
            
        // Enrich transactions with payment method if applicable
        const enrichedTransactions = await Promise.all(transactions.map(async (tx) => {
            if (tx.type === 'earning' && tx.referenceId && tx.referenceId.length === 24) {
               try {
                   const order = await Order.findById(tx.referenceId).select('paymentMethod');
                   if (order) {
                       tx.paymentMethod = order.paymentMethod;
                   }
               } catch (e) {
                   // ignore cast errors for invalid object ids
               }
            }
            return tx;
        }));

        res.json(enrichedTransactions);
    } catch (err) {
        console.error('Error fetching admin transactions:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Admin Add Money
router.post('/add-money', verifyAdminKey, async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Invalid amount' });
        }

        const admin = await getAdminWallet();

        admin.availableBalance += amount;
        admin.totalEarnings += amount; // Alternatively track 'totalAdded' separately, but keeping simple
        await admin.save();

        await Transaction.create({
            admin: admin._id,
            amount: amount,
            type: 'earning',
            status: 'success',
            description: 'Funds Added by Admin',
        });

        res.json({ message: 'Money added successfully', availableBalance: admin.availableBalance });
    } catch (err) {
        console.error('Error adding money:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Admin Withdraw Money
router.post('/withdraw', verifyAdminKey, async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Invalid amount' });
        }

        const admin = await getAdminWallet();

        if (admin.availableBalance < amount) {
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        admin.availableBalance -= amount;
        await admin.save();

        await Transaction.create({
            admin: admin._id,
            amount: -amount,
            type: 'withdrawal',
            status: 'success',
            description: 'Funds Withdrawn by Admin',
        });

        res.json({ message: 'Money withdrawn successfully', availableBalance: admin.availableBalance });
    } catch (err) {
        console.error('Error withdrawing money:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
