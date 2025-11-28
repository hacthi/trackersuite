import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { queryClient } from "@/lib/queryClient";
import { useAuth, AuthProvider } from "@/hooks/useAuth.tsx";
import { ThemeProvider } from "@/hooks/useTheme";
import LandingPage from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Clients from "@/pages/clients";
import FollowUps from "@/pages/follow-ups";
import Interactions from "@/pages/interactions";
import Analytics from "@/pages/analytics";
import Export from "@/pages/export";
import Profile from "@/pages/profile";
import AdminDashboard from "@/pages/admin-dashboard";
import UserJourney from "@/pages/user-journey";
import Auth from "@/pages/auth";
import NotFound from "@/pages/not-found";
import PrivacyPolicy from "@/pages/privacy-policy";
import TermsOfService from "@/pages/terms-of-service";
import Support from "@/pages/support";
import Documentation from "@/pages/documentation";
import VideoTutorials from "@/pages/video-tutorials";
import LiveChat from "@/pages/live-chat";
import FAQ from "@/pages/faq";


function AppRouter() {
  const { isAuthenticated, isLoading, user } = useAuth();

  console.log('AppRouter state:', { isAuthenticated, isLoading, user });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background dark:bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is admin
  const isAdminUser = user && (user.userRole === "admin" || user.userRole === "master_admin");

  // Determine the default dashboard for authenticated users
  const getDefaultDashboard = () => {
    if (!isAuthenticated) return LandingPage;
    return isAdminUser ? AdminDashboard : Dashboard;
  };

  // Return appropriate component based on authentication state
  return (
    <div className="min-h-screen bg-background dark:bg-background">
      <Switch>
        {/* Landing page for unauthenticated users, default dashboard for authenticated */}
        <Route path="/" component={getDefaultDashboard()} />
        <Route path="/landing" component={LandingPage} />
        
        {/* Auth route */}
        <Route path="/auth" component={Auth} />
        
        {/* Protected routes - redirect to auth if not authenticated */}
        <Route path="/dashboard" component={isAuthenticated ? (isAdminUser ? AdminDashboard : Dashboard) : Auth} />
        <Route path="/clients" component={isAuthenticated ? Clients : Auth} />
        <Route path="/follow-ups" component={isAuthenticated ? FollowUps : Auth} />
        <Route path="/interactions" component={isAuthenticated ? Interactions : Auth} />
        <Route path="/analytics" component={isAuthenticated ? Analytics : Auth} />
        <Route path="/export" component={isAuthenticated ? Export : Auth} />
        <Route path="/journey" component={isAuthenticated ? UserJourney : Auth} />
        <Route path="/profile" component={isAuthenticated ? Profile : Auth} />
        <Route path="/admin" component={isAuthenticated ? AdminDashboard : Auth} />
        
        {/* Public pages */}
        <Route path="/privacy-policy" component={PrivacyPolicy} />
        <Route path="/terms-of-service" component={TermsOfService} />
        <Route path="/support" component={Support} />
        <Route path="/documentation" component={Documentation} />
        <Route path="/video-tutorials" component={VideoTutorials} />
        <Route path="/live-chat" component={LiveChat} />
        <Route path="/faq" component={FAQ} />
        
        {/* 404 fallback */}
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <AppRouter />
          <Toaster />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
