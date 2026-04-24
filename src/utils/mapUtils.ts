import L from 'leaflet';

/**
 * Decodes a polyline string into an array of [lat, lng] pairs.
 * Adapted from standard Google Polyline algorithm.
 */
/**
 * Decodes a polyline string into an array of [lat, lng] pairs.
 * Standard Google Polyline Algorithm.
 */
const decodePolyline = (str: string, precision?: number): L.LatLngExpression[] => {
    let index = 0,
        lat = 0,
        lng = 0,
        coordinates: L.LatLngExpression[] = [],
        shift = 0,
        result = 0,
        byte = null,
        latitude_change,
        longitude_change,
        factor = Math.pow(10, precision === undefined ? 5 : precision);

    while (index < str.length) {
        byte = null;
        shift = 0;
        result = 0;

        do {
            byte = str.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

        shift = result = 0;

        do {
            byte = str.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

        lat += latitude_change;
        lng += longitude_change;

        coordinates.push([lat / factor, lng / factor]);
    }

    return coordinates;
};

/**
 * Fetches the driving route between two points using OSRM.
 * @param start {lat, lng}
 * @param end {lat, lng}
 * @returns Array of [lat, lng] points representing the route path
 */
export const fetchRoute = async (
    start: { lat: number; lng: number },
    end: { lat: number; lng: number }
): Promise<L.LatLngExpression[]> => {
    try {
        // OSRM Public Server (Demo)
        // URL format: /route/v1/driving/{lon},{lat};{lon},{lat}?overview=full&geometries=polyline
        const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=polyline`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
            console.warn('OSRM Route not found:', data);
            return [];
        }

        const encodedPolyline = data.routes[0].geometry;
        return decodePolyline(encodedPolyline);
    } catch (error) {
        console.error('Error fetching route:', error);
        // Fallback to straight line if API fails
        return [[start.lat, start.lng], [end.lat, end.lng]];
    }
};

/**
 * Geocodes an address string to coordinates using Nominatim API.
 * Uses fallback strategies if the full address fails.
 * @param address The address string to geocode
 * @returns {lat, lng} or null if not found
 */
export const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    // Helper function to query Nominatim
    const queryNominatim = async (query: string) => {
        try {
            const encodedAddress = encodeURIComponent(query);
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`;

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'QuickEats-Delivery-App/1.0'
                }
            });

            const data = await response.json();
            if (data && data.length > 0) {
                return {
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon)
                };
            }
            return null;
        } catch (error) {
            console.error(`Error querying Nominatim for "${query}":`, error);
            return null;
        }
    };

    // Strategy 1: Full Address
    let coords = await queryNominatim(address);
    if (coords) return coords;

    console.warn(`Geocoding failed for full address: "${address}". Trying fallbacks...`);

    // Strategy 2: Remove specific building names, try street/area
    // Split by comma and remove the first part if there are > 2 parts
    const parts = address.split(',').map(p => p.trim());

    if (parts.length > 2) {
        // Try without the first part (often building name)
        const partialAddress = parts.slice(1).join(', ');
        coords = await queryNominatim(partialAddress);
        if (coords) {
            console.log(`Geocoding succeeded with partial address: "${partialAddress}"`);
            return coords;
        }
    }

    // Strategy 3: City and Zip only (approximate location)
    // Looking for a 6-digit number (Indian Pincode)
    const pincodeMatch = address.match(/\b\d{6}\b/);
    if (pincodeMatch) {
        const pincode = pincodeMatch[0];
        // Try to find city name (assuming it's formatted as "City, State, Zip")
        // This is a heuristic.
        const pincodeQuery = `${pincode}, India`;
        coords = await queryNominatim(pincodeQuery);
        if (coords) {
            console.log(`Geocoding succeeded with Pincode: "${pincodeQuery}"`);
            return coords;
        }
    }

    // Strategy 4: Last 2 parts (City/State)
    if (parts.length >= 2) {
        const cityState = parts.slice(-2).join(', ');
        coords = await queryNominatim(cityState);
        if (coords) {
            console.log(`Geocoding succeeded with City/State: "${cityState}"`);
            return coords;
        }
    }

    console.error('All geocoding strategies failed for address:', address);
    return null;
};
