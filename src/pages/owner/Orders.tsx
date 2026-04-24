import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useOwnerData } from '@/contexts/OwnerDataContext';
import { Order, OrderStatus, Restaurant } from '@/types/auth';
import { Clock, MapPin, Phone, User, Package, IndianRupee, ChefHat, FileText } from 'lucide-react';

const OrdersPage: React.FC = () => {
  const { restaurants, orders, updateOrderStatus, assignDeliveryBoy } = useOwnerData();
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);

  useEffect(() => {
    // Set first restaurant as default if available
    if (restaurants.length > 0 && !selectedRestaurant) {
      setSelectedRestaurant(restaurants[0]);
    }
  }, [restaurants, selectedRestaurant]);

  const filteredOrders = selectedRestaurant
    ? orders.filter(order => order.restaurantId === selectedRestaurant.id)
    : [];

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'placed': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'out_for_delivery': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-emerald-100 text-emerald-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'placed': return <Clock className="w-4 h-4" />;
      case 'accepted': return <Package className="w-4 h-4" />;
      case 'preparing': return <ChefHat className="w-4 h-4" />;
      case 'out_for_delivery': return <Package className="w-4 h-4" />;
      case 'delivered': return <Package className="w-4 h-4" />;
      case 'cancelled': return <Package className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    await updateOrderStatus(orderId, newStatus);
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsOrderDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (restaurants.length === 0) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No restaurants found</p>
              <p className="text-sm">Please add a restaurant first to manage orders.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Order Management</h1>
        <div className="w-full sm:w-[200px]">
          <Select
            value={selectedRestaurant?.id || ''}
            onValueChange={(value) => {
              const restaurant = restaurants.find(r => r.id === value);
              setSelectedRestaurant(restaurant || null);
            }}
          >
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Select restaurant" />
            </SelectTrigger>
            <SelectContent>
              {restaurants.map(restaurant => (
                <SelectItem key={restaurant.id} value={restaurant.id}>
                  {restaurant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!selectedRestaurant ? (
        <Card>
          <CardContent className="p-6 sm:p-8 text-center">
            <div className="text-muted-foreground">
              <p className="text-base sm:text-lg mb-2">Please select a restaurant</p>
              <p className="text-xs sm:text-sm">Choose a restaurant from the dropdown to view its orders.</p>
            </div>
          </CardContent>
        </Card>
      ) : filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="p-6 sm:p-8 text-center">
            <div className="text-muted-foreground">
              <Package className="w-10 sm:w-12 h-10 sm:h-12 mx-auto mb-4 opacity-50" />
              <p className="text-base sm:text-lg mb-2">No orders yet</p>
              <p className="text-xs sm:text-sm">Orders will appear here once customers start placing them.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="relative flex flex-col">
              <CardHeader className="pb-3 sm:pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                  <CardTitle className="text-base sm:text-lg truncate">Order #{order.id.slice(-6)}</CardTitle>
                  <Badge className={`${getStatusColor(order.status)} text-xs whitespace-nowrap`}>
                    {getStatusIcon(order.status)}
                    <span className="ml-1 capitalize">{order.status.replace('_', ' ')}</span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3 flex-1 flex flex-col">
                <div className="flex items-center text-xs sm:text-sm text-muted-foreground gap-2">
                  <User className="w-3 sm:w-4 h-3 sm:h-4 flex-shrink-0" />
                  <span className="truncate">{order.customerName}</span>
                </div>

                <div className="flex items-center text-xs sm:text-sm text-muted-foreground gap-2">
                  <Phone className="w-3 sm:w-4 h-3 sm:h-4 flex-shrink-0" />
                  <span className="truncate">{order.customerPhone}</span>
                </div>

                <div className="flex items-start text-xs sm:text-sm text-muted-foreground gap-2">
                  <MapPin className="w-3 sm:w-4 h-3 sm:h-4 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{order.deliveryAddress}</span>
                </div>

                {order.specialInstructions && (
                  <div className="flex items-start text-xs sm:text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-md p-2 gap-2">
                    <FileText className="w-3 sm:w-4 h-3 sm:h-4 flex-shrink-0 text-amber-700 mt-0.5" />
                    <span className="line-clamp-2">{order.specialInstructions}</span>
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <div className="flex items-center text-sm sm:text-base font-semibold text-slate-900 gap-1">
                    <IndianRupee className="w-3 sm:w-4 h-3 sm:h-4 text-emerald-600" />
                    <span className="text-emerald-700">Earnings: ₹{(order.ownerEarning || order.totalAmount * 0.85).toFixed(2)}</span>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  {formatDate(order.createdAt)}
                </div>

                <div className="flex flex-col gap-2 pt-3 sm:pt-4 mt-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewOrder(order)}
                    className="w-full text-xs sm:text-sm"
                  >
                    View Details
                  </Button>
                  {order.status === 'placed' && (
                    <div className="flex gap-2 w-full">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleStatusUpdate(order.id, 'accepted')}
                        className="flex-1 text-xs sm:text-sm"
                      >
                        Accept Order
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                        className="flex-1 text-xs sm:text-sm bg-red-600 hover:bg-red-700 text-white"
                      >
                        Reject Order
                      </Button>
                    </div>
                  )}
                  {order.status === 'accepted' && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleStatusUpdate(order.id, 'preparing')}
                      className="w-full text-xs sm:text-sm"
                    >
                      Start Prep
                    </Button>
                  )}
                  {order.status === 'preparing' && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleStatusUpdate(order.id, 'out_for_delivery')}
                      className="w-full text-xs sm:text-sm"
                    >
                      Out for Delivery
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
        <DialogContent className="sm:max-w-[95vw] md:max-w-[600px] p-3 sm:p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Order Details #{selectedOrder?.id.slice(-6)}</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              View and manage order status
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <h3 className="font-semibold text-sm sm:text-base mb-2">Customer Information</h3>
                  <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-3 sm:w-4 h-3 sm:h-4 flex-shrink-0" />
                      <span className="truncate">{selectedOrder.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 sm:w-4 h-3 sm:h-4 flex-shrink-0" />
                      <span className="truncate">{selectedOrder.customerPhone}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3 sm:w-4 h-3 sm:h-4 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{selectedOrder.deliveryAddress}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base mb-2">Order Information</h3>
                  <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                    <div>Status: <Badge className={`${getStatusColor(selectedOrder.status)} text-xs`}>{selectedOrder.status.replace('_', ' ')}</Badge></div>
                    <div className="text-emerald-600 font-bold mb-1">Your Earning: ₹{(selectedOrder.ownerEarning || selectedOrder.totalAmount * 0.85).toFixed(2)}</div>
                    <div>Ordered: {formatDate(selectedOrder.createdAt)}</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm sm:text-base mb-2">Order Items</h3>
                <div className="space-y-1 sm:space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded text-xs sm:text-sm gap-2">
                      <div className="min-w-0">
                        <span className="font-medium truncate">{item.name}</span>
                        <span className="text-muted-foreground ml-2">x{item.quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedOrder.specialInstructions && (
                <div>
                  <h3 className="font-semibold text-sm sm:text-base mb-2">Special Instructions</h3>
                  <div className="p-2 sm:p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <p className="text-xs sm:text-sm text-amber-900">{selectedOrder.specialInstructions}</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                <Button variant="outline" onClick={() => setIsOrderDialogOpen(false)} className="text-xs sm:text-sm">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersPage;
