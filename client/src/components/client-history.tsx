import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { type Client, type Interaction, type FollowUp } from "@shared/schema";
import { Calendar, Clock, Phone, Mail, User, MessageCircle, CheckCircle, AlertCircle, X } from "lucide-react";
import { format } from "date-fns";

interface ClientHistoryProps {
  client: Client;
  isOpen: boolean;
  onClose: () => void;
}

interface TimelineEvent {
  id: string;
  type: 'interaction' | 'follow_up' | 'client_created';
  date: Date;
  title: string;
  description: string;
  status?: string;
  icon: React.ReactNode;
  color: string;
}

export default function ClientHistory({ client, isOpen, onClose }: ClientHistoryProps) {
  const { data: interactions = [] } = useQuery({
    queryKey: ['/api/interactions/client', client.id],
    enabled: isOpen,
  });

  const { data: followUps = [] } = useQuery({
    queryKey: ['/api/follow-ups/client', client.id],
    enabled: isOpen,
  });

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="w-4 h-4" />;
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'meeting':
        return <User className="w-4 h-4" />;
      default:
        return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getFollowUpIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
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

  // Create timeline events from interactions and follow-ups
  const timelineEvents: TimelineEvent[] = [
    // Client creation event
    {
      id: 'client-created',
      type: 'client_created',
      date: new Date(client.createdAt),
      title: 'Client Added',
      description: 'Client was added to the system',
      icon: <User className="w-4 h-4" />,
      color: 'bg-blue-100 text-blue-800',
    },
    // Interaction events
    ...interactions.map((interaction: Interaction) => ({
      id: `interaction-${interaction.id}`,
      type: 'interaction' as const,
      date: new Date(interaction.createdAt),
      title: `${interaction.type.charAt(0).toUpperCase() + interaction.type.slice(1)} Interaction`,
      description: interaction.notes,
      icon: getInteractionIcon(interaction.type),
      color: 'bg-green-100 text-green-800',
    })),
    // Follow-up events
    ...followUps.map((followUp: FollowUp) => ({
      id: `followup-${followUp.id}`,
      type: 'follow_up' as const,
      date: new Date(followUp.dueDate),
      title: followUp.title,
      description: followUp.description || 'No description provided',
      status: followUp.status,
      icon: getFollowUpIcon(followUp.status),
      color: getStatusColor(followUp.status),
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Client History - {client.name}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Client Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Client Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{client.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Company</p>
                  <p className="font-medium">{client.company || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge className={getStatusColor(client.status)}>
                    {client.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Priority</p>
                  <Badge className={getPriorityColor(client.priority)}>
                    {client.priority}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Category</p>
                  <p className="font-medium">{client.category || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Source</p>
                  <p className="font-medium">{client.source || 'N/A'}</p>
                </div>
              </div>
              {client.tags && client.tags.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {client.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {timelineEvents.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No activity recorded yet</p>
              ) : (
                <div className="space-y-4">
                  {timelineEvents.map((event, index) => (
                    <div key={event.id} className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`p-2 rounded-full ${event.color}`}>
                          {event.icon}
                        </div>
                        {index < timelineEvents.length - 1 && (
                          <div className="w-px h-8 bg-gray-200 mt-2" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">{event.title}</h4>
                          <div className="flex items-center gap-2">
                            {event.status && (
                              <Badge className={getStatusColor(event.status)}>
                                {event.status}
                              </Badge>
                            )}
                            <span className="text-sm text-gray-500">
                              {format(event.date, 'MMM dd, yyyy')}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {format(event.date, 'h:mm a')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Total Interactions</p>
                    <p className="text-2xl font-bold">{interactions.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-600">Follow-ups</p>
                    <p className="text-2xl font-bold">{followUps.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Completed Tasks</p>
                    <p className="text-2xl font-bold">
                      {followUps.filter((f: FollowUp) => f.status === 'completed').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}