import React, { useState } from "react";
import { useLocation } from "wouter";
import ClientSearchAutocomplete from "@/components/client-search-autocomplete";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, X } from "lucide-react";
import type { Client } from "@shared/schema";

interface GlobalSearchToolbarProps {
  className?: string;
  onClose?: () => void;
}

export default function GlobalSearchToolbar({ className = "", onClose }: GlobalSearchToolbarProps) {
  const [, navigate] = useLocation();

  const handleClientSelect = (client: Client) => {
    // Navigate to client details page or show client info
    navigate(`/clients?selected=${client.id}`);
    onClose?.();
  };

  return (
    <Card className={`p-4 shadow-lg border-2 ${className}`}>
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <ClientSearchAutocomplete
            onClientSelect={handleClientSelect}
            placeholder="Quick search clients by name, email, or company..."
            className="w-full"
          />
        </div>
        {onClose && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onClose}
            className="flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </Card>
  );
}

// Hook to add global search toolbar to any page
export function useGlobalSearch() {
  const [showSearch, setShowSearch] = useState(false);

  const toggleSearch = () => setShowSearch(!showSearch);
  const hideSearch = () => setShowSearch(false);

  return {
    showSearch,
    toggleSearch,
    hideSearch,
    SearchToolbar: showSearch ? (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl px-4">
        <GlobalSearchToolbar onClose={hideSearch} />
      </div>
    ) : null
  };
}