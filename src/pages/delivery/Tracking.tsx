import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { DeliveryBoyTrackingComponent } from '@/components/tracking/DeliveryBoyTrackingComponent';
import { AlertCircle } from 'lucide-react';
import io from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';
import { geocodeAddress } from '@/utils/mapUtils';

const DeliveryTracking: React.FC = () => {
  const { orderId } = useParams<{ orderId?: string }>();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const forceTarget = queryParams.get('target');

  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderInfo, setOrderInfo] = useState<{
    customerName?: string;
    customerPhone?: string;
    deliveryAddress?: string;
    paymentMethod?: 'cod' | 'online' | 'upi' | 'card';
    paymentStatus?: 'paid' | 'unpaid' | 'pay_on_delivery' | 'cash_collected';
    totalAmount?: number;
  } | null>(null);
  const { token: authToken } = useAuth();

  const getAuthToken = () => {
    if (authToken) return authToken;

    const storageKeys = ['quickeats_auth', 'quickeats_auth'];
    for (const key of storageKeys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      try {
        const parsed = JSON.parse(raw);
        if (parsed.token) return parsed.token as string;
      } catch (e) {
        console.error(`Failed to parse auth data from ${key}:`, e);
      }
    }

    return '';
  };

  // State for restaurant location
  const [restaurantLocation, setRestaurantLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Fetch order details to get user and restaurant location
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        if (!orderId) {
          setLoading(false);
          return;
        }

        const token = getAuthToken();

        if (!token) {
          setError('Authentication failed. Please login again.');
          setLoading(false);
          return;
        }

        // Normalize API base from env
        const envApi = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';
        const apiBase = envApi.replace(/\/$/, '').endsWith('/api') ? envApi.replace(/\/$/, '') : `${envApi.replace(/\/$/, '')}/api`;

        console.log('🔧 API Config:', {
          envApi,
          apiBase,
          envViteApiUrl: (import.meta as any).env?.VITE_API_URL
        });

        const response = await fetch(`${apiBase}/tracking/delivery-boy/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.message || 'Failed to fetch order details';

          // Show user-friendly error messages
          if (response.status === 403) {
            if (errorMessage.includes('not assigned')) {
              throw new Error('You are not assigned to this order. Please check with your dispatcher.');
            } else if (errorMessage.includes('Not authorized')) {
              throw new Error('You need to be logged in as a delivery boy to access this page.');
            }
          } else if (response.status === 404) {
            throw new Error('Order not found. The order ID may be invalid.');
          }

          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('📦 Order details for delivery:', data);

        setOrderInfo({
          customerName: data.user?.name,
          customerPhone: data.user?.phone,
          deliveryAddress: data.deliveryAddress || data.user?.address,
          paymentMethod: data.paymentMethod,
          paymentStatus: data.paymentStatus,
          totalAmount: data.totalAmount,
          status: data.status, // Add status to track delivery progress
          restaurantName: data.restaurant?.name,
          restaurantAddress: data.restaurant?.address
        } as any);

        // Determine User Location
        const userLoc = data.user?.location;
        if (userLoc?.coordinates && userLoc.coordinates.length === 2 && userLoc.coordinates[0] !== 0) {
          console.log('📍 Using Backend User Location:', userLoc.coordinates);
          setUserLocation({
            latitude: userLoc.coordinates[1], // [lng, lat]
            longitude: userLoc.coordinates[0]
          });
        } else {
          // Fallback to GEOCODE ADDRESS
          const addressToGeocode = data.deliveryAddress || data.user?.address;
          if (addressToGeocode) {
            const coords = await geocodeAddress(addressToGeocode);
            if (coords) {
              console.log('📍 Geocoded User Location:', coords);
              setUserLocation({
                latitude: coords.lat,
                longitude: coords.lng
              });
            } else {
              console.warn('⚠️ Could not geocode address:', addressToGeocode);
            }
          }
        }

        // Determine Restaurant Location
        const restLoc = data.restaurant?.location;
        if (restLoc?.coordinates && restLoc.coordinates.length === 2 && restLoc.coordinates[0] !== 0) {
          console.log('📍 Using Backend Restaurant Location:', restLoc.coordinates);
          setRestaurantLocation({
            latitude: restLoc.coordinates[1], // [lng, lat]
            longitude: restLoc.coordinates[0]
          });
        } else {
          // Fallback to GEOCODE ADDRESS
          const restaurantAddress = data.restaurant?.address;
          if (restaurantAddress) {
            const coords = await geocodeAddress(restaurantAddress);
            if (coords) {
              console.log('📍 Geocoded Restaurant Location:', coords);
              setRestaurantLocation({
                latitude: coords.lat,
                longitude: coords.lng
              });
            } else {
              console.warn('⚠️ Could not geocode restaurant address:', restaurantAddress);
            }
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('❌ Error fetching order details:', err);
        setError('Could not load order details');
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  // Listen for user location updates via socket
  useEffect(() => {
    if (!orderId) return;

    console.log(`📍 Setting up delivery boy socket for order: ${orderId}`);

    const token = getAuthToken();

    // Normalize socket origin from env
    const envApi = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';
    const socketOrigin = envApi.replace(/\/$/, '').replace(/\/api$/, '');

    const socket = io(socketOrigin, {
      auth: {
        token: token || ''
      }
    });

    socket.on('connect', () => {
      console.log('✅ Delivery boy connected to tracking server');
      // Subscribe to order room to receive user location updates
      socket.emit('subscribeToLiveTracking', { orderId }, (response: any) => {
        console.log('✅ Subscribed to order tracking room for delivery boy:', response);
      });
      console.log(`📡 Delivery boy listening for user location on order_${orderId}`);
    });

    // PRIMARY: Listen for updateDeliveryLocation (unified location updates)
    socket.on('updateDeliveryLocation', (data: any) => {
      console.log('📍 updateDeliveryLocation received:', {
        orderId: data.orderId,
        deliveryBoyId: data.deliveryBoyId,
        role: data.role,
        lat: data.latitude,
        lng: data.longitude,
        matchesOrder: data.orderId === orderId
      });

      if (data.orderId === orderId || data.orderId?._id === orderId) {
        // Check if this is NOT the delivery boy's own location
        const myUserId = JSON.parse(localStorage.getItem('quickeats_auth') || '{}')?.user?.id;

        // FIXED: ALLOW updating user location from socket to enable real-time tracking
        if (data.deliveryBoyId !== myUserId && data.role !== 'delivery_boy') {
          console.log('✅ Setting USER location from updateDeliveryLocation:', {
            lat: data.latitude,
            lng: data.longitude
          });
          setUserLocation({
            latitude: data.latitude,
            longitude: data.longitude
          });
        }
      }
    });

    // LEGACY: userLocationUpdate for backward compatibility
    socket.on('userLocationUpdate', (data: any) => {
      // console.log('📍 [LEGACY] userLocationUpdate received:', data);
      if (data.orderId === orderId || data.orderId?._id === orderId) {
        // console.log('✅ Setting user location from legacy event');
        setUserLocation({
          latitude: data.latitude,
          longitude: data.longitude
        });
      }
    });

    // LEGACY: customerLocationUpdate
    socket.on('customerLocationUpdate', (data: any) => {
      // console.log('📍 [LEGACY] customerLocationUpdate received:', data);
      if (data.orderId === orderId || data.orderId?._id === orderId) {
        setUserLocation({
          latitude: data.latitude,
          longitude: data.longitude
        });
      }
    });

    socket.on('error', (err: any) => {
      console.error('❌ Socket error:', err);
    });

    return () => {
      socket.disconnect();
    };
  }, [orderId]);

  if (!orderId) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-100">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <AlertCircle size={48} className="text-red-600 mx-auto mb-4" />
          <p className="text-red-600 text-lg font-semibold">No order ID provided</p>
          <p className="text-gray-600 text-sm mt-2">Please accept an order first to start delivery tracking.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-100">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <AlertCircle size={48} className="text-red-600 mx-auto mb-4" />
          <p className="text-red-600 text-lg font-semibold">{error}</p>
          <p className="text-gray-600 text-sm mt-2">Please try again or contact support.</p>
        </div>
      </div>
    );
  }

  // Logic to determine target destination
  // If status is 'accepted', 'cooking', 'ready_for_pickup' -> Target: Restaurant
  // If status is 'out_for_delivery' -> Target: User
  const isPickupPhase = ['accepted', 'preparing', 'cooking', 'ready_for_pickup', 'arrived_at_restaurant'].includes((orderInfo as any)?.status || '');

  let targetLocation = isPickupPhase ? restaurantLocation : userLocation;
  let targetType: 'restaurant' | 'user' = isPickupPhase ? 'restaurant' : 'user';

  if (forceTarget === 'restaurant') {
    targetLocation = restaurantLocation;
    targetType = 'restaurant';
  } else if (forceTarget === 'user') {
    targetLocation = userLocation;
    targetType = 'user';
  }

  console.log('🚀 Rendering DeliveryBoyTrackingComponent with:', {
    orderId,
    status: (orderInfo as any)?.status,
    isPickupPhase,
    targetType,
    hasTargetLocation: !!targetLocation,
    targetLocation: targetLocation ? `[${targetLocation.latitude.toFixed(6)}, ${targetLocation.longitude.toFixed(6)}]` : 'null'
  });

  return (
    <DeliveryBoyTrackingComponent
      orderId={orderId}
      userLocation={targetLocation || undefined} // Pass target location as userLocation prop (can rename prop later for clarity, but this works for now)
      targetType={targetType} // Pass target type to handle marker icon
      orderInfo={orderInfo || undefined}
      onDeliveryComplete={() => {
        // Redirect to delivery boy dashboard or order history
        window.location.href = `/delivery/dashboard`;
      }}
    />
  );
};

export default DeliveryTracking;