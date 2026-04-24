import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { DollarSign, TrendingUp, CreditCard, Wallet, AlertCircle, ArrowRight, Activity, Calendar } from 'lucide-react';
import { PaymentProcessingModal } from '@/components/ui/PaymentProcessingModal';

import { cn } from '@/lib/utils';
import BurgerImg from '@/assets/burger.png';
import IceCreamImg from '@/assets/icecream.png';
import ChineseImg from '@/assets/chinese.png';
import DrinksImg from '@/assets/drinks.png';

interface EarningsStats {
  availableBalance: number;
  totalRevenue: number;
  completedOrders: number;
  avgOrderValue: number;
}

const EarningsPage: React.FC = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState<EarningsStats | null>(null);
  const [loading, setLoading] = useState(true);

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [processingPayout, setProcessingPayout] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [payoutId, setPayoutId] = useState('');

  useEffect(() => {
    if (token) {
      fetchEarnings();
    }
  }, [token]);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      const API_ORIGIN = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const API_BASE_URL = typeof API_ORIGIN === 'string' && API_ORIGIN.endsWith('/api') ? API_ORIGIN : `${API_ORIGIN}/api`;

      const response = await fetch(`${API_BASE_URL}/owners/earnings`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    setError('');
    setSuccessMsg('');

    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (stats && parseFloat(withdrawAmount) > stats.availableBalance) {
      setError(`Insufficient balance. Max withdrawable: ${formatCurrency(stats.availableBalance)}`);
      return;
    }

    setShowPaymentModal(true);
    setPaymentStatus('processing');
    setProcessingPayout(true);

    try {
      // Fake delay for animation (2 seconds)
      await new Promise(resolve => setTimeout(resolve, 2000));

      const API_ORIGIN = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const API_BASE_URL = typeof API_ORIGIN === 'string' && API_ORIGIN.endsWith('/api') ? API_ORIGIN : `${API_ORIGIN}/api`;

      const response = await fetch(`${API_BASE_URL}/owners/payout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(withdrawAmount),
          method: 'razorpay_payout'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Withdrawal failed');
      }

      setPaymentStatus('success');
      setPayoutId(data.payout.razorpayPayoutId);
      setSuccessMsg(`Success! Payout ID: ${data.payout.razorpayPayoutId}`);

      // Clear amount after close
      // setWithdrawAmount('');
      fetchEarnings(); // Refresh balance
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
      setWithdrawAmount('');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 font-medium">Loading your earnings...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
        <div className="text-center text-red-500 bg-red-50 p-6 rounded-xl border border-red-100 max-w-md w-full">
          <AlertCircle className="w-10 h-10 mx-auto mb-3" />
          <h3 className="font-semibold text-lg">Unable to load data</h3>
          <p className="text-sm opacity-90 mt-1">Please check your connection and try again.</p>
          <Button variant="outline" className="mt-4 border-red-200 hover:bg-red-100 hover:text-red-600" onClick={fetchEarnings}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 lg:p-10 space-y-10 relative overflow-hidden">
      {/* Floating Background Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.img
          src={BurgerImg}
          alt="Floating Burger"
          initial={{ opacity: 0, x: -100, y: 100, rotate: -20 }}
          animate={{
            opacity: 0.15,
            x: [0, 50, 0],
            y: [0, -30, 0],
            rotate: [-20, 0, -20]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-20 left-10 w-32 h-32 object-contain"
        />
        <motion.img
          src={IceCreamImg}
          alt="Floating Ice Cream"
          initial={{ opacity: 0, x: 100, y: -100, rotate: 15 }}
          animate={{
            opacity: 0.1,
            x: [0, -40, 0],
            y: [0, 50, 0],
            rotate: [15, 30, 15]
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute top-40 right-20 w-24 h-24 object-contain"
        />
        <motion.img
          src={ChineseImg}
          alt="Floating Chinese Food"
          initial={{ opacity: 0, y: 100, rotate: -10 }}
          animate={{
            opacity: 0.12,
            y: [0, -60, 0],
            rotate: [-10, 10, -10]
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 5
          }}
          className="absolute bottom-20 left-1/4 w-40 h-40 object-contain"
        />
        <motion.img
          src={DrinksImg}
          alt="Floating Drinks"
          initial={{ opacity: 0, x: 100, y: 100 }}
          animate={{
            opacity: 0.08,
            x: [0, -30, 0],
            y: [0, -40, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-40 right-10 w-28 h-28 object-contain"
        />
        {/* Additional decorative shapes */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4"
      >
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Earnings Overview</h1>
          <p className="text-slate-500 mt-2 text-lg">Track your revenue streams and manage payouts efficiently.</p>
        </div>
        <div className="hidden md:block text-right">
          <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Current Period</p>
          <p className="text-slate-700 font-semibold flex items-center justify-end gap-2">
            <Calendar className="w-4 h-4" />
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <motion.div variants={item}>
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white ring-1 ring-slate-100 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <DollarSign className="w-24 h-24 -mr-4 -mt-4 text-emerald-600" />
            </div>
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Owner Earnings</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-slate-900">{formatCurrency(stats.totalRevenue)}</span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <TrendingUp className="w-3 h-3 mr-1" /> Lifetime
                </span>
                <p className="text-xs text-slate-400">Gross earnings</p>
              </div>
            </CardContent>
            <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-400 absolute bottom-0 left-0" />
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white ring-1 ring-slate-100 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Activity className="w-24 h-24 -mr-4 -mt-4 text-blue-600" />
            </div>
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Completed Orders</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-slate-900">{stats.completedOrders}</span>
                <span className="text-sm font-medium text-slate-400">orders</span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className="flex items-center text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  Success
                </span>
                <p className="text-xs text-slate-400">Delivered successfully</p>
              </div>
            </CardContent>
            <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-indigo-400 absolute bottom-0 left-0" />
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white ring-1 ring-slate-100 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <CreditCard className="w-24 h-24 -mr-4 -mt-4 text-purple-600" />
            </div>
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Avg. Order Value</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-slate-900">{formatCurrency(stats.avgOrderValue)}</span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className="flex items-center text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                  AOV
                </span>
                <p className="text-xs text-slate-400">Per delivered order</p>
              </div>
            </CardContent>
            <div className="h-1 w-full bg-gradient-to-r from-purple-500 to-pink-400 absolute bottom-0 left-0" />
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="border-0 shadow-xl shadow-emerald-500/10 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300 bg-gradient-to-br from-emerald-600 to-teal-700 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-20">
              <Wallet className="w-24 h-24 -mr-4 -mt-4 text-white" />
            </div>
            <div className="absolute bottom-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-emerald-100 uppercase tracking-wider flex items-center gap-2">
                Available Balance
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white tracking-tight">{formatCurrency(stats.availableBalance)}</span>
              </div>
              <div className="flex items-center gap-2 mt-4 text-emerald-100">
                <div className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></div>
                <p className="text-xs font-medium">Ready for instant withdrawal</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Main Action Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        {/* Withdrawal Form */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-lg bg-white overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-6">
              <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-slate-500" />
                Withdraw Funds
              </CardTitle>
              <CardDescription>
                Transfer your available earnings directly to your bank account via Razorpay.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="max-w-xl">
                <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100 mb-6 flex items-start gap-3">
                  <div className="p-2 bg-white rounded-full shadow-sm">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-900 text-sm">Secure Payouts</h4>
                    <p className="text-xs text-blue-700 mt-1">Your payout will be processed securely. Funds typically reflect within 24 hours.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Withdrawal Amount</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-slate-400 font-medium text-lg">₹</span>
                      <input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-lg font-medium placeholder:text-slate-300 shadow-sm"
                        placeholder="0.00"
                        max={stats.availableBalance}
                      />
                      <div className="absolute right-4 top-3.5 text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded">
                        INR
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2 px-1">
                      <p className="text-xs text-slate-500">
                        Available: <span className="font-semibold text-emerald-600">{formatCurrency(stats.availableBalance)}</span>
                      </p>
                      <button
                        onClick={() => setWithdrawAmount(stats.availableBalance.toString())}
                        className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                      >
                        Max Amount
                      </button>
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-red-50 text-red-600 p-4 rounded-lg text-sm flex items-center gap-3 border border-red-100"
                    >
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      {error}
                    </motion.div>
                  )}

                  {successMsg && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-emerald-50 text-emerald-600 p-4 rounded-lg text-sm font-medium border border-emerald-100 flex items-center gap-3"
                    >
                      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">✓</div>
                      {successMsg}
                    </motion.div>
                  )}

                  <Button
                    onClick={handleWithdraw}
                    disabled={processingPayout || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                    className={cn(
                      "w-full py-6 text-lg font-bold shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.01] active:scale-[0.99]",
                      processingPayout ? "bg-slate-300" : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                    )}
                  >
                    {processingPayout ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        Withdraw via Razorpay <ArrowRight className="w-5 h-5" />
                      </div>
                    )}
                  </Button>

                  <p className="text-xs text-center text-slate-400">
                    * This is currently running in Test Mode. No actual funds will be deducted.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info / Promo Section */}
        <div className="hidden lg:block">
          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-8 text-white h-full relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-500/20 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>

            <h3 className="text-xl font-bold mb-4 relative z-10 flex items-center gap-2">
              <span className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">💡</span> Pro Tip
            </h3>
            <p className="text-orange-50 mb-8 leading-relaxed relative z-10 font-medium opacity-90">
              Did you know? Consistent deliveries increase your restaurant rating, leading to higher visibility and more orders.
            </p>

            <div className="space-y-4 relative z-10">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm hover:bg-white/20 transition-colors">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-orange-600 font-bold text-sm shadow-sm">
                  1
                </div>
                <p className="text-sm font-semibold text-white">Complete orders on time</p>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm hover:bg-white/20 transition-colors">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-orange-600 font-bold text-sm shadow-sm">
                  2
                </div>
                <p className="text-sm font-semibold text-white">Maintain high food quality</p>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm hover:bg-white/20 transition-colors">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-orange-600 font-bold text-sm shadow-sm">
                  3
                </div>
                <p className="text-sm font-semibold text-white">Get positive reviews</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <PaymentProcessingModal
        isOpen={showPaymentModal}
        onClose={handleClosePaymentModal}
        status={paymentStatus}
        amount={withdrawAmount}
        payoutId={payoutId}
        errorMessage={error}
      />
    </div>
  );
};

export default EarningsPage;
