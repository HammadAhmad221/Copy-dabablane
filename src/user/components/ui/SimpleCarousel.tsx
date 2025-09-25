import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/user/lib/utils';

interface SimpleCarouselProps {
  images: string[];
  altText: string;
  badges?: React.ReactNode;
  aspectRatio?: string;
  className?: string;
  imgClassName?: string;
  onImageClick?: () => void;
  priority?: boolean;
  fetchPriority?: "high" | "low" | "auto";
}

/**
 * A simplified carousel component that uses fewer DOM elements 
 * than the full shadcn/ui carousel implementation
 */
const SimpleCarousel: React.FC<SimpleCarouselProps> = ({
  images,
  altText,
  badges,
  aspectRatio = "aspect-[4/3]",
  className = "",
  imgClassName = "",
  onImageClick,
  priority = false,
  fetchPriority = "auto"
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Go to specific slide
  const goToSlide = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 300); // Match transition time
  }, [isTransitioning]);
  
  // Next slide
  const nextSlide = useCallback(() => {
    if (images.length <= 1) return;
    const newIndex = (currentIndex + 1) % images.length;
    goToSlide(newIndex);
  }, [currentIndex, goToSlide, images.length]);
  
  // Prev slide
  const prevSlide = useCallback(() => {
    if (images.length <= 1) return;
    const newIndex = (currentIndex - 1 + images.length) % images.length;
    goToSlide(newIndex);
  }, [currentIndex, goToSlide, images.length]);
  
  // Auto advance slides 
  useEffect(() => {
    if (images.length <= 1) return;
    
    const interval = setInterval(nextSlide, 5000); // 5 seconds
    return () => clearInterval(interval);
  }, [nextSlide, images.length]);
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);
  
  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div 
      className={cn("relative overflow-hidden", aspectRatio, className)}
      onClick={onImageClick}
    >
      {/* Images - absolutely positioned, not nested */}
      {images.map((src, idx) => (
        <img
          key={idx}
          src={src}
          alt={`${altText} - ${idx + 1}`} 
          loading={idx === 0 && priority ? "eager" : "lazy"}
          fetchpriority={idx === 0 && priority ? fetchPriority : "auto"}
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-300",
            idx === currentIndex ? "opacity-100" : "opacity-0",
            imgClassName
          )}
        />
      ))}
      
      {/* Navigation buttons - only show if multiple images */}
      {images.length > 1 && (
        <>
          {/* Left/Right buttons */}
          <button 
            onClick={(e) => { e.stopPropagation(); prevSlide(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-white bg-black/20 hover:bg-black/40 rounded-full"
            aria-label="Previous image"
          >
            ‹
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); nextSlide(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-white bg-black/20 hover:bg-black/40 rounded-full"
            aria-label="Next image"
          >
            ›
          </button>
          
          {/* Indicators */}
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); goToSlide(idx); }}
                aria-label={`Go to image ${idx + 1}`}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  idx === currentIndex ? "w-6 bg-white" : "w-1.5 bg-white/60 hover:bg-white/80"
                )}
              />
            ))}
          </div>
        </>
      )}
      
      {/* Badges - pass through as children */}
      {badges}
    </div>
  );
};

export default SimpleCarousel; 