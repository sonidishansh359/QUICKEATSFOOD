import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, MapPin, Clock, ArrowRight, Sparkles, Package, TruckIcon, ChefHat, HeartHandshake, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserOrder } from '@/contexts/UserDataContext';
import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { format } from 'date-fns';

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialOrder = location.state?.order as UserOrder | undefined;
  const [order, setOrder] = useState<UserOrder | undefined>(initialOrder);
  const [orderStatus, setOrderStatus] = useState<string>(initialOrder?.status || 'placed');

  // Socket connection for real-time updates
  useEffect(() => {
    if (!order?.id) return;

    const token = localStorage.getItem('quickeats_auth');
    if (!token) return;

    const socket = io('http://localhost:5000', {
      auth: { token: JSON.parse(token).token }
    });

    socket.emit('joinUserRoom', { userId: JSON.parse(token).user?.id });

    socket.on('orderStatusUpdate', (data) => {
      if (data.orderId === order.id) {
        setOrderStatus(data.status);
        setOrder(prev => prev ? { ...prev, status: data.status } : prev);
      }
    });

    socket.on('deliveryBoyAssigned', (data) => {
      if (data.orderId === order.id) {
        setOrderStatus('out_for_delivery');
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [order?.id]);

  // Format dynamic estimated delivery time
  const getFormattedEstimatedTime = () => {
    if (!order?.estimatedDelivery) return "Calculating...";
    try {
      const now = new Date();
      const maxDeliveryTime = new Date(now.getTime() + 25 * 60 * 1000); // 25 mins from now

      let date = new Date(order.estimatedDelivery);

      // If invalid or in the past, or > 25 mins from now, adjust it
      if (isNaN(date.getTime()) || date.getTime() < now.getTime()) {
        // Use a random time between 15-22 minutes for a realistic "within 25 mins" look
        const randomMins = Math.floor(Math.random() * 8) + 15;
        date = new Date(now.getTime() + randomMins * 60 * 1000);
      } else if (date.getTime() > maxDeliveryTime.getTime()) {
        // Cap at 25 minutes - but maybe 22-24 to be safe "within" 25
        const cappedMins = Math.floor(Math.random() * 3) + 22; // 22, 23, or 24
        date = new Date(now.getTime() + cappedMins * 60 * 1000);
      }

      // Format to "Arriving by 07:45 PM"
      return `Arriving by ${format(date, 'hh:mm a')}`;
    } catch {
      return "15-25 minutes";
    }
  };

  const getStatusMessage = () => {
    switch (orderStatus) {
      case 'placed':
      case 'accepted': return 'Order confirmed by restaurant!';
      case 'preparing': return 'Chef is preparing your food...';
      case 'out_for_delivery': return 'Delivery partner is on the way!';
      case 'delivered': return 'Delivered! Enjoy your meal 😋';
      case 'cancelled': return 'your order is cancelled by the restaurent owner';
      default: return 'Processing order...';
    }
  };

  const statusIndex = ['placed', 'accepted', 'preparing', 'out_for_delivery', 'delivered'].indexOf(orderStatus);
  // Normalize 'accepted' and 'placed' to map to the first node
  const normalizedIndex = statusIndex === 1 ? 0 : statusIndex === 2 ? 1 : statusIndex === 3 ? 2 : statusIndex === 4 ? 3 : 0;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-white">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] bg-orange-200/40 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-pink-200/40 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-purple-200/30 rounded-full blur-[90px]"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
        className="text-center w-full max-w-xl relative z-10"
      >
        {/* Success Icon Animation */}
        <div className="relative inline-flex items-center justify-center w-32 h-32 mb-8 mx-auto group">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
            className={`absolute inset-0 bg-gradient-to-tr ${orderStatus === 'cancelled' ? 'from-red-400 to-rose-600 shadow-[0_0_40px_rgba(244,63,94,0.4)]' : 'from-green-400 to-emerald-600 shadow-[0_0_40px_rgba(52,211,153,0.4)]'} rounded-full`}
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className={`absolute -inset-4 border ${orderStatus === 'cancelled' ? 'border-red-400/30' : 'border-green-400/30'} rounded-full border-dashed`}
          />
          {orderStatus === 'cancelled' ? (
            <XCircle className="w-16 h-16 text-white relative z-10 drop-shadow-md" strokeWidth={2.5} />
          ) : (
            <CheckCircle className="w-16 h-16 text-white relative z-10 drop-shadow-md" strokeWidth={2.5} />
          )}

          {/* Orbiting Sparkles */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ rotate: 360 }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear", delay: i * 1.5 }}
              className="absolute inset-0"
            >
              <Sparkles className="absolute -top-2 left-1/2 w-5 h-5 text-yellow-400 drop-shadow-sm" style={{ transform: 'translateX(-50%)' }} />
            </motion.div>
          ))}
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`text-4xl md:text-5xl font-extrabold tracking-tight ${orderStatus === 'cancelled' ? 'text-red-600' : 'text-gray-900'} mb-3`}
        >
          {orderStatus === 'cancelled' ? 'Order Cancelled' : 'Order Confirmed!'}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-lg text-gray-500 mb-10 font-medium"
        >
          {getStatusMessage()}
        </motion.p>

        {order ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/70 backdrop-blur-xl border border-gray-100 rounded-[2rem] p-6 sm:p-8 mb-8 text-left shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
          >
            {/* Order Header */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100/80">
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-wider font-semibold text-gray-400 mb-1">Order Number</span>
                <span className="font-mono text-lg font-bold text-gray-800 bg-gray-100 px-3 py-1 rounded-md w-fit">
                  #{order.id.slice(-8).toUpperCase()}
                </span>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0">
                <Package className="w-6 h-6 text-orange-500" />
              </div>
            </div>

            {/* Delivery Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50/80 flex items-center justify-center shrink-0 shadow-sm border border-blue-100/50">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex flex-col pt-1">
                  <span className="text-sm font-semibold text-gray-500 mb-0.5">Estimated Arrival</span>
                  <span className="font-bold text-gray-900 text-lg tracking-tight">{getFormattedEstimatedTime()}</span>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50/80 flex items-center justify-center shrink-0 shadow-sm border border-indigo-100/50">
                  <MapPin className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="flex flex-col pt-1">
                  <span className="text-sm font-semibold text-gray-500 mb-0.5">Delivering to</span>
                  <span className="font-medium text-gray-800 text-sm leading-snug line-clamp-2">
                    {order.deliveryAddress}
                  </span>
                </div>
              </div>
            </div>

            {/* Modern Status Timeline */}
            <div className="relative pt-6 mt-4 border-t border-gray-100 pb-2">
              {/* Connecting Line Base */}
              <div className="absolute top-[42px] left-[12%] right-[12%] h-1 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-green-400 via-orange-400 to-blue-500"
                  initial={{ width: "0%" }}
                  animate={{ width: `${(normalizedIndex / 3) * 100}%` }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                />
              </div>

              <div className="flex justify-between items-start relative z-10 w-full px-1">
                {[
                  { id: 'placed', icon: CheckCircle, label: 'Confirmed', color: 'green' },
                  { id: 'preparing', icon: ChefHat, label: 'Preparing', color: 'orange' },
                  { id: 'out_for_delivery', icon: TruckIcon, label: 'On the way', color: 'blue' },
                  { id: 'delivered', icon: HeartHandshake, label: 'Delivered', color: 'purple' }
                ].map((step, idx) => {
                  const isActive = normalizedIndex >= idx;
                  const isCurrent = normalizedIndex === idx;
                  const Icon = step.icon;

                  const getBgColor = () => {
                    if (!isActive) return 'bg-white border-2 border-gray-200';
                    if (step.color === 'green') return 'bg-green-500 border-2 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]';
                    if (step.color === 'orange') return 'bg-orange-500 border-2 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]';
                    if (step.color === 'blue') return 'bg-blue-500 border-2 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]';
                    return 'bg-purple-500 border-2 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]';
                  };

                  const getTextColor = () => {
                    if (isCurrent) {
                      if (step.color === 'green') return 'text-green-600 font-bold';
                      if (step.color === 'orange') return 'text-orange-600 font-bold';
                      if (step.color === 'blue') return 'text-blue-600 font-bold';
                      return 'text-purple-600 font-bold';
                    }
                    return isActive ? 'text-gray-800 font-medium' : 'text-gray-400';
                  };

                  return (
                    <div key={step.id} className="flex flex-col items-center w-1/4 relative">
                      <motion.div
                        animate={isCurrent ? { scale: [1, 1.15, 1], y: [0, -3, 0] } : {}}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-colors duration-500 relative z-20 ${getBgColor()}`}
                      >
                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-300'}`} />
                        {isCurrent && (
                          <motion.div
                            animate={{ scale: [1, 1.8], opacity: [0.5, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="absolute inset-0 rounded-full bg-current opacity-20 pointer-events-none"
                          />
                        )}
                      </motion.div>
                      <span className={`text-[11px] sm:text-xs text-center transition-colors duration-300 ${getTextColor()}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Summary Foldable Section */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-4 h-4 text-orange-500" />
                Order Summary
              </h3>

              <div className="space-y-3 mb-4 max-h-[150px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="font-medium text-gray-800 whitespace-nowrap bg-gray-100 px-2 py-0.5 rounded text-xs">{item.quantity}x</span>
                      <span className="text-gray-600 truncate">{item.name}</span>
                    </div>
                    <span className="font-medium text-gray-900 ml-4 shrink-0">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex flex-col items-end border-t border-gray-100/80 mt-2 space-y-2">
                {order.subtotal != null && (
                  <div className="flex justify-between w-full text-sm text-gray-500">
                    <span>Subtotal</span>
                    <span className="font-medium text-gray-800">₹{Number(order.subtotal).toFixed(2)}</span>
                  </div>
                )}
                {order.taxAmount != null && order.taxAmount > 0 && (
                  <div className="flex justify-between w-full text-sm text-gray-500">
                    <span>GST & Handling</span>
                    <span className="font-medium text-gray-800">₹{Number(order.taxAmount).toFixed(2)}</span>
                  </div>
                )}
                {order.discountAmount != null && order.discountAmount > 0 && (
                  <div className="flex justify-between w-full text-sm text-green-600">
                    <span>Promo Discount</span>
                    <span className="font-medium">-₹{Number(order.discountAmount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between w-full text-sm text-gray-500">
                  <span>Payment Method</span>
                  <span className="uppercase font-medium text-gray-800">{order.paymentMethod}</span>
                </div>
                <div className="flex justify-between w-full text-base font-bold text-gray-900 mt-2 pt-2 border-t border-gray-100">
                  <span>Total Paid</span>
                  <span className="text-xl text-green-600">₹{Number(order.totalAmount).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ) : orderStatus === 'cancelled' ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 mb-8 text-center text-red-600 shadow-sm flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">❌</span>
            </div>
            <h2 className="text-xl font-bold">Order Cancelled</h2>
            <p>your order is cancelled by the restaurent owner</p>
          </div>
        ) : (
          <div className="bg-white border rounded-2xl p-8 mb-8 text-center text-gray-500 shadow-sm">
            Fetching order details...
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto flex-1">
            <Button
              onClick={() => navigate(order?.id ? `/user/tracking/${order.id}` : '/user/orders')}
              className="w-full group h-14 bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all font-semibold text-lg"
            >
              Track Order Live
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => navigate('/user/dashboard')}
              className="w-full h-14 bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-semibold text-lg px-8 transition-colors"
            >
              Home
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
