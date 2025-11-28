import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Bell, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Calendar, 
  User,
  X,
  Mark,
  BellRing,
  Filter
} from "lucide-react";
import { format, formatDistanceToNow, isToday, isTomorrow } from "date-fns";
import type { Client, FollowUp } from "@shared/schema";

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onNotificationClick?: (notification: NotificationItem) => void;
}

interface NotificationItem {
  id: string;
  type: 'overdue' | 'due_today' | 'due_tomorrow' | 'new_client' | 'follow_up_completed';
  title: string;
  message: string;
  timestamp: Date;
  priority: 'high' | 'medium' | 'low';
  client?: Client;
  followUp?: FollowUp;
  read: boolean;
  actionable: boolean;
}

export default function NotificationCenter({ isOpen, onClose, onNotificationClick }: NotificationCenterProps) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: followUps = [] } = useQuery<FollowUp[]>({
    queryKey: ["/api/follow-ups"],
  });

  const { data: overdueFollowUps = [] } = useQuery<FollowUp[]>({
    queryKey: ["/api/follow-ups/overdue"],
  });

  const { data: upcomingFollowUps = [] } = useQuery<FollowUp[]>({
    queryKey: ["/api/follow-ups/upcoming"],
  });

  // Generate notifications based on data
  const generateNotifications = (): NotificationItem[] => {
    const notifications: NotificationItem[] = [];
    const now = new Date();
    const clientMap = new Map(clients.map(c => [c.id, c]));

    // Overdue follow-ups
    overdueFollowUps.forEach(followUp => {
      const client = clientMap.get(followUp.clientId);
      if (client) {
        notifications.push({
          id: `overdue-${followUp.id}`,
          type: 'overdue',
          title: 'Overdue Follow-up',
          message: `${followUp.title} for ${client.name} was due ${formatDistanceToNow(new Date(followUp.dueDate))} ago`,
          timestamp: new Date(followUp.dueDate),
          priority: 'high',
          client,
          followUp,
          read: false,
          actionable: true
        });
      }
    });

    // Due today
    upcomingFollowUps.forEach(followUp => {
      const client = clientMap.get(followUp.clientId);
      const dueDate = new Date(followUp.dueDate);
      
      if (client && isToday(dueDate)) {
        notifications.push({
          id: `due-today-${followUp.id}`,
          type: 'due_today',
          title: 'Due Today',
          message: `${followUp.title} for ${client.name} is due today`,
          timestamp: dueDate,
          priority: 'high',
          client,
          followUp,
          read: false,
          actionable: true
        });
      }
    });

    // Due tomorrow
    upcomingFollowUps.forEach(followUp => {
      const client = clientMap.get(followUp.clientId);
      const dueDate = new Date(followUp.dueDate);
      
      if (client && isTomorrow(dueDate)) {
        notifications.push({
          id: `due-tomorrow-${followUp.id}`,
          type: 'due_tomorrow',
          title: 'Due Tomorrow',
          message: `${followUp.title} for ${client.name} is due tomorrow`,
          timestamp: dueDate,
          priority: 'medium',
          client,
          followUp,
          read: false,
          actionable: true
        });
      }
    });

    // New clients (last 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    clients.forEach(client => {
      if (new Date(client.createdAt) > sevenDaysAgo) {
        notifications.push({
          id: `new-client-${client.id}`,
          type: 'new_client',
          title: 'New Client Added',
          message: `${client.name} was added to your client list`,
          timestamp: new Date(client.createdAt),
          priority: 'low',
          client,
          read: false,
          actionable: false
        });
      }
    });

    // Sort by priority and timestamp
    return notifications.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  };

  const allNotifications = generateNotifications();

  const filteredNotifications = allNotifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'high') return notification.priority === 'high';
    return true;
  });

  const unreadCount = allNotifications.filter(n => !n.read).length;
  const highPriorityCount = allNotifications.filter(n => n.priority === 'high').length;

  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'overdue':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'due_today':
        return <Clock className="w-4 h-4 text-orange-500" />;
      case 'due_tomorrow':
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'new_client':
        return <User className="w-4 h-4 text-green-500" />;
      case 'follow_up_completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: NotificationItem['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 bg-black bg-opacity-50">
      <Card className="w-full max-w-md max-h-[80vh] overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BellRing className="w-5 h-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2 px-2 py-1">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Filter buttons */}
          <div className="flex items-center gap-2 mt-4">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All ({allNotifications.length})
            </Button>
            <Button
              variant={filter === 'unread' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('unread')}
            >
              Unread ({unreadCount})
            </Button>
            <Button
              variant={filter === 'high' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('high')}
            >
              High ({highPriorityCount})
            </Button>
          </div>

          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="w-full mt-2"
            >
              Mark all as read
            </Button>
          )}
        </CardHeader>

        <CardContent className="overflow-y-auto max-h-96">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border transition-all duration-200 cursor-pointer hover:bg-gray-50 ${
                    notification.read ? 'bg-white' : 'bg-blue-50 border-blue-200'
                  }`}
                  onClick={() => {
                    markAsRead(notification.id);
                    onNotificationClick?.(notification);
                  }}
                >
                  <div className="flex items-start gap-3">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{notification.title}</p>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${getPriorityColor(notification.priority)}`}
                        >
                          {notification.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}