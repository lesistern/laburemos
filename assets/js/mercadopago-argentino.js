/**
 * MercadoPago Argentino - Frontend Integration
 * 
 * Sistema completo de integración con MercadoPago para Argentina:
 * - Gestión de cuotas sin interés
 * - Validación CUIT/DNI argentino
 * - Checkout flow optimizado para Argentina
 * - Cálculo de impuestos en tiempo real
 * - UX específico para usuarios argentinos
 * 
 * @author LaburAR Team
 * @version 1.0
 * @since 2025-07-20
 */

class MercadoPagoArgentino {
    
    constructor(mercadoPagoInstance, checkoutData) {
        this.mp = mercadoPagoInstance;
        this.checkoutData = checkoutData;
        this.selectedInstallments = 1;
        this.selectedPaymentMethod = 'credit_card';
        this.currentPreference = null;
        this.isLoading = false;
        
        // Configuración específica argentina
        this.config = {
            maxInstallments: 12,
            minAmountForInstallments: 1000, // AR$ 1000
            taxRates: {
                iva: 0.21,
                iibb: 0.02
            },
            validationRules: {
                cuit: /^\d{11}$/,
                dni: /^\d{7,8}$/,
                phone: /^\+?54\s?9?\s?\d{2,4}\s?\d{4}\s?\d{4}$/
            }
        };
        
        this.init();
    }
    
    /**
     * Inicializar el sistema
     */
    init() {
        console.log('Iniciando MercadoPago Argentino...', this.checkoutData);
        
        this.setupEventListeners();
        this.initializePaymentMethods();
        this.setupFormValidation();
        this.calculateInitialPricing();
        this.setupInstallmentCalculator();
        
        // Configurar filtros manager si existe
        if (window.filtrosManager) {
            this.integrateFiltrosManager();
        }
    }
    
    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Método de pago seleccionado
        document.addEventListener('click', (e) => {
            if (e.target.closest('.payment-method')) {
                this.selectPaymentMethod(e.target.closest('.payment-method'));
            }
        });
        
        // Cuotas seleccionadas
        document.addEventListener('click', (e) => {
            if (e.target.closest('.installment-option')) {
                this.selectInstallments(e.target.closest('.installment-option'));
            }
        });
        
        // Extras seleccionados
        document.addEventListener('change', (e) => {
            if (e.target.matches('input[name="extras[]"]')) {
                this.updateExtras();
            }
        });
        
        // Validación en tiempo real
        document.addEventListener('input', (e) => {
            if (e.target.matches('#buyer-document')) {
                this.validateArgentineDocument(e.target);
            }
            if (e.target.matches('#buyer-phone')) {
                this.validateArgentinePhone(e.target);
            }
        });
        
        // Botón de compra
        const purchaseBtn = document.getElementById('complete-purchase-btn');
        if (purchaseBtn) {
            purchaseBtn.addEventListener('click', () => this.completePurchase());
        }
        
        // Tipo de facturación
        document.addEventListener('change', (e) => {
            if (e.target.matches('input[name="billing_type"]')) {
                this.updateBillingType(e.target.value);
            }
        });
        
        // Validación de términos
        document.addEventListener('change', (e) => {
            if (e.target.matches('input[name="accept_terms"], input[name="accept_protection"]')) {
                this.validateTermsAcceptance();
            }
        });
    }
    
    /**
     * Inicializar métodos de pago
     */
    initializePaymentMethods() {
        // Seleccionar tarjeta de crédito por defecto
        const creditCard = document.querySelector('.payment-method.credit-card');
        if (creditCard) {
            this.selectPaymentMethod(creditCard);
        }
        
        // Cargar métodos de pago disponibles
        this.loadAvailablePaymentMethods();
    }
    
    /**
     * Seleccionar método de pago
     */
    selectPaymentMethod(methodElement) {
        // Remover selección anterior
        document.querySelectorAll('.payment-method').forEach(method => {
            method.classList.remove('active');
        });
        
        // Seleccionar nuevo método
        methodElement.classList.add('active');
        this.selectedPaymentMethod = methodElement.dataset.method;
        
        // Actualizar opciones de cuotas
        this.updateInstallmentOptions();
        
        // Actualizar pricing si es necesario
        this.calculatePricing();
        
        this.showToast(`Método de pago seleccionado: ${this.getPaymentMethodName()}`, 'info');
    }
    
    /**
     * Seleccionar cuotas
     */
    selectInstallments(installmentElement) {
        // Remover selección anterior
        document.querySelectorAll('.installment-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Seleccionar nueva opción
        installmentElement.classList.add('selected');
        this.selectedInstallments = parseInt(installmentElement.dataset.installments);
        
        // Actualizar pricing
        this.calculatePricing();
        
        const amount = installmentElement.dataset.amount;
        const isNoInterest = installmentElement.classList.contains('no-interest');
        
        this.showToast(
            `${this.selectedInstallments}x AR$ ${this.formatPrice(amount)} ${isNoInterest ? 'sin interés' : 'con interés'}`,
            'success'
        );
    }
    
    /**
     * Actualizar opciones de cuotas
     */
    updateInstallmentOptions() {
        if (this.selectedPaymentMethod !== 'credit_card') {
            // Ocultar sección de cuotas para otros métodos
            const installmentsSection = document.querySelector('.installments-section');
            if (installmentsSection) {
                installmentsSection.style.display = 'none';
            }
            return;
        }
        
        // Mostrar y actualizar cuotas para tarjeta de crédito
        const installmentsSection = document.querySelector('.installments-section');
        if (installmentsSection) {
            installmentsSection.style.display = 'block';
        }
        
        // Obtener cuotas disponibles de MercadoPago
        this.getInstallments().then(installments => {
            this.renderInstallmentOptions(installments);
        });
    }
    
    /**
     * Obtener cuotas disponibles
     */
    async getInstallments() {
        try {
            const amount = this.getCurrentAmount();
            
            // Simular respuesta de MercadoPago Installments API
            return [
                {
                    installments: 1,
                    installment_rate: 0,
                    installment_amount: amount,
                    total_amount: amount,
                    currency_id: 'ARS'
                },
                {
                    installments: 3,
                    installment_rate: 0,
                    installment_amount: amount / 3,
                    total_amount: amount,
                    currency_id: 'ARS'
                },
                {
                    installments: 6,
                    installment_rate: 0,
                    installment_amount: amount / 6,
                    total_amount: amount,
                    currency_id: 'ARS'
                },
                {
                    installments: 12,
                    installment_rate: 0,
                    installment_amount: amount / 12,
                    total_amount: amount,
                    currency_id: 'ARS'
                }
            ];
            
        } catch (error) {
            console.error('Error getting installments:', error);
            return [];
        }
    }
    
    /**
     * Validar documento argentino (DNI/CUIT)
     */
    validateArgentineDocument(input) {
        const value = input.value.replace(/\D/g, '');
        const isDni = value.length <= 8;
        const isCuit = value.length === 11;
        
        // Limpiar clases anteriores
        input.classList.remove('valid', 'invalid');
        
        if (value.length === 0) {
            input.setCustomValidity('');
            return;
        }
        
        if (isDni && this.config.validationRules.dni.test(value)) {
            input.classList.add('valid');
            input.setCustomValidity('');
            this.showValidationMessage(input, 'DNI válido', 'success');
        } else if (isCuit && this.validateCuit(value)) {
            input.classList.add('valid');
            input.setCustomValidity('');
            this.showValidationMessage(input, 'CUIT válido', 'success');
        } else {
            input.classList.add('invalid');
            input.setCustomValidity('Documento inválido');
            this.showValidationMessage(input, 'Formato de DNI/CUIT inválido', 'error');
        }
        
        // Formatear input
        if (isCuit) {
            input.value = this.formatCuit(value);
        }
    }
    
    /**
     * Validar CUIT argentino
     */
    validateCuit(cuit) {
        if (cuit.length !== 11) return false;
        
        const multiplicadores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
        let suma = 0;
        
        for (let i = 0; i < 10; i++) {
            suma += parseInt(cuit[i]) * multiplicadores[i];
        }
        
        const resto = suma % 11;
        const digitoVerificador = resto < 2 ? resto : 11 - resto;
        
        return parseInt(cuit[10]) === digitoVerificador;
    }
    
    /**
     * Formatear CUIT
     */
    formatCuit(cuit) {
        return cuit.replace(/(\d{2})(\d{8})(\d{1})/, '$1-$2-$3');
    }
    
    /**
     * Validar teléfono argentino
     */
    validateArgentinePhone(input) {
        const value = input.value;
        
        input.classList.remove('valid', 'invalid');
        
        if (value.length === 0) {
            input.setCustomValidity('');
            return;
        }
        
        if (this.config.validationRules.phone.test(value)) {
            input.classList.add('valid');
            input.setCustomValidity('');
            this.showValidationMessage(input, 'Teléfono válido', 'success');
        } else {
            input.classList.add('invalid');
            input.setCustomValidity('Formato de teléfono inválido');
            this.showValidationMessage(input, 'Usar formato: +54 11 1234-5678', 'error');
        }
    }
    
    /**
     * Configurar validación del formulario
     */
    setupFormValidation() {
        const form = document.getElementById('buyer-form');
        if (!form) return;
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.validateForm();
        });
        
        // Validación en tiempo real de campos requeridos
        const requiredFields = form.querySelectorAll('input[required]');
        requiredFields.forEach(field => {
            field.addEventListener('blur', () => {
                this.validateField(field);
            });
        });
    }
    
    /**
     * Validar campo individual
     */
    validateField(field) {
        const value = field.value.trim();
        const isValid = value.length > 0 && field.checkValidity();
        
        field.classList.remove('valid', 'invalid');
        field.classList.add(isValid ? 'valid' : 'invalid');
        
        if (!isValid && field.hasAttribute('required')) {
            this.showValidationMessage(field, 'Este campo es obligatorio', 'error');
        }
        
        return isValid;
    }
    
    /**
     * Mostrar mensaje de validación
     */
    showValidationMessage(input, message, type) {
        // Remover mensaje anterior
        const existingMessage = input.parentNode.querySelector('.validation-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Crear nuevo mensaje
        const messageEl = document.createElement('div');
        messageEl.className = `validation-message validation-${type}`;
        messageEl.textContent = message;
        messageEl.style.cssText = `
            font-size: 0.75rem;
            margin-top: 0.25rem;
            color: ${type === 'success' ? '#28a745' : '#dc3545'};
            display: flex;
            align-items: center;
            gap: 0.25rem;
        `;
        
        const icon = document.createElement('i');
        icon.className = type === 'success' ? 'icon-check' : 'icon-x';
        messageEl.prepend(icon);
        
        input.parentNode.appendChild(messageEl);
        
        // Auto-remove después de 3 segundos para mensajes de éxito
        if (type === 'success') {
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.remove();
                }
            }, 3000);
        }
    }
    
    /**
     * Actualizar tipo de facturación
     */
    updateBillingType(billingType) {
        console.log('Tipo de facturación actualizado:', billingType);
        
        // Actualizar cálculo de impuestos según el tipo
        this.calculatePricing();
        
        const descriptions = {
            'consumidor_final': 'Se emitirá Factura B sin discriminar IVA',
            'responsable_inscripto': 'Se emitirá Factura A con IVA discriminado',
            'monotributista': 'Se emitirá Factura C según corresponda'
        };
        
        this.showToast(descriptions[billingType] || 'Tipo de facturación actualizado', 'info');
    }
    
    /**
     * Calcular pricing en tiempo real
     */
    calculatePricing() {
        const baseAmount = parseFloat(this.checkoutData.pricing.base_price);
        const extras = this.getSelectedExtras();
        const extrasAmount = extras.reduce((sum, extra) => sum + parseFloat(extra.price), 0);
        
        const subtotal = baseAmount + extrasAmount;
        const platformFee = subtotal * 0.05; // 5% comisión LaburAR
        const iva = platformFee * this.config.taxRates.iva;
        const iibb = subtotal * this.config.taxRates.iibb;
        
        // Comisión MercadoPago según método de pago
        let mpFee = 0;
        if (this.selectedPaymentMethod === 'credit_card') {
            mpFee = (subtotal + platformFee) * 0.0499; // 4.99% + IVA
        } else if (this.selectedPaymentMethod === 'debit_card') {
            mpFee = (subtotal + platformFee) * 0.0289; // 2.89% + IVA
        }
        
        const mpIva = mpFee * this.config.taxRates.iva;
        const total = subtotal + platformFee + iva + iibb + mpFee + mpIva;
        
        // Actualizar UI
        this.updatePricingDisplay({
            base_price: baseAmount,
            extras_amount: extrasAmount,
            platform_fee: platformFee,
            iva: iva,
            iibb: iibb,
            mp_fee: mpFee,
            mp_iva: mpIva,
            total: total
        });
        
        // Actualizar botón de compra
        this.updatePurchaseButton(total);
        
        return total;
    }
    
    /**
     * Obtener extras seleccionados
     */
    getSelectedExtras() {
        const checkboxes = document.querySelectorAll('input[name="extras[]"]:checked');
        return Array.from(checkboxes).map(checkbox => ({
            value: checkbox.value,
            price: parseFloat(checkbox.dataset.price)
        }));
    }
    
    /**
     * Actualizar display de precios
     */
    updatePricingDisplay(pricing) {
        const elements = {
            'base_price': pricing.base_price,
            'platform_fee': pricing.platform_fee,
            'iva': pricing.iva,
            'iibb': pricing.iibb,
            'total': pricing.total
        };
        
        Object.entries(elements).forEach(([key, value]) => {
            const element = document.querySelector(`[data-price="${key}"]`);
            if (element) {
                element.textContent = `AR$ ${this.formatPrice(value)}`;
            }
        });
        
        // Actualizar elementos específicos
        const totalElements = document.querySelectorAll('.item-value');
        if (totalElements.length > 0) {
            totalElements[totalElements.length - 1].textContent = `AR$ ${this.formatPrice(pricing.total)}`;
        }
    }
    
    /**
     * Actualizar botón de compra
     */
    updatePurchaseButton(total) {
        const button = document.getElementById('complete-purchase-btn');
        if (!button) return;
        
        const amountSpan = button.querySelector('.btn-amount');
        if (amountSpan) {
            amountSpan.textContent = `AR$ ${this.formatPrice(total)}`;
        }
        
        // Habilitar/deshabilitar botón basado en validación
        const isValid = this.validateForm(true);
        button.disabled = !isValid;
    }
    
    /**
     * Validar términos aceptados
     */
    validateTermsAcceptance() {
        const termsAccepted = document.querySelector('input[name="accept_terms"]').checked;
        const protectionAccepted = document.querySelector('input[name="accept_protection"]').checked;
        
        const button = document.getElementById('complete-purchase-btn');
        if (button) {
            button.disabled = !(termsAccepted && protectionAccepted);
        }
        
        return termsAccepted && protectionAccepted;
    }
    
    /**
     * Validar formulario completo
     */
    validateForm(silent = false) {
        const form = document.getElementById('buyer-form');
        if (!form) return false;
        
        const requiredFields = form.querySelectorAll('input[required]');
        let allValid = true;
        
        requiredFields.forEach(field => {
            const isValid = this.validateField(field);
            if (!isValid) allValid = false;
        });
        
        // Validar términos
        const termsValid = this.validateTermsAcceptance();
        if (!termsValid) allValid = false;
        
        if (!silent && !allValid) {
            this.showToast('Por favor completa todos los campos obligatorios', 'error');
        }
        
        return allValid;
    }
    
    /**
     * Completar compra
     */
    async completePurchase() {
        if (this.isLoading) return;
        
        // Validar formulario
        if (!this.validateForm()) {
            return;
        }
        
        this.setLoading(true);
        
        try {
            // Crear preferencia de pago
            const preference = await this.createPaymentPreference();
            
            // Inicializar checkout de MercadoPago
            await this.initializeMercadoPagoCheckout(preference);
            
        } catch (error) {
            console.error('Error en checkout:', error);
            this.showToast('Error al procesar el pago. Intenta nuevamente.', 'error');
        } finally {
            this.setLoading(false);
        }
    }
    
    /**
     * Crear preferencia de pago
     */
    async createPaymentPreference() {
        const formData = this.getFormData();
        const pricing = this.calculatePricing();
        
        const preferenceData = {
            items: [{
                id: this.checkoutData.package_id,
                title: `${this.checkoutData.service_title} - ${this.checkoutData.package_name}`,
                quantity: 1,
                currency_id: 'ARS',
                unit_price: pricing
            }],
            payer: {
                name: formData.buyer_name,
                email: formData.buyer_email,
                phone: {
                    area_code: '11',
                    number: formData.buyer_phone.replace(/\D/g, '')
                },
                identification: {
                    type: formData.buyer_document.length <= 8 ? 'DNI' : 'CUIT',
                    number: formData.buyer_document.replace(/\D/g, '')
                },
                address: {
                    zip_code: '1000',
                    street_name: 'Argentina'
                }
            },
            payment_methods: {
                excluded_payment_types: [],
                excluded_payment_methods: [],
                installments: this.selectedInstallments
            },
            back_urls: {
                success: `${window.location.origin}/checkout-success`,
                failure: `${window.location.origin}/checkout-failure`,
                pending: `${window.location.origin}/checkout-pending`
            },
            auto_return: 'approved',
            external_reference: `laburar_${this.checkoutData.service_id}_${Date.now()}`,
            notification_url: `${window.location.origin}/api/PaymentController.php?action=webhook`,
            metadata: {
                service_id: this.checkoutData.service_id,
                package_id: this.checkoutData.package_id,
                freelancer_id: this.checkoutData.freelancer_id,
                billing_type: formData.billing_type
            }
        };
        
        const response = await fetch('/api/PaymentController.php?action=create-preference', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': this.getCSRFToken()
            },
            body: JSON.stringify(preferenceData)
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Error creating payment preference');
        }
        
        return data.data;
    }
    
    /**
     * Inicializar checkout de MercadoPago
     */
    async initializeMercadoPagoCheckout(preference) {
        const checkout = this.mp.checkout({
            preference: {
                id: preference.id
            },
            render: {
                container: '#mp-checkout-container',
                label: 'Pagar con MercadoPago'
            },
            theme: {
                elementsColor: '#009ee3',
                headerColor: '#009ee3'
            }
        });
        
        this.currentPreference = preference;
    }
    
    /**
     * Obtener datos del formulario
     */
    getFormData() {
        const form = document.getElementById('buyer-form');
        const formData = new FormData(form);
        
        return {
            buyer_name: formData.get('buyer_name'),
            buyer_email: formData.get('buyer_email'),
            buyer_document: formData.get('buyer_document'),
            buyer_phone: formData.get('buyer_phone'),
            billing_type: formData.get('billing_type'),
            accept_terms: formData.get('accept_terms'),
            accept_protection: formData.get('accept_protection')
        };
    }
    
    /**
     * Estado de carga
     */
    setLoading(loading) {
        this.isLoading = loading;
        
        const container = document.querySelector('.mercadopago-checkout-container');
        const button = document.getElementById('complete-purchase-btn');
        
        if (loading) {
            container.classList.add('checkout-loading');
            button.innerHTML = '<i class="icon-loader"></i> Procesando...';
            button.disabled = true;
        } else {
            container.classList.remove('checkout-loading');
            button.innerHTML = `
                <i class="icon-lock"></i>
                <span class="btn-text">Completar compra segura</span>
                <span class="btn-amount">AR$ ${this.formatPrice(this.calculatePricing())}</span>
            `;
            button.disabled = false;
        }
    }
    
    /**
     * Configurar calculadora de cuotas
     */
    setupInstallmentCalculator() {
        // Calculadora automática basada en el monto
        setInterval(() => {
            const currentAmount = this.getCurrentAmount();
            this.updateInstallmentAvailability(currentAmount);
        }, 1000);
    }
    
    /**
     * Actualizar disponibilidad de cuotas
     */
    updateInstallmentAvailability(amount) {
        const installmentOptions = document.querySelectorAll('.installment-option');
        
        installmentOptions.forEach(option => {
            const installments = parseInt(option.dataset.installments);
            const isAvailable = amount >= this.config.minAmountForInstallments || installments === 1;
            
            option.style.opacity = isAvailable ? '1' : '0.5';
            option.style.pointerEvents = isAvailable ? 'auto' : 'none';
            
            if (!isAvailable) {
                option.title = `Monto mínimo para cuotas: AR$ ${this.formatPrice(this.config.minAmountForInstallments)}`;
            }
        });
    }
    
    /**
     * Integrar con filtros manager
     */
    integrateFiltrosManager() {
        // Sincronizar con filtros de métodos de pago
        window.filtrosManager.onFilterChange('mercadopago_cuotas', (enabled) => {
            if (enabled) {
                this.selectPaymentMethod(document.querySelector('.payment-method.credit-card'));
            }
        });
    }
    
    // Métodos de utilidad
    
    getCurrentAmount() {
        return this.calculatePricing();
    }
    
    getPaymentMethodName() {
        const names = {
            'credit_card': 'Tarjeta de crédito',
            'debit_card': 'Tarjeta de débito',
            'cash': 'Efectivo',
            'bank_transfer': 'Transferencia bancaria'
        };
        return names[this.selectedPaymentMethod] || 'Método de pago';
    }
    
    formatPrice(amount) {
        return new Intl.NumberFormat('es-AR').format(Math.round(amount));
    }
    
    getCSRFToken() {
        const metaTag = document.querySelector('meta[name="csrf-token"]');
        return metaTag ? metaTag.content : '';
    }
    
    /**
     * Mostrar toast notification
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `mp-toast mp-toast-${type} show`;
        toast.innerHTML = `
            <i class="toast-icon icon-${type === 'success' ? 'check' : type === 'error' ? 'x' : 'info'}"></i>
            <span class="toast-message">${message}</span>
        `;
        
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#009ee3'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: 500;
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);
        
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
     * Limpiar recursos
     */
    destroy() {
        // Limpiar event listeners y recursos
        if (this.currentPreference) {
            this.currentPreference = null;
        }
    }
}

// Managers adicionales

/**
 * Filtros Manager Integration
 */
class FiltrosManager {
    constructor() {
        this.filters = {};
        this.callbacks = {};
    }
    
    updateFilter(element) {
        const name = element.name;
        const value = element.type === 'checkbox' ? element.checked : element.value;
        
        this.filters[name] = value;
        
        if (this.callbacks[name]) {
            this.callbacks[name](value);
        }
        
        this.applyFilters();
    }
    
    onFilterChange(filterName, callback) {
        this.callbacks[filterName] = callback;
    }
    
    applyFilters() {
        console.log('Aplicando filtros:', this.filters);
        // Lógica de aplicación de filtros
    }
    
    resetFilters() {
        this.filters = {};
        document.querySelectorAll('.filter-select, .filter-checkbox').forEach(el => {
            if (el.type === 'checkbox') {
                el.checked = false;
            } else {
                el.value = '';
            }
        });
        this.applyFilters();
    }
    
    toggleAdvanced() {
        const section = document.querySelector('.advanced-filters-section');
        if (section) {
            section.classList.toggle('expanded');
        }
    }
    
    setPrice(min, max) {
        const minInput = document.querySelector('input[name="precio_min"]');
        const maxInput = document.querySelector('input[name="precio_max"]');
        
        if (minInput) minInput.value = min || '';
        if (maxInput) maxInput.value = max || '';
        
        this.updateFilter(minInput);
        this.updateFilter(maxInput);
    }
    
    removeFilter(filterName) {
        delete this.filters[filterName];
        
        const element = document.querySelector(`[name="${filterName}"]`);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = false;
            } else {
                element.value = '';
            }
        }
        
        this.applyFilters();
    }
}

// Auto-inicialización
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar filtros manager globalmente
    if (document.querySelector('.filtros-argentinos-container')) {
        window.filtrosManager = new FiltrosManager();
    }
    
    // MercadoPago se inicializa desde el PHP component
    console.log('MercadoPago Argentino frontend ready');
});

// Exportar para uso global
window.MercadoPagoArgentino = MercadoPagoArgentino;
window.FiltrosManager = FiltrosManager;