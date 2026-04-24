import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  MapPin,
  Wallet,
  User,
  Bell,
  LogOut,
  Menu,
  X,
  Power,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { useDeliveryData } from '@/contexts/DeliveryDataContext';
import { cn } from '@/lib/utils';
import useGeolocation from '@/hooks/useGeolocation';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/delivery/dashboard' },
  { icon: Package, label: 'Orders', path: '/delivery/orders' },
  { icon: MapPin, label: 'Live Tracking', path: '/delivery/tracking' },
  { icon: Wallet, label: 'Earnings', path: '/delivery/earnings' },
  { icon: Star, label: 'Feedback', path: '/delivery/feedback' },
  { icon: User, label: 'Profile', path: '/delivery/profile' },
];

interface DeliveryLayoutProps {
  children: React.ReactNode;
}

export function DeliveryLayout({ children }: DeliveryLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { profile, toggleOnlineStatus, notifications, unreadNotifications, markNotificationRead, markAllNotificationsAsRead, activeOrder, updateLocation } = useDeliveryData();
  const { location: geoLocation, startWatching } = useGeolocation(true);
  const activeOrderId = activeOrder ? (activeOrder as any)._id || (activeOrder as any).id || (activeOrder as any).orderId : null;

  // Start geolocation tracking for delivery partners
  useEffect(() => {
    if (user?.role === 'delivery') {
      startWatching();
    }
  }, [user?.id, user?.role, startWatching]);

  // Sync geolocation updates into delivery context (used for distance calculations)
  useEffect(() => {
    if (user?.role === 'delivery' && geoLocation) {
      updateLocation(geoLocation.latitude, geoLocation.longitude);
    }
  }, [user?.role, geoLocation, updateLocation]);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showNotifications]);

  const formatTimeAgo = (timestamp: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-card border-r border-border">
        <div className="p-6 border-b border-border">
          <Link to="/delivery/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <span className="text-xl">🚴</span>
            </div>
            <div>
              <h1 className="font-bold text-foreground">QuickEats</h1>
              <p className="text-xs text-muted-foreground">Delivery Partner</p>
            </div>
          </Link>
        </div>

        {/* Online Status Toggle */}
        <div className="p-4 mx-4 mt-4 rounded-xl bg-muted/50 border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Power className={cn("w-5 h-5", profile.isOnline ? "text-green-500" : "text-muted-foreground")} />
              <span className="text-sm font-medium">{profile.isOnline ? 'Online' : 'Offline'}</span>
            </div>
            <Switch
              checked={profile.isOnline}
              onCheckedChange={toggleOnlineStatus}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {profile.isOnline ? 'You are receiving orders' : 'Go online to receive orders'}
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isLiveTracking = item.label === 'Live Tracking';
            const trackingPath = activeOrderId ? `/delivery/tracking/${activeOrderId}` : null;
            const targetPath = isLiveTracking ? (trackingPath || item.path) : item.path;
            const isActive = isLiveTracking
              ? location.pathname.startsWith('/delivery/tracking')
              : location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={targetPath}
                onClick={(e) => {
                  if (isLiveTracking && !trackingPath) {
                    e.preventDefault();
                    alert('No active order to track. Please accept an order first.');
                  }
                }}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-card border-r border-border z-50 lg:hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                    <span className="text-xl">🚴</span>
                  </div>
                  <span className="font-bold">QuickEats</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Online Status Toggle Mobile */}
              <div className="p-4 mx-4 mt-4 rounded-xl bg-muted/50 border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Power className={cn("w-5 h-5", profile.isOnline ? "text-green-500" : "text-muted-foreground")} />
                    <span className="text-sm font-medium">{profile.isOnline ? 'Online' : 'Offline'}</span>
                  </div>
                  <Switch
                    checked={profile.isOnline}
                    onCheckedChange={toggleOnlineStatus}
                  />
                </div>
              </div>

              <nav className="p-4 space-y-1">
                {navItems.map((item) => {
                  const isLiveTracking = item.label === 'Live Tracking';
                  const trackingPath = activeOrderId ? `/delivery/tracking/${activeOrderId}` : null;
                  const targetPath = isLiveTracking ? (trackingPath || item.path) : item.path;
                  const isActive = isLiveTracking
                    ? location.pathname.startsWith('/delivery/tracking')
                    : location.pathname === item.path;

                  return (
                    <Link
                      key={item.path}
                      to={targetPath}
                      onClick={(e) => {
                        if (isLiveTracking && !trackingPath) {
                          e.preventDefault();
                          alert('No active order to track. Please accept an order first.');
                          return;
                        }
                        setSidebarOpen(false);
                      }}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-muted-foreground hover:text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Sign Out
                </Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center justify-between px-4 lg:px-6 h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div className="hidden sm:block">
                <h1 className="font-semibold text-foreground">
                  {navItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Status Badge */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  profile.isOnline ? "bg-green-500 animate-pulse" : "bg-muted-foreground"
                )} />
                <span className="text-sm font-medium">
                  {profile.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>

              {/* Notifications */}
              <div className="relative" ref={notificationRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifications > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 min-w-[20px] p-0 flex items-center justify-center text-xs">
                      {unreadNotifications > 99 ? '99+' : unreadNotifications}
                    </Badge>
                  )}
                </Button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-96 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
                        <h3 className="font-semibold text-foreground">Notifications</h3>
                        {unreadNotifications > 0 && (
                          <button
                            onClick={markAllNotificationsAsRead}
                            className="text-xs text-primary hover:underline"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>

                      {/* Notifications List */}
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-muted-foreground">
                            <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No notifications</p>
                          </div>
                        ) : (
                          notifications.slice(0, 10).map((notif) => (
                            <button
                              key={notif.id}
                              onClick={() => {
                                if (!notif.read) markNotificationRead(notif.id);
                                navigate('/delivery/orders');
                                setShowNotifications(false);
                              }}
                              className={cn(
                                'w-full p-4 text-left border-b border-border hover:bg-muted/50 transition-colors',
                                !notif.read && 'bg-primary/5'
                              )}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-foreground mb-1">
                                    {notif.title}
                                  </p>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {notif.message}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatTimeAgo(notif.timestamp)}
                                  </p>
                                </div>
                                {!notif.read && (
                                  <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                                )}
                              </div>
                            </button>
                          ))
                        )}
                      </div>

                      {/* Footer */}
                      {notifications.length > 0 && (
                        <div className="p-3 border-t border-border bg-muted/30 text-center">
                          <button
                            onClick={() => {
                              navigate('/delivery/orders');
                              setShowNotifications(false);
                            }}
                            className="text-sm text-primary hover:underline"
                          >
                            View all orders
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Profile */}
              <div className="flex items-center gap-3 pl-3 border-l border-border">
                <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-semibold text-sm">
                    {user?.name?.charAt(0) || 'D'}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium">{user?.name || profile.name}</p>
                  <p className="text-xs text-muted-foreground">⭐ {profile.rating}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}