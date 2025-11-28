import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Bell,
  BellRing,
  CheckCheck,
  Trash2,
  X,
  AlertTriangle,
  Users,
  UserCheck,
  Shield,
  Calendar,
  Settings,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface AdminNotification {
  id: number;
  type: "user_registration" | "user_login" | "role_change" | "trial_expiring" | "trial_expired" | "admin_action" | "system_alert";
  title: string;
  message: string;
  userId?: number;
  userName?: string;
  userEmail?: string;
  priority: "low" | "medium" | "high" | "critical";
  isRead: boolean;
  data?: string;
  createdAt: string;
}

const notificationIcons = {
  user_registration: Users,
  user_login: UserCheck,
  role_change: Shield,
  trial_expiring: Calendar,
  trial_expired: AlertTriangle,
  admin_action: Settings,
  system_alert: AlertCircle,
};

const priorityColors = {
  low: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const typeColors = {
  user_registration: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  user_login: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  role_change: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  trial_expiring: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  trial_expired: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  admin_action: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  system_alert: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

export function AdminNotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch notifications
  const {
    data: notifications = [],
    isLoading,
    error,
  } = useQuery<AdminNotification[]>({
    queryKey: ["/api/admin/notifications"],
    enabled: isOpen, // Only fetch when panel is open
    refetchInterval: 30000, // Refetch every 30 seconds when open
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("PATCH", `/api/admin/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () =>
      apiRequest("PATCH", "/api/admin/notifications/read-all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("DELETE", `/api/admin/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      toast({
        title: "Success",
        description: "Notification deleted",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      });
    },
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = (id: number, isRead: boolean) => {
    if (!isRead) {
      markAsReadMutation.mutate(id);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleDeleteNotification = (id: number) => {
    deleteNotificationMutation.mutate(id);
  };

  const formatNotificationType = (type: string) => {
    return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          {unreadCount > 0 ? (
            <BellRing className="h-4 w-4" />
          ) : (
            <Bell className="h-4 w-4" />
          )}
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Admin Notifications
              {unreadCount > 0 && (
                <Badge variant="secondary">{unreadCount} unread</Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={markAllAsReadMutation.isPending}
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
            )}
          </SheetTitle>
          <SheetDescription>
            Stay updated with important system events and user activities.
          </SheetDescription>
        </SheetHeader>

        <Separator className="my-4" />

        <ScrollArea className="h-[calc(100vh-160px)]">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card>
              <CardContent className="p-4 text-center">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Failed to load notifications
                </p>
              </CardContent>
            </Card>
          ) : notifications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No notifications</h3>
                <p className="text-sm text-muted-foreground">
                  You're all caught up! New notifications will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => {
                const IconComponent = notificationIcons[notification.type];
                
                return (
                  <Card
                    key={notification.id}
                    className={`cursor-pointer transition-colors ${
                      !notification.isRead
                        ? "ring-2 ring-primary/20 bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => handleMarkAsRead(notification.id, notification.isRead)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="p-2 rounded-full bg-muted">
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-1">
                              <CardTitle className="text-sm font-medium leading-tight">
                                {notification.title}
                              </CardTitle>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteNotification(notification.id);
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            <CardDescription className="text-xs leading-relaxed">
                              {notification.message}
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`text-xs ${typeColors[notification.type]}`}
                          >
                            {formatNotificationType(notification.type)}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-xs ${priorityColors[notification.priority]}`}
                          >
                            {notification.priority}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      
                      {notification.userName && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          User: {notification.userName}
                          {notification.userEmail && (
                            <span className="ml-1">({notification.userEmail})</span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}