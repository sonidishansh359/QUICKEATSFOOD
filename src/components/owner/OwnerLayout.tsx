import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Store,
  UtensilsCrossed,
  IndianRupee,
  ClipboardList,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useOwnerData } from '@/contexts/OwnerDataContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const navItems = [
  { path: '/owner/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/owner/restaurant', label: 'Add Restaurant', icon: Store },
  { path: '/owner/menu', label: 'Add Menu', icon: UtensilsCrossed },
  { path: '/owner/orders', label: 'Manage Orders', icon: ClipboardList },
  { path: '/owner/promo-codes', label: 'Promo Codes', icon: Zap },
  { path: '/owner/earnings', label: 'View Earnings', icon: IndianRupee },
];

export default function OwnerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { unreadNotifications, notifications, markNotificationAsRead, markAllNotificationsAsRead } = useOwnerData();

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

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-72 bg-card border-r border-border transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <Link to="/owner/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                <span className="text-xl">🍕</span>
              </div>
              <span className="text-xl font-bold text-foreground">QuickEats</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 px-4 py-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                {user?.name?.charAt(0) || 'O'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{user?.name || 'Owner'}</p>
                <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-72">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-muted-foreground hover:text-foreground"
            >
              <Menu className="w-6 h-6" />
            </button>

            <h1 className="text-lg font-semibold text-foreground lg:text-xl">
              {navItems.find((item) => item.path === location.pathname)?.label || 'Dashboard'}
            </h1>

            <div className="flex items-center gap-2">
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Bell className="w-6 h-6" />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-1 right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center">
                      {unreadNotifications > 99 ? '99+' : unreadNotifications}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
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
                                if (!notif.read) markNotificationAsRead(notif.id);
                                if (notif.orderId) {
                                  navigate('/owner/orders');
                                  setShowNotifications(false);
                                }
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
                              navigate('/owner/orders');
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
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
