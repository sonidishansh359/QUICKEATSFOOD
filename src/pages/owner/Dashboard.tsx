import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { StatCard, PageHeader } from '@/components/owner/DashboardComponents';
import { useOwnerData } from '@/contexts/OwnerDataContext';
import { ShoppingCart, IndianRupee, Clock, Package, Store, UtensilsCrossed, Wallet, Plus, CheckCircle, ChefHat, Truck, X, MapPin, Phone, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { useNavigate } from 'react-router-dom';
import { OrderStatus } from '@/types/auth';
import { AutoLocationStatus } from '@/components/location/AutoLocationStatus';
import { OwnerReportModal } from '@/components/owner/OwnerReportModal';
import BurgerImg from '@/assets/burger.png';
import IceCreamImg from '@/assets/icecream.png';
import ChineseImg from '@/assets/chinese.png';
import DrinksImg from '@/assets/drinks.png';
import { cn } from '@/lib/utils';

const Dashboard: React.FC = () => {
  const { restaurant, orders, menuItems, getTodayStats, updateOrderStatus, loading, deliveryBoys, earnings } = useOwnerData();
  const navigate = useNavigate();

  const [isReportOpen, setIsReportOpen] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'placed':
        return { icon: Clock, color: 'text-orange-600', bgColor: 'bg-orange-100', borderColor: 'border-orange-200' };
      case 'accepted':
        return { icon: CheckCircle, color: 'text-blue-600', bgColor: 'bg-blue-100', borderColor: 'border-blue-200' };
      case 'preparing':
        return { icon: ChefHat, color: 'text-yellow-600', bgColor: 'bg-yellow-100', borderColor: 'border-yellow-200' };
      case 'out_for_delivery':
        return { icon: Truck, color: 'text-purple-600', bgColor: 'bg-purple-100', borderColor: 'border-purple-200' };
      case 'delivered':
        return { icon: CheckCircle, color: 'text-emerald-600', bgColor: 'bg-emerald-100', borderColor: 'border-emerald-200' };
      case 'cancelled':
        return { icon: X, color: 'text-red-600', bgColor: 'bg-red-100', borderColor: 'border-red-200' };
      default:
        return { icon: Clock, color: 'text-gray-600', bgColor: 'bg-gray-100', borderColor: 'border-gray-200' };
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus as OrderStatus);
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };



  if (!restaurant) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 relative overflow-hidden">
        {/* Floating Background Effects */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.img
            src={BurgerImg}
            animate={{ y: [0, -20, 0], rotate: [-5, 5, -5] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-20 left-10 w-32 h-32 opacity-10"
          />
          <motion.img
            src={IceCreamImg}
            animate={{ y: [0, 20, 0], rotate: [5, -5, 5] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-20 right-10 w-28 h-28 opacity-10"
          />
        </div>

        <div className="text-center relative z-10 max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Store className="w-10 h-10 text-orange-600" />
          </div>
          <h2 className="text-3xl font-bold mb-3 text-slate-800">Welcome to QuickEats!</h2>
          <p className="text-slate-500 mb-8 text-lg">It looks like you don't have a restaurant yet.<br />Let's get your business set up.</p>
          <Button onClick={() => navigate('/owner/restaurant')} className="h-12 px-8 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl shadow-xl shadow-orange-500/20 hover:scale-105 transition-transform">
            <Plus className="mr-2 h-5 w-5" />
            Create Restaurant
          </Button>
        </div>
      </div>
    );
  }

  const todayStats = getTodayStats();
  // Only count out_for_delivery and delivered orders in total revenue (Owner's share)
  const totalRevenue = orders
    .filter(order => order.status === 'out_for_delivery' || order.status === 'delivered')
    .reduce((sum, order) => sum + (order.ownerEarning || order.totalAmount * 0.85), 0);
  const totalOrders = orders.length;
  const activeMenuItems = menuItems.filter(item => item.isAvailable).length;

  // Format currency as INR
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
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };


  return (
    <div className="min-h-screen bg-slate-50/50 p-6 lg:p-10 space-y-8 relative overflow-hidden">
      {/* Floating Background Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">

        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 space-y-8"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
            <p className="text-slate-500 mt-2 text-lg">Welcome back, <span className="font-semibold text-slate-800">{restaurant?.name}</span>!</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Compact Location Display */}
            <AutoLocationStatus cityOnly={true} />

            <Button
              variant="outline"
              className="h-11 border-slate-200 hover:bg-slate-50 text-slate-700"
              onClick={() => setIsReportOpen(true)}
            >
              <BarChart2 className="w-4 h-4 mr-2" /> Export Reports
            </Button>

            <Button variant="outline" className="h-11 border-slate-200 hover:bg-white/80 backdrop-blur-sm" onClick={() => navigate('/owner/orders')}>
              <Clock className="w-4 h-4 mr-2" /> Live Orders
            </Button>
            <Button className="h-11 bg-slate-900 text-white hover:bg-slate-800 shadow-md" onClick={() => navigate('/owner/menu')}>
              <Plus className="w-4 h-4 mr-2" /> Add Menu Item
            </Button>
          </div>
        </div>

        {/* Owner Report Modal */}
        <OwnerReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div variants={item}>
            <StatCard
              title="Today's Orders"
              value={todayStats.orders}
              icon={ShoppingCart}
              trend={{ value: 12, isPositive: true }}
              gradient="from-blue-500 to-indigo-600"
              iconColor="text-white"
            />
          </motion.div>

          <motion.div variants={item}>
            <StatCard
              title="Today's Earnings"
              value={formatCurrency(todayStats.revenue)}
              icon={IndianRupee}
              trend={{ value: 8, isPositive: true }}
              gradient="from-emerald-500 to-teal-600"
              iconColor="text-white"
            />
          </motion.div>

          <motion.div variants={item}>
            <StatCard
              title="Total Earnings"
              value={formatCurrency(totalRevenue)}
              icon={Wallet}
              gradient="from-violet-500 to-purple-600"
              iconColor="text-white"
            />
          </motion.div>

          <motion.div variants={item}>
            <StatCard
              title="Active Menu Items"
              value={activeMenuItems}
              icon={UtensilsCrossed}
              imageSrc={BurgerImg}
              gradient="from-orange-500 to-pink-600"
              iconColor="text-white"
            />
          </motion.div>
        </div>

        {/* Earnings & Payout Card - Glassmorphism */}
        <motion.div variants={item}>
          <Card className="border-0 shadow-xl shadow-emerald-500/10 overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-600 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity" />
            <div className="absolute -right-20 -top-20 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/15 transition-colors" />
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
                <div>
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2.5 rounded-xl bg-emerald-100/50 text-emerald-600">
                      <Wallet className="w-6 h-6" />
                    </div>
                    Available Balance
                  </CardTitle>
                  <p className="text-sm text-slate-500 mt-1 ml-14">Earnings from completed deliveries ready for payout</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pt-2">
                <div className="ml-1">
                  <p className="text-4xl md:text-5xl font-bold text-slate-800 tracking-tight mb-3">
                    {formatCurrency(earnings)}
                  </p>
                  <div className="flex gap-6 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      Today: <span className="font-semibold text-slate-800">{formatCurrency(todayStats.revenue)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      Completed: <span className="font-semibold text-slate-800">{orders.filter(o => o.status === 'delivered').length}</span>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => navigate('/owner/earnings')}
                  className="h-14 px-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 rounded-xl text-lg hover:scale-[1.02] transition-all"
                >
                  <Wallet className="w-5 h-5 mr-2.5" />
                  Withdraw Funds
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Order Status Tracking */}
        <motion.div variants={item}>
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                    <MapPin className="w-5 h-5" />
                  </div>
                  Order Status Tracking
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => navigate('/owner/orders')} className="text-slate-600">
                  View All Orders
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Package className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium">No orders to track</p>
                  <p className="text-sm text-slate-400 mt-1">When customers place orders, their status will appear here.</p>
                </div>
              ) : (
                <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {orders.map((order) => {
                    const allStatuses = ['placed', 'accepted', 'preparing', 'out_for_delivery', 'delivered'];
                    const isCancelled = order.status === 'cancelled';

                    const currentStatusIndex = isCancelled ? -1 : allStatuses.indexOf(order.status);

                    return (
                      <div key={order.id} className="p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-bold text-slate-800">Order #{order.id.slice(-6).toUpperCase()}</h3>
                              <Badge variant={isCancelled ? "destructive" : "secondary"} className={
                                isCancelled ? "bg-red-100 text-red-700 hover:bg-red-100" : "bg-blue-100 text-blue-700 hover:bg-blue-100"
                              }>
                                {isCancelled ? 'Cancelled' : order.status.replace(/_/g, ' ').toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-500">Customer: <span className="font-medium text-slate-700">{order.customerName}</span> • Earning: <span className="font-medium text-slate-700">{formatCurrency(order.ownerEarning || order.totalAmount * 0.85)}</span></p>
                          </div>

                          {/* Action Select removed */}
                        </div>

                        {/* Progress Stepper */}
                        {!isCancelled && (
                          <div className="relative mt-8 px-2 sm:px-6">
                            <div className="absolute top-5 left-0 w-full h-1 bg-slate-200 rounded-full" />
                            <div
                              className="absolute top-5 left-0 h-1 bg-emerald-500 rounded-full transition-all duration-500"
                              style={{ width: `${Math.max(0, (currentStatusIndex / (allStatuses.length - 1)) * 100)}%` }}
                            />

                            <div className="relative flex justify-between">
                              {allStatuses.map((status, index) => {
                                const isCompleted = index <= currentStatusIndex;
                                const isActive = index === currentStatusIndex;

                                const StepIcon =
                                  status === 'placed' ? Clock :
                                    status === 'accepted' ? CheckCircle :
                                      status === 'preparing' ? ChefHat :
                                        status === 'out_for_delivery' ? Truck :
                                          MapPin;

                                return (
                                  <div key={status} className="flex flex-col items-center gap-2">
                                    <div className={cn(
                                      "w-10 h-10 rounded-full flex items-center justify-center relative z-10 transition-all duration-300",
                                      isCompleted ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" : "bg-white text-slate-400 border-2 border-slate-200"
                                    )}>
                                      <StepIcon className={cn("w-5 h-5", isActive && "animate-pulse")} />
                                    </div>
                                    <span className={cn(
                                      "text-[10px] sm:text-xs font-medium text-center max-w-[70px] leading-tight",
                                      isActive ? "text-emerald-700 font-bold" : (isCompleted ? "text-slate-700" : "text-slate-400")
                                    )}>
                                      {status.replace(/_/g, ' ')}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Assigned Delivery Boy Details */}
                        {order.deliveryBoyId && (() => {
                          const assignedDb = deliveryBoys.find((db: any) => db._id === order.deliveryBoyId || db.id === order.deliveryBoyId);
                          if (!assignedDb) return null;
                          return (
                            <div className="mt-6 pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 shadow-inner">
                                  <Truck className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-800">{assignedDb.user?.name || assignedDb.name || 'Delivery Partner'}</p>
                                  <p className="text-xs text-slate-500 font-medium">Assigned Delivery</p>
                                </div>
                              </div>
                              <a
                                href={`tel:${assignedDb.user?.phone || assignedDb.phone || ''}`}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-full text-sm font-bold transition-colors shadow-sm"
                              >
                                <Phone className="w-4 h-4" />
                                Call Partner
                              </a>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
