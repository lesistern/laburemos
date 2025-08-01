/**
 * Payments JavaScript Manager
 * LaburAR Complete Platform
 * 
 * Handles payment processing, MercadoPago integration,
 * escrow management, and financial operations
 */

class PaymentManager {
    constructor() {
        this.mercadopago = null;
        this.currentTransaction = null;
        this.paymentMethods = [];
        this.balance = null;
        this.transactions = [];
        this.escrowAccounts = [];
        this.config = null;
        
        this.init();
    }
    
    // ===== Initialization =====
    
    async init() {
        await this.loadPaymentConfig();
        this.initializeMercadoPago();
        this.setupEventListeners();
        await this.loadInitialData();
    }
    
    async loadPaymentConfig() {
        try {
            const response = await fetch('/api/PaymentController.php?action=payment-config', {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.config = data.data.config;
            } else {
                throw new Error(data.error || 'Failed to load payment config');
            }
            
        } catch (error) {
            console.error('Error loading payment config:', error);
            this.showError('Error al cargar la configuración de pagos');
        }
    }
    
    initializeMercadoPago() {
        if (!this.config || !this.config.mp_public_key) {
            console.error('MercadoPago public key not available');
            return;
        }
        
        // Load MercadoPago SDK
        const script = document.createElement('script');
        script.src = 'https://sdk.mercadopago.com/js/v2';
        script.onload = () => {
            this.mercadopago = new window.MercadoPago(this.config.mp_public_key, {
                locale: 'es-AR'
            });
            console.log('MercadoPago SDK loaded successfully');
        };
        document.head.appendChild(script);
    }
    
    setupEventListeners() {
        // Balance actions
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="withdraw"]')) {
                this.showWithdrawalModal();
            }
            
            if (e.target.matches('[data-action="add-payment-method"]')) {
                this.showAddPaymentMethodModal();
            }
        });
        
        // Transaction actions
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-transaction-id]')) {
                const transactionId = e.target.dataset.transactionId;
                this.showTransactionDetails(transactionId);
            }
        });
        
        // Payment method actions
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-method-action]')) {
                const action = e.target.dataset.methodAction;
                const methodId = e.target.dataset.methodId;
                this.handlePaymentMethodAction(action, methodId);
            }
        });
        
        // Filter chips
        document.addEventListener('click', (e) => {
            if (e.target.matches('.filter-chip')) {
                this.handleFilterClick(e.target);
            }
        });
        
        // Form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.matches('#withdrawalForm')) {
                e.preventDefault();
                this.processWithdrawal(new FormData(e.target));
            }
            
            if (e.target.matches('#paymentMethodForm')) {
                e.preventDefault();
                this.addPaymentMethod(new FormData(e.target));
            }
        });
        
        // Payment method selection
        document.addEventListener('click', (e) => {
            if (e.target.closest('.payment-method-option')) {
                this.selectPaymentMethod(e.target.closest('.payment-method-option'));
            }
        });
    }
    
    // ===== Data Loading =====
    
    async loadInitialData() {
        try {
            this.showLoading(true);
            
            await Promise.all([
                this.loadBalance(),
                this.loadPaymentMethods(),
                this.loadRecentTransactions(),
                this.loadEscrowAccounts()
            ]);
            
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showError('Error al cargar los datos de pagos');
        } finally {
            this.showLoading(false);
        }
    }
    
    async loadBalance() {
        try {
            const response = await fetch('/api/PaymentController.php?action=balance', {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.balance = data.data.balance;
                this.renderBalance();
            } else {
                throw new Error(data.error || 'Failed to load balance');
            }
            
        } catch (error) {
            console.error('Error loading balance:', error);
            this.showError('Error al cargar el balance');
        }
    }
    
    async loadPaymentMethods() {
        try {
            const response = await fetch('/api/PaymentController.php?action=payment-methods', {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.paymentMethods = data.data.payment_methods;
                this.renderPaymentMethods();
            } else {
                throw new Error(data.error || 'Failed to load payment methods');
            }
            
        } catch (error) {
            console.error('Error loading payment methods:', error);
            this.showError('Error al cargar los métodos de pago');
        }
    }
    
    async loadRecentTransactions() {
        try {
            const response = await fetch('/api/PaymentController.php?action=transactions&limit=10', {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.transactions = data.data.transactions;
                this.renderTransactions();
            } else {
                throw new Error(data.error || 'Failed to load transactions');
            }
            
        } catch (error) {
            console.error('Error loading transactions:', error);
            this.showError('Error al cargar las transacciones');
        }
    }
    
    async loadEscrowAccounts() {
        try {
            const response = await fetch('/api/PaymentController.php?action=escrow-accounts&status=active', {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.escrowAccounts = data.data.escrows;
                this.renderEscrowAccounts();
            } else {
                throw new Error(data.error || 'Failed to load escrow accounts');
            }
            
        } catch (error) {
            console.error('Error loading escrow accounts:', error);
            this.showError('Error al cargar las cuentas en escrow');
        }
    }
    
    // ===== Rendering Methods =====
    
    renderBalance() {
        if (!this.balance) return;
        
        const availableElement = document.getElementById('availableBalance');
        const pendingElement = document.getElementById('pendingBalance');
        const totalEarnedElement = document.getElementById('totalEarned');
        const totalSpentElement = document.getElementById('totalSpent');
        
        if (availableElement) {
            availableElement.textContent = this.formatCurrency(this.balance.available_balance);
        }
        
        if (pendingElement) {
            pendingElement.textContent = this.formatCurrency(this.balance.pending_balance);
        }
        
        if (totalEarnedElement) {
            totalEarnedElement.textContent = this.formatCurrency(this.balance.total_earned);
        }
        
        if (totalSpentElement) {
            totalSpentElement.textContent = this.formatCurrency(this.balance.total_spent);
        }
        
        // Update withdrawal limits if displayed
        this.updateWithdrawalLimits();
    }
    
    renderPaymentMethods() {
        const container = document.getElementById('paymentMethodsGrid');
        if (!container) return;
        
        if (this.paymentMethods.length === 0) {
            container.innerHTML = `
                <div class="payment-empty">
                    <div class="payment-empty-icon">💳</div>
                    <h3>No hay métodos de pago</h3>
                    <p>Agregá un método de pago para realizar transacciones</p>
                    <button class="btn-primary" data-action="add-payment-method">
                        Agregar Método de Pago
                    </button>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.paymentMethods
            .map(method => this.renderPaymentMethodCard(method))
            .join('');
    }
    
    renderPaymentMethodCard(method) {
        const isDefault = method.is_default;
        const isVerified = method.is_verified;
        
        return `
            <div class="payment-method-card ${isDefault ? 'default' : ''}" data-method-id="${method.id}">
                ${isDefault ? '<div class="payment-method-badge">Principal</div>' : ''}
                
                <div class="payment-method-icon">
                    ${this.getPaymentMethodIcon(method)}
                </div>
                
                <div class="payment-method-info">
                    <h4 class="payment-method-name">${escapeHtml(method.display_name)}</h4>
                    <p class="payment-method-details">
                        ${this.getPaymentMethodDetails(method)}
                        ${!isVerified ? '<span class="text-warning">• No verificado</span>' : ''}
                    </p>
                </div>
                
                <div class="payment-method-actions">
                    ${!isDefault ? `
                        <button class="btn-method btn-secondary" data-method-action="set-default" data-method-id="${method.id}">
                            Hacer principal
                        </button>
                    ` : ''}
                    <button class="btn-method btn-danger" data-method-action="remove" data-method-id="${method.id}">
                        Eliminar
                    </button>
                </div>
            </div>
        `;
    }
    
    renderTransactions() {
        const container = document.getElementById('transactionsList');
        if (!container) return;
        
        if (this.transactions.length === 0) {
            container.innerHTML = `
                <div class="payment-empty">
                    <div class="payment-empty-icon">📊</div>
                    <h3>No hay transacciones</h3>
                    <p>Aún no tenés transacciones registradas</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.transactions
            .map(transaction => this.renderTransactionItem(transaction))
            .join('');
    }
    
    renderTransactionItem(transaction) {
        const isIncoming = transaction.direction === 'incoming';
        const icon = this.getTransactionIcon(transaction);
        
        return `
            <div class="transaction-item" data-transaction-id="${transaction.id}">
                <div class="transaction-info">
                    <div class="transaction-icon ${transaction.direction}">
                        ${icon}
                    </div>
                    <div class="transaction-details">
                        <h4 class="transaction-title">${escapeHtml(transaction.type_label)}</h4>
                        <p class="transaction-description">
                            ${transaction.counterpart_name ? escapeHtml(transaction.counterpart_name) : 'LaburAR'}
                            ${transaction.project_title ? ` • ${escapeHtml(transaction.project_title)}` : ''}
                        </p>
                    </div>
                </div>
                
                <div class="transaction-meta">
                    <p class="transaction-amount ${transaction.direction}">
                        ${isIncoming ? '+' : '-'} ${transaction.formatted_amount}
                    </p>
                    <p class="transaction-date">${this.formatDate(transaction.created_at)}</p>
                </div>
            </div>
        `;
    }
    
    renderEscrowAccounts() {
        const container = document.getElementById('escrowList');
        if (!container) return;
        
        if (this.escrowAccounts.length === 0) {
            container.innerHTML = `
                <p class="text-muted">No hay fondos en escrow actualmente</p>
            `;
            return;
        }
        
        container.innerHTML = this.escrowAccounts
            .map(escrow => this.renderEscrowItem(escrow))
            .join('');
    }
    
    renderEscrowItem(escrow) {
        const daysUntilRelease = escrow.days_until_release || 0;
        const canRelease = escrow.can_release;
        
        return `
            <div class="escrow-item">
                <h4 class="escrow-project">${escapeHtml(escrow.project_title)}</h4>
                
                <div class="escrow-details">
                    <div class="escrow-info">
                        <span class="escrow-amount">${escrow.formatted_freelancer_amount}</span>
                        <span>${escapeHtml(escrow.freelancer_name)}</span>
                    </div>
                    
                    <div>
                        ${daysUntilRelease > 0 ? `
                            <span class="escrow-timer">
                                Liberación en ${daysUntilRelease} día${daysUntilRelease > 1 ? 's' : ''}
                            </span>
                        ` : `
                            <span class="escrow-timer">Listo para liberar</span>
                        `}
                        
                        ${canRelease ? `
                            <button class="btn-primary btn-mini" data-action="release-escrow" data-escrow-id="${escrow.id}">
                                Liberar Fondos
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }
    
    // ===== Payment Processing =====
    
    async createPayment(projectId, milestoneId = null) {
        try {
            this.showLoading(true);
            
            const paymentData = {
                action: 'create-payment',
                project_id: projectId,
                milestone_id: milestoneId,
                transaction_type: 'payment',
                create_escrow: true
            };
            
            const response = await fetch('/api/PaymentController.php', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(paymentData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.currentTransaction = data.data.payment;
                this.showPaymentModal();
            } else {
                throw new Error(data.error || 'Failed to create payment');
            }
            
        } catch (error) {
            console.error('Error creating payment:', error);
            this.showError('Error al crear el pago');
        } finally {
            this.showLoading(false);
        }
    }
    
    async processPaymentWithMercadoPago() {
        if (!this.currentTransaction) return;
        
        try {
            this.showLoading(true);
            
            // Create MercadoPago preference
            const response = await fetch('/api/PaymentController.php', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'create-preference',
                    transaction_id: this.currentTransaction.id
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                const preference = data.data.preference;
                
                if (this.config.mp_environment === 'sandbox') {
                    // Redirect to sandbox checkout
                    window.location.href = preference.sandbox_init_point;
                } else {
                    // Redirect to production checkout
                    window.location.href = preference.init_point;
                }
            } else {
                throw new Error(data.error || 'Failed to create payment preference');
            }
            
        } catch (error) {
            console.error('Error processing payment:', error);
            this.showError('Error al procesar el pago');
            this.showLoading(false);
        }
    }
    
    // ===== Withdrawal Management =====
    
    showWithdrawalModal() {
        if (!this.balance || this.balance.available_balance <= 0) {
            this.showError('No tenés fondos disponibles para retirar');
            return;
        }
        
        const modal = document.getElementById('withdrawalModal');
        if (!modal) return;
        
        // Update form with balance info
        document.getElementById('availableToWithdraw').textContent = this.formatCurrency(this.balance.available_balance);
        document.getElementById('withdrawAmount').max = this.balance.available_balance;
        
        // Load payment methods for withdrawal
        this.loadWithdrawalMethods();
        
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
    
    async processWithdrawal(formData) {
        try {
            this.showLoading(true);
            
            const amount = parseFloat(formData.get('amount'));
            
            // Validate amount
            if (amount > this.balance.available_balance) {
                throw new Error('El monto excede tu balance disponible');
            }
            
            if (amount < this.balance.withdrawal_limits.min_amount) {
                throw new Error(`El monto mínimo de retiro es ${this.formatCurrency(this.balance.withdrawal_limits.min_amount)}`);
            }
            
            if (amount > this.balance.withdrawal_limits.max_amount) {
                throw new Error(`El monto máximo de retiro es ${this.formatCurrency(this.balance.withdrawal_limits.max_amount)}`);
            }
            
            const withdrawalData = {
                action: 'create-withdrawal',
                amount: amount,
                withdrawal_method: formData.get('withdrawal_method'),
                payment_method_id: formData.get('payment_method_id')
            };
            
            const response = await fetch('/api/PaymentController.php', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(withdrawalData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showSuccess('Solicitud de retiro creada exitosamente');
                this.closeModal();
                await this.loadBalance();
                await this.loadRecentTransactions();
            } else {
                throw new Error(data.error || 'Failed to create withdrawal');
            }
            
        } catch (error) {
            console.error('Error processing withdrawal:', error);
            this.showError(error.message || 'Error al procesar el retiro');
        } finally {
            this.showLoading(false);
        }
    }
    
    // ===== Payment Methods Management =====
    
    showAddPaymentMethodModal() {
        const modal = document.getElementById('addPaymentMethodModal');
        if (!modal) return;
        
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
    
    async addPaymentMethod(formData) {
        try {
            this.showLoading(true);
            
            const methodData = {
                action: 'add-payment-method',
                method_type: formData.get('method_type'),
                is_default: formData.get('is_default') === '1'
            };
            
            // Add method-specific data
            if (methodData.method_type === 'bank_transfer') {
                methodData.bank_name = formData.get('bank_name');
                methodData.account_type = formData.get('account_type');
                methodData.account_holder_name = formData.get('account_holder_name');
                methodData.account_number = formData.get('account_number');
                methodData.cbu_alias = formData.get('cbu_alias');
            }
            
            const response = await fetch('/api/PaymentController.php', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(methodData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showSuccess('Método de pago agregado exitosamente');
                this.closeModal();
                await this.loadPaymentMethods();
            } else {
                throw new Error(data.error || 'Failed to add payment method');
            }
            
        } catch (error) {
            console.error('Error adding payment method:', error);
            this.showError('Error al agregar el método de pago');
        } finally {
            this.showLoading(false);
        }
    }
    
    async handlePaymentMethodAction(action, methodId) {
        switch (action) {
            case 'set-default':
                await this.setDefaultPaymentMethod(methodId);
                break;
            case 'remove':
                await this.removePaymentMethod(methodId);
                break;
            case 'verify':
                await this.verifyPaymentMethod(methodId);
                break;
        }
    }
    
    // ===== Escrow Management =====
    
    async releaseEscrow(escrowId) {
        if (!confirm('¿Estás seguro de que querés liberar estos fondos?')) {
            return;
        }
        
        try {
            this.showLoading(true);
            
            const response = await fetch('/api/PaymentController.php', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'release-escrow',
                    escrow_id: escrowId,
                    reason: 'Cliente aprobó el trabajo'
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showSuccess('Fondos liberados exitosamente');
                await this.loadEscrowAccounts();
                await this.loadRecentTransactions();
            } else {
                throw new Error(data.error || 'Failed to release escrow');
            }
            
        } catch (error) {
            console.error('Error releasing escrow:', error);
            this.showError('Error al liberar los fondos');
        } finally {
            this.showLoading(false);
        }
    }
    
    // ===== UI Helpers =====
    
    showPaymentModal() {
        const modal = document.getElementById('paymentModal');
        if (!modal || !this.currentTransaction) return;
        
        // Update modal content with transaction details
        document.getElementById('paymentProjectTitle').textContent = this.currentTransaction.project_title || 'Pago LaburAR';
        document.getElementById('paymentAmount').textContent = this.formatCurrency(this.currentTransaction.amount);
        document.getElementById('paymentFee').textContent = this.formatCurrency(this.currentTransaction.platform_fee_amount);
        document.getElementById('paymentTotal').textContent = this.formatCurrency(this.currentTransaction.amount);
        
        // Load payment methods for selection
        this.renderPaymentMethodOptions();
        
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
    
    renderPaymentMethodOptions() {
        const container = document.getElementById('paymentMethodSelector');
        if (!container) return;
        
        const mercadopagoOption = `
            <div class="payment-method-option selected" data-method="mercadopago">
                <div class="payment-method-radio"></div>
                <div class="payment-method-info">
                    <h4>MercadoPago</h4>
                    <p>Pagá con tarjeta de crédito, débito o dinero en cuenta</p>
                </div>
                <img src="/assets/img/mercadopago-logo.png" alt="MercadoPago" class="mercadopago-logo">
            </div>
        `;
        
        const userMethods = this.paymentMethods
            .filter(method => method.is_verified)
            .map(method => `
                <div class="payment-method-option" data-method="saved" data-method-id="${method.id}">
                    <div class="payment-method-radio"></div>
                    <div class="payment-method-info">
                        <h4>${escapeHtml(method.display_name)}</h4>
                        <p>${this.getPaymentMethodDetails(method)}</p>
                    </div>
                </div>
            `).join('');
        
        container.innerHTML = mercadopagoOption + userMethods;
    }
    
    selectPaymentMethod(element) {
        // Remove previous selection
        document.querySelectorAll('.payment-method-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Add selection to clicked element
        element.classList.add('selected');
    }
    
    handleFilterClick(filterElement) {
        const filterType = filterElement.dataset.filter;
        const filterValue = filterElement.dataset.value;
        
        // Toggle active state
        if (filterElement.classList.contains('active')) {
            filterElement.classList.remove('active');
            this.removeFilter(filterType);
        } else {
            // Remove active from siblings
            filterElement.parentElement.querySelectorAll('.filter-chip').forEach(chip => {
                if (chip.dataset.filter === filterType) {
                    chip.classList.remove('active');
                }
            });
            
            filterElement.classList.add('active');
            this.applyFilter(filterType, filterValue);
        }
        
        // Reload filtered data
        this.loadRecentTransactions();
    }
    
    // ===== Utility Methods =====
    
    getAuthToken() {
        return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    }
    
    getUserRole() {
        const payload = this.getTokenPayload();
        return payload ? payload.user_type : null;
    }
    
    getTokenPayload() {
        const token = this.getAuthToken();
        if (!token) return null;
        
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload;
        } catch (error) {
            return null;
        }
    }
    
    formatCurrency(amount, currency = 'ARS') {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2
        }).format(amount);
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return 'Hoy';
        } else if (diffDays === 1) {
            return 'Ayer';
        } else if (diffDays < 7) {
            return `Hace ${diffDays} días`;
        } else {
            return date.toLocaleDateString('es-AR', {
                day: 'numeric',
                month: 'short',
                year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
            });
        }
    }
    
    getPaymentMethodIcon(method) {
        const icons = {
            'mercadopago': '💳',
            'bank_transfer': '🏦',
            'cash': '💵',
            'crypto': '₿'
        };
        
        return icons[method.method_type] || '💳';
    }
    
    getPaymentMethodDetails(method) {
        switch (method.method_type) {
            case 'mercadopago':
                return 'Tarjetas y dinero en cuenta';
            case 'bank_transfer':
                return `${method.account_type === 'savings' ? 'Caja de ahorro' : 'Cuenta corriente'}`;
            default:
                return method.provider || method.method_type;
        }
    }
    
    getTransactionIcon(transaction) {
        const icons = {
            'payment': '💰',
            'refund': '↩️',
            'commission': '📊',
            'withdrawal': '🏦',
            'deposit': '📥',
            'fee': '💸',
            'bonus': '🎁'
        };
        
        return icons[transaction.transaction_type] || '💰';
    }
    
    updateWithdrawalLimits() {
        if (!this.balance || !this.balance.withdrawal_limits) return;
        
        const minElement = document.getElementById('minWithdrawal');
        const maxElement = document.getElementById('maxWithdrawal');
        const feeElement = document.getElementById('withdrawalFee');
        
        if (minElement) {
            minElement.textContent = this.balance.withdrawal_limits.formatted_min;
        }
        
        if (maxElement) {
            maxElement.textContent = this.balance.withdrawal_limits.formatted_max;
        }
        
        if (feeElement) {
            feeElement.textContent = this.balance.withdrawal_limits.formatted_fee;
        }
    }
    
    showLoading(show) {
        const loader = document.getElementById('paymentLoadingIndicator');
        if (loader) {
            loader.style.display = show ? 'flex' : 'none';
        }
    }
    
    showSuccess(message) {
        this.showNotification(message, 'success');
    }
    
    showError(message) {
        this.showNotification(message, 'error');
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    closeModal() {
        const modals = document.querySelectorAll('.payment-modal.show, .modal.show');
        modals.forEach(modal => {
            modal.classList.remove('show');
        });
        document.body.style.overflow = '';
    }
}

// ===== Utility Functions =====

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// ===== Auto-initialization =====

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('paymentsContainer')) {
        window.paymentManager = new PaymentManager();
    }
});