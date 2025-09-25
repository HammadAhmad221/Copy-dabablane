import { useState, useEffect, useCallback } from 'react';
import { BlaneService } from '../api/services/blaneService';

export interface UseBlaneProps {
  pagination?: {
    size: number;
    page: number;
  };
  filter?: {
    city?: string;
    type?: string;
    category?: string;
    subcategory?: string;
  };
  sort?: {
    order: 'asc' | 'desc';
    field: string;
  };
  include?: string[];
  loadInitial?: boolean;
}

export const useBlanes = ({
  pagination = { size: 10, page: 1 },
  filter,
  sort = { order: 'desc', field: 'created_at' },
  include = [],
  loadInitial = true,
}: UseBlaneProps = {}) => {
  const [blanes, setBlanes] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(loadInitial);
  const [error, setError] = useState<Error | null>(null);

  // Always ensure blaneImages is included
  const includeParams = include.includes('blaneImages') ? include : [...include, 'blaneImages'];

  const fetchBlanes = useCallback(
    async (page = pagination.page) => {
      try {
        setLoading(true);
        const response = await BlaneService.getAllBlanes({
          pagination_size: pagination.size,
          page: page.toString(),
          sort_order: sort.order,
          sort_field: sort.field,
          include: includeParams.join(','),
          ...filter,
        });

        if (response?.data && Array.isArray(response.data.data)) {
          setBlanes(response.data.data);
          setMeta(response.data.meta);
        } else if (response?.success === true && Array.isArray(response.data)) {
          setBlanes(response.data);
        } else {
          console.error('Unexpected API response structure:', response);
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching blanes:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch blanes'));
      } finally {
        setLoading(false);
      }
    },
    [pagination.size, sort.order, sort.field, includeParams, filter]
  );

  useEffect(() => {
    if (loadInitial) {
      fetchBlanes(pagination.page);
    }
  }, [fetchBlanes, pagination.page, loadInitial]);

  const loadMore = useCallback(() => {
    if (meta && meta.current_page < meta.last_page) {
      fetchBlanes(meta.current_page + 1);
    }
  }, [fetchBlanes, meta]);

  const hasMore = meta ? meta.current_page < meta.last_page : false;

  return {
    blanes,
    meta,
    loading,
    error,
    fetchBlanes,
    loadMore,
    hasMore,
  };
}; 