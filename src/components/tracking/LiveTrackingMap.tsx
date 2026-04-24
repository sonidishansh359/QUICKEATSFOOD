import React, { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertCircle } from 'lucide-react';

// Import fetchRoute properly
import { fetchRoute } from '../../utils/mapUtils';

interface DeliveryLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
  speed?: number;
  accuracy?: number;
}

interface LiveTrackingMapProps {
  userLocation?: DeliveryLocation;
  deliveryBoyLocation?: DeliveryLocation;
  deliveryBoyName?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  onMapReady?: (map: L.Map) => void;
  destinationType?: 'restaurant' | 'user'; // New prop
  trackingActive?: boolean;
}

const INDIA_BOUNDS: L.LatLngBoundsExpression = [
  [8.0, 68.0],      // Southwest
  [35.0, 97.0]      // Northeast
];

const INDIA_CENTER: L.LatLngExpression = [20.5937, 78.9629];

// Custom svg icons for cleaner look
const createUserIcon = () => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `<div style="
            background-color: #3b82f6;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            position: relative;
        ">
            📍
            <div style="
                position: absolute;
                bottom: -8px;
                left: 50%;
                transform: translateX(-50%);
                width: 0;
                height: 0;
                border-left: 8px solid transparent;
                border-right: 8px solid transparent;
                border-top: 10px solid #3b82f6;
            "></div>
        </div>`,
    iconSize: [40, 50],
    iconAnchor: [20, 48]
  });
};

const createDeliveryBoyIcon = () => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `<div style="
            background-color: #10b981;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            position: relative;
        ">
            🛵
            <div style="
                position: absolute;
                bottom: -8px;
                left: 50%;
                transform: translateX(-50%);
                width: 0;
                height: 0;
                border-left: 8px solid transparent;
                border-right: 8px solid transparent;
                border-top: 10px solid #10b981;
            "></div>
        </div>`,
    iconSize: [40, 50],
    iconAnchor: [20, 48]
  });
};

const createRestaurantIcon = () => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `<div style="
            background-color: #f97316;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            position: relative;
        ">
            🏪
            <div style="
                position: absolute;
                bottom: -8px;
                left: 50%;
                transform: translateX(-50%);
                width: 0;
                height: 0;
                border-left: 8px solid transparent;
                border-right: 8px solid transparent;
                border-top: 10px solid #f97316;
            "></div>
        </div>`,
    iconSize: [40, 50],
    iconAnchor: [20, 48]
  });
};

export const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({
  userLocation,
  deliveryBoyLocation,
  deliveryBoyName,
  vehicleType,
  vehicleNumber,
  onMapReady,
  destinationType = 'user', // Default
  trackingActive = true
}) => {
  console.log('🗺️ LiveTrackingMap Rendered:', {
    userLocation,
    deliveryBoyLocation,
    mapReady: false // access state inside component later
  });

  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const userMarker = useRef<L.Marker | null>(null);
  const deliveryBoyMarker = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const routeCalculated = useRef<boolean>(false);

  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Keep the viewport tight around the active points
  const recenterToActivePoints = useCallback(() => {
    if (!mapInstance.current) return;

    const activePoints: L.LatLngTuple[] = [];

    if (deliveryBoyLocation) {
      activePoints.push([deliveryBoyLocation.latitude, deliveryBoyLocation.longitude]);
    }

    if (userLocation) {
      activePoints.push([userLocation.latitude, userLocation.longitude]);
    }

    if (!activePoints.length) return;

    const bounds = L.latLngBounds(activePoints);
    const padding = activePoints.length > 1 ? [50, 50] : [100, 100];
    const maxZoom = activePoints.length === 1 ? 16 : 18;

    mapInstance.current.fitBounds(bounds, { padding: padding as L.PointExpression, maxZoom, animate: true, duration: 1.5 });
  }, [deliveryBoyLocation, userLocation]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    try {
      // Create map centered on India
      const map = L.map(mapContainer.current, {
        center: INDIA_CENTER,
        zoom: 5,
        minZoom: 4,
        maxZoom: 18,
        maxBounds: INDIA_BOUNDS,
        maxBoundsViscosity: 1.0,
        zoomControl: false
      });

      // Zomato Style: Cleaner, lighter map (CartoDB Voyager)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(map);

      mapInstance.current = map;
      setMapReady(true);
      onMapReady?.(map);

      return () => {
        if (mapInstance.current) {
          mapInstance.current.remove();
          mapInstance.current = null;
          setMapReady(false);

          // Reset markers and polyline when map is destroyed
          userMarker.current = null;
          deliveryBoyMarker.current = null;
          polylineRef.current = null;
        }
      };
    } catch (err) {
      setError('Failed to initialize map');
      console.error('Map initialization error:', err);
    }
  }, [onMapReady]);

  // Update Markers (Immediate)
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;

    const map = mapInstance.current;

    // 1. Delivery Boy Marker
    if (deliveryBoyLocation) {
      const { latitude, longitude } = deliveryBoyLocation;
      if (!deliveryBoyMarker.current) {
        deliveryBoyMarker.current = L.marker([latitude, longitude], { icon: createDeliveryBoyIcon() }).addTo(map);
      } else {
        // Check if marker is actually on the map
        if (!map.hasLayer(deliveryBoyMarker.current)) {
          deliveryBoyMarker.current.addTo(map);
        }
        deliveryBoyMarker.current.setLatLng([latitude, longitude]);
      }

      const popupContent = `
          <div class="text-sm font-sans p-1">
            <div class="font-bold text-gray-800">🛵 ${deliveryBoyName || 'Delivery Partner'}</div>
             <div class="text-xs text-gray-500">${vehicleType || 'Bike'} • ${vehicleNumber || ''}</div>
          </div>
        `;
      deliveryBoyMarker.current.bindPopup(popupContent);
    }

    // 2. User/Destination Marker
    if (userLocation) {
      const { latitude, longitude } = userLocation;
      const icon = destinationType === 'restaurant' ? createRestaurantIcon() : createUserIcon();

      if (!userMarker.current) {
        userMarker.current = L.marker([latitude, longitude], { icon }).addTo(map);
      } else {
        // Check if marker is actually on the map
        if (!map.hasLayer(userMarker.current)) {
          userMarker.current.addTo(map);
        }
        userMarker.current.setLatLng([latitude, longitude]);
        userMarker.current.setIcon(icon); // Update icon
      }

      // Update popup content
      const title = destinationType === 'restaurant' ? 'Restaurant' : 'Customer';
      const subtitle = destinationType === 'restaurant' ? 'Pickup Location' : 'Delivery Location';

      const popupContent = `
          <div class="text-sm font-sans p-1">
            <div class="font-bold text-gray-800">${title}</div>
             <div class="text-xs text-gray-500">${subtitle}</div>
          </div>
        `;
      userMarker.current.bindPopup(popupContent);
    }
  }, [mapReady, deliveryBoyLocation, userLocation, deliveryBoyName, vehicleType, vehicleNumber, destinationType]);

  // Update Route (Debounced)
  useEffect(() => {
    if (!mapReady || !mapInstance.current || !userLocation || !deliveryBoyLocation) return;

    const map = mapInstance.current;

    const fetchStaticRoute = async () => {
      // Log coordinates for debugging
      console.log('🗺️ Fetching route between:', {
        start: `${deliveryBoyLocation.latitude},${deliveryBoyLocation.longitude}`,
        end: `${userLocation.latitude},${userLocation.longitude}`
      });

      const start = { lat: deliveryBoyLocation.latitude, lng: deliveryBoyLocation.longitude };
      const end = { lat: userLocation.latitude, lng: userLocation.longitude };

      const distance = L.latLng(start.lat, start.lng).distanceTo(L.latLng(end.lat, end.lng));
      
      if (distance < 20) {
        if (polylineRef.current && map.hasLayer(polylineRef.current)) {
          map.removeLayer(polylineRef.current);
        }
        return;
      }

      try {
        // Fetch real road path
        const pathPoints = await fetchRoute(start, end);

        // Only update if we got a valid path
        if (pathPoints && pathPoints.length > 0) {
          // console.log(`✅ Route fetched with ${pathPoints.length} points`);

          const fullPath: L.LatLngExpression[] = [
            [start.lat, start.lng],
            ...pathPoints,
            [end.lat, end.lng]
          ];

          if (polylineRef.current) {
            // Check if polyline is on map
            if (!map.hasLayer(polylineRef.current)) {
              polylineRef.current.addTo(map);
            }
            polylineRef.current.setLatLngs(fullPath);
          } else {
            polylineRef.current = L.polyline(fullPath, {
              color: '#2563eb', // Blue-600
              weight: 5,
              opacity: 0.8,
              lineJoin: 'round',
              lineCap: 'round',
            }).addTo(map);
          }
        } else {
          // console.warn('⚠️ OSRM returned empty route, using straight line fallback');
          // Fallback to straight line
          const straightLine = [L.latLng(start.lat, start.lng), L.latLng(end.lat, end.lng)];
          if (polylineRef.current) {
            if (!map.hasLayer(polylineRef.current)) {
              polylineRef.current.addTo(map);
            }
            polylineRef.current.setLatLngs(straightLine);
          } else {
            polylineRef.current = L.polyline(straightLine, {
              color: '#2563eb',
              weight: 5,
              opacity: 0.8,
              dashArray: '10, 10', // Dashed for straight line
              lineJoin: 'round',
            }).addTo(map);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch route, using fallback:', err);
        const straightLine = [L.latLng(start.lat, start.lng), L.latLng(end.lat, end.lng)];
        if (polylineRef.current) {
          if (!map.hasLayer(polylineRef.current)) {
            polylineRef.current.addTo(map);
          }
          polylineRef.current.setLatLngs(straightLine);
        } else {
          polylineRef.current = L.polyline(straightLine, {
            color: '#2563eb',
            weight: 5,
            opacity: 0.8,
            dashArray: '10, 10', // Dashed for straight line
            lineJoin: 'round',
          }).addTo(map);
        }
      }
    };

    // Debounce route fetching
    const timerId = setTimeout(() => {
      fetchStaticRoute();
    }, 1000);

    return () => clearTimeout(timerId);

  }, [mapReady, deliveryBoyLocation?.latitude, deliveryBoyLocation?.longitude, userLocation?.latitude, userLocation?.longitude]);

  // Recenter map
  useEffect(() => {
    recenterToActivePoints();
  }, [recenterToActivePoints]);


  return (
    <div className="w-full h-full relative">
      <div ref={mapContainer} className="w-full h-full rounded-xl overflow-hidden shadow-inner bg-slate-100" />

      {error && (
        <div className="absolute top-4 left-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center gap-2 z-[1000]">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
