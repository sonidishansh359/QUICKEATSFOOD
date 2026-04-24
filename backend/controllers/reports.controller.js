const Order = require('../models/Order');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const ReportLog = require('../models/ReportLog');
const exportUtils = require('../utils/export.utils');

const buildReportQuery = (type, reqQuery) => {
    const { from, to, status, paymentMethod, restaurantId, deliveryBoyId, role } = reqQuery;
    let query = {};

    if (from || to) {
        query.createdAt = {};
        if (from) query.createdAt.$gte = new Date(from);
        if (to) {
            const toDate = new Date(to);
            toDate.setHours(23, 59, 59, 999);
            query.createdAt.$lte = toDate;
        }
    }

    if (type === 'orders' || type === 'revenue') {
        if (status && status !== 'All') query.status = status;
        if (paymentMethod && paymentMethod !== 'All') query.paymentMethod = paymentMethod;
        if (restaurantId && restaurantId !== 'All') query.restaurant = restaurantId;
        if (deliveryBoyId && deliveryBoyId !== 'All') query.deliveryBoy = deliveryBoyId;
    } // Other filtering logic as required

    return query;
};

exports.getReportPreview = async (req, res) => {
    try {
        const { type } = req.query;
        let data = [];

        const query = buildReportQuery(type, req.query);

        if (type === 'orders') {
            data = await Order.find(query)
                .populate('user', 'name phone')
                .populate('restaurant', 'name')
                .populate('deliveryBoy', 'name')
                .sort({ createdAt: -1 })
                .lean();

            data = data.map(order => ({
                id: order.orderId || order._id,
                customerName: order.user?.name || 'Guest',
                customerPhone: order.user?.phone || order.phone || '-',
                restaurantName: order.restaurant?.name || 'Unknown',
                deliveryBoyName: order.deliveryBoy?.name || 'Unassigned',
                status: order.status,
                paymentMethod: order.paymentMethod || 'N/A',
                orderAmount: order.totalAmount || 0,
                deliveryCharge: order.deliveryCharge || 0,
                discount: order.discountAmount || 0,
                finalAmount: order.finalAmount || order.totalAmount,
                adminCommission: order.adminCommission || ((order.totalAmount || 0) * 0.1), // example
                restaurantEarning: order.restaurantEarning || ((order.totalAmount || 0) * 0.9), // example
                deliveryBoyEarning: order.deliveryBoyEarning || (order.deliveryCharge || 0) * 0.8, // example
                createdAt: order.createdAt
            }));
        }
        else if (type === 'revenue') {
            // Group by total stats
            const orders = await Order.find(query).lean();
            const totalOrders = orders.length;
            const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
            const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
            const totalRevenue = orders.reduce((sum, o) => sum + (o.finalAmount || o.totalAmount || 0), 0);
            const codRevenue = orders.filter(o => o.paymentMethod === 'cod').reduce((sum, o) => sum + (o.finalAmount || o.totalAmount || 0), 0);
            const onlineRevenue = orders.filter(o => o.paymentMethod === 'online' || o.paymentMethod === 'card' || o.paymentMethod === 'upi').reduce((sum, o) => sum + (o.finalAmount || o.totalAmount || 0), 0);
            const totalAdminCommission = orders.reduce((sum, o) => sum + (o.adminCommission || ((o.totalAmount || 0) * 0.1)), 0);
            const totalRestaurantEarnings = orders.reduce((sum, o) => sum + (o.restaurantEarning || ((o.totalAmount || 0) * 0.9)), 0);
            const totalDeliveryBoyPayout = orders.reduce((sum, o) => sum + (o.deliveryBoyEarning || (o.deliveryCharge || 0) * 0.8), 0);

            data = [{
                totalOrders,
                deliveredOrders,
                totalRevenue,
                codRevenue,
                onlineRevenue,
                totalAdminCommission,
                totalRestaurantEarnings,
                totalDeliveryBoyPayout
            }];
        }
        else if (type === 'users') {
            const userFilter = { role: 'user' };
            if (req.query.role && req.query.role !== 'All') {
                userFilter.role = req.query.role.toLowerCase();
            }
            const users = await User.find(userFilter).lean();
            const userIds = users.map(u => u._id);
            const orders = await Order.aggregate([
                { $match: { user: { $in: userIds }, status: 'delivered', ...query } },
                { $group: { _id: '$user', totalOrders: { $sum: 1 }, totalSpend: { $sum: { $ifNull: ['$finalAmount', '$totalAmount'] } } } }
            ]);

            const orderStatsMap = {};
            orders.forEach(o => {
                orderStatsMap[o._id.toString()] = { totalOrders: o.totalOrders, totalSpend: o.totalSpend };
            });

            data = users.map(user => ({
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone || '-',
                role: user.role,
                totalOrders: orderStatsMap[user._id.toString()]?.totalOrders || 0,
                totalSpend: orderStatsMap[user._id.toString()]?.totalSpend || 0,
                createdAt: user.createdAt
            }));
        }
        else if (type === 'restaurants') {
            const restaurants = await Restaurant.find().populate('owner').lean();
            const restIds = restaurants.map(r => r._id);
            const restOrders = await Order.aggregate([
                { $match: { restaurant: { $in: restIds }, status: 'delivered', ...query } },
                { $group: { _id: '$restaurant', totalOrders: { $sum: 1 }, totalRevenue: { $sum: { $ifNull: ['$finalAmount', '$totalAmount'] } }, commission: { $sum: { $ifNull: ['$adminEarning', { $multiply: [{ $ifNull: ['$finalAmount', '$totalAmount'] }, 0.15] }] } } } }
            ]);

            const orderStatsMap = {};
            restOrders.forEach(o => {
                orderStatsMap[o._id.toString()] = { totalOrders: o.totalOrders, totalRevenue: o.totalRevenue, commission: o.commission };
            });

            data = restaurants.map(rest => ({
                id: rest._id,
                name: rest.name,
                ownerName: rest.owner?.name || 'Unknown',
                phone: rest.phone || rest.owner?.phone || '-',
                totalOrders: orderStatsMap[rest._id.toString()]?.totalOrders || 0,
                totalRevenue: orderStatsMap[rest._id.toString()]?.totalRevenue || 0,
                commissionPaid: orderStatsMap[rest._id.toString()]?.commission || 0,
                status: rest.isActive ? 'Active' : 'Inactive',
                createdAt: rest.createdAt
            }));
        }
        else if (type === 'delivery') {
            const DeliveryBoy = require('../models/DeliveryBoy');
            const dBoys = await DeliveryBoy.find().populate('user', 'name phone email').lean();
            const dIds = dBoys.map(d => d._id);

            const dOrders = await Order.aggregate([
                { $match: { deliveryBoy: { $in: dIds }, status: 'delivered', ...query } },
                { $group: { _id: '$deliveryBoy', totalDeliveries: { $sum: 1 }, totalEarnings: { $sum: { $ifNull: ['$deliveryBoyEarning', 20] } } } }
            ]);

            const orderStatsMap = {};
            dOrders.forEach(o => {
                orderStatsMap[o._id.toString()] = { totalDeliveries: o.totalDeliveries, totalEarnings: o.totalEarnings };
            });

            data = dBoys.map(db => ({
                id: db._id,
                name: db.user?.name || 'Unknown',
                phone: db.phone || db.user?.phone || '-',
                totalDeliveries: orderStatsMap[db._id.toString()]?.totalDeliveries || 0,
                totalEarnings: orderStatsMap[db._id.toString()]?.totalEarnings || 0,
                onlineHours: '-',
                status: db.isAvailable ? 'Active' : 'Inactive',
                createdAt: db.createdAt
            }));
        }
        else if (type === 'profit_loss') {
            // New explicit Profit / Loss report
            const orders = await Order.find(query).lean();

            let totalRevenue = 0;
            let totalProfit = 0;
            let totalLoss = 0;
            let cancelledOrdersCount = 0;
            let completedOrdersCount = 0;

            orders.forEach(o => {
                const amount = o.finalAmount || o.totalAmount || 0;
                if (o.status === 'delivered') {
                    totalRevenue += amount;
                    totalProfit += (o.adminEarning || (amount * 0.15)); // Use actual stored adminEarning
                    completedOrdersCount += 1;
                } else if (o.status === 'cancelled') {
                    totalLoss += amount; // The potential revenue lost
                    cancelledOrdersCount += 1;
                }
            });

            const profitLossRatio = totalLoss > 0 ? (totalProfit / totalLoss).toFixed(2) : (totalProfit > 0 ? '100%' : '0.00');

            data = [{
                completedOrders: completedOrdersCount,
                cancelledOrders: cancelledOrdersCount,
                totalRevenue: parseFloat(totalRevenue.toFixed(2)),
                totalProfit: parseFloat(totalProfit.toFixed(2)),
                totalLoss: parseFloat(totalLoss.toFixed(2)),
                profitLossRatio: profitLossRatio
            }];
        }
        else {
            return res.status(400).json({ error: 'Invalid report type' });
        }

        res.json({ success: true, data });
    } catch (err) {
        console.error('Error generating report preview:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

const getReportHeaders = (type) => {
    switch (type) {
        case 'orders': return [
            { label: 'Order ID', value: 'id', id: 'id', width: 130 },
            { label: 'Customer', value: 'customerName', id: 'customerName', width: 90 },
            { label: 'Restaurant', value: 'restaurantName', id: 'restaurantName', width: 80 },
            { label: 'Status', value: 'status', id: 'status', width: 55 },
            { label: 'Method', value: 'paymentMethod', id: 'paymentMethod', width: 45 },
            { label: 'Final Amt', value: 'finalAmount', id: 'finalAmount', width: 45 },
            { label: 'Comm.', value: 'adminCommission', id: 'adminCommission', width: 40 },
            { label: 'Date', value: 'createdAt', id: 'createdAt', width: 50 },
        ];
        case 'revenue': return [
            { label: 'Total Orders', value: 'totalOrders', id: 'totalOrders', width: 60 },
            { label: 'Delivered', value: 'deliveredOrders', id: 'deliveredOrders', width: 60 },
            { label: 'Total Rev', value: 'totalRevenue', id: 'totalRevenue', width: 60 },
            { label: 'Comm.', value: 'totalAdminCommission', id: 'totalAdminCommission', width: 60 },
        ];
        case 'users': return [
            { label: 'Name', value: 'name', id: 'name', width: 80 },
            { label: 'Email', value: 'email', id: 'email', width: 100 },
            { label: 'Role', value: 'role', id: 'role', width: 40 },
            { label: 'Orders', value: 'totalOrders', id: 'totalOrders', width: 40 },
            { label: 'Spend', value: 'totalSpend', id: 'totalSpend', width: 50 },
        ];
        case 'restaurants': return [
            { label: 'Name', value: 'name', id: 'name', width: 80 },
            { label: 'Owner', value: 'ownerName', id: 'ownerName', width: 70 },
            { label: 'Orders', value: 'totalOrders', id: 'totalOrders', width: 40 },
            { label: 'Revenue', value: 'totalRevenue', id: 'totalRevenue', width: 50 },
            { label: 'Comm Paid', value: 'commissionPaid', id: 'commissionPaid', width: 50 },
            { label: 'Status', value: 'status', id: 'status', width: 40 },
        ];
        case 'delivery': return [
            { label: 'Name', value: 'name', id: 'name', width: 80 },
            { label: 'Phone', value: 'phone', id: 'phone', width: 60 },
            { label: 'Deliveries', value: 'totalDeliveries', id: 'totalDeliveries', width: 50 },
            { label: 'Earnings', value: 'totalEarnings', id: 'totalEarnings', width: 50 },
            { label: 'Status', value: 'status', id: 'status', width: 50 },
        ];
        case 'profit_loss': return [
            { label: 'Completed Orders', value: 'completedOrders', id: 'completedOrders', width: 80 },
            { label: 'Cancelled Orders', value: 'cancelledOrders', id: 'cancelledOrders', width: 80 },
            { label: 'Total Revenue', value: 'totalRevenue', id: 'totalRevenue', width: 80 },
            { label: 'Total Profit', value: 'totalProfit', id: 'totalProfit', width: 80 },
            { label: 'Total Loss', value: 'totalLoss', id: 'totalLoss', width: 80 },
            { label: 'P/L Ratio', value: 'profitLossRatio', id: 'profitLossRatio', width: 60 },
        ];
        default: return [];
    }
};

const internalGetReportData = exports.getReportPreview; // Refactor to reuse logic if possible

const fetchReportDataObj = async (req, res) => {
    // We mock the `res` to capture the output of getReportPreview
    let capturedData = [];
    const mockRes = {
        json: (data) => {
            if (data.success) capturedData = data.data;
        },
        status: () => mockRes
    };
    await exports.getReportPreview(req, mockRes);
    return capturedData;
};

exports.exportCSV = async (req, res) => {
    try {
        const data = await fetchReportDataObj(req, res);
        const headers = getReportHeaders(req.query.type);
        const csv = exportUtils.generateCSV(data, headers);

        const { type, from, to } = req.query;
        const filename = `${type}_${from || 'start'}_${to || 'end'}.csv`;

        // Log download
        await ReportLog.create({
            adminId: req.user.id,
            reportType: type,
            filtersUsed: req.query
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.send(csv);
    } catch (err) {
        console.error('Error exporting CSV:', err);
        res.status(500).json({ error: 'Failed to export CSV' });
    }
};

exports.exportPDF = async (req, res) => {
    try {
        const data = await fetchReportDataObj(req, res);
        const headers = getReportHeaders(req.query.type);

        const { type, from, to } = req.query;
        const filename = `${type}_${from || 'start'}_${to || 'end'}.pdf`;

        // Log download
        await ReportLog.create({
            adminId: req.user.id,
            reportType: type,
            filtersUsed: req.query
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

        await exportUtils.generatePDF(res, `Admin ${type.toUpperCase()} Report`, data, headers, req.user.name || 'Admin');
    } catch (err) {
        if (!res.headersSent) {
            console.error('Error exporting PDF:', err);
            res.status(500).json({ error: 'Failed to export PDF' });
        }
    }
};
