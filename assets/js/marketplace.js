/**
 * Marketplace JavaScript
 * LaburAR Complete Platform
 * 
 * Service browsing, search, filtering,
 * and discovery functionality
 */

class MarketplaceManager {
    constructor() {
        this.apiBase = '/Laburar/api';
        this.publicApiBase = '/Laburar/api/marketplace-public.php';
        this.currentFilters = {};
        this.currentPage = 1;
        this.searchTimeout = null;
        this.loading = false;
        this.viewMode = 'grid'; // 'grid' or 'list'
        this.isAuthenticated = !!localStorage.getItem('access_token');
        
        this.init();
    }
    
    init() {
        this.initSearch();
        this.initFilters();
        this.initCategories();
        this.initEventListeners();
        this.loadFeaturedServices();
        this.loadServices();
        
        // Load initial data from URL parameters
        this.loadFromURL();
        
        // Setup guest-friendly interactions
        this.setupGuestInteractions();
    }
    
    // ===== Search Functionality =====
    
    initSearch() {
        const searchInput = document.getElementById('searchInput');
        const searchButton = document.getElementById('searchButton');
        const suggestionsContainer = document.getElementById('searchSuggestions');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearchInput(e.target.value);
            });
            
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.performSearch(e.target.value);
                }
            });
            
            // Hide suggestions when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.search-container')) {
                    this.hideSuggestions();
                }
            });
        }
        
        if (searchButton) {
            searchButton.addEventListener('click', () => {
                const query = searchInput?.value || '';
                this.performSearch(query);
            });
        }
    }
    
    handleSearchInput(query) {
        clearTimeout(this.searchTimeout);
        
        if (query.length < 2) {
            this.hideSuggestions();
            return;
        }
        
        this.searchTimeout = setTimeout(() => {
            this.loadSuggestions(query);
        }, 300);
    }
    
    async loadSuggestions(query) {
        try {
            const response = await fetch(`${this.apiBase}/SearchController.php?action=autocomplete&q=${encodeURIComponent(query)}`);
            const data = await response.json();
            
            if (data.success) {
                this.renderSuggestions(data.data.suggestions);
            }
        } catch (error) {
            console.error('Error loading suggestions:', error);
        }
    }
    
    renderSuggestions(suggestions) {
        const container = document.getElementById('searchSuggestions');
        if (!container || suggestions.length === 0) {
            this.hideSuggestions();
            return;
        }
        
        const suggestionsHTML = suggestions.map(suggestion => `
            <div class=\"suggestion-item\" onclick=\"marketplaceManager.selectSuggestion('${suggestion.suggestion}', '${suggestion.type}')\">
                <span class=\"suggestion-type\">${this.getSuggestionTypeLabel(suggestion.type)}</span>
                <span>${suggestion.suggestion}</span>
            </div>
        `).join('');
        
        container.innerHTML = suggestionsHTML;
        container.classList.add('show');
    }
    
    selectSuggestion(suggestion, type) {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = suggestion;
        }
        
        this.hideSuggestions();
        this.performSearch(suggestion);
    }
    
    hideSuggestions() {
        const container = document.getElementById('searchSuggestions');
        if (container) {
            container.classList.remove('show');
        }
    }
    
    performSearch(query) {
        this.currentFilters.q = query;
        this.currentPage = 1;
        this.updateURL();
        this.loadServices();
        this.hideSuggestions();
    }
    
    getSuggestionTypeLabel(type) {
        const labels = {
            'service': 'Servicio',
            'category': 'Categoría',
            'tag': 'Tag'
        };
        return labels[type] || type;
    }
    
    // ===== Categories =====
    
    async initCategories() {
        try {
            // Use public API for categories (available to all users)
            const apiUrl = `${this.publicApiBase}?endpoint=categories`;
            const response = await fetch(apiUrl);
            const data = await response.json();
            
            if (data.success) {
                this.renderCategories(data.data);
                this.populateCategoryFilter(data.data);
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }
    
    renderCategories(categories) {
        const container = document.getElementById('categoriesGrid');
        if (!container) return;
        
        const categoriesHTML = categories.map(category => `
            <a href="#" class="category-card" onclick="marketplaceManager.selectCategory('${category.slug}', event)">
                <span class="category-icon">${category.icon || '📁'}</span>
                <div class="category-name">${category.name}</div>
                <div class="category-count">${category.service_count || 0} servicios</div>
            </a>
        `).join('');
        
        container.innerHTML = categoriesHTML;
    }
    
    selectCategory(categorySlug, event) {
        event.preventDefault();
        this.currentFilters.category = categorySlug;
        this.currentPage = 1;
        this.updateURL();
        this.loadServices();
        this.updateActiveFilters();
    }
    
    populateCategoryFilter(categories) {
        const categorySelect = document.getElementById('categoryFilter');
        if (!categorySelect) return;
        
        // Keep existing "Todas las categorías" option
        const defaultOption = categorySelect.querySelector('option[value=""]');
        categorySelect.innerHTML = '';
        
        if (defaultOption) {
            categorySelect.appendChild(defaultOption);
        } else {
            const allOption = document.createElement('option');
            allOption.value = '';
            allOption.textContent = 'Todas las categorías';
            categorySelect.appendChild(allOption);
        }
        
        // Add category options
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.slug;
            option.textContent = `${category.name} (${category.service_count})`;
            categorySelect.appendChild(option);
        });
    }
    
    // ===== Filters =====
    
    initFilters() {
        // Category filter
        const categorySelect = document.getElementById('categoryFilter');
        if (categorySelect) {
            categorySelect.addEventListener('change', (e) => {
                this.applyFilter('category_id', e.target.value);
            });
        }
        
        // Price range filters
        const priceMinInput = document.getElementById('priceMin');
        const priceMaxInput = document.getElementById('priceMax');
        
        if (priceMinInput) {
            priceMinInput.addEventListener('change', (e) => {
                this.applyFilter('price_min', e.target.value);
            });
        }
        
        if (priceMaxInput) {
            priceMaxInput.addEventListener('change', (e) => {
                this.applyFilter('price_max', e.target.value);
            });
        }
        
        // Delivery time filter
        const deliveryFilter = document.getElementById('deliveryFilter');
        if (deliveryFilter) {
            deliveryFilter.addEventListener('change', (e) => {
                this.applyFilter('delivery_days', e.target.value);
            });
        }
        
        // Rating filter
        const ratingFilter = document.getElementById('ratingFilter');
        if (ratingFilter) {
            ratingFilter.addEventListener('change', (e) => {
                this.applyFilter('min_rating', e.target.value);
            });
        }
        
        // Boolean filters
        const featuredCheck = document.getElementById('featuredFilter');
        if (featuredCheck) {
            featuredCheck.addEventListener('change', (e) => {
                this.applyFilter('featured', e.target.checked ? '1' : '');
            });
        }
        
        const expressCheck = document.getElementById('expressFilter');
        if (expressCheck) {
            expressCheck.addEventListener('change', (e) => {
                this.applyFilter('express_delivery', e.target.checked ? '1' : '');
            });
        }
        
        // Clear filters button
        const clearButton = document.getElementById('clearFilters');
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                this.clearFilters();
            });
        }
    }
    
    applyFilter(key, value) {
        if (value === '' || value === null || value === undefined) {
            delete this.currentFilters[key];
        } else {
            this.currentFilters[key] = value;
        }
        
        this.currentPage = 1;
        this.updateURL();
        this.loadServices();
        this.updateActiveFilters();
    }
    
    clearFilters() {
        this.currentFilters = {};
        this.currentPage = 1;
        this.updateURL();
        this.loadServices();
        this.updateActiveFilters();
        this.resetFilterInputs();
    }
    
    resetFilterInputs() {
        const inputs = document.querySelectorAll('#filtersSection input, #filtersSection select');
        inputs.forEach(input => {
            if (input.type === 'checkbox') {
                input.checked = false;
            } else {
                input.value = '';
            }
        });
    }
    
    updateActiveFilters() {
        const container = document.getElementById('activeFilters');
        if (!container) return;
        
        const activeFilters = [];
        
        // Add active filter tags
        if (this.currentFilters.q) {
            activeFilters.push({
                key: 'q',
                label: `Búsqueda: "${this.currentFilters.q}"`,
                value: this.currentFilters.q
            });
        }
        
        if (this.currentFilters.category_id) {
            activeFilters.push({
                key: 'category_id',
                label: 'Categoría seleccionada',
                value: this.currentFilters.category_id
            });
        }
        
        if (this.currentFilters.price_min || this.currentFilters.price_max) {
            const min = this.currentFilters.price_min || '0';
            const max = this.currentFilters.price_max || '∞';
            activeFilters.push({
                key: 'price',
                label: `Precio: $${min} - $${max}`,
                value: 'price_range'
            });
        }
        
        if (this.currentFilters.delivery_days) {
            activeFilters.push({
                key: 'delivery_days',
                label: `Entrega: ${this.currentFilters.delivery_days} días máx`,
                value: this.currentFilters.delivery_days
            });
        }
        
        if (this.currentFilters.min_rating) {
            activeFilters.push({
                key: 'min_rating',
                label: `Rating: ${this.currentFilters.min_rating}+ estrellas`,
                value: this.currentFilters.min_rating
            });
        }
        
        if (this.currentFilters.featured) {
            activeFilters.push({
                key: 'featured',
                label: 'Solo destacados',
                value: 'featured'
            });
        }
        
        if (this.currentFilters.express_delivery) {
            activeFilters.push({
                key: 'express_delivery',
                label: 'Entrega express',
                value: 'express'
            });
        }
        
        if (activeFilters.length === 0) {
            container.style.display = 'none';
            return;
        }
        
        const filtersHTML = activeFilters.map(filter => `
            <span class=\"active-filter-tag\">
                ${filter.label}
                <button class=\"filter-remove\" onclick=\"marketplaceManager.removeFilter('${filter.key}', '${filter.value}')\">&times;</button>
            </span>
        `).join('');
        
        container.innerHTML = `<div class=\"active-filters-list\">${filtersHTML}</div>`;
        container.style.display = 'block';
    }
    
    removeFilter(key, value) {
        if (key === 'price') {
            delete this.currentFilters.price_min;
            delete this.currentFilters.price_max;
        } else {
            delete this.currentFilters[key];
        }
        
        this.currentPage = 1;
        this.updateURL();
        this.loadServices();
        this.updateActiveFilters();
        this.resetFilterInputs();
    }
    
    // ===== Services Loading =====
    
    async loadServices() {
        if (this.loading) return;
        
        try {
            this.loading = true;
            this.showLoading();
            
            const params = new URLSearchParams({
                ...this.currentFilters,
                page: this.currentPage,
                limit: 20
            });
            
            // Use public API for guest users, authenticated API for logged-in users
            const apiUrl = this.isAuthenticated 
                ? `${this.apiBase}/SearchController.php?action=search&${params}`
                : `${this.publicApiBase}?endpoint=services&${params}`;
                
            const response = await fetch(apiUrl);
            const data = await response.json();
            
            if (data.success) {
                this.renderServices(data.data.services);
                this.renderPagination(data.data.pagination);
                this.updateResultsCount(data.data.pagination.total);
            } else {
                this.showError('Error al cargar servicios: ' + data.error);
            }
            
        } catch (error) {
            console.error('Error loading services:', error);
            this.showError('Error al cargar servicios');
        } finally {
            this.loading = false;
            this.hideLoading();
        }
    }
    
    renderServices(services) {
        const gridContainer = document.getElementById('servicesGrid');
        const listContainer = document.getElementById('servicesList');
        
        if (!gridContainer && !listContainer) return;
        
        if (services.length === 0) {
            this.showEmptyState();
            return;
        }
        
        const gridHTML = services.map(service => this.createServiceCardHTML(service)).join('');
        const listHTML = services.map(service => this.createServiceListHTML(service)).join('');
        
        if (gridContainer) {
            gridContainer.innerHTML = gridHTML;
        }
        
        if (listContainer) {
            listContainer.innerHTML = listHTML;
        }
        
        this.hideEmptyState();
    }
    
    createServiceCardHTML(service) {
        const badges = [];
        if (service.featured) badges.push('<span class=\"service-badge\">Destacado</span>');
        if (service.recent_views > 10) badges.push('<span class=\"service-badge trending\">Trending</span>');
        
        const tags = (service.tags || []).slice(0, 3).map(tag => 
            `<span class=\"service-tag\">${tag}</span>`
        ).join('');
        
        const stars = this.generateStars(service.rating_average || 0);
        
        return `
            <div class=\"service-card\" onclick=\"marketplaceManager.viewService(${service.id})\" data-service-id=\"${service.id}\">
                <div class=\"service-image\">
                    ${service.featured_image ? 
                        `<img src=\"${service.featured_image}\" alt=\"${service.title}\" style=\"width: 100%; height: 100%; object-fit: cover;\">` :
                        `<span style=\"font-size: 3rem;\">📁</span>`
                    }
                    ${badges.length > 0 ? `<div class=\"service-badges\">${badges.join('')}</div>` : ''}
                    <button class=\"service-favorite\" onclick=\"marketplaceManager.toggleFavorite(${service.id}, event)\">
                        ♡
                    </button>
                </div>
                <div class=\"service-content\">
                    <div class=\"service-header\">
                        <h3 class=\"service-title\">${service.title}</h3>
                        <div class=\"service-freelancer\">
                            <img src=\"${service.avatar_url || '/Laburar/assets/img/default-avatar.png'}\" 
                                 alt=\"${service.freelancer_name}\" class=\"freelancer-avatar\">
                            <div class=\"freelancer-info\">
                                <div class=\"freelancer-name\">${service.freelancer_name}</div>
                                <div class=\"freelancer-rating\">
                                    <span class=\"rating-stars\">${stars}</span>
                                    <span>${service.freelancer_rating || '5.0'} (${service.rating_count || 0})</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <p class=\"service-description\">${service.short_description || service.description}</p>
                    ${tags ? `<div class=\"service-tags\">${tags}</div>` : ''}
                    <div class=\"service-footer\">
                        <div class=\"service-price\">${this.formatPrice(service.base_price)}</div>
                        <div class=\"service-delivery\">
                            <span>🚚</span>
                            <span>${service.delivery_text || service.delivery_days + ' días'}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    createServiceListHTML(service) {
        const tags = (service.tags || []).slice(0, 5).map(tag => 
            `<span class=\"service-tag\">${tag}</span>`
        ).join('');
        
        const stars = this.generateStars(service.rating_average || 0);
        
        return `
            <div class=\"service-list-item\" onclick=\"marketplaceManager.viewService(${service.id})\" data-service-id=\"${service.id}\">
                <div class=\"service-list-image\">
                    ${service.featured_image ? 
                        `<img src=\"${service.featured_image}\" alt=\"${service.title}\" class=\"service-list-image\">` :
                        `<div class=\"service-list-image\" style=\"display: flex; align-items: center; justify-content: center; background: var(--light-gray); font-size: 3rem;\">📁</div>`
                    }
                </div>
                <div class=\"service-list-content\">
                    <div class=\"service-list-header\">
                        <div>
                            <h3 class=\"service-title\">${service.title}</h3>
                            <div class=\"service-freelancer\">
                                <span class=\"freelancer-name\">${service.freelancer_name}</span>
                                <span class=\"freelancer-rating\">
                                    <span class=\"rating-stars\">${stars}</span>
                                    ${service.freelancer_rating || '5.0'} (${service.rating_count || 0})
                                </span>
                            </div>
                        </div>
                        <button class=\"service-favorite\" onclick=\"marketplaceManager.toggleFavorite(${service.id}, event)\">
                            ♡
                        </button>
                    </div>
                    <p class=\"service-description\">${service.description}</p>
                    ${tags ? `<div class=\"service-tags\">${tags}</div>` : ''}
                    <div class=\"service-list-meta\">
                        <div class=\"service-price\">${this.formatPrice(service.base_price)}</div>
                        <div class=\"service-delivery\">
                            <span>🚚</span>
                            <span>${service.delivery_text || service.delivery_days + ' días'}</span>
                        </div>
                        <div style=\"margin-left: auto;\">
                            <span style=\"color: var(--text-secondary); font-size: var(--font-size-sm);\">${service.category_name}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // ===== Featured Services =====
    
    async loadFeaturedServices() {
        try {
            // Use public API for featured services (available to all users)
            const apiUrl = `${this.publicApiBase}?endpoint=featured&limit=8`;
            const response = await fetch(apiUrl);
            const data = await response.json();
            
            if (data.success) {
                this.renderFeaturedServices(data.data);
            }
        } catch (error) {
            console.error('Error loading featured services:', error);
        }
    }
    
    renderFeaturedServices(services) {
        const container = document.getElementById('featuredServices');
        if (!container || services.length === 0) return;
        
        const servicesHTML = services.map(service => this.createServiceCardHTML(service)).join('');
        container.innerHTML = servicesHTML;
    }
    
    // ===== Event Listeners =====
    
    initEventListeners() {
        // View mode toggle
        const gridButton = document.getElementById('gridView');
        const listButton = document.getElementById('listView');
        
        if (gridButton && listButton) {
            gridButton.addEventListener('click', () => this.setViewMode('grid'));
            listButton.addEventListener('click', () => this.setViewMode('list'));
        }
        
        // Sort dropdown
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.applyFilter('sort', e.target.value);
            });
        }
    }
    
    setViewMode(mode) {
        this.viewMode = mode;
        
        const gridContainer = document.getElementById('servicesGrid');
        const listContainer = document.getElementById('servicesList');
        const gridButton = document.getElementById('gridView');
        const listButton = document.getElementById('listView');
        
        if (mode === 'grid') {
            if (gridContainer) gridContainer.style.display = 'grid';
            if (listContainer) listContainer.style.display = 'none';
            if (gridButton) gridButton.classList.add('active');
            if (listButton) listButton.classList.remove('active');
        } else {
            if (gridContainer) gridContainer.style.display = 'none';
            if (listContainer) listContainer.style.display = 'block';
            if (gridButton) gridButton.classList.remove('active');
            if (listButton) listButton.classList.add('active');
        }
    }
    
    // ===== Service Actions =====
    
    viewService(serviceId) {
        // Track service view
        this.trackServiceView(serviceId);
        
        // Navigate to service detail page
        window.location.href = `/Laburar/service.html?id=${serviceId}`;
    }
    
    async toggleFavorite(serviceId, event) {
        event.stopPropagation();
        
        try {
            const response = await fetch(`${this.apiBase}/FavoriteController.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify({
                    action: 'toggle',
                    service_id: serviceId
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                const button = event.target;
                button.textContent = data.data.favorited ? '♥' : '♡';
                button.classList.toggle('active', data.data.favorited);
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
    }
    
    async trackServiceView(serviceId) {
        try {
            await fetch(`${this.apiBase}/AnalyticsController.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'track_view',
                    service_id: serviceId,
                    page: 'marketplace'
                })
            });
        } catch (error) {
            // Silent fail for analytics
            console.error('Error tracking view:', error);
        }
    }
    
    // ===== Pagination =====
    
    renderPagination(pagination) {
        const container = document.getElementById('pagination');
        if (!container) return;
        
        const { current_page, total_pages, total } = pagination;
        
        if (total_pages <= 1) {
            container.style.display = 'none';
            return;
        }
        
        let paginationHTML = '';
        
        // Previous button
        paginationHTML += `
            <button class=\"pagination-button\" 
                    onclick=\"marketplaceManager.goToPage(${current_page - 1})\" 
                    ${current_page === 1 ? 'disabled' : ''}>
                ← Anterior
            </button>
        `;
        
        // Page numbers
        const startPage = Math.max(1, current_page - 2);
        const endPage = Math.min(total_pages, current_page + 2);
        
        if (startPage > 1) {
            paginationHTML += `<button class=\"pagination-button\" onclick=\"marketplaceManager.goToPage(1)\">1</button>`;
            if (startPage > 2) {
                paginationHTML += `<span>...</span>`;
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class=\"pagination-button ${i === current_page ? 'active' : ''}\" 
                        onclick=\"marketplaceManager.goToPage(${i})\">
                    ${i}
                </button>
            `;
        }
        
        if (endPage < total_pages) {
            if (endPage < total_pages - 1) {
                paginationHTML += `<span>...</span>`;
            }
            paginationHTML += `<button class=\"pagination-button\" onclick=\"marketplaceManager.goToPage(${total_pages})\">${total_pages}</button>`;
        }
        
        // Next button
        paginationHTML += `
            <button class=\"pagination-button\" 
                    onclick=\"marketplaceManager.goToPage(${current_page + 1})\" 
                    ${current_page === total_pages ? 'disabled' : ''}>
                Siguiente →
            </button>
        `;
        
        container.innerHTML = paginationHTML;
        container.style.display = 'flex';
    }
    
    goToPage(page) {
        this.currentPage = page;
        this.updateURL();
        this.loadServices();
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    // ===== URL Management =====
    
    updateURL() {
        const params = new URLSearchParams({
            ...this.currentFilters,
            page: this.currentPage
        });
        
        // Remove empty parameters
        for (const [key, value] of params.entries()) {
            if (!value) {
                params.delete(key);
            }
        }
        
        const newURL = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({}, '', newURL);
    }
    
    loadFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        
        for (const [key, value] of urlParams.entries()) {
            if (key === 'page') {
                this.currentPage = parseInt(value) || 1;
            } else {
                this.currentFilters[key] = value;
            }
        }
        
        // Update form inputs
        this.updateFormFromFilters();
        this.updateActiveFilters();
    }
    
    updateFormFromFilters() {
        Object.entries(this.currentFilters).forEach(([key, value]) => {
            const input = document.getElementById(key + 'Filter') || document.getElementById(key);
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = value === '1' || value === 'true';
                } else {
                    input.value = value;
                }
            }
        });
        
        // Update search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput && this.currentFilters.q) {
            searchInput.value = this.currentFilters.q;
        }
    }
    
    // ===== Helper Methods =====
    
    updateResultsCount(total) {
        const container = document.getElementById('resultsCount');
        if (container) {
            container.textContent = `${total.toLocaleString()} servicios encontrados`;
        }
    }
    
    formatPrice(price, currency = 'ARS') {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0
        }).format(price);
    }
    
    generateStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalf = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);
        
        return '★'.repeat(fullStars) + 
               (hasHalf ? '☆' : '') + 
               '☆'.repeat(emptyStars);
    }
    
    showLoading() {
        const container = document.getElementById('servicesGrid');
        if (container) {
            container.innerHTML = this.getLoadingSkeletonHTML();
        }
    }
    
    hideLoading() {
        // Loading is hidden when real content is rendered
    }
    
    showEmptyState() {
        const container = document.getElementById('servicesGrid');
        if (container) {
            container.innerHTML = `
                <div class=\"empty-state\" style=\"grid-column: 1 / -1;\">
                    <div class=\"empty-icon\">🔍</div>
                    <h3 class=\"empty-title\">No se encontraron servicios</h3>
                    <p class=\"empty-description\">
                        Prueba ajustando los filtros o busca con diferentes términos.
                    </p>
                    <button class=\"empty-action\" onclick=\"marketplaceManager.clearFilters()\">
                        Limpiar filtros
                    </button>
                </div>
            `;
        }
    }
    
    hideEmptyState() {
        // Empty state is hidden when real content is rendered
    }
    
    // ===== Guest User Interactions =====
    
    setupGuestInteractions() {
        // Allow marketplace browsing for all users
        // but require authentication for interactions
        this.isAuthenticated = this.checkAuthentication();
        
        if (!this.isAuthenticated) {
            this.setupGuestServiceCards();
        }
    }
    
    checkAuthentication() {
        return !!localStorage.getItem('access_token');
    }
    
    setupGuestServiceCards() {
        // Override service card interactions for guests
        document.addEventListener('click', (e) => {
            if (e.target.matches('.service-card, .service-card *')) {
                const serviceCard = e.target.closest('.service-card');
                if (serviceCard && !this.isAuthenticated) {
                    this.handleGuestServiceCardClick(e, serviceCard);
                }
            }
        });
    }
    
    handleGuestServiceCardClick(event, serviceCard) {
        // Allow viewing service details but require auth for actions
        const isActionButton = event.target.matches('.btn, .service-actions *, .favorite-btn, .contact-btn');
        
        if (isActionButton) {
            event.preventDefault();
            event.stopPropagation();
            
            this.showAuthPrompt('interact');
            return;
        }
        
        // Allow viewing service details (opening modal or navigation)
        // but with limited functionality
    }
    
    showAuthPrompt(action) {
        let message = '';
        let actionText = 'Registrarse Gratis';
        
        switch(action) {
            case 'interact':
                message = '💼 Para contactar freelancers y contratar servicios necesitas una cuenta gratuita';
                break;
            case 'favorite':
                message = '❤️ Para guardar servicios favoritos necesitas crear una cuenta';
                break;
            case 'filter':
                message = '🔍 Algunas funciones de filtrado avanzado requieren una cuenta';
                break;
            default:
                message = '🔐 Esta función requiere una cuenta de LaburAR';
        }
        
        if (window.laburAR?.microInteractions) {
            window.laburAR.microInteractions.showToast(
                message,
                'info',
                {
                    duration: 5000,
                    showAction: true,
                    actionText: actionText,
                    actionCallback: () => window.location.href = '/Laburar/register.html'
                }
            );
        } else {
            // Fallback if microInteractions not available
            const proceed = confirm(message + '\n\n¿Quieres registrarte ahora?');
            if (proceed) {
                window.location.href = '/Laburar/register.html';
            }
        }
    }
    
    // Modified service rendering for guests
    renderServiceCard(service, isGuest = false) {
        const isAuthenticated = this.checkAuthentication();
        const contactButton = isAuthenticated 
            ? `<button class="btn btn-primary btn-sm contact-btn" data-service-id="${service.id}">Contactar</button>`
            : `<button class="btn btn-outline btn-sm contact-btn-guest" onclick="window.handleServiceInteraction('${service.id}', 'contact')">Contactar</button>`;
            
        const favoriteButton = isAuthenticated
            ? `<button class="favorite-btn" data-service-id="${service.id}" aria-label="Agregar a favoritos">❤️</button>`
            : `<button class="favorite-btn-guest" onclick="window.handleServiceInteraction('${service.id}', 'favorite')" aria-label="Agregar a favoritos">❤️</button>`;
        
        return `
            <div class="service-card" data-service-id="${service.id}">
                <div class="service-image-container">
                    <img src="${service.image_url || '/Laburar/assets/img/service-placeholder.jpg'}" 
                         alt="${service.title}" 
                         class="service-image"
                         loading="lazy">
                    <div class="service-image-overlay">
                        ${favoriteButton}
                    </div>
                </div>
                
                <div class="service-content">
                    <div class="service-header">
                        <div class="freelancer-info">
                            <img src="${service.freelancer?.avatar || '/Laburar/assets/img/avatar-placeholder.jpg'}" 
                                 alt="${service.freelancer?.name}" 
                                 class="freelancer-avatar">
                            <span class="freelancer-name">${service.freelancer?.name || 'Freelancer'}</span>
                            ${service.freelancer?.verified ? '<span class="verified-badge">✓</span>' : ''}
                        </div>
                        <div class="service-rating">
                            <span class="stars">${this.generateStars(service.rating || 0)}</span>
                            <span class="rating-count">(${service.reviews_count || 0})</span>
                        </div>
                    </div>
                    
                    <h3 class="service-title">${service.title}</h3>
                    <p class="service-description">${service.description?.substring(0, 120) || ''}...</p>
                    
                    <div class="service-tags">
                        ${service.tags?.map(tag => `<span class="service-tag">${tag}</span>`).join('') || ''}
                    </div>
                    
                    <div class="service-footer">
                        <div class="service-price">
                            <span class="price-label">Desde</span>
                            <span class="price-amount">${this.formatPrice(service.starting_price || 0)}</span>
                        </div>
                        <div class="service-actions">
                            ${contactButton}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    getLoadingSkeletonHTML() {
        return Array(8).fill().map(() => `
            <div class=\"skeleton-service-card\">
                <div class=\"skeleton-image loading-skeleton\"></div>
                <div class=\"skeleton-content\">
                    <div class=\"skeleton-title loading-skeleton\"></div>
                    <div class=\"skeleton-text loading-skeleton\"></div>
                    <div class=\"skeleton-text loading-skeleton short\"></div>
                </div>
            </div>
        `).join('');
    }
    
    showError(message) {
        // TODO: Implement proper error display
        console.error('Marketplace Error:', message);
    }
}

// ===== Initialize on DOM Load =====
document.addEventListener('DOMContentLoaded', () => {
    window.marketplaceManager = new MarketplaceManager();
});

// ===== Export for use in other scripts =====
window.MarketplaceManager = MarketplaceManager;