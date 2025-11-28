import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Search, Edit, Trash2, Eye, Plus, Filter, ChevronLeft, ChevronRight, Users, Clock, CheckCircle, Shield, LogOut, TrendingUp, Activity, AlertTriangle, Settings } from "lucide-react";
import { format } from "date-fns";
import { AdminGuard } from "@/components/admin-guard";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/useAuth.tsx";
import AdminActivityHeatmap from "@/components/admin-activity-heatmap";
import { AdminNotificationCenter } from "@/components/admin-notification-center";
import { TrackerSuiteLogo } from "@/components/tracker-suite-logo";

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

const editUserSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"), 
  email: z.string().email("Invalid email address"),
  userRole: z.enum(["user", "admin", "master_admin"]),
  accountStatus: z.enum(["trial", "active", "expired", "cancelled"]),
  company: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
});

type EditUserData = z.infer<typeof editUserSchema>;

export default function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const itemsPerPage = 10;
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  // Fetch all users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await fetch("/api/admin/users", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
  });

  // Filter and paginate users
  const filteredUsers = users.filter((user: User) => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || 
      (roleFilter === "admin" && (user.userRole === "admin" || user.userRole === "master_admin")) ||
      (roleFilter !== "admin" && user.userRole === roleFilter);
    
    const matchesStatus = statusFilter === "all" || user.accountStatus === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: number; data: any }) => {
      if (data.password && data.password.length > 0) {
        // Update user with password
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error("Failed to update user");
      } else {
        // Update user without password
        const { password, ...dataWithoutPassword } = data;
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: "PUT",
          credentials: "include", 
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataWithoutPassword),
        });
        if (!response.ok) throw new Error("Failed to update user");
      }
      
      // Update role separately if changed
      if (data.userRole) {
        const response = await fetch(`/api/admin/users/${userId}/role`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: data.userRole }),
        });
        if (!response.ok) throw new Error("Failed to update role");
      }
      
      // Update trial status if changed
      if (data.accountStatus) {
        const response = await fetch(`/api/admin/users/${userId}/trial`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accountStatus: data.accountStatus }),
        });
        if (!response.ok) throw new Error("Failed to update trial status");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User updated successfully" });
      setEditingUser(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to delete user");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const form = useForm<EditUserData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      userRole: "user",
      accountStatus: "trial",
      company: "",
      password: "",
    },
  });

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.reset({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      userRole: user.userRole,
      accountStatus: user.accountStatus,
      company: user.company || "",
      password: "",
    });
  };

  const onSubmit = (data: EditUserData) => {
    if (!editingUser) return;
    updateUserMutation.mutate({ userId: editingUser.id, data });
  };

  const handleDelete = (userId: number) => {
    deleteUserMutation.mutate(userId);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      trial: "secondary",
      active: "default",
      expired: "destructive",
      cancelled: "outline",
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      user: "outline",
      admin: "secondary", 
      master_admin: "default",
    } as const;
    
    return (
      <Badge variant={variants[role as keyof typeof variants] || "outline"}>
        {role === "master_admin" ? "Master Admin" : role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  const getDaysRemaining = (trialEndsAt: string) => {
    const endDate = new Date(trialEndsAt);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background dark:bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-background dark:bg-background p-6">
        <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <TrackerSuiteLogo size="sm" animate={false} showText={false} />
            <div>
              <h1 className="text-3xl font-bold text-foreground dark:text-foreground mb-2">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground">
                Manage users, accounts, and permissions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <AdminNotificationCenter />
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  await fetch("/api/auth/logout", {
                    method: "POST",
                    credentials: "include",
                  });
                  window.location.href = "/auth";
                } catch (error) {
                  console.error("Logout error:", error);
                  window.location.href = "/auth";
                }
              }}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Personalized Welcome Screen */}
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Welcome back, {currentUser?.firstName} {currentUser?.lastName}! 👋
              </h2>
              <p className="text-muted-foreground">
                You have {users.filter((u: User) => u.userRole === "admin" || u.userRole === "master_admin").length > 1 ? "full" : "master"} admin privileges
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Current Time</p>
                <p className="font-medium">{new Date().toLocaleTimeString()}</p>
              </div>
            </div>
          </div>

          {/* Quick Admin Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Card className="bg-white/50 dark:bg-gray-900/50 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">System Health</p>
                    <p className="font-semibold text-green-600 dark:text-green-400">Excellent</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/50 dark:bg-gray-900/50 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Recent Activity</p>
                    <p className="font-semibold text-blue-600 dark:text-blue-400">
                      {users.filter((u: User) => {
                        const createdAt = new Date(u.createdAt);
                        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                        return createdAt > dayAgo;
                      }).length} new users today
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/50 dark:bg-gray-900/50 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Needs Attention</p>
                    <p className="font-semibold text-orange-600 dark:text-orange-400">
                      {users.filter((u: User) => {
                        const trialEnd = new Date(u.trialEndsAt);
                        const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
                        return u.accountStatus === "trial" && trialEnd < threeDaysFromNow;
                      }).length} trials expiring soon
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions for Admin */}
          <div className="flex flex-wrap gap-3">
            <Button 
              size="sm" 
              variant="outline"
              className="bg-white/80 dark:bg-gray-900/80"
              onClick={() => {
                setSearchTerm("");
                setRoleFilter("all");
                setStatusFilter("trial");
                setCurrentPage(1);
              }}
            >
              <Clock className="h-4 w-4 mr-2" />
              View Trial Users
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="bg-white/80 dark:bg-gray-900/80"
              onClick={() => {
                setSearchTerm("");
                setRoleFilter("admin");
                setStatusFilter("all");
                setCurrentPage(1);
              }}
            >
              <Shield className="h-4 w-4 mr-2" />
              Manage Admins
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="bg-white/80 dark:bg-gray-900/80"
              onClick={() => {
                const today = new Date();
                const newUsers = users.filter((u: User) => {
                  const createdAt = new Date(u.createdAt);
                  return createdAt.toDateString() === today.toDateString();
                });
                if (newUsers.length > 0) {
                  toast({
                    title: "Recent Registrations",
                    description: `${newUsers.length} users registered today: ${newUsers.map(u => u.firstName + ' ' + u.lastName).join(', ')}`,
                  });
                } else {
                  toast({
                    title: "Recent Registrations", 
                    description: "No new registrations today",
                  });
                }
              }}
            >
              <Users className="h-4 w-4 mr-2" />
              Recent Activity
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow duration-200 border-2 hover:border-primary/20"
            onClick={() => {
              setSearchTerm("");
              setRoleFilter("all");
              setStatusFilter("all");
              setCurrentPage(1);
            }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                Total Users
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Click to view all users</p>
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow duration-200 border-2 hover:border-green-200"
            onClick={() => {
              setSearchTerm("");
              setRoleFilter("all");
              setStatusFilter("active");
              setCurrentPage(1);
            }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                Active Users
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {users.filter((u: User) => u.accountStatus === "active").length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Click to filter active users</p>
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow duration-200 border-2 hover:border-blue-200"
            onClick={() => {
              setSearchTerm("");
              setRoleFilter("all");
              setStatusFilter("trial");
              setCurrentPage(1);
            }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                Trial Users
                <Clock className="h-4 w-4 text-blue-600" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {users.filter((u: User) => u.accountStatus === "trial").length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Click to filter trial users</p>
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow duration-200 border-2 hover:border-purple-200"
            onClick={() => {
              setSearchTerm("");
              setRoleFilter("admin");
              setStatusFilter("all");
              setCurrentPage(1);
            }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                Admins
                <Shield className="h-4 w-4 text-purple-600" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {users.filter((u: User) => u.userRole === "admin" || u.userRole === "master_admin").length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Click to filter admin users</p>
            </CardContent>
          </Card>
        </div>

        {/* Activity Heatmap */}
        <div className="mb-8">
          <AdminActivityHeatmap users={users} />
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="master_admin">Master Admin</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setRoleFilter("all");
                  setStatusFilter("all");
                  setCurrentPage(1);
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Trial Info</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map((user: User) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {user.firstName} {user.lastName}
                        </div>
                        {user.company && (
                          <div className="text-sm text-muted-foreground">
                            {user.company}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.userRole)}</TableCell>
                    <TableCell>{getStatusBadge(user.accountStatus)}</TableCell>
                    <TableCell>
                      {user.accountStatus === "trial" ? (
                        <div className="text-sm">
                          <div>{getDaysRemaining(user.trialEndsAt)} days left</div>
                          <div className="text-muted-foreground">
                            Ends {format(new Date(user.trialEndsAt), "MMM d")}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(user.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedUser(user)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>User Profile</DialogTitle>
                            </DialogHeader>
                            {selectedUser && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="font-medium">Name</label>
                                    <p>{selectedUser.firstName} {selectedUser.lastName}</p>
                                  </div>
                                  <div>
                                    <label className="font-medium">Email</label>
                                    <p>{selectedUser.email}</p>
                                  </div>
                                  <div>
                                    <label className="font-medium">Role</label>
                                    <p>{getRoleBadge(selectedUser.userRole)}</p>
                                  </div>
                                  <div>
                                    <label className="font-medium">Account Status</label>
                                    <p>{getStatusBadge(selectedUser.accountStatus)}</p>
                                  </div>
                                  {selectedUser.company && (
                                    <div>
                                      <label className="font-medium">Company</label>
                                      <p>{selectedUser.company}</p>
                                    </div>
                                  )}
                                  <div>
                                    <label className="font-medium">Registration Date</label>
                                    <p>{format(new Date(selectedUser.createdAt), "PPP")}</p>
                                  </div>
                                  <div>
                                    <label className="font-medium">Last Updated</label>
                                    <p>{format(new Date(selectedUser.updatedAt), "PPP")}</p>
                                  </div>
                                  <div>
                                    <label className="font-medium">Trial End Date</label>
                                    <p>{format(new Date(selectedUser.trialEndsAt), "PPP")}</p>
                                  </div>
                                </div>
                                <div>
                                  <label className="font-medium">Permissions</label>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {selectedUser.permissions.map((permission) => (
                                      <Badge key={permission} variant="outline" className="text-xs">
                                        {permission}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        <Dialog open={editingUser?.id === user.id} onOpenChange={(open) => !open && setEditingUser(null)}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Edit User</DialogTitle>
                            </DialogHeader>
                            <Form {...form}>
                              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <FormField
                                    control={form.control}
                                    name="firstName"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>First Name</FormLabel>
                                        <FormControl>
                                          <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={form.control}
                                    name="lastName"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Last Name</FormLabel>
                                        <FormControl>
                                          <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                                <FormField
                                  control={form.control}
                                  name="email"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Email</FormLabel>
                                      <FormControl>
                                        <Input {...field} type="email" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="company"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Company (Optional)</FormLabel>
                                      <FormControl>
                                        <Input {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                  <FormField
                                    control={form.control}
                                    name="userRole"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>User Role</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                          <FormControl>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select role" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            <SelectItem value="user">User</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                            <SelectItem value="master_admin">Master Admin</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={form.control}
                                    name="accountStatus"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Account Status</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                          <FormControl>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            <SelectItem value="trial">Trial</SelectItem>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="expired">Expired</SelectItem>
                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                                <FormField
                                  control={form.control}
                                  name="password"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>New Password (Optional)</FormLabel>
                                      <FormControl>
                                        <Input {...field} type="password" placeholder="Leave blank to keep current password" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <div className="flex justify-end gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditingUser(null)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    type="submit"
                                    disabled={updateUserMutation.isPending}
                                  >
                                    {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
                                  </Button>
                                </div>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {user.firstName} {user.lastName}? 
                                This action cannot be undone and will permanently delete all their data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(user.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete User
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of{" "}
                  {filteredUsers.length} users
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </AdminGuard>
  );
}