import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

export interface TrialInfo {
  accountStatus: 'trial' | 'active' | 'expired' | 'cancelled';
  isTrialValid: boolean;
  daysRemaining?: number;
  trialEndsAt: string;
  message?: string;
}

export function useTrial() {
  const query = useQuery<TrialInfo>({
    queryKey: ['/api/auth/trial'],
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    retry: 1,
    staleTime: 2 * 60 * 1000, // Consider stale after 2 minutes
  });

  return {
    ...query,
    trialInfo: query.data,
    isTrialExpired: query.data?.accountStatus === 'expired',
    isOnTrial: query.data?.accountStatus === 'trial',
    isActiveAccount: query.data?.accountStatus === 'active',
    daysRemaining: query.data?.daysRemaining ?? 0,
    trialMessage: query.data?.message,
  };
}

export function invalidateTrialCache() {
  queryClient.invalidateQueries({ queryKey: ['/api/auth/trial'] });
}

// Helper to format trial status for display
export function formatTrialStatus(trialInfo?: TrialInfo): string {
  if (!trialInfo) return 'Loading...';
  
  switch (trialInfo.accountStatus) {
    case 'trial':
      const days = trialInfo.daysRemaining ?? 0;
      return days > 0 
        ? `${days} day${days === 1 ? '' : 's'} remaining`
        : 'Trial expired';
    case 'active':
      return 'Active subscription';
    case 'expired':
      return 'Trial expired';
    case 'cancelled':
      return 'Account cancelled';
    default:
      return 'Unknown status';
  }
}

// Helper to get trial status color
export function getTrialStatusColor(trialInfo?: TrialInfo): 'green' | 'yellow' | 'red' | 'gray' {
  if (!trialInfo) return 'gray';
  
  switch (trialInfo.accountStatus) {
    case 'active':
      return 'green';
    case 'trial':
      const days = trialInfo.daysRemaining ?? 0;
      if (days > 3) return 'green';
      if (days > 0) return 'yellow';
      return 'red';
    case 'expired':
    case 'cancelled':
      return 'red';
    default:
      return 'gray';
  }
}