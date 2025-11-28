import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  MessageCircle, 
  Phone, 
  Mail, 
  Calendar, 
  FileText, 
  Users, 
  Plus,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  Send,
  X,
  Filter,
  Search,
  Download,
  Eye
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import type { Client, Interaction, InsertInteraction } from "@shared/schema";

interface CommunicationTrackerProps {
  clientId?: number;
  isOpen: boolean;
  onClose: () => void;
}

interface CommunicationFormData {
  type: string;
  notes: string;
  clientId: number;
}

export default function CommunicationTracker({ clientId, isOpen, onClose }: CommunicationTrackerProps) {
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [formData, setFormData] = useState<CommunicationFormData>({
    type: "email",
    notes: "",
    clientId: clientId || 0
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: interactions = [], isLoading } = useQuery<Interaction[]>({
    queryKey: clientId ? ["/api/interactions/client", clientId] : ["/api/interactions"],
    enabled: isOpen,
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertInteraction) => apiRequest("POST", "/api/interactions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/interactions"] });
      if (clientId) {
        queryClient.invalidateQueries({ queryKey: ["/api/interactions/client", clientId] });
      }
      toast({
        title: "Success",
        description: "Communication logged successfully",
      });
      setShowForm(false);
      setFormData({ type: "email", notes: "", clientId: clientId || 0 });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to log communication",
        variant: "destructive",
      });
    },
  });

  const clientMap = new Map(clients.map(c => [c.id, c]));

  const getFilteredInteractions = () => {
    let filtered = interactions;

    if (filterType !== "all") {
      filtered = filtered.filter(i => i.type === filterType);
    }

    if (searchQuery) {
      filtered = filtered.filter(interaction => {
        const client = clientMap.get(interaction.clientId);
        return interaction.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
               client?.name.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "call": return <Phone className="w-4 h-4" />;
      case "email": return <Mail className="w-4 h-4" />;
      case "meeting": return <Calendar className="w-4 h-4" />;
      case "note": return <FileText className="w-4 h-4" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "call": return "bg-blue-100 text-blue-800";
      case "email": return "bg-green-100 text-green-800";
      case "meeting": return "bg-purple-100 text-purple-800";
      case "note": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.notes.trim()) {
      toast({
        title: "Error",
        description: "Please enter communication notes",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(formData);
  };

  const filteredInteractions = getFilteredInteractions();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Communication Tracker
              {clientId && (
                <Badge variant="secondary" className="ml-2">
                  {clientMap.get(clientId)?.name}
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowForm(true)}
                className="bg-green-600 hover:bg-green-700"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Log Communication
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="h-[70vh] overflow-y-auto">
            {/* Form Section */}
            {showForm && (
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Communication Type</Label>
                      <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="call">Phone Call</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="meeting">Meeting</SelectItem>
                          <SelectItem value="note">Note</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {!clientId && (
                      <div className="space-y-2">
                        <Label htmlFor="client">Client</Label>
                        <Select value={formData.clientId.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, clientId: parseInt(value) }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select client" />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.map(client => (
                              <SelectItem key={client.id} value={client.id.toString()}>
                                {client.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Enter details about this communication..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {createMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Logging...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Log Communication
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Filters Section */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search communications..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="call">Phone Calls</SelectItem>
                      <SelectItem value="email">Emails</SelectItem>
                      <SelectItem value="meeting">Meetings</SelectItem>
                      <SelectItem value="note">Notes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">
                    {filteredInteractions.length} interactions
                  </Badge>
                </div>
              </div>
            </div>

            {/* Interactions List */}
            <div className="p-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-gray-200 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : filteredInteractions.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No communications yet
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Start logging client communications to track your interactions
                  </p>
                  <Button
                    onClick={() => setShowForm(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Log First Communication
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredInteractions.map((interaction) => {
                    const client = clientMap.get(interaction.clientId);
                    return (
                      <Card key={interaction.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={client?.name} />
                                  <AvatarFallback>
                                    {client ? getInitials(client.name) : "?"}
                                  </AvatarFallback>
                                </Avatar>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Badge className={getTypeColor(interaction.type)}>
                                    {getTypeIcon(interaction.type)}
                                    <span className="ml-1 capitalize">{interaction.type}</span>
                                  </Badge>
                                  <span className="text-sm text-gray-500">
                                    with {client?.name || 'Unknown Client'}
                                  </span>
                                </div>
                                <p className="text-gray-700 mb-2">{interaction.notes}</p>
                                <div className="flex items-center space-x-2 text-sm text-gray-500">
                                  <Clock className="w-4 h-4" />
                                  <span>{format(new Date(interaction.createdAt), 'MMM d, yyyy h:mm a')}</span>
                                  <span>({formatDistanceToNow(new Date(interaction.createdAt), { addSuffix: true })})</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}