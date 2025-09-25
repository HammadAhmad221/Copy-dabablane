/**
 * Utility for image conversion and optimization
 */

/**
 * Converts a JPEG/PNG image URL to WebP format if supported
 * @param imageUrl Original image URL
 * @returns URL to the WebP version if supported, original URL otherwise
 */
export function getWebPImageUrl(imageUrl: string): string {
  // Check if the URL is for a JPEG or PNG image
  if (!imageUrl || typeof imageUrl !== 'string') return imageUrl;
  
  const jpegPattern = /\.(jpe?g|png)(\?.*)?$/i;
  
  // If it's not a JPEG/PNG or is already a WebP, return as is
  if (!jpegPattern.test(imageUrl) || imageUrl.includes('.webp')) {
    return imageUrl;
  }
  
  // Replace the extension with WebP
  const webpUrl = imageUrl.replace(jpegPattern, '.webp$2');
  
  return webpUrl;
}

/**
 * Creates a picture element with multiple source formats (WebP, original)
 * @param props Properties for the image
 * @returns HTML string with a picture element
 */
export function createResponsivePicture(
  src: string,
  alt: string,
  width?: number | string,
  height?: number | string,
  className?: string
): string {
  const webpSrc = getWebPImageUrl(src);
  
  return `
    <picture>
      <source srcset="${webpSrc}" type="image/webp" />
      <source srcset="${src}" type="${src.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg'}" />
      <img 
        src="${src}" 
        alt="${alt}" 
        ${width ? `width="${width}"` : ''} 
        ${height ? `height="${height}"` : ''} 
        ${className ? `class="${className}"` : ''}
        loading="lazy"
        decoding="async"
      />
    </picture>
  `;
}

/**
 * Generates the correct size for an image based on its container
 * @param originalWidth Original width of the image
 * @param originalHeight Original height of the image
 * @param containerWidth Width of the container
 * @returns Optimal dimensions
 */
export function getOptimalImageDimensions(
  originalWidth: number,
  originalHeight: number,
  containerWidth: number
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight;
  const width = Math.min(originalWidth, containerWidth);
  const height = Math.round(width / aspectRatio);
  
  return { width, height };
} 