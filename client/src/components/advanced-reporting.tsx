import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from "recharts";
import { 
  Download, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar,
  MessageCircle,
  Target,
  Clock,
  CheckCircle,
  AlertTriangle,
  Filter,
  X
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import type { Client, FollowUp, Interaction } from "@shared/schema";

interface AdvancedReportingProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ReportData {
  clients: Client[];
  followUps: FollowUp[];
  interactions: Interaction[];
}

interface MetricCard {
  title: string;
  value: number;
  change: number;
  icon: React.ReactNode;
  color: string;
}

export default function AdvancedReporting({ isOpen, onClose }: AdvancedReportingProps) {
  const [dateRange, setDateRange] = useState("30");
  const [activeTab, setActiveTab] = useState("overview");

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    enabled: isOpen,
  });

  const { data: followUps = [] } = useQuery<FollowUp[]>({
    queryKey: ["/api/follow-ups"],
    enabled: isOpen,
  });

  const { data: interactions = [] } = useQuery<Interaction[]>({
    queryKey: ["/api/interactions"],
    enabled: isOpen,
  });

  const reportData: ReportData = useMemo(() => {
    const days = parseInt(dateRange);
    const cutoffDate = subDays(new Date(), days);
    
    return {
      clients: clients.filter(c => new Date(c.createdAt) >= cutoffDate),
      followUps: followUps.filter(f => new Date(f.createdAt) >= cutoffDate),
      interactions: interactions.filter(i => new Date(i.createdAt) >= cutoffDate)
    };
  }, [clients, followUps, interactions, dateRange]);

  const metrics: MetricCard[] = useMemo(() => {
    const now = new Date();
    const previousPeriod = parseInt(dateRange) * 2;
    const prevCutoff = subDays(now, previousPeriod);
    const currentCutoff = subDays(now, parseInt(dateRange));
    
    const currentClients = clients.filter(c => new Date(c.createdAt) >= currentCutoff);
    const previousClients = clients.filter(c => 
      new Date(c.createdAt) >= prevCutoff && new Date(c.createdAt) < currentCutoff
    );
    
    const currentFollowUps = followUps.filter(f => new Date(f.createdAt) >= currentCutoff);
    const previousFollowUps = followUps.filter(f => 
      new Date(f.createdAt) >= prevCutoff && new Date(f.createdAt) < currentCutoff
    );
    
    const currentInteractions = interactions.filter(i => new Date(i.createdAt) >= currentCutoff);
    const previousInteractions = interactions.filter(i => 
      new Date(i.createdAt) >= prevCutoff && new Date(i.createdAt) < currentCutoff
    );
    
    const completedFollowUps = currentFollowUps.filter(f => f.status === "completed");
    const previousCompleted = previousFollowUps.filter(f => f.status === "completed");
    
    const calcChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };
    
    return [
      {
        title: "New Clients",
        value: currentClients.length,
        change: calcChange(currentClients.length, previousClients.length),
        icon: <Users className="w-5 h-5" />,
        color: "text-blue-600"
      },
      {
        title: "Follow-ups Created",
        value: currentFollowUps.length,
        change: calcChange(currentFollowUps.length, previousFollowUps.length),
        icon: <Calendar className="w-5 h-5" />,
        color: "text-green-600"
      },
      {
        title: "Follow-ups Completed",
        value: completedFollowUps.length,
        change: calcChange(completedFollowUps.length, previousCompleted.length),
        icon: <CheckCircle className="w-5 h-5" />,
        color: "text-purple-600"
      },
      {
        title: "Communications Logged",
        value: currentInteractions.length,
        change: calcChange(currentInteractions.length, previousInteractions.length),
        icon: <MessageCircle className="w-5 h-5" />,
        color: "text-orange-600"
      }
    ];
  }, [clients, followUps, interactions, dateRange]);

  const clientStatusData = useMemo(() => {
    const statusCounts = reportData.clients.reduce((acc, client) => {
      acc[client.status] = (acc[client.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];
    return Object.entries(statusCounts).map(([status, count], index) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      fill: colors[index % colors.length]
    }));
  }, [reportData.clients]);

  const interactionTypeData = useMemo(() => {
    const typeCounts = reportData.interactions.reduce((acc, interaction) => {
      acc[interaction.type] = (acc[interaction.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const colors = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444"];
    return Object.entries(typeCounts).map(([type, count], index) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: count,
      fill: colors[index % colors.length]
    }));
  }, [reportData.interactions]);

  const timelineData = useMemo(() => {
    const days = parseInt(dateRange);
    const timeline = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'MMM dd');
      
      const dayClients = reportData.clients.filter(c => 
        format(new Date(c.createdAt), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
      
      const dayFollowUps = reportData.followUps.filter(f => 
        format(new Date(f.createdAt), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
      
      const dayInteractions = reportData.interactions.filter(i => 
        format(new Date(i.createdAt), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
      
      timeline.push({
        date: dateStr,
        clients: dayClients.length,
        followUps: dayFollowUps.length,
        interactions: dayInteractions.length
      });
    }
    
    return timeline;
  }, [reportData, dateRange]);

  const exportReport = () => {
    // Create a clean data structure without React components or circular references
    const cleanReportContent = {
      generatedAt: new Date().toISOString(),
      dateRange: `${dateRange} days`,
      metrics: {
        totalClients: reportData.clients.length,
        totalFollowUps: reportData.followUps.length,
        totalInteractions: reportData.interactions.length,
        completionRate: reportData.followUps.length > 0 
          ? (reportData.followUps.filter(f => f.status === "completed").length / reportData.followUps.length * 100).toFixed(1)
          : 0
      },
      clientStatusDistribution: clientStatusData.map(item => ({
        name: item.name,
        value: item.value,
        fill: item.fill
      })),
      interactionTypes: interactionTypeData.map(item => ({
        name: item.name,
        value: item.value,
        fill: item.fill
      })),
      timeline: timelineData.map(item => ({
        date: item.date,
        clients: item.clients,
        followUps: item.followUps,
        interactions: item.interactions
      })),
      rawData: {
        clients: reportData.clients.map(client => ({
          id: client.id,
          name: client.name,
          email: client.email,
          phone: client.phone,
          company: client.company,
          status: client.status,
          priority: client.priority,
          notes: client.notes,
          createdAt: client.createdAt,
          updatedAt: client.updatedAt
        })),
        followUps: reportData.followUps.map(followUp => ({
          id: followUp.id,
          title: followUp.title,
          description: followUp.description,
          dueDate: followUp.dueDate,
          status: followUp.status,
          priority: followUp.priority,
          clientId: followUp.clientId,
          createdAt: followUp.createdAt,
          updatedAt: followUp.updatedAt
        })),
        interactions: reportData.interactions.map(interaction => ({
          id: interaction.id,
          type: interaction.type,
          notes: interaction.notes,
          clientId: interaction.clientId,
          createdAt: interaction.createdAt,
          updatedAt: interaction.updatedAt
        }))
      }
    };
    
    const dataStr = JSON.stringify(cleanReportContent, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `hr-crm-report-${format(new Date(), 'yyyy-MM-dd')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-7xl max-h-[90vh] overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Advanced Reporting & Analytics
              </CardTitle>
              <CardDescription>
                Comprehensive insights into your client relationship management
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={exportReport} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="h-[75vh] overflow-y-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 m-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="clients">Client Analytics</TabsTrigger>
                <TabsTrigger value="followups">Follow-up Analytics</TabsTrigger>
                <TabsTrigger value="communications">Communications</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="p-4 space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {metrics.map((metric) => (
                    <Card key={metric.title}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className={metric.color}>
                            {metric.icon}
                          </div>
                          <div className="flex items-center space-x-1">
                            {metric.change > 0 ? (
                              <TrendingUp className="w-4 h-4 text-green-600" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-red-600" />
                            )}
                            <span className={`text-sm ${metric.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {Math.abs(metric.change).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="text-2xl font-bold">{metric.value}</div>
                          <div className="text-sm text-gray-500">{metric.title}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {/* Timeline Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Activity Timeline</CardTitle>
                    <CardDescription>Daily activity overview</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={timelineData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="clients" stackId="1" stroke="#3B82F6" fill="#3B82F6" />
                        <Area type="monotone" dataKey="followUps" stackId="1" stroke="#10B981" fill="#10B981" />
                        <Area type="monotone" dataKey="interactions" stackId="1" stroke="#F59E0B" fill="#F59E0B" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="clients" className="p-4 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Client Status Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Client Status Distribution</CardTitle>
                      <CardDescription>Breakdown by client status</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={clientStatusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: ${value}`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {clientStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  
                  {/* Top Clients */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Clients</CardTitle>
                      <CardDescription>Latest client additions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {reportData.clients.slice(0, 5).map((client) => (
                          <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <div className="font-medium">{client.name}</div>
                              <div className="text-sm text-gray-500">{client.email}</div>
                            </div>
                            <div className="text-right">
                              <Badge variant="secondary">{client.status}</Badge>
                              <div className="text-xs text-gray-500 mt-1">
                                {format(new Date(client.createdAt), 'MMM d')}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="followups" className="p-4 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-green-600">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            {reportData.followUps.filter(f => f.status === "completed").length}
                          </div>
                          <div className="text-sm text-gray-500">Completed</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-yellow-600">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            {reportData.followUps.filter(f => f.status === "pending").length}
                          </div>
                          <div className="text-sm text-gray-500">Pending</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-red-600">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            {reportData.followUps.filter(f => 
                              f.status === "pending" && new Date(f.dueDate) < new Date()
                            ).length}
                          </div>
                          <div className="text-sm text-gray-500">Overdue</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Follow-up Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <div className="text-4xl font-bold text-blue-600">
                        {reportData.followUps.length > 0 
                          ? (reportData.followUps.filter(f => f.status === "completed").length / reportData.followUps.length * 100).toFixed(1)
                          : 0}%
                      </div>
                      <div className="text-gray-500 mt-2">Completion Rate</div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="communications" className="p-4 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Communication Types</CardTitle>
                      <CardDescription>Distribution of interaction types</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={interactionTypeData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#3B82F6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Communications</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {reportData.interactions.slice(0, 5).map((interaction) => {
                          const client = clients.find(c => c.id === interaction.clientId);
                          return (
                            <div key={interaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div>
                                <div className="font-medium">{client?.name || 'Unknown Client'}</div>
                                <div className="text-sm text-gray-500">{interaction.type}</div>
                              </div>
                              <div className="text-xs text-gray-500">
                                {format(new Date(interaction.createdAt), 'MMM d, h:mm a')}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}