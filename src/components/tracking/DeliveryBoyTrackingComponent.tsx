import React, { useEffect, useState, useRef } from 'react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { LiveTrackingMap } from '@/components/tracking/LiveTrackingMap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, Navigation, Phone, Pause, Play, CheckCircle, Send, Package, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import io from 'socket.io-client';
import { cn } from '@/lib/utils';

interface DeliveryTrackingProps {
  orderId: string;
  userLocation?: { latitude: number; longitude: number };
  targetType?: 'restaurant' | 'user'; // New prop
  orderInfo?: {
    customerName?: string;
    customerPhone?: string;
    deliveryAddress?: string;
    vehicleType?: string;
    vehicleNumber?: string;
    paymentMethod?: 'cod' | 'online' | 'upi' | 'card';
    paymentStatus?: 'paid' | 'unpaid' | 'pay_on_delivery' | 'cash_collected';
    totalAmount?: number;
    restaurantName?: string;
    restaurantAddress?: string;
  };
  onDeliveryComplete?: () => void;
}

interface DeliveryLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
  speed?: number;
  accuracy?: number;
}

const calculateSpeed = (
  prevLat: number,
  prevLon: number,
  currLat: number,
  currLon: number,
  timeDiffMs: number
): number => {
  if (timeDiffMs === 0) return 0;

  // Haversine formula
  const R = 6371000; // Earth radius in meters
  const dLat = (currLat - prevLat) * Math.PI / 180;
  const dLon = (currLon - prevLon) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(prevLat * Math.PI / 180) * Math.cos(currLat * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceMeters = R * c;

  const timeSeconds = timeDiffMs / 1000;
  return distanceMeters / timeSeconds; // m/s
};

export const DeliveryBoyTrackingComponent: React.FC<DeliveryTrackingProps> = ({
  orderId,
  userLocation,
  targetType = 'user', // Default to user for backward compatibility
  orderInfo,
  onDeliveryComplete
}) => {
  const { token: authToken } = useAuth();

  // Normalize API base URL to always include '/api'
  const API_BASE_URL = (() => {
    const base = import.meta.env.VITE_API_URL as string | undefined;
    if (!base) return 'http://localhost:5000/api';
    return base.endsWith('/api') ? base : `${base}/api`;
  })();

  const getAuthToken = (): string | null => {
    if (authToken) return authToken as string;
    const quick = localStorage.getItem('quickeats_auth');
    if (quick) {
      try { return JSON.parse(quick).token; } catch { /* ignore */ }
    }
    const storedAuth = localStorage.getItem('quickeats_auth');
    if (storedAuth) {
      try { return JSON.parse(storedAuth).token; } catch { /* ignore */ }
    }
    return null;
  };
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [deliveryLocations, setDeliveryLocations] = useState<DeliveryLocation[]>([]);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showOTPDialog, setShowOTPDialog] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [isSubmittingOTP, setIsSubmittingOTP] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [isRequestingOTP, setIsRequestingOTP] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [gpsQuality, setGpsQuality] = useState<'high' | 'medium' | 'low'>('high');
  const [lastLocationTime, setLastLocationTime] = useState<number | null>(null);
  const { toast } = useToast();
  const socketRef = useRef<any>(null);
  const previousLocationRef = useRef<DeliveryLocation | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastEmitTimeRef = useRef<number>(0);
  const gpsRetryRef = useRef<number>(0);

  // COD State
  const [cashCollected, setCashCollected] = useState(false);
  const isCOD = orderInfo?.paymentMethod === 'cod';
  // If COD, require cash collection (unless already collected/paid)
  const requiresCashCollection = isCOD && orderInfo?.paymentStatus === 'pay_on_delivery';

  // Can proceed to delivery?
  // If NOT COD -> Always yes
  // If COD -> Only if cashCollected is true OR paymentStatus is already 'cash_collected'/'paid'
  const canMarkDelivered = !requiresCashCollection || cashCollected || orderInfo?.paymentStatus === 'cash_collected' || orderInfo?.paymentStatus === 'paid';

  // Debug prop changes
  useEffect(() => {
    console.log('📍 DeliveryBoyTrackingComponent state update:', {
      hasUserLocation: !!userLocation,
      userLat: userLocation?.latitude,
      userLng: userLocation?.longitude,
      isTracking,
      hasCurrentLocation: !!currentLocation,
      currentLat: currentLocation?.latitude,
      currentLng: currentLocation?.longitude,
      watchActive: watchIdRef.current !== null
    });
  }, [userLocation, isTracking, currentLocation]);

  console.log('🗺️ Passing to map:', {
    deliveryBoyLocation: currentLocation ? `[${currentLocation.latitude}, ${currentLocation.longitude}]` : 'null',
    destinationLocation: userLocation ? `[${userLocation.latitude}, ${userLocation.longitude}]` : 'null',
    targetType
  });

  // Auto-start GPS tracking on mount
  useEffect(() => {
    console.log('🚀 Mounting DeliveryBoyTrackingComponent, starting GPS...');
    handleStartTracking();

    return () => {
      handleStopTracking();
    };
  }, []);

  // Initialize socket connection
  useEffect(() => {
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
        token: getAuthToken() || ''
      }
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Delivery boy connected to tracking server');
      setIsConnected(true);
      // GPS tracking is now started independently on mount
    });

    socket.on('trackingStatusUpdate', (data: any) => {
      console.log('📦 Tracking status:', data);
      if (data.status === 'delivered') {
        setIsTracking(false);
        stopWatching();
        onDeliveryComplete?.();
      }
    });

    socket.on('error', (err: any) => {
      console.error('❌ Socket error:', err);
      setError('Connection error - attempting reconnection...');
    });

    socket.on('reconnecting', () => {
      console.warn('⚠️ Attempting to reconnect to tracking server...');
      setError('Reconnecting to tracking server...');
    });

    return () => {
      socket.disconnect();
    };
  }, [onDeliveryComplete]);

  // Start GPS tracking using watchPosition with fallback
  const handleStartTracking = () => {
    try {
      if (!navigator.geolocation) {
        setError('Geolocation is not supported by your browser');
        return;
      }

      setError(null);
      setIsTracking(true);

      // Use watchPosition for continuous streaming
      watchIdRef.current = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;

          console.log(
            `✅ GPS Update: [${latitude.toFixed(6)}, ${longitude.toFixed(6)}], Accuracy: ±${Math.round(accuracy)}m`
          );

          // Update GPS quality
          if (accuracy < 20) setGpsQuality('high');
          else if (accuracy < 50) setGpsQuality('medium');
          else setGpsQuality('low');

          setCurrentLocation({
            latitude,
            longitude,
            accuracy
          });
          setLastLocationTime(Date.now());

          // Emit location with battery & network status to Socket.IO server
          if (socketRef.current?.connected) {
            // Get device status
            const battery = await getBatteryStatus();
            const networkStatus = getNetworkStatus();

            const locationData = {
              orderId,
              latitude,
              longitude,
              accuracy,
              userId: socketRef.current.userId || 'delivery',
              timestamp: Date.now(),
              battery,
              networkStatus,
              deviceStatus: {
                battery,
                networkStatus,
                batteryLabel: battery ? `${battery}%` : 'Unknown',
                networkLabel: getNetworkLabel(networkStatus)
              }
            };

            // Emit location update
            if (socketRef.current && socketRef.current.connected) {
              socketRef.current.emit('updateLocation', locationData);
              console.log(`📡 Emitted updateLocation with tracking data:`, locationData);
            } else {
              console.warn('⚠️ Socket not connected, buffering location update...');
            }
          } else {
            console.warn('⚠️ Socket not connected, buffering location update...');
          }
        },
        (error) => {
          console.error('❌ Geolocation error:', error);
          let errorMessage = 'GPS error';

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Please enable location access.';
              setError(errorMessage);
              setIsTracking(false);
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable. Retrying...';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Retrying with lower accuracy...';
              // Fallback to lower accuracy
              if (gpsRetryRef.current < 3) {
                gpsRetryRef.current++;
                // Restart with lower accuracy
                if (watchIdRef.current !== null) {
                  navigator.geolocation.clearWatch(watchIdRef.current);
                }
                handleStartTracking();
              }
              break;
          }

          if (error.code !== error.TIMEOUT || gpsRetryRef.current >= 3) {
            setError(errorMessage);
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 1000
        }
      );

      console.log('🚀 Started GPS tracking with watchPosition, watch ID:', watchIdRef.current);
    } catch (err) {
      console.error('❌ Error starting tracking:', err);
      setError('Failed to start GPS tracking');
      setIsTracking(false);
    }
  };

  /**
   * Get device battery percentage
   */
  const getBatteryStatus = async (): Promise<number | undefined> => {
    try {
      // @ts-ignore - Battery API
      if (!navigator.getBattery) {
        return undefined;
      }
      // @ts-ignore
      const battery = await navigator.getBattery();
      return Math.round(battery.level * 100);
    } catch (error) {
      return undefined;
    }
  };

  /**
   * Get network connection status
   */
  const getNetworkStatus = (): string | undefined => {
    try {
      // @ts-ignore - Network Information API not in standard types
      const connection = navigator.connection ||
        // @ts-ignore
        navigator.mozConnection ||
        // @ts-ignore
        navigator.webkitConnection;

      if (!connection) return undefined;
      return connection.effectiveType || 'unknown';
    } catch (error) {
      return undefined;
    }
  };

  /**
   * Get human-readable network label
   */
  const getNetworkLabel = (
    status: string | undefined
  ): string => {
    switch (status) {
      case '2g':
        return '📶 2G (Slow)';
      case '3g':
        return '📶 3G (Fair)';
      case '4g':
        return '📶 4G (Good)';
      case '5g':
        return '📶 5G (Excellent)';
      default:
        return '📶 Network Unknown';
    }
  };

  /**
   * Stop watching (from useGeolocation hook)
   */
  const stopWatching = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      console.log('⛔ Stopped watching location');
    }
  };

  // Stop GPS tracking
  const handleStopTracking = () => {
    setIsTracking(false);

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      console.log('🛑 Stopped GPS watchPosition');
    }

    socketRef.current?.emit('unsubscribeFromTracking', { orderId });
    console.log('🛑 Stopped GPS tracking');
  };

  // Calculate speed when location updates
  useEffect(() => {
    if (!currentLocation) return;

    const newLocation: DeliveryLocation = {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      timestamp: Date.now(),
      speed: currentSpeed,
      accuracy: currentLocation.accuracy || 50
    };

    // Calculate speed from previous location
    if (previousLocationRef.current) {
      const timeDiff = newLocation.timestamp - previousLocationRef.current.timestamp;
      if (timeDiff > 1000) { // Only calculate if more than 1 second passed
        const speed = calculateSpeed(
          previousLocationRef.current.latitude,
          previousLocationRef.current.longitude,
          newLocation.latitude,
          newLocation.longitude,
          timeDiff
        );
        newLocation.speed = speed;
        setCurrentSpeed(speed);
      }
    }

    // Store location in history
    setDeliveryLocations(prev => [...prev, newLocation]);
    previousLocationRef.current = newLocation;
  }, [currentLocation]);

  // Calculate distance to target (restaurant or user)
  useEffect(() => {
    if (!currentLocation || !userLocation) return;

    const R = 6371; // km
    const dLat = (userLocation.latitude - currentLocation.latitude) * Math.PI / 180;
    const dLon = (userLocation.longitude - currentLocation.longitude) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(currentLocation.latitude * Math.PI / 180) *
      Math.cos(userLocation.latitude * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c;

    setDistance(dist);
  }, [currentLocation, userLocation]);

  // Handle Mark as Picked Up
  const handleMarkAsPickedUp = async () => {
    try {
      const token = getAuthToken();

      if (!token) {
        toast({
          title: 'Authentication Error',
          description: 'Please login again',
          variant: 'destructive'
        });
        return;
      }

      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/delivery-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'picked' })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update status');
      }

      toast({
        title: 'Order Picked Up! 🥡',
        description: 'Navigating to customer location...',
      });

      // Redirect to the normal tracking page (removes ?target=restaurant query params if any)
      window.location.href = `/delivery/tracking/${orderId}`;

    } catch (error: any) {
      console.error('Error marking as picked up:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update order status',
        variant: 'destructive'
      });
    }
  };

  // Handle Mark as Delivered - Request OTP
  const handleMarkAsDelivered = async () => {
    setIsRequestingOTP(true);
    try {
      const token = getAuthToken();

      if (!token) {
        toast({
          title: 'Authentication Error',
          description: 'Please login again',
          variant: 'destructive'
        });
        return;
      }

      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/delivery-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'delivered' })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to request OTP');
      }

      if (data.otpSent) {
        setOtpSent(true);
        setShowOTPDialog(true);
        toast({
          title: 'OTP Sent! 📧',
          description: 'An OTP has been sent to the customer\'s email. Please ask them for the code.',
        });
      }
    } catch (error: any) {
      console.error('Error requesting OTP:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send OTP',
        variant: 'destructive'
      });
    } finally {
      setIsRequestingOTP(false);
    }
  };

  // Handle OTP Verification
  const handleVerifyOTP = async () => {
    if (!otpInput || otpInput.length !== 6) {
      toast({
        title: 'Invalid OTP',
        description: 'Please enter a 6-digit OTP',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmittingOTP(true);
    try {
      const token = getAuthToken();

      if (!token) {
        toast({
          title: 'Authentication Error',
          description: 'Please login again',
          variant: 'destructive'
        });
        return;
      }

      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/verify-delivery-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ otp: otpInput })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid OTP');
      }

      // OTP verified successfully!
      toast({
        title: 'Delivery Completed! 🎉',
        description: 'Order marked as delivered. Your earnings have been updated.',
      });

      setShowOTPDialog(false);
      setIsTracking(false);
      stopWatching();

      // Call completion callback after a brief delay
      setTimeout(() => {
        onDeliveryComplete?.();
      }, 1500);

    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      toast({
        title: 'Verification Failed',
        description: error.message || 'Invalid OTP. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmittingOTP(false);
    }
  };

  // Handle Ring User
  const handleRingUser = () => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('ringCustomer', { orderId });
      toast({
        title: 'Ringing Customer 🔔',
        description: 'Sent a ring alert to the customer.',
      });
    } else {
      toast({
        title: 'Connection Error',
        description: 'Not connected to server. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="w-full min-h-[80vh] bg-gray-50 flex flex-col relative z-0 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b p-4 shadow-sm">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Delivery Tracking</h1>
          <p className="text-sm text-gray-600">Order #{orderId.slice(-8)}</p>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 max-w-6xl mx-auto w-full p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
          {/* Map */}
          <div className="lg:col-span-2 rounded-lg overflow-hidden shadow-lg bg-white h-[50vh] lg:h-auto relative">
            {/* GPS Waiting Overlay */}
            {isTracking && !currentLocation && (
              <div className="absolute inset-0 bg-black/50 z-[1000] flex flex-col items-center justify-center text-white p-4 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
                <p className="font-bold text-lg">Acquiring GPS Signal...</p>
                <p className="text-sm opacity-80">Please ensure location is enabled.</p>
                {error && <p className="text-red-300 mt-2 font-bold">Error: {error}</p>}
              </div>
            )}

            <div className="absolute top-4 right-4 z-[900] bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-blue-200">
              <span className="font-bold text-blue-800 flex items-center gap-2">
                {targetType === 'restaurant' ? '🏪 Heading to Pickup' : '📍 Heading to Delivery'}
              </span>
            </div>

            <LiveTrackingMap
              deliveryBoyLocation={
                currentLocation
                  ? {
                    latitude: currentLocation.latitude,
                    longitude: currentLocation.longitude,
                    timestamp: lastLocationTime || Date.now(),
                    speed: currentSpeed,
                    accuracy: currentLocation.accuracy || 50
                  }
                  : undefined
              }
              userLocation={
                userLocation
                  ? {
                    latitude: userLocation.latitude,
                    longitude: userLocation.longitude,
                    timestamp: Date.now()
                  }
                  : undefined
              }
              destinationType={targetType} // Pass targetType to LiveTrackingMap
              deliveryBoyName="Me"
              vehicleType={orderInfo?.vehicleType}
              vehicleNumber={orderInfo?.vehicleNumber}
              trackingActive={true}
            />
          </div>

          {/* Right sidebar - Delivery details */}
          <div className="flex flex-col gap-4">
            {/* Tracking status card */}
            <Card className="shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Delivery Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Tracking status */}
                <div className={`p-4 rounded-lg border-2 flex items-center justify-center gap-2 ${isTracking
                  ? 'bg-green-50 border-green-300'
                  : 'bg-gray-50 border-gray-300'
                  }`}>
                  <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                  <span className={`font-semibold ${isTracking ? 'text-green-700' : 'text-gray-700'}`}>
                    {isTracking ? 'Tracking Active' : 'Tracking Inactive'}
                  </span>
                </div>

                {/* Start/Stop button */}
                <div className="flex gap-2">
                  {!isTracking ? (
                    <Button
                      onClick={handleStartTracking}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      disabled={currentLocation === null}
                    >
                      <Play size={16} className="mr-2" />
                      Start Delivery
                    </Button>
                  ) : (
                    <Button
                      onClick={handleStopTracking}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Pause size={16} className="mr-2" />
                      Stop Tracking
                    </Button>
                  )}
                </div>

                {/* COD Cash Collection Section */}
                {requiresCashCollection && !cashCollected && orderInfo?.paymentStatus !== 'paid' && (
                  <Card className="border-red-500 bg-red-50 mb-3 animate-in fade-in slide-in-from-bottom-2">
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-red-700 font-bold">
                          <AlertCircle className="w-5 h-5" />
                          <span>Collect Cash: ₹{orderInfo?.totalAmount?.toFixed(2)}</span>
                        </div>
                        <p className="text-sm text-red-600">You must collect cash from the customer before completing delivery.</p>
                        <Button
                          className="w-full bg-red-600 hover:bg-red-700 text-white"
                          onClick={() => setCashCollected(true)}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          I have collected ₹{orderInfo?.totalAmount?.toFixed(2)}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Mark as Delivered/Picked Up Button */}
                {isTracking && (
                  <div className="space-y-2">
                    {targetType === 'user' ? (
                      <>
                        {cashCollected && requiresCashCollection && (
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm mb-2">
                            <CheckCircle className="w-4 h-4" />
                            <span>Cash collected! You can now complete delivery.</span>
                          </div>
                        )}

                        <div className="flex gap-2 w-full">
                          <Button
                            onClick={handleMarkAsDelivered}
                            disabled={isRequestingOTP || !currentLocation || !canMarkDelivered}
                            className={`flex-1 font-semibold ${!canMarkDelivered
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-orange-600 hover:bg-orange-700 text-white'
                              }`}
                          >
                            <CheckCircle size={18} className="mr-2" />
                            {isRequestingOTP ? 'Sending OTP...' : 'Mark as Delivered'}
                          </Button>

                          <Button
                            onClick={handleRingUser}
                            variant="outline"
                            className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 flex-shrink-0"
                            title="Ring Customer"
                          >
                            <Bell size={20} />
                          </Button>
                        </div>

                        {!canMarkDelivered && (
                          <p className="text-xs text-center text-red-500 font-medium">
                            * Collect cash to enable delivery
                          </p>
                        )}
                      </>
                    ) : (
                      <Button
                        onClick={handleMarkAsPickedUp}
                        disabled={!currentLocation}
                        className="w-full font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Package size={18} className="mr-2" />
                        Mark as Picked Up
                      </Button>
                    )}
                  </div>
                )}

                {/* Distance and speed */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-blue-50 p-3 rounded border border-blue-200">
                    <p className="text-xs text-gray-600">Distance</p>
                    <p className="text-lg font-bold text-blue-600">{distance.toFixed(2)} km</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded border border-purple-200">
                    <p className="text-xs text-gray-600">Speed</p>
                    <p className="text-lg font-bold text-purple-600">{Math.round(currentSpeed * 3.6)} km/h</p>
                  </div>
                </div>

                {/* Current location */}
                {currentLocation && (
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="flex items-start gap-2">
                      <Navigation size={16} className="text-gray-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-600">Current Location</p>
                        <p className="text-sm font-mono text-gray-800">
                          {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Accuracy: ±{Math.round(currentLocation.accuracy || 50)}m</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Location history */}
                <div className="bg-amber-50 p-3 rounded border border-amber-200">
                  <p className="text-xs text-gray-600">Location Updates</p>
                  <p className="text-lg font-bold text-amber-600">{deliveryLocations.length}</p>
                </div>
              </CardContent>
            </Card>

            {/* Error messages */}
            {error && (
              <Card className="border-red-300 bg-red-50">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-2 text-red-700">
                    <AlertCircle size={16} className="flex-shrink-0 mt-1" />
                    <div className="text-sm">
                      <p>{error}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Delivery Destination info */}
            {orderInfo && (
              <Card className="border border-blue-200 bg-blue-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {targetType === 'restaurant' ? 'Restaurant Pickup' : 'Customer Delivery'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-blue-900">
                  {targetType === 'restaurant' ? (
                    <>
                      <div className="font-semibold">{orderInfo.restaurantName || 'Restaurant'}</div>
                      {orderInfo.restaurantAddress && (
                        <div className="text-xs text-blue-800 flex items-start gap-2 mt-2">
                          <Navigation className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>{orderInfo.restaurantAddress}</span>
                        </div>
                      )}
                      <div className="mt-3 p-3 bg-blue-100 rounded-md text-xs font-medium text-blue-800">
                        Please head to the restaurant to collect the order. Customer details will be revealed once you are out for delivery.
                      </div>
                    </>
                  ) : (
                    <>
                      {orderInfo.customerName && (
                        <div className="font-semibold">{orderInfo.customerName}</div>
                      )}

                      {/* Payment Status Badge */}
                      <div className="flex items-center gap-2 mt-1 mb-2">
                        <Badge variant={orderInfo.paymentMethod === 'cod' ? "destructive" : "default"} className={orderInfo.paymentMethod === 'cod' ? "bg-orange-100 text-orange-700 border-orange-200" : "bg-green-100 text-green-700 border-green-200 hover:bg-green-100"}>
                          {orderInfo.paymentMethod === 'cod' ? 'CASH ON DELIVERY' : 'ONLINE PAYMENT'}
                        </Badge>
                        <Badge variant="outline" className={cn(
                          "border-opacity-50",
                          orderInfo.paymentStatus === 'paid' ? "text-green-600 border-green-600" :
                            orderInfo.paymentStatus === 'pay_on_delivery' ? "text-red-500 border-red-500 animate-pulse" : "text-gray-500"
                        )}>
                          {orderInfo.paymentStatus === 'paid' ? 'PAID' :
                            orderInfo.paymentStatus === 'cash_collected' ? 'CASH COLLECTED' :
                              'PAY ON DELIVERY'}
                        </Badge>
                      </div>

                      {orderInfo.paymentMethod === 'cod' && orderInfo.paymentStatus !== 'paid' && orderInfo.paymentStatus !== 'cash_collected' && (
                        <div className="p-2 bg-red-50 border border-red-100 rounded text-red-600 text-xs font-bold text-center mb-2">
                          COLLECT: ₹{orderInfo.totalAmount?.toFixed(2)}
                        </div>
                      )}

                      {orderInfo.customerPhone && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start mt-2 border-blue-200 hover:bg-blue-100"
                          asChild
                        >
                          <a href={`tel:${orderInfo.customerPhone}`} className="flex items-center gap-2">
                            <Phone size={14} />
                            {orderInfo.customerPhone}
                          </a>
                        </Button>
                      )}

                      {orderInfo.deliveryAddress && (
                        <div className="text-xs text-blue-800 flex items-start gap-2 mt-3 p-2 bg-white/50 rounded border border-blue-100">
                          <Navigation className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>{orderInfo.deliveryAddress}</span>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Instructions */}
            {!isTracking && (
              <Card className="border-blue-300 bg-blue-50">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-2 text-blue-700">
                    <AlertCircle size={16} className="flex-shrink-0 mt-1" />
                    <div className="text-sm">
                      <p className="font-semibold mb-1">Ready to start delivery?</p>
                      <p>Click "Start Delivery" to begin live tracking. Your location will be updated every few seconds.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* OTP Verification Dialog */}
      <Dialog open={showOTPDialog} onOpenChange={setShowOTPDialog}>
        <DialogContent className="sm:max-w-md z-[100]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="text-orange-600" size={24} />
              Verify Delivery
            </DialogTitle>
            <DialogDescription className="text-sm space-y-2 pt-2">
              <p>An OTP has been sent to the customer's email address.</p>
              <p className="font-semibold text-orange-600">Please ask the customer for the 6-digit OTP code.</p>
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-2">
              <label htmlFor="otp-input" className="text-sm font-medium text-gray-700">
                Enter OTP
              </label>
              <Input
                id="otp-input"
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otpInput}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtpInput(value);
                }}
                maxLength={6}
                className="text-center text-2xl tracking-widest font-bold"
                autoFocus
              />
              <p className="text-xs text-gray-500 text-center">
                Valid for 10 minutes
              </p>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowOTPDialog(false);
                setOtpInput('');
              }}
              disabled={isSubmittingOTP}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleVerifyOTP}
              disabled={isSubmittingOTP || otpInput.length !== 6}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isSubmittingOTP ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Verifying...
                </>
              ) : (
                <>
                  <Send size={16} className="mr-2" />
                  Verify & Complete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
