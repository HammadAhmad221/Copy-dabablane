import { Category as HomeCategory, Blane, BlaneComponent } from '@/user/lib/types/home';
import { Category } from '@/user/lib/types/category';

export const convertCategories = (categories: HomeCategory[] = []): Category[] => 
  categories.map(cat => ({
    ...cat,
    id: String(cat.id),
    image_link: cat.image_link || '',
    subcategories: cat.subcategories || [],
    slug: cat.slug || ''
  }));

export const convertBlanes = (blanes: Blane[] = []): BlaneComponent[] => 
  blanes.map(blane => ({
    id: String(blane.id),
    name: blane.name,
    description: blane.description,
    images: blane.images || [],
    slug: blane.slug,
    price_current: Number(blane.price_current) || 0,
    price_old: Number(blane.price_old) || 0,
    rating: String(blane.rating || '0'),
    city: blane.city || '',
    start_date: blane.start_date || '',
    expiration_date: blane.expiration_date || '',
    livraison_in_city: blane.livraison_in_city || 0,
    advantages: blane.advantages || '',
    type: blane.type || '',
    blane_images: Array.isArray(blane.blane_images) 
      ? blane.blane_images.map(img => {
          // Handle case where the API returns an object with image_link that has an error
          if (typeof img === 'object' && img !== null) {
            return { 
              ...img,
              // Ensure image_link is always the expected type
              image_link: typeof img.image_link === 'string' ? img.image_link : { error: "File not found" }
            };
          }
          return { image_link: String(img) };
        })
      : (blane.images || []).map(img => ({ image_link: img })),
    subcategories_id: blane.subcategories_id,
    subcategory: blane.subcategory
  }));

/**
 * Returns a placeholder image URL from placehold.co if the provided image URL is empty, invalid or contains an error
 * @param imageUrl The original image URL to check
 * @param width The width of the placeholder image (default: 300)
 * @param height The height of the placeholder image (default: 200)
 * @returns The original image URL if valid, otherwise a placeholder image URL
 */
export const getPlaceholderImage = (
  imageUrl: string | null | undefined | { error: string },
  width: number = 300,
  height: number = 200
): string => {
  // Check if imageUrl is an object with error property
  if (typeof imageUrl === 'object' && imageUrl !== null && 'error' in imageUrl) {
    return `https://placehold.co/${width}x${height}?text=No+Image`;
  }
  
  if (!imageUrl || (typeof imageUrl === 'string' && imageUrl.trim() === '')) {
    return `https://placehold.co/${width}x${height}?text=No+Image`;
  }
  
  return imageUrl as string;
}; 