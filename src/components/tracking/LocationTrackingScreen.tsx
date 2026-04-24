import React, { useEffect, useState, useRef } from 'react';
import { useAutoLocation } from '@/hooks/useAutoLocation';
import { LiveTrackingMap } from '@/components/tracking/LiveTrackingMap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Navigation, MapPin, Clock, Volume2, Bell } from 'lucide-react';
import io from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import ringAudio from '@/assets/ring.mp3';

interface OrderTrackingData {
  orderId: string;
  deliveryBoyId: string;
  deliveryBoyName: string;
  deliveryBoyPhone: string;
  vehicleType: string;
  vehicleNumber: string;
  restaurantName: string;
  deliveryAddress: string;
  estimatedTime?: number;
}

interface DeliveryLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
  speed?: number;
  accuracy?: number;
}

interface LocationTrackingScreenProps {
  orderId: string;
  onTrackingComplete?: () => void;
  // Optional pre-fetched order (e.g., activeOrder) to avoid auth edge cases when refetching
  prefetchedOrder?: any;
}

const SPEED_TO_ETA = (distanceKm: number, speedMps: number): number => {
  if (speedMps < 1) return distanceKm * 60 / 15; // Assume 15 km/h if no speed
  const speedKmh = speedMps * 3.6;
  return (distanceKm / speedKmh) * 60; // Minutes
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

import { geocodeAddress } from '@/utils/mapUtils';

export const LocationTrackingScreen: React.FC<LocationTrackingScreenProps> = ({
  orderId,
  onTrackingComplete,
  prefetchedOrder
}) => {
  // FIXED: Don't use auto-location for the map pin. Use the delivery address.
  const { location: liveUserLocation, error: autoLocationError } = useAutoLocation();

  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [orderData, setOrderData] = useState<OrderTrackingData | null>(null);
  const [deliveryBoyLocation, setDeliveryBoyLocation] = useState<DeliveryLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [distance, setDistance] = useState<number>(0);
  const [eta, setEta] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(0);
  const [orderStatus, setOrderStatus] = useState<string>('');
  const socketRef = useRef<any>(null);
  const { token: authToken, user } = useAuth();
  const { toast } = useToast();

  // Use autoLocationError if userLocation is not set, just to show something if needed,
  // but better to rely on order data error.
  // We'll map it to a local var to avoid lint errors if we want to show it.
  const locationError = autoLocationError;

  const getAuthToken = () => {
    if (authToken) return authToken;

    const storageKeys = ['quickeats_auth'];
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

  const getUserId = () => {
    if (user?.id) return user.id;

    const storageKeys = ['quickeats_auth'];
    for (const key of storageKeys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      try {
        const parsed = JSON.parse(raw);
        if (parsed.user?.id) return parsed.user.id as string;
      } catch (e) {
        console.error(`Failed to parse user data from ${key}:`, e);
      }
    }

    return null;
  };

  // Define fetchOrderData outside useEffect so it can be called from socket listeners
  const fetchOrderData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 Prefetched order available:', !!prefetchedOrder);

      // Seed state from prefetched order (activeOrder) to avoid auth edge cases
      if (prefetchedOrder) {
        const preStatus = prefetchedOrder.status || prefetchedOrder.deliveryStatus || '';
        setOrderStatus(preStatus);

        const deliveryBoyPre = prefetchedOrder.deliveryPartner || prefetchedOrder.deliveryBoy;
        if (deliveryBoyPre) {
          setOrderData({
            orderId: prefetchedOrder.id || prefetchedOrder._id || orderId,
            deliveryBoyId: deliveryBoyPre._id || deliveryBoyPre.id || '',
            deliveryBoyName: deliveryBoyPre.user?.name || deliveryBoyPre.name || 'Delivery Boy',
            deliveryBoyPhone: deliveryBoyPre.user?.phone || deliveryBoyPre.phone || '',
            vehicleType: deliveryBoyPre.vehicleType || 'Bike',
            vehicleNumber: deliveryBoyPre.licenseNumber || deliveryBoyPre.vehicleNumber || 'N/A',
            restaurantName: prefetchedOrder.restaurantName || prefetchedOrder.restaurant?.name || 'Restaurant',
            deliveryAddress: prefetchedOrder.deliveryAddress || 'Your location'
          });
        }
      }

      const token = getAuthToken();

      // Normalize API base from env
      const envApi = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const apiBase = envApi.replace(/\/$/, '').endsWith('/api') ? envApi.replace(/\/$/, '') : `${envApi.replace(/\/$/, '')}/api`;

      console.log(`📡 Fetching order data for orderId: ${orderId}`);
      const response = await fetch(`${apiBase}/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log(`📡 Response status: ${response.status}`);

      if (!response.ok) {
        // If we already set state from prefetched order, keep UI working
        if (response.status === 403 && prefetchedOrder) {
          console.warn('⚠️ API 403 - using prefetched order data');
          setIsLoading(false);
          setError(null);
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API Error:', errorData);
        throw new Error(`Failed to fetch order data: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📦 Order data received:', data);
      console.log('✅ Delivery Boy info:', {
        hasDeliveryBoy: !!data.deliveryBoy,
        deliveryBoyName: data.deliveryBoy?.user?.name || data.deliveryBoy?.name,
        deliveryBoyPhone: data.deliveryBoy?.user?.phone || data.deliveryBoy?.phone
      });

      // Set order status
      setOrderStatus(data.status || data.deliveryStatus || '');
      console.log('📋 Order status:', data.status, '| Delivery status:', data.deliveryStatus);

      const deliveryBoy = data.deliveryBoy;

      if (deliveryBoy) {
        console.log('🎉 Delivery boy found! Setting order data...');
        setOrderData({
          orderId: data._id,
          deliveryBoyId: deliveryBoy._id || deliveryBoy.id || '',
          deliveryBoyName: deliveryBoy.user?.name || deliveryBoy.userName || deliveryBoy.name || 'Delivery Boy',
          deliveryBoyPhone: deliveryBoy.user?.phone || deliveryBoy.userPhone || deliveryBoy.phone || '',
          vehicleType: deliveryBoy.vehicleType || 'Bike',
          vehicleNumber: deliveryBoy.licenseNumber || deliveryBoy.vehicleNumber || 'N/A',
          restaurantName: data.restaurant?.name || 'Restaurant',
          deliveryAddress: data.deliveryAddress || 'Your location'
        });
        setError(null);
      } else {
        console.warn('⚠️ No delivery boy assigned yet');
        setOrderData(null);
        setError('Delivery boy not yet assigned. Please wait...');
      }
    } catch (err) {
      console.error('❌ Error fetching order:', err);
      setError(`Error: ${err instanceof Error ? err.message : 'Could not fetch order information'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Geocode delivery address when orderData is available
  useEffect(() => {
    const setBestLocation = async () => {
      // PRIORITY 1: Live Location (if available) - This fixes the distance issue
      if (liveUserLocation) {
        console.log('📍 Using LIVE user location for tracking:', liveUserLocation);
        setUserLocation({
          latitude: liveUserLocation.latitude,
          longitude: liveUserLocation.longitude
        });
        return; // Stop here, we have the best location
      }

      // PRIORITY 2: Geocoded Delivery Address (Fallback)
      if (orderData?.deliveryAddress) {
        // Check if it's "Your location" which might imply we should use live location
        if (orderData.deliveryAddress === 'Your location' && liveUserLocation) {
          setUserLocation({
            latitude: liveUserLocation.latitude,
            longitude: liveUserLocation.longitude
          });
          return;
        }

        const coords = await geocodeAddress(orderData.deliveryAddress);
        if (coords) {
          console.log('📍 Geocoded delivery address (Fallback):', coords);
          setUserLocation({
            latitude: coords.lat,
            longitude: coords.lng
          });
        }
      }
    };

    setBestLocation();
  }, [orderData?.deliveryAddress, liveUserLocation]);

  // Initialize socket connection and fetch order data
  useEffect(() => {
    const token = getAuthToken();



    // Determine socket URL from env or window location
    const getSocketUrl = () => {
      const envUrl = import.meta.env.VITE_API_URL;
      if (envUrl) {
        return envUrl.replace(/\/api$/, '').replace(/\/$/, '');
      }
      return window.location.origin.replace(/:\d+$/, ':5000'); // Fallback to port 5000 on same host
    };

    const socketUrl = getSocketUrl();
    console.log('🔌 Connecting to socket at:', socketUrl);

    const socket = io(socketUrl, {
      auth: {
        token
      }
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Connected to tracking server');

      // Join user-specific room to receive deliveryBoyAssigned events
      const userId = getUserId();
      if (userId) {
        socket.emit('joinUserRoom', { userId });
        console.log(`📍 Joined user room: user_${userId}`);
      }

      // Join order room for live tracking
      socket.emit('subscribeToLiveTracking', { orderId }, (response: any) => {
        console.log('📍 Subscribed to order tracking:', response);
      });

      console.log(`✅ User ready to receive delivery boy location updates for order_${orderId}`);
    });

    // Listen for delivery boy location updates (Unified event from server)
    socket.on('updateDeliveryLocation', (data: any) => {
      console.log('📍 updateDeliveryLocation received:', {
        orderId: data.orderId,
        deliveryBoyId: data.deliveryBoyId,
        lat: data.latitude,
        lng: data.longitude,
        matchesOrderId: data.orderId === orderId
      });

      if (data.orderId === orderId) {
        // IGNORE own location updates (echoed by server)
        const myUserId = getUserId();
        if (data.role === 'user' || data.deliveryBoyId === myUserId) {
          return;
        }

        const newLocation: DeliveryLocation = {
          latitude: data.latitude,
          longitude: data.longitude,
          timestamp: data.timestamp ? new Date(data.timestamp).getTime() : Date.now(),
          speed: data.speed || 0,
          accuracy: data.accuracy || 50
        };
        setDeliveryBoyLocation(newLocation);

        if (data.speed !== undefined) {
          setSpeed(data.speed);
        }
      }
    });

    socket.on('trackingSubscribed', (data: any) => {
      console.log('✅ Tracking subscription confirmed:', data);
    });

    // Listen for delivery boy assignment (when delivery boy accepts the order)
    socket.on('deliveryBoyAssigned', (data: any) => {
      console.log('🎉 Delivery boy assigned to order:', data);
      // Trigger a re-fetch of order data to show delivery boy info
      fetchOrderData();
    });

    // Listen for order status updates (including delivered status)
    socket.on('orderStatusUpdate', (data: any) => {
      console.log('📦 Order status update received:', data);
      if (data.orderId === orderId || data.orderId?._id === orderId) {
        setOrderStatus(data.status);

        // Refetch order data to ensure UI is in sync
        fetchOrderData();

        if (data.status === 'delivered') {
          console.log('✅ Order delivered! Calling onTrackingComplete...');
          // Give user time to see the status before redirecting
          setTimeout(() => {
            onTrackingComplete?.();
          }, 3000); // Increased to 3 seconds for better UX
        }
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
    });

    return () => {
      socket.disconnect();
    };
  }, [orderId]);

  // Fetch order data on mount
  useEffect(() => {
    if (orderId) {
      fetchOrderData();
    }
  }, [orderId]);

  // Calculate distance and ETA
  useEffect(() => {
    if (userLocation && deliveryBoyLocation) {
      const dist = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        deliveryBoyLocation.latitude,
        deliveryBoyLocation.longitude
      );
      setDistance(dist);

      const calculatedEta = SPEED_TO_ETA(dist, speed);
      // Cap at 25 minutes as per requirements
      setEta(Math.min(25, Math.max(1, Math.round(calculatedEta))));
    }
  }, [userLocation, deliveryBoyLocation, speed]);

  // Send user location updates to delivery boy via socket
  useEffect(() => {
    // ENABLED: Send live user location updates to ensure accurate distance
    // The delivery boy should routed to the Order Address essentially, 
    // but for "Live Tracking" feature we want to show where the user actually is.

    if (!userLocation || !socketRef.current || !socketRef.current.connected) {
      /* console.log('⚠️ Cannot send location:', {
        hasLocation: !!userLocation,
        hasSocket: !!socketRef.current,
        isConnected: socketRef.current?.connected
      }); */
      return;
    }

    const locationData = {
      orderId,
      userId: getUserId() || 'user',
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      accuracy: 50, // Default accuracy
      timestamp: Date.now()
    };

    // Emit unified location event
    socketRef.current.emit('updateLocation', locationData);

    // console.log(`📍 User location sent via updateLocation:`, locationData);
  }, [userLocation, orderId]);

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading tracking information...</p>
        </div>
      </div>
    );
  }

  // Show delivered status if order is delivered
  if (orderStatus === 'delivered') {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <Card className="w-full max-w-md shadow-2xl border-green-200">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="mb-6">
              <div className="w-24 h-24 bg-green-500 rounded-full mx-auto flex items-center justify-center animate-bounce">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-3">Order Delivered! 🎉</h2>
            <p className="text-gray-600 mb-2">Your order has been successfully delivered.</p>
            <p className="text-sm text-gray-500 mb-6">Thank you for ordering with QuickEats!</p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-xs text-gray-600 mb-1">Order ID</p>
              <p className="text-lg font-bold text-green-700">#{orderId.slice(-8)}</p>
            </div>
            <button
              onClick={() => window.location.href = '/user/orders'}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors mb-2"
            >
              View Order History
            </button>
            <button
              onClick={() => window.location.href = '/user/feedback'}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Leave a Review
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show cancelled status if order is cancelled
  if (orderStatus === 'cancelled') {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <Card className="w-full max-w-md shadow-2xl border-red-200">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="mb-6">
              <div className="w-24 h-24 bg-red-100 rounded-full mx-auto flex items-center justify-center">
                <span className="text-4xl">❌</span>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-3">Order Cancelled</h2>
            <p className="text-red-600 font-semibold mb-2">your order is cancelled by the restaurent owner</p>
            <p className="text-sm text-gray-500 mb-6">We apologize for the inconvenience.</p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-xs text-red-600 mb-1">Order ID</p>
              <p className="text-lg font-bold text-red-700">#{orderId.slice(-8)}</p>
            </div>
            <button
              onClick={() => window.location.href = '/user/orders'}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors mb-2"
            >
              View Order History
            </button>
            <button
              onClick={() => window.location.href = '/user/dashboard'}
              className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Return Home
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b p-4 shadow-sm">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Live Delivery Tracking</h1>
          <p className="text-sm text-gray-600">Order #{orderId.slice(-8)}</p>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 max-w-6xl mx-auto w-full p-4">
        {!orderData ? (
          <div className="w-full h-full flex items-center justify-center">
            <Card className="w-full max-w-md">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center mb-4">
                  <Clock size={48} className="text-orange-500 animate-spin" />
                </div>
                <h2 className="text-lg font-semibold text-center mb-2">Waiting for Delivery Boy</h2>
                <p className="text-center text-gray-600 text-sm mb-4">
                  Your delivery boy will be assigned shortly. You'll be able to track their location in real-time once they accept your order.
                </p>
                {error && (
                  <div className="bg-orange-50 p-3 rounded border border-orange-200 text-sm text-orange-800">
                    {error}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
            {/* Map */}
            <div className="lg:col-span-2 rounded-lg overflow-hidden shadow-lg bg-white h-[50vh] lg:h-auto">
              <LiveTrackingMap
                userLocation={
                  userLocation
                    ? {
                      latitude: userLocation.latitude,
                      longitude: userLocation.longitude,
                      timestamp: Date.now(),
                      accuracy: 50
                    }
                    : undefined
                }
                deliveryBoyLocation={deliveryBoyLocation || undefined}
                deliveryBoyName={orderData?.deliveryBoyName}
                vehicleType={orderData?.vehicleType}
                vehicleNumber={orderData?.vehicleNumber}
                trackingActive={!!orderData}
              />
            </div>

            {/* Right sidebar - Order details */}
            <div className="flex flex-col gap-4">
              {/* Delivery info card */}
              <Card className="shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Delivery Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Delivery boy */}
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                        🏍️
                      </div>
                      <div>
                        <p className="font-bold text-sm">{orderData.deliveryBoyName}</p>
                        <p className="text-xs text-gray-600">{orderData.vehicleType} • {orderData.vehicleNumber}</p>
                      </div>
                    </div>
                    {orderData.deliveryBoyPhone && (
                      <a
                        href={`tel:${orderData.deliveryBoyPhone}`}
                        className="w-full block mt-2 bg-green-500 hover:bg-green-600 text-white text-sm py-2 rounded text-center"
                      >
                        Call Delivery Boy
                      </a>
                    )}
                  </div>

                  {/* Distance and ETA */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-blue-50 p-2 rounded border border-blue-200">
                      <p className="text-xs text-gray-600">Distance</p>
                      <p className="text-lg font-bold text-blue-600">{distance.toFixed(1)} km</p>
                    </div>
                    <div className="bg-orange-50 p-2 rounded border border-orange-200">
                      <p className="text-xs text-gray-600">ETA</p>
                      <p className="text-lg font-bold text-orange-600">{eta} min</p>
                    </div>
                  </div>

                  {/* Speed */}
                  <div className="bg-purple-50 p-3 rounded border border-purple-200">
                    <div className="flex items-center gap-2">
                      <Navigation size={16} className="text-purple-600" />
                      <span className="text-sm text-gray-600">Current Speed</span>
                    </div>
                    <p className="text-lg font-bold text-purple-600 mt-1">{Math.round(speed * 3.6)} km/h</p>
                  </div>

                  {/* Delivery address */}
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="flex items-start gap-2">
                      <MapPin size={16} className="text-gray-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-600">Delivery Address</p>
                        <p className="text-sm font-semibold text-gray-800">{orderData.deliveryAddress}</p>
                      </div>
                    </div>
                  </div>

                  {/* Restaurant */}
                  <div className="bg-amber-50 p-3 rounded border border-amber-200">
                    <p className="text-xs text-gray-600">From Restaurant</p>
                    <p className="text-sm font-semibold text-amber-900">{orderData.restaurantName}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Status badge */}
              <div className="flex items-center justify-center gap-2 bg-green-100 p-3 rounded-lg border border-green-300">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-semibold text-green-800">Live Tracking Active</span>
              </div>

              {/* Error messages */}
              {(locationError || error) && (
                <Card className="border-red-300 bg-red-50">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-2 text-red-700">
                      <AlertCircle size={16} className="flex-shrink-0 mt-1" />
                      <div className="text-sm">
                        {locationError && <p>{locationError}</p>}
                        {error && <p>{error}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
