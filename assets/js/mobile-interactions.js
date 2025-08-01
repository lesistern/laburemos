/**
 * Mobile Interactions JavaScript
 * LaburAR Mobile UX Optimization
 * 
 * Enhanced touch interactions, mobile navigation,
 * and responsive behaviors for optimal mobile experience
 * 
 * @author LaburAR Mobile Team
 * @version 2.0
 * @since 2025-07-20
 */

class MobileInteractionsManager {
    constructor() {
        this.isMobile = this.detectMobile();
        this.isTouch = 'ontouchstart' in window;
        this.currentTouches = new Map();
        this.pullToRefreshEnabled = false;
        this.lastScrollY = 0;
        this.scrollDirection = 'down';
        this.navbarVisible = true;
        
        // Mobile-specific settings
        this.swipeThreshold = 50;
        this.pullThreshold = 80;
        this.longPressTimeout = 500;
        
        this.init();
    }
    
    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }
    
    initialize() {
        // Only initialize mobile features on mobile devices
        if (!this.isMobile) {
            console.log('Desktop detected, skipping mobile optimizations');
            return;
        }
        
        this.setupMobileNavigation();
        this.setupTouchInteractions();
        this.setupSwipeGestures();
        this.setupPullToRefresh();
        this.setupMobileSearch();
        this.setupMobileFilters();
        this.setupMobileModals();
        this.setupScrollOptimizations();
        this.setupViewportOptimizations();
        this.setupHapticFeedback();
        this.setupMobileKeyboard();
        
        // Add mobile class to body
        document.body.classList.add('mobile-device');
        
        if (this.isTouch) {
            document.body.classList.add('touch-device');
        }
        
        console.log('Mobile interactions initialized successfully');
    }
    
    detectMobile() {
        // More comprehensive mobile detection
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        
        // Check for mobile user agents
        const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
        
        // Check for screen size
        const screenWidth = window.innerWidth || document.documentElement.clientWidth;
        const isMobileScreen = screenWidth <= 768;
        
        // Check for touch capability
        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        return mobileRegex.test(userAgent) || (isMobileScreen && hasTouch);
    }
    
    // === MOBILE NAVIGATION ===
    setupMobileNavigation() {
        this.createMobileNavigation();
        this.setupNavigationBehavior();
    }
    
    createMobileNavigation() {
        // Check if mobile nav already exists
        if (document.querySelector('.mobile-nav')) return;
        
        const mobileNav = document.createElement('nav');
        mobileNav.className = 'mobile-nav';
        mobileNav.innerHTML = `
            <div class="mobile-nav-items">
                <a href="/Laburar/" class="mobile-nav-item" data-nav="home">
                    <svg class="mobile-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
                        <path d="M9 22V12h6v10"/>
                    </svg>
                    <span class="mobile-nav-label">Inicio</span>
                </a>
                <a href="/Laburar/marketplace.html" class="mobile-nav-item" data-nav="marketplace">
                    <svg class="mobile-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="9" cy="21" r="1"/>
                        <circle cx="20" cy="21" r="1"/>
                        <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
                    </svg>
                    <span class="mobile-nav-label">Servicios</span>
                </a>
                <a href="/Laburar/projects.html" class="mobile-nav-item" data-nav="projects">
                    <svg class="mobile-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                    </svg>
                    <span class="mobile-nav-label">Proyectos</span>
                </a>
                <a href="/Laburar/chat.html" class="mobile-nav-item" data-nav="chat">
                    <svg class="mobile-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                    </svg>
                    <span class="mobile-nav-label">Mensajes</span>
                </a>
                <a href="/Laburar/profile.html" class="mobile-nav-item" data-nav="profile">
                    <svg class="mobile-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <span class="mobile-nav-label">Perfil</span>
                </a>
            </div>
        `;
        
        document.body.appendChild(mobileNav);
        
        // Set active state based on current page
        this.updateActiveNavItem();
        
        // Add click handlers
        mobileNav.addEventListener('click', (e) => {
            const navItem = e.target.closest('.mobile-nav-item');
            if (navItem) {
                this.handleNavItemClick(navItem);
            }
        });
    }
    
    updateActiveNavItem() {
        const currentPath = window.location.pathname;
        const navItems = document.querySelectorAll('.mobile-nav-item');
        
        navItems.forEach(item => {
            item.classList.remove('active');
            
            const href = item.getAttribute('href');
            if (href && currentPath.includes(href.split('/').pop())) {
                item.classList.add('active');
            }
        });
    }
    
    handleNavItemClick(navItem) {
        // Add visual feedback
        navItem.style.transform = 'scale(0.95)';
        setTimeout(() => {
            navItem.style.transform = '';
        }, 150);
        
        // Trigger haptic feedback
        this.triggerHapticFeedback('light');
    }
    
    setupNavigationBehavior() {
        let lastScrollY = window.pageYOffset;
        let ticking = false;
        
        const updateNavVisibility = () => {
            const currentScrollY = window.pageYOffset;
            const scrollDelta = Math.abs(currentScrollY - lastScrollY);
            
            // Only update if scroll is significant
            if (scrollDelta < 5) return;
            
            const mobileNav = document.querySelector('.mobile-nav');
            if (!mobileNav) return;
            
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                // Scrolling down - hide nav
                mobileNav.style.transform = 'translateY(100%)';
                this.navbarVisible = false;
            } else {
                // Scrolling up - show nav
                mobileNav.style.transform = 'translateY(0)';
                this.navbarVisible = true;
            }
            
            lastScrollY = currentScrollY;
            ticking = false;
        };
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateNavVisibility);
                ticking = true;
            }
        }, { passive: true });
    }
    
    // === TOUCH INTERACTIONS ===
    setupTouchInteractions() {
        // Enhanced touch feedback for all interactive elements
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
        document.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: true });
        
        // Add touch feedback class to interactive elements
        this.addTouchFeedback();
    }
    
    addTouchFeedback() {
        const selectors = [
            '.btn',
            '.mobile-nav-item',
            '.mobile-card-action',
            '.mobile-filter-option',
            '.service-card-professional',
            '.freelancer-card-professional',
            'button',
            '[role="button"]'
        ];
        
        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(element => {
                if (!element.classList.contains('touch-feedback')) {
                    element.classList.add('touch-feedback');
                }
            });
        });
    }
    
    handleTouchStart(e) {
        const target = e.target.closest('.touch-feedback');
        if (!target) return;
        
        const touch = e.touches[0];
        const touchId = touch.identifier;
        
        // Store touch information
        this.currentTouches.set(touchId, {
            target: target,
            startX: touch.clientX,
            startY: touch.clientY,
            startTime: Date.now()
        });
        
        // Add active state
        target.classList.add('touch-active');
        
        // Setup long press detection
        const longPressTimer = setTimeout(() => {
            if (this.currentTouches.has(touchId)) {
                this.handleLongPress(target, touch);
            }
        }, this.longPressTimeout);
        
        this.currentTouches.get(touchId).longPressTimer = longPressTimer;
    }
    
    handleTouchEnd(e) {
        e.changedTouches.forEach(touch => {
            const touchData = this.currentTouches.get(touch.identifier);
            if (!touchData) return;
            
            const { target, startX, startY, startTime, longPressTimer } = touchData;
            
            // Clear long press timer
            if (longPressTimer) {
                clearTimeout(longPressTimer);
            }
            
            // Remove active state
            target.classList.remove('touch-active');
            
            // Calculate touch metrics
            const deltaX = touch.clientX - startX;
            const deltaY = touch.clientY - startY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const duration = Date.now() - startTime;
            
            // Determine if this was a valid tap
            if (distance < 10 && duration < 500) {
                this.triggerHapticFeedback('light');
            }
            
            this.currentTouches.delete(touch.identifier);
        });
    }
    
    handleTouchCancel(e) {
        e.changedTouches.forEach(touch => {
            const touchData = this.currentTouches.get(touch.identifier);
            if (!touchData) return;
            
            const { target, longPressTimer } = touchData;
            
            if (longPressTimer) {
                clearTimeout(longPressTimer);
            }
            
            target.classList.remove('touch-active');
            this.currentTouches.delete(touch.identifier);
        });
    }
    
    handleLongPress(target, touch) {
        // Trigger haptic feedback for long press
        this.triggerHapticFeedback('medium');
        
        // Add long press class
        target.classList.add('long-pressed');
        
        // Emit custom event
        target.dispatchEvent(new CustomEvent('longpress', {
            detail: { x: touch.clientX, y: touch.clientY }
        }));
        
        // Remove class after animation
        setTimeout(() => {
            target.classList.remove('long-pressed');
        }, 200);
    }
    
    // === SWIPE GESTURES ===
    setupSwipeGestures() {
        let startX = 0;
        let startY = 0;
        let isSwipe = false;
        
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length !== 1) return;
            
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            isSwipe = false;
        }, { passive: true });
        
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length !== 1 || isSwipe) return;
            
            const touch = e.touches[0];
            const deltaX = touch.clientX - startX;
            const deltaY = touch.clientY - startY;
            
            // Check if this is a horizontal swipe
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > this.swipeThreshold) {
                isSwipe = true;
                
                if (deltaX > 0) {
                    this.handleSwipeRight(e);
                } else {
                    this.handleSwipeLeft(e);
                }
            }
        }, { passive: true });
    }
    
    handleSwipeRight(e) {
        // Swipe right - could be used for navigation or actions
        const target = e.target.closest('.swipeable');
        
        if (target) {
            target.dispatchEvent(new CustomEvent('swiperight'));
            this.triggerHapticFeedback('light');
        }
        
        // Global swipe right behavior (e.g., go back)
        if (window.history.length > 1) {
            // Could implement back navigation
        }
    }
    
    handleSwipeLeft(e) {
        // Swipe left - could be used for actions or navigation
        const target = e.target.closest('.swipeable');
        
        if (target) {
            target.dispatchEvent(new CustomEvent('swipeleft'));
            this.triggerHapticFeedback('light');
        }
    }
    
    // === PULL TO REFRESH ===
    setupPullToRefresh() {
        const refreshContainers = document.querySelectorAll('.mobile-pull-refresh');
        
        refreshContainers.forEach(container => {
            this.enablePullToRefresh(container);
        });
    }
    
    enablePullToRefresh(container) {
        let startY = 0;
        let currentY = 0;
        let isPulling = false;
        let isRefreshing = false;
        
        const pullIndicator = container.querySelector('.mobile-pull-indicator');
        const pullArrow = container.querySelector('.mobile-pull-arrow');
        
        container.addEventListener('touchstart', (e) => {
            if (container.scrollTop === 0 && !isRefreshing) {
                startY = e.touches[0].clientY;
                isPulling = true;
            }
        }, { passive: true });
        
        container.addEventListener('touchmove', (e) => {
            if (!isPulling || isRefreshing) return;
            
            currentY = e.touches[0].clientY;
            const pullDistance = currentY - startY;
            
            if (pullDistance > 0) {
                e.preventDefault();
                
                const pullRatio = Math.min(pullDistance / this.pullThreshold, 1);
                const translateY = pullDistance * 0.5;
                
                container.style.transform = `translateY(${translateY}px)`;
                
                if (pullIndicator) {
                    pullIndicator.style.opacity = pullRatio;
                    pullIndicator.style.transform = `translateX(-50%) scale(${pullRatio})`;
                }
                
                if (pullArrow) {
                    pullArrow.style.transform = `rotate(${pullRatio * 180}deg)`;
                }
                
                if (pullDistance > this.pullThreshold) {
                    container.classList.add('pulling');
                    this.triggerHapticFeedback('medium');
                } else {
                    container.classList.remove('pulling');
                }
            }
        });
        
        container.addEventListener('touchend', async (e) => {
            if (!isPulling || isRefreshing) return;
            
            const pullDistance = currentY - startY;
            
            if (pullDistance > this.pullThreshold) {
                // Trigger refresh
                isRefreshing = true;
                container.classList.add('refreshing');
                container.classList.remove('pulling');
                
                // Trigger refresh event
                const refreshEvent = new CustomEvent('pullrefresh');
                container.dispatchEvent(refreshEvent);
                
                // Simulate refresh (replace with actual refresh logic)
                await this.performRefresh(container);
                
                // Complete refresh
                this.completeRefresh(container);
                isRefreshing = false;
            }
            
            // Reset UI
            container.style.transform = '';
            if (pullIndicator) {
                pullIndicator.style.opacity = '';
                pullIndicator.style.transform = '';
            }
            if (pullArrow) {
                pullArrow.style.transform = '';
            }
            
            isPulling = false;
            startY = 0;
            currentY = 0;
        });
    }
    
    async performRefresh(container) {
        // Simulate network request
        return new Promise(resolve => {
            setTimeout(resolve, 1500);
        });
    }
    
    completeRefresh(container) {
        container.classList.remove('refreshing');
        
        // Show completion feedback
        this.triggerHapticFeedback('success');
        
        // Could show toast notification
        if (window.showToast) {
            window.showToast('Contenido actualizado', 'success', 2000);
        }
    }
    
    // === MOBILE SEARCH ===
    setupMobileSearch() {
        const mobileSearch = document.querySelector('.mobile-search');
        if (!mobileSearch) return;
        
        const searchInput = mobileSearch.querySelector('.mobile-search-input');
        const filterBtn = mobileSearch.querySelector('.mobile-filter-btn');
        
        if (searchInput) {
            // Prevent zoom on focus (iOS)
            searchInput.addEventListener('focus', () => {
                // Scroll to top to ensure input is visible
                window.scrollTo(0, 0);
            });
            
            // Handle search input
            searchInput.addEventListener('input', this.debounce((e) => {
                this.handleMobileSearch(e.target.value);
            }, 300));
        }
        
        if (filterBtn) {
            filterBtn.addEventListener('click', () => {
                this.openMobileFilters();
            });
        }
    }
    
    handleMobileSearch(query) {
        // Trigger search with mobile-optimized results
        if (window.laburAR?.advancedSearch) {
            window.laburAR.advancedSearch.performSearch(query);
        }
        
        // Show mobile search results
        this.showMobileSearchResults(query);
    }
    
    showMobileSearchResults(query) {
        // Implementation for mobile search results display
        console.log('Mobile search for:', query);
    }
    
    // === MOBILE FILTERS ===
    setupMobileFilters() {
        const filterBtn = document.querySelector('.mobile-filter-btn');
        const filtersModal = document.querySelector('.mobile-filters');
        const closeBtn = filtersModal?.querySelector('.mobile-filters-close');
        const clearBtn = filtersModal?.querySelector('.mobile-filter-clear');
        const applyBtn = filtersModal?.querySelector('.mobile-filter-apply');
        
        if (filterBtn && filtersModal) {
            filterBtn.addEventListener('click', () => {
                this.openMobileFilters();
            });
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeMobileFilters();
            });
        }
        
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearMobileFilters();
            });
        }
        
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                this.applyMobileFilters();
            });
        }
        
        // Setup filter options
        this.setupFilterOptions();
    }
    
    setupFilterOptions() {
        document.addEventListener('click', (e) => {
            const filterOption = e.target.closest('.mobile-filter-option');
            if (filterOption) {
                filterOption.classList.toggle('selected');
                this.triggerHapticFeedback('light');
            }
        });
    }
    
    openMobileFilters() {
        const filtersModal = document.querySelector('.mobile-filters');
        if (filtersModal) {
            filtersModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            this.triggerHapticFeedback('medium');
        }
    }
    
    closeMobileFilters() {
        const filtersModal = document.querySelector('.mobile-filters');
        if (filtersModal) {
            filtersModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
    
    clearMobileFilters() {
        document.querySelectorAll('.mobile-filter-option.selected').forEach(option => {
            option.classList.remove('selected');
        });
        this.triggerHapticFeedback('light');
    }
    
    applyMobileFilters() {
        const selectedFilters = Array.from(document.querySelectorAll('.mobile-filter-option.selected'))
            .map(option => ({
                type: option.dataset.filterType,
                value: option.dataset.filterValue
            }));
        
        // Apply filters to search
        console.log('Applying mobile filters:', selectedFilters);
        
        this.closeMobileFilters();
        this.triggerHapticFeedback('success');
    }
    
    // === MOBILE MODALS ===
    setupMobileModals() {
        // Setup modal triggers
        document.addEventListener('click', (e) => {
            const modalTrigger = e.target.closest('[data-mobile-modal]');
            if (modalTrigger) {
                const modalId = modalTrigger.dataset.mobileModal;
                this.openMobileModal(modalId);
            }
        });
        
        // Setup modal close buttons
        document.addEventListener('click', (e) => {
            const closeBtn = e.target.closest('.mobile-modal-close');
            if (closeBtn) {
                const modal = closeBtn.closest('.mobile-modal');
                if (modal) {
                    this.closeMobileModal(modal);
                }
            }
        });
    }
    
    openMobileModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            this.triggerHapticFeedback('medium');
        }
    }
    
    closeMobileModal(modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    // === SCROLL OPTIMIZATIONS ===
    setupScrollOptimizations() {
        // Smooth scrolling for mobile
        if (CSS.supports('scroll-behavior', 'smooth')) {
            document.documentElement.style.scrollBehavior = 'smooth';
        }
        
        // Optimize scroll performance
        let scrollTimeout;
        
        window.addEventListener('scroll', () => {
            // Clear existing timeout
            clearTimeout(scrollTimeout);
            
            // Add scrolling class for styling
            document.body.classList.add('is-scrolling');
            
            // Remove class after scroll ends
            scrollTimeout = setTimeout(() => {
                document.body.classList.remove('is-scrolling');
            }, 150);
        }, { passive: true });
    }
    
    // === VIEWPORT OPTIMIZATIONS ===
    setupViewportOptimizations() {
        // Handle viewport changes (e.g., keyboard open/close)
        let initialViewportHeight = window.innerHeight;
        
        window.addEventListener('resize', () => {
            const currentHeight = window.innerHeight;
            const heightDifference = initialViewportHeight - currentHeight;
            
            // Detect if mobile keyboard is likely open
            if (heightDifference > 150) {
                document.body.classList.add('keyboard-open');
                this.handleKeyboardOpen();
            } else {
                document.body.classList.remove('keyboard-open');
                this.handleKeyboardClose();
            }
        });
        
        // Handle orientation changes
        window.addEventListener('orientationchange', () => {
            // Wait for orientation change to complete
            setTimeout(() => {
                initialViewportHeight = window.innerHeight;
                this.handleOrientationChange();
            }, 500);
        });
    }
    
    handleKeyboardOpen() {
        // Hide bottom navigation when keyboard is open
        const mobileNav = document.querySelector('.mobile-nav');
        if (mobileNav) {
            mobileNav.style.display = 'none';
        }
    }
    
    handleKeyboardClose() {
        // Show bottom navigation when keyboard closes
        const mobileNav = document.querySelector('.mobile-nav');
        if (mobileNav) {
            mobileNav.style.display = '';
        }
    }
    
    handleOrientationChange() {
        // Refresh layout on orientation change
        if (window.laburAR?.microInteractions) {
            window.laburAR.microInteractions.addScrollReveal('.mobile-service-card');
        }
    }
    
    // === HAPTIC FEEDBACK ===
    setupHapticFeedback() {
        // Check if vibration API is available
        this.vibrationSupported = 'vibrate' in navigator;
    }
    
    triggerHapticFeedback(type = 'light') {
        if (!this.vibrationSupported) return;
        
        const patterns = {
            light: [10],
            medium: [20],
            heavy: [50],
            success: [10, 50, 10],
            error: [50, 100, 50],
            warning: [30, 30, 30]
        };
        
        const pattern = patterns[type] || patterns.light;
        navigator.vibrate(pattern);
    }
    
    // === MOBILE KEYBOARD ===
    setupMobileKeyboard() {
        // Better keyboard handling for inputs
        document.addEventListener('focusin', (e) => {
            if (e.target.matches('input, textarea, select')) {
                this.handleInputFocus(e.target);
            }
        });
        
        document.addEventListener('focusout', (e) => {
            if (e.target.matches('input, textarea, select')) {
                this.handleInputBlur(e.target);
            }
        });
    }
    
    handleInputFocus(input) {
        // Ensure input is visible above keyboard
        setTimeout(() => {
            input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
        
        // Add focused class for styling
        input.closest('.mobile-form-group')?.classList.add('focused');
    }
    
    handleInputBlur(input) {
        // Remove focused class
        input.closest('.mobile-form-group')?.classList.remove('focused');
    }
    
    // === UTILITY METHODS ===
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // === PUBLIC METHODS ===
    
    // Force mobile navigation update
    updateMobileNavigation() {
        this.updateActiveNavItem();
    }
    
    // Show/hide mobile navigation
    setMobileNavVisible(visible) {
        const mobileNav = document.querySelector('.mobile-nav');
        if (mobileNav) {
            mobileNav.style.transform = visible ? 'translateY(0)' : 'translateY(100%)';
            this.navbarVisible = visible;
        }
    }
    
    // Enable/disable pull to refresh
    setPullToRefreshEnabled(enabled) {
        this.pullToRefreshEnabled = enabled;
        
        const containers = document.querySelectorAll('.mobile-pull-refresh');
        containers.forEach(container => {
            if (enabled) {
                this.enablePullToRefresh(container);
            } else {
                container.style.transform = '';
                container.classList.remove('pulling', 'refreshing');
            }
        });
    }
    
    // Get mobile device info
    getMobileInfo() {
        return {
            isMobile: this.isMobile,
            isTouch: this.isTouch,
            vibrationSupported: this.vibrationSupported,
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
            orientation: screen.orientation?.angle || 0
        };
    }
}

// Initialize mobile interactions
document.addEventListener('DOMContentLoaded', () => {
    window.laburAR = window.laburAR || {};
    window.laburAR.mobileInteractions = new MobileInteractionsManager();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileInteractionsManager;
}