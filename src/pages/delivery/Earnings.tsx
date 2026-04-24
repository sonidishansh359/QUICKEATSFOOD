import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { TrendingUp, DollarSign, Package, Calendar, Clock, Wallet, AlertCircle, IndianRupee } from 'lucide-react';
import { PaymentProcessingModal } from '@/components/ui/PaymentProcessingModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DeliveryLayout } from '@/components/delivery/DeliveryLayout';
import { useDeliveryData } from '@/contexts/DeliveryDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export default function DeliveryEarnings() {
  const { earnings, profile, deliveryHistory } = useDeliveryData();
  const { token } = useAuth();
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Withdrawal State
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [processingPayout, setProcessingPayout] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [payoutId, setPayoutId] = useState('');

  // Available Balance
  const availableBalance = (profile as any).availableBalance || 0;

  const handleWithdraw = async () => {
    setError('');
    setSuccessMsg('');

    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (parseFloat(withdrawAmount) > availableBalance) {
      setError(`Insufficient balance. Max withdrawable: ₹${availableBalance.toFixed(2)}`);
      return;
    }

    setShowPaymentModal(true);
    setPaymentStatus('processing');
    setProcessingPayout(true);

    try {
      // Fake delay for animation
      await new Promise(resolve => setTimeout(resolve, 2000));

      const API_ORIGIN = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const API_BASE_URL = typeof API_ORIGIN === 'string' && API_ORIGIN.endsWith('/api') ? API_ORIGIN : `${API_ORIGIN}/api`;

      const response = await fetch(`${API_BASE_URL}/delivery-boys/payout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(withdrawAmount)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Withdrawal failed');
      }

      setPaymentStatus('success');
      setPayoutId(data.payout.razorpayPayoutId);
      setSuccessMsg(`Success! Payout ID: ${data.payout.razorpayPayoutId}`);

      // window.location.reload(); // Don't reload immediately, let user see success
      // fetchEarnings(); // If available in this component? yes 'earnings' from context is used, might need context refresh
    } catch (err: any) {
      setPaymentStatus('error');
      setError(err.message || 'Failed to process withdrawal');
    } finally {
      setProcessingPayout(false);
    }
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setPaymentStatus('idle');
    setPayoutId('');
    if (paymentStatus === 'success') {
      window.location.reload(); // Reload on close for delivery boy to refresh context strictly
    }
  };

  return (
    <DeliveryLayout>
      <Helmet>
        <title>Earnings | QuickEats Delivery</title>
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Earnings & Payouts</h1>
          <p className="text-muted-foreground mt-1">
            Track your earnings and manage withdrawals
          </p>
        </div>

        {/* Summary Cards - Grid of 5 now including Balance */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* New Available Balance Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="sm:col-span-2 lg:col-span-1"
          >
            <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white border-0 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Wallet className="w-24 h-24" />
              </div>
              <CardContent className="p-6 relative z-10">
                <div className="flex flex-col h-full justify-between">
                  <div>
                    <p className="text-sm font-medium opacity-90">Available Balance</p>
                    <p className="text-3xl font-bold mt-2">₹{availableBalance.toFixed(2)}</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/20 flex items-center gap-2">
                    <p className="text-xs opacity-90">Ready for withdrawal</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Today</p>
                    <p className="text-2xl font-bold mt-1">₹{earnings.today.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{earnings.todayOrders} deliveries</p>
                  </div>
                  <div className="p-3 rounded-xl bg-green-500/10">
                    <IndianRupee className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">This Week</p>
                    <p className="text-2xl font-bold mt-1">₹{earnings.thisWeek.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{earnings.weeklyOrders} deliveries</p>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-500/10">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">This Month</p>
                    <p className="text-2xl font-bold mt-1">₹{earnings.thisMonth.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{earnings.monthlyOrders} deliveries</p>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-500/10">
                    <Calendar className="w-5 h-5 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold mt-1">₹{earnings.pending.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Processing</p>
                  </div>
                  <div className="p-3 rounded-xl bg-orange-500/10">
                    <Package className="w-5 h-5 text-orange-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Replaced Weekly Chart with Withdrawal Section */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-slate-500" />
                Withdraw Funds
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-md">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount to Withdraw</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400">₹</span>
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="0.00"
                      max={availableBalance}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Max available: ₹{availableBalance.toFixed(2)}
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-center gap-2 mb-4">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                {successMsg && (
                  <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm font-medium mb-4">
                    {successMsg}
                  </div>
                )}

                <Button
                  onClick={handleWithdraw}
                  disabled={processingPayout || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  {processingPayout ? 'Processing...' : 'Withdraw via Razorpay'}
                </Button>

                <p className="text-xs text-center text-slate-400 mt-3">
                  * Test Mode: No real money will be transferred.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats (Performance) - Kept As Is */}
          <Card>
            <CardHeader>
              <CardTitle>Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Package className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Total Deliveries</p>
                    <p className="text-xs text-muted-foreground">All time</p>
                  </div>
                </div>
                <p className="text-xl font-bold">{profile.totalDeliveries}</p>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/10">
                    <span className="text-sm">⭐</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Rating</p>
                    <p className="text-xs text-muted-foreground">Customer reviews</p>
                  </div>
                </div>
                <p className="text-xl font-bold">{profile.rating}</p>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <DollarSign className="w-4 h-4 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Avg. Per Delivery</p>
                    <p className="text-xs text-muted-foreground">This week</p>
                  </div>
                </div>
                <p className="text-xl font-bold">
                  ₹{earnings.weeklyOrders > 0 ? (earnings.thisWeek / earnings.weeklyOrders).toFixed(2) : '0.00'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Delivery History - Kept As Is */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Delivery History</span>
              <div className="flex gap-2">
                <Badge
                  variant={filterPeriod === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilterPeriod('all')}
                  className="cursor-pointer"
                >
                  All
                </Badge>
                <Badge
                  variant={filterPeriod === 'today' ? 'default' : 'outline'}
                  onClick={() => setFilterPeriod('today')}
                  className="cursor-pointer"
                >
                  Today
                </Badge>
                <Badge
                  variant={filterPeriod === 'week' ? 'default' : 'outline'}
                  onClick={() => setFilterPeriod('week')}
                  className="cursor-pointer"
                >
                  Week
                </Badge>
                <Badge
                  variant={filterPeriod === 'month' ? 'default' : 'outline'}
                  onClick={() => setFilterPeriod('month')}
                  className="cursor-pointer"
                >
                  Month
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deliveryHistory.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
                  <Package className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No deliveries yet</p>
                <p className="text-sm text-muted-foreground mt-1">Your delivery history will appear here</p>
              </div>
            ) : (
              <div>
                {/* Mobile list for small screens */}
                <div className="block lg:hidden space-y-3">
                  {deliveryHistory
                    .filter(delivery => {
                      if (filterPeriod === 'all') return true;
                      const deliveryDate = new Date(delivery.date);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);

                      if (filterPeriod === 'today') return deliveryDate >= today;
                      if (filterPeriod === 'week') {
                        const weekStart = new Date(today);
                        weekStart.setDate(today.getDate() - today.getDay());
                        return deliveryDate >= weekStart;
                      }
                      if (filterPeriod === 'month') {
                        return deliveryDate.getMonth() === today.getMonth() && deliveryDate.getFullYear() === today.getFullYear();
                      }
                      return true;
                    })
                    .map((delivery, idx) => (
                      <div key={idx} className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0">
                            <p className="font-medium text-slate-800">{delivery.restaurantName}</p>
                            <p className="text-sm text-muted-foreground">{new Date(delivery.date).toLocaleDateString('en-IN')}</p>
                            <p className="text-sm text-muted-foreground">{delivery.customerName} • {delivery.items}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600">₹{delivery.earnings.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">{delivery.deliveryTime}m</p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Table for lg+ screens */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold">Date</th>
                        <th className="text-left p-3 font-semibold">Restaurant</th>
                        <th className="text-left p-3 font-semibold">Customer</th>
                        <th className="text-left p-3 font-semibold">Items</th>
                        <th className="text-right p-3 font-semibold">Amount</th>
                        <th className="text-right p-3 font-semibold">Earnings</th>
                        <th className="text-right p-3 font-semibold">Time Taken</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deliveryHistory
                        .filter(delivery => {
                          if (filterPeriod === 'all') return true;
                          const deliveryDate = new Date(delivery.date);
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);

                          if (filterPeriod === 'today') return deliveryDate >= today;
                          if (filterPeriod === 'week') {
                            const weekStart = new Date(today);
                            weekStart.setDate(today.getDate() - today.getDay());
                            return deliveryDate >= weekStart;
                          }
                          if (filterPeriod === 'month') {
                            return deliveryDate.getMonth() === today.getMonth() && deliveryDate.getFullYear() === today.getFullYear();
                          }
                          return true;
                        })
                        .map((delivery, idx) => (
                          <tr key={idx} className="border-b hover:bg-muted/50 transition-colors">
                            <td className="p-3">
                              {new Date(delivery.date).toLocaleDateString('en-IN', {
                                month: 'short',
                                day: 'numeric',
                                year: '2-digit'
                              })}
                            </td>
                            <td className="p-3 font-medium">{delivery.restaurantName}</td>
                            <td className="p-3">{delivery.customerName}</td>
                            <td className="p-3 text-muted-foreground text-xs">{delivery.items}</td>
                            <td className="text-right p-3">₹{delivery.totalAmount.toFixed(2)}</td>
                            <td className="text-right p-3 font-semibold text-green-600">₹{delivery.earnings.toFixed(2)}</td>
                            <td className="text-right p-3 text-muted-foreground flex items-center justify-end gap-1">
                              <Clock className="w-4 h-4" />
                              {delivery.deliveryTime}m
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <PaymentProcessingModal
        isOpen={showPaymentModal}
        onClose={handleClosePaymentModal}
        status={paymentStatus}
        amount={withdrawAmount}
        payoutId={payoutId}
        errorMessage={error}
      />
    </DeliveryLayout >
  );
}