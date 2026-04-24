import React from "react";
import { Navigate } from "react-router-dom";
import { useAdminAuth } from "./AdminAuthContext";

export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading admin...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};
