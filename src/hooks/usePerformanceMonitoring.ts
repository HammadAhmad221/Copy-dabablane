import { useEffect, useRef } from 'react';
import { collectPerformanceMetrics, reportPerformanceMetrics } from '../utils/performanceMonitor';

/**
 * Hook to monitor component performance
 * @param componentName The name of the component being monitored
 */
export function usePerformanceMonitoring(componentName: string): void {
  const renderTimeRef = useRef<number>(performance.now());
  const hasReportedRef = useRef<boolean>(false);

  useEffect(() => {
    // Record component mount time
    const mountTime = performance.now() - renderTimeRef.current;
    
    // Create a mark for this component render
    if (performance.mark) {
      performance.mark(`${componentName}-mounted`);
    }

    // Report heavy components or slow renders
    if (mountTime > 100 && !hasReportedRef.current) {
      console.warn(`Component ${componentName} took ${mountTime.toFixed(2)}ms to render`);
      hasReportedRef.current = true;
    }

    // Return cleanup function to measure unmount as well
    return () => {
      if (performance.mark && performance.measure) {
        try {
          // Measure component lifecycle
          performance.mark(`${componentName}-unmounted`);
          performance.measure(
            `${componentName}-lifecycle`,
            `${componentName}-mounted`,
            `${componentName}-unmounted`
          );
        } catch (e) {
          // Ignore errors with performance API
        }
      }
    };
  }, [componentName]);

  // Additional monitoring once per page visit
  useEffect(() => {
    // Only collect full page metrics once
    const hasCollected = window.__HAS_COLLECTED_METRICS__;
    if (!hasCollected && typeof window !== 'undefined') {
      window.__HAS_COLLECTED_METRICS__ = true;
      
      // Wait for page to be fully loaded and idle
      window.addEventListener('load', () => {
        // Use requestIdleCallback to avoid blocking the main thread
        if ('requestIdleCallback' in window) {
          window.requestIdleCallback(() => {
            collectPerformanceMetrics().then(metrics => {
              reportPerformanceMetrics(metrics);
            });
          }, { timeout: 5000 });
        } else {
          // Fallback for browsers without requestIdleCallback
          setTimeout(() => {
            collectPerformanceMetrics().then(metrics => {
              reportPerformanceMetrics(metrics);
            });
          }, 3000);
        }
      });
    }
  }, []);
}

// Augment the Window interface
declare global {
  interface Window {
    __HAS_COLLECTED_METRICS__?: boolean;
    requestIdleCallback: (callback: () => void, options?: { timeout: number }) => number;
  }
} 