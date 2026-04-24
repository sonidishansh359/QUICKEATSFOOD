/**
 * Complete Location System Integration Examples
 * Shows how to integrate the location system into your app
 */

import React, { useEffect, useState } from 'react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { LiveLocationDisplay } from '@/components/location/LiveLocationDisplay';
import { NearbyRestaurants } from '@/components/location/NearbyRestaurants';
import { DeliveryBoyTracker } from '@/components/location/DeliveryBoyTracker';
import locationService from '@/lib/locationService';
import locationSocketService from '@/lib/locationSocket';

/**
 * ==========================================
 * EXAMPLE 1: USER MODULE INTEGRATION
 * ==========================================
 */

export function UserDashboardExample() {
  const { location, isWatching } = useGeolocation(true);
  const [restaurants, setRestaurants] = useState([]);

  useEffect(() => {
    if (location) {
      // Update backend with user location
      locationService.updateUserLocation({
        latitude: location.latitude,
        longitude: location.longitude,
        address: 'My Current Location'
      }).catch(err => console.error('Failed to update location:', err));
    }
  }, [location]);

  const handleRestaurantSelect = (restaurant) => {
    console.log('Selected:', restaurant.name);
    // Navigate to restaurant menu
  };

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold">User Dashboard</h1>

      {/* Show live location */}
      <LiveLocationDisplay 
        autoStart={true}
        showRefresh={true}
      />

      {/* Show nearby restaurants */}
      <NearbyRestaurants
        radius={5}
        autoLoad={location !== null}
        onSelectRestaurant={handleRestaurantSelect}
      />

      {/* Status */}
      <div className="p-3 bg-blue-50 rounded">
        <p className="text-sm">
          Location Tracking: <span className="font-bold text-green-600">{isWatching ? 'Active' : 'Inactive'}</span>
        </p>
      </div>
    </div>
  );
}


/**
 * ==========================================
 * EXAMPLE 2: OWNER MODULE INTEGRATION
 * ==========================================
 */

export function OwnerDashboardExample() {
  const [ownerLocation, setOwnerLocation] = useState(null);
  const [restaurants, setRestaurants] = useState([]);

  const handleUpdateOwnerLocation = async (lat, lng) => {
    try {
      const result = await locationService.updateOwnerLocation({
        latitude: lat,
        longitude: lng,
        address: 'Restaurant Location'
      });
      setOwnerLocation(result);
      console.log('✅ Owner location updated');
    } catch (error) {
      console.error('❌ Failed to update owner location:', error);
    }
  };

  const handleUpdateRestaurantLocation = async (restaurantId, lat, lng) => {
    try {
      const result = await locationService.updateRestaurantLocation(restaurantId, {
        latitude: lat,
        longitude: lng
      });
      console.log('✅ Restaurant location updated');
    } catch (error) {
      console.error('❌ Failed to update restaurant location:', error);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold">Owner Dashboard</h1>

      {/* Owner Live Location */}
      <div className="bg-white p-4 rounded border">
        <h2 className="text-lg font-semibold mb-3">Your Location</h2>
        <LiveLocationDisplay 
          autoStart={true}
          onLocationChange={(loc) => handleUpdateOwnerLocation(loc.latitude, loc.longitude)}
        />
      </div>

      {/* Manage Restaurants */}
      <div className="bg-white p-4 rounded border">
        <h2 className="text-lg font-semibold mb-3">Manage Restaurants</h2>
        {restaurants.map(restaurant => (
          <div key={restaurant.id} className="p-3 border rounded mb-2">
            <p className="font-semibold">{restaurant.name}</p>
            <p className="text-sm text-gray-600">{restaurant.address}</p>
          </div>
        ))}
      </div>
    </div>
  );
}


/**
 * ==========================================
 * EXAMPLE 3: DELIVERY BOY MODULE INTEGRATION
 * ==========================================
 */

export function DeliveryBoyAppExample() {
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [isOnline, setIsOnline] = useState(false);

  const { location, isWatching, startWatching, stopWatching } = useGeolocation(false);

  // Start tracking when delivery boy goes online
  const handleGoOnline = async () => {
    startWatching();
    setIsOnline(true);
    console.log('🟢 Delivery boy online');
  };

  const handleGoOffline = () => {
    stopWatching();
    setIsOnline(false);
    console.log('🔴 Delivery boy offline');
  };

  // Update location continuously
  useEffect(() => {
    if (!location || !isOnline) return;

    const updateInterval = setInterval(async () => {
      try {
        await locationService.updateDeliveryBoyLocation({
          latitude: location.latitude,
          longitude: location.longitude,
          address: 'Delivery In Progress'
        });

        // Also send via Socket.io for real-time updates
        if (currentOrderId) {
          locationSocketService.sendDeliveryBoyLocationUpdate(
            {
              latitude: location.latitude,
              longitude: location.longitude
            },
            currentOrderId
          );
        }
      } catch (error) {
        console.error('Failed to update location:', error);
      }
    }, 5000); // Update every 5 seconds

    return () => clearInterval(updateInterval);
  }, [location, isOnline, currentOrderId]);

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold">Delivery Boy App</h1>

      {/* Status */}
      <div className={`p-4 rounded text-white ${isOnline ? 'bg-green-600' : 'bg-red-600'}`}>
        <p className="text-lg font-bold">
          Status: {isOnline ? '🟢 Online' : '🔴 Offline'}
        </p>
      </div>

      {/* Online/Offline Toggle */}
      <div className="flex gap-2">
        <button
          onClick={handleGoOnline}
          disabled={isOnline}
          className="flex-1 py-2 bg-green-600 text-white rounded disabled:opacity-50"
        >
          Go Online
        </button>
        <button
          onClick={handleGoOffline}
          disabled={!isOnline}
          className="flex-1 py-2 bg-red-600 text-white rounded disabled:opacity-50"
        >
          Go Offline
        </button>
      </div>

      {/* Live Location while online */}
      {isOnline && (
        <div className="bg-blue-50 p-4 rounded">
          <p className="text-sm font-semibold mb-2">🗺️ Live Location (Updating every 5s)</p>
          {location && (
            <>
              <p>Lat: {location.latitude.toFixed(4)}</p>
              <p>Lng: {location.longitude.toFixed(4)}</p>
            </>
          )}
        </div>
      )}

      {/* Current Order */}
      <div className="bg-white p-4 rounded border">
        <p className="font-semibold mb-2">Current Order</p>
        <input
          type="text"
          placeholder="Order ID"
          value={currentOrderId}
          onChange={(e) => setCurrentOrderId(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>
    </div>
  );
}


/**
 * ==========================================
 * EXAMPLE 4: CUSTOMER ORDER TRACKING
 * ==========================================
 */

export function OrderTrackingExample() {
  const [orderId] = useState('order123');

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold">Order Tracking</h1>

      {/* Order Details */}
      <div className="bg-white p-4 rounded border">
        <h2 className="font-semibold mb-2">Order #{orderId}</h2>
        <p>Status: <span className="text-blue-600 font-semibold">Out for Delivery</span></p>
        <p>Estimated Time: 10 minutes</p>
      </div>

      {/* Delivery Boy Tracking */}
      <DeliveryBoyTracker 
        orderId={orderId}
        isOpen={true}
      />

      {/* Estimated Arrival */}
      <div className="bg-green-50 p-4 rounded border border-green-200">
        <p className="font-semibold text-green-800">✓ Estimated Delivery: 7:30 PM</p>
      </div>
    </div>
  );
}


/**
 * ==========================================
 * EXAMPLE 5: SOCKET.IO INITIALIZATION
 * ==========================================
 */

export function AppInitializationExample() {
  useEffect(() => {
    const initializeLocationSystem = async () => {
      // Get auth token from your auth context/store
      const token = localStorage.getItem('auth_token');
      const userId = localStorage.getItem('user_id');
      const userRole = localStorage.getItem('user_role');

      if (!token || !userId) {
        console.warn('⚠️ Auth credentials not found');
        return;
      }

      try {
        // Set token for API calls
        locationService.setToken(token);

        // Connect Socket.io
        locationSocketService.connect(token, userId, userRole);

        console.log('✅ Location system initialized');

        // Subscribe based on role
        if (userRole === 'owner' || userRole === 'admin') {
          locationSocketService.subscribeToAdminTracking();
        }
      } catch (error) {
        console.error('Failed to initialize location system:', error);
      }
    };

    initializeLocationSystem();

    return () => {
      locationSocketService.disconnect();
    };
  }, []);

  return <div>Location system initialized</div>;
}


/**
 * ==========================================
 * EXAMPLE 6: ERROR HANDLING & FALLBACKS
 * ==========================================
 */

export function RobustLocationExample() {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [fallbackLocation, setFallbackLocation] = useState(null);

  useEffect(() => {
    const initLocation = async () => {
      try {
        // Try to get location with high accuracy
        const loc = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve(pos),
            (err) => reject(err),
            { enableHighAccuracy: true, timeout: 10000 }
          );
        });

        setLocation(loc.coords);
        setError(null);
      } catch (err) {
        console.warn('⚠️ High accuracy failed, trying standard:', err);
        try {
          // Fallback to standard accuracy
          const loc = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => resolve(pos),
              (err) => reject(err),
              { enableHighAccuracy: false, timeout: 5000 }
            );
          });

          setLocation(loc.coords);
          setError(null);
        } catch (fallbackErr) {
          console.error('❌ All location methods failed:', fallbackErr);
          setError('Could not determine your location');
          
          // Use IP-based location as last resort
          try {
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            setFallbackLocation({
              latitude: data.latitude,
              longitude: data.longitude
            });
          } catch (ipErr) {
            console.error('IP-based location failed:', ipErr);
          }
        }
      }
    };

    initLocation();
  }, []);

  return (
    <div className="space-y-2 p-4">
      {error && <p className="text-red-600">⚠️ {error}</p>}
      {location && (
        <p className="text-green-600">✅ Location: [{location.latitude}, {location.longitude}]</p>
      )}
      {fallbackLocation && !location && (
        <p className="text-yellow-600">📍 Using IP-based location: [{fallbackLocation.latitude}, {fallbackLocation.longitude}]</p>
      )}
    </div>
  );
}


export default UserDashboardExample;
