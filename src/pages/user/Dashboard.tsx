import { motion } from 'framer-motion';
import { toast } from "sonner";
import { Link } from 'react-router-dom';
import {
  Search, MapPin, Clock, Star, TrendingUp, ChevronRight, Utensils,
  Navigation, Bell, User, X, Filter, Home, Building,
  Zap, Truck, Shield, DollarSign, Sparkles, Award, Heart, ChevronDown, Check,
  Plus, Loader2, Target, AlertCircle,
  Settings, LogOut, Package, History, HelpCircle, Gift, ShieldCheck, CreditCard,
  Mail, Phone, Map, CheckCircle, AlertTriangle, Info, Percent, ShoppingBag,
  Truck as TruckIcon, CookingPot
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserData } from '@/contexts/UserDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { AutoLocationStatus } from '@/components/location/AutoLocationStatus';
import { useAutoLocation } from '@/hooks/useAutoLocation';
import { getRestaurantStatus } from '@/utils/restaurantStatus';
import heroVideo from '@/assets/hero-food.mp4';
import pizzaImage from '@/assets/pizza ai bg.png';
import burgerImage from '@/assets/burger.png';
import sushiImage from '@/assets/sushi.png';
import indianImage from '@/assets/indian.png';
import icecreamImage from '@/assets/icecream.png';
import drinksImage from '@/assets/drinks.png';
import italianImage from '@/assets/italian.png';
import chineseImage from '@/assets/chinese.png';
import mexicanImage from '@/assets/mexican.png';
import veganImage from '@/assets/vegan.png';
import breakfastImage from '@/assets/breakfast.png';
import punjabiImage from '@/assets/punjabi.png';
import kathiyawadiImage from '@/assets/kathiyawadi.png';
import southIndianImage from '@/assets/south_indian.png';
import gujaratiImage from '@/assets/gujarati.png';

const categories = [
  { id: 1, name: 'Pizza', icon: '🍕', image: pizzaImage, color: 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200' },
  { id: 2, name: 'Burgers', icon: '🍔', image: burgerImage, color: 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200' },
  { id: 3, name: 'Sushi', icon: '🍣', image: sushiImage, color: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200' },
  { id: 4, name: 'Indian', icon: '🍛', image: indianImage, color: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200' },
  { id: 5, name: 'Chinese', icon: '🥡', image: chineseImage, color: 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200' },
  { id: 6, name: 'Mexican', icon: '🌮', image: mexicanImage, color: 'bg-teal-100 text-teal-700 border-teal-200 hover:bg-teal-200' },
  { id: 7, name: 'Italian', icon: '🍝', image: italianImage, color: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' },
  { id: 9, name: 'Desserts', icon: '🍰', image: icecreamImage, color: 'bg-pink-100 text-pink-700 border-pink-200 hover:bg-pink-200' },
  { id: 10, name: 'Coffee', icon: '☕', image: drinksImage, color: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200' },
  { id: 11, name: 'Healthy', icon: '🥗', image: veganImage, color: 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200' },
  { id: 13, name: 'Breakfast', icon: '🍳', image: breakfastImage, color: 'bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200' },
  { id: 15, name: 'Gujarati', icon: '🥪', image: gujaratiImage, color: 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200' },
  { id: 16, name: 'Punjabi', icon: '🍛', image: punjabiImage, color: 'bg-cyan-100 text-cyan-700 border-cyan-200 hover:bg-cyan-200' },
  { id: 17, name: 'South Indian', icon: '🥥', image: southIndianImage, color: 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200' },
  { id: 18, name: 'Kathiyawadi', icon: '🌶️', image: kathiyawadiImage, color: 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200' },
];

// Advanced filter options
const filterOptions = [
  { id: 'under_100', name: 'Under ₹100', icon: DollarSign, description: 'Budget friendly options' },
  { id: '100_200', name: '₹100 – ₹200', icon: DollarSign, description: 'Great value meals' },
  { id: '200_400', name: '₹200 – ₹400', icon: DollarSign, description: 'Premium dining' },
  { id: 'above_400', name: '₹400+', icon: DollarSign, description: 'Luxury experience' },
];

// Sample delivery addresses
interface SavedAddress {
  id: string | number;
  type: string;
  name: string;
  address: string;
  isDefault: boolean;
  coordinates?: { latitude: number; longitude: number };
  isNew?: boolean;
}

const savedAddresses: SavedAddress[] = [];

// Profile menu items
const profileMenuItems = [
  { id: 'profile', name: 'My Profile', icon: User, description: 'View & edit your profile' },
  { id: 'orders', name: 'My Orders', icon: Package, description: 'Order history & tracking' },
];

// Sample notifications data - Empty initially, only real notifications from socket
const initialNotifications = [];

export default function UserDashboard() {
  const { restaurants, activeOrder, refreshRestaurants, menuItems } = useUserData();
  const { user, logout } = useAuth();
  const { location: autoLocation, isUpdating: isLocationUpdating, error: locationError } = useAutoLocation();

  // State for search and filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState(restaurants);
  const [filteredCategories, setFilteredCategories] = useState(categories.slice(0, 6));

  // Promo codes state
  const [promoCodes, setPromoCodes] = useState([]);
  const [copiedCode, setCopiedCode] = useState(null);
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);

  // Stats state
  const [stats, setStats] = useState({
    appRating: '4.9',
    averageDelivery: '25min',
    restaurants: '500+'
  });

  // Force re-render every minute to update restaurant status (Open/Closed) in real-time
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Fetch real stats from backend
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const API_ORIGIN = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const API_BASE_URL = typeof API_ORIGIN === 'string' && API_ORIGIN.endsWith('/api') ? API_ORIGIN : `${API_ORIGIN}/api`;
        const response = await fetch(`${API_BASE_URL}/stats`);
        if (response.ok) {
          const data = await response.json();
          setStats({
            appRating: data.appRating.toFixed(1),
            averageDelivery: `${data.averageDelivery}min`,
            restaurants: `${data.totalRestaurants}+`
          });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  // Fetch active promo codes from all restaurants
  useEffect(() => {
    const fetchPromoCodes = async () => {
      try {
        const allPromoCodes = [];
        // Fetch promo codes for each restaurant
        for (const restaurant of restaurants) {
          const API_ORIGIN = import.meta.env.VITE_API_URL || 'http://localhost:5000';
          const API_BASE_URL = typeof API_ORIGIN === 'string' && API_ORIGIN.endsWith('/api') ? API_ORIGIN : `${API_ORIGIN}/api`;
          const response = await fetch(`${API_BASE_URL}/promo-codes/restaurant/${restaurant.id}`);
          if (response.ok) {
            const codes = await response.json();
            // Add restaurant info to each code
            const codesWithRestaurant = codes.map(code => ({
              ...code,
              restaurantName: restaurant.name,
              restaurantImage: restaurant.image
            }));
            allPromoCodes.push(...codesWithRestaurant);
          }
        }
        setPromoCodes(allPromoCodes);
      } catch (error) {
        console.error('Error fetching promo codes:', error);
      }
    };

    if (restaurants.length > 0) {
      fetchPromoCodes();
    }
  }, [restaurants]);

  const handleCopyPromoCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Auto-scroll promo codes
  useEffect(() => {
    if (promoCodes.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentPromoIndex((prev) => (prev + 1) % promoCodes.length);
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, [promoCodes.length]);

  // State for delivery address management
  const [currentAddress, setCurrentAddress] = useState(savedAddresses[0] || null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [userAddresses, setUserAddresses] = useState(savedAddresses);
  const [newAddress, setNewAddress] = useState('');
  const [addressName, setAddressName] = useState('');
  const [addressType, setAddressType] = useState('home');
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);

  // State for live location
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [manualLocationError, setManualLocationError] = useState(null);
  const [liveLocation, setLiveLocation] = useState(null);

  // State for filter dropdown
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);


  // Use auto-detected location for display (city name)
  const displayCity = autoLocation?.address || 'Detecting location...';
  const hasLocationActive = autoLocation && !isLocationUpdating;

  // Safe address fallbacks (for manual address modal - still keep for future)
  const activeAddress = currentAddress || liveLocation;
  const displayAddressName = activeAddress?.name || 'Set address';
  const displayAddressShort = hasLocationActive ? displayCity : 'Set your address';

  // Request notification permissions on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Enhanced filter restaurants function
  useEffect(() => {
    let result = [...restaurants];

    // Filter by search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(restaurant => {
        const matchesRestaurant =
          restaurant.name.toLowerCase().includes(query) ||
          restaurant.cuisine.toLowerCase().includes(query) ||
          restaurant.description?.toLowerCase().includes(query);

        const matchesMenuItem = menuItems.some(item =>
          item.restaurantId === restaurant.id &&
          ((item.name && item.name.toLowerCase().includes(query)) ||
            (item.description && item.description.toLowerCase().includes(query)))
        );

        return matchesRestaurant || matchesMenuItem;
      });
    }

    // Note: Cuisine filtering is now handled by backend via refreshRestaurants
    // But we also apply client-side filtering as a robust fallback to ensure only matching restaurants are shown,
    // especially if backend returns a superset or if data sync is pending.
    if (selectedCategory !== 'All') {
      result = result.filter(restaurant =>
        restaurant.cuisine.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        // Also check if the category is part of comma-separated list
        restaurant.cuisine.toLowerCase().split(',').map(c => c.trim()).some(c => c === selectedCategory.toLowerCase())
      );
    }


    // Apply Price Range filters
    if (activeFilters.length > 0) {
      result = result.filter(restaurant => {
        // Find items belonging to this restaurant to determine its price bracket
        const rItems = menuItems.filter(item => item.restaurantId === restaurant.id);

        // If no items, we can't accurately price it, but we'll include it or assume an average.
        // For accurate filtering, if we don't have items, we might exclude it, but let's be safe.
        if (rItems.length === 0) return true;

        // Calculate average item price for the restaurant to categorize it
        const avgPrice = rItems.reduce((sum, item) => sum + item.price, 0) / rItems.length;

        // Check against active filters
        return activeFilters.some(filter => {
          if (filter === 'under_100') return avgPrice < 100;
          if (filter === '100_200') return avgPrice >= 100 && avgPrice <= 200;
          if (filter === '200_400') return avgPrice > 200 && avgPrice <= 400;
          if (filter === 'above_400') return avgPrice > 400;
          return false;
        });
      });
    }

    // Inject isOpen property dynamically
    result = result.map(r => {
      const status = getRestaurantStatus(
        r.openTime || r.openingTime || '10:00',
        r.closeTime || r.closingTime || '22:00',
        30,
        undefined,
        r.openingPeriod || 'AM',
        r.closingPeriod || 'PM'
      );

      return {
        ...r,
        status,
        isOpen: status === 'OPEN' || status === 'CLOSING_SOON'
      };
    });
    setFilteredRestaurants(result);
  }, [searchQuery, activeFilters, restaurants, menuItems]);

  // Toggle showing all categories
  const toggleShowAllCategories = () => {
    setShowAllCategories(!showAllCategories);
    setFilteredCategories(showAllCategories ? categories.slice(0, 6) : categories);
  };

  // Handle category selection
  // Handle category selection
  const handleCategorySelect = (categoryName: string) => {
    const newCategory = selectedCategory === categoryName ? 'All' : categoryName;
    setSelectedCategory(newCategory);
    console.log(`[Dashboard] Selected category: ${newCategory}`);
    refreshRestaurants(newCategory === 'All' ? undefined : newCategory);
  };

  // Handle filter toggle
  const handleFilterToggle = (filterId) => {
    setActiveFilters(prev =>
      prev.includes(filterId)
        ? prev.filter(f => f !== filterId)
        : [...prev, filterId]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setActiveFilters([]);
    refreshRestaurants(); // Fetch all restaurants
  };

  // Get user's live location
  const getLiveLocation = () => {
    if (!navigator.geolocation) {
      setManualLocationError('Geolocation is not supported by your browser');
      return;
    }

    setIsGettingLocation(true);
    setManualLocationError(null);
    setLiveLocation(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Use OpenStreetMap Nominatim API for reverse geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );

          if (!response.ok) {
            throw new Error('Failed to fetch address');
          }

          const data = await response.json();

          let addressString = '';
          if (data.address) {
            const addr = data.address;
            if (addr.road) addressString += addr.road + ', ';
            if (addr.suburb) addressString += addr.suburb + ', ';
            if (addr.city || addr.town || addr.village) {
              addressString += (addr.city || addr.town || addr.village) + ', ';
            }
            if (addr.state) addressString += addr.state;

            // If we couldn't construct a detailed address, use display name
            if (addressString.trim().length < 5) {
              addressString = data.display_name.split(',')[0] + ', ' + (addr.city || addr.town || 'Current Location');
            }
          } else {
            addressString = `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`;
          }

          const liveLocationObj = {
            id: 'live-location',
            type: 'current',
            name: 'Current Location',
            address: addressString,
            isDefault: false,
            coordinates: { latitude, longitude }
          };

          setLiveLocation(liveLocationObj);
          setCurrentAddress(liveLocationObj);
          setIsGettingLocation(false);

          // Show success message
          setTimeout(() => {
            setLiveLocation(prev => ({ ...prev, isNew: false }));
          }, 3000);

          // Add notification for location update
          addNotification({
            type: 'location',
            title: 'Location Updated',
            message: `Your delivery location has been updated to: ${addressString}`,
            icon: MapPin,
            color: 'bg-green-100 text-green-600'
          });

        } catch (error) {
          console.error('Geocoding error:', error);
          setManualLocationError('Could not get address details for your location');
          setIsGettingLocation(false);

          // Add error notification
          addNotification({
            type: 'error',
            title: 'Location Error',
            message: 'Failed to get your current location. Please try again.',
            icon: AlertTriangle,
            color: 'bg-red-100 text-red-600'
          });
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Failed to get your location. ';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please enable location permissions in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += 'An unknown error occurred.';
        }

        setManualLocationError(errorMessage);
        setIsGettingLocation(false);

        // Add error notification
        addNotification({
          type: 'error',
          title: 'Location Permission',
          message: 'Please enable location permissions to use this feature.',
          icon: AlertCircle,
          color: 'bg-orange-100 text-orange-600'
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Address management functions
  const handleAddressSelect = (address) => {
    setCurrentAddress(address);
    setShowAddressModal(false);

    // Add notification for address change
    addNotification({
      type: 'location',
      title: 'Delivery Address Updated',
      message: `Now delivering to: ${address.name}`,
      icon: Home,
      color: 'bg-blue-100 text-blue-600'
    });
  };

  const handleAddNewAddress = () => {
    if (!newAddress.trim() || !addressName.trim()) {
      alert('Please fill in all fields');
      return;
    }

    const newAddressObj = {
      id: userAddresses.length + 1,
      type: addressType,
      name: addressName,
      address: newAddress,
      isDefault: false
    };

    setUserAddresses([...userAddresses, newAddressObj]);
    setCurrentAddress(newAddressObj);
    setNewAddress('');
    setAddressName('');
    setIsAddingNewAddress(false);

    // Add notification for new address
    addNotification({
      type: 'address',
      title: 'New Address Saved',
      message: `Added "${addressName}" to your saved addresses`,
      icon: CheckCircle,
      color: 'bg-green-100 text-green-600'
    });
  };

  const handleSetDefault = (addressId) => {
    const updatedAddresses = userAddresses.map(addr => ({
      ...addr,
      isDefault: addr.id === addressId
    }));
    setUserAddresses(updatedAddresses);
    setCurrentAddress(updatedAddresses.find(addr => addr.id === addressId));

    // Add notification for default address change
    const address = updatedAddresses.find(addr => addr.id === addressId);
    addNotification({
      type: 'address',
      title: 'Default Address Updated',
      message: `Set "${address.name}" as your default delivery address`,
      icon: Star,
      color: 'bg-yellow-100 text-yellow-600'
    });
  };

  const handleDeleteAddress = (addressId) => {
    if (userAddresses.length <= 1) {
      alert('You must have at least one address saved');
      return;
    }

    const addressToDelete = userAddresses.find(addr => addr.id === addressId);
    const updatedAddresses = userAddresses.filter(addr => addr.id !== addressId);
    setUserAddresses(updatedAddresses);

    if (currentAddress.id === addressId) {
      const defaultAddr = updatedAddresses.find(addr => addr.isDefault) || updatedAddresses[0];
      setCurrentAddress(defaultAddr);
    }

    // Add notification for address deletion
    addNotification({
      type: 'address',
      title: 'Address Removed',
      message: `Removed "${addressToDelete.name}" from saved addresses`,
      icon: Info,
      color: 'bg-gray-100 text-gray-600'
    });
  };

  // Helper function to add notification (for non-order events like address changes)
  const addNotification = (notification) => {
    // These are handled locally as they're not order-related
    // Order notifications come from socket events in context
  };

  // Get visible restaurants for different sections
  const popularRestaurants = filteredRestaurants
    .filter(r => r.rating >= 4.0)
    .slice(0, 6);

  const allRestaurants = filteredRestaurants;

  // Get icon for address type
  const getAddressIcon = (type) => {
    switch (type) {
      case 'home': return <Home className="w-5 h-5" />;
      case 'work': return <Building className="w-5 h-5" />;
      case 'current': return <Target className="w-5 h-5" />;
      default: return <MapPin className="w-5 h-5" />;
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen pb-24 lg:pb-8 bg-white">
      {/* Address Change Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Select Delivery Address</h2>
                <button
                  onClick={() => setShowAddressModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Live Location Section */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-700 mb-3">Current Location</h3>
                <div className="space-y-3">
                  {liveLocation ? (
                    <div
                      className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${currentAddress.id === 'live-location'
                        ? 'border-green-500 bg-green-50'
                        : 'border-green-200 hover:border-green-300 hover:bg-green-50'
                        }`}
                      onClick={() => handleAddressSelect(liveLocation)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${currentAddress.id === 'live-location'
                            ? 'bg-green-500 text-white animate-pulse'
                            : 'bg-green-100 text-green-600'
                            }`}>
                            <Target className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900">
                                {liveLocation.name}
                              </span>
                              {liveLocation.isNew && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full animate-pulse">
                                  New
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{liveLocation.address}</p>
                            <div className="flex items-center gap-1 mt-2">
                              <span className="text-xs text-green-600 font-medium">
                                📍 Live location
                              </span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-500">
                                Updated just now
                              </span>
                            </div>
                          </div>
                        </div>
                        {currentAddress.id === 'live-location' && (
                          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center animate-pulse">
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={getLiveLocation}
                      disabled={isGettingLocation}
                      className={`w-full p-4 rounded-xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center gap-3 ${isGettingLocation
                        ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                        : 'border-green-200 hover:border-green-300 hover:bg-green-50 hover:border-solid'
                        }`}
                    >
                      {isGettingLocation ? (
                        <>
                          <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
                          <div className="text-center">
                            <p className="font-medium text-gray-900">Getting your location...</p>
                            <p className="text-xs text-gray-500 mt-1">Please wait</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="p-3 bg-green-100 rounded-full">
                            <Navigation className="w-6 h-6 text-green-600" />
                          </div>
                          <div className="text-center">
                            <p className="font-medium text-gray-900">Use Current Location</p>
                            <p className="text-xs text-gray-500 mt-1">Tap to detect your live location</p>
                          </div>
                        </>
                      )}
                    </button>
                  )}

                  {manualLocationError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-red-700">{manualLocationError}</p>
                      </div>
                      <button
                        onClick={() => setManualLocationError(null)}
                        className="text-xs text-red-600 hover:text-red-800 mt-2 font-medium"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Saved Addresses */}
              <div className="space-y-3 mb-6">
                <h3 className="font-medium text-gray-700 mb-2">Saved Addresses</h3>
                {userAddresses.map((address) => (
                  <div
                    key={address.id}
                    className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${currentAddress.id === address.id
                      ? 'border-[#FF7A00] bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    onClick={() => handleAddressSelect(address)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${currentAddress.id === address.id ? 'bg-[#FF7A00] text-white' : 'bg-gray-100 text-gray-600'
                          }`}>
                          {getAddressIcon(address.type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{address.name}</span>
                            {address.isDefault && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{address.address}</p>
                        </div>
                      </div>
                      {currentAddress.id === address.id && (
                        <div className="w-5 h-5 rounded-full bg-[#FF7A00] flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetDefault(address.id);
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Set as Default
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAddress(address.id);
                        }}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Address Section */}
              {isAddingNewAddress ? (
                <div className="space-y-4 border-t pt-6">
                  <h3 className="font-medium text-gray-700">Add New Address</h3>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address Name
                      </label>
                      <input
                        type="text"
                        value={addressName}
                        onChange={(e) => setAddressName(e.target.value)}
                        placeholder="e.g., Home, Office, Gym"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF7A00] focus:border-[#FF7A00]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address Type
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {['home', 'work', 'other'].map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setAddressType(type)}
                            className={`p-3 rounded-lg border flex flex-col items-center gap-1 ${addressType === type
                              ? 'border-[#FF7A00] bg-orange-50'
                              : 'border-gray-300 hover:border-gray-400'
                              }`}
                          >
                            {getAddressIcon(type)}
                            <span className="text-xs font-medium capitalize">{type}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Address
                      </label>
                      <textarea
                        value={newAddress}
                        onChange={(e) => setNewAddress(e.target.value)}
                        placeholder="Enter your full address including street, city, and zip code"
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF7A00] focus:border-[#FF7A00]"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleAddNewAddress}
                      disabled={!newAddress.trim() || !addressName.trim()}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${!newAddress.trim() || !addressName.trim()
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white'
                        }`}
                    >
                      Save Address
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingNewAddress(false)}
                      className="flex-1 py-2 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingNewAddress(true)}
                  className="w-full py-3 bg-orange-50 hover:bg-orange-100 text-[#FF7A00] border border-orange-200 rounded-lg font-medium transition-all duration-200 flex items-center justify-center"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add New Address
                </button>
              )}

              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowAddressModal(false)}
                  className="w-full py-3 bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white rounded-lg font-medium transition-all duration-200"
                >
                  Deliver to {displayAddressName}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}





      {/* Hero Section */}
      <div className="relative px-4 lg:px-8 pt-8 lg:pt-16 pb-20 lg:pb-28 overflow-hidden">
        <div className="absolute inset-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          >
            <source src={heroVideo} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30"></div>
        </div>

        <div className="max-w-7xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="space-y-8"
          >
            {/* User Welcome Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-2">
                <p className="text-white/90 text-sm font-medium">
                  Good afternoon,
                </p>
                <h1 className="text-2xl lg:text-3xl font-bold text-white">
                  {user?.name || 'Welcome back'} 👋
                </h1>
              </div>
            </div>

            {/* Hero Content */}
            <div className="max-w-2xl space-y-6">
              <div className="space-y-4">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-4xl lg:text-5xl font-bold text-white leading-tight"
                >
                  Delicious Food,<br />
                  <span className="text-[#FF7A00]">Delivered Fast</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-lg text-white/90 leading-relaxed"
                >
                  Order from the best local restaurants with easy on-demand delivery.
                  Fresh meals at your doorstep in minutes.
                </motion.p>
              </div>

              {/* Search Bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="relative group"
              >
                <div className="absolute -inset-0.5 bg-white/30 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-300"></div>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for restaurants or dishes..."
                    className="w-full h-14 pl-12 pr-12 bg-white rounded-xl text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-3 focus:ring-[#FF7A00]/50 border border-transparent hover:border-[#FF7A00]/30 transition-all duration-300 shadow-lg"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </motion.div>

              {/* Stats Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#FF7A00]/20 rounded-lg">
                    <Star className="w-5 h-5 text-[#FF7A00]" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white">{stats.appRating}</p>
                    <p className="text-sm text-white/80">App Rating</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#FF7A00]/20 rounded-lg">
                    <Clock className="w-5 h-5 text-[#FF7A00]" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white">{stats.averageDelivery}</p>
                    <p className="text-sm text-white/80">Avg Delivery</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#FF7A00]/20 rounded-lg">
                    <MapPin className="w-5 h-5 text-[#FF7A00]" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white">{stats.restaurants}</p>
                    <p className="text-sm text-white/80">Restaurants</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content - Added spacing after hero */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-12 lg:pt-16">
        {/* Active Order Banner */}
        {activeOrder && activeOrder.status !== 'delivered' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <Link to={activeOrder?.id ? `/user/tracking/${activeOrder.id}` : '/user/orders'}>
              <div className="relative group cursor-pointer">
                <div className="absolute -inset-0.5 bg-green-500 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                <div className="relative bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-5 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center animate-pulse">
                          <Clock className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-[10px] font-bold text-white">!</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-lg text-gray-900">Order in Progress 🚀</p>
                        <p className="text-sm text-gray-600">
                          {activeOrder.restaurantName} • {activeOrder.status.replace('_', ' ').toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 whitespace-nowrap"
                      >
                        Track Order
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
                      <span className="text-gray-600">
                        Order #ORD{activeOrder.id?.toString().padStart(4, '0')}
                      </span>
                      <span className="font-medium text-green-600">
                        ETA: 25-30 mins
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* Search & Filter Results Bar */}
        {(searchQuery || selectedCategory !== 'All' || activeFilters.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6"
          >
            <div className="bg-gradient-to-r from-[#FF7A00]/10 to-orange-50 border border-orange-200 rounded-2xl p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Filter className="w-5 h-5 text-[#FF7A00]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {filteredRestaurants.length} {filteredRestaurants.length === 1 ? 'restaurant' : 'restaurants'} found
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {searchQuery && (
                        <span className="inline-flex items-center gap-1 bg-white px-3 py-1 rounded-full text-sm border border-orange-200">
                          Search: "{searchQuery}"
                          <button
                            onClick={() => setSearchQuery('')}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )}
                      {selectedCategory !== 'All' && (
                        <span className="inline-flex items-center gap-1 bg-white px-3 py-1 rounded-full text-sm border border-orange-200">
                          Category: {selectedCategory}
                          <button
                            onClick={() => setSelectedCategory('All')}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )}
                      {activeFilters.map(filterId => {
                        const filter = filterOptions.find(f => f.id === filterId);
                        return filter ? (
                          <span key={filterId} className="inline-flex items-center gap-1 bg-white px-3 py-1 rounded-full text-sm border border-orange-200">
                            {filter.name}
                            <button
                              onClick={() => handleFilterToggle(filterId)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="border-orange-300 text-orange-600 hover:bg-orange-50 transition-all duration-300"
                >
                  Clear All Filters
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Promo Codes / Offers Section - Creative Auto-Scroll Carousel */}
        {promoCodes.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.4 }}
            className="mb-12"
          >
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="flex items-center justify-between mb-6"
            >
              <div className="space-y-2">
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="text-3xl lg:text-4xl font-bold text-gray-900 flex items-center gap-3"
                >
                  <motion.div
                    animate={{
                      rotate: [0, -10, 10, -10, 0],
                      scale: [1, 1.1, 1, 1.1, 1]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3
                    }}
                  >
                    <Gift className="w-8 h-8 lg:w-9 lg:h-9 text-[#FF7A00]" />
                  </motion.div>
                  <span className="bg-gradient-to-r from-[#FF7A00] to-orange-600 bg-clip-text text-transparent">
                    Special Offers
                  </span>
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="text-sm lg:text-base text-gray-600 font-medium ml-11"
                >
                  Grab these deals before they expire! ⏰
                </motion.p>
              </div>
              <div className="flex items-center gap-2">
                {promoCodes.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPromoIndex(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${index === currentPromoIndex
                      ? 'w-8 bg-[#FF7A00]'
                      : 'w-2 bg-gray-300 hover:bg-gray-400'
                      }`}
                  />
                ))}
              </div>
            </motion.div>

            {/* Auto-Scrolling Carousel */}
            <div className="relative overflow-hidden rounded-3xl">
              <div
                className="flex transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${currentPromoIndex * 100}%)` }}
              >
                {promoCodes.map((promo, index) => (
                  <div
                    key={promo._id}
                    className="w-full flex-shrink-0"
                  >
                    {/* Creative Advertisement Card */}
                    <div className="relative group bg-gradient-to-br from-orange-400 via-orange-500 to-red-500 rounded-3xl overflow-hidden shadow-2xl border border-white/10 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(255,122,0,0.35)]">
                      {/* Animated Background Pattern */}
                      <div className="absolute inset-0 opacity-15">
                        <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl animate-pulse" />
                        <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-300 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                      </div>
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.22),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.16),transparent_25%),radial-gradient(circle_at_50%_90%,rgba(255,255,255,0.18),transparent_30%)] opacity-70" />
                      <div className="absolute inset-0 mix-blend-screen opacity-40 animate-[spin_18s_linear_infinite]" style={{ background: 'conic-gradient(from 90deg, rgba(255,255,255,0.25), transparent 45%, rgba(255,255,255,0.25), transparent 75%)' }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/5" />

                      <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
                        {/* Left Side - Offer Details */}
                        <div className="flex-1 text-white">
                          {/* Restaurant Badge */}
                          <motion.div
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center gap-3 bg-white/15 backdrop-blur-md px-4 py-2 rounded-full mb-4 border border-white/20 shadow-lg"
                          >
                            <img
                              src={promo.restaurantImage}
                              alt={promo.restaurantName}
                              className="w-8 h-8 rounded-full object-cover border-2 border-white"
                            />
                            <span className="font-semibold">{promo.restaurantName}</span>
                            <Sparkles className="w-4 h-4" />
                          </motion.div>

                          {/* Main Offer */}
                          <motion.div
                            initial={{ x: -40, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="space-y-2"
                          >
                            <h3 className="text-5xl md:text-7xl font-black mb-2 drop-shadow-[0_12px_32px_rgba(0,0,0,0.25)]">
                              {promo.discountPercentage}% OFF
                            </h3>
                            <p className="text-xl md:text-2xl font-semibold text-orange-50/90">
                              {promo.description || 'Special Discount Just For You!'}
                            </p>
                            <div className="inline-flex items-center gap-2 rounded-full bg-black/15 px-4 py-2 text-sm font-medium text-white/90 border border-white/10 shadow-sm">
                              <Sparkles className="w-4 h-4" /> Limited-time spotlight
                            </div>
                          </motion.div>

                          {/* Terms */}
                          <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="flex flex-wrap gap-3 mb-6"
                          >
                            {promo.minOrderAmount > 0 && (
                              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-sm">
                                <ShoppingBag className="w-4 h-4" />
                                <span>Min ₹{promo.minOrderAmount}</span>
                              </div>
                            )}
                            {promo.expiryDate && (
                              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-sm">
                                <Clock className="w-4 h-4" />
                                <span>Valid till {new Date(promo.expiryDate).toLocaleDateString()}</span>
                              </div>
                            )}
                          </motion.div>

                          {/* Promo Code Section */}
                          <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                          >
                            <p className="text-sm font-medium mb-2 text-orange-100">Use Code</p>
                            <div className="flex items-center gap-3">
                              <div className="bg-white text-[#FF7A00] px-6 py-4 rounded-2xl border-4 border-white/30 backdrop-blur-md">
                                <span className="font-mono font-black text-3xl tracking-wider">
                                  {promo.code}
                                </span>
                              </div>
                              <button
                                onClick={() => handleCopyPromoCode(promo.code)}
                                className="group bg-white text-[#FF7A00] px-6 py-4 rounded-2xl font-bold text-lg hover:bg-orange-50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 flex items-center gap-2"
                              >
                                {copiedCode === promo.code ? (
                                  <>
                                    <CheckCircle className="w-6 h-6" />
                                    Copied!
                                  </>
                                ) : (
                                  <>
                                    <Gift className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                                    Copy Code
                                  </>
                                )}
                              </button>
                            </div>
                          </motion.div>
                        </div>

                        {/* Right Side - Visual Element */}
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: 0.6, type: 'spring' }}
                          className="relative"
                        >
                          <div className="relative w-48 h-48 md:w-64 md:h-64">
                            {/* Animated Badge */}
                            <div className="absolute inset-0 bg-yellow-300 rounded-full animate-ping opacity-20" />
                            <div className="absolute inset-0 bg-gradient-to-br from-yellow-200 to-yellow-400 rounded-full flex items-center justify-center shadow-2xl">
                              <div className="text-center">
                                <Percent className="w-16 h-16 md:w-20 md:h-20 text-orange-600 mx-auto mb-2" />
                                <p className="text-orange-900 font-black text-2xl md:text-3xl">SAVE</p>
                                <p className="text-orange-900 font-black text-3xl md:text-5xl">BIG</p>
                              </div>
                            </div>
                            {/* Floating Elements */}
                            <div className="absolute -top-4 -right-4 bg-white rounded-full p-3 shadow-xl animate-bounce">
                              <Zap className="w-6 h-6 text-yellow-500" />
                            </div>
                            <div className="absolute -bottom-4 -left-4 bg-white rounded-full p-3 shadow-xl animate-bounce" style={{ animationDelay: '0.5s' }}>
                              <Star className="w-6 h-6 text-yellow-500" />
                            </div>
                          </div>
                        </motion.div>
                      </div>

                      {/* Corner Ribbon */}
                      <div className="absolute top-0 right-0">
                        <div className="bg-red-600 text-white px-8 py-2 transform rotate-45 translate-x-8 translate-y-4 shadow-lg">
                          <span className="text-sm font-bold">HOT DEAL</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Navigation Arrows */}
              {promoCodes.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentPromoIndex((prev) => (prev - 1 + promoCodes.length) % promoCodes.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-xl hover:scale-110 transition-all duration-300 z-10"
                  >
                    <ChevronRight className="w-6 h-6 rotate-180" />
                  </button>
                  <button
                    onClick={() => setCurrentPromoIndex((prev) => (prev + 1) % promoCodes.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-xl hover:scale-110 transition-all duration-300 z-10"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
          </motion.section>
        )}

        {/* Advanced Filter Options as Dropdown */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mb-8"
        >
          <div className="space-y-3 mb-6">
            <h2 className="text-xl font-bold text-gray-900">Filter Restaurants</h2>
            <p className="text-sm text-gray-600">Refine your search with advanced filters</p>
          </div>

          {/* Filter Dropdown & Veg Toggle Container */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center relative z-50">
            <div className="relative w-full sm:w-auto">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="w-full sm:w-auto px-6 py-3 bg-white border border-gray-300 hover:border-gray-400 rounded-xl font-medium text-gray-700 flex items-center justify-between gap-3 transition-all duration-300 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <Filter className="w-5 h-5 text-[#FF7A00]" />
                  <span>Price Range</span>
                  {activeFilters.length > 0 && (
                    <span className="px-2 py-0.5 bg-[#FF7A00] text-white text-xs font-medium rounded-full">
                      {activeFilters.length} selected
                    </span>
                  )}
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${showFilterDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Filter Dropdown Content */}
              {showFilterDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-auto mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-40 overflow-hidden min-w-[300px]"
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">Select Price Range</h3>
                      {activeFilters.length > 0 && (
                        <button
                          onClick={clearFilters}
                          className="text-sm text-[#FF7A00] hover:text-[#FF7A00]/80 font-medium"
                        >
                          Clear Selection
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {filterOptions.map((filter) => {
                        const isActive = activeFilters.includes(filter.id);
                        return (
                          <button
                            key={filter.id}
                            onClick={() => {
                              // Make it behaves like radio group (single select) for better UX
                              setActiveFilters(isActive ? [] : [filter.id]);
                            }}
                            className={`group p-3 rounded-lg border transition-all duration-200 text-left flex items-center justify-between ${isActive
                              ? 'border-[#FF7A00] bg-orange-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`text-base font-semibold ${isActive ? 'text-[#FF7A00]' : 'text-gray-700'}`}>
                                {filter.name}
                              </div>
                            </div>
                            {/* Radio button indicator */}
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isActive ? 'border-[#FF7A00]' : 'border-gray-300'}`}>
                              {isActive && <div className="w-2.5 h-2.5 bg-[#FF7A00] rounded-full" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Apply Filters Button */}
                    <div className="mt-6 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => setShowFilterDropdown(false)}
                        className="w-full py-3 bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white rounded-lg font-medium transition-all duration-200"
                      >
                        Apply Filters
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>


          </div>
          {/* Selected Filters Display */}
          {activeFilters.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {activeFilters.map(filterId => {
                const filter = filterOptions.find(f => f.id === filterId);
                return filter ? (
                  <span key={filterId} className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-3 py-1.5 rounded-full text-sm font-medium">
                    {filter.name}
                    <button
                      onClick={() => handleFilterToggle(filterId)}
                      className="text-orange-600 hover:text-orange-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ) : null;
              })}
            </div>
          )}
        </motion.section>

        {/* Categories Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mb-10"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-gray-900">
                Browse by Cuisine
              </h2>
              <p className="text-sm text-gray-600">
                Explore different food categories
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleShowAllCategories}
                className="group flex items-center gap-1 text-[#FF7A00] hover:text-[#FF7A00]/80 font-medium transition-colors w-fit hover:bg-orange-50 px-4 py-2 rounded-lg"
              >
                {showAllCategories ? 'Show Less' : 'See All'}
                <ChevronRight className={`w-4 h-4 group-hover:translate-x-1 transition-transform ${showAllCategories ? 'rotate-90' : ''}`} />
              </button>
            </div>
          </div>

          {/* All Categories Button */}
          <div className="mb-4">
            <button
              onClick={() => handleCategorySelect('All')}
              className={`px-4 py-2 rounded-lg border transition-all duration-300 ${selectedCategory === 'All'
                ? 'bg-[#FF7A00] text-white border-[#FF7A00] shadow-md'
                : 'bg-white text-gray-700 border-gray-300 hover:border-[#FF7A00]/50 hover:bg-orange-50'
                }`}
            >
              All Cuisines
            </button>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4 lg:gap-6">
            {filteredCategories.map(category => (
              <motion.div
                key={category.id}
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col gap-2"
              >
                <button
                  onClick={() => handleCategorySelect(category.name)}
                  className="group flex flex-col items-center gap-3 w-full cursor-pointer"
                >
                  <div className={cn(
                    'relative w-full aspect-square flex flex-col items-center justify-center rounded-2xl overflow-hidden transition-all duration-300',
                    'shadow-sm hover:shadow-md border border-transparent',
                    selectedCategory === category.name ? 'ring-2 ring-[#FF7A00] ring-offset-2' : 'hover:border-orange-100',
                    category.image ? 'bg-white' : `${category.color} border-0`
                  )}>
                    {category.image ? (
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <span className="text-4xl group-hover:scale-110 transition-transform duration-300">
                        {category.icon}
                      </span>
                    )}
                    {selectedCategory === category.name && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-[#FF7A00] rounded-full flex items-center justify-center shadow-sm z-20">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </div>

                  <span className={cn(
                    "text-sm font-medium text-center transition-colors",
                    selectedCategory === category.name ? "text-[#FF7A00] font-semibold" : "text-gray-700 group-hover:text-gray-900"
                  )}>
                    {category.name}
                  </span>
                </button>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Popular Restaurants Section */}
        {
          popularRestaurants.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="mb-10"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-[#FF7A00]" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-gray-900">
                      Popular Near {displayAddressName}
                    </h2>
                    <p className="text-sm text-gray-600">
                      Top-rated restaurants near {displayAddressShort}
                    </p>
                  </div>
                </div>
                <Link
                  to="/user/restaurants"
                  className="group flex items-center gap-2 text-[#FF7A00] hover:text-[#FF7A00]/80 font-medium transition-colors w-fit hover:bg-orange-50 px-4 py-2 rounded-lg"
                >
                  View All
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
                {popularRestaurants.map((restaurant, index) => (
                  <motion.div
                    key={restaurant.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index, duration: 0.3 }}
                    whileHover={{ y: -8 }}
                  >
                    <Link
                      to={restaurant.status === 'CLOSED' || restaurant.status === 'OPENING_SOON' ? '#' : `/user/restaurant/${restaurant.id}`}
                      className={`group block ${restaurant.status === 'CLOSED' || restaurant.status === 'OPENING_SOON' ? 'cursor-not-allowed grayscale-[0.3]' : ''}`}
                      onClick={(e) => {
                        if (restaurant.status === 'CLOSED' || restaurant.status === 'OPENING_SOON') {
                          e.preventDefault();
                          toast.error("Restaurant is currently closed. Please come back later.");
                        }
                      }}
                    >
                      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white hover:shadow-2xl transition-all duration-500 hover:border-[#FF7A00]/30">
                        {/* Restaurant Image */}
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={restaurant.image}
                            alt={restaurant.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                          {/* Status Badge */}
                          <div className="absolute top-3 left-3">
                            <span className={cn(
                              'px-3 py-1.5 rounded-full text-xs font-semibold border',
                              restaurant.status === 'OPEN' ? 'bg-green-100 text-green-800 border-green-200' :
                                restaurant.status === 'CLOSING_SOON' ? 'bg-red-100 text-red-800 border-red-200' :
                                  restaurant.status === 'OPENING_SOON' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                    'bg-gray-100 text-gray-800 border-gray-200'
                            )}>
                              {restaurant.status === 'OPEN' ? '🟢 OPEN' :
                                restaurant.status === 'CLOSING_SOON' ? '🔴 CLOSING SOON' :
                                  restaurant.status === 'OPENING_SOON' ? '🟡 OPENING SOON' :
                                    '🔴 CLOSED'}
                            </span>
                          </div>

                          {/* Feature Badges */}
                          <div className="absolute top-3 right-3 flex flex-col gap-1">
                            {restaurant.deliveryFee === 0 && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                FREE DELIVERY
                              </span>
                            )}
                            {parseInt(restaurant.deliveryTime) <= 30 && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                                FAST DELIVERY
                              </span>
                            )}
                          </div>

                          {/* View Details Overlay */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                            <p className="text-white text-sm font-medium flex items-center gap-2">
                              View Details
                              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </p>
                          </div>
                        </div>

                        {/* Restaurant Info */}
                        <div className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-lg text-gray-900 group-hover:text-[#FF7A00] transition-colors truncate">
                                {restaurant.name}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1 truncate">
                                {restaurant.cuisine}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 bg-gray-50 rounded-full px-3 py-1.5 ml-2 flex-shrink-0">
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              <span className="text-sm font-bold text-gray-900 ml-1">{restaurant.rating}</span>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-gray-100 text-sm">
                            <div className="flex items-center gap-1 text-gray-600">
                              <Clock className="w-4 h-4" />
                              <span className="font-medium">{restaurant.deliveryTime} min</span>
                            </div>
                            <div className="text-gray-900 font-semibold">
                              {(restaurant.deliveryFee || 0) === 0 ? (
                                <span className="text-green-600">Free Delivery</span>
                              ) : (
                                <span>Fee: <span className="text-[#FF7A00]">₹{restaurant.deliveryFee}</span></span>
                              )}
                            </div>

                          </div>
                        </div>
                      </div>
                    </Link>
                    {/* Matching Menu Items Display (Appears when price filter is active) */}
                    {activeFilters.length > 0 && (
                      <div className="mt-3 bg-orange-50/50 rounded-xl p-3 border border-orange-100">
                        <p className="text-xs font-semibold text-orange-800 mb-2 uppercase tracking-wide">
                          Matching Items ({menuItems.filter(item => {
                            if (item.restaurantId !== restaurant.id) return false;
                            return activeFilters.some(filter => {
                              if (filter === 'under_100') return item.price < 100;
                              if (filter === '100_200') return item.price >= 100 && item.price <= 200;
                              if (filter === '200_400') return item.price > 200 && item.price <= 400;
                              if (filter === 'above_400') return item.price > 400;
                              return false;
                            });
                          }).length})
                        </p>
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide py-1">
                          {menuItems.filter(item => {
                            if (item.restaurantId !== restaurant.id) return false;
                            return activeFilters.some(filter => {
                              if (filter === 'under_100') return item.price < 100;
                              if (filter === '100_200') return item.price >= 100 && item.price <= 200;
                              if (filter === '200_400') return item.price > 200 && item.price <= 400;
                              if (filter === 'above_400') return item.price > 400;
                              return false;
                            });
                          }).map(item => (
                            <div key={item.id} className="flex-shrink-0 w-48 bg-white border border-orange-200 rounded-lg overflow-hidden flex shadow-sm hover:shadow-md transition-shadow">
                              {item.image && (
                                <img src={item.image} alt={item.name} className="w-16 h-16 object-cover" />
                              )}
                              <div className="p-2 flex flex-col justify-center flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                                <div className="flex items-center gap-1 mt-1">
                                  {item.dietaryType === 'Veg' ? (
                                    <span className="w-2.5 h-2.5 rounded-sm border border-green-600 flex items-center justify-center"><span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span></span>
                                  ) : (
                                    <span className="w-2.5 h-2.5 rounded-sm border border-red-600 flex items-center justify-center"><span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span></span>
                                  )}
                                  <p className="text-[#FF7A00] font-bold text-sm">₹{item.price}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )
        }

        {/* All Restaurants Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Utensils className="w-5 h-5 text-[#FF7A00]" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-gray-900">
                  All Restaurants near {displayAddressName}
                  {selectedCategory !== 'All' && ` - ${selectedCategory}`}
                </h2>
                <p className="text-sm text-gray-600">
                  {searchQuery ? `Search results for "${searchQuery}"` : 'Browse all available restaurants'}
                  {selectedCategory !== 'All' && ` in ${selectedCategory}`}
                  {activeFilters.length > 0 && ' with selected filters'}
                </p>
              </div>
            </div>
            <div className="text-sm">
              <span className="font-medium text-gray-700 bg-gray-100 px-4 py-2 rounded-lg">
                {allRestaurants.length} restaurants {searchQuery || selectedCategory !== 'All' || activeFilters.length > 0 ? 'found' : 'available'}
              </span>
            </div>
          </div>

          {allRestaurants.length > 0 ? (
            <div className="space-y-4">
              {allRestaurants.map((restaurant, index) => (
                <motion.div
                  key={restaurant.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  whileHover={{ x: 5 }}
                >
                  <Link
                    to={restaurant.status === 'CLOSED' || restaurant.status === 'OPENING_SOON' ? '#' : `/user/restaurant/${restaurant.id}`}
                    className={`block ${restaurant.status === 'CLOSED' || restaurant.status === 'OPENING_SOON' ? 'cursor-not-allowed grayscale-[0.3]' : ''}`}
                    onClick={(e) => {
                      if (restaurant.status === 'CLOSED' || restaurant.status === 'OPENING_SOON') {
                        e.preventDefault();
                        toast.error("Restaurant is currently closed. Please come back later.");
                      }
                    }}
                  >
                    <div className="group bg-white border border-gray-200 hover:border-[#FF7A00]/30 rounded-xl p-4 flex flex-col sm:flex-row gap-4 hover:shadow-xl transition-all duration-300">
                      {/* Restaurant Image */}
                      <div className="relative flex-shrink-0 sm:w-24 sm:h-24 w-full h-48 sm:h-auto">
                        <div className="w-full h-full rounded-xl overflow-hidden">
                          <img
                            src={restaurant.image}
                            alt={restaurant.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                        <div className="absolute top-2 right-2 w-2 h-2">
                          <div className={cn(
                            'w-full h-full rounded-full',
                            restaurant.isOpen
                              ? 'bg-green-500 animate-pulse'
                              : 'bg-red-500'
                          )}></div>
                        </div>
                      </div>

                      {/* Restaurant Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg text-gray-900 group-hover:text-[#FF7A00] transition-colors truncate">
                              {restaurant.name}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1 truncate">
                              {restaurant.cuisine}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span className="text-xs text-gray-500">Rating</span>
                              <div className="flex items-center gap-1 justify-end">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                <span className="font-bold text-gray-900">{restaurant.rating}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                          {restaurant.deliveryFee === 0 && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                              Free Delivery
                            </span>
                          )}
                          {parseInt(restaurant.deliveryTime) <= 30 && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                              Fast Delivery
                            </span>
                          )}
                          {restaurant.discount && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                              {restaurant.discount}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 text-sm">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span className="font-medium text-gray-900">
                                {restaurant.deliveryTime}
                                {restaurant.deliveryTime && !restaurant.deliveryTime.toLowerCase().includes('min') ? ' min' : ''}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">Delivery:</span>
                              <span className={`font-bold ${(restaurant.deliveryFee || 0) === 0 ? 'text-green-600' : 'text-[#FF7A00]'}`}>
                                {(restaurant.deliveryFee || 0) === 0 ? 'Free' : `₹${restaurant.deliveryFee}`}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 mt-2 sm:mt-0">
                            <span className={cn(
                              'px-3 py-1 rounded-full text-xs font-semibold',
                              restaurant.status === 'OPEN' ? 'bg-green-100 text-green-800 border border-green-200' :
                                restaurant.status === 'CLOSING_SOON' ? 'bg-red-100 text-red-800 border border-red-200' :
                                  restaurant.status === 'OPENING_SOON' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                    'bg-gray-100 text-gray-800 border border-gray-200'
                            )}>
                              {restaurant.status === 'OPEN' ? 'Open Now' :
                                restaurant.status === 'CLOSING_SOON' ? 'Closing Soon' :
                                  restaurant.status === 'OPENING_SOON' ? 'Opening Soon' :
                                    'Closed'}
                            </span>
                            <div className="flex items-center gap-2 text-[#FF7A00] font-medium group-hover:gap-3 transition-all duration-300">
                              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                Order Now
                              </span>
                              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                  {/* Matching Menu Items Display (Appears when price filter is active) */}
                  {activeFilters.length > 0 && (
                    <div className="mt-3 bg-orange-50/50 rounded-xl p-3 border border-orange-100">
                      <p className="text-xs font-semibold text-orange-800 mb-2 uppercase tracking-wide">
                        Matching Items ({menuItems.filter(item => {
                          if (item.restaurantId !== restaurant.id) return false;
                          return activeFilters.some(filter => {
                            if (filter === 'under_100') return item.price < 100;
                            if (filter === '100_200') return item.price >= 100 && item.price <= 200;
                            if (filter === '200_400') return item.price > 200 && item.price <= 400;
                            if (filter === 'above_400') return item.price > 400;
                            return false;
                          });
                        }).length})
                      </p>
                      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide py-1">
                        {menuItems.filter(item => {
                          if (item.restaurantId !== restaurant.id) return false;
                          return activeFilters.some(filter => {
                            if (filter === 'under_100') return item.price < 100;
                            if (filter === '100_200') return item.price >= 100 && item.price <= 200;
                            if (filter === '200_400') return item.price > 200 && item.price <= 400;
                            if (filter === 'above_400') return item.price > 400;
                            return false;
                          });
                        }).map(item => (
                          <div key={item.id} className="flex-shrink-0 w-48 bg-white border border-orange-200 rounded-lg overflow-hidden flex shadow-sm hover:shadow-md transition-shadow">
                            {item.image && (
                              <img src={item.image} alt={item.name} className="w-16 h-16 object-cover" />
                            )}
                            <div className="p-2 flex flex-col justify-center flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                              <div className="flex items-center gap-1 mt-1">
                                {item.dietaryType === 'Veg' ? (
                                  <span className="w-2.5 h-2.5 rounded-sm border border-green-600 flex items-center justify-center"><span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span></span>
                                ) : (
                                  <span className="w-2.5 h-2.5 rounded-sm border border-red-600 flex items-center justify-center"><span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span></span>
                                )}
                                <p className="text-[#FF7A00] font-bold text-sm">₹{item.price}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-orange-100 flex items-center justify-center">
                <Search className="w-12 h-12 text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No restaurants found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery
                  ? `No restaurants found matching "${searchQuery}" near ${displayAddressName}`
                  : selectedCategory !== 'All'
                    ? `No restaurants found in category "${selectedCategory}" near ${displayAddressName}`
                    : activeFilters.length > 0
                      ? `No restaurants found with the selected filters near ${displayAddressName}`
                      : `No restaurants available near ${displayAddressName}`
                }
              </p>
              <button
                onClick={clearFilters}
                className="py-2 px-6 bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white rounded-lg font-medium transition-all duration-200"
              >
                Clear Filters & Show All
              </button>
            </div>
          )}
        </motion.section>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}