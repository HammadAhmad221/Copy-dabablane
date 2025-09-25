import React, { useEffect, useRef, useState } from 'react';

interface LazyContentProps {
  children: React.ReactNode;
  height?: string | number;
  threshold?: number;
  className?: string;
  placeholder?: React.ReactNode;
  rootMargin?: string;
}

/**
 * LazyContent component that only renders its children when visible in viewport
 * Helps reduce initial page load time by deferring non-critical content
 */
export default function LazyContent({
  children,
  height = 'auto',
  threshold = 0.1,
  className = '',
  placeholder,
  rootMargin = '200px 0px',
}: LazyContentProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasRendered, setHasRendered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || typeof IntersectionObserver === 'undefined') {
      // If no ref or IntersectionObserver not supported, render content immediately
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(containerRef.current);

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [threshold, rootMargin]);

  // After content becomes visible once, mark it as rendered
  useEffect(() => {
    if (isVisible && !hasRendered) {
      setHasRendered(true);
    }
  }, [isVisible, hasRendered]);

  // Style for height reservation to prevent layout shifts
  const containerStyle = {
    minHeight: typeof height === 'number' ? `${height}px` : height,
    contentVisibility: isVisible ? 'visible' : 'auto',
  };

  return (
    <div
      ref={containerRef}
      className={`lazycontent ${className}`}
      style={containerStyle}
      data-loaded={isVisible}
    >
      {isVisible ? (
        children
      ) : (
        placeholder || (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-primary rounded-full animate-spin"></div>
          </div>
        )
      )}
    </div>
  );
} 