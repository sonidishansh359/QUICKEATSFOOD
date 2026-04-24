const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const DeliveryBoy = require('../models/DeliveryBoy');
const Review = require('../models/Review');
const auth = require('../middleware/auth');
const https = require('https');
const PDFDocument = require('pdfkit');

// Helper: build date range from preset string or custom dates
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
        default:
            start = new Date('2000-01-01');
            end = new Date();
    }
    return { start, end };
}

// Helper: fetch chart image from QuickChart.io
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

// Aggregate report data for Delivery Boy
async function aggregateDeliveryReport(deliveryBoy, dateRange) {
    const { start, end } = dateRange;
    const dbId = deliveryBoy._id;

    // Fetch orders in range assigned to delivery boy
    const orders = await Order.find({
        deliveryBoy: dbId,
        createdAt: { $gte: start, $lte: end }
    }).populate('restaurant', 'name').lean();

    // Fetch reviews
    const reviews = await Review.find({
        deliveryBoy: dbId,
        createdAt: { $gte: start, $lte: end },
        deliveryRating: { $exists: true, $ne: null }
    }).lean();

    // -- 🚚 Delivery Performance Overview --
    let assigned = orders.length;
    let completed = 0;
    let cancelled = 0;
    let active = 0;

    // -- ⏱ Time Analytics --
    let deliveryTimes = [];
    let onTime = 0, late = 0; // Assume late if > 45 mins

    // -- 💰 Earnings Summary --
    let totalEarningsRange = 0;
    let cashCollected = 0;
    let dailyEarningsMap = {};
    let codCount = 0;
    let onlineCount = 0;

    // -- 📦 Order Insights --
    let ordersPerDayMap = {};
    let cancelledByCustomer = 0;
    let cancelledByRestaurant = 0;

    orders.forEach(o => {
        const dateKey = new Date(o.createdAt).toISOString().slice(0, 10);

        ordersPerDayMap[dateKey] = (ordersPerDayMap[dateKey] || 0) + 1;

        if (o.status === 'delivered') {
            completed++;
            const earning = o.deliveryBoyEarning || o.deliveryCharge || 20; // Fixed fallback for delivery earnings
            totalEarningsRange += earning;
            dailyEarningsMap[dateKey] = (dailyEarningsMap[dateKey] || 0) + earning;

            if (o.paymentMethod === 'cod') {
                cashCollected += o.totalAmount;
                codCount++;
            } else {
                onlineCount++;
            }

            // Time Analytics
            if (o.deliveredAt && o.createdAt) {
                const mins = (new Date(o.deliveredAt) - new Date(o.createdAt)) / 60000;
                // Filter out unrealistic delivery times (e.g. > 180 mins) to make average real
                if (mins > 0 && mins < 180) {
                    deliveryTimes.push(mins);
                    if (mins <= 45) onTime++;
                    else late++;
                }
            }
        } else if (o.status === 'cancelled') {
            cancelled++;
            // Try to guess who cancelled if we don't have direct tracking
            // E.g. assume 70% customer, 30% restaurant if unknown
            cancelledByCustomer++;
        } else {
            active++;
        }
    });

    const completionRate = assigned > 0 ? ((completed / assigned) * 100).toFixed(1) : 0;
    const avgDeliveryTime = deliveryTimes.length > 0 ? (deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length).toFixed(0) : null;
    const fastestTime = deliveryTimes.length > 0 ? Math.min(...deliveryTimes).toFixed(0) : null;
    const longestTime = deliveryTimes.length > 0 ? Math.max(...deliveryTimes).toFixed(0) : null;

    // Ratings
    let totalReviews = reviews.length;
    let avgRating = totalReviews > 0 ? (reviews.reduce((a, b) => a + (b.deliveryRating || 0), 0) / totalReviews).toFixed(1) : 0;
    let ratingDist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
        if (r.deliveryRating) {
            ratingDist[r.deliveryRating] = (ratingDist[r.deliveryRating] || 0) + 1;
        }
    });

    return {
        meta: {
            deliveryBoyName: deliveryBoy.user?.name || 'Delivery Boy',
            deliveryBoyId: deliveryBoy.licenseNumber || deliveryBoy._id.toString().slice(-6),
            generatedAt: new Date().toISOString(),
            dateRange: { start: start.toISOString(), end: end.toISOString() }
        },
        performance: {
            assigned, completed, cancelled, active, completionRate
        },
        time: {
            avgDeliveryTime, fastestTime, longestTime, onTime, late
        },
        earnings: {
            totalEarnings: totalEarningsRange,
            cashCollected,
            codCount, onlineCount,
            dailyEarningsMap
        },
        insights: {
            ordersPerDay: ordersPerDayMap,
            cancelledByCustomer, cancelledByRestaurant
        },
        ratings: {
            avgRating, totalReviews, ratingDist
        }
    };
}

// ──────────────────────────────────────────────────────────────
//  GET /api/delivery-report/preview
// ──────────────────────────────────────────────────────────────
router.get('/preview', auth, async (req, res) => {
    try {
        const { range = 'month', from, to } = req.query;
        // Verify user is delivery boy
        const userRole = req.user.role === 'delivery_boy' ? 'delivery_boy' : req.user.role;
        if (userRole !== 'delivery_boy' && userRole !== 'delivery') return res.status(403).json({ message: 'Access denied' });

        const db = await DeliveryBoy.findOne({ user: req.user.id }).populate('user', 'name');
        if (!db) return res.status(404).json({ message: 'Profile not found' });

        const dateRange = buildDateRange(range, from, to);
        const data = await aggregateDeliveryReport(db, dateRange);

        res.json({ success: true, data });
    } catch (err) {
        console.error('Delivery preview report err:', err);
        res.status(500).json({ error: 'Failed' });
    }
});

// ──────────────────────────────────────────────────────────────
//  GET /api/delivery-report/export/csv
// ──────────────────────────────────────────────────────────────
router.get('/export/csv', auth, async (req, res) => {
    try {
        const { range = 'month', from, to } = req.query;
        const db = await DeliveryBoy.findOne({ user: req.user.id }).populate('user', 'name');
        if (!db) return res.status(404).json({ message: 'Profile not found' });

        const dateRange = buildDateRange(range, from, to);
        const d = await aggregateDeliveryReport(db, dateRange);

        const lines = [];
        lines.push(`"Delivery Report - ${d.meta.deliveryBoyName}"`);
        lines.push(`"Generated: ${new Date(d.meta.generatedAt).toLocaleString()}"`);
        lines.push('');

        lines.push('"=== DELIVERY PERFORMANCE ==="');
        lines.push('"Total Assigned","Total Completed","Total Cancelled","Completion %"');
        lines.push(`"${d.performance.assigned}","${d.performance.completed}","${d.performance.cancelled}","${d.performance.completionRate}%"`);
        lines.push('');

        lines.push('"=== TIME ANALYTICS ==="');
        lines.push('"Avg Time (m)","Fastest (m)","On-Time","Late"');
        lines.push(`"${d.time.avgDeliveryTime || 'N/A'}","${d.time.fastestTime || 'N/A'}","${d.time.onTime}","${d.time.late}"`);
        lines.push('');

        lines.push('"=== EARNINGS ==="');
        lines.push('"Total Earnings (₹)","Cash Collected (₹)","COD Deliveries","Online Deliveries"');
        lines.push(`"${d.earnings.totalEarnings}","${d.earnings.cashCollected}","${d.earnings.codCount}","${d.earnings.onlineCount}"`);
        lines.push('');

        lines.push('"=== RATINGS ==="');
        lines.push('"Avg Rating","Total Reviews","5*","4*","3*","2*","1*"');
        lines.push(`"${d.ratings.avgRating}","${d.ratings.totalReviews}","${d.ratings.ratingDist[5]}","${d.ratings.ratingDist[4]}","${d.ratings.ratingDist[3]}","${d.ratings.ratingDist[2]}","${d.ratings.ratingDist[1]}"`);

        const csv = lines.join('\r\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="Delivery_Report_${Date.now()}.csv"`);
        res.send(csv);
    } catch (err) {
        console.error('CSV err:', err);
        res.status(500).json({ error: 'Failed' });
    }
});

// ──────────────────────────────────────────────────────────────
//  GET /api/delivery-report/export/pdf
// ──────────────────────────────────────────────────────────────
router.get('/export/pdf', auth, async (req, res) => {
    try {
        const { range = 'month', from, to } = req.query;
        const db = await DeliveryBoy.findOne({ user: req.user.id }).populate('user', 'name');
        if (!db) return res.status(404).json({ message: 'Profile not found' });

        const dateRange = buildDateRange(range, from, to);
        const d = await aggregateDeliveryReport(db, dateRange);

        const doc = new PDFDocument({ margin: 0, size: 'A4', bufferPages: true });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Delivery_Report_${Date.now()}.pdf"`);
        doc.pipe(res);

        const PW = doc.page.width;
        const PH = doc.page.height;
        const M = 36;

        const C = {
            dark: '#0f172a', accent: '#f97316', green: '#10b981', blue: '#3b82f6',
            red: '#ef4444', yellow: '#f59e0b', purple: '#a855f7', text: '#1e293b',
            muted: '#64748b', light: '#f8fafc', border: '#e2e8f0',
        };

        const drawPageHeader = (pageTitle) => {
            doc.rect(0, 0, PW, 72).fill(C.dark);
            doc.rect(0, 72, PW, 4).fill(C.accent);
            doc.fillColor('white').fontSize(20).font('Helvetica-Bold').text(d.meta.deliveryBoyName, M, 14);
            doc.fontSize(8).font('Helvetica').fillColor('#94a3b8')
                .text(`ID: ${d.meta.deliveryBoyId}`, PW - 200, 16, { width: 164, align: 'right' })
                .text(`Generated: ${new Date(d.meta.generatedAt).toLocaleString()}`, PW - 200, 28, { width: 164, align: 'right' });

            doc.roundedRect(M, 44, 200, 20, 4).fill(C.accent);
            doc.fillColor('white').fontSize(9).font('Helvetica-Bold').text(pageTitle, M + 8, 49);
            doc.fillColor(C.text);
        };

        const sectionTitle = (title, y) => {
            doc.rect(M, y, PW - M * 2, 22).fill('#f1f5f9');
            doc.rect(M, y, 4, 22).fill(C.accent);
            doc.fillColor(C.dark).fontSize(10).font('Helvetica-Bold').text(title, M + 12, y + 6);
            return y + 30;
        };

        const metricBox = (x, y, w, h, label, value, bg = C.light, valueColor = C.dark) => {
            doc.roundedRect(x, y, w, h, 6).fill(bg);
            doc.roundedRect(x, y, w, h, 6).strokeColor(C.border).lineWidth(0.5).stroke();
            doc.fillColor(C.muted).fontSize(7.5).font('Helvetica').text(label, x + 8, y + 8);
            doc.fillColor(valueColor).fontSize(13).font('Helvetica-Bold').text(String(value), x + 8, y + 20);
        };

        const chartDefs = [];

        // Online vs COD Pie
        if (d.earnings.codCount > 0 || d.earnings.onlineCount > 0) {
            chartDefs.push({
                id: 'payment', config: {
                    type: 'pie', data: { labels: ['COD', 'Online'], datasets: [{ data: [d.earnings.codCount, d.earnings.onlineCount], backgroundColor: [C.red, C.green] }] },
                    options: { plugins: { legend: { position: 'right' } } }
                }
            });
        }

        // On-time vs Late
        if (d.time.onTime > 0 || d.time.late > 0) {
            chartDefs.push({
                id: 'time', config: {
                    type: 'doughnut', data: { labels: ['On-time', 'Late'], datasets: [{ data: [d.time.onTime, d.time.late], backgroundColor: [C.green, C.red] }] },
                    options: { plugins: { legend: { position: 'right' } } }
                }
            });
        }

        // Orders Per Day Bar Chart
        const dates = Object.keys(d.insights.ordersPerDay).sort();
        const counts = dates.map(dt => d.insights.ordersPerDay[dt]);
        if (dates.length > 0) {
            chartDefs.push({
                id: 'ordersbarchart', config: {
                    type: 'bar', data: { labels: dates, datasets: [{ label: 'Deliveries', data: counts, backgroundColor: C.blue }] }
                }
            });
        }

        // Rating dist
        chartDefs.push({
            id: 'ratings', config: {
                type: 'pie', data: { labels: ['5 Star', '4 Star', '3 Star', '2 Star', '1 Star'], datasets: [{ data: [d.ratings.ratingDist[5], d.ratings.ratingDist[4], d.ratings.ratingDist[3], d.ratings.ratingDist[2], d.ratings.ratingDist[1]], backgroundColor: [C.green, C.blue, C.yellow, C.accent, C.red] }] },
                options: { plugins: { legend: { position: 'right' } } }
            }
        });

        const imgBuffers = await Promise.all(chartDefs.map(cd => fetchChartImage(cd.config)));
        const chartImgMap = {};
        chartDefs.forEach((cd, i) => { if (imgBuffers[i]) chartImgMap[cd.id] = imgBuffers[i]; });

        const inlineChart = (id, x, y, w, h) => {
            if (chartImgMap[id]) doc.image(chartImgMap[id], x, y, { width: w, height: h });
        };

        // --- PAGE 1 ---
        drawPageHeader('Delivery Boy Performance Report');
        let cy = 90;

        cy = sectionTitle('Performance Overview', cy);
        const boxW = (PW - M * 2 - 12) / 4;
        const boxH = 50;
        metricBox(M, cy, boxW, boxH, 'Assigned Orders', d.performance.assigned, '#eff6ff', C.blue);
        metricBox(M + boxW + 4, cy, boxW, boxH, 'Completed', d.performance.completed, '#f0fdf4', C.green);
        metricBox(M + (boxW + 4) * 2, cy, boxW, boxH, 'Cancelled', d.performance.cancelled, '#fef2f2', C.red);
        metricBox(M + (boxW + 4) * 3, cy, boxW, boxH, 'Completion Rate (%)', `${d.performance.completionRate}%`, '#faf5ff', C.purple);
        cy += boxH + 15;

        cy = sectionTitle('Earnings Summary', cy);
        metricBox(M, cy, boxW, boxH, 'Total Earnings', `Rs ${d.earnings.totalEarnings}`, '#f0fdf4', C.green);
        metricBox(M + boxW + 4, cy, boxW, boxH, 'Cash Collected', `Rs ${d.earnings.cashCollected}`, '#fff7ed', C.accent);

        if (chartImgMap['payment']) {
            doc.fontSize(8).fillColor(C.muted).text('Payment Type', M + (boxW + 4) * 2 + 10, cy);
            inlineChart('payment', M + (boxW + 4) * 2, cy + 10, 180, 100);
        }
        cy += Math.max(boxH, 110) + 15;

        cy = sectionTitle('Time Analytics', cy);
        metricBox(M, cy, boxW, boxH, 'Avg Time', `${d.time.avgDeliveryTime || 'N/A'} mins`, '#eff6ff', C.blue);
        metricBox(M + boxW + 4, cy, boxW, boxH, 'Fastest', `${d.time.fastestTime || 'N/A'} mins`, '#f0fdf4', C.green);

        if (chartImgMap['time']) {
            doc.fontSize(8).fillColor(C.muted).text('On-Time Delivery', M + (boxW + 4) * 3, cy - 15);
            inlineChart('time', M + (boxW + 4) * 3 - 20, cy, 150, 90);
        }
        cy += Math.max(boxH, 90) + 15;

        if (chartImgMap['ordersbarchart']) {
            cy = sectionTitle('Orders Trend', cy);
            inlineChart('ordersbarchart', M, cy, PW - M * 2, 130);
            cy += 140;
        }

        cy = sectionTitle('Performance Rating', cy);
        metricBox(M, cy, boxW, boxH, 'Average Rating', `${d.ratings.avgRating} / 5`, '#fef9c3', C.yellow);
        metricBox(M + boxW + 4, cy, boxW, boxH, 'Total Reviews', d.ratings.totalReviews, '#eff6ff', C.blue);

        if (chartImgMap['ratings']) {
            inlineChart('ratings', M + (boxW + 4) * 2, cy - 10, 160, 100);
        }

        const totalPages = doc.bufferedPageRange();
        for (let i = totalPages.start; i < totalPages.start + totalPages.count; i++) {
            doc.switchToPage(i);
            doc.fillColor(C.muted).fontSize(7.5).text(`Page ${i + 1} of ${totalPages.count}`, M, PH - 20, { align: 'center', width: PW - M * 2 });
        }

        doc.end();
    } catch (err) {
        console.error('PDF err:', err);
        if (!res.headersSent) res.status(500).json({ error: 'Failed' });
    }
});

module.exports = router;
