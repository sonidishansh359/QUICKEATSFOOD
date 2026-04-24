import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { Order } from '@/types/auth';
import { useAuth } from '@/contexts/AuthContext';
import { locationService } from '@/lib/locationService';

export interface DeliveryOrder extends Order {
  restaurantName: string;
  restaurantAddress: string;
  distance: string;
  pickupDistance?: number;
  deliveryDistance?: number;
  estimatedEarning: number;
  pickupTime?: string;
  paymentMethod?: 'cod' | 'online' | 'upi' | 'card';
  paymentStatus?: 'paid' | 'unpaid' | 'pay_on_delivery' | 'cash_collected';
}

// ... (removed orphaned code)

export interface DeliveryProfile {
  name: string;
  phone: string;
  email: string;
  vehicleType: 'bike' | 'scooter' | 'car';
  vehicleNumber: string;
  isOnline: boolean;
  rating: number;
  totalDeliveries: number;
  joinedDate: string;
  availableBalance?: number;
}

export interface DeliveryEarnings {
  today: number;
  todayOrders: number;
  thisWeek: number;
  weeklyOrders: number;
  thisMonth: number;
  monthlyOrders: number;
  pending: number;
}

export interface DeliveryNotification {
  id: string;
  type: 'new_order' | 'order_cancelled' | 'payment' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface DeliveryHistory {
  orderId: string;
  restaurantName: string;
  customerName: string;
  items: string;
  totalAmount: number;
  earnings: number;
  acceptedTime: string;
  deliveredTime: string;
  deliveryTime: number;
  date: string;
}

interface DeliveryDataContextType {
  profile: DeliveryProfile;
  updateProfile: (updates: Partial<DeliveryProfile>) => void;
  toggleOnlineStatus: () => void;
  orders: DeliveryOrder[];
  activeOrder: DeliveryOrder | null;
  acceptOrder: (orderId: string) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  earnings: DeliveryEarnings;
  deliveryHistory: DeliveryHistory[];
  notifications: DeliveryNotification[];
  unreadNotifications: number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
  currentLocation: { lat: number; lng: number };
  updateLocation: (lat: number, lng: number) => void;
}

const DeliveryDataContext = createContext<DeliveryDataContextType | undefined>(undefined);

const getStorageKey = (userId?: string) => userId ? `quickeats_delivery_data_${userId}` : 'quickeats_delivery_data';

const API_ORIGIN = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_BASE_URL = API_ORIGIN.endsWith('/api') ? API_ORIGIN : `${API_ORIGIN}/api`;

// Local Haversine fallback (km)
const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Helper function to calculate distance between two available points
const calculateOrderDistance = async (
  restaurantLocation: any,
  userLocation: any,
  riderLocation?: { lat: number; lng: number }
): Promise<string> => {
  const hasValidCoords = (loc?: { coordinates?: number[] }) => (
    Array.isArray(loc?.coordinates) &&
    loc.coordinates.length === 2 &&
    loc.coordinates.every((c) => typeof c === 'number' && !Number.isNaN(c)) &&
    !(loc.coordinates[0] === 0 && loc.coordinates[1] === 0)
  );

  // Pick the best available coordinate pair in priority order
  let pointA: [number, number] | null = null; // [lat, lng]
  let pointB: [number, number] | null = null;

  if (hasValidCoords(restaurantLocation) && riderLocation) {
    // Pickup distance (rider -> restaurant) - PRIORITY for Delivery Boy view
    const [restLng, restLat] = restaurantLocation.coordinates;
    pointA = [riderLocation.lat, riderLocation.lng];
    pointB = [restLat, restLng];
  } else if (hasValidCoords(restaurantLocation) && hasValidCoords(userLocation)) {
    // Delivery distance (restaurant -> customer) - Fallback
    const [restLng, restLat] = restaurantLocation.coordinates;
    const [userLng, userLat] = userLocation.coordinates;
    pointA = [restLat, restLng];
    pointB = [userLat, userLng];
  } else if (hasValidCoords(userLocation) && riderLocation) {
    // Rider -> customer as last resort
    const [userLng, userLat] = userLocation.coordinates;
    pointA = [riderLocation.lat, riderLocation.lng];
    pointB = [userLat, userLng];
  }

  if (!pointA || !pointB) {
    return 'N/A';
  }

  // Local fallback distance so UI never shows N/A when coords are present
  const localKm = haversineKm(pointA[0], pointA[1], pointB[0], pointB[1]);
  const formattedLocal = `${localKm.toFixed(1)} km`;

  try {
    const distance = await locationService.calculateDistance(pointA, pointB);
    return distance || formattedLocal;
  } catch (error) {
    console.warn('Distance API failed, using local calculation:', error);
    return formattedLocal;
  }
};

// Create an empty profile seeded from the authenticated user if available
const createEmptyProfile = (user?: { name?: string; email?: string }): DeliveryProfile => ({
  name: user?.name ?? 'Delivery Partner',
  phone: '',
  email: user?.email ?? '',
  vehicleType: 'bike',
  vehicleNumber: '',
  isOnline: false,
  rating: 0,
  totalDeliveries: 0,
  joinedDate: new Date().toISOString().slice(0, 10),
  availableBalance: 0,
});

const emptyEarnings: DeliveryEarnings = {
  today: 0,
  todayOrders: 0,
  thisWeek: 0,
  weeklyOrders: 0,
  thisMonth: 0,
  monthlyOrders: 0,
  pending: 0,
};

export function DeliveryDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<DeliveryProfile>(createEmptyProfile(user || undefined));
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [activeOrder, setActiveOrder] = useState<DeliveryOrder | null>(null);
  const [earnings, setEarnings] = useState<DeliveryEarnings>(emptyEarnings);
  const [deliveryHistory, setDeliveryHistory] = useState<DeliveryHistory[]>([]);
  const [notifications, setNotifications] = useState<DeliveryNotification[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [currentLocation, setCurrentLocation] = useState({ lat: 40.7128, lng: -74.006 });

  // Real-time geolocation tracking
  useEffect(() => {
    let watchId: number | null = null;
    if (navigator.geolocation && user?.role === 'delivery') {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          console.warn('Geolocation error:', err);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
      );
    }
    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [user?.role]);

  // Clear data on user change
  useEffect(() => {
    setProfile(createEmptyProfile(user || undefined));
    setOrders([]);
    setActiveOrder(null);
    setEarnings(emptyEarnings);
    setDeliveryHistory([]);
    setNotifications([]);
  }, [user?.id]);

  // Load earnings from localStorage on mount
  useEffect(() => {
    if (!user?.id) return;
    const earningsKey = `quickeats_delivery_${user.id}_earnings`;
    const historyKey = `quickeats_delivery_${user.id}_history`;

    try {
      const storedEarnings = localStorage.getItem(earningsKey);
      if (storedEarnings) {
        setEarnings(JSON.parse(storedEarnings));
      }
      const storedHistory = localStorage.getItem(historyKey);
      if (storedHistory) {
        setDeliveryHistory(JSON.parse(storedHistory));
      }
    } catch (err) {
      console.error('Failed to load delivery data from localStorage:', err);
    }
  }, [user?.id]);

  // Save earnings to localStorage when changed
  useEffect(() => {
    if (!user?.id) return;
    const earningsKey = `quickeats_delivery_${user.id}_earnings`;
    try {
      localStorage.setItem(earningsKey, JSON.stringify(earnings));
    } catch (err) {
      console.error('Failed to save earnings:', err);
    }
  }, [earnings, user?.id]);

  // Save delivery history to localStorage when changed
  useEffect(() => {
    if (!user?.id) return;
    const historyKey = `quickeats_delivery_${user.id}_history`;
    try {
      localStorage.setItem(historyKey, JSON.stringify(deliveryHistory));
    } catch (err) {
      console.error('Failed to save delivery history:', err);
    }
  }, [deliveryHistory, user?.id]);

  // Legacy: Load from combined storage key for backward compatibility
  useEffect(() => {
    const stored = localStorage.getItem(getStorageKey(user?.id));
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.profile) setProfile(parsed.profile);
        if (parsed.orders) setOrders(parsed.orders);
        if (parsed.activeOrder) setActiveOrder(parsed.activeOrder);
        if (parsed.notifications) setNotifications(parsed.notifications);
      } catch {
        console.error('Failed to parse delivery data');
      }
    }
  }, [user?.id]);

  const updateProfile = (updates: Partial<DeliveryProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  // Fetch delivery profile from backend (fields entered at signup)
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!user || user.role !== 'delivery') return;
        const storedAuth = localStorage.getItem('quickeats_auth');
        const token = storedAuth ? JSON.parse(storedAuth).token : null;
        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/delivery-boys/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;
        const data = await response.json();

        // Update profile
        setProfile(prev => ({
          ...prev,
          name: data.name || prev.name,
          email: data.email || prev.email,
          phone: data.phone || prev.phone,
          vehicleType: data.vehicleType || prev.vehicleType,
          vehicleNumber: data.licenseNumber || prev.vehicleNumber,
          isOnline: !!data.isAvailable,
          totalDeliveries: data.totalDeliveries || prev.totalDeliveries,
          rating: data.rating || prev.rating,
          joinedDate: data.joinedDate || prev.joinedDate,
          availableBalance: data.availableBalance || 0,
        }));

        // Update earnings from backend (this is the source of truth)
        if (data.earningsBreakdown) {
          setEarnings({
            today: data.earningsBreakdown.today || 0,
            todayOrders: data.earningsBreakdown.todayOrders || 0,
            thisWeek: data.earningsBreakdown.thisWeek || 0,
            weeklyOrders: data.earningsBreakdown.weeklyOrders || 0,
            thisMonth: data.earningsBreakdown.thisMonth || 0,
            monthlyOrders: data.earningsBreakdown.monthlyOrders || 0,
            pending: data.earningsBreakdown.pending || 0,
          });
        }

        // Update delivery history from backend
        if (data.deliveryHistory) {
          setDeliveryHistory(data.deliveryHistory);
        }

        console.log('✅ Loaded delivery profile from backend:', {
          totalDeliveries: data.totalDeliveries,
          todayEarnings: data.earningsBreakdown?.today,
          historyCount: data.deliveryHistory?.length
        });
      } catch (err) {
        console.error('Failed to fetch delivery profile', err);
      }
    };
    fetchProfile();
  }, [user?.id, user?.role, currentLocation.lat, currentLocation.lng]);

  // Fetch available orders (always for delivery role, regardless of online status)
  useEffect(() => {
    const fetchAvailableOrders = async () => {
      try {
        if (!user || user.role !== 'delivery') {
          setOrders([]);
          return;
        }
        const storedAuth = localStorage.getItem('quickeats_auth');
        const token = storedAuth ? JSON.parse(storedAuth).token : null;
        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/orders/available-deliveries?lat=${currentLocation.lat}&lng=${currentLocation.lng}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;
        const data = await response.json();

        // Map backend orders to delivery order format using backend distances
        const mappedOrders: DeliveryOrder[] = data.map((order: any) => {
          // Use backend provided distance if available, else calculate locally
          let distanceDisplay = 'N/A';

          if (order.pickupDistance !== undefined) {
            distanceDisplay = `${order.pickupDistance.toFixed(1)} km`;
          } else {
            // Fallback calculation (shouldn't be needed with new backend)
            const dist = haversineKm(
              currentLocation.lat,
              currentLocation.lng,
              order.restaurant?.location?.coordinates?.[1] || 0,
              order.restaurant?.location?.coordinates?.[0] || 0
            );
            distanceDisplay = `${dist.toFixed(1)} km`;
          }

          return {
            id: order._id,
            restaurantId: order.restaurant?._id || '',
            restaurantName: order.restaurant?.name || 'Restaurant',
            restaurantAddress: order.restaurant?.address || 'Restaurant address',
            userId: order.user?._id || '',
            customerName: order.user?.name || 'Customer',
            customerPhone: order.user?.phone || '',
            items: order.items || [],
            status: order.status,
            totalAmount: order.totalAmount,
            deliveryAddress: order.deliveryAddress,
            distance: distanceDisplay,
            pickupDistance: order.pickupDistance,
            deliveryDistance: order.deliveryDistance,
            estimatedEarning: order.totalAmount * 0.1, // 10% of order
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
          };
        });
        setOrders(mappedOrders);
      } catch (err) {
        console.error('Failed to fetch available orders', err);
      }
    };

    fetchAvailableOrders();
    // Refresh every 30 seconds - always for delivery users
    const interval = user?.role === 'delivery' ? setInterval(fetchAvailableOrders, 30000) : null;
    return () => { if (interval) clearInterval(interval); };
  }, [user?.id, user?.role, profile.isOnline, currentLocation.lat, currentLocation.lng]);

  // Socket.io connection for real-time order notifications (always for delivery role)
  useEffect(() => {
    if (!user || user.role !== 'delivery') {
      console.log('Socket not connecting: user not delivery role');
      return;
    }

    const storedAuth = localStorage.getItem('quickeats_auth');
    const token = storedAuth ? JSON.parse(storedAuth).token : null;
    if (!token) {
      console.log('Socket not connecting: no token found');
      return;
    }

    console.log('🔌 Connecting to socket as delivery boy...');

    // Connect to socket with authentication and reconnection options
    const socket: Socket = io(API_ORIGIN, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('✅ Delivery boy connected to socket, ID:', socket.id);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
    });

    // Listen for new delivery orders
    socket.on('newDeliveryOrder', async (orderData: any) => {
      console.log('🚀 New delivery order received via socket:', orderData);

      // Validate order data
      if (!orderData || !orderData._id) {
        console.error('❌ Invalid order data received:', orderData);
        return;
      }

      console.log('✅ Order data is valid, mapping to DeliveryOrder format');

      // Calculate real distance for new order
      let distanceDisplay = 'N/A';
      if (orderData.pickupDistance !== undefined) {
        distanceDisplay = `${orderData.pickupDistance.toFixed(1)} km`;
      } else {
        const dist = await calculateOrderDistance(
          orderData.restaurant?.location,
          orderData.user?.location,
          currentLocation
        );
        distanceDisplay = dist;
      }

      // Map to DeliveryOrder format with null checks
      const newOrder: DeliveryOrder = {
        id: orderData._id,
        restaurantId: orderData.restaurant?._id || '',
        restaurantName: orderData.restaurant?.name || 'Restaurant',
        restaurantAddress: orderData.restaurant?.address || 'Restaurant address',
        userId: orderData.user?._id || '',
        customerName: orderData.user?.name || 'Customer',
        customerPhone: orderData.user?.phone || '',
        items: orderData.items || [],
        status: orderData.status,
        totalAmount: orderData.totalAmount,
        deliveryAddress: orderData.deliveryAddress,
        distance: distanceDisplay,
        pickupDistance: orderData.pickupDistance,
        deliveryDistance: orderData.deliveryDistance,
        estimatedEarning: orderData.totalAmount * 0.1,
        createdAt: orderData.createdAt,
        updatedAt: orderData.updatedAt,
        paymentMethod: orderData.paymentMethod,
        paymentStatus: orderData.paymentStatus,
      };

      console.log('📦 Mapped order:', newOrder);

      // Add notification
      const notification: DeliveryNotification = {
        id: `new-order-${orderData._id}-${Date.now()}`,
        type: 'new_order',
        title: '🆕 New Delivery Available',
        message: `${orderData.restaurant?.name || 'Restaurant'} - ₹${orderData.totalAmount}`,
        timestamp: new Date().toISOString(),
        read: false,
      };
      console.log('🔔 Adding notification:', notification);
      setNotifications(prev => [notification, ...prev]);
      setUnreadNotifications(prev => prev + 1);

      // Add order to available orders list (avoid duplicates)
      setOrders(prev => {
        const exists = prev.some(order => order.id === newOrder.id);
        if (exists) {
          console.log('⚠️ Order already exists, skipping');
          return prev;
        }
        console.log('✅ Order added to available orders list');
        return [...prev, newOrder];
      });
    });

    socket.on('disconnect', () => {
      console.log('🔌 Delivery boy disconnected from socket');
    });

    // Cleanup on unmount
    return () => {
      console.log('🔌 Cleaning up socket connection...');
      socket.disconnect();
    };
  }, [user?.id, user?.role]);

  const toggleOnlineStatus = () => {
    setProfile(prev => ({ ...prev, isOnline: !prev.isOnline }));
  };

  const acceptOrder = async (orderId: string) => {
    try {
      const storedAuth = localStorage.getItem('quickeats_auth');
      const token = storedAuth ? JSON.parse(storedAuth).token : null;
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/accept-delivery`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to accept order:', error.message);
        return;
      }

      const order = await response.json();

      // Calculate real distance for accepted order
      const distance = await calculateOrderDistance(
        order.restaurant?.location,
        order.user?.location,
        currentLocation
      );

      // Map to DeliveryOrder format and set as active (with null checks)
      const mappedOrder: DeliveryOrder = {
        id: order._id,
        restaurantId: order.restaurant?._id || '',
        restaurantName: order.restaurant?.name || 'Restaurant',
        restaurantAddress: order.restaurant?.address || 'Restaurant address',
        userId: order.user?._id || '',
        customerName: order.user?.name || 'Customer',
        customerPhone: order.user?.phone || '',
        items: order.items || [],
        status: order.status,
        totalAmount: order.totalAmount,
        deliveryAddress: order.deliveryAddress,
        distance,
        estimatedEarning: order.totalAmount * 0.1,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
      };

      setActiveOrder(mappedOrder);
      setOrders(prev => prev.filter(o => o.id !== orderId));
      setProfile(prev => ({ ...prev, isOnline: false })); // Mark as busy
    } catch (err) {
      console.error('Error accepting order:', err);
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const storedAuth = localStorage.getItem('quickeats_auth');
      const token = storedAuth ? JSON.parse(storedAuth).token : null;
      if (!token) return;

      // Map frontend status to delivery status
      // Frontend shows 'delivered' status, backend needs 'delivered' in deliveryStatus
      const deliveryStatusMap: Record<string, string> = {
        'delivered': 'delivered',
        'picked': 'picked',
        'on_the_way': 'on_the_way'
      };

      const deliveryStatus = deliveryStatusMap[status] || status;

      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/delivery-status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: deliveryStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to update order status:', error.message);
        return;
      }

      const order = await response.json();

      if (activeOrder && activeOrder.id === orderId) {
        if (status === 'delivered') {
          // Order marked as delivered - backend handles earnings update
          // Just clear active order and refetch profile to get updated data
          setActiveOrder(null);
          setProfile(prev => ({
            ...prev,
            isOnline: true // Mark as available again
          }));

          // Refetch profile to get updated earnings and history from backend
          const storedAuth = localStorage.getItem('quickeats_auth');
          const token = storedAuth ? JSON.parse(storedAuth).token : null;
          if (token) {
            fetch(`${API_BASE_URL}/delivery-boys/me`, {
              headers: { Authorization: `Bearer ${token}` }
            })
              .then(res => res.json())
              .then(data => {
                if (data.earningsBreakdown) {
                  setEarnings({
                    today: data.earningsBreakdown.today || 0,
                    todayOrders: data.earningsBreakdown.todayOrders || 0,
                    thisWeek: data.earningsBreakdown.thisWeek || 0,
                    weeklyOrders: data.earningsBreakdown.weeklyOrders || 0,
                    thisMonth: data.earningsBreakdown.thisMonth || 0,
                    monthlyOrders: data.earningsBreakdown.monthlyOrders || 0,
                    pending: data.earningsBreakdown.pending || 0,
                  });
                }
                if (data.deliveryHistory) {
                  setDeliveryHistory(data.deliveryHistory);
                }
                if (data.totalDeliveries !== undefined) {
                  setProfile(prev => ({ ...prev, totalDeliveries: data.totalDeliveries }));
                }
                if (data.availableBalance !== undefined) {
                  setProfile(prev => ({ ...prev, availableBalance: data.availableBalance }));
                }
                console.log('✅ Refreshed earnings and history from backend after delivery');
              })
              .catch(err => console.error('Failed to refresh profile:', err));
          }
        } else {
          setActiveOrder({ ...activeOrder, status });
        }
      }
    } catch (err) {
      console.error('Error updating order status:', err);
    }
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadNotifications(prev => Math.max(0, prev - 1));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadNotifications(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadNotifications(0);
  };

  const updateLocation = (lat: number, lng: number) => {
    setCurrentLocation({ lat, lng });
  };

  return (
    <DeliveryDataContext.Provider
      value={{
        profile,
        updateProfile,
        toggleOnlineStatus,
        orders,
        activeOrder,
        acceptOrder,
        updateOrderStatus,
        earnings,
        deliveryHistory,
        notifications,
        unreadNotifications,
        markNotificationRead,
        markAllNotificationsAsRead,
        clearNotifications,
        currentLocation,
        updateLocation,
      }}
    >
      {children}
    </DeliveryDataContext.Provider>
  );
}

export function useDeliveryData() {
  const context = useContext(DeliveryDataContext);
  if (context === undefined) {
    throw new Error('useDeliveryData must be used within a DeliveryDataProvider');
  }
  return context;
}