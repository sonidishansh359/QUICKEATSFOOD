import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Building2, Radar, ShieldCheck, MessageSquare, Ban, Settings } from "lucide-react";

const navItems = [
  { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Restaurants", to: "/admin/restaurants", icon: Building2 },
  { label: "Approvals", to: "/admin/approvals", icon: ShieldCheck },
  { label: "Reviews", to: "/admin/reviews", icon: MessageSquare },
  { label: "Earnings", to: "/admin/earnings", icon: Building2 }, // Using Building2 temporarilly or import Banknote
  { label: "Account Ban", to: "/admin/accounts", icon: Ban },
  { label: "Settings", to: "/admin/settings", icon: Settings },
];

export const AdminSidebar = () => {
  return (
    <aside className="w-64 bg-card border-r border-border h-full p-4 flex flex-col overflow-y-auto">
      <div className="flex items-center gap-2 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">QuickEats</p>
          <p className="font-semibold text-foreground">Admin Control</p>
        </div>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                ].join(" ")
              }
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};
