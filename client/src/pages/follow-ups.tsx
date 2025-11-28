import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Sidebar from "@/components/sidebar";
import FollowUpForm from "@/components/follow-up-form";
import FollowUpNotifications from "@/components/follow-up-notifications";
import FollowUpCalendar from "@/components/follow-up-calendar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  Check,
  Clock,
  AlertTriangle,
  Calendar,
  User,
  CheckCircle,
  Bell,
  CalendarDays,
  List,
  Filter,
  ArrowLeft,
  Home
} from "lucide-react";
import { Link } from "wouter";
import { format, formatDistanceToNow } from "date-fns";
import type { Client, FollowUp } from "@shared/schema";

export default function FollowUps() {
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("list");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: followUps = [], isLoading } = useQuery<FollowUp[]>({
    queryKey: ["/api/follow-ups"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/follow-ups/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/follow-ups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Follow-up deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete follow-up",
        variant: "destructive",
      });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PUT", `/api/follow-ups/${id}`, { status: "completed" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/follow-ups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Follow-up marked as completed",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update follow-up",
        variant: "destructive",
      });
    },
  });

  const clientMap = new Map(clients.map(c => [c.id, c]));

  const getFilteredFollowUps = () => {
    let filtered = followUps;

    // Filter by tab
    if (activeTab === "pending") {
      filtered = filtered.filter(f => f.status === "pending");
    } else if (activeTab === "completed") {
      filtered = filtered.filter(f => f.status === "completed");
    } else if (activeTab === "overdue") {
      const now = new Date();
      filtered = filtered.filter(f => f.status === "pending" && new Date(f.dueDate) < now);
    }

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(followUp => {
        const client = clientMap.get(followUp.clientId);
        return followUp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
               followUp.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
               client?.name.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(f => f.status === statusFilter);
    }

    return filtered.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  };

  const getFollowUpPriority = (followUp: FollowUp) => {
    const now = new Date();
    const dueDate = new Date(followUp.dueDate);
    const isOverdue = dueDate < now && followUp.status === "pending";
    const isToday = dueDate.toDateString() === now.toDateString() && followUp.status === "pending";
    
    if (isOverdue) return { color: "border-red-200 bg-red-50", textColor: "text-red-600", icon: AlertTriangle };
    if (isToday) return { color: "border-yellow-200 bg-yellow-50", textColor: "text-yellow-600", icon: Clock };
    if (followUp.status === "completed") return { color: "border-green-200 bg-green-50", textColor: "text-green-600", icon: CheckCircle };
    return { color: "border-blue-200 bg-blue-50", textColor: "text-blue-600", icon: Calendar };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-green-100 text-green-800";
      case "overdue": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleEditFollowUp = (followUp: FollowUp) => {
    setSelectedFollowUp(followUp);
    setShowFollowUpForm(true);
  };

  const handleDeleteFollowUp = (id: number) => {
    if (confirm('Are you sure you want to delete this follow-up? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCompleteFollowUp = (id: number) => {
    completeMutation.mutate(id);
  };

  const handleCloseForm = () => {
    setShowFollowUpForm(false);
    setSelectedFollowUp(undefined);
  };

  const filteredFollowUps = getFilteredFollowUps();
  const pendingCount = followUps.filter(f => f.status === "pending").length;
  const completedCount = followUps.filter(f => f.status === "completed").length;
  const overdueCount = followUps.filter(f => {
    const now = new Date();
    return f.status === "pending" && new Date(f.dueDate) < now;
  }).length;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 p-4 lg:p-6 pt-16 lg:pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
              </Link>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Follow-ups</h2>
                <p className="text-gray-600">Track and manage your client follow-ups</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Link href="/clients">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">View Clients</span>
                </Button>
              </Link>
              <Button onClick={() => setShowFollowUpForm(true)} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Schedule Follow-up</span>
                <span className="sm:hidden">Schedule</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Main Navigation Tabs */}
        <div className="bg-white border-b border-gray-200 p-4 lg:p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
              <TabsTrigger value="list" className="text-xs sm:text-sm flex items-center gap-1">
                <List className="w-4 h-4" />
                List View
              </TabsTrigger>
              <TabsTrigger value="notifications" className="text-xs sm:text-sm flex items-center gap-1">
                <Bell className="w-4 h-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="calendar" className="text-xs sm:text-sm flex items-center gap-1">
                <CalendarDays className="w-4 h-4" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs sm:text-sm flex items-center gap-1">
                <Filter className="w-4 h-4" />
                Analytics
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          {/* Filters (only show on list view) */}
          {activeTab === 'list' && (
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search follow-ups..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {activeTab === 'list' && isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Skeleton className="h-3 w-3 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-5 w-48" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : activeTab === 'list' ? (
            <div className="space-y-4">
              {filteredFollowUps.map((followUp) => {
                const client = clientMap.get(followUp.clientId);
                const { color, textColor, icon: Icon } = getFollowUpPriority(followUp);
                
                return (
                  <Card key={followUp.id} className={`${color} border-l-4`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start space-x-4">
                          <div className={`p-2 rounded-full ${followUp.status === 'completed' ? 'bg-green-100' : 'bg-gray-100'}`}>
                            <Icon className={`w-4 h-4 ${textColor}`} />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold text-gray-900">{followUp.title}</h3>
                              <Badge variant="secondary" className={getStatusColor(followUp.status)}>
                                {followUp.status}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                              <div className="flex items-center">
                                <User className="w-4 h-4 mr-1" />
                                {client?.name || 'Unknown Client'}
                              </div>
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {format(new Date(followUp.dueDate), 'MMM d, yyyy h:mm a')}
                              </div>
                            </div>
                            {followUp.description && (
                              <p className="text-gray-700 text-sm">{followUp.description}</p>
                            )}
                            <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                              <span>Created {format(new Date(followUp.createdAt), 'MMM d, yyyy')}</span>
                              {followUp.completedAt && (
                                <span>Completed {format(new Date(followUp.completedAt), 'MMM d, yyyy')}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {followUp.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCompleteFollowUp(followUp.id)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditFollowUp(followUp)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteFollowUp(followUp.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : null}
          
          {activeTab === 'list' && !isLoading && filteredFollowUps.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No follow-ups found</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || statusFilter !== "all" 
                  ? "Try adjusting your search or filter criteria."
                  : "Get started by scheduling your first follow-up."
                }
              </p>
              {!searchQuery && statusFilter === "all" && (
                <Button onClick={() => setShowFollowUpForm(true)} className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule Follow-up
                </Button>
              )}
            </div>
          )}

          {activeTab === 'notifications' && (
            <FollowUpNotifications 
              onFollowUpClick={handleEditFollowUp}
              onClientClick={(client) => {
                // Navigate to client details or show client info
                console.log('Client clicked:', client);
              }}
            />
          )}

          {activeTab === 'calendar' && (
            <FollowUpCalendar 
              onFollowUpClick={handleEditFollowUp}
              onDateClick={(date) => {
                // Pre-fill form with selected date
                setSelectedFollowUp(undefined);
                setShowFollowUpForm(true);
              }}
            />
          )}

          {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Follow-up Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Follow-ups</span>
                      <Badge variant="outline">{followUps.length}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Pending</span>
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                        {followUps.filter(f => f.status === 'pending').length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Overdue</span>
                      <Badge variant="outline" className="bg-red-100 text-red-800">
                        {followUps.filter(f => f.status === 'overdue').length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Completed</span>
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        {followUps.filter(f => f.status === 'completed').length}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Completion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {followUps.length > 0 ? Math.round((followUps.filter(f => f.status === 'completed').length / followUps.length) * 100) : 0}%
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {followUps.filter(f => f.status === 'completed').length} of {followUps.length} completed
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Priority Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['urgent', 'high', 'medium', 'low'].map((priority) => {
                      const count = followUps.filter(f => f.priority === priority).length;
                      const percentage = followUps.length > 0 ? (count / followUps.length) * 100 : 0;
                      
                      return (
                        <div key={priority} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${
                              priority === 'urgent' ? 'bg-red-500' :
                              priority === 'high' ? 'bg-orange-500' :
                              priority === 'medium' ? 'bg-blue-500' : 'bg-gray-500'
                            }`}></div>
                            <span className="text-sm capitalize">{priority}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 h-2 bg-gray-200 rounded-full">
                              <div 
                                className={`h-2 rounded-full ${
                                  priority === 'urgent' ? 'bg-red-500' :
                                  priority === 'high' ? 'bg-orange-500' :
                                  priority === 'medium' ? 'bg-blue-500' : 'bg-gray-500'
                                }`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* Modal */}
      {showFollowUpForm && (
        <FollowUpForm 
          followUp={selectedFollowUp}
          onClose={handleCloseForm} 
        />
      )}
    </div>
  );
}
