import React, { useEffect, useRef, useState } from 'react';
import { getWebPImageUrl } from '../../utils/imageConverter';

interface NextGenImageProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  sizes?: string;
  fetchPriority?: 'high' | 'low' | 'auto';
  style?: React.CSSProperties;
}

/**
 * Advanced image component that serves WebP images with proper dimensions
 * to address multiple Lighthouse issues: next-gen formats, properly sized images, layout shifts
 */
export default function NextGenImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  placeholder = 'empty',
  sizes = '100vw',
  fetchPriority = 'auto',
  style = {},
}: NextGenImageProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [webpSupported, setWebpSupported] = useState(true);
  
  // Check for WebP support on mount
  useEffect(() => {
    // Feature detection for WebP
    const checkWebpSupport = async () => {
      if (!self.createImageBitmap) return false;
      
      const webpData = 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=';
      const blob = await fetch(webpData).then(r => r.blob());
      
      try {
        return await createImageBitmap(blob).then(() => true, () => false);
      } catch (e) {
        return false;
      }
    };
    
    checkWebpSupport().then(supported => {
      setWebpSupported(supported);
    });
  }, []);
  
  // Process image source for WebP format if supported
  const imageSource = webpSupported ? getWebPImageUrl(src) : src;
  
  // Generate sizes attribute for responsive images
  const sizesAttr = sizes || '100vw';
  
  // Generate explicit width/height styles to prevent layout shift
  const imageStyle: React.CSSProperties = {
    ...style,
  };
  
  // If width and height are provided, calculate aspect ratio
  if (width && height && typeof width === 'number' && typeof height === 'number') {
    imageStyle.aspectRatio = `${width} / ${height}`;
  }
  
  // Handle load complete
  const handleLoad = () => {
    setIsLoaded(true);
  };
  
  return (
    <div 
      className={`next-gen-image-container ${placeholder === 'blur' && !isLoaded ? 'blur-up' : ''}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        width: width ? (typeof width === 'number' ? `${width}px` : width) : '100%',
        height: height ? (typeof height === 'number' ? `${height}px` : height) : 'auto',
      }}
    >
      {/* Placeholder while loading */}
      {placeholder === 'blur' && !isLoaded && (
        <div
          className="placeholder-blur"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#f0f0f0',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(10px)',
            transform: 'scale(1.1)',
          }}
        />
      )}
      
      {/* Image with picture element for WebP support */}
      <picture>
        {webpSupported && <source srcSet={getWebPImageUrl(src)} type="image/webp" sizes={sizesAttr} />}
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={`${className} ${isLoaded ? 'loaded' : 'loading'}`}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          fetchPriority={fetchPriority}
          onLoad={handleLoad}
          style={imageStyle}
          sizes={sizesAttr}
        />
      </picture>
    </div>
  );
} 