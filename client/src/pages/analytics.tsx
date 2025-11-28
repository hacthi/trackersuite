import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Users, 
  TrendingUp, 
  Calendar, 
  MessageCircle,
  Target,
  Clock,
  CheckCircle,
  AlertTriangle,
  Download,
  Filter,
  Calendar as CalendarIcon
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import Sidebar from "@/components/sidebar";
import type { Client, FollowUp, Interaction } from "@shared/schema";

interface AnalyticsData {
  totalClients: number;
  activeClients: number;
  totalInteractions: number;
  totalFollowUps: number;
  completedFollowUps: number;
  overdueFollowUps: number;
  clientsByStatus: Array<{ status: string; count: number; color: string }>;
  clientsByPriority: Array<{ priority: string; count: number; color: string }>;
  clientsByCategory: Array<{ category: string; count: number; color: string }>;
  clientsBySource: Array<{ source: string; count: number; color: string }>;
  interactionsByType: Array<{ type: string; count: number; color: string }>;
  followUpsByStatus: Array<{ status: string; count: number; color: string }>;
  clientGrowthOverTime: Array<{ date: string; clients: number; new: number }>;
  interactionTrends: Array<{ date: string; interactions: number; followUps: number }>;
  conversionFunnel: Array<{ stage: string; count: number; percentage: number }>;
}

export default function Analytics() {
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedTab, setSelectedTab] = useState("overview");

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: followUps = [] } = useQuery<FollowUp[]>({
    queryKey: ["/api/follow-ups"],
  });

  const { data: interactions = [] } = useQuery<Interaction[]>({
    queryKey: ["/api/interactions"],
  });

  // Calculate analytics data
  const getAnalyticsData = (): AnalyticsData => {
    const now = new Date();
    const daysAgo = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    const startDate = subDays(now, daysAgo);

    // Basic metrics
    const totalClients = clients.length;
    const activeClients = clients.filter(c => c.status === "active").length;
    const totalInteractions = interactions.length;
    const totalFollowUps = followUps.length;
    const completedFollowUps = followUps.filter(f => f.status === "completed").length;
    const overdueFollowUps = followUps.filter(f => f.status === "overdue").length;

    // Client distributions
    const statusCounts = clients.reduce((acc, client) => {
      acc[client.status] = (acc[client.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const priorityCounts = clients.reduce((acc, client) => {
      acc[client.priority] = (acc[client.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const categoryCounts = clients.reduce((acc, client) => {
      if (client.category) {
        acc[client.category] = (acc[client.category] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const sourceCounts = clients.reduce((acc, client) => {
      if (client.source) {
        acc[client.source] = (acc[client.source] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const interactionTypeCounts = interactions.reduce((acc, interaction) => {
      acc[interaction.type] = (acc[interaction.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const followUpStatusCounts = followUps.reduce((acc, followUp) => {
      acc[followUp.status] = (acc[followUp.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Color mapping
    const statusColors = {
      active: "#10B981",
      inactive: "#6B7280",
      prospect: "#3B82F6",
      lead: "#8B5CF6",
      client: "#059669",
      archived: "#EF4444"
    };

    const priorityColors = {
      urgent: "#EF4444",
      high: "#F59E0B",
      medium: "#3B82F6",
      low: "#6B7280"
    };

    // Convert to chart data
    const clientsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      color: statusColors[status as keyof typeof statusColors] || "#6B7280"
    }));

    const clientsByPriority = Object.entries(priorityCounts).map(([priority, count]) => ({
      priority,
      count,
      color: priorityColors[priority as keyof typeof priorityColors] || "#6B7280"
    }));

    const clientsByCategory = Object.entries(categoryCounts).map(([category, count]) => ({
      category,
      count,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`
    }));

    const clientsBySource = Object.entries(sourceCounts).map(([source, count]) => ({
      source,
      count,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`
    }));

    const interactionsByType = Object.entries(interactionTypeCounts).map(([type, count]) => ({
      type,
      count,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`
    }));

    const followUpsByStatus = Object.entries(followUpStatusCounts).map(([status, count]) => ({
      status,
      count,
      color: status === "completed" ? "#10B981" : status === "overdue" ? "#EF4444" : "#F59E0B"
    }));

    // Time series data
    const clientGrowthOverTime = [];
    const interactionTrends = [];
    
    for (let i = daysAgo; i >= 0; i--) {
      const date = subDays(now, i);
      const dateStr = format(date, "MMM dd");
      
      const clientsUpToDate = clients.filter(c => new Date(c.createdAt) <= date).length;
      const newClientsOnDate = clients.filter(c => 
        format(new Date(c.createdAt), "MMM dd") === dateStr
      ).length;
      
      const interactionsOnDate = interactions.filter(i => 
        format(new Date(i.createdAt), "MMM dd") === dateStr
      ).length;
      
      const followUpsOnDate = followUps.filter(f => 
        format(new Date(f.createdAt), "MMM dd") === dateStr
      ).length;

      clientGrowthOverTime.push({
        date: dateStr,
        clients: clientsUpToDate,
        new: newClientsOnDate
      });

      interactionTrends.push({
        date: dateStr,
        interactions: interactionsOnDate,
        followUps: followUpsOnDate
      });
    }

    // Conversion funnel
    const prospects = clients.filter(c => c.status === "prospect").length;
    const leads = clients.filter(c => c.status === "lead").length;
    const activeClientsCount = clients.filter(c => c.status === "active").length;
    const clientsCount = clients.filter(c => c.status === "client").length;

    const conversionFunnel = [
      { stage: "Prospects", count: prospects, percentage: 100 },
      { stage: "Leads", count: leads, percentage: prospects ? (leads / prospects) * 100 : 0 },
      { stage: "Active", count: activeClientsCount, percentage: prospects ? (activeClientsCount / prospects) * 100 : 0 },
      { stage: "Clients", count: clientsCount, percentage: prospects ? (clientsCount / prospects) * 100 : 0 }
    ];

    return {
      totalClients,
      activeClients,
      totalInteractions,
      totalFollowUps,
      completedFollowUps,
      overdueFollowUps,
      clientsByStatus,
      clientsByPriority,
      clientsByCategory,
      clientsBySource,
      interactionsByType,
      followUpsByStatus,
      clientGrowthOverTime,
      interactionTrends,
      conversionFunnel
    };
  };

  const analyticsData = getAnalyticsData();

  const MetricCard = ({ title, value, icon: Icon, trend, color = "text-blue-600" }: {
    title: string;
    value: number | string;
    icon: any;
    trend?: { value: number; isPositive: boolean };
    color?: string;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {trend && (
              <div className={`flex items-center mt-1 text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                <TrendingUp className="w-4 h-4 mr-1" />
                {trend.value}%
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full bg-gray-50 ${color}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 p-4 lg:p-6 pt-16 lg:pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h2>
              <p className="text-gray-600">Comprehensive insights into your client relationships</p>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="clients">Clients</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                  title="Total Clients"
                  value={analyticsData.totalClients}
                  icon={Users}
                  color="text-blue-600"
                />
                <MetricCard
                  title="Active Clients"
                  value={analyticsData.activeClients}
                  icon={Target}
                  color="text-green-600"
                />
                <MetricCard
                  title="Total Interactions"
                  value={analyticsData.totalInteractions}
                  icon={MessageCircle}
                  color="text-purple-600"
                />
                <MetricCard
                  title="Follow-ups"
                  value={analyticsData.totalFollowUps}
                  icon={Calendar}
                  color="text-orange-600"
                />
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Client Growth Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={analyticsData.clientGrowthOverTime}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="clients" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Clients by Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={analyticsData.clientsByStatus}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ status, percentage }) => `${status} (${percentage}%)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {analyticsData.clientsByStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Activity Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Activity Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analyticsData.interactionTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="interactions" stroke="#8B5CF6" strokeWidth={2} />
                      <Line type="monotone" dataKey="followUps" stroke="#F59E0B" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="clients" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Clients by Priority</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analyticsData.clientsByPriority}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="priority" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" fill="#3B82F6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Clients by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={analyticsData.clientsByCategory}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                          label={({ category }) => category}
                        >
                          {analyticsData.clientsByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Clients by Source</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analyticsData.clientsBySource}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="source" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" fill="#10B981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Conversion Funnel</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analyticsData.conversionFunnel.map((stage, index) => (
                        <div key={stage.stage} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                              {index + 1}
                            </div>
                            <span className="font-medium">{stage.stage}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${stage.percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600">
                              {stage.count} ({stage.percentage.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                  title="Completed Follow-ups"
                  value={analyticsData.completedFollowUps}
                  icon={CheckCircle}
                  color="text-green-600"
                />
                <MetricCard
                  title="Overdue Follow-ups"
                  value={analyticsData.overdueFollowUps}
                  icon={AlertTriangle}
                  color="text-red-600"
                />
                <MetricCard
                  title="Completion Rate"
                  value={`${analyticsData.totalFollowUps ? ((analyticsData.completedFollowUps / analyticsData.totalFollowUps) * 100).toFixed(1) : 0}%`}
                  icon={Target}
                  color="text-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Follow-ups by Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={analyticsData.followUpsByStatus}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                          label={({ status }) => status}
                        >
                          {analyticsData.followUpsByStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Interactions by Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analyticsData.interactionsByType}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="type" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" fill="#8B5CF6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="trends" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Client Acquisition Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={analyticsData.clientGrowthOverTime}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="new" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Activity Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={analyticsData.interactionTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="interactions" stroke="#8B5CF6" strokeWidth={3} />
                      <Line type="monotone" dataKey="followUps" stroke="#F59E0B" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}