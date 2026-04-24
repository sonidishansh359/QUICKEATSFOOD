import React from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Package, MapPin, Clock, Phone, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { DeliveryLayout } from '@/components/delivery/DeliveryLayout';
import { useDeliveryData } from '@/contexts/DeliveryDataContext';
import { cn } from '@/lib/utils';

export default function DeliveryOrders() {
  const navigate = useNavigate();
  const { profile, orders, activeOrder, acceptOrder } = useDeliveryData();

  // Filter orders to only those within 5km
  const ordersWithin5km = orders.filter(order => {
    if (!order.distance || typeof order.distance !== 'string') return false;
    // Extract numeric value from distance string (e.g., '4.2 km')
    const match = order.distance.match(/([\d.]+)\s*km/i);
    if (!match) return false;
    const km = parseFloat(match[1]);
    return !isNaN(km) && km <= 5;
  });

  // Automatically redirect to tracking when an order becomes active
  React.useEffect(() => {
    if (activeOrder?.id) {
      navigate(`/delivery/tracking/${activeOrder.id}`);
    }
  }, [activeOrder?.id, navigate]);

  return (
    <DeliveryLayout>
      <Helmet>
        <title>Orders | QuickEats Delivery</title>
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground mt-1">
            View and manage your delivery orders
          </p>
        </div>

        {/* Active Order Section */}
        {activeOrder && (() => {
          const isPickupPhase = ['placed', 'accepted', 'preparing', 'cooking', 'ready_for_pickup', 'arrived_at_restaurant'].includes(activeOrder.status);

          return (
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                  Active Delivery
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-lg">{activeOrder.restaurantName}</p>
                      <p className="text-sm text-muted-foreground">{activeOrder.restaurantAddress}</p>
                    </div>
                    <Badge>{activeOrder.status.replace(/_/g, ' ').toUpperCase()}</Badge>
                  </div>

                  {!isPickupPhase && (
                    <div className="border-t border-border pt-4">
                      <h4 className="font-medium mb-2">Delivery To:</h4>
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">{activeOrder.customerName}</p>
                          <p className="text-sm text-muted-foreground">{activeOrder.deliveryAddress}</p>
                          <a
                            href={`tel:${activeOrder.customerPhone}`}
                            className="text-sm text-primary flex items-center gap-1 mt-1 hover:underline"
                          >
                            <Phone className="w-3 h-3" />
                            {activeOrder.customerPhone}
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="border-t border-border pt-4">
                    <h4 className="font-medium mb-2">Order Items:</h4>
                    <div className="space-y-2">
                      {activeOrder.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{item.quantity}x {item.name}</span>
                          <span className="text-muted-foreground">₹{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between font-medium pt-2 border-t border-border">
                        <span>Total</span>
                        <span>₹{activeOrder.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{activeOrder.distance}</span>
                    </div>
                    <p className="text-lg font-bold text-green-500">
                      Earn ₹{activeOrder.estimatedEarning.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Available Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Available Orders</span>
              <Badge variant="secondary">{ordersWithin5km.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!profile.isOnline ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
                  <Package className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-lg">You're Offline</h3>
                <p className="text-muted-foreground mt-1">
                  Go online from the sidebar to see available orders
                </p>
              </div>
            ) : ordersWithin5km.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
                  <Package className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-lg">No Orders Available</h3>
                <p className="text-muted-foreground mt-1">
                  New orders will appear here when available
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {ordersWithin5km.map((order, index) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border border-border rounded-xl p-4 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-medium text-slate-900 truncate">{order.restaurantName}</h3>
                            <p className="text-sm text-muted-foreground truncate">{order.restaurantAddress}</p>
                          </div>
                          <Badge variant="outline" className="whitespace-nowrap bg-blue-50 text-blue-700 border-blue-200">
                            Pickup: {order.distance}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <ChevronRight className="w-4 h-4" />
                          <span className="truncate">{order.customerName}</span>
                          <span className="mx-1">•</span>
                          <span className="truncate">{order.deliveryAddress.split(',')[0]}</span>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground">{order.items.length} items</span>
                          <span className="text-sm font-medium">₹{order.totalAmount.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end gap-3 w-full sm:w-auto">
                        <div className="hidden sm:block text-right">
                          <p className="text-lg font-bold text-green-500">+₹{order.estimatedEarning.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">Estimated</p>
                        </div>

                        <div className="w-full sm:w-auto">
                          <Button
                            size="sm"
                            className="w-full sm:w-28"
                            onClick={() => acceptOrder(order.id)}
                            disabled={!!activeOrder}
                          >
                            Accept
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DeliveryLayout>
  );
}