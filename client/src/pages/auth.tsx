import { useState } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { FallingStarsBackground } from "@/components/falling-stars-background";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);

  const toggleForm = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 flex items-center justify-center py-8 sm:py-12 px-3 sm:px-4 lg:px-8 relative overflow-hidden">
      {/* Falling stars background */}
      <FallingStarsBackground />
      
      {/* Theme toggle for auth page */}
      <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-20">
        <ThemeToggle />
      </div>
      
      <div className="max-w-sm sm:max-w-md w-full space-y-6 sm:space-y-8 relative z-10">
        {isLogin ? (
          <LoginForm onToggleForm={toggleForm} />
        ) : (
          <RegisterForm onToggleForm={toggleForm} />
        )}
      </div>
    </div>
  );
}