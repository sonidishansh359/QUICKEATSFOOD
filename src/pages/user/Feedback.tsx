import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import { useUserData, UserOrder } from '@/contexts/UserDataContext';
import { OrderFeedbackModal } from '@/components/user/OrderFeedbackModal';

export default function Feedback() {
  const { orders } = useUserData();
  const [feedbackOrder, setFeedbackOrder] = useState<UserOrder | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<Set<string>>(new Set());

  // Filter delivered orders that haven't received feedback yet
  const deliveredOrders = orders.filter(order => order.status === 'delivered');
  const pendingFeedbackOrders = deliveredOrders.filter(order => !feedbackGiven.has(order.id));
  const completedFeedbackOrders = deliveredOrders.filter(order => feedbackGiven.has(order.id));

  const handleFeedbackSubmit = (orderId: string) => {
    setFeedbackGiven(prev => new Set([...prev, orderId]));
  };

  return (
    <div className="min-h-screen p-4 lg:p-8 pb-24 lg:pb-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">Order Feedback</h1>
          <p className="text-muted-foreground">
            Share your experience and help us improve our service.
          </p>
        </motion.div>

        {deliveredOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-8 text-center"
          >
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">No Delivered Orders</h2>
            <p className="text-muted-foreground">
              Once your orders are delivered, you can provide feedback here.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Orders awaiting feedback */}
            {pendingFeedbackOrders.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Awaiting Your Feedback ({pendingFeedbackOrders.length})
                </h2>
                <div className="space-y-4">
                  {pendingFeedbackOrders.map((order, index) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-card border border-border rounded-xl p-4 flex items-center gap-4"
                    >
                      <img
                        src={order.restaurantImage}
                        alt={order.restaurantName}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">
                          {order.restaurantName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {order.items.length} items • ₹{order.totalAmount.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Delivered on {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => setFeedbackOrder(order)}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors whitespace-nowrap"
                      >
                        Give Feedback
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Orders with feedback given */}
            {completedFeedbackOrders.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Feedback Submitted ({completedFeedbackOrders.length})
                </h2>
                <div className="space-y-4">
                  {completedFeedbackOrders.map((order, index) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 opacity-70"
                    >
                      <img
                        src={order.restaurantImage}
                        alt={order.restaurantName}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">
                          {order.restaurantName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {order.items.length} items • ₹{order.totalAmount.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Delivered on {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium">
                        Submitted
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Feedback Modal */}
      {feedbackOrder && (
        <OrderFeedbackModal
          order={feedbackOrder}
          isOpen={!!feedbackOrder}
          onClose={() => setFeedbackOrder(null)}
          onSubmitSuccess={handleFeedbackSubmit}
        />
      )}
    </div>
  );
}
