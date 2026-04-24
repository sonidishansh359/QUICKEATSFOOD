import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useToast } from '@/hooks/use-toast';

export interface Notification {
    id: string;
    type: 'order' | 'restaurant' | 'review' | 'system';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    link?: string;
    data?: any;
}

interface AdminNotificationContextValue {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearNotifications: () => void;
    isConnected: boolean;
}

const AdminNotificationContext = createContext<AdminNotificationContextValue | undefined>(undefined);

const ADMIN_SOCKET_URL = (() => {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = 5000;
    return `${protocol}//${hostname}:${port}`;
})();

const STORAGE_KEY = 'admin_notifications_v1';

export const AdminNotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);
    const { toast } = useToast();

    // Load from local storage on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored).map((n: any) => ({
                    ...n,
                    timestamp: new Date(n.timestamp)
                }));
                setNotifications(parsed);
            } catch (e) {
                console.error("Failed to load notifications", e);
            }
        }
    }, []);

    // Save to local storage on change
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, 100))); // Keep last 100
    }, [notifications]);

    useEffect(() => {
        const socket = io(ADMIN_SOCKET_URL, {
            transports: ["websocket", "polling"],
            reconnectionAttempts: 5,
        });
        socketRef.current = socket;

        socket.on("connect", () => {
            console.log("Connected to admin notification socket");
            setIsConnected(true);
            socket.emit("subscribeToAdminTracking"); // Reuse existing room for now
        });

        socket.on("disconnect", () => {
            console.log("Disconnected from admin notification socket");
            setIsConnected(false);
        });

        // Handle New Order
        socket.on("newOrderAdmin", (order: any) => {
            addNotification({
                type: 'order',
                title: 'New Order Placed',
                message: `Order #${order._id.slice(-6)} received from ${order.user?.name || 'Customer'}`,
                link: '/admin/tracking', // Could route to orders page if it existed
                data: order
            });
            toast({
                title: "New Order",
                description: `Order #${order._id.slice(-6)} received`,
            });
        });

        // Handle New Restaurant Registration
        socket.on("restaurantRegistered", (restaurant: any) => {
            addNotification({
                type: 'restaurant',
                title: 'New Restaurant Registration',
                message: `${restaurant.name} has signed up and is pending approval`,
                link: '/admin/approvals',
                data: restaurant
            });
            toast({
                title: "New Restaurant",
                description: `${restaurant.name} needs approval`,
            });
        });

        // Handle New Review
        socket.on("newReview", (review: any) => {
            addNotification({
                type: 'review',
                title: 'New Review Submitted',
                message: `${review.user?.name || 'User'} rated ${review.rating} stars for ${review.restaurant?.name || 'Restaurant'}`,
                link: '/admin/reviews',
                data: review
            });
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const addNotification = useCallback((n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
        setNotifications(prev => {
            const newNotification: Notification = {
                id: Date.now().toString() + Math.random().toString().slice(2, 6),
                timestamp: new Date(),
                read: false,
                ...n
            };
            return [newNotification, ...prev];
        });
    }, []);

    const markAsRead = useCallback((id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    const clearNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <AdminNotificationContext.Provider value={{
            notifications,
            unreadCount,
            markAsRead,
            markAllAsRead,
            clearNotifications,
            isConnected
        }}>
            {children}
        </AdminNotificationContext.Provider>
    );
};

export const useAdminNotifications = () => {
    const ctx = useContext(AdminNotificationContext);
    if (!ctx) {
        throw new Error("useAdminNotifications must be used within AdminNotificationProvider");
    }
    return ctx;
};
