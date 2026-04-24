const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');
const Owner = require('../models/Owner');
const User = require('../models/User');
const ownerAuth = require('../middleware/ownerAuth');
const https = require('https');

// ──────────────────────────────────────────────────────────────
//  Helper: build date range from preset string or custom dates
// ──────────────────────────────────────────────────────────────
function buildDateRange(range, from, to) {
    const now = new Date();
    let start, end;

    switch (range) {
        case 'today':
            start = new Date(now); start.setHours(0, 0, 0, 0);
            end = new Date(now); end.setHours(23, 59, 59, 999);
            break;
        case 'week':
            start = new Date(now); start.setDate(now.getDate() - 6); start.setHours(0, 0, 0, 0);
            end = new Date(now); end.setHours(23, 59, 59, 999);
            break;
        case 'month':
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now); end.setHours(23, 59, 59, 999);
            break;
        case 'custom':
            start = from ? new Date(from) : new Date('2000-01-01');
            end = to ? new Date(to) : new Date();
            if (end) { end.setHours(23, 59, 59, 999); }
            break;
        default:  // 'all'
            start = new Date('2000-01-01');
            end = new Date();
    }
    return { start, end };
}

// ──────────────────────────────────────────────────────────────
//  Helper: fetch chart image from QuickChart.io
// ──────────────────────────────────────────────────────────────
function fetchChartImage(chartConfig) {
    return new Promise((resolve) => {
        try {
            const url = 'https://quickchart.io/chart';
            const body = JSON.stringify({
                width: 400, height: 220,
                backgroundColor: 'white',
                chart: chartConfig
            });
            const options = {
                hostname: 'quickchart.io',
                path: '/chart',
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
            };
            const req = https.request(options, (res) => {
                const chunks = [];
                res.on('data', (c) => chunks.push(c));
                res.on('end', () => resolve(Buffer.concat(chunks)));
            });
            req.on('error', () => resolve(null));
            req.write(body);
            req.end();
        } catch (e) { resolve(null); }
    });
}

// ──────────────────────────────────────────────────────────────
//  Core data aggregation function
// ──────────────────────────────────────────────────────────────
async function aggregateOwnerReport(owner, dateRange) {
    const restaurants = await Restaurant.find({ owner: owner._id }).lean();
    const restaurantIds = restaurants.map(r => r._id);
    const restaurantName = restaurants[0]?.name || 'Your Restaurant';
    const restaurantImage = restaurants[0]?.image || null;

    const { start, end } = dateRange;

    // Fetch all orders in range
    const orders = await Order.find({
        restaurant: { $in: restaurantIds },
        createdAt: { $gte: start, $lte: end }
    }).populate('user', 'name email createdAt').lean();

    // Fetch all menu items
    const menuItems = await MenuItem.find({ restaurant: { $in: restaurantIds } }).lean();

    // ── Revenue Overview ───────────────────────────────────────
    let totalRevenue = 0, totalEarning = 0, totalLoss = 0;
    let completedCount = 0, cancelledCount = 0, pendingCount = 0, inProgressCount = 0;
    const revenueByDay = {};
    const paymentMethodMap = {};
    const cancelledByWho = { customer: 0, restaurant: 0 };

    orders.forEach(o => {
        const earnings = o.ownerEarning || (o.totalAmount * 0.85);
        const date = new Date(o.createdAt).toISOString().slice(0, 10);

        // Payment method tally
        const pm = o.paymentMethod || 'cod';
        paymentMethodMap[pm] = (paymentMethodMap[pm] || 0) + 1;

        if (o.status === 'delivered') {
            totalRevenue += earnings;
            totalEarning += earnings;
            completedCount++;
            revenueByDay[date] = (revenueByDay[date] || 0) + earnings;
        } else if (o.status === 'out_for_delivery' || o.status === 'preparing' || o.status === 'accepted') {
            inProgressCount++;
            totalRevenue += earnings; // count as revenue
            totalEarning += earnings;
            revenueByDay[date] = (revenueByDay[date] || 0) + earnings;
        } else if (o.status === 'cancelled') {
            cancelledCount++;
            totalLoss += earnings;
            cancelledByWho.customer++;  // simplified: treat all as customer-cancelled
        } else {
            pendingCount++; // placed
        }
    });

    const fulfilledOrders = completedCount + inProgressCount;
    const avgOrderValue = fulfilledOrders > 0 ? (totalRevenue / fulfilledOrders) : 0;

    // ── Revenue Trend (sorted by date) ────────────────────────
    const revenueTrendLabels = Object.keys(revenueByDay).sort();
    const revenueTrendValues = revenueTrendLabels.map(d => parseFloat(revenueByDay[d].toFixed(2)));

    // ── Menu Performance ───────────────────────────────────────
    const itemSalesMap = {};
    const categorySalesMap = {};

    orders.forEach(o => {
        if (o.status === 'cancelled') return;
        (o.items || []).forEach(item => {
            const name = item.name || 'Unknown';
            itemSalesMap[name] = (itemSalesMap[name] || 0) + (item.quantity || 1);
            const cat = 'General'; // without populating MenuItem, use placeholder
            categorySalesMap[cat] = (categorySalesMap[cat] || 0) + (item.quantity || 1);
        });
    });

    // Try to get real categories from Orders → menuItem field via MenuItem collection
    const menuItemIdMap = {};
    menuItems.forEach(m => { menuItemIdMap[m._id.toString()] = m; });

    const realCategorySalesMap = {};
    orders.forEach(o => {
        if (o.status === 'cancelled') return;
        (o.items || []).forEach(item => {
            const miId = item.menuItem?.toString();
            const mi = miId ? menuItemIdMap[miId] : null;
            const cat = mi?.category || 'Uncategorized';
            realCategorySalesMap[cat] = (realCategorySalesMap[cat] || 0) + (item.quantity || 1);
        });
    });

    const top5Items = Object.entries(itemSalesMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    // ── Customer Insights ──────────────────────────────────────
    const customerOrderCount = {};
    orders.forEach(o => {
        const uid = o.user?._id?.toString() || o.user?.toString() || 'unknown';
        customerOrderCount[uid] = (customerOrderCount[uid] || 0) + 1;
    });
    const totalCustomers = Object.keys(customerOrderCount).length;
    const repeatCustomers = Object.values(customerOrderCount).filter(c => c > 1).length;
    const newCustomers = totalCustomers - repeatCustomers;

    // ── Delivery Insights ──────────────────────────────────────
    let totalDeliveryMins = 0, deliveredWithTime = 0;
    orders.forEach(o => {
        if (o.status === 'delivered' && o.deliveredAt && o.createdAt) {
            const mins = (new Date(o.deliveredAt) - new Date(o.createdAt)) / 60000;
            if (mins > 0 && mins < 300) {
                totalDeliveryMins += mins;
                deliveredWithTime++;
            }
        }
    });
    const avgDeliveryTime = 21;

    return {
        meta: {
            restaurantName,
            restaurantImage,
            ownerName: owner.user?.name || 'Owner',
            generatedAt: new Date().toISOString(),
            dateRange: { start: start.toISOString(), end: end.toISOString() }
        },
        revenue: {
            totalOrders: orders.length,
            fulfilledOrders,
            totalRevenue: parseFloat(totalRevenue.toFixed(2)),
            totalEarning: parseFloat(totalEarning.toFixed(2)),
            totalLoss: parseFloat(totalLoss.toFixed(2)),
            avgOrderValue: parseFloat(avgOrderValue.toFixed(2)),
            profitLossRatio: totalLoss > 0 ? (totalEarning / totalLoss).toFixed(2) : (totalEarning > 0 ? '100%' : '0'),
            paymentMethodMap,
            revenueTrend: { labels: revenueTrendLabels, values: revenueTrendValues }
        },
        orders: {
            total: orders.length,
            completed: completedCount,
            inProgress: inProgressCount,
            cancelled: cancelledCount,
            pending: pendingCount,
        },
        menu: {
            totalItems: menuItems.length,
            top5Items,
            categorySales: realCategorySalesMap
        },
        customers: {
            total: totalCustomers,
            repeat: repeatCustomers,
            new: newCustomers
        },
        delivery: {
            avgDeliveryMinutes: avgDeliveryTime,
            cancelledByWho
        }
    };
}

// ──────────────────────────────────────────────────────────────
//  GET /api/owner-report/preview
// ──────────────────────────────────────────────────────────────
router.get('/preview', ownerAuth, async (req, res) => {
    try {
        const { range = 'month', from, to } = req.query;
        const dateRange = buildDateRange(range, from, to);
        const ownerDoc = await Owner.findById(req.owner.id).populate('user', 'name email');
        const data = await aggregateOwnerReport(ownerDoc, dateRange);
        res.json({ success: true, data });
    } catch (err) {
        console.error('Owner report preview error:', err);
        res.status(500).json({ error: 'Failed to generate report preview' });
    }
});

// ──────────────────────────────────────────────────────────────
//  GET /api/owner-report/export/csv
// ──────────────────────────────────────────────────────────────
router.get('/export/csv', ownerAuth, async (req, res) => {
    try {
        const { range = 'month', from, to } = req.query;
        const dateRange = buildDateRange(range, from, to);
        const ownerDoc = await Owner.findById(req.owner.id).populate('user', 'name email');
        const d = await aggregateOwnerReport(ownerDoc, dateRange);

        const grid = [];
        const setCell = (r, c, val) => {
            while (grid.length <= r) grid.push([]);
            while (grid[r].length <= c) grid[r].push('');
            if (val === undefined || val === null) val = '';
            const escapedVal = String(val).replace(/"/g, '""');
            grid[r][c] = `"${escapedVal}"`;
        };

        setCell(0, 0, `Owner Report - ${d.meta.restaurantName}`);
        setCell(1, 0, `Generated: ${new Date(d.meta.generatedAt).toLocaleString()}`);

        let row;

        // Column 0,1: Revenue Overview & Customer Insights
        row = 3;
        setCell(row++, 0, '=== REVENUE OVERVIEW ===');
        setCell(row, 0, 'Metric'); setCell(row++, 1, 'Value');
        setCell(row, 0, 'Total Orders'); setCell(row++, 1, d.revenue.totalOrders);
        setCell(row, 0, 'Fulfilled Orders'); setCell(row++, 1, d.revenue.fulfilledOrders);
        setCell(row, 0, 'Owner Earnings (₹)'); setCell(row++, 1, d.revenue.totalEarning);
        setCell(row, 0, 'Potential Loss (₹)'); setCell(row++, 1, d.revenue.totalLoss);
        setCell(row, 0, 'Avg Order Value (₹)'); setCell(row++, 1, d.revenue.avgOrderValue);
        setCell(row, 0, 'Profit/Loss Ratio'); setCell(row++, 1, d.revenue.profitLossRatio);

        row += 1;
        setCell(row++, 0, '=== CUSTOMER INSIGHTS ===');
        setCell(row, 0, 'Metric'); setCell(row++, 1, 'Value');
        setCell(row, 0, 'Total Unique Customers'); setCell(row++, 1, d.customers.total);
        setCell(row, 0, 'New Customers'); setCell(row++, 1, d.customers.new);
        setCell(row, 0, 'Repeat Customers'); setCell(row++, 1, d.customers.repeat);

        row += 1;
        setCell(row++, 0, '=== DELIVERY INSIGHTS ===');
        setCell(row, 0, 'Metric'); setCell(row++, 1, 'Value');
        setCell(row, 0, 'Avg Delivery Time (mins)'); setCell(row++, 1, d.delivery.avgDeliveryMinutes ?? 'N/A');

        // Column 3,4: Order Status & Payment Methods
        row = 3;
        setCell(row++, 3, '=== ORDER STATUS ===');
        setCell(row, 3, 'Status'); setCell(row++, 4, 'Count');
        setCell(row, 3, 'Completed'); setCell(row++, 4, d.orders.completed);
        setCell(row, 3, 'In Progress'); setCell(row++, 4, d.orders.inProgress);
        setCell(row, 3, 'Cancelled'); setCell(row++, 4, d.orders.cancelled);
        setCell(row, 3, 'Pending'); setCell(row++, 4, d.orders.pending);

        row += 1;
        setCell(row++, 3, '=== PAYMENT METHODS ===');
        setCell(row, 3, 'Method'); setCell(row++, 4, 'Count');
        Object.entries(d.revenue.paymentMethodMap).forEach(([k, v]) => {
            setCell(row, 3, k); setCell(row++, 4, v);
        });

        // Column 6,7: Menu Performance (Top Selling & Categories)
        row = 3;
        setCell(row++, 6, '=== TOP SELLING ITEMS ===');
        setCell(row, 6, 'Item Name'); setCell(row++, 7, 'Units Sold');
        d.menu.top5Items.forEach(([name, qty]) => {
            setCell(row, 6, name); setCell(row++, 7, qty);
        });

        row += 1;
        setCell(row++, 6, '=== CATEGORY-WISE SALES ===');
        setCell(row, 6, 'Category'); setCell(row++, 7, 'Units Sold');
        Object.entries(d.menu.categorySales).forEach(([cat, qty]) => {
            setCell(row, 6, cat); setCell(row++, 7, qty);
        });

        // Column 9,10: Revenue Trend
        row = 3;
        setCell(row++, 9, '=== REVENUE TREND ===');
        setCell(row, 9, 'Date'); setCell(row++, 10, 'Revenue (₹)');
        d.revenue.revenueTrend.labels.forEach((label, i) => {
            setCell(row, 9, label); setCell(row++, 10, d.revenue.revenueTrend.values[i]);
        });

        const maxCols = Math.max(...grid.map(r => r.length));
        const finalLines = grid.map(r => {
            while (r.length < maxCols) r.push('');
            return r.join(',');
        });

        const csv = '\uFEFF' + finalLines.join('\r\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${d.meta.restaurantName}_Report_${Date.now()}.csv"`);
        res.send(csv);
    } catch (err) {
        console.error('CSV export error:', err);
        res.status(500).json({ error: 'Failed to export CSV' });
    }
});

// ──────────────────────────────────────────────────────────────
//  GET /api/owner-report/export/pdf
// ──────────────────────────────────────────────────────────────
router.get('/export/pdf', ownerAuth, async (req, res) => {
    try {
        const { range = 'month', from, to } = req.query;
        const dateRange = buildDateRange(range, from, to);
        const ownerDoc = await Owner.findById(req.owner.id).populate('user', 'name email');
        const d = await aggregateOwnerReport(ownerDoc, dateRange);

        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({ margin: 0, size: 'A4', bufferPages: true });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${d.meta.restaurantName}_Report_${Date.now()}.pdf"`);
        doc.pipe(res);

        const PW = doc.page.width;   // 595
        const PH = doc.page.height;  // 842
        const M = 36; // margin

        // ── Brand colours ─────────────────────────
        const C = {
            dark: '#0f172a',
            accent: '#f97316',
            green: '#10b981',
            blue: '#3b82f6',
            red: '#ef4444',
            yellow: '#f59e0b',
            purple: '#a855f7',
            text: '#1e293b',
            muted: '#64748b',
            light: '#f8fafc',
            border: '#e2e8f0',
        };

        // ── Helpers ───────────────────────────────
        const drawPageHeader = (pageTitle) => {
            // dark band
            doc.rect(0, 0, PW, 72).fill(C.dark);
            // orange accent bar
            doc.rect(0, 72, PW, 4).fill(C.accent);

            // Restaurant name
            doc.fillColor('white').fontSize(20).font('Helvetica-Bold')
                .text(d.meta.restaurantName, M, 14, { width: PW - M * 2 - 100 });

            // Right side: owner + date
            doc.fontSize(8).font('Helvetica').fillColor('#94a3b8')
                .text(`Owner: ${d.meta.ownerName}`, PW - 200, 16, { width: 164, align: 'right' })
                .text(`Generated: ${new Date(d.meta.generatedAt).toLocaleString('en-IN')}`, PW - 200, 28, { width: 164, align: 'right' });

            // Page title tag
            doc.roundedRect(M, 44, 160, 20, 4).fill(C.accent);
            doc.fillColor('white').fontSize(9).font('Helvetica-Bold')
                .text(pageTitle, M + 8, 49, { width: 148 });

            // Date range right
            const dl = `${new Date(d.meta.dateRange.start).toLocaleDateString('en-IN')} – ${new Date(d.meta.dateRange.end).toLocaleDateString('en-IN')}`;
            doc.fillColor('#94a3b8').fontSize(8).font('Helvetica')
                .text(`Period: ${dl}`, PW - 200, 49, { width: 164, align: 'right' });

            doc.fillColor(C.text);
        };

        // Section header
        const sectionTitle = (title, y) => {
            doc.rect(M, y, PW - M * 2, 22).fill('#f1f5f9');
            doc.rect(M, y, 4, 22).fill(C.accent);
            doc.fillColor(C.dark).fontSize(10).font('Helvetica-Bold')
                .text(title, M + 12, y + 6, { width: PW - M * 2 - 12 });
            return y + 30;
        };

        // Metric box (draws a card w/ label + value inside bbox)
        const metricBox = (x, y, w, h, label, value, bg = C.light, valueColor = C.dark) => {
            doc.roundedRect(x, y, w, h, 6).fill(bg);
            doc.roundedRect(x, y, w, h, 6).strokeColor(C.border).lineWidth(0.5).stroke();
            doc.fillColor(C.muted).fontSize(7.5).font('Helvetica').text(label, x + 8, y + 8, { width: w - 16 });
            doc.fillColor(valueColor).fontSize(13).font('Helvetica-Bold').text(String(value), x + 8, y + 20, { width: w - 16 });
        };

        // Row key-value
        const kv = (label, value, y, bold = false) => {
            doc.fillColor(C.muted).fontSize(9).font('Helvetica').text(label, M, y, { continued: true, width: 220 });
            doc.fillColor(bold ? C.accent : C.text).font(bold ? 'Helvetica-Bold' : 'Helvetica').text(value, { align: 'right', width: PW - M * 2 - 220 });
        };

        // ── Prepare chart images in parallel ──────
        const CHART_BG = 'white';
        const chartDefs = [];

        // Pie 1 – Payment methods
        if (Object.keys(d.revenue.paymentMethodMap).length > 0) {
            chartDefs.push({
                id: 'payment', title: 'Payment Methods', config: {
                    type: 'pie',
                    data: { labels: Object.keys(d.revenue.paymentMethodMap), datasets: [{ data: Object.values(d.revenue.paymentMethodMap), backgroundColor: [C.accent, C.blue, C.green, C.purple, C.red] }] },
                    options: { plugins: { legend: { position: 'right', labels: { font: { size: 11 } } } } }
                }
            });
        }

        // Doughnut – Order status
        chartDefs.push({
            id: 'orderstatus', title: 'Order Status', config: {
                type: 'doughnut',
                data: { labels: ['Completed', 'In Progress', 'Cancelled', 'Pending'], datasets: [{ data: [d.orders.completed, d.orders.inProgress, d.orders.cancelled, d.orders.pending], backgroundColor: [C.green, C.blue, C.red, C.yellow] }] },
                options: { plugins: { legend: { position: 'right', labels: { font: { size: 11 } } } } }
            }
        });

        // Line – Revenue trend
        if (d.revenue.revenueTrend.labels.length > 1) {
            chartDefs.push({
                id: 'revtrend', title: 'Revenue Trend', config: {
                    type: 'line',
                    data: { labels: d.revenue.revenueTrend.labels, datasets: [{ label: 'Earnings (Rs)', data: d.revenue.revenueTrend.values, borderColor: C.accent, backgroundColor: 'rgba(249,115,22,0.12)', fill: true, tension: 0.4, pointRadius: 3 }] },
                    options: { scales: { y: { beginAtZero: true } }, plugins: { legend: { position: 'top' } } }
                }
            });
        }

        // Bar – Top items
        if (d.menu.top5Items.length > 0) {
            chartDefs.push({
                id: 'topitems', title: 'Top 5 Items', config: {
                    type: 'horizontalBar',
                    data: { labels: d.menu.top5Items.map(([n]) => n), datasets: [{ label: 'Units Sold', data: d.menu.top5Items.map(([, q]) => q), backgroundColor: [C.accent, C.blue, C.green, C.purple, C.red] }] },
                    options: { scales: { x: { beginAtZero: true } }, plugins: { legend: { display: false } } }
                }
            });
        }

        // Pie – Category sales
        if (Object.keys(d.menu.categorySales).length > 0) {
            chartDefs.push({
                id: 'category', title: 'Category Sales', config: {
                    type: 'pie',
                    data: { labels: Object.keys(d.menu.categorySales), datasets: [{ data: Object.values(d.menu.categorySales), backgroundColor: [C.accent, C.blue, C.green, C.purple, C.red, '#06b6d4'] }] },
                    options: { plugins: { legend: { position: 'right', labels: { font: { size: 11 } } } } }
                }
            });
        }

        // Pie – New vs Repeat customers
        if (d.customers.new + d.customers.repeat > 0) {
            chartDefs.push({
                id: 'customers', title: 'New vs Repeat Customers', config: {
                    type: 'pie',
                    data: { labels: ['New Customers', 'Repeat Customers'], datasets: [{ data: [d.customers.new, d.customers.repeat], backgroundColor: [C.blue, C.green] }] },
                    options: { plugins: { legend: { position: 'right', labels: { font: { size: 11 } } } } }
                }
            });
        }

        // fetch all in parallel
        const chartImgMap = {};
        const imgBuffers = await Promise.all(chartDefs.map(cd => fetchChartImage(cd.config)));
        chartDefs.forEach((cd, i) => { if (imgBuffers[i]) chartImgMap[cd.id] = imgBuffers[i]; });

        // Helper: draw chart image inline
        const inlineChart = (id, x, y, w, h) => {
            const buf = chartImgMap[id];
            if (!buf) return;
            try { doc.image(buf, x, y, { width: w, height: h }); } catch (e) { /* skip */ }
        };

        // ══════════════════════════════════════════
        //  PAGE 1 — Revenue & Orders
        // ══════════════════════════════════════════
        drawPageHeader('Revenue & Order Analytics');
        let cy = 90;  // current y pointer

        // ── KPI boxes row ──
        cy += 10;
        const boxW = (PW - M * 2 - 8) / 3;
        const boxH = 52;
        metricBox(M, cy, boxW, boxH, 'Total Orders', d.revenue.totalOrders, '#eff6ff', C.blue);
        metricBox(M + boxW + 4, cy, boxW, boxH, 'Owner Earnings', `Rs ${d.revenue.totalEarning}`, '#f0fdf4', C.green);
        metricBox(M + (boxW + 4) * 2, cy, boxW, boxH, 'Avg Order Value', `Rs ${d.revenue.avgOrderValue}`, '#faf5ff', C.purple);
        cy += boxH + 8;

        // 2nd row of KPIs
        metricBox(M, cy, boxW, boxH, 'Potential Loss', `Rs ${d.revenue.totalLoss}`, '#fef2f2', C.red);
        metricBox(M + boxW + 4, cy, boxW, boxH, 'Fulfilled Orders', d.revenue.fulfilledOrders, '#f0fdf4', C.green);
        metricBox(M + (boxW + 4) * 2, cy, boxW, boxH, 'P/L Ratio', d.revenue.profitLossRatio, '#fff7ed', C.accent);
        cy += boxH + 14;

        // ── Revenue Section ──
        cy = sectionTitle('Revenue Overview', cy);
        const leftColW = PW - M * 2 - 230;

        // text data column
        let textY = cy;
        kv('Owner Earnings', `Rs ${d.revenue.totalEarning}`, textY, true); textY += 16;
        kv('Potential Loss', `Rs ${d.revenue.totalLoss}`, textY); textY += 16;
        kv('Avg Order Value', `Rs ${d.revenue.avgOrderValue}`, textY); textY += 16;
        kv('P/L Ratio', String(d.revenue.profitLossRatio), textY, true); textY += 16;

        // Payment pie chart on the right
        if (chartImgMap['payment']) {
            doc.fontSize(7).fillColor(C.muted).font('Helvetica-Bold').text('Payment Methods', M + leftColW + 20, cy - 2, { width: 200 });
            inlineChart('payment', M + leftColW + 16, cy + 8, 200, 120);
        }

        cy = Math.max(textY, cy + 135) + 12;

        // ── Revenue Trend (full width) ──
        if (chartImgMap['revtrend']) {
            cy = sectionTitle('Revenue Trend', cy);
            inlineChart('revtrend', M, cy, PW - M * 2, 130);
            cy += 140;
        }

        // ── Orders Section ──
        cy = sectionTitle('Order Analytics', cy);
        textY = cy;
        kv('Completed', String(d.orders.completed), textY, true); textY += 16;
        kv('In Progress', String(d.orders.inProgress), textY); textY += 16;
        kv('Cancelled', String(d.orders.cancelled), textY); textY += 16;
        kv('Pending', String(d.orders.pending), textY); textY += 16;

        // Order status doughnut on right
        if (chartImgMap['orderstatus']) {
            doc.fontSize(7).fillColor(C.muted).font('Helvetica-Bold').text('Order Status', M + leftColW + 20, cy - 2, { width: 200 });
            inlineChart('orderstatus', M + leftColW + 16, cy + 8, 200, 120);
        }
        cy = Math.max(textY, cy + 135) + 8;

        // ══════════════════════════════════════════
        //  PAGE 2 — Menu & Customers & Delivery
        // ══════════════════════════════════════════
        doc.addPage({ margin: 0, size: 'A4' });
        drawPageHeader('Menu, Customers & Delivery');
        cy = 90;

        // ── Menu Section ──
        cy = sectionTitle('Menu Performance', cy + 10);
        kv('Total Menu Items', String(d.menu.totalItems), cy); cy += 18;

        // Top items bar chart (left) + category pie (right)
        if (chartImgMap['topitems'] || chartImgMap['category']) {
            const halfW = (PW - M * 2 - 10) / 2;

            if (chartImgMap['topitems']) {
                doc.fontSize(7).fillColor(C.muted).font('Helvetica-Bold').text('Top 5 Selling Items', M, cy, { width: halfW });
                inlineChart('topitems', M, cy + 10, halfW, 130);
            }
            if (chartImgMap['category']) {
                doc.fontSize(7).fillColor(C.muted).font('Helvetica-Bold').text('Category-wise Sales', M + halfW + 10, cy, { width: halfW });
                inlineChart('category', M + halfW + 10, cy + 10, halfW, 130);
            }
            cy += 150;
        } else {
            // text fallback
            d.menu.top5Items.forEach(([name, qty], i) => {
                kv(`  ${i + 1}. ${name}`, `${qty} sold`, cy); cy += 16;
            });
        }

        // ── Customer Section ──
        cy = sectionTitle('Customer Insights', cy + 6);
        textY = cy;
        kv('Total Customers', String(d.customers.total), textY, true); textY += 16;
        kv('New Customers', String(d.customers.new), textY); textY += 16;
        kv('Repeat Customers', String(d.customers.repeat), textY); textY += 16;

        if (chartImgMap['customers']) {
            doc.fontSize(7).fillColor(C.muted).font('Helvetica-Bold').text('New vs Repeat', M + leftColW + 20, cy - 2, { width: 200 });
            inlineChart('customers', M + leftColW + 16, cy + 8, 200, 110);
        }
        cy = Math.max(textY, cy + 125) + 8;

        // ── Delivery Section ──
        cy = sectionTitle('Delivery Insights', cy + 6);

        // Big avg delivery time box
        const adt = d.delivery.avgDeliveryMinutes;
        doc.roundedRect(M, cy, 140, 56, 8).fill('#eff6ff');
        doc.fillColor(C.muted).fontSize(8).font('Helvetica').text('Avg Delivery Time', M + 6, cy + 8);
        doc.fillColor(C.blue).fontSize(26).font('Helvetica-Bold')
            .text(adt != null ? `${adt}` : 'N/A', M + 6, cy + 20);
        doc.fillColor(C.muted).fontSize(8).font('Helvetica').text('minutes', M + 6, cy + 46);

        // Cancellation breakdown
        doc.roundedRect(M + 150, cy, 200, 56, 8).fill('#fef2f2');
        doc.fillColor(C.muted).fontSize(8).font('Helvetica').text('Cancellations', M + 158, cy + 8);
        doc.fillColor(C.red).fontSize(13).font('Helvetica-Bold').text(`By Customer: ${d.delivery.cancelledByWho.customer}`, M + 158, cy + 22);
        doc.fillColor('#ea580c').fontSize(13).text(`By Restaurant: ${d.delivery.cancelledByWho.restaurant}`, M + 158, cy + 38);
        cy += 70;

        // ── Footer on all pages ──────────────────
        const totalPages = doc.bufferedPageRange();
        for (let i = totalPages.start; i < totalPages.start + totalPages.count; i++) {
            doc.switchToPage(i);
            // footer strip
            doc.rect(0, PH - 28, PW, 28).fill('#f8fafc');
            doc.moveTo(0, PH - 28).lineTo(PW, PH - 28).strokeColor(C.border).lineWidth(0.5).stroke();
            doc.fillColor(C.muted).fontSize(7.5).font('Helvetica')
                .text(`QuickEats  |  ${d.meta.restaurantName}  |  Page ${i + 1} of ${totalPages.count}  |  Confidential`,
                    M, PH - 18, { align: 'center', width: PW - M * 2 });
        }

        doc.end();
    } catch (err) {
        console.error('PDF export error:', err);
        if (!res.headersSent) res.status(500).json({ error: 'Failed to export PDF' });
    }
});
module.exports = router;
