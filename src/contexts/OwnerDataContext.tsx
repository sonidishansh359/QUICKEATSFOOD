import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { Restaurant, MenuItem, Order, DeliveryBoy, EarningsData } from '@/types/auth';
import { useAuth } from './AuthContext';

export interface OwnerNotification {
  id: string;
  type: 'new_order' | 'status_update' | 'delivery_assigned';
  title: string;
  message: string;
  orderId?: string;
  timestamp: Date;
  read: boolean;
}

interface OwnerDataContextType {
  restaurants: Restaurant[];
  restaurant: Restaurant | null;
  menuItems: MenuItem[];
  orders: Order[];
  deliveryBoys: DeliveryBoy[];
  availableDeliveryBoys: DeliveryBoy[];
  earningsData: EarningsData[];
  earnings: number;
  loading: boolean;
  isRestaurantLoading: boolean;
  unreadNotifications: number;
  notifications: OwnerNotification[];
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  assignDeliveryBoy: (orderId: string, deliveryBoyId: string) => Promise<void>;
  addRestaurant: (restaurantData: Partial<Restaurant>) => Promise<void>;
  updateRestaurant: (restaurantData: Partial<Restaurant>) => Promise<void>;
  toggleRestaurantOpen: (restaurantId: string) => Promise<void>;
  addMenuItem: (menuItemData: Partial<MenuItem> & { restaurantId?: string }) => Promise<void>;
  updateMenuItem: (menuItemId: string, menuItemData: Partial<MenuItem>) => Promise<void>;
  deleteMenuItem: (menuItemId: string) => Promise<void>;
  toggleItemAvailability: (menuItemId: string) => Promise<void>;
  submitVerification: (restaurantId: string, aadharImage: string, ownerResponse?: string) => Promise<void>;
  getTodayStats: () => { orders: number; revenue: number; items: number; pending: number; completed: number };
}

const OwnerDataContext = createContext<OwnerDataContextType | undefined>(undefined);

// Normalize API and socket origins from env; fall back to localhost
const envApiBase = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';
const normalizedApi = envApiBase.replace(/\/$/, '');
const API_BASE_URL = normalizedApi.endsWith('/api') ? normalizedApi : `${normalizedApi}/api`;
const SOCKET_URL = ((import.meta as any).env?.VITE_SOCKET_URL || envApiBase).replace(/\/$/, '').replace(/\/api$/, '');

const getStorageKey = (userId?: string, key: string = '') =>
  userId ? `owner_data_${userId}_${key}` : `owner_data_${key}`;

export function OwnerDataProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuth();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryBoys, setDeliveryBoys] = useState<DeliveryBoy[]>([]);
  const [availableDeliveryBoys, setAvailableDeliveryBoys] = useState<DeliveryBoy[]>([]);
  const [earningsData, setEarningsData] = useState<EarningsData[]>([]);
  const [earnings, setEarnings] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRestaurantLoading, setIsRestaurantLoading] = useState<boolean>(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [notifications, setNotifications] = useState<OwnerNotification[]>([]);

  // Load orders and earnings from localStorage on mount (temporarily, until fresh data arrives)
  useEffect(() => {
    if (user?.id) {
      console.log('📂 Loading cached data for user:', user.id);
      const cachedOrders = localStorage.getItem(getStorageKey(user.id, 'orders'));
      const cachedEarningsData = localStorage.getItem(getStorageKey(user.id, 'earningsData'));
      const cachedEarnings = localStorage.getItem(getStorageKey(user.id, 'earnings'));

      // Load cached orders first (for instant display), fresh data will update them
      if (cachedOrders) {
        try {
          const parsed = JSON.parse(cachedOrders);
          console.log(`📦 Loaded ${parsed.length} cached orders (will be updated with fresh data)`);
          setOrders(parsed);
        } catch (e) {
          console.error('Failed to parse cached orders', e);
        }
      } else {
        console.log('📦 No cached orders found');
      }

      if (cachedEarningsData) {
        try {
          setEarningsData(JSON.parse(cachedEarningsData));
        } catch (e) {
          console.error('Failed to parse cached earningsData', e);
        }
      }

      if (cachedEarnings) {
        try {
          setEarnings(JSON.parse(cachedEarnings));
        } catch (e) {
          console.error('Failed to parse cached earnings', e);
        }
      }
    }
  }, [user?.id]);

  // Save orders to localStorage whenever they change (but not if empty to avoid overwriting with empty data)
  useEffect(() => {
    if (user?.id && orders.length >= 0) {
      // Allow saving even if empty, but log it
      if (orders.length === 0) {
        console.log('⚠️ Saving 0 orders to localStorage (restaurant might have no orders)');
      }
      localStorage.setItem(getStorageKey(user.id, 'orders'), JSON.stringify(orders));
    }
  }, [orders, user?.id]);

  // Save earnings data to localStorage whenever they change
  useEffect(() => {
    if (user?.id && earningsData.length > 0) {
      localStorage.setItem(getStorageKey(user.id, 'earningsData'), JSON.stringify(earningsData));
      localStorage.setItem(getStorageKey(user.id, 'earnings'), JSON.stringify(earnings));
    }
  }, [earningsData, earnings, user?.id]);

  // Socket connection for real-time updates
  useEffect(() => {
    if (token && user?.role === 'owner' && user.id) {
      const newSocket = io(SOCKET_URL, {
        auth: { token },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        console.log('✅ Owner connected to socket server');
        newSocket.emit('joinOwnerRoom', user.id);
      });

      newSocket.on('newOrder', (newOrder: any) => {
        console.log('📥 Received new order:', newOrder);
        console.log('🔔 New order notification - incrementing counter');

        // Add notification
        const notification: OwnerNotification = {
          id: `new-order-${newOrder._id}-${Date.now()}`,
          type: 'new_order',
          title: '🆕 New Order',
          message: `Order #${newOrder._id.slice(-6)} - ₹${newOrder.totalAmount}`,
          orderId: newOrder._id,
          timestamp: new Date(),
          read: false,
        };
        setNotifications(prev => [notification, ...prev]);
        setUnreadNotifications(prev => prev + 1);

        setOrders(prev => {
          // Map backend order to frontend format
          const mappedOrder: Order = {
            id: newOrder._id,
            restaurantId: typeof newOrder.restaurant === 'object' ? newOrder.restaurant._id : newOrder.restaurant,
            userId: typeof newOrder.user === 'object' ? newOrder.user._id : newOrder.user,
            deliveryBoyId: newOrder.deliveryBoy,
            items: newOrder.items.map((item: any) => ({
              menuItemId: typeof item.menuItem === 'object' ? item.menuItem._id : item.menuItem,
              name: item.name || (typeof item.menuItem === 'object' ? item.menuItem.name : ''),
              quantity: item.quantity,
              price: item.price,
              originalPrice: item.originalPrice, // Map originalPrice
            })),
            status: newOrder.status,
            totalAmount: newOrder.totalAmount,
            ownerEarning: newOrder.ownerEarning, // Map ownerEarning
            customerName: typeof newOrder.user === 'object' ? newOrder.user.name : '',
            customerPhone: typeof newOrder.user === 'object' ? newOrder.user.phone : '',
            deliveryAddress: newOrder.deliveryAddress,
            specialInstructions: newOrder.specialInstructions || '',
            createdAt: newOrder.createdAt,
            updatedAt: newOrder.updatedAt,
          };
          return [mappedOrder, ...prev];
        });
      });

      newSocket.on('orderStatusUpdate', (data: any) => {
        console.log('🔄 Order status updated:', data.orderId, 'to', data.status);
        console.log('🔔 Order status change notification - incrementing counter');

        // Add notification
        const statusLabels: Record<string, string> = {
          accepted: 'Accepted',
          preparing: 'Preparing',
          out_for_delivery: 'Out for Delivery',
          delivered: 'Delivered',
        };
        const notification: OwnerNotification = {
          id: `status-${data.orderId}-${Date.now()}`,
          type: 'status_update',
          title: '🔄 Status Update',
          message: `Order #${data.orderId.slice(-6)} - ${statusLabels[data.status] || data.status}`,
          orderId: data.orderId,
          timestamp: new Date(),
          read: false,
        };
        setNotifications(prev => [notification, ...prev]);
        setUnreadNotifications(prev => prev + 1);

        setOrders(prev =>
          prev.map(order =>
            order.id === data.orderId
              ? { ...order, status: data.status, updatedAt: new Date().toISOString() }
              : order
          )
        );
      });

      newSocket.on('restaurantUpdated', (updatedRestaurant: any) => {
        console.log('🏪 Restaurant updated:', updatedRestaurant.name);
        setRestaurants(prev => {
          const mapped = { ...updatedRestaurant, id: updatedRestaurant._id };
          return prev.map(r => r.id === mapped.id ? mapped : r);
        });
        if (restaurant?.id === updatedRestaurant._id) {
          setRestaurant({ ...updatedRestaurant, id: updatedRestaurant._id });
        }
      });

      newSocket.on('menuItemUpdated', (data: any) => {
        console.log('🔔 Menu item updated:', data.menuItem.name);
        setMenuItems(prev => {
          const exists = prev.find(item => item.id === data.menuItem.id);
          if (exists) {
            return prev.map(item => item.id === data.menuItem.id ? data.menuItem : item);
          }
          return [...prev, data.menuItem];
        });
      });

      newSocket.on('menuItemDeleted', (data: any) => {
        console.log('🗑️ Menu item deleted:', data.menuItemId);
        setMenuItems(prev => prev.filter(item => item.id !== data.menuItemId));
      });

      newSocket.on('disconnect', () => {
        console.log('🔌 Owner disconnected from socket server');
      });

      newSocket.on('connect_error', (error: any) => {
        console.error('❌ Socket connection error:', error.message);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [token, user]);

  // Fetch owner's restaurants
  useEffect(() => {
    if (token && user?.role === 'owner') {
      const fetchRestaurants = async () => {
        setIsRestaurantLoading(true);
        console.log('🔄 Fetching restaurants for owner:', user.id);
        try {
          const response = await fetch(`${API_BASE_URL}/restaurants/owner`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const data = await response.json();
            console.log(`✅ Fetched ${data.length} restaurants`);
            // Map backend data to frontend format
            const mappedData = data.map((r: any) => ({
              ...r,
              id: r._id,
            }));
            setRestaurants(mappedData);
          } else {
            console.error('❌ Failed to fetch restaurants:', response.status);
          }
        } catch (error) {
          console.error('❌ Failed to fetch restaurants:', error);
        } finally {
          setIsRestaurantLoading(false);
        }
      };
      fetchRestaurants();
    }
  }, [token, user]);

  // Set restaurant from localStorage or first restaurant
  useEffect(() => {
    const storedRestaurant = localStorage.getItem('restaurant');
    if (storedRestaurant) {
      try {
        const parsed = JSON.parse(storedRestaurant);
        console.log('🏪 Loading restaurant from localStorage:', parsed.name);
        // Verify this restaurant exists in the fetched restaurants list
        const restaurantExists = restaurants.find(r => r.id === parsed.id);
        if (restaurantExists) {
          setRestaurant(parsed);
        } else if (restaurants.length > 0) {
          console.log('⚠️ Stored restaurant not found in list, using first restaurant');
          setRestaurant(restaurants[0]);
          localStorage.setItem('restaurant', JSON.stringify(restaurants[0]));
        }
      } catch (e) {
        console.error('Failed to parse stored restaurant', e);
        if (restaurants.length > 0) {
          setRestaurant(restaurants[0]);
        }
      }
    } else if (restaurants.length > 0) {
      console.log('🏪 Setting first restaurant:', restaurants[0].name);
      setRestaurant(restaurants[0]);
      localStorage.setItem('restaurant', JSON.stringify(restaurants[0]));
    } else {
      console.log('⚠️ No restaurants available');
      setRestaurant(null);
    }
  }, [restaurants]);

  // Fetch menu items
  useEffect(() => {
    if (token && restaurant) {
      const fetchMenuItems = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/menu/restaurant/${restaurant.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const data = await response.json();
            // Map 'restaurant' to 'restaurantId' for frontend consistency and '_id' to 'id'
            const mappedData = data.map((item: any) => ({
              ...item,
              id: item._id,
              restaurantId: item.restaurant,
            }));
            setMenuItems(mappedData);
          }
        } catch (error) {
          console.error('Failed to fetch menu items:', error);
        }
      };
      fetchMenuItems();
    }
  }, [token, restaurant]);

  // Fetch orders
  useEffect(() => {
    if (token && restaurant) {
      const fetchOrders = async () => {
        try {
          console.log('🔄 Fetching orders for restaurant:', restaurant.id, restaurant.name);
          console.log('📡 Using token:', token ? 'Available' : 'Missing');
          console.log('📍 API URL:', `${API_BASE_URL}/orders/restaurant`);

          const response = await fetch(`${API_BASE_URL}/orders/restaurant`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          console.log('📥 Response status:', response.status, response.statusText);

          if (response.ok) {
            const data = await response.json();
            console.log(`✅ Fetched ${data.length} orders from backend`, data.slice(0, 3).map((o: any) => ({
              id: o._id?.slice(-6),
              status: o.status,
              total: o.totalAmount,
              customer: typeof o.user === 'object' ? o.user.name : 'N/A',
              created: o.createdAt
            })));
            // Map backend data to frontend format
            const mappedData = data.map((o: any) => ({
              ...o,
              id: o._id,
              restaurantId: typeof o.restaurant === 'object' ? o.restaurant._id : o.restaurant,
              userId: typeof o.user === 'object' ? o.user._id : o.user,
              deliveryBoyId: o.deliveryBoy,
              customerName: typeof o.user === 'object' ? o.user.name : '',
              customerPhone: typeof o.user === 'object' ? o.user.phone : '',
              specialInstructions: o.specialInstructions || '', // Include special instructions from backend
              items: o.items.map((item: any) => ({
                ...item,
                menuItemId: typeof item.menuItem === 'object' ? item.menuItem._id : item.menuItem,
                name: item.name || (typeof item.menuItem === 'object' ? item.menuItem.name : ''),
              })),
            }));

            // Sort by createdAt (latest first)
            mappedData.sort((a: any, b: any) => {
              const dateA = new Date(a.createdAt).getTime();
              const dateB = new Date(b.createdAt).getTime();
              return dateB - dateA;
            });

            console.log('📦 Setting', mappedData.length, 'orders in state (sorted, latest first)');
            setOrders(mappedData);

            // Save to localStorage immediately after successful fetch
            if (user?.id) {
              localStorage.setItem(getStorageKey(user.id, 'orders'), JSON.stringify(mappedData));
              console.log('💾 Saved fresh orders to localStorage');
            }
          } else {
            console.error('❌ Failed to fetch orders:', response.status, response.statusText);
          }
        } catch (error) {
          console.error('❌ Failed to fetch orders:', error);
        }
      };
      fetchOrders();
    } else {
      console.log('⚠️ Cannot fetch orders - token:', !!token, 'restaurant:', restaurant?.name || 'null');
    }
  }, [token, restaurant, user?.id]);

  // Fetch delivery boys
  useEffect(() => {
    if (token) {
      const fetchDeliveryBoys = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/delivery-boys`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const data = await response.json();
            setDeliveryBoys(data);
            setAvailableDeliveryBoys(data.filter(db => db.isAvailable));
          }
        } catch (error) {
          console.error('Failed to fetch delivery boys:', error);
        }
      };
      fetchDeliveryBoys();
    }
  }, [token]);

  // Fetch earnings data
  useEffect(() => {
    if (token && restaurant) {
      const fetchEarnings = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/owners/earnings`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const data = await response.json();
            setEarningsData(data.earningsData || []);
            // Backend sends 'earnings' as the available balance
            setEarnings(data.earnings || 0);
          }
        } catch (error) {
          console.error('Failed to fetch earnings:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchEarnings();
    } else {
      setLoading(false);
    }
  }, [token, restaurant]);

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        setOrders(prev => prev.map(order =>
          order.id === orderId ? { ...order, status } : order
        ));
      } else {
        console.error('Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const assignDeliveryBoy = async (orderId: string, deliveryBoyId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/assign-delivery`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ deliveryBoyId }),
      });
      if (response.ok) {
        setOrders(prev => prev.map(order =>
          order.id === orderId ? { ...order, deliveryBoyId } : order
        ));
      } else {
        console.error('Failed to assign delivery boy');
      }
    } catch (error) {
      console.error('Error assigning delivery boy:', error);
    }
  };



  const addMenuItem = async (menuItemData: Partial<MenuItem> & { restaurantId?: string }) => {
    const restaurantId = menuItemData.restaurantId || restaurant?.id;
    if (!restaurantId) {
      console.error('addMenuItem: restaurantId is undefined');
      return;
    }
    console.log('addMenuItem: Adding menu item for restaurantId:', restaurantId);
    try {
      const { restaurantId: _, ...itemData } = menuItemData;
      const response = await fetch(`${API_BASE_URL}/restaurants/${restaurantId}/menu`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(itemData),
      });
      if (response.ok) {
        const newMenuItem = await response.json();
        // Map 'restaurant' to 'restaurantId' for frontend consistency
        const mappedItem = {
          ...newMenuItem,
          id: newMenuItem._id,
          restaurantId: newMenuItem.restaurant,
        };
        setMenuItems(prev => [...prev, mappedItem]);
      } else {
        console.error('Failed to add menu item');
      }
    } catch (error) {
      console.error('Error adding menu item:', error);
    }
  };

  const updateMenuItem = async (menuItemId: string, menuItemData: Partial<MenuItem>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/menu/${menuItemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(menuItemData),
      });
      if (response.ok) {
        const updatedMenuItem = await response.json();
        // Map 'restaurant' to 'restaurantId' for frontend consistency
        const mappedItem = {
          ...updatedMenuItem,
          id: updatedMenuItem._id,
          restaurantId: updatedMenuItem.restaurant,
        };
        setMenuItems(prev => prev.map(item => item.id === menuItemId ? mappedItem : item));
      } else {
        console.error('Failed to update menu item');
      }
    } catch (error) {
      console.error('Error updating menu item:', error);
    }
  };

  const deleteMenuItem = async (menuItemId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/menu/${menuItemId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        setMenuItems(prev => prev.filter(item => item.id !== menuItemId));
      } else {
        console.error('Failed to delete menu item');
      }
    } catch (error) {
      console.error('Error deleting menu item:', error);
    }
  };

  const addRestaurant = async (restaurantData: Partial<Restaurant>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/restaurants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(restaurantData),
      });
      if (response.ok) {
        const newRestaurant = await response.json();
        const mappedRestaurant = {
          ...newRestaurant,
          id: newRestaurant._id,
        };
        setRestaurants(prev => [...prev, mappedRestaurant]);
      } else {
        console.error('Failed to add restaurant');
      }
    } catch (error) {
      console.error('Error adding restaurant:', error);
    }
  };

  const updateRestaurant = async (restaurantData: Partial<Restaurant>) => {
    if (!restaurantData.id) return;
    try {
      const response = await fetch(`${API_BASE_URL}/restaurants/${restaurantData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(restaurantData),
      });
      if (response.ok) {
        const updatedRestaurant = await response.json();
        const mappedRestaurant = {
          ...updatedRestaurant,
          id: updatedRestaurant._id,
        };
        setRestaurants(prev => prev.map(r => r.id === restaurantData.id ? mappedRestaurant : r));
      } else {
        console.error('Failed to update restaurant');
      }
    } catch (error) {
      console.error('Error updating restaurant:', error);
    }
  };

  const toggleRestaurantOpen = async (restaurantId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/restaurants/${restaurantId}/toggle-status`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const updatedRestaurant = await response.json();
        const mappedRestaurant = {
          ...updatedRestaurant,
          id: updatedRestaurant._id,
        };
        setRestaurants(prev => prev.map(r => r.id === restaurantId ? mappedRestaurant : r));
      } else {
        console.error('Failed to toggle restaurant status');
      }
    } catch (error) {
      console.error('Error toggling restaurant status:', error);
    }
  };

  const toggleItemAvailability = async (menuItemId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/menu/${menuItemId}/toggle-availability`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const updatedMenuItem = await response.json();
        // Map 'restaurant' to 'restaurantId' for frontend consistency
        const mappedItem = {
          ...updatedMenuItem,
          id: updatedMenuItem._id,
          restaurantId: updatedMenuItem.restaurant,
        };
        setMenuItems(prev => prev.map(item => item.id === menuItemId ? mappedItem : item));
      } else {
        console.error('Failed to toggle menu item availability');
      }
    } catch (error) {
      console.error('Error toggling menu item availability:', error);
    }
  };

  const submitVerification = async (restaurantId: string, aadharImage: string, ownerResponse?: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/restaurants/${restaurantId}/verification-submit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ aadharImage, ownerResponse }),
      });
      if (response.ok) {
        const { restaurant: updatedRestaurant } = await response.json();
        const mappedRestaurant = {
          ...updatedRestaurant,
          id: updatedRestaurant._id,
        };
        setRestaurants(prev => prev.map(r => r.id === restaurantId ? mappedRestaurant : r));
        if (restaurant?.id === restaurantId) {
          setRestaurant(mappedRestaurant);
        }
      } else {
        console.error('Failed to submit verification');
      }
    } catch (error) {
      console.error('Error submitting verification:', error);
    }
  };

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setUnreadNotifications(prev => Math.max(0, prev - 1));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    setUnreadNotifications(0);
  };

  const getTodayStats = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    });

    // Only include out_for_delivery and delivered orders in revenue calculation
    const validOrders = todayOrders.filter(order =>
      order.status === 'out_for_delivery' || order.status === 'delivered'
    );

    const todayRevenue = validOrders.reduce((sum, order) => {
      // Use ownerEarning if available, otherwise fallback to 85% (assuming 15% admin commission)
      const earnings = order.ownerEarning || (order.totalAmount * 0.85);
      return sum + earnings;
    }, 0);
    const todayItems = validOrders.reduce((sum, order) => sum + order.items.length, 0);
    const pendingOrders = todayOrders.filter(order =>
      order.status === 'placed' || order.status === 'accepted'
    ).length;
    const completedOrders = todayOrders.filter(order =>
      order.status === 'delivered'
    ).length;

    return {
      orders: todayOrders.length,
      revenue: todayRevenue,
      items: todayItems,
      pending: pendingOrders,
      completed: completedOrders
    };
  };

  return (
    <OwnerDataContext.Provider
      value={{
        restaurants,
        restaurant,
        menuItems,
        orders,
        deliveryBoys,
        availableDeliveryBoys,
        earningsData,
        earnings,
        loading,
        isRestaurantLoading,
        unreadNotifications,
        notifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        updateOrderStatus,
        assignDeliveryBoy,
        addRestaurant,
        updateRestaurant,
        toggleRestaurantOpen,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        toggleItemAvailability,
        submitVerification,
        getTodayStats,
      }}
    >
      {children}
    </OwnerDataContext.Provider>
  );
}

export function useOwnerData() {
  const context = useContext(OwnerDataContext);
  if (context === undefined) {
    throw new Error('useOwnerData must be used within an OwnerDataProvider');
  }
  return context;
}
