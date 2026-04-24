import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { fetchAdminBalance, fetchAdminTransactions, addAdminMoney, withdrawAdminMoney } from "../lib/adminApi";
import { Loader2, IndianRupee, ArrowUpRight, ArrowDownLeft, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import { PaymentProcessingModal } from "@/components/ui/PaymentProcessingModal";

const AdminEarnings = () => {
    const [balance, setBalance] = useState<{ availableBalance: number; totalEarnings: number } | null>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [addMoneyOpen, setAddMoneyOpen] = useState(false);
    const [withdrawOpen, setWithdrawOpen] = useState(false);
    const [amountInput, setAmountInput] = useState("");

    // Payment Processing Modal States
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
    const [paymentType, setPaymentType] = useState<'add' | 'withdrawal'>('add');
    const [paymentError, setPaymentError] = useState('');
    const [transactionId, setTransactionId] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [balanceData, transactionsData] = await Promise.all([
                fetchAdminBalance(),
                fetchAdminTransactions()
            ]);
            setBalance(balanceData);
            setTransactions(transactionsData);
        } catch (error) {
            console.error("Failed to load earnings data:", error);
            toast.error("Failed to load earnings data");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const handleAddMoney = async () => {
        const amount = parseFloat(amountInput);
        if (isNaN(amount) || amount <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        setAddMoneyOpen(false);
        setPaymentType('add');
        setShowPaymentModal(true);
        setPaymentStatus('processing');
        setPaymentError('');

        try {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate Razorpay processing delay
            await addAdminMoney(amount);

            setPaymentStatus('success');
            setTransactionId(`rzp_add_${Math.random().toString(36).substring(2, 10).toUpperCase()}`);
            loadData();
        } catch (error: any) {
            setPaymentStatus('error');
            setPaymentError(error.message || "Failed to add money via Razorpay");
        }
    };

    const handleWithdraw = async () => {
        const amount = parseFloat(amountInput);
        if (isNaN(amount) || amount <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        if (balance && amount > balance.availableBalance) {
            toast.error("Insufficient balance for this withdrawal");
            return;
        }

        setWithdrawOpen(false);
        setPaymentType('withdrawal');
        setShowPaymentModal(true);
        setPaymentStatus('processing');
        setPaymentError('');

        try {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate Razorpay processing delay
            await withdrawAdminMoney(amount);

            setPaymentStatus('success');
            setTransactionId(`payout_${Math.random().toString(36).substring(2, 11)}`);
            loadData();
        } catch (error: any) {
            setPaymentStatus('error');
            setPaymentError(error.message || "Failed to withdraw money via Razorpay");
        }
    };

    const handleClosePaymentModal = () => {
        setShowPaymentModal(false);
        setPaymentStatus('idle');
        setTransactionId('');
        if (paymentStatus === 'success') {
            setAmountInput("");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Earnings & Wallet</h1>
                    <p className="text-muted-foreground">Manage admin wallet and view transaction history.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Dialog open={addMoneyOpen} onOpenChange={(open) => { setAddMoneyOpen(open); if (!open) setAmountInput(""); }}>
                        <DialogTrigger asChild>
                            <Button className="bg-green-600 hover:bg-green-700">
                                <Plus className="mr-2 h-4 w-4" /> Add Money
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Money to Wallet</DialogTitle>
                            </DialogHeader>
                            <div className="py-4">
                                <label className="text-sm font-medium mb-1 block">Amount (₹)</label>
                                <Input
                                    type="number"
                                    placeholder="e.g. 500"
                                    value={amountInput}
                                    onChange={(e) => setAmountInput(e.target.value)}
                                    min="1"
                                />
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setAddMoneyOpen(false)}>Cancel</Button>
                                <Button onClick={handleAddMoney} disabled={!amountInput} className="bg-green-600 hover:bg-green-700">
                                    Proceed to Razorpay
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={withdrawOpen} onOpenChange={(open) => { setWithdrawOpen(open); if (!open) setAmountInput(""); }}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
                                <Minus className="mr-2 h-4 w-4" /> Withdraw
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Withdraw Funds</DialogTitle>
                            </DialogHeader>
                            <div className="py-4">
                                <div className="mb-4 text-sm text-muted-foreground">
                                    Available Balance: <span className="font-bold text-foreground">₹{balance?.availableBalance?.toFixed(2) || '0.00'}</span>
                                </div>
                                <label className="text-sm font-medium mb-1 block">Amount (₹)</label>
                                <Input
                                    type="number"
                                    placeholder="e.g. 500"
                                    value={amountInput}
                                    onChange={(e) => setAmountInput(e.target.value)}
                                    max={balance?.availableBalance}
                                    min="1"
                                />
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setWithdrawOpen(false)}>Cancel</Button>
                                <Button onClick={handleWithdraw} disabled={!amountInput} className="bg-red-600 hover:bg-red-700 text-white">
                                    Withdraw via Razorpay
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{balance?.availableBalance?.toFixed(2) || '0.00'}</div>
                        <p className="text-xs text-muted-foreground">Current funds available for payout</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Lifetime Earnings</CardTitle>
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{balance?.totalEarnings?.toFixed(2) || '0.00'}</div>
                        <p className="text-xs text-muted-foreground">Total order value processed</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No transactions found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                transactions.map((tx) => (
                                    <TableRow key={tx._id}>
                                        <TableCell>{new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString()}</TableCell>
                                        <TableCell>
                                            {tx.description?.toLowerCase().includes('refund') ? (
                                                <span className="text-muted-foreground">-</span>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    {tx.type === 'earning' ? (
                                                        <ArrowDownLeft className="h-4 w-4 text-green-500 shrink-0" />
                                                    ) : (
                                                        <ArrowUpRight className="h-4 w-4 text-red-500 shrink-0" />
                                                    )}
                                                    <div className="flex flex-col">
                                                        <span className="capitalize font-medium">{tx.type}</span>
                                                        {tx.paymentMethod && (
                                                            <span className="text-[10px] text-muted-foreground uppercase leading-none">
                                                                {tx.paymentMethod === 'cod' ? 'Cash on Delivery' : tx.paymentMethod}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>{tx.description || '-'}</TableCell>
                                        <TableCell className={`text-right font-medium ${tx.type === 'earning' ? 'text-green-600' : 'text-red-600'}`}>
                                            {tx.type === 'earning' ? '+' : '-'}₹{Math.abs(tx.amount).toFixed(2)}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs ${tx.status === 'success' ? 'bg-green-100 text-green-800' :
                                                tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                {tx.status}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <PaymentProcessingModal
                isOpen={showPaymentModal}
                onClose={handleClosePaymentModal}
                status={paymentStatus}
                amount={amountInput}
                type={paymentType}
                payoutId={transactionId}
                errorMessage={paymentError}
            />
        </div>
    );
};

export default AdminEarnings;
