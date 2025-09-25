import { useState, useEffect, useCallback } from 'react';
import { BlaneService } from '@/user/lib/api/services/blaneService';
import { Blane as BlaneType } from '@/user/lib/types/blane';
import { differenceInDays, isAfter, parseISO } from 'date-fns';
import { shareContent } from '../utils/helpers';

interface UseBlaneDetailReturn {
  blane: BlaneType | null;
  loading: boolean;
  error: Error | null;
  activeImageIndex: number;
  setActiveImageIndex: (index: number) => void;
  formatDate: (dateString: string) => string;
  isExpired: (expirationDate: string) => boolean;
  getRemainingDays: (expirationDate: string) => number;
  getDiscountPercentage: (originalPrice: number, discountPrice: number) => number;
  images: string[];
  handleShareClick: () => void;
  retryFetch: () => Promise<void>;
}

// API response type with optional advantage field that doesn't exist in our model
interface ApiBlaneResponse {
  id: number;
  name: string;
  description: string;
  price_current: number;
  price_old: number;
  advantages?: string | null;
  advantage?: string | null; // Some API responses might use this field instead
  expiration_date: string;
  start_date: string;
  city: string;
  rating: string;
  livraison_in_city: number;
  type: string;
  slug: string;
  blane_images: any[];
  images?: string[];
  [key: string]: any; // Allow other properties
}

export const useBlaneDetail = (slug: string, loadInitial = true): UseBlaneDetailReturn => {
  const [blane, setBlane] = useState<BlaneType | null>(null);
  const [loading, setLoading] = useState(loadInitial);
  const [error, setError] = useState<Error | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const fetchBlaneDetail = useCallback(
    async (blaneSlug: string) => {
      try {
        setLoading(true);
        const response = await BlaneService.getBlaneBySlug(blaneSlug, 'blaneImages,blaneStamps');
        
        if (response?.data) {
          const apiData = response.data as ApiBlaneResponse;
          
          // Convert id to string to match the expected type and handle optional fields
          const blaneData: BlaneType = {
            ...apiData,
            id: String(apiData.id),
            advantages: apiData.advantages || apiData.advantage || '',
            images: apiData.images || []
          } as unknown as BlaneType;
          
          setBlane(blaneData);
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch blane detail'));
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (slug && loadInitial) {
      fetchBlaneDetail(slug);
    }
  }, [slug, fetchBlaneDetail, loadInitial]);

  // Retry function
  const retryFetch = async () => {
    await fetchBlaneDetail(slug);
  };

  // Format dates
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  // Check if blane is expired
  const isExpired = (expirationDate: string) => {
    if (!expirationDate) return false;
    const today = new Date();
    const expDate = parseISO(expirationDate);
    return isAfter(today, expDate);
  };

  // Calculate remaining days
  const getRemainingDays = (expirationDate: string) => {
    if (!expirationDate) return 0;
    const today = new Date();
    const expDate = parseISO(expirationDate);
    return Math.max(0, differenceInDays(expDate, today));
  };

  // Calculate discount percentage
  const getDiscountPercentage = (originalPrice: number, discountPrice: number) => {
    if (!originalPrice || !discountPrice || originalPrice <= 0) return 0;
    return Math.round(((originalPrice - discountPrice) / originalPrice) * 100);
  };

  // Process images
  const images = blane?.blane_images?.map(img => 
    typeof img.image_link === 'string' ? img.image_link : ''
  ).filter(Boolean) || [];
  
  if (blane?.images && blane.images.length > 0 && images.length === 0) {
    images.push(...blane.images);
  }

  // Handle share click
  const handleShareClick = async () => {
    if (!blane) return;
    
    const url = `${window.location.origin}/blane/${blane.slug}`;
    const title = blane.name || 'Check out this Blane!';
    const text = blane.description || 'I found this interesting Blane that you might like.';

    try {
      await shareContent(title, text, url);
    } catch (err) {
      // Silently fail on share error
    }
  };

  return {
    blane,
    loading,
    error,
    activeImageIndex,
    setActiveImageIndex,
    formatDate,
    isExpired,
    getRemainingDays,
    getDiscountPercentage,
    images,
    handleShareClick,
    retryFetch
  };
}; 