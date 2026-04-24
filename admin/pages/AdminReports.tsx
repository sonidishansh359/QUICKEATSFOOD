import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { fetchAdminReports, exportAdminReports } from "../lib/adminApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Download, FileText, Filter } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

type ReportType = 'orders' | 'revenue' | 'users' | 'restaurants' | 'delivery' | 'profit_loss';

export default function AdminReports() {
    const { toast } = useToast();
    const [reportType, setReportType] = useState<ReportType>('orders');
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const [paymentFilter, setPaymentFilter] = useState<string>('All');

    const [loading, setLoading] = useState(false);
    const [exportingCSV, setExportingCSV] = useState(false);
    const [exportingPDF, setExportingPDF] = useState(false);

    const [previewData, setPreviewData] = useState<any[]>([]);

    const handleGeneratePreview = async () => {
        setLoading(true);
        try {
            const params = {
                type: reportType,
                from: dateFrom,
                to: dateTo,
                status: statusFilter,
                paymentMethod: paymentFilter,
            };
            const res = await fetchAdminReports(params);
            if (res.success) {
                setPreviewData(res.data);
            } else {
                setPreviewData([]);
                toast({ title: "Error", description: "Failed to fetch preview data", variant: "destructive" });
            }
        } catch (err: any) {
            console.error(err);
            toast({ title: "Error", description: err.message || "Failed to fetch preview data", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (format: 'csv' | 'pdf') => {
        if (format === 'csv') setExportingCSV(true);
        else setExportingPDF(true);

        try {
            const params = {
                type: reportType,
                from: dateFrom,
                to: dateTo,
                status: statusFilter,
                paymentMethod: paymentFilter,
            };
            await exportAdminReports(format, params);
            toast({ title: "Success", description: `Report exported as ${format.toUpperCase()} successfully.` });
        } catch (err: any) {
            console.error(err);
            toast({ title: "Error", description: err.message || `Failed to export ${format.toUpperCase()}`, variant: "destructive" });
        } finally {
            if (format === 'csv') setExportingCSV(false);
            else setExportingPDF(false);
        }
    };

    useEffect(() => {
        handleGeneratePreview();
    }, [reportType]); // Auto refresh on type change

    const renderHeaders = () => {
        if (previewData.length === 0) return null;
        const keys = Object.keys(previewData[0]);
        return keys.map((key) => <th key={key} className="p-3 text-left font-semibold text-xs text-muted-foreground uppercase tracking-wider">{key.replace(/([A-Z])/g, ' $1').trim()}</th>);
    };

    const renderRows = () => {
        return previewData.map((row, idx) => (
            <tr key={idx} className="border-b last:border-b-0 hover:bg-muted/50 transition-colors">
                {Object.values(row).map((val: any, cellIdx) => (
                    <td key={cellIdx} className="p-3 text-sm truncate max-w-[200px]">
                        {typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val)}
                    </td>
                ))}
            </tr>
        ));
    };

    return (
        <div className="space-y-6">

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Filter className="w-5 h-5" /> Report Configuration
                    </CardTitle>
                    <CardDescription>Select the report parameters to generate your preview and export.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Report Type</label>
                            <Select value={reportType} onValueChange={(val: any) => setReportType(val)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="orders">Orders Report</SelectItem>
                                    <SelectItem value="revenue">Revenue Summary</SelectItem>
                                    <SelectItem value="users">Users Report</SelectItem>
                                    <SelectItem value="restaurants">Restaurants Report</SelectItem>
                                    <SelectItem value="delivery">Delivery Boy Report</SelectItem>
                                    <SelectItem value="profit_loss">Profit / Loss Ratio</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">From Date</label>
                            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">To Date</label>
                            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                        </div>

                        {(reportType === 'orders' || reportType === 'revenue') && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Order Status</label>
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Statuses" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="All">All</SelectItem>
                                            <SelectItem value="delivered">Delivered</SelectItem>
                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                            <SelectItem value="pending">Pending</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Payment Method</label>
                                    <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Methods" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="All">All</SelectItem>
                                            <SelectItem value="cod">Cash on Delivery</SelectItem>
                                            <SelectItem value="online">Online / Card</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                        <Button onClick={handleGeneratePreview} disabled={loading} className="w-full sm:w-auto">
                            {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                            Generate Preview
                        </Button>
                        <Button variant="outline" onClick={() => handleExport('csv')} disabled={exportingCSV || loading} className="w-full sm:w-auto">
                            {exportingCSV ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                            Export CSV
                        </Button>
                        <Button variant="outline" onClick={() => handleExport('pdf')} disabled={exportingPDF || loading} className="w-full sm:w-auto text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                            {exportingPDF ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                            Export PDF
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Preview Data</CardTitle>
                    <CardDescription>First 50 records matching your filters will be shown here.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <RefreshCw className="w-8 h-8 animate-spin mb-4" />
                            <p>Loading preview data...</p>
                        </div>
                    ) : previewData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed text-center p-6">
                            <FileText className="w-12 h-12 text-muted-foreground/30 mb-4" />
                            <p className="text-lg font-medium">No Data Found</p>
                            <p className="text-sm mt-1">Try adjusting your filters or date range to see results.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="overflow-x-auto rounded-md border">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted">
                                        <tr>{renderHeaders()}</tr>
                                    </thead>
                                    <tbody>{renderRows()}</tbody>
                                </table>
                            </div>

                            {reportType === 'profit_loss' && previewData.length > 0 && (
                                <div className="mt-8">
                                    <h3 className="text-lg font-semibold mb-4 text-center">Profit vs Loss Visualization</h3>
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={[
                                                        { name: 'Total Profit', value: previewData[0].totalProfit, color: '#10b981' },
                                                        { name: 'Total Loss', value: previewData[0].totalLoss, color: '#ef4444' }
                                                    ].filter(d => d.value > 0)}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={100}
                                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                >
                                                    {
                                                        [
                                                            { name: 'Total Profit', value: previewData[0].totalProfit, color: '#10b981' },
                                                            { name: 'Total Loss', value: previewData[0].totalLoss, color: '#ef4444' }
                                                        ].filter(d => d.value > 0).map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))
                                                    }
                                                </Pie>
                                                <RechartsTooltip formatter={(value) => `₹${value}`} />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
