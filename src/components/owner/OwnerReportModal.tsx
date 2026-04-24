import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, LineChart, Line, ResponsiveContainer
} from 'recharts';
import {
    X, Download, FileText, RefreshCw, Calendar, TrendingUp,
    ShoppingBag, Users, Truck, ChefHat, BarChart2, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ── Types ──────────────────────────────────────────────────────
interface ReportData {
    meta: {
        restaurantName: string;
        restaurantImage: string | null;
        ownerName: string;
        generatedAt: string;
        dateRange: { start: string; end: string };
    };
    revenue: {
        totalOrders: number;
        fulfilledOrders: number;
        totalRevenue: number;
        totalEarning: number;
        totalLoss: number;
        avgOrderValue: number;
        profitLossRatio: string;
        paymentMethodMap: Record<string, number>;
        revenueTrend: { labels: string[]; values: number[] };
    };
    orders: {
        total: number;
        completed: number;
        inProgress: number;
        cancelled: number;
        pending: number;
    };
    menu: {
        totalItems: number;
        top5Items: [string, number][];
        categorySales: Record<string, number>;
    };
    customers: { total: number; repeat: number; new: number };
    delivery: { avgDeliveryMinutes: number | null; cancelledByWho: { customer: number; restaurant: number } };
}

// ── Color constants ─────────────────────────────────────────────
const COLORS = ['#f97316', '#3b82f6', '#10b981', '#a855f7', '#ef4444', '#06b6d4', '#f59e0b'];

type DateRange = 'today' | 'week' | 'month' | 'all' | 'custom';

// ── Props ───────────────────────────────────────────────────────
interface OwnerReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// ── Stat Card ───────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) => (
    <div className={`relative overflow-hidden p-4 rounded-xl border ${color} flex items-center gap-3`}>
        <div className="p-2 rounded-lg bg-white/60">
            <Icon className="w-4 h-4" />
        </div>
        <div>
            <p className="text-xs font-medium opacity-70">{label}</p>
            <p className="text-lg font-bold">{value}</p>
        </div>
    </div>
);

// ── Section Header ──────────────────────────────────────────────
const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
        <div className="p-1.5 rounded-lg bg-orange-50 text-orange-600">
            <Icon className="w-4 h-4" />
        </div>
        <h3 className="font-semibold text-slate-800">{title}</h3>
    </div>
);

// ── Main Component ──────────────────────────────────────────────
export const OwnerReportModal: React.FC<OwnerReportModalProps> = ({ isOpen, onClose }) => {
    const [dateRange, setDateRange] = useState<DateRange>('month');
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState<'csv' | 'pdf' | null>(null);
    const [data, setData] = useState<ReportData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'revenue' | 'orders' | 'menu' | 'customers' | 'delivery'>('revenue');

    const getToken = () => {
        try {
            const auth = JSON.parse(localStorage.getItem('quickeats_auth') || 'null');
            if (auth?.token) return auth.token;
        } catch { /* ignore */ }
        // fallback scan
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;
            try {
                const val = JSON.parse(localStorage.getItem(key) || 'null');
                if (val?.token?.startsWith?.('ey')) return val.token;
            } catch { /* skip */ }
        }
        return '';
    };

    const dateRangeRef = useRef(dateRange);
    const customFromRef = useRef(customFrom);
    const customToRef = useRef(customTo);
    const API_ORIGIN = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';
    const API_URL = API_ORIGIN.endsWith('/api') ? API_ORIGIN : `${API_ORIGIN}/api`;

    const buildParams = useCallback(() => {
        const p = new URLSearchParams({ range: dateRangeRef.current });
        if (dateRangeRef.current === 'custom') {
            if (customFromRef.current) p.set('from', customFromRef.current);
            if (customToRef.current) p.set('to', customToRef.current);
        }
        return p.toString();
    }, []);

    const handleFetchPreview = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/owner-report/preview?${buildParams()}`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || `HTTP ${res.status}`);
            }
            const json = await res.json();
            if (json.success) setData(json.data);
            else throw new Error('Failed to load report data');
        } catch (e: any) {
            setError(e.message || 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, [API_URL, buildParams]);

    // Sync refs so buildParams always reads fresh values
    useEffect(() => { dateRangeRef.current = dateRange; }, [dateRange]);
    useEffect(() => { customFromRef.current = customFrom; }, [customFrom]);
    useEffect(() => { customToRef.current = customTo; }, [customTo]);

    // ── Auto-fetch: when modal opens OR dateRange changes (not custom)
    const hasLoadedRef = useRef(false);
    useEffect(() => {
        if (!isOpen) { hasLoadedRef.current = false; return; }
        // Always auto-fetch for non-custom ranges
        if (dateRange !== 'custom') {
            handleFetchPreview();
            hasLoadedRef.current = true;
        }
    }, [isOpen, dateRange]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleDownload = async (format: 'csv' | 'pdf') => {
        setDownloading(format);
        try {
            const res = await fetch(`${API_URL}/owner-report/export/${format}?${buildParams()}`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            if (!res.ok) throw new Error('Download failed');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Report_${Date.now()}.${format}`;
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (e: any) {
            setError('Download failed: ' + e.message);
        } finally {
            setDownloading(null);
        }
    };

    if (!isOpen) return null;

    // ── Derived chart data ─────────────────────────────────────────
    const paymentChartData = data
        ? Object.entries(data.revenue.paymentMethodMap).map(([name, value]) => ({ name, value }))
        : [];

    const orderStatusData = data
        ? [
            { name: 'Completed', value: data.orders.completed, color: '#10b981' },
            { name: 'In Progress', value: data.orders.inProgress, color: '#3b82f6' },
            { name: 'Cancelled', value: data.orders.cancelled, color: '#ef4444' },
            { name: 'Pending', value: data.orders.pending, color: '#f59e0b' },
        ].filter(d => d.value > 0)
        : [];

    const revenueTrendData = data
        ? data.revenue.revenueTrend.labels.map((label, i) => ({
            date: label,
            earnings: data.revenue.revenueTrend.values[i]
        }))
        : [];

    const top5ChartData = data
        ? data.menu.top5Items.map(([name, qty]) => ({ name, qty }))
        : [];

    const categorySalesData = data
        ? Object.entries(data.menu.categorySales).map(([name, value]) => ({ name, value }))
        : [];

    const customerData = data
        ? [
            { name: 'New Customers', value: data.customers.new, color: '#3b82f6' },
            { name: 'Repeat Customers', value: data.customers.repeat, color: '#10b981' },
        ].filter(d => d.value > 0)
        : [];

    const TABS = [
        { id: 'revenue', label: 'Revenue', icon: TrendingUp },
        { id: 'orders', label: 'Orders', icon: ShoppingBag },
        { id: 'menu', label: 'Menu', icon: ChefHat },
        { id: 'customers', label: 'Customers', icon: Users },
        { id: 'delivery', label: 'Delivery', icon: Truck },
    ] as const;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 25 }}
                className="relative w-full max-w-5xl max-h-[92vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* ── Modal Header ─────────────────────────────────── */}
                <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-500 rounded-xl">
                            <BarChart2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Business Performance Report</h2>
                            {data && <p className="text-xs text-slate-300">{data.meta.restaurantName} · {data.meta.ownerName}</p>}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* ── Filters Bar ──────────────────────────────────── */}
                <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex-shrink-0 space-y-2">

                    {/* Row 1: Range tabs + Action buttons */}
                    <div className="flex items-center justify-between gap-2">

                        {/* Date range tab group */}
                        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 flex-wrap">
                            {(['today', 'week', 'month', 'all', 'custom'] as DateRange[]).map(r => (
                                <button
                                    key={r}
                                    onClick={() => setDateRange(r)}
                                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${dateRange === r
                                        ? 'bg-orange-500 text-white shadow-sm'
                                        : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                >
                                    {r === 'all' ? 'All Time' : r === 'month' ? 'This Month' : r === 'week' ? 'This Week' : r === 'today' ? 'Today' : 'Custom'}
                                </button>
                            ))}
                        </div>

                        {/* Action buttons — always right-aligned */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Refresh */}
                            <button
                                onClick={handleFetchPreview}
                                disabled={loading}
                                title="Refresh"
                                className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-orange-500' : ''}`} />
                            </button>

                            {/* CSV */}
                            <button
                                onClick={() => handleDownload('csv')}
                                disabled={!!downloading || !data}
                                title="Download CSV"
                                className="h-8 px-3 flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors disabled:opacity-40"
                            >
                                {downloading === 'csv'
                                    ? <RefreshCw className="w-3 h-3 animate-spin" />
                                    : <FileText className="w-3 h-3" />}
                                CSV
                            </button>

                            {/* PDF */}
                            <button
                                onClick={() => handleDownload('pdf')}
                                disabled={!!downloading || !data}
                                title="Download PDF"
                                className="h-8 px-3 flex items-center gap-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors disabled:opacity-40"
                            >
                                {downloading === 'pdf'
                                    ? <RefreshCw className="w-3 h-3 animate-spin" />
                                    : <Download className="w-3 h-3" />}
                                PDF
                            </button>
                        </div>
                    </div>

                    {/* Row 2 (Custom only): date pickers */}
                    {dateRange === 'custom' && (
                        <div className="flex items-center gap-2 pt-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <label className="text-xs text-slate-500 flex-shrink-0">From</label>
                            <input
                                type="date"
                                value={customFrom}
                                onChange={e => {
                                    setCustomFrom(e.target.value);
                                    customFromRef.current = e.target.value;
                                }}
                                className="border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                            />
                            <span className="text-slate-400 text-xs">–</span>
                            <label className="text-xs text-slate-500 flex-shrink-0">To</label>
                            <input
                                type="date"
                                value={customTo}
                                onChange={e => {
                                    setCustomTo(e.target.value);
                                    customToRef.current = e.target.value;
                                    if (customFrom && e.target.value) {
                                        setTimeout(() => handleFetchPreview(), 0);
                                    }
                                }}
                                className="border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                            />
                            <button
                                onClick={handleFetchPreview}
                                disabled={!customFrom || !customTo || loading}
                                className="ml-2 h-7 px-3 rounded-lg bg-orange-500 text-white text-xs font-medium hover:bg-orange-600 transition-colors disabled:opacity-40"
                            >
                                Apply
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Body ─────────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto">
                    {/* Error state */}
                    {error && (
                        <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    {/* Loading / empty state */}
                    {!data && !loading && !error && (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <BarChart2 className="w-16 h-16 mb-4 opacity-20" />
                            <p className="text-lg font-medium">Select a date range and click "Generate Report"</p>
                            <p className="text-sm mt-1">Your business analytics will appear here</p>
                        </div>
                    )}

                    {loading && (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <RefreshCw className="w-12 h-12 animate-spin mb-4 text-orange-500" />
                            <p className="text-lg font-medium text-slate-600">Analyzing your data...</p>
                            <p className="text-sm mt-1">Fetching orders, revenue, and menu performance</p>
                        </div>
                    )}

                    {data && !loading && (
                        <>
                            {/* ── KPI Summary Strip ───────────────────────── */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 pt-5 pb-2">
                                <StatCard label="Total Orders" value={data.revenue.totalOrders} icon={ShoppingBag} color="bg-blue-50 border-blue-100 text-blue-800" />
                                <StatCard label="Owner Earnings" value={`₹${data.revenue.totalEarning}`} icon={TrendingUp} color="bg-emerald-50 border-emerald-100 text-emerald-800" />
                                <StatCard label="Avg Order Value" value={`₹${data.revenue.avgOrderValue}`} icon={BarChart2} color="bg-orange-50 border-orange-100 text-orange-800" />
                                <StatCard label="P/L Ratio" value={data.revenue.profitLossRatio} icon={ChefHat} color="bg-purple-50 border-purple-100 text-purple-800" />
                            </div>

                            {/* ── Tabs ────────────────────────────────────── */}
                            <div className="flex gap-1 px-6 pt-3 pb-0 border-b border-slate-100 overflow-x-auto">
                                {TABS.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                                            ? 'border-orange-500 text-orange-600'
                                            : 'border-transparent text-slate-500 hover:text-slate-700'
                                            }`}
                                    >
                                        <tab.icon className="w-3.5 h-3.5" />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* ── Tab Content ─────────────────────────────── */}
                            <div className="p-6 space-y-6">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeTab}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        {/* ── Revenue Tab ────────────────────────── */}
                                        {activeTab === 'revenue' && (
                                            <div className="space-y-6">
                                                <SectionHeader icon={TrendingUp} title="Revenue Overview" />
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                                                    {[
                                                        { label: 'Total Revenue', value: `₹${data.revenue.totalRevenue}`, highlight: true },
                                                        { label: 'Owner Earnings', value: `₹${data.revenue.totalEarning}`, highlight: true },
                                                        { label: 'Potential Loss', value: `₹${data.revenue.totalLoss}`, highlight: false },
                                                        { label: 'Avg Order Value', value: `₹${data.revenue.avgOrderValue}`, highlight: false },
                                                        { label: 'Fulfilled Orders', value: data.revenue.fulfilledOrders, highlight: false },
                                                        { label: 'P/L Ratio', value: data.revenue.profitLossRatio, highlight: true },
                                                    ].map(item => (
                                                        <div key={item.label} className={`p-3 rounded-xl border ${item.highlight ? 'bg-orange-50 border-orange-100' : 'bg-slate-50 border-slate-100'}`}>
                                                            <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                                                            <p className={`font-bold ${item.highlight ? 'text-orange-700 text-base' : 'text-slate-800'}`}>{item.value}</p>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Revenue Trend */}
                                                {revenueTrendData.length > 1 && (
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-slate-700 mb-3">Revenue Trend</h4>
                                                        <ResponsiveContainer width="100%" height={200}>
                                                            <LineChart data={revenueTrendData}>
                                                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                                                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                                                <YAxis tick={{ fontSize: 10 }} />
                                                                <Tooltip formatter={(v: any) => [`₹${v}`, 'Earnings']} />
                                                                <Line type="monotone" dataKey="earnings" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
                                                            </LineChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                )}

                                                {/* Payment Methods */}
                                                {paymentChartData.length > 0 && (
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-slate-700 mb-3">Payment Method Distribution</h4>
                                                        <div className="flex items-center gap-6">
                                                            <ResponsiveContainer width="50%" height={180}>
                                                                <PieChart>
                                                                    <Pie data={paymentChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                                                                        {paymentChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                                                    </Pie>
                                                                    <Tooltip />
                                                                </PieChart>
                                                            </ResponsiveContainer>
                                                            <div className="flex-1 space-y-2">
                                                                {paymentChartData.map((d, i) => (
                                                                    <div key={d.name} className="flex items-center gap-2 text-sm">
                                                                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                                                                        <span className="capitalize text-slate-600">{d.name}</span>
                                                                        <span className="ml-auto font-semibold text-slate-800">{d.value}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* ── Orders Tab ─────────────────────────── */}
                                        {activeTab === 'orders' && (
                                            <div className="space-y-6">
                                                <SectionHeader icon={ShoppingBag} title="Order Analytics" />
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                    {[
                                                        { label: 'Completed', value: data.orders.completed, color: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
                                                        { label: 'In Progress', value: data.orders.inProgress, color: 'bg-blue-50 border-blue-100 text-blue-700' },
                                                        { label: 'Cancelled', value: data.orders.cancelled, color: 'bg-red-50 border-red-100 text-red-700' },
                                                        { label: 'Pending', value: data.orders.pending, color: 'bg-yellow-50 border-yellow-100 text-yellow-700' },
                                                    ].map(s => (
                                                        <div key={s.label} className={`p-4 rounded-xl border text-center ${s.color}`}>
                                                            <p className="text-2xl font-bold">{s.value}</p>
                                                            <p className="text-xs mt-1 opacity-80">{s.label}</p>
                                                        </div>
                                                    ))}
                                                </div>

                                                {orderStatusData.length > 0 && (
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-slate-700 mb-3">Order Status Distribution</h4>
                                                        <div className="flex items-center gap-6">
                                                            <ResponsiveContainer width="50%" height={200}>
                                                                <PieChart>
                                                                    <Pie data={orderStatusData} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={80} label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                                                                        {orderStatusData.map((d, i) => <Cell key={i} fill={d.color} />)}
                                                                    </Pie>
                                                                    <Tooltip />
                                                                </PieChart>
                                                            </ResponsiveContainer>
                                                            <div className="flex-1 space-y-2">
                                                                {orderStatusData.map(s => (
                                                                    <div key={s.name} className="flex items-center gap-2 text-sm">
                                                                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color }} />
                                                                        <span className="text-slate-600">{s.name}</span>
                                                                        <span className="ml-auto font-semibold text-slate-800">{s.value}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* ── Menu Tab ───────────────────────────── */}
                                        {activeTab === 'menu' && (
                                            <div className="space-y-6">
                                                <SectionHeader icon={ChefHat} title="Menu Performance" />
                                                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm">
                                                    <span className="text-slate-500">Total Menu Items: </span>
                                                    <span className="font-bold text-slate-800">{data.menu.totalItems}</span>
                                                </div>

                                                {top5ChartData.length > 0 && (
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-slate-700 mb-3">Top 5 Selling Items</h4>
                                                        <ResponsiveContainer width="100%" height={200}>
                                                            <BarChart data={top5ChartData} layout="vertical" margin={{ left: 20 }}>
                                                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                                                <XAxis type="number" tick={{ fontSize: 10 }} />
                                                                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
                                                                <Tooltip formatter={(v: any) => [v, 'Units Sold']} />
                                                                <Bar dataKey="qty" radius={[0, 6, 6, 0]}>
                                                                    {top5ChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                                                </Bar>
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                )}

                                                {categorySalesData.length > 0 && (
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-slate-700 mb-3">Category-wise Sales</h4>
                                                        <div className="flex items-center gap-6">
                                                            <ResponsiveContainer width="50%" height={180}>
                                                                <PieChart>
                                                                    <Pie data={categorySalesData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                                                                        {categorySalesData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                                                    </Pie>
                                                                    <Tooltip />
                                                                </PieChart>
                                                            </ResponsiveContainer>
                                                            <div className="flex-1 space-y-2">
                                                                {categorySalesData.map((d, i) => (
                                                                    <div key={d.name} className="flex items-center gap-2 text-sm">
                                                                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                                                                        <span className="text-slate-600">{d.name}</span>
                                                                        <span className="ml-auto font-semibold">{d.value} units</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* ── Customers Tab ──────────────────────── */}
                                        {activeTab === 'customers' && (
                                            <div className="space-y-6">
                                                <SectionHeader icon={Users} title="Customer Insights" />
                                                <div className="grid grid-cols-3 gap-4">
                                                    {[
                                                        { label: 'Total Customers', value: data.customers.total, color: 'bg-blue-50 border-blue-100' },
                                                        { label: 'New Customers', value: data.customers.new, color: 'bg-purple-50 border-purple-100' },
                                                        { label: 'Repeat Customers', value: data.customers.repeat, color: 'bg-emerald-50 border-emerald-100' },
                                                    ].map(c => (
                                                        <div key={c.label} className={`p-4 rounded-xl border text-center ${c.color}`}>
                                                            <p className="text-3xl font-bold text-slate-800">{c.value}</p>
                                                            <p className="text-xs text-slate-500 mt-1">{c.label}</p>
                                                        </div>
                                                    ))}
                                                </div>

                                                {customerData.length > 0 && (
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-slate-700 mb-3">New vs Repeat Customers</h4>
                                                        <div className="flex items-center gap-6">
                                                            <ResponsiveContainer width="50%" height={180}>
                                                                <PieChart>
                                                                    <Pie data={customerData} dataKey="value" cx="50%" cy="50%" outerRadius={70} label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                                                                        {customerData.map((d, i) => <Cell key={i} fill={d.color} />)}
                                                                    </Pie>
                                                                    <Tooltip />
                                                                </PieChart>
                                                            </ResponsiveContainer>
                                                            <div className="flex-1 space-y-2">
                                                                {customerData.map(d => (
                                                                    <div key={d.name} className="flex items-center gap-2 text-sm">
                                                                        <div className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                                                                        <span className="text-slate-600">{d.name}</span>
                                                                        <span className="ml-auto font-semibold">{d.value}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* ── Delivery Tab ───────────────────────── */}
                                        {activeTab === 'delivery' && (
                                            <div className="space-y-6">
                                                <SectionHeader icon={Truck} title="Delivery Insights" />
                                                <div className="p-6 rounded-xl bg-blue-50 border border-blue-100 text-center">
                                                    <p className="text-5xl font-bold text-blue-700">
                                                        {data.delivery.avgDeliveryMinutes != null ? `${data.delivery.avgDeliveryMinutes}` : 'N/A'}
                                                    </p>
                                                    <p className="text-sm text-blue-500 mt-2">Average Delivery Time (minutes)</p>
                                                </div>

                                                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                                                    <p className="text-sm text-slate-500 mb-2 font-medium">Cancellation Breakdown</p>
                                                    <div className="flex items-center gap-4 text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-3 h-3 rounded-full bg-red-400" />
                                                            <span className="text-slate-600">By Customer: {data.delivery.cancelledByWho.customer}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-3 h-3 rounded-full bg-orange-400" />
                                                            <span className="text-slate-600">By Restaurant: {data.delivery.cancelledByWho.restaurant}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* ── Footer ──────────────────────────────────── */}
                            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400 flex-shrink-0">
                                Report generated at {data ? new Date(data.meta.generatedAt).toLocaleString() : ''} · Confidential business data
                            </div>
                        </>
                    )}
                </div>
            </motion.div>
        </div>,
        document.body
    );
};

export default OwnerReportModal;
