import { useAutoLocation } from '@/hooks/useAutoLocation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2, AlertCircle, CheckCircle2, RotateCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState, useEffect } from 'react';

interface AutoLocationStatusProps {
  showDetails?: boolean;
  compact?: boolean;
  cityOnly?: boolean;
}

/**
 * Component that displays automatic location status
 * Shows on dashboards after login/signup
 * 
 * Props:
 * - showDetails: Show coordinates and address (default: false)
 * - compact: Show compact version (default: false)
 */
export function AutoLocationStatus({ showDetails = false, compact = false, cityOnly = false }: AutoLocationStatusProps) {
  const { location, isUpdating, error, isAuthenticated } = useAutoLocation();
  const [retryCount, setRetryCount] = useState(0);
  const [showRetryHint, setShowRetryHint] = useState(false);

  // Show hint after a few seconds if still loading or error
  useEffect(() => {
    const timer = setTimeout(() => {
      if ((isUpdating || error) && retryCount === 0) {
        setShowRetryHint(true);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [isUpdating, error, retryCount]);

  if (!isAuthenticated) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {isUpdating && (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            <span className="text-sm text-muted-foreground">Getting your location...</span>
          </>
        )}
        {error && (
          <>
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-500">{error}</span>
          </>
        )}
        {location && !isUpdating && !error && (
          <>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-600">Location active</span>
            {location.address && (
              <span className="text-sm text-muted-foreground">• {location.address}</span>
            )}
          </>
        )}
      </div>
    );
  }

  if (compact || cityOnly) {
    if (isUpdating) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-100">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Detecting...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div
          className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-sm font-medium border border-red-100 cursor-pointer hover:bg-red-100 transition-colors"
          onClick={() => window.location.reload()}
          title="Click to retry"
        >
          <AlertCircle className="h-3.5 w-3.5" />
          <span>Location Error</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-sm text-slate-700 rounded-full text-sm font-medium border border-slate-200 shadow-sm">
        <MapPin className="h-3.5 w-3.5 text-orange-500" />
        <span className="max-w-[150px] truncate">{location?.address || 'Surat, Gujarat'}</span>
      </div>
    );
  }

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-500" />
              <h3 className="font-semibold">Your Live Location</h3>
            </div>
            {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
            {error && <AlertCircle className="h-4 w-4 text-red-500" />}
            {location && !isUpdating && <CheckCircle2 className="h-4 w-4 text-green-500" />}
          </div>

          {/* Status Badge */}
          <div className="flex gap-2">
            {isUpdating && <Badge variant="secondary">Updating...</Badge>}
            {error && <Badge variant="destructive">Error</Badge>}
            {location && !isUpdating && <Badge variant="default" className="bg-green-600">Active</Badge>}
          </div>

          {/* Address/City display */}
          {location?.address && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{location.address}</span>
            </div>
          )}

          {/* Details */}
          {showDetails && location && (
            <div className="bg-muted p-3 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Latitude:</span>
                <span className="font-mono font-semibold">{location.latitude.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Longitude:</span>
                <span className="font-mono font-semibold">{location.longitude.toFixed(6)}</span>
              </div>
            </div>
          )}

          {/* Error Alert with Instructions and Retry */}
          {error && (
            <Alert variant={error.includes('mock') ? 'default' : 'destructive'} className={error.includes('mock') ? 'bg-yellow-50 border-yellow-300' : ''}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="space-y-3">
                <div>
                  <p className="font-semibold">{error}</p>
                  {error.includes('mock') ? (
                    <p className="text-xs mt-2 opacity-90">
                      📍 You can still use the app! A default location (Surat, Gujarat) is being used for testing.
                    </p>
                  ) : (
                    <>
                      <p className="text-xs mt-2 opacity-90">
                        💡 Steps to fix:
                      </p>
                      <ul className="text-xs list-disc list-inside opacity-90 mt-1 space-y-1">
                        <li>Look for location permission prompt at top of browser</li>
                        <li>Click "Allow" when prompted</li>
                        <li>Or click the lock icon and enable location permissions</li>
                      </ul>
                    </>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="w-full gap-2"
                >
                  <RotateCw className="h-3 w-3" />
                  Retry Location Detection
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {location && !isUpdating && !error && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-green-900">Location Detected</p>
                <p className="text-green-700 text-xs">Your location is automatically synced for real-time tracking</p>
              </div>
            </div>
          )}

          {/* Loading Message */}
          {isUpdating && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
              <Loader2 className="h-4 w-4 text-blue-600 animate-spin flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-blue-900">Getting Your Location</p>
                <p className="text-blue-700 text-xs">Please allow location access when your browser asks</p>
                {showRetryHint && (
                  <p className="text-blue-600 text-xs mt-2 font-semibold">
                    ⏱️ Still waiting... Check if a permission prompt appeared at the top of your browser.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

