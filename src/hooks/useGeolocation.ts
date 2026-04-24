/**
 * useGeolocation Hook
 * Provides real-time geolocation tracking for the frontend
 * Handles permission requests, continuous tracking, and error handling
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  address?: string;
}

export interface UseGeolocationReturn {
  location: LocationData | null;
  error: string | null;
  loading: boolean;
  isWatching: boolean;
  startWatching: () => void;
  stopWatching: () => void;
  getCurrentLocation: () => Promise<LocationData | null>;
}

const DEFAULT_WATCH_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 30000,
  maximumAge: 5000
};

const DEFAULT_GET_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 20000,
  maximumAge: 0
};

/**
 * Custom hook for geolocation tracking
 * @param {boolean} autoStart - Whether to start watching on mount
 * @param {object} options - Geolocation options
 * @returns {UseGeolocationReturn}
 */
export function useGeolocation(
  autoStart: boolean = false,
  options = DEFAULT_WATCH_OPTIONS
): UseGeolocationReturn {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isWatching, setIsWatching] = useState<boolean>(false);
  const watchIdRef = useRef<number | null>(null);

  /**
   * Handle geolocation success
   */
  const handleSuccess = useCallback((position: GeolocationPosition) => {
    const { latitude, longitude, accuracy } = position.coords;
    const timestamp = position.timestamp;

    setLocation({
      latitude,
      longitude,
      accuracy,
      timestamp
    });

    setError(null);
    setLoading(false);

    console.log(`✅ Location obtained: [${latitude}, ${longitude}]`, { accuracy });
  }, []);

  /**
   * Handle geolocation error
   */
  const handleError = useCallback((err: GeolocationPositionError) => {
    let errorMsg = 'Unknown error';
    
    switch (err.code) {
      case err.PERMISSION_DENIED:
        errorMsg = 'Location permission denied. Please enable location access.';
        break;
      case err.POSITION_UNAVAILABLE:
        errorMsg = 'Location information unavailable';
        break;
      case err.TIMEOUT:
        errorMsg = 'Location request timed out. Retrying with lower accuracy...';
        console.warn('⚠️ Location timeout, will retry');
        break;
    }

    setError(errorMsg);
    setLoading(false);
    console.error('❌ Geolocation error:', errorMsg, err);
  }, []);

  /**
   * Get current location with retry on timeout
   */
  const getCurrentLocation = useCallback(async (): Promise<LocationData | null> => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      console.error('❌ Geolocation not supported');
      return null;
    }

    setLoading(true);
    setError(null);

    // Try with high accuracy first
    const tryGetLocation = (options: PositionOptions): Promise<GeolocationPosition | null> => {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve(position),
          (error) => {
            if (error.code === error.TIMEOUT) {
              console.warn('⚠️ Location timeout, trying with lower accuracy');
              resolve(null);
            } else {
              handleError(error);
              resolve(null);
            }
          },
          options
        );
      });
    };

    // First attempt with high accuracy
    let position = await tryGetLocation(DEFAULT_GET_OPTIONS);

    // If timeout, retry with lower accuracy
    if (!position) {
      console.log('🔄 Retrying with lower accuracy settings...');
      position = await tryGetLocation({
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 5000
      });
    }

    // If still no position, try one more time with very permissive settings
    if (!position) {
      console.log('🔄 Final attempt with maximum timeout...');
      position = await tryGetLocation({
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 10000
      });
    }

    setLoading(false);

    if (position) {
      handleSuccess(position);
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp
      };
    }

    // If all attempts failed, return null (caller will use mock location)
    console.error('❌ All geolocation attempts failed');
    return null;
  }, [handleSuccess, handleError]);

  /**
   * Start watching location
   */
  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      console.error('❌ Geolocation not supported');
      return;
    }

    if (isWatching) {
      console.warn('⚠️ Already watching location');
      return;
    }

    console.log('📍 Starting location watch...');
    setLoading(true);

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        handleSuccess(position);
        setIsWatching(true);
        setLoading(false);
      },
      (error) => {
        handleError(error);
      },
      options
    );

    watchIdRef.current = watchId;
    console.log(`📍 Watching location (Watch ID: ${watchId})`);
  }, [handleSuccess, handleError, isWatching, options]);

  /**
   * Stop watching location
   */
  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsWatching(false);
      console.log('⛔ Stopped watching location');
    }
  }, []);

  /**
   * Auto-start watching if configured
   */
  useEffect(() => {
    if (autoStart) {
      startWatching();
    }

    // Cleanup on unmount
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [autoStart, startWatching]);

  return {
    location,
    error,
    loading,
    isWatching,
    startWatching,
    stopWatching,
    getCurrentLocation
  };
}

export default useGeolocation;
