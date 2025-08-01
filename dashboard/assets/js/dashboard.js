/**
 * LaburAR Dashboard - Advanced JavaScript Functionality
 * Professional dashboard interactions and real-time updates
 */

class LaburARDashboard {
    constructor() {
        this.userId = null;
        this.metrics = {};
        this.charts = {};
        this.updateInterval = null;
        this.init();
    }

    init() {
        this.initializeTooltips();
        this.setupEventListeners();
        this.startMetricsUpdates();
        this.initializeAnimations();
        console.log('🚀 LaburAR Dashboard initialized');
    }

    initializeTooltips() {
        // Initialize Bootstrap tooltips for badges and stats
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }

    setupEventListeners() {
        // Sidebar navigation
        document.querySelectorAll('.sidebar-nav a').forEach(link => {
            link.addEventListener('click', (e) => this.handleNavigation(e));
        });

        // Quick action buttons
        document.querySelectorAll('[onclick]').forEach(btn => {
            const action = btn.getAttribute('onclick').replace('()', '');
            btn.removeAttribute('onclick');
            btn.addEventListener('click', () => this.handleQuickAction(action));
        });

        // Chart interaction handlers
        this.setupChartEventListeners();

        // Badge showcase interactions
        this.setupBadgeInteractions();
    }

    handleNavigation(e) {
        e.preventDefault();
        
        const link = e.currentTarget;
        const section = link.dataset.section;
        
        // Remove active class from all links
        document.querySelectorAll('.sidebar-nav a').forEach(l => l.classList.remove('active'));
        
        // Add active class to clicked link
        link.classList.add('active');
        
        // Handle section switching
        this.switchSection(section);
        
        // Add ripple effect
        this.createRippleEffect(link, e);
    }

    switchSection(section) {
        console.log(`🔄 Switching to section: ${section}`);
        
        switch(section) {
            case 'overview':
                this.showOverviewSection();
                break;
            case 'projects':
                this.loadProjectsSection();
                break;
            case 'earnings':
                this.loadEarningsSection();
                break;
            case 'badges':
                this.loadBadgesSection();
                break;
            case 'messages':
                this.loadMessagesSection();
                break;
            case 'profile':
                this.loadProfileSection();
                break;
        }

        // Smooth scroll to top
        document.querySelector('.dashboard-container').scrollIntoView({ 
            behavior: 'smooth' 
        });
    }

    showOverviewSection() {
        // Show all overview elements
        document.getElementById('overview-section').style.display = 'block';
        
        // Animate stats cards
        this.animateStatsCards();
        
        // Refresh charts
        this.refreshCharts();
    }

    loadProjectsSection() {
        // Show projects view (placeholder for now)
        this.showMessage('📋 Cargando sección de proyectos...', 'info');
        
        // TODO: Load projects data
        setTimeout(() => {
            this.showMessage('✅ Próximamente: Gestión completa de proyectos', 'success');
        }, 1000);
    }

    loadEarningsSection() {
        // Show earnings detailed view
        this.showMessage('💰 Cargando análisis de ganancias...', 'info');
        
        // TODO: Load detailed earnings data
        setTimeout(() => {
            this.showMessage('📊 Próximamente: Análisis detallado de ganancias', 'success');
        }, 1000);
    }

    loadBadgesSection() {
        // Show badges management
        this.showMessage('🏆 Cargando sistema de badges...', 'info');
        
        // TODO: Load badges management interface
        setTimeout(() => {
            this.showBadgeShowcase();
        }, 1000);
    }

    loadMessagesSection() {
        // Redirect to messages
        window.location.href = '../messages/inbox.php';
    }

    loadProfileSection() {
        // Redirect to profile edit
        window.location.href = '../profile/edit.php';
    }

    handleQuickAction(action) {
        console.log(`⚡ Quick action: ${action}`);
        
        switch(action) {
            case 'createNewService':
                this.showMessage('🚀 Redirigiendo a crear nuevo servicio...', 'info');
                setTimeout(() => window.location.href = '../services/create.php', 1000);
                break;
                
            case 'viewMessages':
                this.showMessage('📧 Abriendo bandeja de mensajes...', 'info');
                setTimeout(() => window.location.href = '../messages/inbox.php', 1000);
                break;
                
            case 'withdrawFunds':
                this.showMessage('💸 Accediendo a retiro de fondos...', 'info');
                setTimeout(() => window.location.href = '../wallet/withdraw.php', 1000);
                break;
                
            case 'editProfile':
                this.showMessage('👤 Abriendo editor de perfil...', 'info');
                setTimeout(() => window.location.href = '../profile/edit.php', 1000);
                break;
        }
    }

    setupChartEventListeners() {
        // Add click handlers for charts when they exist
        if (window.earningsChart) {
            window.earningsChart.options.onClick = (event, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const label = window.earningsChart.data.labels[index];
                    this.showMessage(`📈 Datos de ${label}: Análisis detallado próximamente`, 'info');
                }
            };
        }

        if (window.projectsChart) {
            window.projectsChart.options.onClick = (event, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const label = window.projectsChart.data.labels[index];
                    this.showMessage(`📊 ${label}: Ver detalles próximamente`, 'info');
                }
            };
        }
    }

    setupBadgeInteractions() {
        document.querySelectorAll('.badge-container').forEach(badge => {
            badge.addEventListener('click', (e) => {
                const badgeName = badge.getAttribute('title');
                this.showBadgeDetails(badgeName);
            });

            // Hover effect enhancement
            badge.addEventListener('mouseenter', () => {
                badge.style.transform = 'translateY(-5px) scale(1.15)';
                badge.style.filter = 'drop-shadow(0 10px 20px rgba(0,0,0,0.4))';
            });

            badge.addEventListener('mouseleave', () => {
                badge.style.transform = 'translateY(0) scale(1)';
                badge.style.filter = 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))';
            });
        });
    }

    showBadgeDetails(badgeName) {
        // Show badge details modal (placeholder)
        this.showMessage(`🏆 Badge "${badgeName}": Sistema de detalles próximamente`, 'info');
    }

    showBadgeShowcase() {
        this.showMessage('🎯 Próximamente: Galería completa de badges con progreso y logros', 'success');
    }

    startMetricsUpdates() {
        // Update metrics every 5 minutes
        this.updateInterval = setInterval(() => {
            this.refreshMetrics();
        }, 300000); // 5 minutes

        // Initial load
        this.refreshMetrics();
    }

    async refreshMetrics() {
        try {
            const response = await fetch('api/dashboard-metrics.php');
            
            if (!response.ok) {
                throw new Error('Failed to fetch metrics');
            }
            
            const data = await response.json();
            
            if (data.success) {
                this.updateMetricsDisplay(data.data);
                console.log('📊 Metrics updated successfully');
            } else {
                console.error('Failed to update metrics:', data.error);
            }
        } catch (error) {
            console.error('Error refreshing metrics:', error);
            this.showMessage('⚠️ Error actualizando métricas. Reintentando...', 'warning');
        }
    }

    updateMetricsDisplay(metrics) {
        // Update stats cards
        this.updateStatsCard('total_earnings', `$${this.formatNumber(metrics.total_earnings)}`);
        this.updateStatsCard('active_projects', metrics.active_projects);
        this.updateStatsCard('rating_average', metrics.rating_average);
        this.updateStatsCard('total_badges', metrics.total_badges);

        // Update charts if new data is available
        if (metrics.chart_data && window.earningsChart) {
            window.earningsChart.data.datasets[0].data = metrics.chart_data;
            window.earningsChart.data.labels = metrics.chart_labels;
            window.earningsChart.update('none'); // Smooth update
        }

        this.metrics = metrics;
    }

    updateStatsCard(type, value) {
        const card = document.querySelector(`[data-stat="${type}"] .stats-value`);
        if (card) {
            // Animate value change
            card.style.transform = 'scale(1.1)';
            card.style.color = '#10b981';
            
            setTimeout(() => {
                card.textContent = value;
                card.style.transform = 'scale(1)';
                card.style.color = '';
            }, 200);
        }
    }

    refreshCharts() {
        // Refresh existing charts
        if (window.earningsChart) {
            window.earningsChart.update();
        }
        if (window.projectsChart) {
            window.projectsChart.update();
        }
    }

    animateStatsCards() {
        const cards = document.querySelectorAll('.stats-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    initializeAnimations() {
        // Intersection Observer for scroll animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, { threshold: 0.1 });

        // Observe all major sections
        document.querySelectorAll('.chart-container, .stats-card').forEach(el => {
            observer.observe(el);
        });
    }

    createRippleEffect(element, event) {
        const ripple = document.createElement('span');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
        `;
        
        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    showMessage(message, type = 'info') {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `alert alert-${type} position-fixed`;
        toast.style.cssText = `
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 400px;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;
        toast.innerHTML = `
            <div class="d-flex align-items-center">
                <span>${message}</span>
                <button type="button" class="btn-close ms-auto" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(100%)';
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
    }

    formatNumber(num) {
        return new Intl.NumberFormat('es-AR').format(num);
    }

    destroy() {
        // Cleanup
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        // Remove event listeners
        document.querySelectorAll('.sidebar-nav a').forEach(link => {
            link.removeEventListener('click', this.handleNavigation);
        });
        
        console.log('🧹 LaburAR Dashboard destroyed');
    }
}

// CSS for animations
const animationStyles = `
    <style>
        @keyframes ripple {
            to {
                transform: scale(2);
                opacity: 0;
            }
        }
        
        .animate-in {
            animation: slideInUp 0.6s ease-out;
        }
        
        @keyframes slideInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .stats-card {
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        
        .badge-container {
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
            cursor: pointer;
        }
        
        .chart-container:hover {
            transform: translateY(-2px);
            box-shadow: 0 15px 40px rgba(31, 38, 135, 0.3);
        }
        
        /* Loading states */
        .loading {
            position: relative;
            pointer-events: none;
        }
        
        .loading::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(2px);
            border-radius: inherit;
            z-index: 10;
        }
        
        /* Responsive enhancements */
        @media (max-width: 768px) {
            .alert.position-fixed {
                right: 10px;
                left: 10px;
                max-width: none;
            }
        }
    </style>
`;

// Inject animation styles
document.head.insertAdjacentHTML('beforeend', animationStyles);

// Initialize dashboard when DOM is ready
let dashboardInstance;

document.addEventListener('DOMContentLoaded', function() {
    dashboardInstance = new LaburARDashboard();
});

// Handle page unload
window.addEventListener('beforeunload', function() {
    if (dashboardInstance) {
        dashboardInstance.destroy();
    }
});

// Export for potential external use
window.LaburARDashboard = LaburARDashboard;