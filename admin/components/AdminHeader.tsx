import React from "react";
import { Bell, LogOut, Menu, Check, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useAdminAuth } from "../AdminAuthContext";
import { useAdminNotifications, Notification } from "../AdminNotificationContext";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

interface AdminHeaderProps {
  onToggleSidebar?: () => void;
}

const NotificationItem = ({ notification, onRead }: { notification: Notification; onRead: (id: string) => void }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    onRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <div
      className={`p-3 border-b last:border-0 hover:bg-muted/50 cursor-pointer transition-colors ${!notification.read ? 'bg-muted/30' : ''}`}
      onClick={handleClick}
    >
      <div className="flex justify-between items-start gap-2">
        <h4 className={`text-sm ${!notification.read ? 'font-semibold' : 'font-medium'}`}>{notification.title}</h4>
        {!notification.read && <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1" />}
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{notification.message}</p>
      <span className="text-[10px] text-muted-foreground/80 mt-1 block">
        {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
      </span>
    </div>
  );
};

export const AdminHeader = ({ onToggleSidebar }: AdminHeaderProps) => {
  const { admin, logout } = useAdminAuth();
  const { notifications, unreadCount, markAllAsRead, clearNotifications, markAsRead } = useAdminNotifications();

  return (
    <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between px-4 md:px-6 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={onToggleSidebar}>
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <p className="text-xs text-muted-foreground">Logged in as</p>
            <p className="font-semibold text-foreground">{admin?.name || "Admin"}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="flex items-center justify-between px-4 py-2 border-b">
                <span className="font-semibold text-sm">Notifications</span>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" title="Mark all read" onClick={() => markAllAsRead()}>
                      <Check className="h-3 w-3" />
                    </Button>
                  )}
                  {notifications.length > 0 && (
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" title="Clear all" onClick={() => clearNotifications()}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              <ScrollArea className="h-[300px]">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground">
                    <Bell className="h-8 w-8 mb-2 opacity-20" />
                    <p className="text-sm">No notifications</p>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {notifications.map((notification) => (
                      <NotificationItem key={notification.id} notification={notification} onRead={markAsRead} />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};
