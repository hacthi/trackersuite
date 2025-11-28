import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  BarChart3, 
  Download,
  User,
  Settings,
  Menu,
  X,
  LogOut,
  Shield,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { TrackerSuiteLogo } from "@/components/tracker-suite-logo";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth.tsx";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Follow-ups", href: "/follow-ups", icon: Calendar },
  { name: "Your Journey", href: "/journey", icon: TrendingUp },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Export Data", href: "/export", icon: Download },
  { name: "Profile", href: "/profile", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAdmin } = useAuth();

  // Add admin navigation if user is admin
  const adminNavigation = [
    { name: "Admin Dashboard", href: "/admin", icon: Shield }
  ];

  const allNavigation = isAdmin ? [...navigation, ...adminNavigation] : navigation;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = async () => {
    try {
      // Simple logout by clearing session
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      window.location.href = "/auth";
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = "/auth";
    }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        className="lg:hidden fixed top-4 left-4 z-50 bg-background dark:bg-background shadow-md border"
        variant="outline"
        size="sm"
        onClick={toggleMobileMenu}
      >
        {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </Button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 z-40"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "w-64 bg-card dark:bg-card shadow-lg flex flex-col transition-transform duration-300 ease-in-out border-r border-border",
        "lg:translate-x-0 lg:static lg:z-auto",
        "fixed inset-y-0 left-0 z-50",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo/Brand */}
        <div className="p-3 sm:p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <TrackerSuiteLogo size="sm" mobileSize="xs" animate={true} showText={true} />
            <div className="lg:hidden">
              <ThemeToggle />
            </div>
            <div className="hidden lg:block">
              <ThemeToggle />
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-3 sm:p-4 overflow-y-auto">
          <ul className="space-y-1 sm:space-y-2">
            {allNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              
              return (
                <li key={item.name}>
                  <Link href={item.href}>
                    <div 
                      className={cn(
                        "flex items-center p-2 sm:p-3 rounded-lg font-medium transition-colors cursor-pointer text-sm sm:text-base",
                        isActive 
                          ? "text-foreground bg-accent dark:bg-accent font-semibold" 
                          : "text-foreground hover:bg-accent dark:hover:bg-accent hover:text-accent-foreground"
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 flex-shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        {/* User Profile */}
        <div className="p-3 sm:p-4 border-t border-border">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center min-w-0 flex-1">
              <div className="w-7 h-7 sm:w-10 sm:h-10 bg-slate-600 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-medium flex-shrink-0">
                {user?.firstName?.[0] || 'U'}
              </div>
              <div className="ml-2 sm:ml-3 min-w-0 flex-1">
                <p className="font-medium text-foreground text-sm sm:text-base truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground capitalize truncate">
                  {user?.role} {user?.company && `• ${user.company}`}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive flex-shrink-0 ml-2"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
