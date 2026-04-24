/**
 * DeliveryBoyTracker Component
 * Displays real-time tracking of delivery boy location during order delivery
 */

import React, { useState, useEffect } from 'react';
import { MapPin, AlertCircle, Loader2, Navigation } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import locationSocketService, { DeliveryBoyLocation } from '@/lib/locationSocket';

interface DeliveryBoyTrackerProps {
  orderId: string;
  isOpen?: boolean;
  onLocationUpdate?: (location: DeliveryBoyLocation) => void;
}

export function DeliveryBoyTracker({
  orderId,
  isOpen = true,
  onLocationUpdate
}: DeliveryBoyTrackerProps) {
  const [location, setLocation] = useState<DeliveryBoyLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Subscribe to delivery tracking
    locationSocketService.subscribeToOrderTracking(orderId);

    // Listen for delivery boy location updates
    locationSocketService.onDeliveryBoyLocationUpdate((data: DeliveryBoyLocation) => {
      setLocation(data);
      setLastUpdate(new Date(data.timestamp));
      setError(null);
      onLocationUpdate?.(data);
    });

    return () => {
      // Cleanup
    };
  }, [orderId, isOpen, onLocationUpdate]);

  if (!isOpen) {
    return null;
  }

  const formatTime = (date: Date | null) => {
    if (!date) return 'Never';
    const diff = Date.now() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);

    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;

    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-blue-500 animate-pulse" />
            <CardTitle className="text-lg">Live Delivery Tracking</CardTitle>
          </div>
          <Badge variant="default" className="bg-green-600">
            Tracking Active
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!location && (
          <div className="flex flex-col items-center justify-center py-8 space-y-2">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            <p className="text-sm text-gray-600">Waiting for delivery boy location...</p>
          </div>
        )}

        {location && (
          <div className="space-y-4">
            {/* Location Details */}
            <div className="bg-blue-50 p-4 rounded-lg space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-600 font-semibold uppercase">Latitude</p>
                  <p className="font-mono text-sm font-semibold">{location.latitude.toFixed(6)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-semibold uppercase">Longitude</p>
                  <p className="font-mono text-sm font-semibold">{location.longitude.toFixed(6)}</p>
                </div>
              </div>

              {location.address && (
                <div>
                  <p className="text-xs text-gray-600 font-semibold uppercase">Address</p>
                  <p className="text-sm text-gray-800">{location.address}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 font-semibold uppercase">Delivery Boy ID</p>
                  <p className="font-mono text-sm">{location.deliveryBoyId}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600 font-semibold uppercase">Last Update</p>
                  <p className="text-sm text-green-600 font-semibold">{formatTime(lastUpdate)}</p>
                </div>
              </div>
            </div>

            {/* Live Indicator */}
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-600 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-800 font-semibold">Live Location Active</span>
              </div>
              <MapPin className="h-4 w-4 text-green-600" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default DeliveryBoyTracker;
