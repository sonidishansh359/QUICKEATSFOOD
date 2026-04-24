import { useUserData } from '@/contexts/UserDataContext';
import { LocationTrackingScreen } from '@/components/tracking/LocationTrackingScreen';
import { useNavigate } from 'react-router-dom';

export default function OrderTracking() {
  const { activeOrder } = useUserData();
  const navigate = useNavigate();

  if (!activeOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">No active orders</h2>
          <p className="text-muted-foreground">Place an order to track it here</p>
        </div>
      </div>
    );
  }

  // Show detailed tracking with live map
  return (
    <LocationTrackingScreen
      orderId={activeOrder.id}
      prefetchedOrder={activeOrder}
      onTrackingComplete={() => {
        // Redirect to order history when delivered
        navigate('/user/orders');
      }}
    />
  );
}
