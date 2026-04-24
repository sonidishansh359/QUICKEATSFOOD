import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  ShoppingBag,
  MapPin,
  User,
  LogOut,
  Menu,
  X,
  Search,
  ShoppingCart,
  Bell,
  MessageSquare,
  Loader2,
  ChevronDown,
  ChevronRight,
  Check,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  Clock,
  Map,
  Phone,
  Mail,
  CreditCard,
  ShieldCheck,
  Gift,
  HelpCircle,
  History,
  Package,
  Settings,
  Plus,
  Target,
  Truck,
  Zap,
  Star,
  Building,
  Filter,
  Navigation,
  Utensils,
  TrendingUp,
} from 'lucide-react';
import { useAutoLocation } from '@/hooks/useAutoLocation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useUserData } from '@/contexts/UserDataContext';
import { Button } from '@/components/ui/button';

const navItems = [
  { icon: Home, label: 'Home', path: '/user/dashboard' },
  { icon: ShoppingBag, label: 'Orders', path: '/user/orders' },
  { icon: MapPin, label: 'Track Order', path: '/user/tracking' },
  { icon: MessageSquare, label: 'Feedback', path: '/user/feedback' },
  { icon: User, label: 'Profile', path: '/user/profile' },
];

export default function UserLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { cart, notifications, unreadCount, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, clearAllNotifications } = useUserData();
  const { location: autoLocation, isUpdating: isLocationUpdating } = useAutoLocation();

  // Location display
  const displayCity = autoLocation?.address || 'Detecting...';
  const hasLocationActive = autoLocation && !isLocationUpdating;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-card/95 backdrop-blur-md border-b border-border z-50">
        <div className="h-full px-4 lg:px-8 flex items-center justify-between">
          {/* Location Display - Top Left */}
          <button
            onClick={() => navigate('/user/dashboard')}
            className="flex items-center gap-2 bg-white hover:bg-gray-50 px-3 py-2 rounded-full shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200"
          >
            <div className="relative">
              {isLocationUpdating ? (
                <Loader2 className="w-5 h-5 text-[#FF7A00] animate-spin" />
              ) : (
                <MapPin className="w-5 h-5 text-[#FF7A00]" />
              )}
              {hasLocationActive && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border-2 border-white animate-pulse" />
              )}
            </div>
            <div className="text-left">
              <p className="text-xs font-medium text-gray-500">Delivering to</p>
              <p className="text-sm font-bold text-gray-900 truncate max-w-[150px] sm:max-w-[200px]">
                {displayCity}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  location.pathname === item.path
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <div className="relative">
              <button
                className="relative p-2 rounded-lg hover:bg-secondary transition-colors"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="w-5 h-5 text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-background flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Modal */}
              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50 origin-top-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Notifications Header */}
                      <div className="p-4 bg-gradient-to-r from-[#FF7A00]/10 to-orange-50 border-b border-orange-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">Notifications</h3>
                            <p className="text-xs text-gray-600">
                              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                              <button
                                onClick={markAllNotificationsAsRead}
                                className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                              >
                                Mark read
                              </button>
                            )}
                            {notifications.length > 0 && (
                              <button
                                onClick={clearAllNotifications}
                                className="px-2 py-1 text-xs bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100 transition-colors"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Notifications List */}
                      <div className="max-h-[60vh] overflow-y-auto">
                        {notifications.length > 0 ? (
                          <div className="divide-y divide-gray-100">
                            {notifications.map((notification) => {
                              const Icon = notification.icon || Bell;
                              return (
                                <div
                                  key={notification.id}
                                  className={`p-4 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-50/50' : ''}`}
                                >
                                  <Link
                                    to={notification.link || '#'}
                                    onClick={() => {
                                      markNotificationAsRead(notification.id);
                                      setShowNotifications(false);
                                    }}
                                    className="flex items-start gap-3"
                                  >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${notification.color || 'bg-gray-100 text-gray-600'}`}>
                                      <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between">
                                        <h4 className="font-medium text-gray-900 text-sm">{notification.title}</h4>
                                        <div className="flex items-center gap-2">
                                          <span className="text-[10px] text-gray-500">{notification.time}</span>
                                          {!notification.read && (
                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                          )}
                                        </div>
                                      </div>
                                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
                                    </div>
                                  </Link>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-8 text-center">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                              <Bell className="w-6 h-6 text-gray-400" />
                            </div>
                            <h4 className="font-medium text-gray-900 mb-1">No notifications</h4>
                            <p className="text-xs text-gray-500">We'll notify you when something arrives</p>
                          </div>
                        )}
                      </div>

                      {/* View All Link */}
                      {notifications.length > 0 && (
                        <div className="p-3 border-t border-gray-200">
                          <Link
                            to="/user/notifications"
                            onClick={() => setShowNotifications(false)}
                            className="w-full flex items-center justify-center gap-1.5 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium transition-colors"
                          >
                            View all
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </div>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Cart */}
            <Link
              to="/user/cart"
              className="relative p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <ShoppingCart className="w-5 h-5 text-muted-foreground" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>

            <Link to="/user/profile" className="flex items-center gap-3 pl-3 border-l border-border hover:opacity-80 transition-opacity">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-primary/20">
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-bold text-primary">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </Link>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.nav
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-16 right-0 bottom-0 w-72 bg-card border-l border-border z-50 lg:hidden"
            >
              <div className="p-4 space-y-2">
                {navItems.map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                      location.pathname === item.path
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                ))}
                <div className="pt-4 border-t border-border mt-4">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 w-full"
                  >
                    <LogOut className="w-5 h-5" />
                    Logout
                  </button>
                </div>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="pt-16 min-h-screen">
        <Outlet />
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card/95 backdrop-blur-md border-t border-border lg:hidden z-40">
        <div className="h-full flex items-center justify-around">
          {navItems.slice(0, 5).map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-lg transition-colors',
                location.pathname === item.path
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
