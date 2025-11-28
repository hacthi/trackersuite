import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginData } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth.ts";
import { useLocation } from "wouter";
import { TrackerSuiteLogo } from "@/components/tracker-suite-logo";

interface LoginFormProps {
  onToggleForm: () => void;
}

export function LoginForm({ onToggleForm }: LoginFormProps) {
  const { loginMutation } = useAuth();
  const [, setLocation] = useLocation();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginData) => {
    try {
      const userData = await loginMutation.mutateAsync(data);
      console.log("Login success, user data:", userData);
      
      // Check if user is admin and redirect accordingly
      const isAdminUser = userData && (userData.userRole === "admin" || userData.userRole === "master_admin");
      
      if (isAdminUser) {
        console.log("Redirecting admin user to admin dashboard");
        setLocation("/admin");
      } else {
        console.log("Redirecting regular user to dashboard");
        setLocation("/dashboard");
      }
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-3 sm:space-y-4 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="flex items-center gap-1 sm:gap-2 text-muted-foreground hover:text-foreground text-sm"
          >
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Back to Home</span>
            <span className="sm:hidden">Back</span>
          </Button>
        </div>
        
        <div className="flex flex-col items-center space-y-3 sm:space-y-4">
          <TrackerSuiteLogo size="md" mobileSize="sm" animate={true} />
          <div className="text-center">
            <CardTitle className="text-xl sm:text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Sign in to your account
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          {loginMutation.isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {loginMutation.error?.message || "Login failed. Please try again."}
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        <div className="text-center text-sm">
          <span className="text-gray-600">Don't have an account? </span>
          <Button
            variant="link"
            onClick={onToggleForm}
            className="p-0 font-medium"
          >
            Sign up
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}