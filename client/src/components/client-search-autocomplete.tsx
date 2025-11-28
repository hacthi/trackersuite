import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, User, Mail } from "lucide-react";
import type { Client } from "@shared/schema";

interface ClientSearchAutocompleteProps {
  onClientSelect: (client: Client) => void;
  onClientEmail?: (client: Client) => void;
  placeholder?: string;
  className?: string;
}

export default function ClientSearchAutocomplete({ 
  onClientSelect,
  onClientEmail,
  placeholder = "Search clients...",
  className = ""
}: ClientSearchAutocompleteProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch all clients for initial display
  const { data: allClients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  // Fetch search results when there's a query
  const { data: searchResults = [], isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients/search", debouncedQuery],
    enabled: debouncedQuery.trim().length > 0,
    queryFn: async () => {
      const response = await fetch(`/api/clients/search?q=${encodeURIComponent(debouncedQuery)}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error('Search failed');
      }
      return response.json();
    },
  });

  // Show all clients when no search query, otherwise show search results
  const displayedClients = debouncedQuery.trim().length > 0 ? searchResults : allClients.slice(0, 10);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowDropdown(true);
    setHighlightedIndex(-1);
  };

  const handleInputFocus = () => {
    setShowDropdown(true);
  };

  const handleInputBlur = (e: React.FocusEvent) => {
    // Delay hiding dropdown to allow clicking on items
    setTimeout(() => {
      if (!dropdownRef.current?.contains(e.relatedTarget as Node)) {
        setShowDropdown(false);
      }
    }, 150);
  };

  const handleClientSelect = (client: Client) => {
    onClientSelect(client);
    setSearchQuery(client.name);
    setShowDropdown(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || displayedClients.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < displayedClients.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : displayedClients.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < displayedClients.length) {
          handleClientSelect(displayedClients[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        inputRef.current?.blur();
        break;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "prospect": return "bg-blue-100 text-blue-800";
      case "lead": return "bg-purple-100 text-purple-800";
      case "client": return "bg-emerald-100 text-emerald-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-4"
          autoComplete="off"
        />
        {isLoading && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {showDropdown && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-y-auto shadow-lg border">
          {displayedClients.length > 0 ? (
            <div className="py-1">
              {displayedClients.map((client, index) => (
                <div
                  key={client.id}
                  className={`group px-4 py-3 border-b last:border-b-0 hover:bg-gray-50 transition-colors ${
                    index === highlightedIndex ? 'bg-blue-50' : ''
                  }`}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-600 text-white text-xs">
                        {getInitials(client.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleClientSelect(client)}
                    >
                      <div className="font-medium text-gray-900 truncate">
                        {client.name}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {client.email}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {client.company && (
                        <div className="text-xs text-gray-400 truncate max-w-20">
                          {client.company}
                        </div>
                      )}
                      <div className={`px-2 py-1 text-xs rounded-full ${getStatusColor(client.status)}`}>
                        {client.status}
                      </div>
                      {onClientEmail && client.email && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onClientEmail(client);
                            setShowDropdown(false);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-blue-100 rounded text-blue-600"
                          title="Send Email"
                        >
                          <Mail className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-gray-500">
              <User className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <div className="text-sm">
                {searchQuery.trim() ? 'No clients found' : 'No clients available'}
              </div>
              {searchQuery.trim() && (
                <div className="text-xs mt-1">
                  Try adjusting your search terms
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}