/**
 * Image optimization utilities for better performance
 */

/**
 * Gets optimal image size based on viewport width
 * @param viewportWidth - Current viewport width
 * @returns Optimal image width for the current viewport
 */
export function getOptimalImageSize(viewportWidth: number): number {
  if (viewportWidth <= 640) return 640; // sm
  if (viewportWidth <= 768) return 768; // md
  if (viewportWidth <= 1024) return 1024; // lg
  if (viewportWidth <= 1280) return 1280; // xl
  return 1920; // Default for larger screens
}

/**
 * Creates a responsive image URL with width parameter
 * @param url - Original image URL
 * @param width - Desired image width
 * @returns Modified URL with width parameter
 */
export function getResponsiveImageUrl(url: string, width: number): string {
  // If it's already a data URL or SVG, return as is
  if (url.startsWith('data:') || url.endsWith('.svg')) {
    return url;
  }

  // For internal images using relative paths
  if (url.startsWith('/') && !url.startsWith('//')) {
    // Append width parameter to URL
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}w=${width}`;
  }

  // For external images, return as is
  return url;
}

/**
 * Generates srcSet attribute for responsive images
 * @param url - Base image URL
 * @returns string - srcSet attribute value
 */
export function generateSrcSet(url: string): string {
  // If it's already a data URL or SVG, return empty srcSet
  if (url.startsWith('data:') || url.endsWith('.svg')) {
    return '';
  }

  // For internal images using relative paths
  if (url.startsWith('/') && !url.startsWith('//')) {
    const widths = [640, 768, 1024, 1280, 1920];
    return widths
      .map(width => {
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}w=${width} ${width}w`;
      })
      .join(', ');
  }

  // For external images, return empty srcSet
  return '';
}

/**
 * Preloads critical images with error handling
 * @param urls - Array of image URLs to preload
 */
export function preloadCriticalImages(urls: string[]): void {
  if (typeof document === 'undefined') return;
  
  // Keep track of which images we've already tried to preload
  const preloadedUrls = new Set<string>();
  
  urls.forEach(url => {
    // Skip if we've already tried to preload this URL
    if (preloadedUrls.has(url)) return;
    preloadedUrls.add(url);
    
    // Check if the image exists before preloading
    const checkImage = new Image();
    checkImage.onload = () => {
      // Image exists, so we can preload it
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      
      // Add crossorigin if it's an external URL
      if (url.startsWith('http') && !url.includes(window.location.hostname)) {
        link.setAttribute('crossorigin', '');
      }
      
      // Check if this preload already exists
      const existingPreload = document.querySelector(`link[rel="preload"][href="${url}"]`);
      if (!existingPreload) {
        document.head.appendChild(link);
      }
    };
    
    checkImage.onerror = () => {
      // Image doesn't exist, so don't preload it
      console.warn(`Image at ${url} couldn't be found, skipping preload.`);
    };
    
    // Start the check
    checkImage.src = url;
  });
} 