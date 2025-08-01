/**
 * Advanced Search Manager - Fiverr-Level Search Experience
 * 
 * Professional search component with autocomplete, caching, filtering,
 * performance tracking, and mobile optimization for LaburAR platform
 * 
 * @author LaburAR Team
 * @version 3.0
 * @since 2025-07-20
 */

class AdvancedSearchManager {
    constructor(options = {}) {
        this.container = options.container || '[data-search="container"]';
        this.input = options.input || '[data-search="input"]';
        this.results = options.results || '[data-search="results"]';
        this.filters = options.filters || '[data-search="filters"]';
        
        // Search state
        this.currentQuery = '';
        this.currentFilters = {};
        this.searchHistory = JSON.parse(localStorage.getItem('laburar_search_history') || '[]');
        this.suggestions = [];
        
        // Performance optimization
        this.debounceTimeout = null;
        this.searchCache = new Map();
        this.requestId = 0;
        this.maxCacheSize = 100;
        
        // Performance tracking
        this.performanceMetrics = {
            searchStartTime: null,
            resultsDisplayTime: null,
            totalResults: 0,
            cacheHitRate: 0
        };
        
        // Mobile optimization
        this.isMobile = window.innerWidth <= 768;
        this.touchStartY = 0;
        this.isScrolling = false;
        
        this.init();
    }
    
    init() {
        this.findElements();
        if (!this.searchInput) {
            console.error('Advanced search: Search input not found');
            return;
        }
        
        this.setupEventListeners();
        this.initializeAutocomplete();
        this.initializeFilters();
        this.setupKeyboardShortcuts();
        this.setupMobileOptimizations();
        this.loadSavedState();
        
        // Track initialization
        this.trackEvent('search_initialized', { isMobile: this.isMobile });
    }
    
    findElements() {
        this.searchInput = document.querySelector(this.input);
        this.searchResults = document.querySelector(this.results);
        this.filtersContainer = document.querySelector(this.filters);
        this.searchContainer = document.querySelector(this.container);
        
        // Create overlay if doesn't exist
        if (!this.searchResults) {
            this.createSearchOverlay();
        }
    }
    
    createSearchOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'search-overlay-advanced';
        overlay.setAttribute('data-search', 'results');
        overlay.innerHTML = `
            <div class="search-overlay-content">
                <div class="search-overlay-header">
                    <h3>Buscar en LaburAR</h3>
                    <button class="search-overlay-close" aria-label="Cerrar búsqueda">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
                <div class="search-results-container"></div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        this.searchResults = overlay;
    }
    
    setupEventListeners() {
        // Search input events
        this.searchInput.addEventListener('input', (e) => {
            this.handleSearchInput(e.target.value);
        });
        
        this.searchInput.addEventListener('focus', () => {
            this.showSearchOverlay();
            if (this.currentQuery.length === 0) {
                this.showSearchHistory();
            }
        });
        
        this.searchInput.addEventListener('blur', (e) => {
            // Delay to allow clicking on results
            setTimeout(() => {
                if (!e.relatedTarget?.closest('.search-overlay-advanced')) {
                    this.hideSearchOverlay();
                }
            }, 150);
        });
        
        // Filter events
        if (this.filtersContainer) {
            this.filtersContainer.addEventListener('change', (e) => {
                if (e.target.matches('[data-filter]')) {
                    this.handleFilterChange(e.target);
                }
            });
        }
        
        // Global events
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-overlay-advanced') && 
                !e.target.closest('[data-search="container"]')) {
                this.hideSearchOverlay();
            }
        });
        
        // Close button
        document.addEventListener('click', (e) => {
            if (e.target.closest('.search-overlay-close')) {
                this.hideSearchOverlay();
            }
        });
        
        // Browser back/forward
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.searchQuery) {
                this.restoreSearchState(e.state);
            }
        });
        
        // Resize events for mobile optimization
        window.addEventListener('resize', () => {
            this.isMobile = window.innerWidth <= 768;
            this.adjustMobileLayout();
        });
    }
    
    setupMobileOptimizations() {
        if (this.isMobile) {
            // Touch events for mobile
            this.searchInput.addEventListener('touchstart', (e) => {
                this.touchStartY = e.touches[0].clientY;
            });
            
            this.searchInput.addEventListener('touchmove', (e) => {
                const touchY = e.touches[0].clientY;
                const deltaY = this.touchStartY - touchY;
                
                if (Math.abs(deltaY) > 10) {
                    this.isScrolling = true;
                }
            });
            
            this.searchInput.addEventListener('touchend', () => {
                if (!this.isScrolling) {
                    this.showSearchOverlay();
                }
                this.isScrolling = false;
            });
            
            // Optimize for mobile search
            this.searchInput.setAttribute('inputmode', 'search');
            this.searchInput.setAttribute('autocomplete', 'off');
            this.searchInput.setAttribute('autocorrect', 'off');
            this.searchInput.setAttribute('spellcheck', 'false');
        }
    }
    
    handleSearchInput(query) {
        this.currentQuery = query.trim();
        
        // Clear existing timeout
        clearTimeout(this.debounceTimeout);
        
        // Show loading state for immediate feedback
        if (this.currentQuery.length >= 2) {
            this.showLoadingState();
        }
        
        // Debounce search with optimized timing
        const debounceTime = this.isMobile ? 400 : 300;
        this.debounceTimeout = setTimeout(() => {
            if (this.currentQuery.length >= 2) {
                this.performSearch(this.currentQuery);
            } else if (this.currentQuery.length === 0) {
                this.showSearchHistory();
            } else {
                this.hideSearchResults();
            }
        }, debounceTime);
    }
    
    async performSearch(query, filters = this.currentFilters) {
        // Performance tracking
        this.performanceMetrics.searchStartTime = performance.now();
        
        // Generate cache key
        const cacheKey = this.generateCacheKey(query, filters);
        
        // Check cache first
        if (this.searchCache.has(cacheKey)) {
            const cachedResults = this.searchCache.get(cacheKey);
            this.displaySearchResults(cachedResults);
            this.trackSearchPerformance('cache');
            this.updateCacheHitRate(true);
            return;
        }
        
        // Rate limiting check
        if (this.isRateLimited()) {
            this.showErrorState('Demasiadas búsquedas. Por favor, esperá un momento.');
            return;
        }
        
        // Generate unique request ID for race condition handling
        const requestId = ++this.requestId;
        
        try {
            const searchPayload = {
                query: query,
                filters: filters,
                include_suggestions: true,
                include_categories: true,
                include_freelancers: true,
                limit: this.isMobile ? 15 : 20,
                timestamp: Date.now()
            };
            
            const response = await fetch('/Laburar/api/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                    'X-LaburAR-Version': '3.0'
                },
                body: JSON.stringify(searchPayload)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Check if this is still the latest request
            if (requestId !== this.requestId) {
                return; // Discard outdated response
            }
            
            if (data.success) {
                // Manage cache size
                this.manageCacheSize();
                
                // Cache results with timestamp
                this.searchCache.set(cacheKey, {
                    ...data.data,
                    cached_at: Date.now()
                });
                
                // Display results
                this.displaySearchResults(data.data);
                
                // Update search history
                this.addToSearchHistory(query);
                
                // Track performance
                this.trackSearchPerformance('api', data.data.total || 0);
                this.updateCacheHitRate(false);
                
                // Update URL without reload
                this.updateURL(query, filters);
                
            } else {
                this.showErrorState(data.message || 'Error en la búsqueda');
            }
            
        } catch (error) {
            console.error('Search error:', error);
            
            if (requestId === this.requestId) {
                if (error.name === 'TypeError' && error.message.includes('fetch')) {
                    this.showErrorState('Error de conexión. Verificá tu internet.');
                } else {
                    this.showErrorState('Error en la búsqueda. Por favor, intentá de nuevo.');
                }
            }
        }
    }
    
    displaySearchResults(results) {
        const { services, freelancers, categories, suggestions, total, search_time } = results;
        
        // Performance tracking
        this.performanceMetrics.resultsDisplayTime = performance.now();
        this.performanceMetrics.totalResults = total || 0;
        
        const resultsContainer = this.searchResults.querySelector('.search-results-container') ||
                               this.searchResults;
        
        const html = `
            <div class="search-results-advanced">
                ${this.renderSearchHeader(total, search_time)}
                ${suggestions?.length ? this.renderSuggestions(suggestions) : ''}
                ${categories?.length ? this.renderCategories(categories) : ''}
                ${services?.length ? this.renderServices(services) : ''}
                ${freelancers?.length ? this.renderFreelancers(freelancers) : ''}
                ${this.renderViewAllLink()}
            </div>
        `;
        
        resultsContainer.innerHTML = html;
        this.showSearchResults();
        
        // Setup interactions
        this.setupResultInteractions();
        
        // Track analytics
        this.trackSearchAnalytics(total);
        
        // Lazy load images
        this.setupLazyLoadingForResults();
    }
    
    renderSearchHeader(total, searchTime) {
        const displayTime = this.performanceMetrics.resultsDisplayTime - this.performanceMetrics.searchStartTime;
        const timeText = searchTime || (displayTime / 1000).toFixed(2);
        
        return `
            <div class="search-header">
                <div class="search-stats">
                    <span class="results-count">
                        ${total ? `${total.toLocaleString()} resultado${total !== 1 ? 's' : ''}` : 'Sin resultados'}
                    </span>
                    <span class="search-time">(${timeText}s)</span>
                    ${this.performanceMetrics.cacheHitRate > 0 ? `
                        <span class="cache-indicator" title="Cache hit rate: ${this.performanceMetrics.cacheHitRate}%">⚡</span>
                    ` : ''}
                </div>
                ${this.currentQuery ? `
                    <div class="search-actions">
                        <button 
                            class="btn-save-search" 
                            data-action="save-search"
                            title="Guardar búsqueda"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
                            </svg>
                        </button>
                        <button 
                            class="btn-clear-search" 
                            data-action="clear-search"
                            title="Limpiar búsqueda"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    renderSuggestions(suggestions) {
        return `
            <div class="search-section suggestions-section">
                <h4 class="section-title">¿Quisiste decir?</h4>
                <div class="suggestions-list">
                    ${suggestions.slice(0, 6).map(suggestion => `
                        <button 
                            class="suggestion-item" 
                            data-action="apply-suggestion"
                            data-suggestion="${suggestion.text}"
                        >
                            <svg class="suggestion-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="11" cy="11" r="8"/>
                                <path d="m21 21-4.35-4.35"/>
                            </svg>
                            <span class="suggestion-text">${suggestion.text}</span>
                            ${suggestion.count ? `<span class="suggestion-count">${suggestion.count}</span>` : ''}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    renderCategories(categories) {
        return `
            <div class="search-section categories-section">
                <h4 class="section-title">Categorías</h4>
                <div class="categories-grid">
                    ${categories.slice(0, this.isMobile ? 4 : 6).map(category => `
                        <a 
                            href="/Laburar/marketplace.html?categoria=${category.slug}" 
                            class="category-item"
                            data-analytics="search-category-click"
                            data-category="${category.slug}"
                        >
                            <div class="category-icon">
                                ${this.getCategoryIcon(category.slug)}
                            </div>
                            <div class="category-info">
                                <span class="category-name">${category.name}</span>
                                <span class="category-count">${category.services_count} servicio${category.services_count !== 1 ? 's' : ''}</span>
                            </div>
                        </a>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    renderServices(services) {
        return `
            <div class="search-section services-section">
                <h4 class="section-title">Servicios</h4>
                <div class="services-list">
                    ${services.slice(0, this.isMobile ? 6 : 8).map(service => `
                        <a 
                            href="/Laburar/service/${service.id}" 
                            class="service-item"
                            data-analytics="search-service-click"
                            data-service-id="${service.id}"
                        >
                            <div class="service-image">
                                <img 
                                    data-src="${service.image_url}" 
                                    alt="${service.title}"
                                    class="lazy"
                                    loading="lazy"
                                >
                                <div class="service-badges">
                                    ${service.is_verified ? '<span class="badge-verified">✓</span>' : ''}
                                    ${service.is_express ? '<span class="badge-express">24h</span>' : ''}
                                </div>
                            </div>
                            <div class="service-info">
                                <h5 class="service-title">${service.title}</h5>
                                <div class="service-meta">
                                    <div class="service-seller">
                                        <img 
                                            data-src="${service.seller_avatar}" 
                                            alt="${service.seller_name}"
                                            class="seller-avatar lazy"
                                        >
                                        <span class="seller-name">${service.seller_name}</span>
                                        ${service.seller_country === 'AR' ? '<span class="flag">🇦🇷</span>' : ''}
                                    </div>
                                    <div class="service-rating">
                                        <div class="stars">
                                            ${this.renderStars(service.rating)}
                                        </div>
                                        <span class="rating-text">${service.rating}</span>
                                        <span class="rating-count">(${service.review_count})</span>
                                    </div>
                                    <div class="service-price">
                                        <span class="price-label">Desde</span>
                                        <span class="price-amount">AR$ ${service.starting_price.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </a>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    renderFreelancers(freelancers) {
        return `
            <div class="search-section freelancers-section">
                <h4 class="section-title">Freelancers</h4>
                <div class="freelancers-list">
                    ${freelancers.slice(0, this.isMobile ? 3 : 4).map(freelancer => `
                        <a 
                            href="/Laburar/freelancer/${freelancer.id}" 
                            class="freelancer-item"
                            data-analytics="search-freelancer-click"
                            data-freelancer-id="${freelancer.id}"
                        >
                            <div class="freelancer-avatar">
                                <img 
                                    data-src="${freelancer.avatar_url}" 
                                    alt="${freelancer.name}"
                                    class="lazy"
                                >
                                ${freelancer.is_online ? '<div class="online-indicator"></div>' : ''}
                            </div>
                            <div class="freelancer-info">
                                <h5 class="freelancer-name">${freelancer.name}</h5>
                                <div class="freelancer-title">${freelancer.professional_title}</div>
                                <div class="freelancer-meta">
                                    <div class="freelancer-rating">
                                        <span class="rating-stars">★ ${freelancer.rating}</span>
                                        <span class="rating-count">(${freelancer.review_count})</span>
                                    </div>
                                    <div class="freelancer-location">📍 ${freelancer.location}</div>
                                </div>
                                <div class="freelancer-badges">
                                    ${freelancer.badges?.map(badge => `
                                        <span class="freelancer-badge badge-${badge.type}">${badge.title}</span>
                                    `).join('') || ''}
                                </div>
                            </div>
                        </a>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    renderViewAllLink() {
        if (!this.currentQuery) return '';
        
        const params = new URLSearchParams({
            q: this.currentQuery,
            ...this.currentFilters
        });
        
        return `
            <div class="search-footer">
                <a 
                    href="/Laburar/marketplace.html?${params.toString()}" 
                    class="btn btn-outline btn-lg view-all-link"
                    data-analytics="search-view-all-click"
                >
                    Ver todos los resultados
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                </a>
            </div>
        `;
    }
    
    // Filter management
    initializeFilters() {
        if (!this.filtersContainer) return;
        
        // Argentina-specific filters
        this.initializePriceFilter();
        this.initializeLocationFilter();
        this.initializeDeliveryFilter();
        this.initializeRatingFilter();
        this.initializeServiceTypeFilter();
    }
    
    initializeLocationFilter() {
        const locationFilter = this.filtersContainer.querySelector('[data-filter="location"]');
        if (!locationFilter) return;
        
        const argentineProvinces = [
            'Buenos Aires', 'CABA', 'Córdoba', 'Santa Fe', 'Mendoza', 
            'Tucumán', 'Entre Ríos', 'Salta', 'Misiones', 'Corrientes',
            'Santiago del Estero', 'Chaco', 'San Juan', 'Jujuy', 'Río Negro'
        ];
        
        const select = locationFilter.querySelector('select');
        if (select) {
            select.innerHTML = `
                <option value="">Toda Argentina</option>
                ${argentineProvinces.map(province => `
                    <option value="${province}">${province}</option>
                `).join('')}
            `;
        }
    }
    
    // Utility methods
    generateCacheKey(query, filters) {
        return `${query.toLowerCase()}:${JSON.stringify(filters)}`;
    }
    
    manageCacheSize() {
        if (this.searchCache.size >= this.maxCacheSize) {
            // Remove oldest entries (simple LRU)
            const entries = Array.from(this.searchCache.entries());
            const toRemove = entries.slice(0, Math.floor(this.maxCacheSize * 0.3));
            toRemove.forEach(([key]) => this.searchCache.delete(key));
        }
    }
    
    isRateLimited() {
        const now = Date.now();
        const minute = 60 * 1000;
        
        if (!this.lastSearchTimes) {
            this.lastSearchTimes = [];
        }
        
        // Remove old timestamps
        this.lastSearchTimes = this.lastSearchTimes.filter(time => now - time < minute);
        
        // Check if too many requests
        if (this.lastSearchTimes.length >= 30) {
            return true;
        }
        
        this.lastSearchTimes.push(now);
        return false;
    }
    
    getCategoryIcon(slug) {
        const icons = {
            'diseno-grafico': '🎨',
            'desarrollo-web': '💻',
            'marketing-digital': '📱',
            'redaccion-contenido': '✏️',
            'video-animacion': '🎬',
            'traduccion': '🌍',
            'fotografia': '📸',
            'musica-audio': '🎵',
            'programacion': '⌨️',
            'consultoria': '💼'
        };
        
        return icons[slug] || '📁';
    }
    
    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        return '★'.repeat(fullStars) + 
               (hasHalfStar ? '☆' : '') + 
               '☆'.repeat(emptyStars);
    }
    
    // Performance tracking
    trackSearchPerformance(source, resultCount = 0) {
        const searchTime = this.performanceMetrics.resultsDisplayTime - this.performanceMetrics.searchStartTime;
        
        this.trackEvent('search_performance', {
            query: this.currentQuery,
            source: source,
            searchTime: Math.round(searchTime),
            resultCount: resultCount,
            cacheSize: this.searchCache.size,
            isMobile: this.isMobile
        });
    }
    
    updateCacheHitRate(isHit) {
        if (!this.cacheStats) {
            this.cacheStats = { hits: 0, total: 0 };
        }
        
        this.cacheStats.total++;
        if (isHit) {
            this.cacheStats.hits++;
        }
        
        this.performanceMetrics.cacheHitRate = Math.round(
            (this.cacheStats.hits / this.cacheStats.total) * 100
        );
    }
    
    trackEvent(eventName, data) {
        if (window.analytics) {
            window.analytics.track(eventName, data);
        }
        
        // Also log for debugging
        console.log(`LaburAR Search: ${eventName}`, data);
    }
    
    // Search history management
    addToSearchHistory(query) {
        if (!query || query.length < 2) return;
        
        // Remove if already exists
        this.searchHistory = this.searchHistory.filter(item => item.query !== query);
        
        // Add to beginning
        this.searchHistory.unshift({
            query: query,
            timestamp: Date.now(),
            filters: { ...this.currentFilters }
        });
        
        // Keep only last 20
        this.searchHistory = this.searchHistory.slice(0, 20);
        
        // Save to localStorage
        localStorage.setItem('laburar_search_history', JSON.stringify(this.searchHistory));
    }
    
    showSearchHistory() {
        if (this.searchHistory.length === 0) {
            this.hideSearchResults();
            return;
        }
        
        const html = `
            <div class="search-history">
                <h4 class="section-title">Búsquedas recientes</h4>
                <div class="history-list">
                    ${this.searchHistory.slice(0, 8).map(item => `
                        <button 
                            class="history-item" 
                            data-action="apply-history"
                            data-query="${item.query}"
                        >
                            <svg class="history-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12,6 12,12 16,14"/>
                            </svg>
                            <span class="history-text">${item.query}</span>
                        </button>
                    `).join('')}
                </div>
                <button class="clear-history-btn" data-action="clear-history">
                    Limpiar historial
                </button>
            </div>
        `;
        
        const resultsContainer = this.searchResults.querySelector('.search-results-container') ||
                               this.searchResults;
        resultsContainer.innerHTML = html;
        this.showSearchResults();
        this.setupResultInteractions();
    }
    
    // Keyboard shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K to focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.focusSearch();
            }
            
            // Escape to close search
            if (e.key === 'Escape') {
                this.hideSearchOverlay();
                this.searchInput.blur();
            }
            
            // Arrow navigation in results
            if (this.isSearchOverlayVisible()) {
                this.handleKeyboardNavigation(e);
            }
        });
    }
    
    focusSearch() {
        this.searchInput.focus();
        this.searchInput.select();
        this.showSearchOverlay();
    }
    
    // State management
    showSearchOverlay() {
        if (this.searchResults) {
            this.searchResults.classList.add('active');
            document.body.classList.add('search-overlay-open');
        }
    }
    
    hideSearchOverlay() {
        if (this.searchResults) {
            this.searchResults.classList.remove('active');
            document.body.classList.remove('search-overlay-open');
        }
    }
    
    showSearchResults() {
        this.showSearchOverlay();
    }
    
    hideSearchResults() {
        const resultsContainer = this.searchResults.querySelector('.search-results-container') ||
                               this.searchResults;
        resultsContainer.innerHTML = '';
    }
    
    showLoadingState() {
        const resultsContainer = this.searchResults.querySelector('.search-results-container') ||
                               this.searchResults;
        resultsContainer.innerHTML = `
            <div class="search-loading">
                <div class="loading-spinner"></div>
                <span>Buscando...</span>
            </div>
        `;
        this.showSearchResults();
    }
    
    showErrorState(message) {
        const resultsContainer = this.searchResults.querySelector('.search-results-container') ||
                               this.searchResults;
        resultsContainer.innerHTML = `
            <div class="search-error">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <h4>Error en la búsqueda</h4>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="location.reload()">Reintentar</button>
            </div>
        `;
        this.showSearchResults();
    }
    
    isSearchOverlayVisible() {
        return this.searchResults?.classList.contains('active');
    }
    
    // Event handlers
    setupResultInteractions() {
        const resultsContainer = this.searchResults.querySelector('.search-results-container') ||
                               this.searchResults;
        
        resultsContainer.addEventListener('click', (e) => {
            const action = e.target.closest('[data-action]')?.dataset.action;
            
            switch (action) {
                case 'apply-suggestion':
                    this.applySuggestion(e.target.closest('[data-suggestion]').dataset.suggestion);
                    break;
                case 'apply-history':
                    this.applyHistoryItem(e.target.closest('[data-query]').dataset.query);
                    break;
                case 'clear-search':
                    this.clearSearch();
                    break;
                case 'clear-history':
                    this.clearSearchHistory();
                    break;
                case 'save-search':
                    this.saveSearch();
                    break;
            }
        });
    }
    
    applySuggestion(suggestion) {
        this.searchInput.value = suggestion;
        this.currentQuery = suggestion;
        this.performSearch(suggestion);
        this.trackEvent('suggestion_applied', { suggestion });
    }
    
    applyHistoryItem(query) {
        this.searchInput.value = query;
        this.currentQuery = query;
        this.performSearch(query);
        this.trackEvent('history_applied', { query });
    }
    
    clearSearch() {
        this.searchInput.value = '';
        this.currentQuery = '';
        this.hideSearchResults();
        this.trackEvent('search_cleared');
    }
    
    clearSearchHistory() {
        this.searchHistory = [];
        localStorage.removeItem('laburar_search_history');
        this.hideSearchResults();
        this.trackEvent('history_cleared');
    }
    
    // Cleanup
    destroy() {
        clearTimeout(this.debounceTimeout);
        this.searchCache.clear();
        
        // Remove event listeners
        document.removeEventListener('keydown', this.keyboardHandler);
        window.removeEventListener('resize', this.resizeHandler);
        
        // Remove overlay
        if (this.searchResults && this.searchResults.classList.contains('search-overlay-advanced')) {
            this.searchResults.remove();
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize only if search container exists
    if (document.querySelector('[data-search="container"]')) {
        window.laburAR = window.laburAR || {};
        window.laburAR.search = new AdvancedSearchManager();
        
        console.log('LaburAR Advanced Search initialized');
    }
});

// Auto-cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.laburAR?.search) {
        window.laburAR.search.destroy();
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedSearchManager;
}