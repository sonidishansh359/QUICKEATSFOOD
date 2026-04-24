import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { OwnerDataProvider } from "@/contexts/OwnerDataContext";
import { DeliveryDataProvider } from "@/contexts/DeliveryDataContext";
import { UserDataProvider } from "@/contexts/UserDataContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Restaurants from "./pages/Restaurants";
import Offers from "./pages/Offers";
import Help from "./pages/Help";
import Auth from "./pages/Auth";
import Cart from "./pages/Cart";
import Landing from "./pages/Landing";
import OwnerLayout from "./components/owner/OwnerLayout";
import OwnerDashboard from "./pages/owner/Dashboard";
import OwnerRestaurant from "./pages/owner/Restaurant";
import OwnerMenu from "./pages/owner/Menu";
import OwnerOrders from "./pages/owner/Orders";
import OwnerEarnings from "./pages/owner/Earnings";
import OwnerPromoCodes from "./pages/owner/PromoCodes";
import DeliveryDashboard from "./pages/delivery/Dashboard";
import DeliveryOrders from "./pages/delivery/Orders";
import DeliveryTracking from "./pages/delivery/Tracking";
import DeliveryFeedback from "./pages/delivery/Feedback";
import { useDeliveryData } from "@/contexts/DeliveryDataContext";
import DeliveryEarnings from "./pages/delivery/Earnings";
import DeliveryProfile from "./pages/delivery/Profile";
import UserTrackingPage from "./pages/user/Tracking";
import UserLayout from "./components/user/UserLayout";
import UserDashboard from "./pages/user/Dashboard";
import RestaurantDetail from "./pages/user/RestaurantDetail";
import UserCart from "./pages/user/UserCart";
import CheckoutSuccess from "./pages/user/CheckoutSuccess";
import OrderTracking from "./pages/user/OrderTracking";
import OrderHistory from "./pages/user/OrderHistory";
import UserFeedback from "./pages/user/UserFeedback";
import Profile from "./pages/user/Profile";
import { AdminAuthProvider } from "../admin/AdminAuthContext";

import { AdminRoute } from "../admin/AdminRoute";
import AdminLayout from "../admin/layout/AdminLayout";
import AdminLogin from "../admin/pages/AdminLogin";
import AdminDashboard from "../admin/pages/AdminDashboard";
import AdminRestaurants from "../admin/pages/AdminRestaurants";
import AdminTracking from "../admin/pages/AdminTracking";
import AdminReviews from "../admin/pages/AdminReviews";
import AdminAccounts from "../admin/pages/AdminAccounts";

const queryClient = new QueryClient();

// Protected route wrapper for owner pages
const OwnerRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated || user?.role !== 'owner') {
    return <Navigate to="/" replace />;
  }

  return <OwnerDataProvider>{children}</OwnerDataProvider>;
};

// Protected route wrapper for delivery pages
const DeliveryRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated || user?.role !== 'delivery') {
    return <Navigate to="/" replace />;
  }

  return <DeliveryDataProvider>{children}</DeliveryDataProvider>;
};

// Protected route wrapper for user pages
const UserRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated || user?.role !== 'user') {
    return <Navigate to="/" replace />;
  }

  return <UserDataProvider>{children}</UserDataProvider>;
};

const AppRoutes = () => (
  <Routes>

    <Route path="/" element={<Landing />} />
    <Route path="/restaurants" element={<Restaurants />} />
    <Route path="/offers" element={<Offers />} />
    <Route path="/help" element={<Help />} />
    <Route path="/auth" element={<Navigate to="/" replace />} />
    <Route path="/cart" element={<Cart />} />

    {/* Owner Dashboard Routes */}
    <Route path="/owner" element={<OwnerRoute><OwnerLayout /></OwnerRoute>}>
      <Route path="dashboard" element={<OwnerDashboard />} />
      <Route path="restaurant" element={<OwnerRestaurant />} />
      <Route path="menu" element={<OwnerMenu />} />
      <Route path="orders" element={<OwnerOrders />} />
      <Route path="promo-codes" element={<OwnerPromoCodes />} />
      <Route path="earnings" element={<OwnerEarnings />} />
    </Route>

    {/* Delivery Dashboard Routes */}
    <Route path="/delivery/dashboard" element={<DeliveryRoute><DeliveryDashboard /></DeliveryRoute>} />
    <Route path="/delivery/orders" element={<DeliveryRoute><DeliveryOrders /></DeliveryRoute>} />
    <Route path="/delivery/tracking/:orderId" element={<DeliveryRoute><DeliveryTracking /></DeliveryRoute>} />
    {/* Backward-compatible redirect for /delivery/tracking without ID */}
    <Route path="/delivery/tracking" element={<DeliveryRoute><DeliveryTrackingRedirect /></DeliveryRoute>} />
    <Route path="/delivery/earnings" element={<DeliveryRoute><DeliveryEarnings /></DeliveryRoute>} />
    <Route path="/delivery/feedback" element={<DeliveryRoute><DeliveryFeedback /></DeliveryRoute>} />
    <Route path="/delivery/profile" element={<DeliveryRoute><DeliveryProfile /></DeliveryRoute>} />

    {/* Admin Console (read-only, fixed credentials) */}
    <Route path="/admin/login" element={<AdminLogin />} />
    <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
      <Route index element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="dashboard" element={<AdminDashboard />} />
      <Route path="restaurants" element={<AdminRestaurants />} />
      <Route path="approvals" element={<AdminRestaurants />} />
      <Route path="reviews" element={<AdminReviews />} />
      <Route path="tracking" element={<AdminTracking />} />
      <Route path="accounts" element={<AdminAccounts />} />
    </Route>

    {/* User Dashboard Routes */}
    <Route path="/user" element={<UserRoute><UserLayout /></UserRoute>}>
      <Route path="dashboard" element={<UserDashboard />} />
      <Route path="restaurants" element={<UserDashboard />} />
      <Route path="restaurant/:id" element={<RestaurantDetail />} />
      <Route path="cart" element={<UserCart />} />
      <Route path="checkout-success" element={<CheckoutSuccess />} />
      <Route path="tracking/:orderId" element={<UserTrackingPage />} />
      {/* Show active order tracking when no specific order ID */}
      <Route path="tracking" element={<OrderTracking />} />
      <Route path="orders" element={<OrderHistory />} />
      <Route path="feedback" element={<UserFeedback />} />
      <Route path="profile" element={<Profile />} />
    </Route>

    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AdminAuthProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </AdminAuthProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

// Redirect helper for delivery (only)
const DeliveryTrackingRedirect = () => {
  // Redirect to orders page since no order ID is specified
  return <Navigate to="/delivery/orders" replace />;
};

export default App;