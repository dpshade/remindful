import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768; // Example breakpoint: adjust as needed

export function useWindowSize() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    window.addEventListener('resize', handleResize);

    // Initial check in case the initial render is wrong (e.g., SSR)
    handleResize();

    // Cleanup listener on component unmount
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty array ensures effect is only run on mount and unmount

  return { isMobile };
} 