import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Calendar, Clock, AlertTriangle, CheckCircle, User } from "lucide-react";
import { format, isToday, isTomorrow, isYesterday, isPast } from "date-fns";
import { type FollowUp, type Client } from "@shared/schema";

interface NotificationItem {
  id: string;
  type: 'overdue' | 'due_today' | 'due_tomorrow' | 'upcoming';
  title: string;
  message: string;
  followUp: FollowUp;
  client: Client;
  priority: 'high' | 'medium' | 'low';
  color: string;
  icon: React.ReactNode;
}

interface FollowUpNotificationsProps {
  onFollowUpClick?: (followUp: FollowUp) => void;
  onClientClick?: (client: Client) => void;
  compact?: boolean;
}

export default function FollowUpNotifications({ 
  onFollowUpClick, 
  onClientClick, 
  compact = false 
}: FollowUpNotificationsProps) {
  const { data: followUps = [] } = useQuery<FollowUp[]>({
    queryKey: ["/api/follow-ups"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const clientMap = new Map(clients.map(client => [client.id, client]));

  const getNotifications = (): NotificationItem[] => {
    const notifications: NotificationItem[] = [];
    const now = new Date();

    followUps.forEach(followUp => {
      if (followUp.status === 'completed') return;

      const dueDate = new Date(followUp.dueDate);
      const client = clientMap.get(followUp.clientId);
      
      if (!client) return;

      let notification: NotificationItem;

      if (isPast(dueDate) && !isToday(dueDate)) {
        // Overdue
        notification = {
          id: `overdue-${followUp.id}`,
          type: 'overdue',
          title: 'Overdue Follow-up',
          message: `Follow-up "${followUp.title}" for ${client.name} was due ${format(dueDate, 'MMM dd')}`,
          followUp,
          client,
          priority: 'high',
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: <AlertTriangle className="w-4 h-4 text-red-600" />
        };
      } else if (isToday(dueDate)) {
        // Due today
        notification = {
          id: `today-${followUp.id}`,
          type: 'due_today',
          title: 'Due Today',
          message: `Follow-up "${followUp.title}" for ${client.name} is due today`,
          followUp,
          client,
          priority: 'high',
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          icon: <Clock className="w-4 h-4 text-orange-600" />
        };
      } else if (isTomorrow(dueDate)) {
        // Due tomorrow
        notification = {
          id: `tomorrow-${followUp.id}`,
          type: 'due_tomorrow',
          title: 'Due Tomorrow',
          message: `Follow-up "${followUp.title}" for ${client.name} is due tomorrow`,
          followUp,
          client,
          priority: 'medium',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: <Calendar className="w-4 h-4 text-yellow-600" />
        };
      } else {
        // Upcoming (within 7 days)
        const daysDiff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff <= 7) {
          notification = {
            id: `upcoming-${followUp.id}`,
            type: 'upcoming',
            title: `Due in ${daysDiff} days`,
            message: `Follow-up "${followUp.title}" for ${client.name} is due ${format(dueDate, 'MMM dd')}`,
            followUp,
            client,
            priority: 'low',
            color: 'bg-blue-100 text-blue-800 border-blue-200',
            icon: <Bell className="w-4 h-4 text-blue-600" />
          };
        } else {
          return;
        }
      }

      notifications.push(notification);
    });

    // Sort by priority and due date
    return notifications.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      return new Date(a.followUp.dueDate).getTime() - new Date(b.followUp.dueDate).getTime();
    });
  };

  const notifications = getNotifications();

  if (compact) {
    return (
      <div className="space-y-2">
        {notifications.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <p className="text-sm">No pending follow-ups</p>
          </div>
        ) : (
          notifications.slice(0, 5).map((notification) => (
            <div 
              key={notification.id}
              className={`p-3 rounded-lg border ${notification.color} cursor-pointer hover:shadow-sm transition-shadow`}
              onClick={() => onFollowUpClick?.(notification.followUp)}
            >
              <div className="flex items-start space-x-3">
                {notification.icon}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">
                      {notification.title}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {notification.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {notification.message}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
        {notifications.length > 5 && (
          <div className="text-center">
            <Button variant="ghost" size="sm" className="text-xs">
              View all {notifications.length} notifications
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Follow-up Notifications
          {notifications.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {notifications.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <h3 className="font-medium text-gray-900 mb-2">All caught up!</h3>
                <p className="text-sm">No pending follow-ups or overdue tasks</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`p-4 rounded-lg border ${notification.color} hover:shadow-sm transition-shadow`}
                >
                  <div className="flex items-start space-x-3">
                    {notification.icon}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">
                          {notification.title}
                        </span>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {notification.priority}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {format(new Date(notification.followUp.dueDate), 'MMM dd, h:mm a')}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mb-3">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onClientClick?.(notification.client)}
                          className="text-xs flex items-center gap-1"
                        >
                          <User className="w-3 h-3" />
                          {notification.client.name}
                        </Button>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onFollowUpClick?.(notification.followUp)}
                            className="text-xs"
                          >
                            View
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            className="text-xs"
                          >
                            Mark Complete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}