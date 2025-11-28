import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnhancedCard, EnhancedCardContent, EnhancedCardHeader, EnhancedCardTitle } from "@/components/enhanced-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  DollarSign, 
  Users, 
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react";
import { format, subDays, isWithinInterval } from "date-fns";
import type { Client, FollowUp, Interaction } from "@shared/schema";

interface DashboardWidgetsProps {
  className?: string;
}

interface WidgetData {
  clients: Client[];
  followUps: FollowUp[];
  interactions: Interaction[];
}

export default function DashboardWidgets({ className }: DashboardWidgetsProps) {
  const { data: clients = [], isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: followUps = [], isLoading: followUpsLoading } = useQuery<FollowUp[]>({
    queryKey: ["/api/follow-ups"],
  });

  const { data: interactions = [], isLoading: interactionsLoading } = useQuery<Interaction[]>({
    queryKey: ["/api/interactions"],
  });

  const isLoading = clientsLoading || followUpsLoading || interactionsLoading;

  // Calculate metrics
  const calculateMetrics = () => {
    const now = new Date();
    const sevenDaysAgo = subDays(now, 7);
    const thirtyDaysAgo = subDays(now, 30);

    // Client metrics
    const totalClients = clients.length;
    const activeClients = clients.filter(c => c.status === 'active').length;
    const newClientsThisWeek = clients.filter(c => 
      isWithinInterval(new Date(c.createdAt), { start: sevenDaysAgo, end: now })
    ).length;
    const newClientsThisMonth = clients.filter(c => 
      isWithinInterval(new Date(c.createdAt), { start: thirtyDaysAgo, end: now })
    ).length;

    // Follow-up metrics
    const totalFollowUps = followUps.length;
    const pendingFollowUps = followUps.filter(f => f.status === 'pending').length;
    const completedFollowUps = followUps.filter(f => f.status === 'completed').length;
    const overdueFollowUps = followUps.filter(f => 
      f.status === 'pending' && new Date(f.dueDate) < now
    ).length;

    // Interaction metrics
    const totalInteractions = interactions.length;
    const interactionsThisWeek = interactions.filter(i => 
      isWithinInterval(new Date(i.createdAt), { start: sevenDaysAgo, end: now })
    ).length;
    const interactionsThisMonth = interactions.filter(i => 
      isWithinInterval(new Date(i.createdAt), { start: thirtyDaysAgo, end: now })
    ).length;

    // Completion rate
    const completionRate = totalFollowUps > 0 ? (completedFollowUps / totalFollowUps) * 100 : 0;

    return {
      totalClients,
      activeClients,
      newClientsThisWeek,
      newClientsThisMonth,
      totalFollowUps,
      pendingFollowUps,
      completedFollowUps,
      overdueFollowUps,
      totalInteractions,
      interactionsThisWeek,
      interactionsThisMonth,
      completionRate
    };
  };

  const metrics = calculateMetrics();

  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
        {[...Array(6)].map((_, i) => (
          <EnhancedCard key={i}>
            <EnhancedCardHeader>
              <Skeleton className="h-4 w-32" />
            </EnhancedCardHeader>
            <EnhancedCardContent>
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-3 w-24" />
            </EnhancedCardContent>
          </EnhancedCard>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {/* Client Growth Widget - Clickable to navigate to clients page */}
      <EnhancedCard 
        hover 
        variant="success" 
        className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
        onClick={() => window.location.href = '/clients'}
      >
        <EnhancedCardHeader>
          <EnhancedCardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-500" />
            Client Growth
          </EnhancedCardTitle>
        </EnhancedCardHeader>
        <EnhancedCardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-foreground">{metrics.totalClients}</span>
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                <TrendingUp className="w-3 h-3 mr-1" />
                {metrics.newClientsThisWeek} this week
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {metrics.newClientsThisMonth} new clients this month
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-muted rounded-full h-2">
                <div 
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((metrics.activeClients / metrics.totalClients) * 100, 100)}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                {metrics.activeClients} active
              </span>
            </div>
          </div>
        </EnhancedCardContent>
      </EnhancedCard>

      {/* Follow-up Performance Widget - Clickable to navigate to follow-ups page */}
      <EnhancedCard 
        hover 
        variant="info"
        className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
        onClick={() => window.location.href = '/follow-ups'}
      >
        <EnhancedCardHeader>
          <EnhancedCardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-500" />
            Follow-up Performance
          </EnhancedCardTitle>
        </EnhancedCardHeader>
        <EnhancedCardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-foreground">
                {metrics.completionRate.toFixed(1)}%
              </span>
              <Badge 
                className={metrics.overdueFollowUps > 0 
                  ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" 
                  : "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
                }
              >
                {metrics.overdueFollowUps > 0 ? (
                  <>
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {metrics.overdueFollowUps} overdue
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    On track
                  </>
                )}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {metrics.pendingFollowUps} pending • {metrics.completedFollowUps} completed
            </p>
            <Progress value={metrics.completionRate} className="h-2" />
          </div>
        </EnhancedCardContent>
      </EnhancedCard>

      {/* Activity Widget - Clickable to view interactions */}
      <EnhancedCard 
        hover 
        variant="warning"
        className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
        onClick={() => {
          // Trigger communication tracker or navigate to interactions
          window.location.href = '/interactions';
        }}
      >
        <EnhancedCardHeader>
          <EnhancedCardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-500" />
            Activity This Week
          </EnhancedCardTitle>
        </EnhancedCardHeader>
        <EnhancedCardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-foreground">{metrics.interactionsThisWeek}</span>
              <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                <TrendingUp className="w-3 h-3 mr-1" />
                Interactions
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {metrics.interactionsThisMonth} interactions this month
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Total: {metrics.totalInteractions}</span>
              <span>•</span>
              <span>Avg: {Math.round(metrics.interactionsThisMonth / 30)} daily</span>
            </div>
          </div>
        </EnhancedCardContent>
      </EnhancedCard>

      {/* Priority Clients Widget - Clickable to filter priority clients */}
      <EnhancedCard 
        hover
        className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
        onClick={() => {
          // Navigate to clients page with priority filter
          window.location.href = '/clients?priority=high';
        }}
      >
        <EnhancedCardHeader>
          <EnhancedCardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            Priority Clients
          </EnhancedCardTitle>
        </EnhancedCardHeader>
        <EnhancedCardContent>
          <div className="space-y-3">
            {clients.filter(c => c.priority === 'urgent' || c.priority === 'high').slice(0, 3).map(client => (
              <div key={client.id} className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border">
                <div>
                  <p className="font-medium text-sm text-foreground">{client.name}</p>
                  <p className="text-xs text-muted-foreground">{client.company}</p>
                </div>
                <Badge 
                  className={client.priority === 'urgent' 
                    ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' 
                    : 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20'
                  }
                >
                  {client.priority}
                </Badge>
              </div>
            ))}
            {clients.filter(c => c.priority === 'urgent' || c.priority === 'high').length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No priority clients</p>
            )}
          </div>
        </EnhancedCardContent>
      </EnhancedCard>

      {/* Upcoming Follow-ups Widget - Clickable to view follow-ups */}
      <EnhancedCard 
        hover
        className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
        onClick={() => window.location.href = '/follow-ups'}
      >
        <EnhancedCardHeader>
          <EnhancedCardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            Upcoming Follow-ups
          </EnhancedCardTitle>
        </EnhancedCardHeader>
        <EnhancedCardContent>
          <div className="space-y-3">
            {followUps
              .filter(f => f.status === 'pending' && new Date(f.dueDate) >= new Date())
              .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
              .slice(0, 3)
              .map(followUp => {
                const client = clients.find(c => c.id === followUp.clientId);
                return (
                  <div key={followUp.id} className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border">
                    <div>
                      <p className="font-medium text-sm text-foreground">{client?.name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">{followUp.title}</p>
                    </div>
                    <Badge className="bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20">
                      {format(new Date(followUp.dueDate), 'MMM d')}
                    </Badge>
                  </div>
                );
              })}
            {followUps.filter(f => f.status === 'pending' && new Date(f.dueDate) >= new Date()).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No upcoming follow-ups</p>
            )}
          </div>
        </EnhancedCardContent>
      </EnhancedCard>

      {/* Quick Actions Widget */}
      <EnhancedCard hover>
        <EnhancedCardHeader>
          <EnhancedCardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-500" />
            Quick Actions
          </EnhancedCardTitle>
        </EnhancedCardHeader>
        <EnhancedCardContent>
          <div className="space-y-3">
            <Button variant="outline" size="sm" className="w-full justify-start bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" onClick={() => window.dispatchEvent(new CustomEvent('openQuickClientForm'))}>
              <Users className="w-4 h-4 mr-2" />
              Add New Client
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start bg-green-500/5 hover:bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400" onClick={() => window.dispatchEvent(new CustomEvent('openFollowUpForm'))}>
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Follow-up
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start bg-purple-500/5 hover:bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400" onClick={() => window.dispatchEvent(new CustomEvent('openAdvancedReporting'))}>
              <PieChart className="w-4 h-4 mr-2" />
              View Analytics
            </Button>
          </div>
        </EnhancedCardContent>
      </EnhancedCard>
    </div>
  );
}