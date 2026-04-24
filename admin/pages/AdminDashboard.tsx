import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Building2, Clock, Gauge, MapPin, Shield, Signal, Users, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchAdminRestaurants, fetchAdminStats } from "../lib/adminApi";
import AdminReports from "./AdminReports";

const numberFormatter = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const currencyFormatter = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const MetricCard = ({ title, value, icon: Icon, helper }: { title: string; value: string | number; icon: any; helper?: string }) => (
  <Card className="border-border">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className="h-4 w-4 text-primary" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      {helper && <p className="text-xs text-muted-foreground mt-1">{helper}</p>}
    </CardContent>
  </Card>
);

const AdminDashboard = () => {
  const { data: stats, isFetching: statsLoading, refetch } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: fetchAdminStats,
    refetchInterval: 60000,
  });

  const { data: restaurants } = useQuery({
    queryKey: ["admin-restaurants-preview"],
    queryFn: fetchAdminRestaurants,
    staleTime: 60000,
  });

  const derived = useMemo(() => ({
    totalOrders: stats ? numberFormatter.format(stats.totalOrders || 0) : "—",
    totalRestaurants: stats ? numberFormatter.format(stats.totalRestaurants || 0) : "—",
    happyCustomers: stats ? numberFormatter.format(stats.happyCustomers || 0) : "—",
    averageDelivery: stats ? `${stats.averageDelivery || 0} mins` : "—",
  }), [stats]);

  const recentRestaurants = useMemo(() => (restaurants || []).slice(0, 5), [restaurants]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm text-muted-foreground">Full-system oversight</p>
          <h1 className="text-2xl font-semibold text-foreground">Admin Dashboard</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={statsLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${statsLoading ? "animate-spin" : ""}`} />
          Refresh data
        </Button>
      </div>

      <div className="mb-8">
        <AdminReports />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard title="Total Orders" value={derived.totalOrders} icon={Gauge} helper="Includes all statuses" />
        <MetricCard title="Restaurants" value={derived.totalRestaurants} icon={Building2} helper="Across all cities" />
        <MetricCard title="Customers" value={derived.happyCustomers} icon={Users} helper="Registered users" />
        <MetricCard title="Avg Delivery" value={derived.averageDelivery} icon={Clock} helper="Calculated from delivered orders" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Live System Health</CardTitle>
              <p className="text-sm text-muted-foreground">No destructive actions are exposed to admin UI.</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Signal className="h-4 w-4" />
              Online
            </div>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg border border-border bg-background/60">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground"><Shield className="h-4 w-4 text-primary" />Data Protection</div>
              <p className="text-xs text-muted-foreground mt-1">Read-only dashboards; no delete or update calls.</p>
            </div>
            <div className="p-3 rounded-lg border border-border bg-background/60">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground"><Activity className="h-4 w-4 text-primary" />API Reachability</div>
              <p className="text-xs text-muted-foreground mt-1">Stats endpoint is polled every minute for uptime.</p>
            </div>
            <div className="p-3 rounded-lg border border-border bg-background/60">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground"><MapPin className="h-4 w-4 text-primary" />Live Tracking</div>
              <p className="text-xs text-muted-foreground mt-1">Admin can subscribe to delivery and user tracking feeds.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Latest Restaurants</CardTitle>
            <p className="text-sm text-muted-foreground">Snapshot of the newest entries</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentRestaurants.length === 0 && <p className="text-sm text-muted-foreground">No restaurants found.</p>}
            {recentRestaurants.map((restaurant) => (
              <div key={restaurant._id} className="p-3 rounded-lg border border-border bg-background/60">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{restaurant.name}</p>
                    <p className="text-xs text-muted-foreground">{restaurant.address || "Address not provided"}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${restaurant.isOpen ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                    {restaurant.isOpen ? "Open" : "Closed"}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
