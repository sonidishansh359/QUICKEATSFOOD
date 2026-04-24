const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reports.controller');

// Simple Admin Key verification middleware
const verifyAdminKey = (req, res, next) => {
    const adminKey = req.headers['x-admin-key'];
    const expected = process.env.ADMIN_API_KEY || 'quickeats-admin';
    if (!adminKey || adminKey !== expected) {
        return res.status(403).json({ message: 'Invalid admin key' });
    }
    // Mock user for logging
    req.user = { id: '000000000000000000000000', name: 'Admin User' };
    next();
};

// All report routes require admin authentication
router.use(verifyAdminKey);

// Get preview data for a report
router.get('/', reportsController.getReportPreview);

// Export report as CSV
router.get('/export/csv', reportsController.exportCSV);

// Export report as PDF
router.get('/export/pdf', reportsController.exportPDF);

module.exports = router;
