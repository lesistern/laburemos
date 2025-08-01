/**
 * Landing Page JavaScript para LaburAR
 * 
 * Funcionalidades interactivas para la página principal
 * Animaciones, navegación y efectos visuales
 * 
 * @author LaburAR Team
 * @version 1.0
 * @since 2025-07-20
 */

document.addEventListener('DOMContentLoaded', function() {
    
    // Inicializar todas las funcionalidades
    initNavigation();
    initScrollAnimations();
    initFloatingCards();
    initSmoothScrolling();
    initLazyLoading();
    initAnalytics();
    
});

/**
 * Navegación responsive y effects
 */
function initNavigation() {
    const navbar = document.querySelector('.navbar');
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Mobile menu toggle
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
            
            // Animate hamburger
            const spans = navToggle.querySelectorAll('span');
            if (navMenu.classList.contains('active')) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
    }
    
    // Close mobile menu when clicking on links
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (navMenu && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
                
                // Reset hamburger
                const spans = navToggle.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
    });
    
    // Navbar scroll effect
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (navMenu && navMenu.classList.contains('active') && 
            !navMenu.contains(e.target) && 
            !navToggle.contains(e.target)) {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
            
            // Reset hamburger
            const spans = navToggle.querySelectorAll('span');
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
    });
}

/**
 * Animaciones de scroll
 */
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.scroll-animate, .feature-card, .category-card');
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    animatedElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'all 0.6s ease';
        observer.observe(element);
    });
    
    // Parallax effect para hero
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const hero = document.querySelector('.hero');
        
        if (hero && scrolled < window.innerHeight) {
            const rate = scrolled * -0.5;
            hero.style.transform = `translateY(${rate}px)`;
        }
    });
}

/**
 * Animaciones de las floating cards
 */
function initFloatingCards() {
    const floatingCards = document.querySelectorAll('.floating-card');
    
    floatingCards.forEach((card, index) => {
        // Animación inicial
        card.style.animationDelay = `${index * 2}s`;
        
        // Hover effect mejorado
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.05) rotate(2deg)';
            this.style.boxShadow = '0 20px 40px rgba(111, 191, 239, 0.3)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1) rotate(0deg)';
            this.style.boxShadow = '0 8px 30px rgba(111, 191, 239, 0.15)';
        });
    });
    
    // Movimiento con el mouse
    document.addEventListener('mousemove', function(e) {
        const cards = document.querySelectorAll('.floating-card');
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        cards.forEach((card, index) => {
            const moveX = (e.clientX - centerX) * (0.01 + index * 0.005);
            const moveY = (e.clientY - centerY) * (0.01 + index * 0.005);
            
            card.style.transform += ` translate(${moveX}px, ${moveY}px)`;
        });
    });
}

/**
 * Smooth scrolling para anchor links
 */
function initSmoothScrolling() {
    const smoothScrollLinks = document.querySelectorAll('a[href^="#"]');
    
    smoothScrollLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const headerOffset = 80;
                const elementPosition = targetElement.offsetTop;
                const offsetPosition = elementPosition - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/**
 * Lazy loading para imágenes
 */
function initLazyLoading() {
    const images = document.querySelectorAll('img[loading="lazy"]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src || img.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => {
        imageObserver.observe(img);
    });
}

/**
 * Analytics y tracking
 */
function initAnalytics() {
    // Track CTA clicks
    const ctaButtons = document.querySelectorAll('.btn-primary, .btn-outline');
    
    ctaButtons.forEach(button => {
        button.addEventListener('click', function() {
            const buttonText = this.textContent.trim();
            const buttonLocation = this.closest('section')?.className || 'unknown';
            
            // Google Analytics event (placeholder)
            if (typeof gtag !== 'undefined') {
                gtag('event', 'cta_click', {
                    'button_text': buttonText,
                    'location': buttonLocation,
                    'user_type': this.href.includes('type=client') ? 'client' : 'freelancer'
                });
            }
            
            console.log('CTA Click:', {
                button: buttonText,
                location: buttonLocation,
                timestamp: new Date().toISOString()
            });
        });
    });
    
    // Track scroll depth
    let maxScroll = 0;
    const milestones = [25, 50, 75, 100];
    
    window.addEventListener('scroll', debounce(function() {
        const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
        
        if (scrollPercent > maxScroll) {
            maxScroll = scrollPercent;
            
            milestones.forEach(milestone => {
                if (scrollPercent >= milestone && !sessionStorage.getItem(`scroll_${milestone}`)) {
                    sessionStorage.setItem(`scroll_${milestone}`, 'true');
                    
                    if (typeof gtag !== 'undefined') {
                        gtag('event', 'scroll_depth', {
                            'percentage': milestone
                        });
                    }
                    
                    console.log('Scroll milestone:', milestone + '%');
                }
            });
        }
    }, 250));
    
    // Track time on page
    const startTime = Date.now();
    
    window.addEventListener('beforeunload', function() {
        const timeOnPage = Math.round((Date.now() - startTime) / 1000);
        
        if (typeof gtag !== 'undefined') {
            gtag('event', 'time_on_page', {
                'seconds': timeOnPage
            });
        }
    });
}

/**
 * Contadores animados
 */
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    
    counters.forEach(counter => {
        const target = parseInt(counter.textContent.replace(/[^0-9]/g, ''));
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;
        
        const updateCounter = () => {
            current += increment;
            if (current < target) {
                counter.textContent = Math.floor(current).toLocaleString('es-AR') + (counter.textContent.includes('+') ? '+' : '');
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target.toLocaleString('es-AR') + (counter.textContent.includes('+') ? '+' : '');
            }
        };
        
        // Iniciar animación cuando el elemento sea visible
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !counter.classList.contains('animated')) {
                    counter.classList.add('animated');
                    updateCounter();
                }
            });
        }, { threshold: 0.5 });
        
        observer.observe(counter);
    });
}

/**
 * Efectos de partículas para el hero
 */
function initParticles() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'particles-container';
    particlesContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1;
    `;
    
    hero.appendChild(particlesContainer);
    
    // Crear partículas
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.cssText = `
            position: absolute;
            width: 4px;
            height: 4px;
            background: rgba(111, 191, 239, 0.3);
            border-radius: 50%;
            animation: float ${5 + Math.random() * 5}s linear infinite;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation-delay: ${Math.random() * 5}s;
        `;
        
        particlesContainer.appendChild(particle);
    }
}

/**
 * Tooltip personalizado para badges
 */
function initTooltips() {
    const badges = document.querySelectorAll('.badge');
    
    badges.forEach(badge => {
        let tooltip;
        
        badge.addEventListener('mouseenter', function() {
            const tooltipText = this.getAttribute('data-tooltip') || getTooltipText(this);
            
            if (tooltipText) {
                tooltip = document.createElement('div');
                tooltip.className = 'custom-tooltip';
                tooltip.textContent = tooltipText;
                tooltip.style.cssText = `
                    position: absolute;
                    background: #1a202c;
                    color: white;
                    padding: 0.5rem 0.75rem;
                    border-radius: 6px;
                    font-size: 0.8rem;
                    white-space: nowrap;
                    z-index: 1000;
                    pointer-events: none;
                    transform: translateY(-100%) translateY(-8px);
                    opacity: 0;
                    transition: opacity 0.3s ease;
                `;
                
                this.style.position = 'relative';
                this.appendChild(tooltip);
                
                setTimeout(() => {
                    tooltip.style.opacity = '1';
                }, 10);
            }
        });
        
        badge.addEventListener('mouseleave', function() {
            if (tooltip) {
                tooltip.style.opacity = '0';
                setTimeout(() => {
                    if (tooltip && tooltip.parentNode) {
                        tooltip.parentNode.removeChild(tooltip);
                    }
                }, 300);
            }
        });
    });
}

/**
 * Obtener texto del tooltip según el badge
 */
function getTooltipText(badge) {
    const text = badge.textContent.toLowerCase();
    
    if (text.includes('monotributo')) {
        return 'Freelancer registrado en AFIP con monotributo vigente';
    } else if (text.includes('pro')) {
        return 'Freelancer con calificación profesional alta';
    } else if (text.includes('argentina')) {
        return 'Freelancer ubicado en Argentina';
    } else if (text.includes('verificado')) {
        return 'Identidad y documentos verificados';
    }
    
    return null;
}

/**
 * Utilidades
 */
function debounce(func, wait) {
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

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

/**
 * Inicializar funcionalidades adicionales cuando sea necesario
 */
window.addEventListener('load', function() {
    animateCounters();
    initParticles();
    initTooltips();
    
    // Precargar imágenes críticas
    preloadCriticalImages();
});

/**
 * Precargar imágenes importantes
 */
function preloadCriticalImages() {
    const criticalImages = [
        '/Laburar/assets/img/avatars/maria.jpg',
        '/Laburar/assets/img/avatars/carlos.jpg',
        '/Laburar/assets/img/avatars/lucia.jpg'
    ];
    
    criticalImages.forEach(src => {
        const img = new Image();
        img.src = src;
    });
}

/**
 * Manejar errores de imágenes
 */
document.addEventListener('error', function(e) {
    if (e.target.tagName === 'IMG') {
        e.target.style.display = 'none';
        console.warn('Image failed to load:', e.target.src);
    }
}, true);

/**
 * PWA-like functionality
 */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        // Future: Register service worker for offline functionality
        console.log('PWA ready for future implementation');
    });
}

/**
 * Performance monitoring
 */
window.addEventListener('load', function() {
    if ('performance' in window) {
        const perfData = performance.getEntriesByType('navigation')[0];
        const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
        
        console.log('Page load time:', loadTime + 'ms');
        
        if (typeof gtag !== 'undefined') {
            gtag('event', 'page_load_time', {
                'load_time': Math.round(loadTime)
            });
        }
    }
});

// Export functions for global access if needed
window.LaburARLanding = {
    animateCounters,
    initParticles,
    initTooltips
};