import { useCallback, useEffect, useRef } from 'react';

/**
 * useAccessibility Hook
 * 
 * Provides accessibility utilities for:
 * - Screen reader announcements
 * - Focus management
 * - Keyboard navigation
 * - ARIA live regions
 * - Skip links
 */
export const useAccessibility = () => {
  const liveRegionRef = useRef<HTMLDivElement | null>(null);
  const skipLinksRef = useRef<HTMLDivElement | null>(null);

  // Initialize live region for screen reader announcements
  useEffect(() => {
    if (!liveRegionRef.current) {
      const liveRegion = document.createElement('div');
      liveRegion.id = 'live-region';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      liveRegion.style.cssText = `
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
      `;
      
      document.body.appendChild(liveRegion);
      liveRegionRef.current = liveRegion;
    }

    // Cleanup on unmount
    return () => {
      if (liveRegionRef.current && document.body.contains(liveRegionRef.current)) {
        document.body.removeChild(liveRegionRef.current);
      }
    };
  }, []);

  // Announce message to screen readers
  const announceToScreenReader = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!liveRegionRef.current) return;

    liveRegionRef.current.setAttribute('aria-live', priority);
    liveRegionRef.current.textContent = message;

    // Clear the message after a short delay to allow for re-announcements
    setTimeout(() => {
      if (liveRegionRef.current) {
        liveRegionRef.current.textContent = '';
      }
    }, 1000);
  }, []);

  // Focus management utilities
  const focusManagement = {
    // Focus an element by selector or ref
    focusElement: useCallback((selectorOrElement: string | HTMLElement | null) => {
      let element: HTMLElement | null = null;

      if (typeof selectorOrElement === 'string') {
        element = document.querySelector(selectorOrElement);
      } else {
        element = selectorOrElement;
      }

      if (element) {
        // Make element focusable if it's not already
        if (!element.hasAttribute('tabindex') && !element.matches('a, button, input, select, textarea')) {
          element.setAttribute('tabindex', '-1');
        }

        element.focus();
        
        // Scroll into view if needed
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }, []),

    // Get the currently focused element
    getCurrentFocus: useCallback((): HTMLElement | null => {
      return document.activeElement as HTMLElement;
    }, []),

    // Set focus to the first focusable element in a container
    focusFirstElement: useCallback((container: HTMLElement | string) => {
      const containerElement = typeof container === 'string' 
        ? document.querySelector(container) 
        : container;

      if (!containerElement) return;

      const focusableElements = containerElement.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      const firstElement = focusableElements[0] as HTMLElement;
      if (firstElement) {
        firstElement.focus();
      }
    }, []),

    // Trap focus within a container
    trapFocus: useCallback((container: HTMLElement) => {
      const focusableElements = container.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ) as NodeListOf<HTMLElement>;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key !== 'Tab') return;

        if (event.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      };

      container.addEventListener('keydown', handleKeyDown);

      // Return cleanup function
      return () => {
        container.removeEventListener('keydown', handleKeyDown);
      };
    }, []),
  };

  // Keyboard navigation utilities
  const keyboardNavigation = {
    // Handle arrow key navigation for lists/grids
    handleArrowNavigation: useCallback((
      event: KeyboardEvent,
      container: HTMLElement,
      options: {
        direction: 'horizontal' | 'vertical' | 'grid';
        wrap?: boolean;
        itemSelector?: string;
      } = { direction: 'vertical' }
    ) => {
      const { direction, wrap = true, itemSelector = '[role="button"], button, a[href]' } = options;
      const items = Array.from(container.querySelectorAll(itemSelector)) as HTMLElement[];
      const currentIndex = items.indexOf(document.activeElement as HTMLElement);

      if (currentIndex === -1) return;

      let nextIndex = currentIndex;

      switch (event.key) {
        case 'ArrowUp':
          if (direction === 'vertical' || direction === 'grid') {
            event.preventDefault();
            nextIndex = currentIndex - 1;
            if (nextIndex < 0 && wrap) {
              nextIndex = items.length - 1;
            }
          }
          break;

        case 'ArrowDown':
          if (direction === 'vertical' || direction === 'grid') {
            event.preventDefault();
            nextIndex = currentIndex + 1;
            if (nextIndex >= items.length && wrap) {
              nextIndex = 0;
            }
          }
          break;

        case 'ArrowLeft':
          if (direction === 'horizontal' || direction === 'grid') {
            event.preventDefault();
            nextIndex = currentIndex - 1;
            if (nextIndex < 0 && wrap) {
              nextIndex = items.length - 1;
            }
          }
          break;

        case 'ArrowRight':
          if (direction === 'horizontal' || direction === 'grid') {
            event.preventDefault();
            nextIndex = currentIndex + 1;
            if (nextIndex >= items.length && wrap) {
              nextIndex = 0;
            }
          }
          break;

        case 'Home':
          event.preventDefault();
          nextIndex = 0;
          break;

        case 'End':
          event.preventDefault();
          nextIndex = items.length - 1;
          break;
      }

      if (nextIndex >= 0 && nextIndex < items.length) {
        items[nextIndex].focus();
      }
    }, []),

    // Handle escape key to close modals/dropdowns
    handleEscapeKey: useCallback((callback: () => void) => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          callback();
        }
      };

      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, []),
  };

  // ARIA utilities
  const ariaUtilities = {
    // Generate unique IDs for ARIA relationships
    generateId: useCallback((prefix: string = 'a11y'): string => {
      return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
    }, []),

    // Set up describedby relationship
    setDescribedBy: useCallback((element: HTMLElement, describingElement: HTMLElement) => {
      if (!describingElement.id) {
        describingElement.id = ariaUtilities.generateId('desc');
      }
      element.setAttribute('aria-describedby', describingElement.id);
    }, []),

    // Set up labelledby relationship
    setLabelledBy: useCallback((element: HTMLElement, labelElement: HTMLElement) => {
      if (!labelElement.id) {
        labelElement.id = ariaUtilities.generateId('label');
      }
      element.setAttribute('aria-labelledby', labelElement.id);
    }, []),

    // Update ARIA live region
    updateLiveRegion: useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
      announceToScreenReader(message, priority);
    }, [announceToScreenReader]),
  };

  // Skip links utilities
  const skipLinks = {
    // Add skip link to page
    addSkipLink: useCallback((target: string, label: string) => {
      if (!skipLinksRef.current) {
        const skipLinksContainer = document.createElement('div');
        skipLinksContainer.className = 'skip-links';
        skipLinksContainer.style.cssText = `
          position: absolute;
          top: -40px;
          left: 6px;
          z-index: 10000;
        `;
        document.body.insertBefore(skipLinksContainer, document.body.firstChild);
        skipLinksRef.current = skipLinksContainer;
      }

      const skipLink = document.createElement('a');
      skipLink.href = target;
      skipLink.textContent = label;
      skipLink.className = 'skip-link';
      skipLink.style.cssText = `
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
        background: #000;
        color: #fff;
        padding: 8px 16px;
        text-decoration: none;
        border-radius: 4px;
        font-weight: bold;
        transition: all 0.2s;
      `;

      skipLink.addEventListener('focus', () => {
        skipLink.style.left = '6px';
        skipLink.style.top = '6px';
        skipLink.style.width = 'auto';
        skipLink.style.height = 'auto';
      });

      skipLink.addEventListener('blur', () => {
        skipLink.style.left = '-10000px';
        skipLink.style.width = '1px';
        skipLink.style.height = '1px';
      });

      skipLink.addEventListener('click', (event) => {
        event.preventDefault();
        focusManagement.focusElement(target);
      });

      skipLinksRef.current.appendChild(skipLink);
    }, [focusManagement.focusElement]),
  };

  // Reduced motion detection
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // High contrast detection
  const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;

  // Return all utilities
  return {
    announceToScreenReader,
    focusManagement,
    keyboardNavigation,
    ariaUtilities,
    skipLinks,
    prefersReducedMotion,
    prefersHighContrast,
  };
};

export default useAccessibility;