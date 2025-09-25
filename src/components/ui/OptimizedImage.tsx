import { useState, useEffect, useRef, ImgHTMLAttributes } from 'react';
import { getOptimalImageSize, generateSrcSet } from '../../utils/imageOptimizer';

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  lazyLoad?: boolean;
  prioritize?: boolean;
  fallbackSrc?: string;
}

export function OptimizedImage({
  src,
  alt,
  className = '',
  lazyLoad = true,
  prioritize = false,
  fallbackSrc,
  ...props
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1920
  );

  // Get optimal image size based on viewport
  const optimalSize = getOptimalImageSize(viewportWidth);
  const srcSet = generateSrcSet(src);

  // Effect to handle viewport resize
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Effect to handle intersection observer for lazy loading
  useEffect(() => {
    if (!lazyLoad || prioritize || typeof window === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && imgRef.current) {
            // Set the src when the image is in viewport
            if (imgRef.current.getAttribute('data-src')) {
              imgRef.current.src = imgRef.current.getAttribute('data-src') || '';
              if (srcSet) {
                imgRef.current.srcset = srcSet;
              }
              observer.unobserve(imgRef.current);
            }
          }
        });
      },
      {
        rootMargin: '200px', // Load images 200px before they appear in viewport
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [lazyLoad, prioritize, src, srcSet]);

  // Handle load and error states
  const handleLoad = () => setLoaded(true);
  const handleError = () => {
    setError(true);
    if (fallbackSrc) {
      setLoaded(false);
    }
  };

  return (
    <div className={`relative ${className}`} style={{ aspectRatio: props.width && props.height ? `${props.width}/${props.height}` : 'auto' }}>
      {!loaded && !error && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      
      <img
        ref={imgRef}
        src={lazyLoad && !prioritize ? undefined : src}
        data-src={lazyLoad && !prioritize ? src : undefined}
        srcSet={lazyLoad && !prioritize ? undefined : srcSet}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        loading={prioritize ? 'eager' : 'lazy'}
        decoding={prioritize ? 'sync' : 'async'}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
      
      {error && fallbackSrc && (
        <img
          src={fallbackSrc}
          alt={alt}
          className="w-full h-full object-cover"
          onLoad={() => setLoaded(true)}
        />
      )}
    </div>
  );
} 