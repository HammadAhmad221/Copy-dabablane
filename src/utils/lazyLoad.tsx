import React, { Suspense, lazy, ComponentType } from 'react';

// Fallback loading component
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-24 w-full">
    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
  </div>
);

// Type for component props
type ComponentProps<T extends ComponentType<any>> = React.ComponentPropsWithRef<T>;

/**
 * Lazy loads a component with a loading fallback
 * @param importFn - The import function that returns the component
 * @param fallback - Optional custom fallback component
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback: React.ReactNode = <LoadingFallback />
) {
  const LazyComponent = lazy(importFn);

  return (props: ComponentProps<T>) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

/**
 * Preloads a component for future use
 * @param importFn - The import function that returns the component
 */
export function preloadComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
): void {
  importFn().then();
} 