/**
 * Utility for monitoring and reporting performance metrics
 */

// Types for performance metrics
interface PerformanceMetrics {
  FCP: number; // First Contentful Paint
  LCP: number; // Largest Contentful Paint
  FID: number; // First Input Delay
  CLS: number; // Cumulative Layout Shift
  TTI: number; // Time to Interactive
  TTFB: number; // Time to First Byte
}

// Default report endpoint
const DEFAULT_REPORT_URL = '/api/performance';

/**
 * Collects and returns web vital metrics
 */
export function collectPerformanceMetrics(): Promise<Partial<PerformanceMetrics>> {
  return new Promise((resolve) => {
    // Initialize metrics object
    const metrics: Partial<PerformanceMetrics> = {};

    // Wait for the window load event to ensure metrics are available
    if (document.readyState === 'complete') {
      collectMetrics();
    } else {
      window.addEventListener('load', collectMetrics);
    }

    function collectMetrics() {
      // Use Performance API to get navigation timing
      if (window.performance) {
        const perfEntries = performance.getEntriesByType('navigation');
        if (perfEntries.length > 0) {
          const navEntry = perfEntries[0] as PerformanceNavigationTiming;
          metrics.TTFB = navEntry.responseStart;
        }
      }

      // Use PerformanceObserver to collect metrics
      if ('PerformanceObserver' in window) {
        // Observe First Contentful Paint
        observePerformanceEntry('paint', (entries) => {
          entries.getEntries().forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              metrics.FCP = entry.startTime;
            }
          });
        });

        // Observe Largest Contentful Paint
        observePerformanceEntry('largest-contentful-paint', (entries) => {
          const lastEntry = entries.getEntries().pop();
          if (lastEntry) {
            metrics.LCP = lastEntry.startTime;
          }
        });

        // Observe First Input Delay
        observePerformanceEntry('first-input', (entries) => {
          const firstInput = entries.getEntries()[0];
          if (firstInput) {
            metrics.FID = firstInput.processingStart - firstInput.startTime;
          }
        });

        // Observe Layout Shifts
        let cumulativeLayoutShift = 0;
        observePerformanceEntry('layout-shift', (entries) => {
          entries.getEntries().forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              cumulativeLayoutShift += entry.value;
            }
          });
          metrics.CLS = cumulativeLayoutShift;
        });

        // Resolve after a slight delay to ensure metrics have been collected
        setTimeout(() => {
          resolve(metrics);
        }, 3000);
      } else {
        // If PerformanceObserver is not available, resolve with limited metrics
        resolve(metrics);
      }
    }
  });
}

/**
 * Helper function to observe performance entries
 */
function observePerformanceEntry(type: string, callback: (entries: PerformanceObserverEntryList) => void) {
  try {
    const observer = new PerformanceObserver(callback);
    observer.observe({ type, buffered: true });
    return observer;
  } catch (e) {
    return null;
  }
}

/**
 * Reports collected metrics to an endpoint
 * @param metrics Performance metrics to report
 * @param url Optional custom endpoint URL
 */
export async function reportPerformanceMetrics(
  metrics: Partial<PerformanceMetrics>,
  url: string = DEFAULT_REPORT_URL
): Promise<void> {
  try {
    // Add user agent and URL information
    const reportData = {
      ...metrics,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };

    // Only send in production to avoid development noise
    if (process.env.NODE_ENV === 'production') {
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData),
        // Use keepalive to ensure the request completes even if page is unloading
        keepalive: true
      });
    }
  } catch (error) {
    // Silently fail if reporting metrics fails
  }
} 