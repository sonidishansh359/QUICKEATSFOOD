import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { UserOrder } from '@/contexts/UserDataContext';
import { useUserData } from '@/contexts/UserDataContext';

interface OrderFeedbackModalProps {
  order: UserOrder;
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: (orderId: string) => void;
}

export function OrderFeedbackModal({ order, isOpen, onClose, onSubmitSuccess }: OrderFeedbackModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [deliveryFeedback, setDeliveryFeedback] = useState('');
  const [addDeliveryFeedback, setAddDeliveryFeedback] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { refreshRestaurants } = useUserData();

  // Normalize API base once for this component
  const API_ORIGIN = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const API_BASE_URL = typeof API_ORIGIN === 'string' && API_ORIGIN.endsWith('/api')
    ? API_ORIGIN
    : `${API_ORIGIN}/api`;

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a star rating before submitting.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Get auth token
      const storedAuth = localStorage.getItem('quickeats_auth');
      const token = storedAuth ? JSON.parse(storedAuth).token : null;
      
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Always fetch the latest order status before allowing review (with one retry)
      const fetchLatestStatus = async () => {
        const statusResponse = await fetch(`${API_BASE_URL}/orders/${order.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache'
          }
        });
        if (!statusResponse.ok) return null;
        return statusResponse.json();
      };

      let latestOrder = await fetchLatestStatus();

      // If not delivered yet, wait a moment and retry once (handles slight backend lag)
      if (latestOrder && !(
        latestOrder.status === 'delivered'
        || latestOrder.deliveryStatus === 'delivered'
        || !!latestOrder.deliveredAt
        || latestOrder.isOTPVerified === true
      )) {
        await new Promise(res => setTimeout(res, 1200));
        latestOrder = await fetchLatestStatus();
      }

      const isDelivered = latestOrder && (
        latestOrder.status === 'delivered'
        || latestOrder.deliveryStatus === 'delivered'
        || !!latestOrder.deliveredAt
        || latestOrder.isOTPVerified === true
      );

      if (!isDelivered) {
        toast({
          title: "Order not delivered yet",
          description: "Please wait a moment after delivery and try again.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      // Submit review to backend
      const response = await fetch(`${API_BASE_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId: order.id,
          restaurantId: order.restaurantId,
          rating: rating,
          comment: feedback,
          deliveryBoyId: order.deliveryBoyId,
          deliveryRating: addDeliveryFeedback ? deliveryRating : undefined,
          deliveryComment: addDeliveryFeedback ? deliveryFeedback : undefined
        })
      });

      const result = await response.json().catch(() => ({} as any));

      if (!response.ok) {
        const message = (result && (result.message || result.error)) || 'Failed to submit review';
        throw new Error(message);
      }

      toast({
        title: "Thank you for your feedback!",
        description: "Your feedback helps us improve our service.",
      });
      
      setIsSubmitting(false);
      onSubmitSuccess(order.id);
      onClose();
      
      // Reset state
      setRating(0);
      setFeedback('');
      setDeliveryRating(0);
      setDeliveryFeedback('');
      setAddDeliveryFeedback(false);

      // Refresh restaurants to get updated ratings
      await refreshRestaurants();
    } catch (error) {
      console.error('Failed to submit review:', error);
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "Could not submit your feedback. Please try again.",
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setRating(0);
      setFeedback('');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">Share Your Feedback</h2>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Order Info */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl mb-6">
              <img
                src={order.restaurantImage}
                alt={order.restaurantName}
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div>
                <p className="font-medium text-foreground">{order.restaurantName}</p>
                <p className="text-sm text-muted-foreground">
                  {order.items.length} items • ₹{order.totalAmount.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Star Rating */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-3">
                Rate your experience
              </label>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    disabled={isSubmitting}
                    className="p-1 transition-transform hover:scale-110 disabled:opacity-50"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        star <= (hoveredRating || rating)
                          ? 'fill-primary text-primary'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-center text-sm text-muted-foreground mt-2">
                  {rating === 1 && 'Poor'}
                  {rating === 2 && 'Fair'}
                  {rating === 3 && 'Good'}
                  {rating === 4 && 'Very Good'}
                  {rating === 5 && 'Excellent'}
                </p>
              )}
            </div>

            {/* Feedback Text */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Additional comments (optional)
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your experience..."
                disabled={isSubmitting}
                rows={4}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none disabled:opacity-50"
              />
            </div>

            {/* Optional Delivery Partner Feedback */}
            {order.deliveryBoyId && (
              <div className="mb-6 border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-foreground">
                    Delivery partner feedback (optional)
                  </label>
                  <Button
                    type="button"
                    variant={addDeliveryFeedback ? 'destructive' : 'outline'}
                    size="sm"
                    onClick={() => {
                      if (addDeliveryFeedback) {
                        setDeliveryRating(0);
                        setDeliveryFeedback('');
                      }
                      setAddDeliveryFeedback(!addDeliveryFeedback);
                    }}
                    disabled={isSubmitting}
                  >
                    {addDeliveryFeedback ? 'Remove' : 'Add'}
                  </Button>
                </div>
                {addDeliveryFeedback && (
                  <>
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-muted-foreground">Rate your delivery experience</span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={`del-${star}`}
                            type="button"
                            onClick={() => setDeliveryRating(star)}
                            disabled={isSubmitting}
                            className="p-1 transition-transform hover:scale-110 disabled:opacity-50"
                          >
                            <Star
                              className={`w-7 h-7 transition-colors ${
                                star <= deliveryRating
                                  ? 'fill-primary text-primary'
                                  : 'text-muted-foreground'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <textarea
                        value={deliveryFeedback}
                        onChange={(e) => setDeliveryFeedback(e.target.value)}
                        placeholder="How was the delivery?"
                        disabled={isSubmitting}
                        rows={3}
                        className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none disabled:opacity-50"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  isSubmitting ||
                  rating === 0 ||
                  (addDeliveryFeedback && deliveryRating === 0)
                }
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Feedback'
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}