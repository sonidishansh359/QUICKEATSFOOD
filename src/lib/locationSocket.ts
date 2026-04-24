/**
 * Location Socket Service
 * Manages real-time location updates via Socket.io
 */

import io, { Socket } from 'socket.io-client';

export interface LocationUpdate {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface DeliveryBoyLocation {
  deliveryBoyId: string;
  latitude: number;
  longitude: number;
  address?: string;
  orderId?: string;
  timestamp: Date;
}

class LocationSocketService {
  private socket: Socket | null = null;
  private token: string | null = null;
  private userId: string | null = null;
  private userRole: string | null = null;

  /**
   * Initialize socket connection
   */
  connect(token: string, userId: string, userRole: string) {
    if (this.socket?.connected) {
      console.log('📡 Socket already connected');
      return;
    }

    this.token = token;
    this.userId = userId;
    this.userRole = userRole;

    const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const serverUrl = typeof rawUrl === 'string' && rawUrl.endsWith('/api') ? rawUrl.replace(/\/api$/, '') : rawUrl;

    console.log('📡 Connecting to Socket.io server...');
    this.socket = io(serverUrl, {
      auth: {
        token: this.token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.setupListeners();
  }

  /**
   * Setup socket event listeners
   */
  private setupListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket?.id);
      this.joinRooms();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
    });

    this.socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });

    this.socket.on('subscriptionConfirmed', (data) => {
      console.log('✅ Subscription confirmed:', data);
    });
  }

  /**
   * Join appropriate rooms based on user role
   */
  private joinRooms() {
    if (!this.socket || !this.userId || !this.userRole) return;

    switch (this.userRole) {
      case 'user':
        this.socket.emit('joinUserRoom', { userId: this.userId });
        break;
      case 'owner':
        this.socket.emit('joinOwnerRoom', this.userId);
        break;
      case 'delivery_boy':
        this.socket.emit('joinDeliveryBoyRoom', { deliveryBoyId: this.userId });
        break;
    }
  }

  /**
   * Send user location update
   */
  sendUserLocationUpdate(location: LocationUpdate) {
    if (!this.socket?.connected) {
      console.warn('⚠️ Socket not connected');
      return;
    }

    this.socket.emit('userLocationUpdate', {
      userId: this.userId,
      latitude: location.latitude,
      longitude: location.longitude,
      address: location.address
    });

    console.log(`📍 Sent user location: [${location.latitude}, ${location.longitude}]`);
  }

  /**
   * Send delivery boy location update
   */
  sendDeliveryBoyLocationUpdate(location: LocationUpdate, orderId?: string) {
    if (!this.socket?.connected) {
      console.warn('⚠️ Socket not connected');
      return;
    }

    this.socket.emit('deliveryBoyLocationUpdate', {
      deliveryBoyId: this.userId,
      latitude: location.latitude,
      longitude: location.longitude,
      address: location.address,
      orderId
    });

    console.log(`📍 Sent delivery boy location: [${location.latitude}, ${location.longitude}]`);
  }

  /**
   * Send owner location update
   */
  sendOwnerLocationUpdate(location: LocationUpdate) {
    if (!this.socket?.connected) {
      console.warn('⚠️ Socket not connected');
      return;
    }

    this.socket.emit('ownerLocationUpdate', {
      ownerId: this.userId,
      latitude: location.latitude,
      longitude: location.longitude,
      address: location.address
    });

    console.log(`📍 Sent owner location: [${location.latitude}, ${location.longitude}]`);
  }

  /**
   * Listen for delivery boy location updates
   */
  onDeliveryBoyLocationUpdate(callback: (data: DeliveryBoyLocation) => void) {
    if (!this.socket) return;

    this.socket.off('deliveryBoyLocationUpdated'); // Remove previous listeners
    this.socket.on('deliveryBoyLocationUpdated', (data: DeliveryBoyLocation) => {
      console.log('📍 Received delivery boy location update:', data);
      callback(data);
    });
  }

  /**
   * Listen for user location updates
   */
  onUserLocationUpdate(callback: (data: any) => void) {
    if (!this.socket) return;

    this.socket.off('userLocationUpdated');
    this.socket.on('userLocationUpdated', (data: any) => {
      console.log('📍 Received user location update:', data);
      callback(data);
    });
  }

  /**
   * Listen for owner location updates
   */
  onOwnerLocationUpdate(callback: (data: any) => void) {
    if (!this.socket) return;

    this.socket.off('ownerLocationUpdated');
    this.socket.on('ownerLocationUpdated', (data: any) => {
      console.log('📍 Received owner location update:', data);
      callback(data);
    });
  }

  /**
   * Subscribe to order tracking
   */
  subscribeToOrderTracking(orderId: string) {
    if (!this.socket?.connected) {
      console.warn('⚠️ Socket not connected');
      return;
    }

    this.socket.emit('subscribeToDeliveryTracking', { orderId });
    console.log(`📡 Subscribed to tracking for order: ${orderId}`);
  }

  /**
   * Subscribe to admin tracking
   */
  subscribeToAdminTracking() {
    if (!this.socket?.connected) {
      console.warn('⚠️ Socket not connected');
      return;
    }

    this.socket.emit('subscribeToAdminTracking');
    console.log('📡 Subscribed to admin tracking');
  }

  /**
   * Disconnect socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      console.log('❌ Socket disconnected');
    }
  }

  /**
   * Get socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Export singleton instance
export const locationSocketService = new LocationSocketService();

export default locationSocketService;
