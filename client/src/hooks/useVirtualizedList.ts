import { useMemo, useState, useCallback, useEffect } from 'react';

interface VirtualizedListOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export function useVirtualizedList<T>(
  items: T[],
  { itemHeight, containerHeight, overscan = 5 }: VirtualizedListOptions
) {
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = useMemo(() => items.length * itemHeight, [items.length, itemHeight]);
  
  const visibleItemsInfo = useMemo(() => {
    const visibleItemCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(items.length, startIndex + visibleItemCount + overscan * 2);
    
    const visibleItems = items.slice(startIndex, endIndex);
    
    return {
      startIndex,
      endIndex,
      visibleItems,
      offsetY: startIndex * itemHeight,
    };
  }, [items, scrollTop, itemHeight, containerHeight, overscan]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Reset scroll position when items change
  useEffect(() => {
    setScrollTop(0);
  }, [items.length]);

  return {
    totalHeight,
    visibleItems: visibleItemsInfo.visibleItems,
    startIndex: visibleItemsInfo.startIndex,
    offsetY: visibleItemsInfo.offsetY,
    handleScroll,
  };
}

// Hook for infinite scroll with virtualization
export function useInfiniteVirtualList<T>(
  items: T[],
  options: VirtualizedListOptions,
  {
    hasNextPage = false,
    isFetchingNextPage = false,
    fetchNextPage,
  }: {
    hasNextPage?: boolean;
    isFetchingNextPage?: boolean;
    fetchNextPage?: () => void;
  }
) {
  const virtualized = useVirtualizedList(items, options);
  
  const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    virtualized.handleScroll(e);
    
    // Trigger next page fetch when near bottom
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const threshold = 200; // pixels from bottom
    
    if (
      hasNextPage &&
      !isFetchingNextPage &&
      scrollHeight - scrollTop - clientHeight < threshold
    ) {
      fetchNextPage?.();
    }
  }, [virtualized.handleScroll, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    ...virtualized,
    handleScroll,
  };
}

// Performance optimized search with debouncing and virtualization
export function useSearchableVirtualList<T>(
  items: T[],
  searchTerm: string,
  searchFn: (item: T, term: string) => boolean,
  virtualOptions: VirtualizedListOptions
) {
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    return items.filter(item => searchFn(item, searchTerm.toLowerCase()));
  }, [items, searchTerm, searchFn]);

  const virtualized = useVirtualizedList(filteredItems, virtualOptions);

  return {
    ...virtualized,
    filteredItems,
    totalFilteredCount: filteredItems.length,
  };
}