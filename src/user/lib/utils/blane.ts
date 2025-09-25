import dayjs from '@/user/lib/dayjs';
import { Blane } from '@/user/lib/types/blane';
import { getPlaceholderImage } from './home';

export const getDisplayImages = (blane: Blane): string[] => {
  // Check for different types of image sources in this order:
  // 1. blane_images array with image_link property
  // 2. blaneImages property (different API naming)
  // 3. images array directly
  // 4. featured_image property
  
  // Handle blane_images array (from API)
  if (blane.blane_images && Array.isArray(blane.blane_images) && blane.blane_images.length > 0) {
    const images = blane.blane_images.map(img => {
      // Check if image_link is an object with error property
      if (img.image_link && typeof img.image_link === 'object' && 'error' in img.image_link) {
        return ''; // Return empty string to be handled by getPlaceholderImage
      }
      // Otherwise use the image_link as is
      return typeof img.image_link === 'string' ? img.image_link : '';
    });
    
    const validImages = images.filter(img => img !== '');
    if (validImages.length > 0) {
      return validImages;
    }
  }
  
  // Check for blaneImages (alternative API naming)
  if ((blane as any).blaneImages && Array.isArray((blane as any).blaneImages) && (blane as any).blaneImages.length > 0) {
    const blaneImages = (blane as any).blaneImages;
    const images = blaneImages.map((img: any) => {
      if (typeof img === 'string') {
        return img;
      } else if (typeof img === 'object' && img !== null) {
        if ('image_link' in img) {
          return typeof img.image_link === 'string' ? img.image_link : '';
        } else if ('url' in img) {
          return typeof img.url === 'string' ? img.url : '';
        } else if ('path' in img) {
          return typeof img.path === 'string' ? img.path : '';
        }
      }
      return '';
    });
    
    const validImages = images.filter(img => img !== '');
    if (validImages.length > 0) {
      return validImages;
    }
  }
  
  // Handle images array
  if (blane.images && Array.isArray(blane.images) && blane.images.length > 0) {
    const validImages = blane.images.filter(img => img !== '' && img !== null && img !== undefined);
    if (validImages.length > 0) {
      return validImages;
    }
  }
  
  // Handle featured_image
  if (blane.featured_image && typeof blane.featured_image === 'string' && blane.featured_image.trim() !== '') {
    return [blane.featured_image];
  }
  
  // No valid images found, return placeholder
  return [getPlaceholderImage('', 800, 600)];
};

export const getRemainingDays = (startDate?: string, expirationDate?: string): number => {
  if (!startDate || !expirationDate) return 0;
  return dayjs(expirationDate).diff(dayjs(startDate), 'day');
};

export const formatDate = (date?: string): string => {
  return date ? dayjs(date).format('YYYY-MM-DD') : '';
};

export const calculateDiscountPercentage = (priceOld?: number, priceCurrent?: number): number => {
  if (!priceOld || !priceCurrent) return 0;
  return Math.round(((Number(priceOld) - Number(priceCurrent)) / Number(priceOld)) * 100);
};

export const isBlaneExpired = (expirationDate?: string): boolean => {
  return expirationDate ? dayjs(expirationDate).isBefore(dayjs()) : false;
};

export const getRoundedRating = (rating?: string): number => {
  if (!rating) return 0;
  const numRating = typeof rating === 'string' ? parseFloat(rating) : Number(rating);
  return isNaN(numRating) ? 0 : Number((Math.round(numRating * 2) / 2).toFixed(1));
};

export const getStarClass = (index: number, rating: number): string => {
  if (index + 1 <= rating) return "fill-yellow-400 text-yellow-400";
  if (index + 0.5 === rating) return "fill-yellow-400/50 text-yellow-400";
  return "text-yellow-400";
}; 