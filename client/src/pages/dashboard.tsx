import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, memo, useMemo } from "react";
import { useDashboardQuery, useFollowUpQuery } from "@/hooks/useOptimizedQuery";
import { DashboardStatSkeleton, FollowUpCardSkeleton, Skeleton } from "@/components/ui/optimized-skeleton";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import OptimizedClientCard from "@/components/optimized-client-card";
import Sidebar from "@/components/sidebar";
import ClientForm from "@/components/client-form";
import QuickClientForm from "@/components/quick-client-form";
import FollowUpForm from "@/components/follow-up-form";
import AdvancedReporting from "@/components/advanced-reporting";
import DashboardWidgets from "@/components/dashboard-widgets";
import NotificationCenter from "@/components/notification-center";
import ClientHistory from "@/components/client-history";
import ClientSearchAutocomplete from "@/components/client-search-autocomplete";
import EmailComposer from "@/components/email-composer";
import { TrialBanner } from "@/components/trial-banner";
import { 
  Users, 
  Clock, 
  CheckCircle, 
  UserPlus, 
  Plus, 
  CalendarPlus,
  Search,
  Edit,
  History,
  Calendar,
  AlertTriangle,
  Check,
  ArrowRight,
  Download,
  BarChart3,
  ListTodo,
  Bell,
  BellRing,
  Mail
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import type { Client, FollowUp } from "@shared/schema";

interface DashboardStats {
  totalClients: number;
  pendingFollowups: number;
  completedThisWeek: number;
  newThisMonth: number;
  overdueFollowups: number;
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const [showClientForm, setShowClientForm] = useState(false);
  const [showQuickClientForm, setShowQuickClientForm] = useState(false);
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [showAdvancedReporting, setShowAdvancedReporting] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedClientForFollowUp, setSelectedClientForFollowUp] = useState<Client | null>(null);
  const [clientHistory, setClientHistory] = useState<Client | null>(null);
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [selectedClientForEmail, setSelectedClientForEmail] = useState<Client | null>(null);

  // Listen for custom events from dashboard widgets
  useEffect(() => {
    const handleOpenQuickClientForm = () => setShowQuickClientForm(true);
    const handleOpenFollowUpForm = () => {
      setSelectedClientForFollowUp(null);
      setShowFollowUpForm(true);
    };
    const handleOpenAdvancedReporting = () => setShowAdvancedReporting(true);

    window.addEventListener('openQuickClientForm', handleOpenQuickClientForm);
    window.addEventListener('openFollowUpForm', handleOpenFollowUpForm);
    window.addEventListener('openAdvancedReporting', handleOpenAdvancedReporting);

    return () => {
      window.removeEventListener('openQuickClientForm', handleOpenQuickClientForm);
      window.removeEventListener('openFollowUpForm', handleOpenFollowUpForm);
      window.removeEventListener('openAdvancedReporting', handleOpenAdvancedReporting);
    };
  }, []);

  // Fetch dashboard stats with optimized caching
  const { data: stats, isLoading: statsLoading } = useDashboardQuery<DashboardStats>(
    ["/api/dashboard/stats"]
  );

  const { data: clients = [], isLoading: clientsLoading } = useDashboardQuery<Client[]>(
    ["/api/clients"]
  );

  const { data: upcomingFollowUps = [], isLoading: followUpsLoading } = useFollowUpQuery<FollowUp[]>(
    ["/api/follow-ups/upcoming"]
  );

  const { data: overdueFollowUps = [] } = useFollowUpQuery<FollowUp[]>(
    ["/api/follow-ups/overdue"]
  );

  // Memoized computed values for better performance
  const recentClients = useMemo(() => clients.slice(0, 5), [clients]);
  const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c])), [clients]);

  // Optimized client filtering with memoization
  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;
    const query = searchQuery.toLowerCase();
    return clients.filter(client => 
      client.name.toLowerCase().includes(query) ||
      client.email.toLowerCase().includes(query) ||
      (client.company && client.company.toLowerCase().includes(query))
    );
  }, [clients, searchQuery]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "inactive": return "bg-gray-100 text-gray-800";
      case "follow-up-needed": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Memoized priority calculation to avoid recalculating on every render
  const getFollowUpPriority = useMemo(() => {
    const now = new Date();
    return (followUp: FollowUp) => {
      const dueDate = new Date(followUp.dueDate);
      const isOverdue = dueDate < now;
      const isToday = dueDate.toDateString() === now.toDateString();
      
      if (isOverdue) return { color: "bg-red-50 border-red-200", priority: "overdue", icon: AlertTriangle };
      if (isToday) return { color: "bg-yellow-50 border-yellow-200", priority: "today", icon: Clock };
      return { color: "bg-slate-50 border-slate-200", priority: "upcoming", icon: Calendar };
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 p-3 sm:p-4 lg:p-6 pt-14 sm:pt-16 lg:pt-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 sm:space-y-4 lg:space-y-0">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Dashboard</h2>
              <p className="text-sm sm:text-base text-gray-600">Manage your client relationships and follow-ups</p>
            </div>
            <div className="flex flex-col space-y-3">
              {/* Search bar - full width on mobile */}
              <div className="w-full">
                <ClientSearchAutocomplete
                  onClientSelect={(client) => {
                    navigate(`/clients?selected=${client.id}`);
                  }}
                  onClientEmail={(client) => {
                    setSelectedClientForEmail(client);
                    setShowEmailComposer(true);
                  }}
                  placeholder="Quick client search..."
                  className="w-full"
                />
              </div>
              
              {/* Action buttons - responsive grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:flex sm:space-x-2">
                <Button onClick={() => setShowNotificationCenter(true)} variant="outline" className="relative text-xs sm:text-sm">
                  <Bell className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Notifications</span>
                  <span className="sm:hidden ml-1">Alerts</span>
                </Button>
                <Button onClick={() => setShowAdvancedReporting(true)} variant="outline" className="text-xs sm:text-sm">
                  <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Advanced Reports</span>
                  <span className="sm:hidden ml-1">Reports</span>
                </Button>
                <Button onClick={() => setShowQuickClientForm(true)} className="bg-emerald-600 hover:bg-emerald-700 text-xs sm:text-sm">
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Add Client</span>
                  <span className="sm:hidden ml-1">Client</span>
                </Button>
                <Button onClick={() => setShowFollowUpForm(true)} className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm">
                  <CalendarPlus className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Schedule Follow-up</span>
                  <span className="sm:hidden ml-1">Follow-up</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
          {/* Trial Banner */}
          <div className="mb-4 sm:mb-6">
            <TrialBanner />
          </div>
          
          {/* Enhanced Dashboard Widgets */}
          <DashboardWidgets className="mb-4 sm:mb-6 lg:mb-8" />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {/* Recent Clients */}
            <Card className="lg:col-span-2">
              <CardHeader className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base sm:text-lg">Recent Clients</CardTitle>
                  <Link href="/clients">
                    <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
                      <span className="hidden sm:inline">View All</span>
                      <span className="sm:hidden">All</span>
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {clientsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <DashboardStatSkeleton key={i} />
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 text-sm font-medium text-gray-500">Client</th>
                          <th className="text-left py-3 text-sm font-medium text-gray-500">Company</th>
                          <th className="text-left py-3 text-sm font-medium text-gray-500">Status</th>
                          <th className="text-left py-3 text-sm font-medium text-gray-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(searchQuery ? filteredClients.slice(0, 10) : recentClients).map((client) => (
                          <tr key={client.id} className="border-b hover:bg-gray-50">
                            <td className="py-3">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-slate-600 text-white rounded-full flex items-center justify-center font-medium text-sm">
                                  {getInitials(client.name)}
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900">{client.name}</div>
                                  <div className="text-sm text-gray-500">{client.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 text-sm text-gray-900">{client.company || '-'}</td>
                            <td className="py-3">
                              <Badge variant="secondary" className={getStatusColor(client.status)}>
                                {client.status.replace('-', ' ')}
                              </Badge>
                            </td>
                            <td className="py-3">
                              <div className="flex space-x-2">
                                <Button variant="ghost" size="sm" onClick={() => setEditingClient(client)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setSelectedClientForFollowUp(client)}>
                                  <CalendarPlus className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setClientHistory(client)}>
                                  <History className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => {
                                  setSelectedClientForEmail(client);
                                  setShowEmailComposer(true);
                                }} title="Send Email">
                                  <Mail className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Follow-ups */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Follow-ups</CardTitle>
              </CardHeader>
              <CardContent>
                {followUpsLoading ? (
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex items-start space-x-3">
                        <Skeleton className="h-3 w-3 rounded-full mt-2" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-32" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[...overdueFollowUps, ...upcomingFollowUps].slice(0, 6).map((followUp) => {
                      const client = clientMap.get(followUp.clientId);
                      const { color, priority, icon: Icon } = getFollowUpPriority(followUp);
                      
                      return (
                        <div key={followUp.id} className={`flex items-start space-x-3 p-3 rounded-lg border ${color}`}>
                          <div className={`w-3 h-3 rounded-full mt-2 ${priority === 'overdue' ? 'bg-red-500' : priority === 'today' ? 'bg-yellow-500' : 'bg-slate-500'}`} />
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">{client?.name || 'Unknown Client'}</p>
                            <p className="text-sm text-gray-600">{followUp.title}</p>
                            <p className={`text-xs font-medium mt-1 ${priority === 'overdue' ? 'text-red-600' : priority === 'today' ? 'text-yellow-600' : 'text-slate-600'}`}>
                              <Icon className="w-3 h-3 inline mr-1" />
                              {priority === 'overdue' 
                                ? `Overdue by ${formatDistanceToNow(new Date(followUp.dueDate))}`
                                : priority === 'today'
                                  ? 'Due today'
                                  : format(new Date(followUp.dueDate), 'MMM d, h:mm a')
                              }
                            </p>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Check className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                    
                    <Link href="/follow-ups">
                      <Button variant="ghost" className="w-full">
                        View All Follow-ups <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/export">
                  <Button variant="outline" className="flex items-center p-4 h-auto border-gray-200 hover:border-slate-600 hover:bg-slate-50 w-full">
                    <div className="p-2 bg-green-100 rounded-lg mr-4">
                      <Download className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-800">Export Data</p>
                      <p className="text-sm text-gray-600">Download CSV or Excel</p>
                    </div>
                  </Button>
                </Link>

                <Button variant="outline" className="flex items-center p-4 h-auto border-gray-200 hover:border-emerald-600 hover:bg-emerald-50" onClick={() => setShowQuickClientForm(true)}>
                  <div className="p-2 bg-emerald-100 rounded-lg mr-4">
                    <UserPlus className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-800">Add New Client</p>
                    <p className="text-sm text-gray-600">Create a new client profile</p>
                  </div>
                </Button>

                <Button variant="outline" className="flex items-center p-4 h-auto border-gray-200 hover:border-green-600 hover:bg-green-50" onClick={() => setShowFollowUpForm(true)}>
                  <div className="p-2 bg-purple-100 rounded-lg mr-4">
                    <CalendarPlus className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-800">Schedule Follow-up</p>
                    <p className="text-sm text-gray-600">Set up follow-up reminders</p>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Modals */}
      {showClientForm && (
        <ClientForm onClose={() => setShowClientForm(false)} />
      )}
      {showQuickClientForm && (
        <QuickClientForm onClose={() => setShowQuickClientForm(false)} />
      )}
      {showFollowUpForm && (
        <FollowUpForm 
          clientId={selectedClientForFollowUp?.id} 
          onClose={() => {
            setShowFollowUpForm(false);
            setSelectedClientForFollowUp(null);
          }} 
        />
      )}
      {editingClient && (
        <ClientForm 
          client={editingClient} 
          onClose={() => setEditingClient(null)} 
        />
      )}
      {clientHistory && (
        <ClientHistory 
          client={clientHistory}
          isOpen={!!clientHistory}
          onClose={() => setClientHistory(null)}
        />
      )}
      {showAdvancedReporting && (
        <AdvancedReporting 
          isOpen={showAdvancedReporting}
          onClose={() => setShowAdvancedReporting(false)} 
        />
      )}
      {showNotificationCenter && (
        <NotificationCenter 
          isOpen={showNotificationCenter}
          onClose={() => setShowNotificationCenter(false)}
          onNotificationClick={(notification) => {
            // Handle notification click - could open relevant forms or pages
            setShowNotificationCenter(false);
          }}
        />
      )}
      {showEmailComposer && selectedClientForEmail && (
        <EmailComposer
          client={selectedClientForEmail}
          isOpen={showEmailComposer}
          onClose={() => {
            setShowEmailComposer(false);
            setSelectedClientForEmail(null);
          }}
        />
      )}
    </div>
  );
}
