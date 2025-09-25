import { Blane } from '../types/blane';

export type VisibilityType = 'private' | 'public' | 'link';

export interface VisibilityCheckResult {
  isVisible: boolean;
  reason?: string;
  requiresToken?: boolean;
}

/**
 * Check if a blane is visible based on its visibility settings
 */
export const checkBlaneVisibility = (
  blane: Blane,
  userToken?: string,
  isOwner: boolean = false
): VisibilityCheckResult => {
  // Owner can always see their own blanes
  if (isOwner) {
    return { isVisible: true };
  }

  const visibility = blane.visibility || 'private';

  switch (visibility) {
    case 'public':
      return { isVisible: true };

    case 'link':
      // For link visibility, check if we have a valid share token
      if (!blane.share_token) {
        return { 
          isVisible: false, 
          reason: 'Share link has been revoked',
          requiresToken: true 
        };
      }
      
      // If user provided a token, validate it
      if (userToken) {
        return {
          isVisible: blane.share_token === userToken,
          reason: blane.share_token === userToken ? undefined : 'Invalid share token',
          requiresToken: true
        };
      }
      
      // No token provided but visibility is link
      return { 
        isVisible: false, 
        reason: 'Share token required',
        requiresToken: true 
      };

    case 'private':
    default:
      return { 
        isVisible: false, 
        reason: 'This blane is private' 
      };
  }
};

/**
 * Check if a blane can be accessed via shared link
 */
export const canAccessViaSharedLink = (
  blane: Blane,
  providedToken: string
): boolean => {
  if (blane.visibility !== 'link') {
    return false;
  }

  return blane.share_token === providedToken;
};

/**
 * Get the share URL for a blane (if it has link visibility)
 */
export const getBlaneShareUrl = (blane: Blane, baseUrl?: string): string | null => {
  if (blane.visibility !== 'link' || !blane.share_token) {
    return null;
  }

  const origin = baseUrl || window.location.origin;
  return `${origin}/blane/${blane.slug}/${blane.share_token}`;
};

/**
 * Validate if a blane should be visible in lists/search results
 */
export const shouldShowInPublicLists = (blane: Blane): boolean => {
  return blane.visibility === 'public';
};

/**
 * Check if a blane requires authentication to view
 */
export const requiresAuthentication = (blane: Blane): boolean => {
  return blane.visibility === 'private';
}; 