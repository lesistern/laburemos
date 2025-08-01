/**
 * FreelancerCard JavaScript Functionality
 * Modern interactions for Argentine Fiverr-like platform
 */

class FreelancerCardManager {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupIntersectionObserver();
        this.setupCardAnimations();
    }

    bindEvents() {
        // Bind global event handlers
        document.addEventListener('click', this.handleCardClick.bind(this));
        document.addEventListener('mouseover', this.handleCardHover.bind(this));
    }

    handleCardClick(event) {
        const card = event.target.closest('.freelancer-card');
        if (!card) return;

        // Handle different button clicks
        if (event.target.matches('.btn-contact') || event.target.closest('.btn-contact')) {
            event.preventDefault();
            const freelancerId = card.dataset.freelancerId;
            this.openChat(freelancerId);
        }

        if (event.target.matches('.btn-hire') || event.target.closest('.btn-hire')) {
            event.preventDefault();
            const freelancerId = card.dataset.freelancerId;
            this.viewProfile(freelancerId);
        }

        // Handle skill tag clicks
        if (event.target.matches('.skill-tag:not(.more)')) {
            event.preventDefault();
            const skill = event.target.textContent.trim();
            this.searchBySkill(skill);
        }

        // Handle card click (general)
        if (event.target.matches('.freelancer-card') || event.target.closest('.freelancer-card') === card) {
            if (!event.target.closest('.btn, .skill-tag')) {
                this.trackCardView(card.dataset.freelancerId);
            }
        }
    }

    handleCardHover(event) {
        const card = event.target.closest('.freelancer-card');
        if (card && !card.classList.contains('hovered')) {
            card.classList.add('hovered');
            this.preloadProfileData(card.dataset.freelancerId);
        }
    }

    setupIntersectionObserver() {
        // Lazy load and animate cards as they come into view
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    this.trackCardImpression(entry.target.dataset.freelancerId);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px'
        });

        document.querySelectorAll('.freelancer-card').forEach(card => {
            observer.observe(card);
        });
    }

    setupCardAnimations() {
        // Add smooth entrance animations
        const style = document.createElement('style');
        style.textContent = `
            .freelancer-card {
                opacity: 0;
                transform: translateY(20px);
                transition: opacity 0.6s ease, transform 0.6s ease;
            }
            
            .freelancer-card.visible {
                opacity: 1;
                transform: translateY(0);
            }
            
            .freelancer-card:nth-child(even) {
                transition-delay: 0.1s;
            }
            
            .freelancer-card:nth-child(3n) {
                transition-delay: 0.2s;
            }
        `;
        document.head.appendChild(style);
    }

    openChat(freelancerId) {
        // Show loading state
        this.showToast('Abriendo chat...', 'info');
        
        // Simulate API call to initiate chat
        fetch('/api/chat/initiate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': this.getCsrfToken()
            },
            body: JSON.stringify({
                freelancer_id: freelancerId,
                message: '¡Hola! Estoy interesado en tus servicios.'
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Redirect to chat or open modal
                window.location.href = `/chat/${data.chat_id}`;
            } else {
                this.showToast('Error al iniciar chat. Intenta nuevamente.', 'error');
            }
        })
        .catch(error => {
            console.error('Chat error:', error);
            this.showToast('Error de conexión. Verifica tu internet.', 'error');
        });

        // Track analytics
        this.trackEvent('freelancer_contact', {
            freelancer_id: freelancerId,
            source: 'profile_card'
        });
    }

    viewProfile(freelancerId) {
        // Add smooth transition effect
        const card = document.querySelector(`[data-freelancer-id="${freelancerId}"]`);
        if (card) {
            card.style.transform = 'scale(0.95)';
            card.style.opacity = '0.7';
        }

        // Navigate to profile with animation
        setTimeout(() => {
            window.location.href = `/freelancer/${freelancerId}`;
        }, 150);

        // Track analytics
        this.trackEvent('freelancer_profile_view', {
            freelancer_id: freelancerId,
            source: 'profile_card'
        });
    }

    searchBySkill(skill) {
        // Animate skill tag
        const skillTags = document.querySelectorAll('.skill-tag');
        skillTags.forEach(tag => {
            if (tag.textContent.trim() === skill) {
                tag.style.transform = 'scale(1.1)';
                tag.style.background = '#3b82f6';
                tag.style.color = '#ffffff';
            }
        });

        // Navigate to search results
        setTimeout(() => {
            window.location.href = `/search?skill=${encodeURIComponent(skill)}`;
        }, 200);

        // Track analytics
        this.trackEvent('skill_search', {
            skill: skill,
            source: 'profile_card'
        });
    }

    preloadProfileData(freelancerId) {
        // Preload profile data for faster navigation
        if (!this.preloadedProfiles) {
            this.preloadedProfiles = new Set();
        }

        if (!this.preloadedProfiles.has(freelancerId)) {
            fetch(`/api/freelancer/${freelancerId}/preview`, {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => response.json())
            .then(data => {
                // Cache the data
                sessionStorage.setItem(`freelancer_${freelancerId}`, JSON.stringify(data));
                this.preloadedProfiles.add(freelancerId);
            })
            .catch(error => {
                console.log('Preload failed:', error);
            });
        }
    }

    trackCardView(freelancerId) {
        // Track card view for analytics
        this.trackEvent('freelancer_card_view', {
            freelancer_id: freelancerId,
            timestamp: Date.now()
        });
    }

    trackCardImpression(freelancerId) {
        // Track when card comes into viewport
        this.trackEvent('freelancer_card_impression', {
            freelancer_id: freelancerId,
            timestamp: Date.now()
        });
    }

    trackEvent(eventName, data) {
        // Send analytics data
        if (window.gtag) {
            window.gtag('event', eventName, data);
        }
        
        // Also send to custom analytics endpoint
        fetch('/api/analytics/track', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                event: eventName,
                data: data,
                user_agent: navigator.userAgent,
                timestamp: Date.now()
            })
        }).catch(error => {
            console.log('Analytics tracking failed:', error);
        });
    }

    showToast(message, type = 'info') {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-message">${message}</span>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // Add toast styles if not already present
        if (!document.querySelector('#toast-styles')) {
            const toastStyles = document.createElement('style');
            toastStyles.id = 'toast-styles';
            toastStyles.textContent = `
                .toast {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #ffffff;
                    border-radius: 8px;
                    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
                    z-index: 9999;
                    max-width: 300px;
                    animation: slideInRight 0.3s ease;
                }
                
                .toast-info { border-left: 4px solid #3b82f6; }
                .toast-error { border-left: 4px solid #ef4444; }
                .toast-success { border-left: 4px solid #10b981; }
                
                .toast-content {
                    padding: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                
                .toast-message {
                    font-size: 14px;
                    color: #374151;
                }
                
                .toast-close {
                    background: none;
                    border: none;
                    font-size: 18px;
                    cursor: pointer;
                    color: #9ca3af;
                    margin-left: 12px;
                }
                
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(toastStyles);
        }

        document.body.appendChild(toast);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.animation = 'slideInRight 0.3s ease reverse';
                setTimeout(() => toast.remove(), 300);
            }
        }, 3000);
    }

    getCsrfToken() {
        // Get CSRF token from meta tag or cookie
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        return token || '';
    }

    // Utility method to update card data dynamically
    updateCard(freelancerId, newData) {
        const card = document.querySelector(`[data-freelancer-id="${freelancerId}"]`);
        if (!card) return;

        // Update rating
        if (newData.rating) {
            const ratingNumber = card.querySelector('.rating-number');
            if (ratingNumber) {
                ratingNumber.textContent = Number(newData.rating).toFixed(1);
            }

            // Update stars
            const stars = card.querySelectorAll('.star');
            stars.forEach((star, index) => {
                star.classList.toggle('filled', index < Math.floor(newData.rating));
            });
        }

        // Update online status
        if (typeof newData.is_online !== 'undefined') {
            const indicator = card.querySelector('.online-indicator');
            if (newData.is_online && !indicator) {
                const container = card.querySelector('.profile-image-container');
                const newIndicator = document.createElement('div');
                newIndicator.className = 'online-indicator';
                newIndicator.title = 'En línea';
                container.appendChild(newIndicator);
            } else if (!newData.is_online && indicator) {
                indicator.remove();
            }
        }

        // Update hourly rate
        if (newData.hourly_rate) {
            const rateElement = card.querySelector('.hourly-rate');
            if (rateElement) {
                rateElement.textContent = `AR$ ${Number(newData.hourly_rate).toLocaleString('es-AR')}`;
            }
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.freelancerCardManager = new FreelancerCardManager();
});

// Global functions for backward compatibility
function openChat(freelancerId) {
    if (window.freelancerCardManager) {
        window.freelancerCardManager.openChat(freelancerId);
    }
}

function viewProfile(freelancerId) {
    if (window.freelancerCardManager) {
        window.freelancerCardManager.viewProfile(freelancerId);
    }
}