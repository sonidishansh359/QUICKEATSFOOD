/**
 * Location API Service
 * Handles all HTTP requests for location operations
 */

const API_ORIGIN = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';
const API_BASE_URL = API_ORIGIN.endsWith('/api') ? API_ORIGIN : `${API_ORIGIN}/api`;
const LOCATIONS_API = `${API_BASE_URL}/locations`;

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface NearbyRestaurant {
  id: string;
  name: string;
  cuisine: string;
  address: string;
  rating: number;
  distance: string;
  image?: string;
  isOpen: boolean;
}

export interface NearbyDeliveryBoy {
  id: string;
  name: string;
  vehicleType: string;
  distance: string;
  rating: number;
  isAvailable: boolean;
}

class LocationService {
  private token: string = '';

  setToken(token: string) {
    this.token = token;
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.token}`
    };
  }

  /**
   * Update user location
   */
  async updateUserLocation(location: LocationData): Promise<any> {
    try {
      // Validate location data before sending
      if (
        typeof location.latitude !== 'number' ||
        typeof location.longitude !== 'number' ||
        isNaN(location.latitude) ||
        isNaN(location.longitude)
      ) {
        throw new Error(
          `Invalid location coordinates: latitude=${location.latitude}, longitude=${location.longitude}`
        );
      }

      const response = await fetch(`${LOCATIONS_API}/user`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(location)
      });

      if (!response.ok) {
        let errorDetail = response.statusText;
        try {
          const errorData = await response.json();
          if (errorData.errors) {
            errorDetail = errorData.errors
              .map((err: any) => `${err.field}: ${err.message}`)
              .join('; ');
          } else if (errorData.message) {
            errorDetail = errorData.message;
          }
        } catch (e) {
          // If response body isn't JSON, use statusText
        }
        console.error('❌ Location API error response:', { status: response.status, detail: errorDetail, payload: location });
        throw new Error(`Failed to update user location: ${errorDetail}`);
      }

      const data = await response.json();
      console.log('✅ User location updated:', data);
      return data;
    } catch (error) {
      console.error('❌ Error updating user location:', error);
      throw error;
    }
  }

  /**
   * Get user location
   */
  async getUserLocation(): Promise<any> {
    try {
      const response = await fetch(`${LOCATIONS_API}/user`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to get user location: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Error fetching user location:', error);
      throw error;
    }
  }

  /**
   * Find nearby restaurants
   */
  async getNearbyRestaurants(
    latitude: number,
    longitude: number,
    radius: number = 5,
    cuisine?: string
  ): Promise<NearbyRestaurant[]> {
    try {
      // Validate coordinates before sending
      if (
        typeof latitude !== 'number' ||
        typeof longitude !== 'number' ||
        isNaN(latitude) ||
        isNaN(longitude) ||
        latitude < -90 || latitude > 90 ||
        longitude < -180 || longitude > 180
      ) {
        console.warn('⚠️ Invalid coordinates for nearby restaurants:', { latitude, longitude });
        throw new Error(
          `Invalid coordinates: latitude=${latitude}, longitude=${longitude}`
        );
      }

      if (typeof radius !== 'number' || radius <= 0) {
        console.warn('⚠️ Invalid radius for nearby restaurants:', radius);
        throw new Error(`Invalid radius: ${radius}`);
      }

      const payload = {
        latitude,
        longitude,
        radius,
        cuisine
      };

      console.log('🚀 [locationService] Sending nearby-restaurants request:', payload);

      const response = await fetch(`${LOCATIONS_API}/nearby-restaurants`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        let errorDetail = response.statusText;
        try {
          const errorData = await response.json();
          if (errorData.errors) {
            errorDetail = errorData.errors
              .map((err: any) => `${err.field}: ${err.message}`)
              .join('; ');
          } else if (errorData.message) {
            errorDetail = errorData.message;
          }
        } catch (e) {
          // If response body isn't JSON, use statusText
        }
        console.error('❌ Nearby restaurants API error:', { status: response.status, detail: errorDetail, payload: { latitude, longitude, radius } });
        throw new Error(`Failed to fetch nearby restaurants: ${errorDetail}`);
      }

      const data = await response.json();
      console.log(`✅ Found ${data.count} nearby restaurants`);
      return data.restaurants || [];
    } catch (error) {
      console.error('❌ Error fetching nearby restaurants:', error);
      throw error;
    }
  }

  /**
   * Update owner location
   */
  async updateOwnerLocation(location: LocationData): Promise<any> {
    try {
      // Validate location data before sending
      if (
        typeof location.latitude !== 'number' ||
        typeof location.longitude !== 'number' ||
        isNaN(location.latitude) ||
        isNaN(location.longitude)
      ) {
        throw new Error(
          `Invalid location coordinates: latitude=${location.latitude}, longitude=${location.longitude}`
        );
      }

      const response = await fetch(`${LOCATIONS_API}/owner`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(location)
      });

      if (!response.ok) {
        let errorDetail = response.statusText;
        try {
          const errorData = await response.json();
          if (errorData.errors) {
            errorDetail = errorData.errors
              .map((err: any) => `${err.field}: ${err.message}`)
              .join('; ');
          } else if (errorData.message) {
            errorDetail = errorData.message;
          }
        } catch (e) {
          // If response body isn't JSON, use statusText
        }
        console.error('❌ Location API error response:', { status: response.status, detail: errorDetail, payload: location });
        throw new Error(`Failed to update owner location: ${errorDetail}`);
      }

      const data = await response.json();
      console.log('✅ Owner location updated:', data);
      return data;
    } catch (error) {
      console.error('❌ Error updating owner location:', error);
      throw error;
    }
  }

  /**
   * Update restaurant location
   */
  async updateRestaurantLocation(
    restaurantId: string,
    location: LocationData
  ): Promise<any> {
    try {
      const response = await fetch(`${LOCATIONS_API}/restaurant/${restaurantId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(location)
      });

      if (!response.ok) {
        throw new Error(`Failed to update restaurant location: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Restaurant location updated:', data);
      return data;
    } catch (error) {
      console.error('❌ Error updating restaurant location:', error);
      throw error;
    }
  }

  /**
   * Update delivery boy location
   */
  async updateDeliveryBoyLocation(location: LocationData): Promise<any> {
    try {
      // Validate location data before sending
      if (
        typeof location.latitude !== 'number' ||
        typeof location.longitude !== 'number' ||
        isNaN(location.latitude) ||
        isNaN(location.longitude)
      ) {
        throw new Error(
          `Invalid location coordinates: latitude=${location.latitude}, longitude=${location.longitude}`
        );
      }

      const response = await fetch(`${LOCATIONS_API}/delivery-boy`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(location)
      });

      if (!response.ok) {
        let errorDetail = response.statusText;
        try {
          const errorData = await response.json();
          if (errorData.errors) {
            errorDetail = errorData.errors
              .map((err: any) => `${err.field}: ${err.message}`)
              .join('; ');
          } else if (errorData.message) {
            errorDetail = errorData.message;
          }
        } catch (e) {
          // If response body isn't JSON, use statusText
        }
        console.error('❌ Location API error response:', { status: response.status, detail: errorDetail, payload: location });
        throw new Error(`Failed to update delivery boy location: ${errorDetail}`);
      }

      const data = await response.json();
      console.log('✅ Delivery boy location updated:', data);
      return data;
    } catch (error) {
      console.error('❌ Error updating delivery boy location:', error);
      throw error;
    }
  }

  /**
   * Get nearby available delivery boys
   */
  async getNearbyDeliveryBoys(
    latitude: number,
    longitude: number,
    radius: number = 5
  ): Promise<NearbyDeliveryBoy[]> {
    try {
      // Validate coordinates before sending
      if (
        typeof latitude !== 'number' ||
        typeof longitude !== 'number' ||
        isNaN(latitude) ||
        isNaN(longitude) ||
        latitude < -90 || latitude > 90 ||
        longitude < -180 || longitude > 180
      ) {
        console.warn('⚠️ Invalid coordinates for nearby delivery boys:', { latitude, longitude });
        throw new Error(
          `Invalid coordinates: latitude=${latitude}, longitude=${longitude}`
        );
      }

      if (typeof radius !== 'number' || radius <= 0) {
        console.warn('⚠️ Invalid radius for nearby delivery boys:', radius);
        throw new Error(`Invalid radius: ${radius}`);
      }

      const response = await fetch(`${LOCATIONS_API}/nearby-delivery-boys`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          latitude,
          longitude,
          radius
        })
      });

      if (!response.ok) {
        let errorDetail = response.statusText;
        try {
          const errorData = await response.json();
          if (errorData.errors) {
            errorDetail = errorData.errors
              .map((err: any) => `${err.field}: ${err.message}`)
              .join('; ');
          } else if (errorData.message) {
            errorDetail = errorData.message;
          }
        } catch (e) {
          // If response body isn't JSON, use statusText
        }
        console.error('❌ Nearby delivery boys API error:', { status: response.status, detail: errorDetail, payload: { latitude, longitude, radius } });
        throw new Error(`Failed to fetch nearby delivery boys: ${errorDetail}`);
      }

      const data = await response.json();
      console.log(`✅ Found ${data.count} nearby delivery boys`);
      return data.deliveryBoys || [];
    } catch (error) {
      console.error('❌ Error fetching nearby delivery boys:', error);
      throw error;
    }
  }

  /**
   * Calculate distance between two points
   */
  async calculateDistance(
    point1: [number, number],
    point2: [number, number]
  ): Promise<string> {
    try {
      // Validate input points
      if (!Array.isArray(point1) || !Array.isArray(point2) ||
        point1.length !== 2 || point2.length !== 2) {
        throw new Error('Invalid point format. Expected [latitude, longitude] arrays.');
      }

      const [lat1, lon1] = point1;
      const [lat2, lon2] = point2;

      if (
        typeof lat1 !== 'number' || typeof lon1 !== 'number' ||
        typeof lat2 !== 'number' || typeof lon2 !== 'number' ||
        isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2) ||
        lat1 < -90 || lat1 > 90 || lat2 < -90 || lat2 > 90 ||
        lon1 < -180 || lon1 > 180 || lon2 < -180 || lon2 > 180
      ) {
        throw new Error(
          `Invalid coordinates: point1=[${lat1}, ${lon1}], point2=[${lat2}, ${lon2}]`
        );
      }

      const response = await fetch(`${LOCATIONS_API}/distance`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          point1,
          point2
        })
      });

      if (!response.ok) {
        let errorDetail = response.statusText;
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorDetail = errorData.message;
          }
        } catch (e) {
          // If response body isn't JSON, use statusText
        }
        throw new Error(`Failed to calculate distance: ${errorDetail}`);
      }

      const data = await response.json();
      return data.distance;
    } catch (error) {
      console.error('❌ Error calculating distance:', error);
      throw error;
    }
  }
}

export const locationService = new LocationService();

export default locationService;
