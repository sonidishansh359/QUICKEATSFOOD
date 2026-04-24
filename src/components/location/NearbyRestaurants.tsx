/**
 * NearbyRestaurants Component
 * Displays restaurants near user's current location with real-time updates
 */

import React, { useState, useEffect } from 'react';
import { Star, MapPin, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGeolocation, LocationData } from '@/hooks/useGeolocation';
import locationService, { NearbyRestaurant } from '@/lib/locationService';

interface NearbyRestaurantsProps {
  onSelectRestaurant?: (restaurant: NearbyRestaurant) => void;
  radius?: number;
  autoLoad?: boolean;
}

export function NearbyRestaurants({
  onSelectRestaurant,
  radius = 5,
  autoLoad = true
}: NearbyRestaurantsProps) {
  const [restaurants, setRestaurants] = useState<NearbyRestaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { location } = useGeolocation(false);

  // Fetch nearby restaurants when location changes
  useEffect(() => {
    if (autoLoad && location) {
      fetchNearbyRestaurants(location);
    }
  }, [location, autoLoad]);

  const fetchNearbyRestaurants = async (loc: LocationData) => {
    try {
      setLoading(true);
      setError(null);

      // Validate coordinates
      if (
        typeof loc.latitude !== 'number' ||
        typeof loc.longitude !== 'number' ||
        isNaN(loc.latitude) ||
        isNaN(loc.longitude)
      ) {
        setError('Invalid location data. Please try again.');
        return;
      }

      const data = await locationService.getNearbyRestaurants(loc.latitude, loc.longitude, radius);
      setRestaurants(data);

      if (data.length === 0) {
        setError(`No restaurants found within ${radius} km`);
      }
    } catch (err) {
      console.error('Error fetching nearby restaurants:', err);
      setError('Failed to load nearby restaurants');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (location) {
      fetchNearbyRestaurants(location);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-orange-500" />
          <CardTitle className="text-lg">Nearby Restaurants</CardTitle>
        </div>
        <Badge variant="secondary">{restaurants.length}</Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-orange-500" />
              <p className="text-sm text-gray-600">Finding nearby restaurants...</p>
            </div>
          </div>
        )}

        {/* Restaurants List */}
        {!loading && restaurants.length > 0 && (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {restaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                className="border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onSelectRestaurant?.(restaurant)}
              >
                <div className="flex gap-3">
                  {restaurant.image && (
                    <img
                      src={restaurant.image}
                      alt={restaurant.name}
                      className="w-16 h-16 rounded object-cover"
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-sm">{restaurant.name}</h3>
                        <p className="text-xs text-gray-600">{restaurant.cuisine}</p>
                      </div>
                      <Badge variant="outline" className="whitespace-nowrap">
                        {restaurant.distance}
                      </Badge>
                    </div>

                    <div className="mt-2 flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        <span>{restaurant.rating}</span>
                      </div>

                      {restaurant.isOpen && (
                        <Badge variant="secondary" className="text-green-700">
                          Open
                        </Badge>
                      )}

                      {!restaurant.isOpen && (
                        <Badge variant="outline" className="text-gray-500">
                          Closed
                        </Badge>
                      )}
                    </div>

                    {restaurant.address && (
                      <p className="text-xs text-gray-500 mt-1 truncate">{restaurant.address}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Restaurants */}
        {!loading && restaurants.length === 0 && !error && (
          <div className="text-center py-8">
            <MapPin className="h-8 w-8 mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500 text-sm mb-3">No restaurants nearby</p>
            <Button onClick={handleRefresh} disabled={loading || !location} size="sm">
              Retry
            </Button>
          </div>
        )}

        {/* Refresh Button */}
        {restaurants.length > 0 && (
          <Button onClick={handleRefresh} disabled={loading} variant="outline" className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Updating...
              </>
            ) : (
              'Refresh'
            )}
          </Button>
        )}

        {/* Radius Info */}
        <div className="text-xs text-gray-500 text-center pt-2 border-t">
          Showing restaurants within {radius} km of your location
        </div>
      </CardContent>
    </Card>
  );
}

export default NearbyRestaurants;
