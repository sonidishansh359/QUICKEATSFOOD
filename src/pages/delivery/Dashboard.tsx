import React from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
  Package,
  TrendingUp,
  Clock,
  MapPin,
  Navigation,
  IndianRupee,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DeliveryLayout } from '@/components/delivery/DeliveryLayout';
import { useDeliveryData } from '@/contexts/DeliveryDataContext';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { AutoLocationStatus } from '@/components/location/AutoLocationStatus';
import { DeliveryWelcomeModal } from '@/components/delivery/DeliveryWelcomeModal';
import { DeliveryReportModal } from '@/components/delivery/DeliveryReportModal';
import { FileText } from 'lucide-react';

export default function DeliveryDashboard() {
  const { profile, orders, activeOrder, earnings, acceptOrder } = useDeliveryData();
  const navigate = useNavigate();
  const [showWelcomeModal, setShowWelcomeModal] = React.useState(false);
  const [showReportModal, setShowReportModal] = React.useState(false);

  React.useEffect(() => {
    // Check if the user has seen the welcome modal before
    const userId = profile.phone || profile.email || 'unknown';
    const hasSeenModal = localStorage.getItem(`has_seen_welcome_modal_${userId}`);

    // Check if they just signed up (account created within the last 5 minutes)
    const isNewSignup = () => {
      if (!profile.joinedDate) return false;

      // The initially seeded joinedDate is just 'YYYY-MM-DD', which parses to midnight
      // But the backend will return the full ISO string with time after it loads
      const joinDate = new Date(profile.joinedDate);
      const now = new Date();
      const diffInMinutes = (now.getTime() - joinDate.getTime()) / (1000 * 60);

      // True if the account was created less than 5 minutes ago
      return diffInMinutes >= 0 && diffInMinutes < 5;
    };

    // We'll use totalDeliveries === 0 and the fresh joinedDate to know it's a recent signup
    if (!hasSeenModal && profile.totalDeliveries === 0 && userId !== 'unknown' && isNewSignup()) {
      setShowWelcomeModal(true);
    }
  }, [profile.phone, profile.email, profile.totalDeliveries, profile.joinedDate]);

  const handleCloseWelcomeModal = () => {
    setShowWelcomeModal(false);
    const userId = profile.phone || profile.email || 'unknown';
    localStorage.setItem(`has_seen_welcome_modal_${userId}`, 'true');
  };

  const stats = [
    {
      title: "Today's Earnings",
      value: `₹${earnings.today.toFixed(2)}`,
      subtitle: `${earnings.todayOrders} deliveries`,
      icon: IndianRupee,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Weekly Earnings',
      value: `₹${earnings.thisWeek.toFixed(2)}`,
      subtitle: `${earnings.weeklyOrders} deliveries`,
      icon: IndianRupee,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Available Orders',
      value: orders.length.toString(),
      subtitle: 'Ready for pickup',
      icon: Package,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: 'Total Deliveries',
      value: profile.totalDeliveries.toString(),
      subtitle: `Rating: ⭐ ${profile.rating}`,
      icon: Navigation,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ];



  return (
    <DeliveryLayout>
      <Helmet>
        <title>Delivery Dashboard | QuickEats</title>
      </Helmet>

      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome back, {profile.name}!
            </h1>
            <p className="text-muted-foreground mt-1">
              {profile.isOnline
                ? "You're online and receiving orders"
                : "Go online to start receiving orders"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!profile.isOnline && (
              <Badge variant="secondary" className="w-fit">
                Currently Offline
              </Badge>
            )}
            <Button variant="outline" onClick={() => setShowReportModal(true)} className="hidden sm:flex items-center gap-2 border-orange-200 text-orange-700 hover:bg-orange-50">
              <FileText className="w-4 h-4" />
              Export Report
            </Button>
          </div>
          {/* Mobile report button */}
          <Button variant="outline" onClick={() => setShowReportModal(true)} className="sm:hidden w-full flex items-center gap-2 border-orange-200 text-orange-700 hover:bg-orange-50 mt-2">
            <FileText className="w-4 h-4" />
            Export Report
          </Button>
        </div>

        {/* Auto Location Status */}
        <AutoLocationStatus compact={false} showDetails={false} />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold mt-1">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                    </div>
                    <div className={cn("p-3 rounded-xl", stat.bgColor)}>
                      <stat.icon className={cn("w-5 h-5", stat.color)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Active Order */}
        {activeOrder && (() => {
          const isPickupPhase = ['placed', 'accepted', 'preparing', 'cooking', 'ready_for_pickup', 'arrived_at_restaurant'].includes(activeOrder.status);
          const isCollected = activeOrder.status === ('picked' as any) || activeOrder.status === 'out_for_delivery';

          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="border-primary/50 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    Active Delivery
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="default">{activeOrder.status.replace(/_/g, ' ').toUpperCase()}</Badge>
                        <span className="text-sm text-muted-foreground">Order #{activeOrder.id.slice(-6)}</span>
                      </div>
                      <p className="font-medium">{isPickupPhase ? activeOrder.restaurantName : activeOrder.customerName}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span>{isPickupPhase ? activeOrder.restaurantAddress : activeOrder.deliveryAddress}</span>
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {activeOrder.distance} • Est. ₹{activeOrder.estimatedEarning.toFixed(2)}
                      </p>

                      {!isPickupPhase && (
                        <div className="flex gap-2 mt-2">
                          <Badge variant={activeOrder.paymentMethod === 'cod' ? "destructive" : "default"} className="text-xs">
                            {activeOrder.paymentMethod === 'cod' ? 'COD' : 'ONLINE'}
                          </Badge>
                          <Badge variant="outline" className={cn("text-xs",
                            activeOrder.paymentStatus === 'paid' ? "text-green-600 border-green-600" : "text-amber-600 border-amber-600"
                          )}>
                            {activeOrder.paymentStatus === 'paid' ? 'PAID' : 'COLLECT CASH'}
                          </Badge>
                        </div>
                      )}

                    </div>
                    <div className="flex flex-col gap-2 min-w-[140px]">
                      <Button onClick={() => navigate(`/delivery/tracking/${activeOrder.id}`)} className="w-full">
                        <Navigation className="w-4 h-4 mr-2" />
                        {isPickupPhase && !isCollected ? 'View Restaurant' : 'View Map'}
                      </Button>
                      {!isPickupPhase && (
                        <Button variant="outline" onClick={() => navigate(`/delivery/tracking/${activeOrder.id}?target=restaurant`)} className="w-full">
                          <MapPin className="w-4 h-4 mr-2" />
                          View Restaurant
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })()}

        {/* Available Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Available Orders
              </span>
              <Badge variant="secondary">{orders.length} orders</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!profile.isOnline ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
                  <Package className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">Go online to see available orders</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
                  <Package className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No orders available right now</p>
                <p className="text-sm text-muted-foreground mt-1">Check back soon!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.slice(0, 3).map((order, index) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-muted/50 border border-border gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{order.restaurantName}</p>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          Pickup: {order.distance}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {order.items.length} items • Est. Total: ₹{order.totalAmount.toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-start gap-1">
                        <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>{order.restaurantAddress || 'Restaurant location'}</span>
                      </p>
                      <div className="mt-1">
                        <Badge variant="secondary" className="text-[10px] h-5 px-2">
                          Customer details hidden until pickup
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-500">
                          +₹{order.estimatedEarning.toFixed(2)}
                        </p>                        <p className="text-xs text-muted-foreground">Estimated</p>
                      </div>
                      <Button
                        onClick={() => acceptOrder(order.id)}
                        disabled={!!activeOrder}
                      >
                        Accept
                      </Button>
                      {activeOrder && activeOrder.id === order.id && (
                        <Button
                          variant="outline"
                          className="ml-2"
                          onClick={() => navigate(`/delivery/restaurant/${order.id}`)}
                        >
                          See Restaurant
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
                {orders.length > 3 && (
                  <Button variant="outline" className="w-full" onClick={() => navigate('/delivery/orders')}>
                    View All Orders ({orders.length})
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <DeliveryWelcomeModal
        isOpen={showWelcomeModal}
        onClose={handleCloseWelcomeModal}
        userName={profile.name}
      />

      <DeliveryReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />
    </DeliveryLayout>
  );
}