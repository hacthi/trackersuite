import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Clock, User, Filter } from "lucide-react";
import { format, isSameDay, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { type FollowUp, type Client } from "@shared/schema";

interface FollowUpCalendarProps {
  onFollowUpClick?: (followUp: FollowUp) => void;
  onDateClick?: (date: Date) => void;
}

export default function FollowUpCalendar({ onFollowUpClick, onDateClick }: FollowUpCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: followUps = [] } = useQuery<FollowUp[]>({
    queryKey: ["/api/follow-ups"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const clientMap = new Map(clients.map(client => [client.id, client]));

  const getFilteredFollowUps = () => {
    return followUps.filter(followUp => {
      if (statusFilter === "all") return true;
      return followUp.status === statusFilter;
    });
  };

  const getFollowUpsForDate = (date: Date) => {
    return getFilteredFollowUps().filter(followUp =>
      isSameDay(new Date(followUp.dueDate), date)
    );
  };

  const getFollowUpsForSelectedDate = () => {
    if (!selectedDate) return [];
    return getFollowUpsForDate(selectedDate);
  };

  const getDaysWithFollowUps = () => {
    const daysWithFollowUps = new Set<string>();
    getFilteredFollowUps().forEach(followUp => {
      daysWithFollowUps.add(format(new Date(followUp.dueDate), 'yyyy-MM-dd'));
    });
    return daysWithFollowUps;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      onDateClick?.(date);
    }
  };

  const daysWithFollowUps = getDaysWithFollowUps();
  const selectedDateFollowUps = getFollowUpsForSelectedDate();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Calendar View */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Follow-up Calendar
            </CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            className="rounded-md border"
            modifiers={{
              hasFollowUps: (date) => daysWithFollowUps.has(format(date, 'yyyy-MM-dd'))
            }}
            modifiersStyles={{
              hasFollowUps: {
                backgroundColor: '#3B82F6',
                color: 'white',
                fontWeight: 'bold'
              }
            }}
          />
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <div className="w-4 h-4 bg-blue-600 rounded"></div>
            <span>Days with follow-ups</span>
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {selectedDate ? format(selectedDate, 'MMMM dd, yyyy') : 'Select a date'}
            {selectedDateFollowUps.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedDateFollowUps.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {selectedDateFollowUps.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm">No follow-ups scheduled for this date</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => onDateClick?.(selectedDate)}
                >
                  Schedule Follow-up
                </Button>
              </div>
            ) : (
              selectedDateFollowUps.map((followUp) => {
                const client = clientMap.get(followUp.clientId);
                return (
                  <div 
                    key={followUp.id}
                    className="p-4 border rounded-lg hover:shadow-sm transition-shadow cursor-pointer"
                    onClick={() => onFollowUpClick?.(followUp)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{followUp.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {client?.name || 'Unknown Client'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(followUp.status)}>
                          {followUp.status}
                        </Badge>
                        {followUp.priority && (
                          <Badge variant="outline" className={getPriorityColor(followUp.priority)}>
                            {followUp.priority}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {followUp.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {followUp.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        {format(new Date(followUp.dueDate), 'h:mm a')}
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                        {followUp.status !== 'completed' && (
                          <Button size="sm">
                            Mark Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}