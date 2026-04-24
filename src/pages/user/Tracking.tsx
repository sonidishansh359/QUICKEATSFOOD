import React from 'react';
import { useParams } from 'react-router-dom';
import { LocationTrackingScreen } from '@/components/tracking/LocationTrackingScreen';

const UserTrackingPage: React.FC = () => {
  const { orderId } = useParams<{ orderId?: string }>();

  if (!orderId) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-red-600 text-lg font-semibold">No order ID provided</p>
        </div>
      </div>
    );
  }

  return (
    <LocationTrackingScreen
      orderId={orderId}
      onTrackingComplete={() => {
        // Redirect to order details or history
        window.location.href = `/user/orders`;
      }}
    />
  );
};

export default UserTrackingPage;
