import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTrial, formatTrialStatus, getTrialStatusColor } from "@/hooks/useTrial";
import { Clock, Crown, AlertTriangle, X } from "lucide-react";
import { useState } from "react";

export function TrialBanner() {
  const { trialInfo, isLoading, isOnTrial, isTrialExpired, daysRemaining } = useTrial();
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show banner if loading, dismissed, or user has active subscription
  if (isLoading || isDismissed || (!isOnTrial && !isTrialExpired)) {
    return null;
  }

  // Don't show banner if trial is fine (more than 3 days remaining)
  if (isOnTrial && daysRemaining > 3) {
    return null;
  }

  const statusColor = getTrialStatusColor(trialInfo);
  const statusText = formatTrialStatus(trialInfo);

  const getAlertVariant = () => {
    if (isTrialExpired) return "destructive";
    if (daysRemaining <= 1) return "destructive";
    return "default";
  };

  const getIcon = () => {
    if (isTrialExpired) return <AlertTriangle className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  const getMessage = () => {
    if (isTrialExpired) {
      return "Your free trial has expired. Upgrade to continue using all features.";
    }
    
    if (daysRemaining === 1) {
      return "Your trial expires tomorrow! Upgrade now to avoid interruption.";
    }
    
    if (daysRemaining <= 3) {
      return `Your trial expires in ${daysRemaining} days. Upgrade to keep your data and features.`;
    }
    
    return `You have ${daysRemaining} days left in your trial.`;
  };

  return (
    <Alert variant={getAlertVariant()} className="relative">
      <div className="flex items-center space-x-3">
        {getIcon()}
        <div className="flex-1">
          <AlertDescription className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span>{getMessage()}</span>
              <Badge 
                variant={statusColor === 'red' ? 'destructive' : statusColor === 'yellow' ? 'secondary' : 'default'}
                className="text-xs"
              >
                {statusText}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                <Crown className="h-3 w-3 mr-1" />
                Upgrade Now
              </Button>
              {!isTrialExpired && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsDismissed(true)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}

// Compact version for header/sidebar
export function TrialStatus() {
  const { trialInfo, isLoading, isOnTrial, isActiveAccount } = useTrial();

  if (isLoading || isActiveAccount) {
    return null;
  }

  if (!trialInfo) return null;

  const statusColor = getTrialStatusColor(trialInfo);
  const statusText = formatTrialStatus(trialInfo);

  return (
    <div className="flex items-center space-x-2">
      <Badge 
        variant={statusColor === 'red' ? 'destructive' : statusColor === 'yellow' ? 'secondary' : 'default'}
        className="text-xs"
      >
        <Clock className="h-3 w-3 mr-1" />
        {statusText}
      </Badge>
    </div>
  );
}