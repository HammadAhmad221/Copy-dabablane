import { useState, useEffect, useCallback } from 'react';
import { BlaneService, BlaneQueryParams } from '../api/services/blaneService';

export interface PaginatedBlanesResponse {
  data: Array<{
    id: number;
    type: string;
    name: string;
    description: string;
    price_current: string;
    price_old: string;
    city: string;
    slug: string;
    start_date: string;
    expiration_date: string;
    livraison_in_city: number;
    advantages: string | null;
    views: number;
    status: string;
    created_at: string;
    rating: string;
    blane_images?: Array<{
      blane_id: number;
      image_url: string;
      image_link: {
        error?: string;
      };
    }>;
  }>;
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    links: Array<{
      url: string | null;
      label: string;
      active: boolean;
    }>;
    path: string;
    per_page: number;
    to: number;
    total: number;
  };
}

export type BlaneItem = PaginatedBlanesResponse['data'][0];

interface UseBlaneOptions extends BlaneQueryParams {
  skipInitialFetch?: boolean; // Add option to skip initial fetch
}

export const useBlane = (initialOptions?: UseBlaneOptions) => {
  const [queryParams, setQueryParams] = useState<BlaneQueryParams>({
    pagination_size: initialOptions?.pagination_size || 10,
    page: initialOptions?.page || '1',
    include: 'blaneImages'
  });
  const [blanes, setBlanes] = useState<BlaneItem[]>([]);
  const [paginationData, setPaginationData] = useState<{
    currentPage: number;
    lastPage: number;
    total: number;
    hasMore: boolean;
  }>({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    hasMore: false,
  });
  const [loading, setLoading] = useState(!initialOptions?.skipInitialFetch);
  const [error, setError] = useState<Error | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  const fetchBlanes = useCallback(async (page = 1, append = false) => {
    try {
      setLoading(true);
      const params = { 
        ...queryParams,
        page: page.toString()
      };
      
      const response = await BlaneService.getAllBlanes(params);
      
      // Ensure we have data before trying to access it
      if (!response || !response.data) {
        throw new Error('No data returned from API');
      }
      
      // Try to handle different response structures
      let blaneItems: BlaneItem[] = [];
      let meta = { 
        current_page: 1, 
        last_page: 1, 
        total: 0 
      };
      
      // Response could be { success: true, data: BlaneItem[] }
      // or { success: true, data: { data: BlaneItem[], meta: {...} } }
      // Use type casting to handle the response safely
      const responseData = response.data as unknown as PaginatedBlanesResponse | BlaneItem[];
      
      if (Array.isArray(responseData)) {
        blaneItems = responseData as BlaneItem[];
      } else if (responseData && typeof responseData === 'object' && responseData.data && Array.isArray(responseData.data)) {
        blaneItems = responseData.data as BlaneItem[];
        if (responseData.meta) {
          meta = responseData.meta;
        }
      } else {
        throw new Error('Unexpected API response structure');
      }
      
      if (append) {
        setBlanes(prev => [...prev, ...blaneItems]);
      } else {
        setBlanes(blaneItems);
      }
      
      setPaginationData({
        currentPage: meta.current_page,
        lastPage: meta.last_page,
        total: meta.total || 0,
        hasMore: meta.current_page < meta.last_page,
      });
      
      setError(null);
      setHasInitialized(true);
    } catch (error) {
      setError(error as Error);
      
      // Set empty data on error so UI doesn't break
      if (!append) {
        setBlanes([]);
        setPaginationData({
          currentPage: 1,
          lastPage: 1,
          total: 0,
          hasMore: false,
        });
      }
      setHasInitialized(true);
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  // Initial fetch - only if not skipped
  useEffect(() => {
    if (!initialOptions?.skipInitialFetch) {
    fetchBlanes(1, false);
    } else {
      // If we skip initial fetch, still mark as initialized
      setHasInitialized(true);
      setLoading(false);
    }
  }, [fetchBlanes, initialOptions?.skipInitialFetch]);

  // Function to load more data (next page)
  const loadMore = useCallback(() => {
    if (loading || !paginationData.hasMore) {
      return;
    }
    
    fetchBlanes(paginationData.currentPage + 1, true);
  }, [fetchBlanes, loading, paginationData.currentPage, paginationData.hasMore]);

  // Function to refetch data from page 1
  const refetch = useCallback(() => {
    fetchBlanes(1, false);
  }, [fetchBlanes]);

  // Function to update query parameters and trigger a refetch
  const updateQueryParams = useCallback((newParams: BlaneQueryParams) => {
    setQueryParams(prev => ({
      ...prev,
      ...newParams
    }));
    // The fetchBlanes will be triggered automatically due to the dependency on queryParams
  }, []);

  // Function to manually start fetching data
  const startFetching = useCallback(() => {
    fetchBlanes(1, false);
  }, [fetchBlanes]);

  return {
    blanes,
    loading,
    error,
    hasMore: paginationData.hasMore,
    loadMore,
    refetch,
    paginationData,
    updateQueryParams,
    hasInitialized,
    startFetching
  };
}; 