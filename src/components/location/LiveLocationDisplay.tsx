/**
 * LiveLocationDisplay Component
 * Displays current live location with accuracy information
 */

import React from 'react';
import { MapPin, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGeolocation, LocationData } from '@/hooks/useGeolocation';

interface LiveLocationDisplayProps {
  showRefresh?: boolean;
  onLocationChange?: (location: LocationData) => void;
  autoStart?: boolean;
}

export function LiveLocationDisplay({
  showRefresh = true,
  onLocationChange,
  autoStart = true
}: LiveLocationDisplayProps) {
  const { location, error, loading, isWatching, getCurrentLocation, startWatching, stopWatching } =
    useGeolocation(autoStart);

  React.useEffect(() => {
    if (location && onLocationChange) {
      onLocationChange(location);
    }
  }, [location, onLocationChange]);

  const handleRefresh = async () => {
    await getCurrentLocation();
  };

  const handleToggleWatch = () => {
    if (isWatching) {
      stopWatching();
    } else {
      startWatching();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-500" />
          Live Location
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Fetching location...
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Location Display */}
        {location && (
          <div className="space-y-2 bg-slate-50 p-3 rounded-lg">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-gray-600">Latitude</p>
                <p className="font-mono font-semibold">{location.latitude.toFixed(6)}</p>
              </div>
              <div>
                <p className="text-gray-600">Longitude</p>
                <p className="font-mono font-semibold">{location.longitude.toFixed(6)}</p>
              </div>
              <div>
                <p className="text-gray-600">Accuracy</p>
                <p className="font-mono font-semibold">{Math.round(location.accuracy)} m</p>
              </div>
              <div>
                <p className="text-gray-600">Watching</p>
                <p className="font-mono font-semibold text-green-600">
                  {isWatching ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>

            {/* Watch Status */}
            <div className="pt-2 flex gap-2">
              {showRefresh && (
                <Button
                  onClick={handleRefresh}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <MapPin className="h-3 w-3 mr-1" />
                      Refresh
                    </>
                  )}
                </Button>
              )}

              <Button
                onClick={handleToggleWatch}
                variant={isWatching ? 'destructive' : 'default'}
                size="sm"
                className="flex-1"
              >
                {isWatching ? 'Stop Tracking' : 'Start Tracking'}
              </Button>
            </div>
          </div>
        )}

        {/* No Location Yet */}
        {!location && !loading && !error && (
          <div className="text-center py-4">
            <MapPin className="h-8 w-8 mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500 text-sm mb-3">Location not detected yet</p>
            <Button onClick={handleRefresh} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Getting Location...
                </>
              ) : (
                <>
                  <MapPin className="h-3 w-3 mr-1" />
                  Get My Location
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default LiveLocationDisplay;
