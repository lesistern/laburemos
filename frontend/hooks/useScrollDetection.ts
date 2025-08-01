import { useState, useEffect, RefObject } from 'react';

interface UseScrollDetectionOptions {
  heroSearchRef?: RefObject<HTMLElement>;
  threshold?: number;
  offset?: number;
}

export const useScrollDetection = (options: UseScrollDetectionOptions = {}) => {
  const { heroSearchRef, threshold = 80, offset = 100 } = options;
  const [isScrolled, setIsScrolled] = useState(false);
  const [showHeaderSearch, setShowHeaderSearch] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      
      // Basic scroll state for header background
      setIsScrolled(scrollY > 50);
      
      // Determine when to show header search
      if (heroSearchRef?.current) {
        // Use hero search element position
        const heroSearchRect = heroSearchRef.current.getBoundingClientRect();
        const heroSearchBottom = heroSearchRect.bottom + window.scrollY;
        setShowHeaderSearch(scrollY > heroSearchBottom - offset);
      } else {
        // Fallback to threshold-based detection
        setShowHeaderSearch(scrollY > threshold);
      }
    };

    // Throttle scroll events for better performance
    let ticking = false;
    const throttledHandleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledHandleScroll, { passive: true });
    handleScroll(); // Check initial state

    return () => window.removeEventListener('scroll', throttledHandleScroll);
  }, [heroSearchRef, threshold, offset]);

  return { isScrolled, showHeaderSearch };
};