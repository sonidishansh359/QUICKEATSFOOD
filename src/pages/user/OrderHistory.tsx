import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, ChevronRight, MessageSquare, CheckCircle } from 'lucide-react';
import { useUserData, UserOrder } from '@/contexts/UserDataContext';
import { Button } from '@/components/ui/button';
import { OrderFeedbackModal } from '@/components/user/OrderFeedbackModal';

export default function OrderHistory() {
  const { orders } = useUserData();
  const [feedbackOrder, setFeedbackOrder] = useState<UserOrder | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<Set<string>>(new Set());

  const handleFeedbackSuccess = (orderId: string) => {
    setFeedbackGiven(prev => new Set(prev).add(orderId));
  };

  const isDelivered = (status: string) => status === 'delivered';
  const hasFeedback = (orderId: string) => feedbackGiven.has(orderId);

  return (
    <div className="pb-24 lg:pb-8 px-4 lg:px-8 py-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">Order History</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No orders yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card border border-border rounded-xl p-4"
            >
              <div className="flex items-start gap-4">
                <img
                  src={order.restaurantImage}
                  alt={order.restaurantName}
                  className="w-16 h-16 rounded-xl object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-4">
                      <h3 className="font-semibold text-foreground">{order.restaurantName}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 my-1">
                        {order.items.map(i => `${i.quantity} x ${i.name}`).join(', ')}
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {order.items.reduce((acc, item) => acc + item.quantity, 0)} items • ₹{order.totalAmount.toFixed(2)}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${order.status === 'delivered'
                        ? 'bg-success/10 text-success'
                        : order.status === 'cancelled'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-warning/10 text-warning'
                      }`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {new Date(order.createdAt).toLocaleDateString()}
                  </div>

                  {/* Feedback Button for Delivered Orders */}
                  {isDelivered(order.status) && (
                    <div className="mt-3">
                      {hasFeedback(order.id) ? (
                        <div className="flex items-center gap-2 text-sm text-success">
                          <CheckCircle className="w-4 h-4" />
                          <span>Feedback submitted</span>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFeedbackOrder(order)}
                          className="gap-2"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Give Feedback
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Feedback Modal */}
      {feedbackOrder && (
        <OrderFeedbackModal
          order={feedbackOrder}
          isOpen={!!feedbackOrder}
          onClose={() => setFeedbackOrder(null)}
          onSubmitSuccess={handleFeedbackSuccess}
        />
      )}
    </div>
  );
}