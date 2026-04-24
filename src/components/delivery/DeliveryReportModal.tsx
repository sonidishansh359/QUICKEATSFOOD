import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, LineChart, Line, ResponsiveContainer
} from 'recharts';
import {
    X, Download, FileText, RefreshCw, Calendar, TrendingUp,
    ShoppingBag, Star, Truck, BarChart2, AlertCircle, Clock, IndianRupee
} from 'lucide-react';

interface ReportData {
    meta: {
        deliveryBoyName: string;
        deliveryBoyId: string;
        generatedAt: string;
        dateRange: { start: string; end: string };
    };
    performance: {
        assigned: number; completed: number; cancelled: number; active: number; completionRate: string;
    };
    time: {
        avgDeliveryTime: string | null; fastestTime: string | null; longestTime: string | null; onTime: number; late: number;
    };
    earnings: {
        totalEarnings: number; cashCollected: number; codCount: number; onlineCount: number;
        dailyEarningsMap: Record<string, number>;
    };
    insights: {
        ordersPerDay: Record<string, number>;
        cancelledByCustomer: number; cancelledByRestaurant: number;
    };
    ratings: {
        avgRating: string; totalReviews: number; ratingDist: Record<number, number>;
    };
}

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#a855f7', '#ef4444', '#06b6d4', '#f59e0b'];

type DateRange = 'today' | 'week' | 'month' | 'all' | 'custom';

interface DeliveryReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const StatCard = ({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) => (
    <div className={`relative overflow-hidden p-4 rounded-xl border ${color} flex items-center gap-3`}>
        <div className="p-2 rounded-lg bg-white/60">
            <Icon className="w-5 h-5" />
        </div>
        <div>
            <p className="text-xs font-medium opacity-70">{label}</p>
            <p className="text-lg font-bold">{value}</p>
        </div>
    </div>
);

const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
        <div className="p-1.5 rounded-lg bg-orange-50 text-orange-600">
            <Icon className="w-4 h-4" />
        </div>
        <h3 className="font-semibold text-slate-800">{title}</h3>
    </div>
);

export const DeliveryReportModal: React.FC<DeliveryReportModalProps> = ({ isOpen, onClose }) => {
    const [dateRange, setDateRange] = useState<DateRange>('month');
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState<'csv' | 'pdf' | null>(null);
    const [data, setData] = useState<ReportData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'performance' | 'time' | 'earnings' | 'insights' | 'ratings'>('performance');

    const getToken = () => {
        try {
            const auth = JSON.parse(localStorage.getItem('quickeats_auth') || 'null');
            if (auth?.token) return auth.token;
        } catch { /* ignore */ }
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
    const API_ORIGIN = import.meta.env.VITE_API_URL || 'http://localhost:5000';
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
            const res = await fetch(`${API_URL}/delivery-report/preview?${buildParams()}`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || err.message || `HTTP ${res.status}`);
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

    useEffect(() => { dateRangeRef.current = dateRange; }, [dateRange]);
    useEffect(() => { customFromRef.current = customFrom; }, [customFrom]);
    useEffect(() => { customToRef.current = customTo; }, [customTo]);

    const hasLoadedRef = useRef(false);
    useEffect(() => {
        if (!isOpen) { hasLoadedRef.current = false; return; }
        if (dateRange !== 'custom') {
            handleFetchPreview();
            hasLoadedRef.current = true;
        }
    }, [isOpen, dateRange]);

    const handleDownload = async (format: 'csv' | 'pdf') => {
        setDownloading(format);
        try {
            const res = await fetch(`${API_URL}/delivery-report/export/${format}?${buildParams()}`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            if (!res.ok) throw new Error('Download failed');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Delivery_Report_${Date.now()}.${format}`;
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

    const paymentChartData = data
        ? [
            { name: 'COD', value: data.earnings.codCount, color: '#ef4444' },
            { name: 'Online', value: data.earnings.onlineCount, color: '#10b981' }
        ].filter(d => d.value > 0)
        : [];

    const orderStatusData = data
        ? [
            { name: 'Completed', value: data.performance.completed, color: '#10b981' },
            { name: 'Active', value: data.performance.active, color: '#3b82f6' },
            { name: 'Cancelled', value: data.performance.cancelled, color: '#ef4444' },
        ].filter(d => d.value > 0)
        : [];

    const ordersTrendData = data
        ? Object.entries(data.insights.ordersPerDay)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, count]) => ({ date, deliveries: count }))
        : [];

    const earningsTrendData = data
        ? Object.entries(data.earnings.dailyEarningsMap)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, amount]) => ({ date, amount }))
        : [];

    const ratingsData = data
        ? [
            { name: '5 Star', value: data.ratings.ratingDist[5], color: '#10b981' },
            { name: '4 Star', value: data.ratings.ratingDist[4], color: '#3b82f6' },
            { name: '3 Star', value: data.ratings.ratingDist[3], color: '#f59e0b' },
            { name: '2 Star', value: data.ratings.ratingDist[2], color: '#f97316' },
            { name: '1 Star', value: data.ratings.ratingDist[1], color: '#ef4444' },
        ].filter(d => d.value > 0)
        : [];

    const onTimeData = data
        ? [
            { name: 'On-Time', value: data.time.onTime, color: '#10b981' },
            { name: 'Late', value: data.time.late, color: '#ef4444' }
        ].filter(d => d.value > 0)
        : [];

    const TABS = [
        { id: 'performance', label: 'Performance', icon: Truck },
        { id: 'time', label: 'Time Analytics', icon: Clock },
        { id: 'earnings', label: 'Earnings', icon: IndianRupee },
        { id: 'insights', label: 'Order Insights', icon: BarChart2 },
        { id: 'ratings', label: 'Ratings', icon: Star },
    ] as const;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
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
                            <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Delivery Performance Report</h2>
                            {data && <p className="text-xs text-slate-300">{data.meta.deliveryBoyName} · ID: {data.meta.deliveryBoyId}</p>}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* ── Filters Bar ──────────────────────────────────── */}
                <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex-shrink-0 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 flex-wrap">
                            {(['today', 'week', 'month', 'all', 'custom'] as DateRange[]).map(r => (
                                <button
                                    key={r}
                                    onClick={() => setDateRange(r)}
                                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${dateRange === r ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
                                >
                                    {r === 'all' ? 'All Time' : r === 'month' ? 'This Month' : r === 'week' ? 'This Week' : r === 'today' ? 'Today' : 'Custom'}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button onClick={handleFetchPreview} disabled={loading} title="Refresh" className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-orange-500' : ''}`} />
                            </button>
                            <button onClick={() => handleDownload('csv')} disabled={!!downloading || !data} className="h-8 px-3 flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-medium hover:bg-slate-50 disabled:opacity-40">
                                {downloading === 'csv' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />} CSV
                            </button>
                            <button onClick={() => handleDownload('pdf')} disabled={!!downloading || !data} className="h-8 px-3 flex items-center gap-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 disabled:opacity-40">
                                {downloading === 'pdf' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />} PDF
                            </button>
                        </div>
                    </div>

                    {dateRange === 'custom' && (
                        <div className="flex items-center gap-2 pt-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <label className="text-xs text-slate-500">From</label>
                            <input type="date" value={customFrom} onChange={e => { setCustomFrom(e.target.value); customFromRef.current = e.target.value; }} className="border rounded-lg px-2 py-1 text-xs outline-none bg-white" />
                            <span className="text-slate-400 text-xs">–</span>
                            <label className="text-xs text-slate-500">To</label>
                            <input type="date" value={customTo} onChange={e => { setCustomTo(e.target.value); customToRef.current = e.target.value; if (customFrom && e.target.value) setTimeout(handleFetchPreview, 0); }} className="border rounded-lg px-2 py-1 text-xs outline-none bg-white" />
                            <button onClick={handleFetchPreview} disabled={!customFrom || !customTo || loading} className="ml-2 h-7 px-3 bg-orange-500 text-white text-xs font-medium rounded-lg hover:bg-orange-600 disabled:opacity-40">Apply</button>
                        </div>
                    )}
                </div>

                {/* ── Body ─────────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto">
                    {error && (
                        <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    {!data && !loading && !error && (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <FileText className="w-16 h-16 mb-4 opacity-20" />
                            <p className="text-lg font-medium">Select a date range</p>
                            <p className="text-sm mt-1">Your delivery performance will appear here</p>
                        </div>
                    )}

                    {loading && (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <RefreshCw className="w-12 h-12 animate-spin mb-4 text-orange-500" />
                            <p className="text-lg font-medium text-slate-600">Analyzing data...</p>
                        </div>
                    )}

                    {data && !loading && (
                        <>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 pt-5 pb-2">
                                <StatCard label="Assigned Orders" value={data.performance.assigned} icon={ShoppingBag} color="bg-blue-50 border-blue-100 text-blue-800" />
                                <StatCard label="Completed" value={data.performance.completed} icon={Truck} color="bg-emerald-50 border-emerald-100 text-emerald-800" />
                                <StatCard label="Completion Rate" value={`${data.performance.completionRate}%`} icon={TrendingUp} color="bg-orange-50 border-orange-100 text-orange-800" />
                                <StatCard label="Total Earnings" value={`₹${data.earnings.totalEarnings}`} icon={IndianRupee} color="bg-purple-50 border-purple-100 text-purple-800" />
                            </div>

                            <div className="flex gap-1 px-6 pt-3 pb-0 border-b border-slate-100 overflow-x-auto">
                                {TABS.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <tab.icon className="w-3.5 h-3.5" />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            <div className="p-6 space-y-6">
                                <AnimatePresence mode="wait">
                                    <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }}>
                                        {activeTab === 'performance' && (
                                            <div className="space-y-6">
                                                <SectionHeader icon={Truck} title="Delivery Performance" />
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                    {[
                                                        { label: 'Completed', value: data.performance.completed, color: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
                                                        { label: 'Active', value: data.performance.active, color: 'bg-blue-50 border-blue-100 text-blue-700' },
                                                        { label: 'Cancelled', value: data.performance.cancelled, color: 'bg-red-50 border-red-100 text-red-700' },
                                                        { label: 'Assigned', value: data.performance.assigned, color: 'bg-orange-50 border-orange-100 text-orange-700' },
                                                    ].map(s => (
                                                        <div key={s.label} className={`p-4 rounded-xl border text-center ${s.color}`}>
                                                            <p className="text-2xl font-bold">{s.value}</p>
                                                            <p className="text-xs mt-1 opacity-80">{s.label}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                                {orderStatusData.length > 0 && (
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-slate-700 mb-3">Status Distribution</h4>
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
                                                                        <span className="ml-auto font-semibold">{s.value}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {activeTab === 'time' && (
                                            <div className="space-y-6">
                                                <SectionHeader icon={Clock} title="Time Analytics" />
                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    {[
                                                        { label: 'Avg Delivery Time', value: data.time.avgDeliveryTime ? `${data.time.avgDeliveryTime}m` : 'N/A' },
                                                        { label: 'Fastest Delivery', value: data.time.fastestTime ? `${data.time.fastestTime}m` : 'N/A' },
                                                    ].map(item => (
                                                        <div key={item.label} className="p-3 rounded-xl border bg-slate-50 border-slate-100">
                                                            <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                                                            <p className="font-bold text-slate-800">{item.value}</p>
                                                        </div>
                                                    ))}
                                                </div>

                                                {onTimeData.length > 0 && (
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-slate-700 mb-3">On-Time vs Late</h4>
                                                        <div className="flex items-center gap-6">
                                                            <ResponsiveContainer width="50%" height={200}>
                                                                <PieChart>
                                                                    <Pie data={onTimeData} dataKey="value" cx="50%" cy="50%" outerRadius={70} label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                                                                        {onTimeData.map((d, i) => <Cell key={i} fill={d.color} />)}
                                                                    </Pie>
                                                                    <Tooltip />
                                                                </PieChart>
                                                            </ResponsiveContainer>
                                                            <div className="flex-1 space-y-2">
                                                                {onTimeData.map(s => (
                                                                    <div key={s.name} className="flex items-center gap-2 text-sm">
                                                                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color }} />
                                                                        <span className="text-slate-600">{s.name}</span>
                                                                        <span className="ml-auto font-semibold">{s.value}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {activeTab === 'earnings' && (
                                            <div className="space-y-6">
                                                <SectionHeader icon={IndianRupee} title="Earnings Summary" />
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="p-4 rounded-xl border bg-emerald-50 border-emerald-100 text-center">
                                                        <p className="text-2xl font-bold text-emerald-700">₹{data.earnings.totalEarnings}</p>
                                                        <p className="text-xs mt-1 opacity-80 text-emerald-800">Total Earnings</p>
                                                    </div>
                                                    <div className="p-4 rounded-xl border bg-orange-50 border-orange-100 text-center">
                                                        <p className="text-2xl font-bold text-orange-700">₹{data.earnings.cashCollected}</p>
                                                        <p className="text-xs mt-1 opacity-80 text-orange-800">Cash Collected (COD)</p>
                                                    </div>
                                                </div>

                                                {paymentChartData.length > 0 && (
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-slate-700 mb-3">Online vs Cash Collected</h4>
                                                        <div className="flex items-center gap-6">
                                                            <ResponsiveContainer width="50%" height={180}>
                                                                <PieChart>
                                                                    <Pie data={paymentChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                                                                        {paymentChartData.map((d, i) => <Cell key={i} fill={d.color} />)}
                                                                    </Pie>
                                                                    <Tooltip />
                                                                </PieChart>
                                                            </ResponsiveContainer>
                                                            <div className="flex-1 space-y-2">
                                                                {paymentChartData.map(d => (
                                                                    <div key={d.name} className="flex items-center gap-2 text-sm">
                                                                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.color }} />
                                                                        <span className="text-slate-600">{d.name} Deliveries</span>
                                                                        <span className="ml-auto font-semibold">{d.value}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {earningsTrendData.length > 1 && (
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-slate-700 mb-3">Earnings Trend</h4>
                                                        <ResponsiveContainer width="100%" height={200}>
                                                            <LineChart data={earningsTrendData}>
                                                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                                                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                                                <YAxis tick={{ fontSize: 10 }} />
                                                                <Tooltip formatter={(v: any) => [`₹${v}`, 'Earning']} />
                                                                <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                                                            </LineChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {activeTab === 'insights' && (
                                            <div className="space-y-6">
                                                <SectionHeader icon={BarChart2} title="Order Insights" />
                                                {ordersTrendData.length > 0 ? (
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-slate-700 mb-3">Deliveries Per Day</h4>
                                                        <ResponsiveContainer width="100%" height={200}>
                                                            <BarChart data={ordersTrendData}>
                                                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                                                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                                                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                                                                <Tooltip />
                                                                <Bar dataKey="deliveries" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                ) : <p className="text-sm text-slate-500">No chart data available for this range.</p>}
                                            </div>
                                        )}

                                        {activeTab === 'ratings' && (
                                            <div className="space-y-6">
                                                <SectionHeader icon={Star} title="Performance Ratings" />
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="p-4 rounded-xl border bg-yellow-50 border-yellow-100 text-center">
                                                        <p className="text-2xl font-bold text-yellow-700">{data.ratings.avgRating}</p>
                                                        <p className="text-xs mt-1 opacity-80 text-yellow-800">Average Rating</p>
                                                    </div>
                                                    <div className="p-4 rounded-xl border bg-blue-50 border-blue-100 text-center">
                                                        <p className="text-2xl font-bold text-blue-700">{data.ratings.totalReviews}</p>
                                                        <p className="text-xs mt-1 opacity-80 text-blue-800">Total Reviews</p>
                                                    </div>
                                                </div>

                                                {ratingsData.length > 0 && (
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-slate-700 mb-3">Rating Distribution</h4>
                                                        <div className="flex items-center gap-6">
                                                            <ResponsiveContainer width="50%" height={200}>
                                                                <PieChart>
                                                                    <Pie data={ratingsData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                                                                        {ratingsData.map((d, i) => <Cell key={i} fill={d.color} />)}
                                                                    </Pie>
                                                                    <Tooltip />
                                                                </PieChart>
                                                            </ResponsiveContainer>
                                                            <div className="flex-1 space-y-2">
                                                                {ratingsData.map((d) => (
                                                                    <div key={d.name} className="flex items-center gap-2 text-sm">
                                                                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.color }} />
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
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400 flex-shrink-0">
                                Report generated at {new Date(data.meta.generatedAt).toLocaleString()}
                            </div>
                        </>
                    )}
                </div>
            </motion.div>
        </div>,
        document.body
    );
};

export default DeliveryReportModal;
