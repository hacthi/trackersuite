import { memo, useCallback } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, History, Calendar } from "lucide-react";
import { format } from "date-fns";
import type { Client } from "@shared/schema";

interface OptimizedClientCardProps {
  client: Client;
  onEdit: (client: Client) => void;
  onScheduleFollowUp: (client: Client) => void;
  onViewHistory: (client: Client) => void;
  getStatusColor: (status: string) => string;
  getInitials: (name: string) => string;
}

// Memoized client card component to prevent unnecessary re-renders
const OptimizedClientCard = memo(({
  client,
  onEdit,
  onScheduleFollowUp,
  onViewHistory,
  getStatusColor,
  getInitials
}: OptimizedClientCardProps) => {
  // Memoized event handlers to prevent child re-renders
  const handleEdit = useCallback(() => onEdit(client), [onEdit, client]);
  const handleScheduleFollowUp = useCallback(() => onScheduleFollowUp(client), [onScheduleFollowUp, client]);
  const handleViewHistory = useCallback(() => onViewHistory(client), [onViewHistory, client]);

  return (
    <Card className="group hover:shadow-md transition-all duration-200 border-gray-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {getInitials(client.name)}
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                {client.name}
              </h3>
              <p className="text-sm text-gray-500">{client.email}</p>
            </div>
          </div>
          <Badge className={getStatusColor(client.status)}>
            {client.status.replace('-', ' ')}
          </Badge>
        </div>
        
        {client.company && (
          <p className="text-sm text-gray-600 mb-2">{client.company}</p>
        )}
        
        {client.notes && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-3">{client.notes}</p>
        )}
        
        <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
          <span>Added {format(new Date(client.createdAt), 'MMM dd, yyyy')}</span>
          {client.phone && <span>{client.phone}</span>}
        </div>
        
        <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="outline"
            onClick={handleEdit}
            className="text-xs"
          >
            <Edit className="w-3 h-3 mr-1" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleScheduleFollowUp}
            className="text-xs"
          >
            <Calendar className="w-3 h-3 mr-1" />
            Follow-up
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleViewHistory}
            className="text-xs"
          >
            <History className="w-3 h-3 mr-1" />
            History
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

OptimizedClientCard.displayName = 'OptimizedClientCard';

export default OptimizedClientCard;