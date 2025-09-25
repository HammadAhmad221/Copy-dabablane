import { useState, useEffect } from "react";

const MOBILE_BREAKPOINT = 768;

/**
 * Custom hook to detect mobile devices
 * @returns {boolean} true if the current device is mobile
 */
export const useIsMobile = () => {
  // Initialize with null to prevent hydration mismatch
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    // Function to check if viewport width is less than the mobile breakpoint
    const checkIsMobile = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mobile);
    };

    // Add event listener for window resize
    window.addEventListener("resize", checkIsMobile);
    
    // Initial check
    checkIsMobile();

    // Log initial detection for debugging

    // Clean up event listener on unmount
    return () => {
      window.removeEventListener("resize", checkIsMobile);
    };
  }, []);

  // Return false during SSR, true value once determined on client
  return isMobile === null ? false : isMobile;
}; 