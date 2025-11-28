import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type User, type LoginData, type RegisterData } from "@shared/schema";

interface AuthHook {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  loginMutation: ReturnType<typeof useMutation>;
  registerMutation: ReturnType<typeof useMutation>;
  logoutMutation: ReturnType<typeof useMutation>;
}

export function useAuth(): AuthHook {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get current user
  const { data: user, isLoading, refetch, error } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      try {
        console.log('Making auth request to:', '/api/auth/me');
        console.log('Current cookies:', document.cookie);
        
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        console.log('Auth response status:', response.status);
        console.log('Auth response headers:', Object.fromEntries(response.headers.entries()));
        
        if (response.status === 401) {
          console.log('Auth returned 401, user not authenticated');
          return null;
        }
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const userData = await response.json();
        console.log('Auth response data:', userData);
        return userData;
      } catch (err) {
        console.error('Auth query error:', err);
        return null;
      }
    },
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
  });

  // Debug logging (remove in production)
  // console.log('useAuth state:', { user, isLoading, isAuthenticated: !!user, error });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      const userData = await response.json();
      return userData;
    },
    onSuccess: async (userData) => {
      console.log('Login success, user data:', userData);
      console.log('Cookies after login:', document.cookie);
      
      // Set user data in cache immediately
      queryClient.setQueryData(['/api/auth/me'], userData);
      
      // Wait a bit for cookies to be set
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log('Cookies after wait:', document.cookie);
      
      // Refetch to ensure UI updates
      const refetchResult = await refetch();
      console.log('After refetch, user data:', refetchResult.data);
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
    },
    onError: (error: any) => {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      return response.json();
    },
    onSuccess: async (userData) => {
      // Set user data in cache immediately
      queryClient.setQueryData(['/api/auth/me'], userData);
      // Force refetch to ensure UI updates
      await refetch();
      toast({
        title: "Account created!",
        description: "Welcome to the HR CRM Suite.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/auth/logout", {});
    },
    onSuccess: () => {
      queryClient.setQueryData(['/api/auth/me'], null);
      queryClient.clear();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Logout failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    user: user || null,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    loginMutation,
    registerMutation,
    logoutMutation,
  };
}