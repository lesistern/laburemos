/**
 * Micro-Interactions Manager - Fiverr-Level Interactive Experience
 * 
 * Professional micro-interactions, animations, and user feedback
 * with performance optimization and accessibility support
 * 
 * @author LaburAR Team
 * @version 3.0
 * @since 2025-07-20
 */

class MicroInteractionsManager {
    constructor() {
        this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        this.toastContainer = null;
        this.activeToasts = new Map();
        this.animationQueue = [];
        this.isInitialized = false;
        
        this.init();
    }
    
    init() {
        if (this.isInitialized) return;
        
        this.createToastContainer();
        this.setupRippleEffects();
        this.setupScrollAnimations();
        this.setupFormInteractions();
        this.setupProgressBars();
        this.setupModals();
        this.setupFAB();
        this.setupLoadingStates();
        this.setupHoverEffects();
        
        // Listen for reduced motion changes
        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
            this.isReducedMotion = e.matches;
        });
        
        this.isInitialized = true;
        console.log('LaburAR Micro-Interactions initialized', {
            reducedMotion: this.isReducedMotion,
            touchDevice: this.isTouchDevice
        });
    }
    
    // === TOAST NOTIFICATIONS ===
    createToastContainer() {
        if (this.toastContainer) return;
        
        this.toastContainer = document.createElement('div');
        this.toastContainer.className = 'toast-container';
        this.toastContainer.setAttribute('aria-live', 'polite');
        this.toastContainer.setAttribute('aria-atomic', 'true');
        document.body.appendChild(this.toastContainer);
    }
    
    showToast(message, type = 'info', options = {}) {
        const {
            duration = 4000,
            showProgress = true,
            closable = true,
            persistent = false,
            id = null
        } = options;
        
        const toastId = id || `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Remove existing toast with same ID
        if (this.activeToasts.has(toastId)) {
            this.hideToast(toastId);
        }
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('data-toast-id', toastId);
        
        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-icon">
                    ${this.getToastIcon(type)}
                </div>
                <div class="toast-message">${message}</div>
                ${closable ? `
                    <button class="toast-close" aria-label="Cerrar notificación">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                ` : ''}
            </div>
            ${showProgress && !persistent ? '<div class="toast-progress"></div>' : ''}
        `;
        
        // Add to container
        this.toastContainer.appendChild(toast);
        this.activeToasts.set(toastId, toast);
        
        // Setup close button
        if (closable) {
            const closeBtn = toast.querySelector('.toast-close');
            closeBtn.addEventListener('click', () => this.hideToast(toastId));
        }
        
        // Auto-hide after duration (unless persistent)
        if (!persistent && duration > 0) {
            setTimeout(() => {
                this.hideToast(toastId);
            }, duration);
        }
        
        // Trigger entrance animation
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
        });
        
        return toastId;
    }
    
    hideToast(toastId) {
        const toast = this.activeToasts.get(toastId);
        if (!toast) return;
        
        toast.classList.add('toast-dismissing');
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            this.activeToasts.delete(toastId);
        }, 300);
    }
    
    getToastIcon(type) {
        const icons = {
            success: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
            error: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
            warning: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
            info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
        };
        return icons[type] || icons.info;
    }
    
    // === RIPPLE EFFECTS ===
    setupRippleEffects() {
        document.addEventListener('click', (e) => {
            const button = e.target.closest('.btn, .card, .service-card-professional, .freelancer-card-professional');
            if (!button || this.isReducedMotion) return;
            
            this.createRipple(e, button);
        });
    }
    
    createRipple(event, element) {
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
        `;
        
        element.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }
    
    // === SCROLL ANIMATIONS ===
    setupScrollAnimations() {
        if ('IntersectionObserver' in window && !this.isReducedMotion) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.animateOnScroll(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            });
            
            // Observe elements with animation classes
            document.querySelectorAll('[data-animate], .animate-on-scroll').forEach(el => {
                observer.observe(el);
            });
        }
    }
    
    animateOnScroll(element) {
        const animationType = element.dataset.animate || 'fade-in';
        const delay = parseInt(element.dataset.delay) || 0;
        
        setTimeout(() => {
            element.classList.add(animationType);
            
            // Trigger custom event
            element.dispatchEvent(new CustomEvent('animated', {
                detail: { type: animationType }
            }));
        }, delay);
    }
    
    // === FORM INTERACTIONS ===
    setupFormInteractions() {
        // Enhanced form validation
        document.addEventListener('input', (e) => {
            if (e.target.matches('.form-input')) {
                this.handleFormInput(e.target);
            }
        });
        
        document.addEventListener('focus', (e) => {
            if (e.target.matches('.form-input')) {
                this.handleFormFocus(e.target);
            }
        });
        
        document.addEventListener('blur', (e) => {
            if (e.target.matches('.form-input')) {
                this.handleFormBlur(e.target);
            }
        });
        
        // Checkbox and radio animations
        document.addEventListener('change', (e) => {
            if (e.target.matches('input[type="checkbox"], input[type="radio"]')) {
                this.animateFormControl(e.target);
            }
        });
    }
    
    handleFormInput(input) {
        const group = input.closest('.form-group');
        if (!group) return;
        
        // Real-time validation feedback
        if (input.checkValidity()) {
            group.classList.remove('error');
            group.classList.add('valid');
        } else {
            group.classList.remove('valid');
            if (input.value) {
                group.classList.add('error');
            }
        }
    }
    
    handleFormFocus(input) {
        const group = input.closest('.form-group');
        if (group) {
            group.classList.add('focused');
        }
    }
    
    handleFormBlur(input) {
        const group = input.closest('.form-group');
        if (group) {
            group.classList.remove('focused');
        }
    }
    
    animateFormControl(control) {
        if (this.isReducedMotion) return;
        
        const wrapper = control.closest('.form-checkbox, .form-radio');
        if (wrapper) {
            wrapper.style.transform = 'scale(1.1)';
            setTimeout(() => {
                wrapper.style.transform = '';
            }, 150);
        }
    }
    
    // === PROGRESS BARS ===
    setupProgressBars() {
        this.observeProgressBars();
    }
    
    observeProgressBars() {
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.animateProgressBar(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            });
            
            document.querySelectorAll('.progress-bar-animated').forEach(bar => {
                observer.observe(bar);
            });
        }
    }
    
    animateProgressBar(progressBar) {
        const fill = progressBar.querySelector('.progress-fill-animated');
        if (!fill) return;
        
        const targetWidth = fill.dataset.width || '0%';
        
        // Animate from 0 to target width
        fill.style.width = '0%';
        requestAnimationFrame(() => {
            fill.style.width = targetWidth;
        });
    }
    
    updateProgress(selector, percentage, animated = true) {
        const progressBar = document.querySelector(selector);
        if (!progressBar) return;
        
        const fill = progressBar.querySelector('.progress-fill-animated');
        if (!fill) return;
        
        const targetWidth = `${Math.min(100, Math.max(0, percentage))}%`;
        
        if (animated && !this.isReducedMotion) {
            fill.style.width = targetWidth;
        } else {
            fill.style.transition = 'none';
            fill.style.width = targetWidth;
            requestAnimationFrame(() => {
                fill.style.transition = '';
            });
        }
    }
    
    // === MODAL ANIMATIONS ===
    setupModals() {
        document.addEventListener('click', (e) => {
            // Open modal
            if (e.target.matches('[data-modal-open]')) {
                const modalId = e.target.dataset.modalOpen;
                this.openModal(modalId);
            }
            
            // Close modal
            if (e.target.matches('[data-modal-close]') || 
                e.target.closest('.modal-overlay') === e.target) {
                this.closeModal(e.target.closest('.modal-overlay'));
            }
        });
        
        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal-overlay:not(.modal-closing)');
                if (openModal) {
                    this.closeModal(openModal);
                }
            }
        });
    }
    
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        requestAnimationFrame(() => {
            modal.classList.add('active');
        });
        
        // Focus management
        const firstFocusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) {
            firstFocusable.focus();
        }
    }
    
    closeModal(modal) {
        if (!modal) return;
        
        modal.classList.add('modal-closing');
        
        setTimeout(() => {
            modal.style.display = 'none';
            modal.classList.remove('active', 'modal-closing');
            document.body.style.overflow = '';
        }, 300);
    }
    
    // === FLOATING ACTION BUTTON ===
    setupFAB() {
        const fab = document.querySelector('.fab');
        if (!fab) return;
        
        let lastScrollY = window.scrollY;
        
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                // Scrolling down
                fab.classList.add('fab-hidden');
            } else {
                // Scrolling up
                fab.classList.remove('fab-hidden');
            }
            
            lastScrollY = currentScrollY;
        });
        
        // FAB menu functionality
        const fabMenu = document.querySelector('.fab-menu');
        if (fabMenu) {
            fab.addEventListener('click', () => {
                fabMenu.classList.toggle('open');
            });
            
            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.fab-menu') && fabMenu.classList.contains('open')) {
                    fabMenu.classList.remove('open');
                }
            });
        }
    }
    
    // === LOADING STATES ===
    setupLoadingStates() {
        // Auto-detect and enhance loading elements
        this.enhanceLoadingSkeletons();
        this.setupInfiniteScroll();
    }
    
    enhanceLoadingSkeletons() {
        document.querySelectorAll('.loading-skeleton').forEach(skeleton => {
            if (!skeleton.dataset.enhanced) {
                skeleton.dataset.enhanced = 'true';
                
                // Add shimmer effect if not present
                if (!skeleton.querySelector('.skeleton-shimmer')) {
                    const shimmer = document.createElement('div');
                    shimmer.className = 'skeleton-shimmer';
                    skeleton.appendChild(shimmer);
                }
            }
        });
    }
    
    setupInfiniteScroll() {
        const infiniteElements = document.querySelectorAll('[data-infinite-scroll]');
        
        if (!infiniteElements.length || !('IntersectionObserver' in window)) return;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.triggerInfiniteLoad(entry.target);
                }
            });
        }, {
            rootMargin: '100px'
        });
        
        infiniteElements.forEach(el => {
            const trigger = el.querySelector('[data-infinite-trigger]');
            if (trigger) {
                observer.observe(trigger);
            }
        });
    }
    
    triggerInfiniteLoad(trigger) {
        const container = trigger.closest('[data-infinite-scroll]');
        if (!container || container.dataset.loading === 'true') return;
        
        container.dataset.loading = 'true';
        
        // Show loading state
        this.showInfiniteLoading(container);
        
        // Trigger custom event for loading
        container.dispatchEvent(new CustomEvent('infinite-load', {
            detail: { trigger }
        }));
    }
    
    showInfiniteLoading(container) {
        const existingLoader = container.querySelector('.infinite-loading');
        if (existingLoader) return;
        
        const loader = document.createElement('div');
        loader.className = 'infinite-loading';
        loader.innerHTML = `
            <div class="loading-dots">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
            </div>
            <span>Cargando más...</span>
        `;
        
        container.appendChild(loader);
    }
    
    hideInfiniteLoading(container) {
        const loader = container.querySelector('.infinite-loading');
        if (loader) {
            loader.remove();
        }
        container.dataset.loading = 'false';
    }
    
    // === HOVER EFFECTS ===
    setupHoverEffects() {
        if (this.isTouchDevice) return;
        
        // Enhanced hover effects for cards
        document.addEventListener('mouseenter', (e) => {
            const card = e.target.closest('.service-card-professional, .freelancer-card-professional, .category-card');
            if (card && !this.isReducedMotion) {
                this.enhanceCardHover(card, true);
            }
        }, true);
        
        document.addEventListener('mouseleave', (e) => {
            const card = e.target.closest('.service-card-professional, .freelancer-card-professional, .category-card');
            if (card && !this.isReducedMotion) {
                this.enhanceCardHover(card, false);
            }
        }, true);
    }
    
    enhanceCardHover(card, isHovering) {
        const image = card.querySelector('.service-image img, .freelancer-avatar img, .category-icon');
        const title = card.querySelector('.service-title, .freelancer-name, .category-name');
        
        if (isHovering) {
            if (image) {
                image.style.transform = 'scale(1.05)';
            }
            if (title) {
                title.style.color = 'var(--primary-blue)';
            }
        } else {
            if (image) {
                image.style.transform = '';
            }
            if (title) {
                title.style.color = '';
            }
        }
    }
    
    // === UTILITY METHODS ===
    animateElement(element, animation, options = {}) {
        if (this.isReducedMotion) return Promise.resolve();
        
        const {
            duration = 300,
            easing = 'ease-out',
            delay = 0
        } = options;
        
        return new Promise(resolve => {
            setTimeout(() => {
                element.style.animation = `${animation} ${duration}ms ${easing}`;
                
                const handleAnimationEnd = () => {
                    element.removeEventListener('animationend', handleAnimationEnd);
                    element.style.animation = '';
                    resolve();
                };
                
                element.addEventListener('animationend', handleAnimationEnd);
            }, delay);
        });
    }
    
    addStaggerAnimation(elements, animation, staggerDelay = 100) {
        if (this.isReducedMotion) return;
        
        elements.forEach((element, index) => {
            setTimeout(() => {
                element.classList.add(animation);
            }, index * staggerDelay);
        });
    }
    
    // === PERFORMANCE OPTIMIZATION ===
    throttle(func, wait) {
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
    
    debounce(func, wait, immediate) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    }
    
    // === PUBLIC API ===
    showSuccess(message, options) {
        return this.showToast(message, 'success', options);
    }
    
    showError(message, options) {
        return this.showToast(message, 'error', options);
    }
    
    showWarning(message, options) {
        return this.showToast(message, 'warning', options);
    }
    
    showInfo(message, options) {
        return this.showToast(message, 'info', options);
    }
    
    // === CLEANUP ===
    destroy() {
        if (this.toastContainer) {
            this.toastContainer.remove();
        }
        this.activeToasts.clear();
        this.animationQueue = [];
        this.isInitialized = false;
    }
}

// === GLOBAL UTILITIES ===
class AnimationUtils {
    static fadeIn(element, duration = 300) {
        if (!element) return Promise.resolve();
        
        element.style.opacity = '0';
        element.style.display = 'block';
        
        return new Promise(resolve => {
            requestAnimationFrame(() => {
                element.style.transition = `opacity ${duration}ms ease-out`;
                element.style.opacity = '1';
                
                setTimeout(resolve, duration);
            });
        });
    }
    
    static fadeOut(element, duration = 300) {
        if (!element) return Promise.resolve();
        
        return new Promise(resolve => {
            element.style.transition = `opacity ${duration}ms ease-out`;
            element.style.opacity = '0';
            
            setTimeout(() => {
                element.style.display = 'none';
                resolve();
            }, duration);
        });
    }
    
    static slideDown(element, duration = 300) {
        if (!element) return Promise.resolve();
        
        const height = element.scrollHeight;
        element.style.height = '0px';
        element.style.overflow = 'hidden';
        element.style.display = 'block';
        
        return new Promise(resolve => {
            requestAnimationFrame(() => {
                element.style.transition = `height ${duration}ms ease-out`;
                element.style.height = height + 'px';
                
                setTimeout(() => {
                    element.style.height = '';
                    element.style.overflow = '';
                    resolve();
                }, duration);
            });
        });
    }
    
    static slideUp(element, duration = 300) {
        if (!element) return Promise.resolve();
        
        const height = element.scrollHeight;
        element.style.height = height + 'px';
        element.style.overflow = 'hidden';
        
        return new Promise(resolve => {
            requestAnimationFrame(() => {
                element.style.transition = `height ${duration}ms ease-out`;
                element.style.height = '0px';
                
                setTimeout(() => {
                    element.style.display = 'none';
                    element.style.height = '';
                    element.style.overflow = '';
                    resolve();
                }, duration);
            });
        });
    }
}

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', () => {
    window.laburAR = window.laburAR || {};
    window.laburAR.microInteractions = new MicroInteractionsManager();
    window.laburAR.AnimationUtils = AnimationUtils;
    
    console.log('LaburAR Micro-Interactions ready');
});

// === GLOBAL EXPORTS ===
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MicroInteractionsManager, AnimationUtils };
}