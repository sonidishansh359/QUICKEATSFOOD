import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AdminAuthProvider } from "./AdminAuthContext";
import { AdminNotificationProvider } from "./AdminNotificationContext";
import { AdminRoute } from "./AdminRoute";
import AdminLayout from "./layout/AdminLayout";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRestaurants from "./pages/AdminRestaurants";
import AdminReviews from "./pages/AdminReviews";
import AdminEarnings from "./pages/AdminEarnings";
import AdminAccounts from "./pages/AdminAccounts";
import AdminSettings from './pages/Settings';

import "../src/index.css";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <TooltipProvider>
                <AdminAuthProvider>
                    <AdminNotificationProvider>
                        <Toaster />
                        <Sonner />
                        <BrowserRouter>
                            <Routes>
                                <Route path="/admin/login" element={<AdminLogin />} />
                                <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                                    <Route index element={<Navigate to="/admin/dashboard" replace />} />
                                    <Route path="dashboard" element={<AdminDashboard />} />
                                    <Route path="restaurants" element={<AdminRestaurants />} />
                                    <Route path="approvals" element={<AdminRestaurants />} />
                                    <Route path="reviews" element={<AdminReviews />} />
                                    <Route path="earnings" element={<AdminEarnings />} />
                                    <Route path="accounts" element={<AdminAccounts />} />
                                    <Route path="settings" element={<AdminSettings />} />
                                </Route>
                                {/* Redirect any root access to admin dashboard */}
                                <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
                            </Routes>
                        </BrowserRouter>
                    </AdminNotificationProvider>
                </AdminAuthProvider>
            </TooltipProvider>
        </QueryClientProvider>
    </React.StrictMode>
);
