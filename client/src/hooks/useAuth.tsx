import { createContext, useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: "individual" | "corporate";
  userRole: "user" | "admin" | "master_admin";
  company?: string;
  isActive: boolean;
  accountStatus: "trial" | "active" | "expired" | "cancelled";
  trialEndsAt: string;
  trialEmailSent: boolean;
  createdAt: string;
  updatedAt: string;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isMasterAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isAdmin: false,
  isMasterAdmin: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      console.log("Making auth request to:", "/api/auth/me");
      console.log("Current cookies:", document.cookie);
      
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        console.log("Auth response status:", response.status);
        console.log("Auth response headers:", Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          if (response.status === 401) {
            return null;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Auth response data:", data);
        return data;
      } catch (error) {
        console.error("Auth query error:", error);
        throw error;
      }
    },
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('401') || error?.message?.includes('Authentication')) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    if (!isLoading) {
      if (data && !error) {
        setUser(data);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    }
  }, [data, isLoading, error]);

  const isAdmin = user?.userRole === "admin" || user?.userRole === "master_admin";
  const isMasterAdmin = user?.userRole === "master_admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        isAdmin,
        isMasterAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}