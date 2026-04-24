import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Restaurant, MenuItem, OrderItem } from '@/types/auth';
import { useAuth } from './AuthContext';
import io from 'socket.io-client';
import { CheckCircle, TruckIcon, CookingPot, AlertTriangle, XCircle, Clock, Bell } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { Button } from '@/components/ui/button';
import ringAudio from '@/assets/ring.mp3';
import { locationService } from '@/lib/locationService';
import { getRestaurantStatus } from '@/utils/restaurantStatus';

const API_ORIGIN = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_BASE_URL = API_ORIGIN.endsWith('/api') ? API_ORIGIN : `${API_ORIGIN}/api`;
const SOCKET_BASE_URL = API_ORIGIN.replace(/\/api$/, '');

export interface UserNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  time: string;
  icon: any;
  color: string;
  read: boolean;
  link?: string;
}

export interface CartItem extends OrderItem {
  restaurantId: string;
  restaurantName: string;
  image: string;
}

export interface UserOrder {
  id: string;
  restaurantId: string;
  restaurantName: string;
  restaurantImage: string;
  items: CartItem[];
  status: 'placed' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  totalAmount: number;
  deliveryAddress: string;
  paymentMethod: 'upi' | 'card' | 'cod' | 'online';
  createdAt: string;
  estimatedDelivery: string;
  subtotal?: number;
  discountAmount?: number;
  taxAmount?: number;
  promoCode?: any;
  // Delivery partner convenience fields
  deliveryBoyId?: string;
  deliveryBoyName?: string;
  deliveryPartner?: {
    name: string;
    phone: string;
    email?: string;
    vehicleType?: 'bike' | 'car' | 'scooter';
    vehicleNumber?: string;
    rating?: number;
    location: { lat: number; lng: number };
  };
}

interface UserDataContextType {
  restaurants: Restaurant[];
  menuItems: MenuItem[];
  cart: CartItem[];
  orders: UserOrder[];
  activeOrder: UserOrder | null;
  notifications: UserNotification[];
  unreadCount: number;
  addToCart: (item: MenuItem, restaurantId: string, restaurantName: string) => void;
  removeFromCart: (menuItemId: string) => void;
  updateCartQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  placeOrder: (deliveryAddress: string, paymentMethod: 'upi' | 'card' | 'cod' | 'online', specialInstructions?: string, promoCodeId?: string, subtotal?: number, paymentDetails?: any, taxAmount?: number) => Promise<UserOrder>;
  getRestaurantById: (id: string) => Restaurant | undefined;
  getMenuByRestaurantId: (restaurantId: string) => MenuItem[];
  setActiveOrder: (order: UserOrder | null) => void;
  updateOrderStatus: (orderId: string, status: UserOrder['status']) => void;
  markNotificationAsRead: (id: number) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (id: number) => void;
  clearAllNotifications: () => void;
  refreshRestaurants: (cuisine?: string) => Promise<void>;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

const getCartStorageKey = (userId?: string) => userId ? `quickeats_user_cart_${userId}` : 'quickeats_user_cart';
const getOrdersStorageKey = (userId?: string) => userId ? `quickeats_user_orders_${userId}` : 'quickeats_user_orders';

// Helper function to map backend order to frontend UserOrder format
const mapBackendOrderToFrontend = (backendOrder: any): UserOrder => {
  if (!backendOrder) {
    throw new Error('Invalid order payload');
  }

  const restaurant = backendOrder.restaurant || {};
  const restaurantId = typeof restaurant === 'object' ? restaurant?._id || 'unknown' : restaurant || 'unknown';
  const restaurantName = typeof restaurant === 'object' ? restaurant?.name || 'Restaurant' : 'Restaurant';
  const restaurantImage = typeof restaurant === 'object' ? restaurant?.image || '' : '';

  console.log('🔄 Mapping backend order:', {
    orderId: backendOrder._id,
    hasDeliveryBoy: !!backendOrder.deliveryBoy,
    deliveryBoyUser: backendOrder.deliveryBoy?.user
  });

  const mapped = {
    id: backendOrder._id,
    restaurantId,
    restaurantName,
    restaurantImage,
    items: (backendOrder.items || []).map((item: any) => ({
      menuItemId: typeof item.menuItem === 'object' ? item.menuItem?._id || 'unknown' : item.menuItem || 'unknown',
      name: item.name || 'Item',
      quantity: item.quantity,
      price: item.price,
      restaurantId,
      restaurantName,
      image: '',
    })),
    status: backendOrder.status,
    totalAmount: backendOrder.totalAmount,
    deliveryAddress: backendOrder.deliveryAddress,
    paymentMethod: backendOrder.paymentMethod || 'cod',
    subtotal: backendOrder.subtotal,
    discountAmount: backendOrder.discountAmount,
    taxAmount: backendOrder.taxAmount,
    promoCode: backendOrder.promoCode,
    createdAt: backendOrder.createdAt,
    estimatedDelivery: new Date(Date.now() + (Math.floor(Math.random() * 11) + 15) * 60000).toISOString(),
    deliveryBoyId: backendOrder.deliveryBoy ? (backendOrder.deliveryBoy._id || backendOrder.deliveryBoy) : undefined,
    deliveryBoyName: backendOrder.deliveryBoy && backendOrder.deliveryBoy.user ? backendOrder.deliveryBoy.user.name : undefined,
    // Add real delivery partner details if assigned
    deliveryPartner: backendOrder.deliveryBoy && backendOrder.deliveryBoy.user ? {
      name: backendOrder.deliveryBoy.user.name || 'Delivery Partner',
      phone: backendOrder.deliveryBoy.user.phone || '',
      email: backendOrder.deliveryBoy.user.email || '',
      vehicleType: backendOrder.deliveryBoy.vehicleType || undefined,
      vehicleNumber: backendOrder.deliveryBoy.licenseNumber || '',
      rating: typeof backendOrder.deliveryBoy.rating === 'number' ? backendOrder.deliveryBoy.rating : 0,
      location: { lat: 40.7128, lng: -74.0060 },
    } : undefined,
  };

  console.log('✅ Mapped delivery partner:', mapped.deliveryPartner);
  return mapped;
};



export function UserDataProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuth();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [activeOrder, setActiveOrder] = useState<UserOrder | null>(null);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isRinging, setIsRinging] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const socketRef = React.useRef<any>(null);
  const globalAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const locationWatchIdRef = React.useRef<number | null>(null);

  // Calculate unread count whenever notifications change
  useEffect(() => {
    const count = notifications.filter(n => !n.read).length;
    setUnreadCount(count);
  }, [notifications]);

  // Helper function to add notification
  const addNotification = (notification: Omit<UserNotification, 'id' | 'time' | 'read'>) => {
    const newNotification: UserNotification = {
      id: Date.now(),
      ...notification,
      time: 'Just now',
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  // Socket.IO connection for real-time updates
  useEffect(() => {
    if (token) {
      const socket = io(SOCKET_BASE_URL, {
        auth: {
          token: token
        }
      });

      socketRef.current = socket;

      socket.on('menuItemAdded', (data) => {
        setMenuItems(prev => [...prev, data.menuItem]);
      });

      socket.on('menuItemUpdated', (data) => {
        console.log('🔔 Menu item updated:', data.menuItem.name);
        setMenuItems(prev => prev.map(item =>
          item.id === data.menuItem.id ? data.menuItem : item
        ));
      });

      socket.on('menuItemDeleted', (data) => {
        console.log('🗑️ Menu item deleted:', data.menuItemId);
        setMenuItems(prev => prev.filter(item => item.id !== data.menuItemId));
      });

      // Join user-specific room for order updates
      if (user) {
        socket.emit('joinUserRoom', { userId: user.id });
      }

      // Handle global Ring Customer
      socket.on('ringCustomer', (data) => {
        console.log('🔔 Global ring customer triggered:', data);
        setIsRinging(true);
        if (navigator.vibrate) {
          navigator.vibrate([300, 200, 300, 200, 300]);
        }

        try {
          const audio = new Audio(ringAudio);
          audio.play().catch(e => console.warn('Global fallback audio play failed:', e));
        } catch (e) {
          console.error('Error playing global ring', e);
        }

        addNotification({
          type: 'delivery',
          title: 'Delivery Arrived! 🛎️',
          message: 'The delivery boy is ringing your doorbell.',
          icon: CheckCircle,
          color: 'bg-green-100 text-green-600',
          link: data.orderId ? `/user/tracking/${data.orderId}` : '/user/orders'
        });
      });

      // Listen for real-time order status updates from owner
      socket.on('orderStatusUpdate', (data) => {
        console.log('🔔 Received order status update:', data);

        // If order is out for delivery, refetch to get delivery partner details
        if (data.status === 'out_for_delivery') {
          // Refetch the order to get delivery partner details
          const fetchUpdatedOrder = async () => {
            try {
              const response = await fetch(`${API_BASE_URL}/orders/${data.orderId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (response.ok) {
                const updatedOrder = await response.json();
                const mappedUpdatedOrder = mapBackendOrderToFrontend(updatedOrder);

                setOrders(prev => prev.map(o => o.id === mappedUpdatedOrder.id ? mappedUpdatedOrder : o));
                setActiveOrder(mappedUpdatedOrder);
                console.log('✅ Fetched delivery partner details:', mappedUpdatedOrder.deliveryPartner);
              }
            } catch (error) {
              console.error('Failed to fetch updated order:', error);
            }
          };
          fetchUpdatedOrder();
        } else {
          setOrders(prev => prev.map(order =>
            order.id === data.orderId
              ? { ...order, status: data.status }
              : order
          ));
          setActiveOrder(prev => {
            if (prev && prev.id === data.orderId) {
              console.log('✅ Updated active order status to:', data.status);
              return { ...prev, status: data.status };
            }
            return prev;
          });
        }

        // Notification details for each status
        const statusNotifications: Record<string, { title: string; message: string; icon: any; color: string; type: string }> = {
          placed: {
            title: '🎉 Order Placed Successfully!',
            message: 'Your order has been placed. We will notify you once the restaurant confirms it.',
            icon: CheckCircle,
            color: 'bg-green-100 text-green-600',
            type: 'order'
          },
          confirmed: {
            title: '✅ Order Confirmed by Restaurant',
            message: 'The restaurant has confirmed your order and started preparation.',
            icon: CheckCircle,
            color: 'bg-green-100 text-green-600',
            type: 'order'
          },
          accepted: {
            title: '✅ Order Accepted by Restaurant',
            message: 'The restaurant has accepted your order and will start preparation soon.',
            icon: CheckCircle,
            color: 'bg-green-100 text-green-600',
            type: 'order'
          },
          preparing: {
            title: '👨‍🍳 Your Food is Being Prepared',
            message: 'Your delicious food is being prepared in the kitchen.',
            icon: CookingPot,
            color: 'bg-orange-100 text-orange-600',
            type: 'cooking'
          },
          out_for_delivery: {
            title: '🚗 Order on the Way!',
            message: 'Your order is on the way! Track it in the app.',
            icon: TruckIcon,
            color: 'bg-blue-100 text-blue-600',
            type: 'delivery'
          },
          delivered: {
            title: '📦 Order Delivered!',
            message: 'Your order has been delivered. Enjoy your meal!',
            icon: CheckCircle,
            color: 'bg-green-100 text-green-600',
            type: 'delivery'
          },
          cancelled: {
            title: '❌ Order Cancelled',
            message: 'your order is cancelled by the restaurent owner',
            icon: XCircle,
            color: 'bg-red-100 text-red-600',
            type: 'cancelled'
          }
        };

        const notificationData = statusNotifications[data.status] || {
          title: 'Order Update',
          message: `Order status: ${data.status}`,
          icon: Clock,
          color: 'bg-gray-100 text-gray-600',
          type: 'order'
        };

        // Add in-app notification
        addNotification({
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          icon: notificationData.icon,
          color: notificationData.color,
          link: data.orderId ? `/user/tracking/${data.orderId}` : '/user/orders'
        });

        // Send browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(notificationData.title, {
            body: notificationData.message,
            icon: '/src/assets/logo.png',
            tag: `order-${data.orderId}`,
            requireInteraction: data.status === 'out_for_delivery'
          });
        }
      });

      // Listen for delivery boy assignment (when delivery boy accepts the order)
      socket.on('deliveryBoyAssigned', async (data) => {
        console.log('� [SOCKET] deliveryBoyAssigned event received:', JSON.stringify(data, null, 2));

        try {
          // Refetch the order to get full delivery boy details
          console.log('📡 Fetching updated order from API...');
          const response = await fetch(`${API_BASE_URL}/orders/${data.orderId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.ok) {
            const updatedOrder = await response.json();
            console.log('📦 Raw order from API:', JSON.stringify(updatedOrder, null, 2));

            const mappedOrder = mapBackendOrderToFrontend(updatedOrder);
            console.log('🗺️ Mapped order for frontend:', {
              id: mappedOrder.id,
              status: mappedOrder.status,
              deliveryPartner: mappedOrder.deliveryPartner
            });

            // Update orders list with delivery partner details
            setOrders(prev => {
              const updated = prev.map(o => o.id === mappedOrder.id ? mappedOrder : o);
              console.log('📋 Orders list updated, count:', updated.length);
              return updated;
            });

            setActiveOrder(mappedOrder);
            console.log('✅ Active order set with delivery partner:', mappedOrder.deliveryPartner);

            console.log('✅ Updated order with delivery boy details:', mappedOrder.deliveryPartner);

            // Show notification about delivery boy assignment
            addNotification({
              type: 'delivery',
              title: '🚗 Delivery Partner Assigned!',
              message: `${mappedOrder.deliveryPartner?.name || 'Your delivery partner'} is on the way!`,
              icon: TruckIcon,
              color: 'bg-blue-100 text-blue-600',
              link: mappedOrder.id ? `/user/tracking/${mappedOrder.id}` : '/user/orders'
            });

            // Browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Delivery Partner Assigned! 🚗', {
                body: `${mappedOrder.deliveryPartner?.name || 'Your delivery partner'} is on the way!`,
                icon: '/src/assets/logo.png',
                tag: `delivery-${data.orderId}`,
                requireInteraction: true
              });
            }
          } else {
            console.error('❌ Failed to fetch order, status:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('❌ Error response:', errorText);
          }
        } catch (error) {
          console.error('❌ Failed to fetch order details after delivery boy assignment:', error);
        }
      });

      socket.on('connect', () => {
        console.log('✅ User connected to socket server');
        // Join user-specific room on connection
        if (user) {
          socket.emit('joinUserRoom', { userId: user.id });
          console.log('🚪 Joined user room:', `user_${user.id}`);
        }
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      return () => {
        // Stop location tracking
        if (locationWatchIdRef.current !== null) {
          navigator.geolocation.clearWatch(locationWatchIdRef.current);
          locationWatchIdRef.current = null;
          console.log('🛑 Stopped background location tracking');
        }
        socket.disconnect();
      };
    }
  }, [token]);

  // Background location tracking for active delivery orders
  useEffect(() => {
    // Only track if user has active delivery order
    if (!activeOrder || activeOrder.status !== 'out_for_delivery') {
      // Stop tracking if no active delivery
      if (locationWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(locationWatchIdRef.current);
        locationWatchIdRef.current = null;
        console.log('🛑 Stopped background location tracking - no active delivery');
      }
      return;
    }

    // Start background location tracking
    if (!navigator.geolocation) {
      console.warn('⚠️ Geolocation not supported');
      return;
    }

    if (locationWatchIdRef.current !== null) {
      console.log('ℹ️ Location tracking already active');
      return;
    }

    console.log('🚀 Starting background location tracking for active delivery order:', activeOrder.id);

    locationWatchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        console.log(`📍 User location update: [${latitude.toFixed(6)}, ${longitude.toFixed(6)}]`);

        // Emit to socket for delivery boy to receive
        if (socketRef.current?.connected && user) {
          socketRef.current.emit('updateLocation', {
            orderId: activeOrder.id,
            latitude,
            longitude,
            accuracy,
            userId: user.id,
            timestamp: Date.now()
          });
          console.log('📡 Sent user location to delivery boy');
        }
      },
      (error) => {
        console.error('❌ Background location error:', error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    );

    return () => {
      if (locationWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(locationWatchIdRef.current);
        locationWatchIdRef.current = null;
        console.log('🛑 Stopped background location tracking on cleanup');
      }
    };
  }, [activeOrder, user]);

  // Geofenced restaurant fetch based on user live location
  const geo = useGeolocation(false);

  const fetchNearbyRestaurants = async (cuisine?: string) => {
    try {
      if (!token) {
        setRestaurants([]);
        return;
      }
      locationService.setToken(token);

      // Check for frozen location first
      let currentLocation = null;
      if (user?.id) {
        const storageKey = `quickeats_location_${user.id}`;
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed.latitude && parsed.longitude) {
              console.log('📍 [RestaurantFetch] Using frozen location from storage:', parsed);
              currentLocation = {
                latitude: parsed.latitude,
                longitude: parsed.longitude,
                accuracy: 0,
                timestamp: Date.now()
              };
            }
          } catch (e) { console.error('Error parsing stored location for restaurant fetch', e); }
        }
      }

      // If no frozen location, try getting current location
      if (!currentLocation) {
        currentLocation = await geo.getCurrentLocation();
      }

      if (!currentLocation) {
        console.warn('⚠️ No geolocation available; skipping restaurant fetch');
        setRestaurants([]);
        return;
      }

      // Validate coordinates before API call
      if (
        typeof currentLocation.latitude !== 'number' ||
        typeof currentLocation.longitude !== 'number' ||
        isNaN(currentLocation.latitude) ||
        isNaN(currentLocation.longitude)
      ) {
        console.warn('⚠️ Invalid coordinates from geolocation:', {
          lat: currentLocation.latitude,
          lon: currentLocation.longitude
        });
        setRestaurants([]);
        return;
      }

      console.log(`[UserDataContext] Fetching nearby restaurants with cuisine: ${cuisine}`);
      const nearby = await locationService.getNearbyRestaurants(
        currentLocation.latitude,
        currentLocation.longitude,
        10, // radius km
        cuisine
      );

      console.log('🔍 FETCHED RAW RESTAURANTS:', nearby.map((r: any) => ({ name: r.name, open: r.openingTime, close: r.closingTime })));

      const mappedRestaurants: Restaurant[] = nearby.map((r: any) => ({
        id: r.id || r._id,
        ownerId: r.owner,
        name: r.name,
        description: r.description,
        cuisine: r.cuisine || 'Various',
        address: r.address,
        phone: r.phone,
        image: r.image,
        isOpen: r.isOpen ?? true,
        rating: r.rating ?? 4.5,
        deliveryTime: r.deliveryTime ?? '15-25 min',
        minOrder: r.minOrder ?? 10,
        createdAt: r.createdAt,
        openTime: r.openingTime || '10:00',
        closeTime: r.closingTime || '22:00',
        openingPeriod: r.openingPeriod,
        closingPeriod: r.closingPeriod,
        status: getRestaurantStatus(
          r.openingTime || '10:00',
          r.closingTime || '22:00',
          30,
          undefined,
          r.openingPeriod,
          r.closingPeriod
        ),
      }));

      setRestaurants(mappedRestaurants);
      console.log('✅ Refreshed restaurants with updated ratings');
    } catch (error) {
      console.error('Failed to fetch nearby restaurants:', error);
      setRestaurants([]);
    }
  };

  useEffect(() => {
    fetchNearbyRestaurants();
  }, [token]);

  // Fetch menu items from backend
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/menu`); // Assuming there's a menu endpoint
        if (response.ok) {
          const data = await response.json();
          const mappedMenuItems: MenuItem[] = data.map((m: any) => ({
            id: m._id,
            restaurantId: m.restaurant,
            name: m.name,
            description: m.description,
            price: m.price,
            category: m.category,
            image: m.image,
            isVeg: m.isVeg || false,
            isAvailable: m.isAvailable,
            createdAt: m.createdAt,
          }));
          setMenuItems(mappedMenuItems);
        }
      } catch (error) {
        console.error('Failed to fetch menu items:', error);
      }
    };
    fetchMenuItems();
  }, []);

  // Fetch user orders from backend
  useEffect(() => {
    if (token) {
      const fetchOrders = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/orders/user`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const data = await response.json();
            const mappedOrders = data.map((order: any) => mapBackendOrderToFrontend(order));
            setOrders(mappedOrders);

            // Auto-set active order: Find the most recent non-delivered order
            const activeStatuses = ['placed', 'accepted', 'preparing', 'out_for_delivery'];
            const pendingOrder = mappedOrders.find((order: UserOrder) =>
              activeStatuses.includes(order.status)
            );

            if (pendingOrder) {
              console.log('✅ Auto-setting active order after login:', pendingOrder.id);
              setActiveOrder(pendingOrder);
            }
          }
        } catch (error) {
          console.error('Failed to fetch orders:', error);
        }
      };
      fetchOrders();
    }
  }, [token]);

  // Clear data on user change
  useEffect(() => {
    setCart([]);
    setOrders([]);
    setActiveOrder(null);
  }, [user?.id]);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem(getCartStorageKey(user?.id));
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        const validCart = parsedCart.filter((item: any) => item.menuItemId);
        setCart(validCart);
      } catch (e) {
        console.error('Failed to parse cart', e);
      }
    }
  }, [user?.id]);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(getCartStorageKey(user?.id), JSON.stringify(cart));
    } catch (error) {
      if (error instanceof Error && error.message.includes('QuotaExceededError')) {
        console.warn('⚠️ localStorage quota exceeded for cart, clearing cache');
        try {
          localStorage.removeItem(getCartStorageKey(user?.id));
        } catch (e) {
          console.error('Failed to clear cart cache:', e);
        }
      }
    }
  }, [cart, user?.id]);

  useEffect(() => {
    try {
      // Only store order IDs and last updated timestamp, not full order details
      // Full details are fetched from server
      const orderSummary = {
        count: orders.length,
        lastUpdated: new Date().toISOString(),
        orderIds: orders.map(o => o.id)
      };
      localStorage.setItem(getOrdersStorageKey(user?.id), JSON.stringify(orderSummary));
    } catch (error) {
      if (error instanceof Error && error.message.includes('QuotaExceededError')) {
        console.warn('⚠️ localStorage quota exceeded, clearing old order cache');
        try {
          localStorage.removeItem(getOrdersStorageKey(user?.id));
        } catch (e) {
          console.error('Failed to clear orders cache:', e);
        }
      }
    }
  }, [orders, user?.id]);

  const addToCart = (item: any, restaurantId: string, restaurantName: string) => {
    const itemId = item.id || item._id;
    if (!itemId) {
      console.error('Cannot add item without ID to cart', item);
      return;
    }
    setCart(prev => {
      const existing = prev.find(c => c.menuItemId === itemId);
      if (existing) {
        return prev.map(c =>
          c.menuItemId === itemId ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, {
        menuItemId: itemId,
        name: item.name,
        quantity: 1,
        price: item.price,
        restaurantId,
        restaurantName,
        image: item.image,
      }];
    });
  };

  const removeFromCart = (menuItemId: string) => {
    setCart(prev => prev.filter(item => item.menuItemId !== menuItemId));
  };

  const updateCartQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(menuItemId);
      return;
    }
    setCart(prev => prev.map(item =>
      item.menuItemId === menuItemId ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => setCart([]);

  const placeOrder = async (deliveryAddress: string, paymentMethod: 'upi' | 'card' | 'cod' | 'online', specialInstructions?: string, promoCodeId?: string, subtotal?: number, paymentDetails?: any, taxAmount?: number): Promise<UserOrder> => {
    if (!user || !token) throw new Error('Not authenticated');

    const restaurantId = cart[0]?.restaurantId || '';
    const restaurant = restaurants.find(r => r.id === restaurantId);
    const orderSubtotal = subtotal || cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Calculate total with discount if promo code is applied
    let totalAmount = orderSubtotal;
    if (promoCodeId) {
      // Note: discount is already calculated on frontend, we just send the total
      totalAmount = orderSubtotal; // Backend will handle discount calculation
    }

    if (taxAmount) {
      totalAmount += taxAmount;
    }

    console.log('📦 Placing order with data:', {
      restaurantId,
      itemsCount: cart.length,
      items: cart.map(item => ({
        menuItem: item.menuItemId,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      deliveryAddress,
      subtotal: orderSubtotal,
      totalAmount,
      promoCodeId,
      taxAmount
    });

    try {
      // Call backend API to create the order
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          restaurantId,
          items: cart.map(item => ({
            menuItem: item.menuItemId,
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          deliveryAddress,
          subtotal: orderSubtotal,
          totalAmount,
          paymentMethod,
          specialInstructions: specialInstructions || '',
          promoCodeId: promoCodeId || null,
          paymentDetails,
          taxAmount: taxAmount || 0
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.errors?.join(', ') || 'Failed to place order';
        console.error('Order creation failed:', errorData);
        throw new Error(errorMessage);
      }

      const backendOrder = await response.json();

      // Map backend order to frontend format
      const newOrder: UserOrder = {
        id: backendOrder._id || `order_${Date.now()}`,
        restaurantId,
        restaurantName: restaurant?.name || 'Unknown Restaurant',
        restaurantImage: restaurant?.image || '',
        items: [...cart],
        status: backendOrder.status || 'placed',
        totalAmount,
        subtotal: backendOrder.subtotal || orderSubtotal,
        taxAmount: backendOrder.taxAmount || taxAmount || 0,
        discountAmount: backendOrder.discountAmount || (promoCodeId ? orderSubtotal - totalAmount + (taxAmount || 0) : 0),
        promoCode: backendOrder.promoCode || promoCodeId,
        deliveryAddress,
        paymentMethod,
        createdAt: backendOrder.createdAt || new Date().toISOString(),
        estimatedDelivery: new Date(Date.now() + (Math.floor(Math.random() * 11) + 15) * 60000).toISOString(),
        // Delivery partner will be added once a delivery boy is assigned (will be null initially)
        deliveryPartner: undefined,
      };

      setOrders(prev => [newOrder, ...prev]);
      setActiveOrder(newOrder);
      clearCart();
      return newOrder;
    } catch (error) {
      console.error('Error placing order:', error);
      throw error;
    }
  };

  const getRestaurantById = (id: string) => restaurants.find(r => r.id === id);

  const getMenuByRestaurantId = (restaurantId: string) =>
    menuItems.filter(item => item.restaurantId === restaurantId);

  const updateOrderStatus = (orderId: string, status: UserOrder['status']) => {
    setOrders(prev => prev.map(order =>
      order.id === orderId ? { ...order, status } : order
    ));
    if (activeOrder?.id === orderId) {
      setActiveOrder(prev => prev ? { ...prev, status } : null);
    }
  };

  // Notification management functions
  const markNotificationAsRead = (id: number) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const deleteNotification = (id: number) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== id)
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Function to refresh restaurants (e.g., after submitting a review)
  const refreshRestaurants = async () => {
    await fetchNearbyRestaurants();
  };

  useEffect(() => {
    const handleGlobalClick = () => {
      if (!audioEnabled) {
        // Just playing and pausing a tiny audio to unlock the browser's audio context
        const audio = new Audio(ringAudio);
        audio.play().then(() => {
          audio.pause();
          setAudioEnabled(true);
        }).catch(() => {
          setAudioEnabled(true);
        });
      }
    };
    window.addEventListener('click', handleGlobalClick, { once: true });
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [audioEnabled]);

  return (
    <UserDataContext.Provider value={{
      restaurants,
      menuItems,
      cart,
      orders,
      activeOrder,
      notifications,
      unreadCount,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      placeOrder,
      getRestaurantById,
      getMenuByRestaurantId,
      setActiveOrder,
      updateOrderStatus,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      deleteNotification,
      clearAllNotifications,
      refreshRestaurants,
    }}>
      {children}

      {/* Global Ringing Modal */}
      {isRinging && (
        <div className="fixed inset-0 z-[9999] bg-black/80 flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in duration-300">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Bell className="w-12 h-12 text-red-600 animate-bounce" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Ding Dong!</h2>
            <p className="text-gray-600 text-lg mb-8 font-medium">Your delivery driver is at the door.</p>

            <Button
              onClick={() => {
                setIsRinging(false);
              }}
              className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-bold text-xl rounded-xl shadow-[0_4px_14px_0_rgba(220,38,38,0.39)] transition-all hover:shadow-[0_6px_20px_rgba(220,38,38,0.23)]"
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}
    </UserDataContext.Provider>
  );
}

export function useUserData() {
  const context = useContext(UserDataContext);
  if (!context) {
    throw new Error('useUserData must be used within UserDataProvider');
  }
  return context;
}
