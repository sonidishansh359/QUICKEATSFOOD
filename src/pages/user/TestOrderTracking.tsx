import { useEffect } from 'react';
import { useUserData } from '@/contexts/UserDataContext';

export default function TestOrderTracking() {
  const { activeOrder, orders } = useUserData();

  useEffect(() => {
    console.log('🧪 TEST PAGE - Active Order:', {
      exists: !!activeOrder,
      orderId: activeOrder?.id,
      status: activeOrder?.status,
      deliveryPartner: activeOrder?.deliveryPartner
    });
  }, [activeOrder]);

  useEffect(() => {
    console.log('🧪 TEST PAGE - All Orders:', orders.length);
    orders.forEach((order, index) => {
      console.log(`Order ${index + 1}:`, {
        id: order.id,
        status: order.status,
        hasDeliveryPartner: !!order.deliveryPartner,
        deliveryPartner: order.deliveryPartner
      });
    });
  }, [orders]);

  if (!activeOrder) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Test Order Tracking</h1>
        <p className="text-red-500">No active order found</p>
        <div className="mt-4">
          <p className="font-semibold">All Orders ({orders.length}):</p>
          {orders.map((order, index) => (
            <div key={order.id} className="border p-2 mt-2">
              <p>Order {index + 1}: {order.id}</p>
              <p>Status: {order.status}</p>
              <p>Has Delivery Partner: {order.deliveryPartner ? 'YES' : 'NO'}</p>
              {order.deliveryPartner && (
                <div className="ml-4 mt-2">
                  <p>Name: {order.deliveryPartner.name}</p>
                  <p>Phone: {order.deliveryPartner.phone || 'NOT SET'}</p>
                  <p>Vehicle: {order.deliveryPartner.vehicleType}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Order Tracking</h1>
      
      <div className="border p-4 mb-4">
        <h2 className="font-semibold text-lg mb-2">Active Order</h2>
        <p><strong>Order ID:</strong> {activeOrder.id}</p>
        <p><strong>Status:</strong> {activeOrder.status}</p>
        <p><strong>Restaurant:</strong> {activeOrder.restaurantName}</p>
        <p><strong>Total:</strong> ₹{activeOrder.totalAmount}</p>
      </div>

      <div className="border p-4 bg-blue-50">
        <h2 className="font-semibold text-lg mb-2">Delivery Partner Info</h2>
        {activeOrder.deliveryPartner ? (
          <div>
            <p className="text-green-600 font-semibold">✅ Delivery Partner Assigned</p>
            <p><strong>Name:</strong> {activeOrder.deliveryPartner.name}</p>
            <p><strong>Phone:</strong> {activeOrder.deliveryPartner.phone || '❌ NOT SET'}</p>
            <p><strong>Email:</strong> {activeOrder.deliveryPartner.email}</p>
            <p><strong>Vehicle:</strong> {activeOrder.deliveryPartner.vehicleType}</p>
            <p><strong>Plate:</strong> {activeOrder.deliveryPartner.vehicleNumber}</p>
            <p><strong>Rating:</strong> {activeOrder.deliveryPartner.rating}</p>
            
            {activeOrder.deliveryPartner.phone && (
              <button 
                onClick={() => window.location.href = `tel:${activeOrder.deliveryPartner?.phone}`}
                className="mt-4 bg-green-500 text-white px-4 py-2 rounded"
              >
                📞 Call {activeOrder.deliveryPartner.phone}
              </button>
            )}
          </div>
        ) : (
          <p className="text-red-500">❌ No delivery partner assigned yet</p>
        )}
      </div>

      <div className="mt-4">
        <button 
          onClick={() => window.location.reload()}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
}
