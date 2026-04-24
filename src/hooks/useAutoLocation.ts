import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { locationService } from '@/lib/locationService';
import { useGeolocation } from './useGeolocation';

/**
 * Custom hook to automatically fetch and update location on login/signup
 * Works for all user roles: user, owner, delivery
 */
export function useAutoLocation() {
  const { isAuthenticated, user, token } = useAuth();
  // Use startWatching instead of getCurrentLocation to avoid conflicts with other watchers
  const { location: geoLoc, error: geoError, startWatching, stopWatching } = useGeolocation();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number; address?: string } | null>(null);

  // Track if we have successfully updated the location to prevent loops
  const hasUpdatedRef = useRef(false);

  // Reverse geocode to get city/state using OpenStreetMap Nominatim
  const reverseGeocode = async (latitude: number, longitude: number): Promise<string | null> => {
    try {
      // Validate coordinates before making the API call
      if (
        typeof latitude !== 'number' ||
        typeof longitude !== 'number' ||
        isNaN(latitude) ||
        isNaN(longitude) ||
        latitude < -90 || latitude > 90 ||
        longitude < -180 || longitude > 180
      ) {
        console.warn('⚠️ Invalid coordinates for reverse geocoding:', { latitude, longitude });
        return null;
      }

      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&email=contact@quickeats.com`;
      const response = await fetch(url);
      if (!response.ok) return null;
      const data = await response.json();
      const addr = data.address || {};
      const city = addr.city || addr.town || addr.village || addr.suburb || addr.county;
      const state = addr.state;
      if (city && state) return `${city}, ${state}`;
      if (city) return city;
      if (state) return state;
      // Fallback to a shorter display_name
      if (data.display_name) {
        const first = String(data.display_name).split(',').slice(0, 2).join(', ').trim();
        return first.length ? first : null;
      }
      return null;
    } catch {
      return null;
    }
  };

  // Start watching on mount/auth
  useEffect(() => {
    if (!isAuthenticated || !user || !token) {
      return;
    }

    if (!hasUpdatedRef.current) {
      // Check for frozen location in storage
      const storageKey = `quickeats_location_${user.id}`;
      const stored = localStorage.getItem(storageKey);

      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          console.log('📍 Restoring previous location from storage as initial value:', parsed);

          setLocation(parsed);
          locationService.setToken(token);
        } catch (e) {
          console.error('Failed to parse stored location', e);
          localStorage.removeItem(storageKey);
        }
      }

      setIsUpdating(true);
      console.log('📍 Auto-fetching location (watch mode) for', user.role, user.name);
      startWatching();
    }

    // Cleanup on unmount
    return () => {
      stopWatching();
    };
  }, [isAuthenticated, user, token, startWatching, stopWatching]);

  // React to location updates from useGeolocation
  useEffect(() => {
    const processLocationUpdate = async () => {
      if (!geoLoc || hasUpdatedRef.current || !isAuthenticated || !user || !token) return;

      try {
        hasUpdatedRef.current = true; // Mark as updated to prevent re-runs
        setError(null);

        console.log('📍 Got valid coordinates via watch:', {
          lat: geoLoc.latitude,
          lon: geoLoc.longitude,
          accuracy: geoLoc.accuracy
        });

        // Try to resolve city/state for display
        const addressDisplay = await reverseGeocode(geoLoc.latitude, geoLoc.longitude);

        const locationData = {
          latitude: geoLoc.latitude,
          longitude: geoLoc.longitude,
          address: addressDisplay || geoLoc.address || undefined,
        };

        setLocation(locationData);

        // FREEZE: Save to localStorage
        const storageKey = `quickeats_location_${user.id}`;
        localStorage.setItem(storageKey, JSON.stringify(locationData));
        console.log('❄️ Location frozen in storage for session');

        // Set token in location service for API calls
        locationService.setToken(token);

        // Update location based on user role
        const updatePayload = {
          latitude: geoLoc.latitude,
          longitude: geoLoc.longitude,
          address: addressDisplay || geoLoc.address || 'Location detected',
        };

        console.log('📍 Sending location update payload:', updatePayload);

        let result;
        if (user.role === 'user') {
          result = await locationService.updateUserLocation(updatePayload);
          console.log('✅ User location updated:', result);
        } else if (user.role === 'owner') {
          result = await locationService.updateOwnerLocation(updatePayload);
          console.log('✅ Owner location updated:', result);
        } else if (user.role === 'delivery') {
          result = await locationService.updateDeliveryBoyLocation(updatePayload);
          console.log('✅ Delivery boy location updated:', result);
        }

        console.log('📍 Location update successful:', result);

        // We got the location, we can stop watching to save battery if we only needed one update
        // But we keep isUpdating false so UI shows success
        stopWatching();

      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to update location';
        console.error('❌ Location update error:', errorMsg);
        setError(errorMsg);
        // Allow retry if it failed? 
        // hasUpdatedRef.current = false; 
      } finally {
        setIsUpdating(false);
      }
    };

    if (isUpdating && geoLoc) {
      processLocationUpdate();
    }
  }, [geoLoc, isUpdating, isAuthenticated, user, token, stopWatching]);

  // Handle Geolocation Errors
  useEffect(() => {
    if (geoError && isUpdating) {
      setError(geoError);
      setIsUpdating(false);
      hasUpdatedRef.current = true; // Stop trying if error
    }
  }, [geoError, isUpdating]);

  return {
    location,
    isUpdating,
    error: error || geoError,
    isAuthenticated,
  };
}
