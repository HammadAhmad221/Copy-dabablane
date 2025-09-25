/**
 * Utility to optimize third-party resources loading with resource hints
 */

interface ResourceHint {
  url: string;
  type: 'preconnect' | 'dns-prefetch' | 'preload' | 'prefetch';
  as?: string;
  crossOrigin?: boolean;
}

/**
 * Adds resource hints to improve loading performance
 * @param resources Array of resource hints to add
 */
export function addResourceHints(resources: ResourceHint[]): void {
  if (typeof document === 'undefined') return;

  // Keep track of which resources we've already processed
  const processedUrls = new Map<string, boolean>();

  resources.forEach(resource => {
    const key = `${resource.type}:${resource.url}`;
    
    // Skip if we've already processed this exact resource
    if (processedUrls.has(key)) return;
    processedUrls.set(key, true);
    
    // For preload and prefetch, verify the resource exists first
    if ((resource.type === 'preload' || resource.type === 'prefetch') && resource.as === 'image') {
      checkImageExists(resource);
    } else {
      addResourceHint(resource);
    }
  });
}

/**
 * Checks if an image exists before adding a preload/prefetch hint
 */
function checkImageExists(resource: ResourceHint): void {
  const img = new Image();
  
  img.onload = () => {
    // Image exists, add the resource hint
    addResourceHint(resource);
  };
  
  img.onerror = () => {
    // Skip resource that couldn't be found
  };
  
  // Start the check
  img.src = resource.url;
}

/**
 * Adds a single resource hint to the document head
 */
function addResourceHint(resource: ResourceHint): void {
  const link = document.createElement('link');
  link.rel = resource.type;
  link.href = resource.url;
  
  if (resource.as && (resource.type === 'preload' || resource.type === 'prefetch')) {
    link.setAttribute('as', resource.as);
  }
  
  if (resource.crossOrigin) {
    link.setAttribute('crossorigin', '');
  }
  
  // Check if this link already exists to avoid duplicates
  const existingLink = document.querySelector(`link[rel="${resource.type}"][href="${resource.url}"]`);
  if (!existingLink) {
    document.head.appendChild(link);
  }
}

/**
 * Adds delayed resource hints after the page has loaded
 * @param resources Array of resource hints to add after page load
 */
export function addDelayedResourceHints(resources: ResourceHint[]): void {
  if (typeof window === 'undefined') return;
  
  if (document.readyState === 'complete') {
    setTimeout(() => addResourceHints(resources), 2000);
  } else {
    window.addEventListener('load', () => {
      setTimeout(() => addResourceHints(resources), 2000);
    });
  }
}

/**
 * Optimize third-party scripts by delaying non-critical ones
 * @param scriptUrl URL of the script to load
 * @param async Whether to load the script asynchronously
 * @param defer Whether to defer the script loading
 * @param delay Milliseconds to delay loading (0 for immediate)
 */
export function loadOptimizedScript(
  scriptUrl: string,
  async: boolean = true,
  defer: boolean = true,
  delay: number = 0
): void {
  if (typeof window === 'undefined') return;

  const loadScript = () => {
    const script = document.createElement('script');
    script.src = scriptUrl;
    if (async) script.async = true;
    if (defer) script.defer = true;
    document.body.appendChild(script);
  };

  if (delay > 0) {
    if (document.readyState === 'complete') {
      setTimeout(loadScript, delay);
    } else {
      window.addEventListener('load', () => {
        setTimeout(loadScript, delay);
      });
    }
  } else {
    loadScript();
  }
} 