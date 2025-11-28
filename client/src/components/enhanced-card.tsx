import * as React from "react"
import { cn } from "@/lib/utils"

interface EnhancedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  variant?: "default" | "success" | "warning" | "info";
}

const EnhancedCard = React.forwardRef<HTMLDivElement, EnhancedCardProps>(
  ({ className, hover = false, variant = "default", ...props }, ref) => {
    const variantClasses = {
      default: "",
      success: "border-emerald-500/20 dark:border-emerald-400/20",
      warning: "border-amber-500/20 dark:border-amber-400/20", 
      info: "border-blue-500/20 dark:border-blue-400/20"
    };

    return (
      <div
        ref={ref}
        className={cn(
          // Base styling with improved rounded corners and spacing
          "rounded-xl border bg-card text-card-foreground p-6",
          // Enhanced shadows for dark mode
          "shadow-sm dark:shadow-card transition-all duration-200",
          // Hover effects
          hover && "hover:shadow-md dark:hover:shadow-card-hover cursor-pointer",
          // Variant-specific border colors
          variantClasses[variant],
          className
        )}
        {...props}
      />
    );
  }
);

EnhancedCard.displayName = "EnhancedCard";

const EnhancedCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 mb-4", className)}
    {...props}
  />
));
EnhancedCardHeader.displayName = "EnhancedCardHeader";

const EnhancedCardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight text-card-foreground",
      className
    )}
    {...props}
  />
));
EnhancedCardTitle.displayName = "EnhancedCardTitle";

const EnhancedCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("space-y-3", className)} {...props} />
));
EnhancedCardContent.displayName = "EnhancedCardContent";

export { EnhancedCard, EnhancedCardHeader, EnhancedCardTitle, EnhancedCardContent };