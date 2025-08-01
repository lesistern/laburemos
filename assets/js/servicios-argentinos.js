/**
 * Servicios Argentinos - Frontend Manager
 * 
 * Sistema de gestión frontend especializado para servicios argentinos.
 * Características:
 * - Gestión de trust badges interactivos
 * - Calculadora de cuotas MercadoPago
 * - Filtros por verificaciones argentinas
 * - Interacciones de favoritos y comparaciones
 * - Gestión de ServiceCard dinámicas
 * 
 * @author LaburAR Team
 * @version 1.0
 * @since 2025-07-19
 */

class ServiciosArgentinosManager {
    
    constructor() {
        this.apiBase = '/api/';
        this.currentFilters = {
            category: '',
            trust_level: '',
            price_range: '',
            location: '',
            trust_badges: []
        };
        this.favoriteServices = new Set();
        this.compareServices = new Set();
        this.maxCompareServices = 3;
        
        this.init();
    }
    
    /**
     * Inicializar el sistema
     */
    init() {
        this.setupEventListeners();
        this.loadFavorites();
        this.initializeTrustBadgeTooltips();
        this.setupQuickContactModals();
        this.initializeFilters();
        this.setupServiceCardAnimations();
        
        console.log('ServiciosArgentinosManager initialized');
    }
    
    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Botones de favoritos
        document.addEventListener('click', (e) => {
            if (e.target.matches('.btn-favorite, .btn-favorite *')) {
                e.preventDefault();
                e.stopPropagation();
                const btn = e.target.closest('.btn-favorite');
                const serviceId = btn.dataset.serviceId;
                this.toggleFavorite(serviceId, btn);
            }
        });
        
        // Botones de compartir
        document.addEventListener('click', (e) => {
            if (e.target.matches('.btn-share, .btn-share *')) {
                e.preventDefault();
                e.stopPropagation();
                const btn = e.target.closest('.btn-share');
                const serviceId = btn.dataset.serviceId;
                this.shareService(serviceId);
            }
        });
        
        // Botones de contacto rápido
        document.addEventListener('click', (e) => {
            if (e.target.matches('.btn-quick-contact, .btn-quick-contact *')) {
                e.preventDefault();
                e.stopPropagation();
                const btn = e.target.closest('.btn-quick-contact');
                const userId = btn.dataset.userId;
                const serviceId = btn.dataset.serviceId;
                this.openQuickContact(userId, serviceId);
            }
        });
        
        // Filtros
        document.addEventListener('change', (e) => {
            if (e.target.matches('.filter-select, .filter-checkbox')) {
                this.updateFilters();
            }
        });
        
        // Comparar servicios
        document.addEventListener('click', (e) => {
            if (e.target.matches('.btn-compare, .btn-compare *')) {
                e.preventDefault();
                e.stopPropagation();
                const btn = e.target.closest('.btn-compare');
                const serviceId = btn.dataset.serviceId;
                this.toggleCompare(serviceId, btn);
            }
        });
        
        // Trust badges interactivos
        document.addEventListener('mouseenter', (e) => {
            if (e.target.matches('.trust-badge')) {
                this.showTrustBadgeTooltip(e.target);
            }
        }, true);
        
        document.addEventListener('mouseleave', (e) => {
            if (e.target.matches('.trust-badge')) {
                this.hideTrustBadgeTooltip();
            }
        }, true);
        
        // Calculadora de cuotas
        document.addEventListener('click', (e) => {
            if (e.target.matches('.calculate-installments, .calculate-installments *')) {
                e.preventDefault();
                const btn = e.target.closest('.calculate-installments');
                const price = parseFloat(btn.dataset.price);
                this.showInstallmentCalculator(price);
            }
        });
    }
    
    /**
     * Toggle favorito
     */
    async toggleFavorite(serviceId, buttonElement) {
        try {
            const isFavorite = this.favoriteServices.has(serviceId);
            const method = isFavorite ? 'DELETE' : 'POST';
            
            // Optimistic UI update
            this.updateFavoriteUI(buttonElement, !isFavorite);
            
            const response = await fetch(`${this.apiBase}FavoriteController.php?action=toggle`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': this.getCSRFToken()
                },
                body: JSON.stringify({
                    service_id: serviceId,
                    action: isFavorite ? 'remove' : 'add'
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                if (isFavorite) {
                    this.favoriteServices.delete(serviceId);
                } else {
                    this.favoriteServices.add(serviceId);
                }
                
                this.showToast(
                    isFavorite ? 'Servicio removido de favoritos' : 'Servicio agregado a favoritos',
                    'success'
                );
            } else {
                // Revert UI if API call failed
                this.updateFavoriteUI(buttonElement, isFavorite);
                this.showToast('Error al actualizar favoritos', 'error');
            }
            
        } catch (error) {
            console.error('Error toggling favorite:', error);
            // Revert UI
            this.updateFavoriteUI(buttonElement, this.favoriteServices.has(serviceId));
            this.showToast('Error de conexión', 'error');
        }
    }
    
    /**
     * Actualizar UI de favorito
     */
    updateFavoriteUI(buttonElement, isFavorite) {
        const icon = buttonElement.querySelector('i');
        if (isFavorite) {
            icon.className = 'icon-heart-filled';
            buttonElement.classList.add('favorited');
            buttonElement.title = 'Remover de favoritos';
        } else {
            icon.className = 'icon-heart';
            buttonElement.classList.remove('favorited');
            buttonElement.title = 'Agregar a favoritos';
        }
    }
    
    /**
     * Compartir servicio
     */
    async shareService(serviceId) {
        const serviceUrl = `${window.location.origin}/service-detail.php?id=${serviceId}`;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Servicio en LaburAR',
                    text: 'Mira este servicio que encontré en LaburAR',
                    url: serviceUrl
                });
            } catch (error) {
                console.log('Share cancelled or failed');
            }
        } else {
            // Fallback: copiar al clipboard
            try {
                await navigator.clipboard.writeText(serviceUrl);
                this.showToast('Enlace copiado al portapapeles', 'success');
            } catch (error) {
                this.showShareModal(serviceUrl);
            }
        }
    }
    
    /**
     * Mostrar modal de compartir
     */
    showShareModal(url) {
        const modal = document.createElement('div');
        modal.className = 'share-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Compartir Servicio</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <p>Copia este enlace para compartir:</p>
                    <div class="share-url-container">
                        <input type="text" value="${url}" readonly class="share-url-input">
                        <button class="copy-url-btn">Copiar</button>
                    </div>
                    <div class="social-share">
                        <a href="https://wa.me/?text=${encodeURIComponent(url)}" target="_blank" class="share-whatsapp">
                            <i class="icon-whatsapp"></i> WhatsApp
                        </a>
                        <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank" class="share-facebook">
                            <i class="icon-facebook"></i> Facebook
                        </a>
                        <a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}" target="_blank" class="share-twitter">
                            <i class="icon-twitter"></i> Twitter
                        </a>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners del modal
        modal.querySelector('.modal-close').onclick = () => modal.remove();
        modal.querySelector('.copy-url-btn').onclick = async () => {
            try {
                await navigator.clipboard.writeText(url);
                this.showToast('Enlace copiado', 'success');
                modal.remove();
            } catch (error) {
                console.error('Error copying to clipboard:', error);
            }
        };
        
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    }
    
    /**
     * Abrir contacto rápido
     */
    async openQuickContact(userId, serviceId) {
        try {
            // Cargar datos del freelancer
            const response = await fetch(`${this.apiBase}ProfileController.php?action=get-profile&user_id=${userId}`);
            const data = await response.json();
            
            if (data.success) {
                this.showQuickContactModal(data.data, serviceId);
            } else {
                this.showToast('Error al cargar perfil del freelancer', 'error');
            }
            
        } catch (error) {
            console.error('Error loading freelancer profile:', error);
            this.showToast('Error de conexión', 'error');
        }
    }
    
    /**
     * Mostrar modal de contacto rápido
     */
    showQuickContactModal(freelancerData, serviceId) {
        const modal = document.createElement('div');
        modal.className = 'quick-contact-modal modal show';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Contactar Freelancer</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="freelancer-info">
                        <img src="${freelancerData.avatar_url || '/assets/img/default-avatar.png'}" 
                             alt="${freelancerData.username}" class="freelancer-avatar-large">
                        <div class="freelancer-details">
                            <h4>${freelancerData.username}</h4>
                            <p class="freelancer-location">${freelancerData.location || 'Argentina'}</p>
                            <div class="freelancer-response-time">
                                <i class="icon-clock"></i>
                                Responde en ${freelancerData.response_time || '24 horas'}
                            </div>
                        </div>
                    </div>
                    
                    <form class="quick-contact-form">
                        <div class="form-group">
                            <label for="contact-subject">Asunto:</label>
                            <select id="contact-subject" required>
                                <option value="">Seleccionar...</option>
                                <option value="pregunta">Pregunta sobre el servicio</option>
                                <option value="cotizacion">Solicitar cotización</option>
                                <option value="personalizacion">Personalización del servicio</option>
                                <option value="plazo">Consulta sobre plazos</option>
                                <option value="otro">Otro</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="contact-message">Mensaje:</label>
                            <textarea id="contact-message" rows="4" 
                                      placeholder="Describe tu proyecto o pregunta..." required></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="contact-budget">Presupuesto estimado (opcional):</label>
                            <input type="text" id="contact-budget" placeholder="AR$ 0">
                        </div>
                        
                        <div class="modal-actions">
                            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                                Cancelar
                            </button>
                            <button type="submit" class="btn btn-primary">
                                Enviar Mensaje
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners
        modal.querySelector('.modal-close').onclick = () => modal.remove();
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
        
        modal.querySelector('.quick-contact-form').onsubmit = (e) => {
            e.preventDefault();
            this.sendQuickMessage(freelancerData.id, serviceId, modal);
        };
    }
    
    /**
     * Enviar mensaje rápido
     */
    async sendQuickMessage(userId, serviceId, modal) {
        const form = modal.querySelector('.quick-contact-form');
        const formData = new FormData(form);
        
        const messageData = {
            to_user_id: userId,
            service_id: serviceId,
            subject: form.querySelector('#contact-subject').value,
            message: form.querySelector('#contact-message').value,
            budget: form.querySelector('#contact-budget').value
        };
        
        try {
            const response = await fetch(`${this.apiBase}ChatController.php?action=send-message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': this.getCSRFToken()
                },
                body: JSON.stringify(messageData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showToast('Mensaje enviado exitosamente', 'success');
                modal.remove();
            } else {
                this.showToast('Error al enviar mensaje: ' + data.error, 'error');
            }
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.showToast('Error de conexión', 'error');
        }
    }
    
    /**
     * Toggle comparar servicios
     */
    toggleCompare(serviceId, buttonElement) {
        const isComparing = this.compareServices.has(serviceId);
        
        if (!isComparing && this.compareServices.size >= this.maxCompareServices) {
            this.showToast(`Máximo ${this.maxCompareServices} servicios para comparar`, 'warning');
            return;
        }
        
        if (isComparing) {
            this.compareServices.delete(serviceId);
            buttonElement.classList.remove('comparing');
            buttonElement.innerHTML = '<i class="icon-compare"></i> Comparar';
        } else {
            this.compareServices.add(serviceId);
            buttonElement.classList.add('comparing');
            buttonElement.innerHTML = '<i class="icon-check"></i> Comparando';
        }
        
        this.updateCompareButton();
    }
    
    /**
     * Actualizar botón de comparación
     */
    updateCompareButton() {
        let compareBtn = document.querySelector('.compare-services-btn');
        
        if (this.compareServices.size > 1) {
            if (!compareBtn) {
                compareBtn = document.createElement('button');
                compareBtn.className = 'compare-services-btn btn btn-primary';
                compareBtn.innerHTML = '<i class="icon-compare"></i> Comparar Servicios';
                compareBtn.onclick = () => this.showCompareModal();
                
                // Agregar al final del body con posición fija
                compareBtn.style.cssText = `
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    z-index: 1000;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                `;
                
                document.body.appendChild(compareBtn);
            }
            
            compareBtn.innerHTML = `<i class="icon-compare"></i> Comparar ${this.compareServices.size} Servicios`;
        } else {
            if (compareBtn) {
                compareBtn.remove();
            }
        }
    }
    
    /**
     * Mostrar tooltip de trust badge
     */
    showTrustBadgeTooltip(badgeElement) {
        const tooltip = document.createElement('div');
        tooltip.className = 'trust-badge-tooltip';
        
        const badgeType = badgeElement.className.match(/trust-badge-(\w+)/)?.[1];
        const tooltipContent = this.getTrustBadgeTooltipContent(badgeType);
        
        tooltip.innerHTML = tooltipContent;
        
        document.body.appendChild(tooltip);
        
        // Posicionar tooltip
        const rect = badgeElement.getBoundingClientRect();
        tooltip.style.cssText = `
            position: absolute;
            top: ${rect.bottom + 8}px;
            left: ${rect.left}px;
            z-index: 9999;
            background: #2d3748;
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 0.75rem;
            max-width: 200px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
    }
    
    /**
     * Ocultar tooltip de trust badge
     */
    hideTrustBadgeTooltip() {
        const tooltip = document.querySelector('.trust-badge-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }
    
    /**
     * Obtener contenido del tooltip de trust badge
     */
    getTrustBadgeTooltipContent(badgeType) {
        const tooltips = {
            'monotributo_verificado': 'Verificado por AFIP como monotributista activo. Garantiza formalidad fiscal.',
            'universidad_argentina': 'Título universitario verificado en universidad argentina reconocida.',
            'camara_comercio': 'Miembro activo de Cámara de Comercio argentina.',
            'referencias_verificadas': 'Referencias locales validadas por otros usuarios argentinos.',
            'identidad_verificada': 'Identidad verificada con documento argentino válido.'
        };
        
        return tooltips[badgeType] || 'Verificación de confianza argentina';
    }
    
    /**
     * Mostrar calculadora de cuotas
     */
    showInstallmentCalculator(price) {
        const installments = this.calculateInstallments(price);
        
        const modal = document.createElement('div');
        modal.className = 'installment-calculator-modal modal show';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Calculadora de Cuotas MercadoPago</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="price-display">
                        <h4>Precio: AR$ ${this.formatPrice(price)}</h4>
                    </div>
                    
                    <div class="installments-options">
                        ${installments.map(option => `
                            <div class="installment-option">
                                <div class="installment-count">${option.installments}x</div>
                                <div class="installment-details">
                                    <div class="installment-amount">AR$ ${this.formatPrice(option.amount)}</div>
                                    <div class="installment-total">Total: AR$ ${this.formatPrice(option.total)}</div>
                                    ${option.fee ? `<div class="installment-fee">Interés: ${option.fee}%</div>` : '<div class="installment-no-fee">Sin interés</div>'}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="mercadopago-info">
                        <img src="/assets/img/mercadopago-logo.png" alt="MercadoPago" class="mp-logo">
                        <p>Pagá con tarjeta de crédito a través de MercadoPago</p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('.modal-close').onclick = () => modal.remove();
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    }
    
    /**
     * Calcular cuotas sin interés
     */
    calculateInstallments(price) {
        const options = [];
        
        // 1 cuota (contado)
        options.push({
            installments: 1,
            amount: price,
            total: price,
            fee: 0
        });
        
        // 3 cuotas sin interés (mínimo $1000)
        if (price >= 1000) {
            options.push({
                installments: 3,
                amount: price / 3,
                total: price,
                fee: 0
            });
        }
        
        // 6 cuotas sin interés (mínimo $5000)
        if (price >= 5000) {
            options.push({
                installments: 6,
                amount: price / 6,
                total: price,
                fee: 0
            });
        }
        
        // 12 cuotas sin interés (mínimo $10000)
        if (price >= 10000) {
            options.push({
                installments: 12,
                amount: price / 12,
                total: price,
                fee: 0
            });
        }
        
        return options;
    }
    
    /**
     * Actualizar filtros
     */
    async updateFilters() {
        // Recoger valores de filtros
        const categorySelect = document.querySelector('#filter-category');
        const trustLevelSelect = document.querySelector('#filter-trust-level');
        const priceRangeSelect = document.querySelector('#filter-price-range');
        const locationSelect = document.querySelector('#filter-location');
        const trustBadgeCheckboxes = document.querySelectorAll('.trust-badge-filter:checked');
        
        this.currentFilters = {
            category: categorySelect?.value || '',
            trust_level: trustLevelSelect?.value || '',
            price_range: priceRangeSelect?.value || '',
            location: locationSelect?.value || '',
            trust_badges: Array.from(trustBadgeCheckboxes).map(cb => cb.value)
        };
        
        await this.applyFilters();
    }
    
    /**
     * Aplicar filtros
     */
    async applyFilters() {
        try {
            const params = new URLSearchParams();
            
            Object.entries(this.currentFilters).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    value.forEach(v => params.append(key + '[]', v));
                } else if (value) {
                    params.append(key, value);
                }
            });
            
            const response = await fetch(`${this.apiBase}SearchController.php?action=filter-services&${params}`);
            const data = await response.json();
            
            if (data.success) {
                this.updateServicesGrid(data.data.services);
                this.updateResultsCount(data.data.total);
            }
            
        } catch (error) {
            console.error('Error applying filters:', error);
            this.showToast('Error al aplicar filtros', 'error');
        }
    }
    
    /**
     * Actualizar grid de servicios
     */
    updateServicesGrid(services) {
        const grid = document.querySelector('.services-grid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        services.forEach((service, index) => {
            const serviceCard = this.createServiceCardElement(service);
            serviceCard.style.animationDelay = `${index * 0.1}s`;
            grid.appendChild(serviceCard);
        });
        
        // Reinicializar tooltips para las nuevas tarjetas
        this.initializeTrustBadgeTooltips();
    }
    
    /**
     * Crear elemento de tarjeta de servicio
     */
    createServiceCardElement(service) {
        const div = document.createElement('div');
        div.innerHTML = `
            <!-- Aquí iría el HTML generado por ServiceCard.php -->
            <!-- Por simplicidad, usamos un placeholder -->
            <div class="service-card" data-service-id="${service.id}">
                <h3>${service.title}</h3>
                <p>AR$ ${this.formatPrice(service.base_price)}</p>
                <!-- Más contenido de la tarjeta -->
            </div>
        `;
        
        return div.firstElementChild;
    }
    
    /**
     * Cargar favoritos del usuario
     */
    async loadFavorites() {
        try {
            const response = await fetch(`${this.apiBase}FavoriteController.php?action=get-favorites`);
            const data = await response.json();
            
            if (data.success) {
                this.favoriteServices = new Set(data.data.map(fav => fav.service_id));
                this.updateAllFavoriteButtons();
            }
            
        } catch (error) {
            console.error('Error loading favorites:', error);
        }
    }
    
    /**
     * Actualizar todos los botones de favorito
     */
    updateAllFavoriteButtons() {
        document.querySelectorAll('.btn-favorite').forEach(btn => {
            const serviceId = btn.dataset.serviceId;
            const isFavorite = this.favoriteServices.has(serviceId);
            this.updateFavoriteUI(btn, isFavorite);
        });
    }
    
    /**
     * Configurar tooltips de trust badges
     */
    initializeTrustBadgeTooltips() {
        // Ya configurado en setupEventListeners con event delegation
    }
    
    /**
     * Configurar modales de contacto rápido
     */
    setupQuickContactModals() {
        // Ya configurado en setupEventListeners
    }
    
    /**
     * Inicializar filtros
     */
    initializeFilters() {
        // Cargar filtros guardados del localStorage
        const savedFilters = localStorage.getItem('laburar_service_filters');
        if (savedFilters) {
            try {
                this.currentFilters = { ...this.currentFilters, ...JSON.parse(savedFilters) };
                this.applyFiltersToUI();
            } catch (error) {
                console.error('Error loading saved filters:', error);
            }
        }
    }
    
    /**
     * Aplicar filtros a la UI
     */
    applyFiltersToUI() {
        Object.entries(this.currentFilters).forEach(([key, value]) => {
            if (key === 'trust_badges' && Array.isArray(value)) {
                value.forEach(badgeValue => {
                    const checkbox = document.querySelector(`input[value="${badgeValue}"]`);
                    if (checkbox) checkbox.checked = true;
                });
            } else {
                const select = document.querySelector(`#filter-${key.replace('_', '-')}`);
                if (select) select.value = value;
            }
        });
    }
    
    /**
     * Configurar animaciones de service cards
     */
    setupServiceCardAnimations() {
        // Intersection Observer para animaciones de entrada
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        
        document.querySelectorAll('.service-card').forEach(card => {
            observer.observe(card);
        });
    }
    
    /**
     * Formatear precio argentino
     */
    formatPrice(price) {
        return new Intl.NumberFormat('es-AR').format(price);
    }
    
    /**
     * Obtener CSRF token
     */
    getCSRFToken() {
        const metaTag = document.querySelector('meta[name="csrf-token"]');
        return metaTag ? metaTag.content : '';
    }
    
    /**
     * Mostrar toast notification
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type} show`;
        toast.textContent = message;
        
        // Estilos inline para asegurar visibilidad
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        // Colores por tipo
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#6FBFEF'
        };
        
        toast.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(toast);
        
        // Animación de entrada
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto-remove después de 3 segundos
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }, 3000);
    }
    
    /**
     * Actualizar contador de resultados
     */
    updateResultsCount(total) {
        const counter = document.querySelector('.results-count');
        if (counter) {
            counter.textContent = `${total} servicios encontrados`;
        }
    }
}

// Auto-inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Verificar si estamos en una página de servicios
    if (document.querySelector('.services-grid') || document.querySelector('.service-card')) {
        window.serviciosManager = new ServiciosArgentinosManager();
    }
});

// Exportar para uso global
window.ServiciosArgentinosManager = ServiciosArgentinosManager;