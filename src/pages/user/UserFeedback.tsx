import React, { useState, useEffect } from 'react';
import { useUserData } from '@/contexts/UserDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Star, MessageSquare, CheckCircle, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Feedback {
  orderId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface DeliveryFeedback {
  orderId: string;
  deliveryRating: number;
  deliveryComment: string;
  deliveryBoyName: string;
  createdAt: string;
}

const UserFeedback: React.FC = () => {
  const { orders, refreshRestaurants } = useUserData();
  const { token } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [deliveryComment, setDeliveryComment] = useState('');
  const [submittedFeedback, setSubmittedFeedback] = useState<Feedback[]>([]);
  const [submittedDeliveryFeedback, setSubmittedDeliveryFeedback] = useState<DeliveryFeedback[]>([]);
  const [isSubmittingDeliveryFeedback, setIsSubmittingDeliveryFeedback] = useState(false);
  const [localOrders, setLocalOrders] = useState<any[]>(orders);

  // Normalize API base URL to always include '/api'
  const API_BASE_URL = (() => {
    const base = import.meta.env.VITE_API_URL as string | undefined;
    if (!base) return 'http://localhost:5000/api';
    return base.endsWith('/api') ? base : `${base}/api`;
  })();

  // Fetch user's reviews from backend on load
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/reviews/my-reviews`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const reviews = await response.json();
          setSubmittedFeedback(reviews);
        }
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
      }
    };

    if (token) {
      fetchReviews();
    }

    // Also refresh orders to get latest status and map to UI shape
    const refreshOrders = async () => {
      try {
        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/orders/user`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          // Map backend orders to local UI shape expected by this page
          const mapped = (data || []).map((o: any) => {
            const restaurant = o.restaurant || {};
            const deliveryBoy = o.deliveryBoy || null;
            return {
              id: o._id,
              restaurantId: typeof restaurant === 'object' ? restaurant._id || restaurant.id : restaurant,
              restaurantName: typeof restaurant === 'object' ? restaurant.name : 'Restaurant',
              restaurantImage: typeof restaurant === 'object' ? restaurant.image || '' : '',
              items: o.items || [],
              status: o.status,
              deliveryStatus: o.deliveryStatus,
              totalAmount: o.totalAmount,
              deliveryAddress: o.deliveryAddress,
              paymentMethod: o.paymentMethod || 'cod',
              createdAt: o.createdAt,
              deliveredAt: o.deliveredAt,
              isOTPVerified: !!o.isOTPVerified,
              deliveryBoyId: deliveryBoy ? (deliveryBoy._id || deliveryBoy) : undefined,
              deliveryBoyName: deliveryBoy && deliveryBoy.user ? deliveryBoy.user.name : undefined,
              vehicleType: deliveryBoy ? deliveryBoy.vehicleType : undefined,
            };
          });
          setLocalOrders(mapped);
          console.log('✅ Refreshed orders for feedback page');
        }
      } catch (error) {
        console.error('Failed to refresh orders:', error);
      }
    };

    if (token) {
      refreshOrders();
    }
  }, [token]);

  // Filter delivered orders that haven't been reviewed yet
  const deliveredOrders = localOrders.filter(order => {
    const isDelivered =
      order.status === 'delivered' ||
      order.deliveryStatus === 'delivered' ||
      !!order.deliveredAt ||
      !!order.isOTPVerified;
    const notReviewed = !submittedFeedback.some(feedback => feedback.orderId === order.id);
    return isDelivered && notReviewed;
  });

  // Get orders that have been reviewed
  const reviewedOrders = localOrders.filter(order =>
    submittedFeedback.some(feedback => feedback.orderId === order.id)
  );

  const handleSubmitFeedback = async () => {
    if (!selectedOrder || rating === 0) return;

    try {
      if (!token) {
        alert('Please login to submit feedback');
        return;
      }

      // Find the order to get restaurant ID
      const order = localOrders.find(o => o.id === selectedOrder);
      if (!order) {
        console.error('Order not found:', selectedOrder);
        return;
      }

      console.log('📤 Submitting review:', {
        orderId: selectedOrder,
        restaurantId: order.restaurantId,
        rating,
        comment,
        deliveryRating: isSubmittingDeliveryFeedback ? deliveryRating : undefined,
        deliveryComment: isSubmittingDeliveryFeedback ? deliveryComment : undefined,
        orderStatus: order.status
      });

      // Submit review to backend
      const response = await fetch(`${API_BASE_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId: selectedOrder,
          restaurantId: order.restaurantId,
          rating: rating,
          comment: comment,
          deliveryRating: isSubmittingDeliveryFeedback ? deliveryRating : undefined,
          deliveryComment: isSubmittingDeliveryFeedback ? deliveryComment : undefined,
          deliveryBoyId: order.deliveryBoyId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Backend error:', errorData);
        throw new Error(errorData.message || 'Failed to submit review');
      }

      const newFeedback: Feedback = {
        orderId: selectedOrder,
        rating,
        comment,
        createdAt: new Date().toISOString(),
      };

      if (isSubmittingDeliveryFeedback && deliveryRating > 0) {
        const newDeliveryFeedback: DeliveryFeedback = {
          orderId: selectedOrder,
          deliveryRating,
          deliveryComment,
          deliveryBoyName: order.deliveryBoyName || 'Delivery Partner',
          createdAt: new Date().toISOString(),
        };
        setSubmittedDeliveryFeedback([...submittedDeliveryFeedback, newDeliveryFeedback]);
      }

      const updatedFeedback = [...submittedFeedback, newFeedback];
      setSubmittedFeedback(updatedFeedback);
      localStorage.setItem('user_feedback', JSON.stringify(updatedFeedback));

      // Reset form
      setSelectedOrder(null);
      setRating(0);
      setComment('');
      setDeliveryRating(0);
      setDeliveryComment('');
      setIsSubmittingDeliveryFeedback(false);

      // Refresh restaurants to get updated ratings
      await refreshRestaurants();

      alert('Review submitted successfully!');
    } catch (error) {
      console.error('Failed to submit review:', error);
      alert('Failed to submit review. Please try again.');
    }
  };

  const getFeedbackForOrder = (orderId: string) => {
    return submittedFeedback.find(feedback => feedback.orderId === orderId);
  };

  const getDeliveryFeedbackForOrder = (orderId: string) => {
    return submittedDeliveryFeedback.find(feedback => feedback.orderId === orderId);
  };

  const renderStars = (currentRating: number, interactive = false, onRate?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onRate?.(star)}
            className={cn(
              "w-6 h-6",
              interactive ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default",
              star <= currentRating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
            )}
          >
            <Star className="w-full h-full" />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">Feedback & Reviews</h1>
        <p className="text-muted-foreground">Share your experience with our restaurants</p>
      </div>

      {/* Orders available for feedback */}
      {deliveredOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Rate Your Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {deliveredOrders.map((order) => (
              <div key={order.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={order.restaurantImage}
                      alt={order.restaurantName}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div>
                      <h3 className="font-semibold">{order.restaurantName}</h3>
                      <p className="text-sm text-muted-foreground">
                        Order #{order.id.slice(-6)} • ₹{order.totalAmount}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">Delivered</Badge>
                </div>

                {selectedOrder === order.id ? (
                  <div className="space-y-4 border-t pt-4">
                    {/* Restaurant Feedback */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Restaurant Rating</label>
                      {renderStars(rating, true, setRating)}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Restaurant Comments</label>
                      <Textarea
                        placeholder="Tell us about your experience with the restaurant..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={3}
                      />
                    </div>

                    {/* Delivery Boy Feedback - Show only if delivery boy exists */}
                    {order.deliveryBoyName && (
                      <div className="border-t pt-4 space-y-3 bg-blue-50 p-3 rounded">
                        <div className="flex items-center gap-2 mb-3">
                          <Truck className="w-4 h-4 text-blue-600" />
                          <label className="block text-sm font-semibold text-blue-900">
                            Delivery Partner Feedback
                          </label>
                        </div>

                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">
                            Rate your delivery experience with {order.deliveryBoyName}
                          </label>
                          <Badge variant="outline">{order.vehicleType || 'Vehicle'}</Badge>
                        </div>

                        <div className={cn(
                          "transition-all",
                          isSubmittingDeliveryFeedback ? "opacity-100" : "opacity-50"
                        )}>
                          {renderStars(deliveryRating, isSubmittingDeliveryFeedback, setDeliveryRating)}
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Delivery Comments (Optional)</label>
                          <Textarea
                            placeholder="How was the delivery? Was the food delivered on time and in good condition?..."
                            value={deliveryComment}
                            onChange={(e) => setDeliveryComment(e.target.value)}
                            disabled={!isSubmittingDeliveryFeedback}
                            rows={2}
                            className={!isSubmittingDeliveryFeedback ? "opacity-50" : ""}
                          />
                        </div>

                        <Button
                          variant={isSubmittingDeliveryFeedback ? "destructive" : "outline"}
                          size="sm"
                          onClick={() => {
                            setIsSubmittingDeliveryFeedback(!isSubmittingDeliveryFeedback);
                            if (isSubmittingDeliveryFeedback) {
                              setDeliveryRating(0);
                              setDeliveryComment('');
                            }
                          }}
                        >
                          {isSubmittingDeliveryFeedback ? 'Skip Delivery Feedback' : 'Add Delivery Feedback'}
                        </Button>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        onClick={handleSubmitFeedback}
                        disabled={rating === 0 || (isSubmittingDeliveryFeedback && deliveryRating === 0)}
                      >
                        Submit Feedback
                      </Button>
                      <Button variant="outline" onClick={() => {
                        setSelectedOrder(null);
                        setRating(0);
                        setComment('');
                        setDeliveryRating(0);
                        setDeliveryComment('');
                        setIsSubmittingDeliveryFeedback(false);
                      }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setSelectedOrder(order.id)}
                    className="w-full"
                  >
                    Write a Review
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Previously reviewed orders */}
      {reviewedOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Your Reviews
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reviewedOrders.map((order) => {
              const feedback = getFeedbackForOrder(order.id);
              const deliveryFeedback = getDeliveryFeedbackForOrder(order.id);
              if (!feedback) return null;

              return (
                <div key={order.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={order.restaurantImage}
                        alt={order.restaurantName}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <h3 className="font-semibold">{order.restaurantName}</h3>
                        <p className="text-sm text-muted-foreground">
                          Order #{order.id.slice(-6)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {renderStars(feedback.rating)}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(feedback.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Restaurant feedback */}
                  {feedback.comment && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-sm font-medium mb-1">Restaurant Review</p>
                      <p className="text-sm">{feedback.comment}</p>
                    </div>
                  )}

                  {/* Delivery feedback */}
                  {deliveryFeedback && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-blue-600" />
                        <p className="text-sm font-medium text-blue-900">Delivery Feedback: {deliveryFeedback.deliveryBoyName}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {renderStars(deliveryFeedback.deliveryRating)}
                        <span className="text-xs text-muted-foreground">({deliveryFeedback.deliveryRating}/5)</span>
                      </div>
                      {deliveryFeedback.deliveryComment && (
                        <p className="text-sm text-blue-900">{deliveryFeedback.deliveryComment}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {deliveredOrders.length === 0 && reviewedOrders.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Orders to Review</h3>
            <p className="text-muted-foreground">
              Once you receive your orders, you'll be able to leave feedback here.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserFeedback;
