import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

interface OptimizedQueryConfig<T = unknown> {
  staleTime?: number;
  cacheTime?: number;
  retryDelay?: number;
  retry?: number;
}

// Smart query hook with optimized defaults for different data types
export function useOptimizedQuery<T>(
  queryKey: (string | number)[],
  options: UseQueryOptions<T> = {},
  config: OptimizedQueryConfig<T> = {}
) {
  const {
    staleTime = 5 * 60 * 1000, // 5 minutes default
    cacheTime = 10 * 60 * 1000, // 10 minutes default
    retryDelay = 1000,
    retry = 2
  } = config;

  const optimizedOptions = useMemo(() => ({
    ...options,
    staleTime,
    cacheTime,
    retry,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    ...options, // User options override defaults
  }), [options, staleTime, cacheTime, retry, retryDelay]);

  return useQuery({
    queryKey,
    ...optimizedOptions
  });
}

// Specialized hooks for different data types
export const useClientQuery = <T>(queryKey: (string | number)[], options: UseQueryOptions<T> = {}) =>
  useOptimizedQuery(queryKey, options, {
    staleTime: 10 * 60 * 1000, // 10 minutes for clients (less frequent changes)
    cacheTime: 15 * 60 * 1000,
  });

export const useFollowUpQuery = <T>(queryKey: (string | number)[], options: UseQueryOptions<T> = {}) =>
  useOptimizedQuery(queryKey, options, {
    staleTime: 3 * 60 * 1000, // 3 minutes for follow-ups (more dynamic)
    cacheTime: 5 * 60 * 1000,
  });

export const useDashboardQuery = <T>(queryKey: (string | number)[], options: UseQueryOptions<T> = {}) =>
  useOptimizedQuery(queryKey, options, {
    staleTime: 5 * 60 * 1000, // 5 minutes for dashboard
    cacheTime: 10 * 60 * 1000,
  });

export const useAnalyticsQuery = <T>(queryKey: (string | number)[], options: UseQueryOptions<T> = {}) =>
  useOptimizedQuery(queryKey, options, {
    staleTime: 15 * 60 * 1000, // 15 minutes for analytics (least frequent changes)
    cacheTime: 30 * 60 * 1000,
    retry: 3,
  });

// Background refresh hook for maintaining fresh data
export const useBackgroundRefresh = () => {
  const refreshData = useCallback((queryKeys: string[][]) => {
    if ('serviceWorker' in navigator) {
      // Schedule background data refresh when app becomes visible
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          queryKeys.forEach(queryKey => {
            // Trigger background refetch
            window.dispatchEvent(new CustomEvent('refresh-query', { 
              detail: { queryKey } 
            }));
          });
        }
      });
    }
  }, []);

  return { refreshData };
};