import { useState, useEffect } from "react";

const MOBILE_BREAKPOINT = 1024;

/**
 * Custom hook to detect mobile devices
 * @returns {boolean} true if the current device is mobile
 */
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= MOBILE_BREAKPOINT;
  });

  useEffect(() => {
    // Function to check if viewport width is less than the mobile breakpoint
    const checkIsMobile = () => {
      const mobile = window.innerWidth <= MOBILE_BREAKPOINT;
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

  return isMobile;
}; 