/**
 * Authentication JavaScript
 * LaburAR Complete Platform
 * 
 * Modern authentication flows with real-time validation,
 * 2FA support, and enhanced UX
 */

class AuthManager {
    constructor() {
        this.apiBase = '/Laburar/api';
        this.currentStep = 1;
        this.maxSteps = 3;
        this.userType = null;
        this.formData = {};
        this.csrfToken = null;
        
        this.init();
    }
    
    init() {
        this.getCSRFToken();
        this.initEventListeners();
        this.initFormValidation();
        this.initPasswordStrength();
        this.initUserTypeSelection();
    }
    
    // ===== CSRF Token Management =====
    async getCSRFToken() {
        try {
            const response = await fetch(`${this.apiBase}/csrf-token.php`);
            const data = await response.json();
            this.csrfToken = data.token;
        } catch (error) {
            console.error('Failed to get CSRF token:', error);
        }
    }
    
    // ===== Event Listeners =====
    initEventListeners() {
        // Form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.classList.contains('auth-form')) {
                e.preventDefault();
                this.handleFormSubmit(e.target);
            }
        });
        
        // Real-time validation
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('form-input')) {
                this.validateField(e.target);
            }
        });
        
        // Password visibility toggle
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('password-toggle')) {
                this.togglePasswordVisibility(e.target);
            }
        });
        
        // User type selection
        document.addEventListener('change', (e) => {
            if (e.target.name === 'user_type') {
                this.selectUserType(e.target.value);
            }
        });
        
        // Navigation buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-next')) {
                this.nextStep();
            } else if (e.target.classList.contains('btn-prev')) {
                this.prevStep();
            }
        });
    }
    
    // ===== Form Validation =====
    initFormValidation() {
        this.validators = {
            email: {
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Ingresá una dirección de email válida'
            },
            password: {
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                message: 'La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y símbolos'
            },
            phone: {
                pattern: /^(\+54|54)?[0-9]{8,10}$/,
                message: 'Ingresá un número de teléfono argentino válido'
            },
            name: {
                pattern: /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s\-\'\.]{2,50}$/,
                message: 'El nombre debe tener entre 2 y 50 caracteres'
            }
        };
    }
    
    validateField(field) {
        const fieldType = field.dataset.validate;
        const value = field.value.trim();
        
        if (!fieldType || !this.validators[fieldType]) {
            return true;
        }
        
        const validator = this.validators[fieldType];
        const isValid = validator.pattern.test(value);
        
        this.updateFieldStatus(field, isValid, validator.message);
        
        // Special validation for password confirmation
        if (field.name === 'password_confirmation') {
            this.validatePasswordConfirmation(field);
        }
        
        return isValid;
    }
    
    validatePasswordConfirmation(field) {
        const passwordField = document.querySelector('input[name="password"]');
        const isMatch = passwordField && field.value === passwordField.value;
        
        this.updateFieldStatus(
            field, 
            isMatch, 
            'Las contraseñas no coinciden'
        );
        
        return isMatch;
    }
    
    updateFieldStatus(field, isValid, errorMessage) {
        const formGroup = field.closest('.form-group');
        const errorElement = formGroup.querySelector('.form-error');
        const successElement = formGroup.querySelector('.form-success');
        
        // Remove existing status classes
        field.classList.remove('error', 'success');
        
        // Remove existing status messages
        if (errorElement) errorElement.remove();
        if (successElement) successElement.remove();
        
        if (!field.value.trim()) {
            // Empty field - no validation
            return;
        }
        
        if (isValid) {
            field.classList.add('success');
            this.showFieldMessage(formGroup, 'success', '✓ Válido');
        } else {
            field.classList.add('error');
            this.showFieldMessage(formGroup, 'error', errorMessage);
        }
    }
    
    showFieldMessage(formGroup, type, message) {
        const messageElement = document.createElement('div');
        messageElement.className = `form-${type}`;
        messageElement.innerHTML = `<span class="icon">${type === 'error' ? '⚠' : '✓'}</span> ${message}`;
        formGroup.appendChild(messageElement);
    }
    
    // ===== Password Strength =====
    initPasswordStrength() {
        const passwordInputs = document.querySelectorAll('input[name="password"]');
        
        passwordInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                this.updatePasswordStrength(e.target);
            });
        });
    }
    
    updatePasswordStrength(passwordInput) {
        const password = passwordInput.value;
        const strengthContainer = document.querySelector('.password-strength');
        
        if (!strengthContainer) return;
        
        const score = this.calculatePasswordStrength(password);
        const strengthBar = strengthContainer.querySelector('.password-strength-fill');
        const requirements = strengthContainer.querySelectorAll('.password-requirement');
        
        // Update strength bar
        if (strengthBar) {
            strengthBar.className = 'password-strength-fill';
            
            if (score >= 80) {
                strengthBar.classList.add('strong');
            } else if (score >= 60) {
                strengthBar.classList.add('good');
            } else if (score >= 40) {
                strengthBar.classList.add('medium');
            } else {
                strengthBar.classList.add('weak');
            }
        }
        
        // Update requirements
        this.updatePasswordRequirements(password, requirements);
    }
    
    calculatePasswordStrength(password) {
        let score = 0;
        
        // Length
        if (password.length >= 8) score += 25;
        if (password.length >= 12) score += 10;
        
        // Character types
        if (/[a-z]/.test(password)) score += 15;
        if (/[A-Z]/.test(password)) score += 15;
        if (/[0-9]/.test(password)) score += 15;
        if (/[^a-zA-Z0-9]/.test(password)) score += 20;
        
        return Math.min(100, score);
    }
    
    updatePasswordRequirements(password, requirements) {
        const checks = [
            { test: password.length >= 8, index: 0 },
            { test: /[a-z]/.test(password), index: 1 },
            { test: /[A-Z]/.test(password), index: 2 },
            { test: /[0-9]/.test(password), index: 3 },
            { test: /[^a-zA-Z0-9]/.test(password), index: 4 }
        ];
        
        checks.forEach(check => {
            if (requirements[check.index]) {
                requirements[check.index].classList.toggle('met', check.test);
            }
        });
    }
    
    // ===== User Type Selection =====
    initUserTypeSelection() {
        const userTypeOptions = document.querySelectorAll('.user-type-option');
        
        userTypeOptions.forEach(option => {
            option.addEventListener('click', () => {
                const radio = option.querySelector('input[type="radio"]');
                if (radio) {
                    radio.checked = true;
                    this.selectUserType(radio.value);
                }
            });
        });
    }
    
    selectUserType(type) {
        this.userType = type;
        
        // Update visual selection
        document.querySelectorAll('.user-type-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        const selectedOption = document.querySelector(`input[value="${type}"]`)?.closest('.user-type-option');
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }
        
        // Update form fields based on user type
        this.updateFormFields(type);
    }
    
    updateFormFields(userType) {
        const freelancerFields = document.querySelectorAll('.freelancer-only');
        const clientFields = document.querySelectorAll('.client-only');
        
        if (userType === 'freelancer') {
            this.showFields(freelancerFields);
            this.hideFields(clientFields);
        } else if (userType === 'client') {
            this.showFields(clientFields);
            this.hideFields(freelancerFields);
        }
    }
    
    showFields(fields) {
        fields.forEach(field => {
            field.style.display = 'block';
            const inputs = field.querySelectorAll('input, select, textarea');
            inputs.forEach(input => input.required = true);
        });
    }
    
    hideFields(fields) {
        fields.forEach(field => {
            field.style.display = 'none';
            const inputs = field.querySelectorAll('input, select, textarea');
            inputs.forEach(input => input.required = false);
        });
    }
    
    // ===== Form Submission =====
    async handleFormSubmit(form) {
        const formData = new FormData(form);
        const action = form.dataset.action;
        
        // Add CSRF token
        if (this.csrfToken) {
            formData.append('csrf_token', this.csrfToken);
        }
        
        // Validate form before submission
        if (!this.validateForm(form)) {
            return;
        }
        
        // Show loading state
        this.setFormLoading(form, true);
        
        try {
            const response = await this.submitForm(action, formData);
            
            if (response.success) {
                this.handleFormSuccess(form, response.data, action);
            } else {
                this.handleFormError(form, response.error);
            }
        } catch (error) {
            this.handleFormError(form, 'Error de conexión. Intentá de nuevo.');
            console.error('Form submission error:', error);
        } finally {
            this.setFormLoading(form, false);
        }
    }
    
    async submitForm(action, formData) {
        const response = await fetch(`${this.apiBase}/AuthController.php?action=${action}`, {
            method: 'POST',
            body: formData
        });
        
        return await response.json();
    }
    
    validateForm(form) {
        const inputs = form.querySelectorAll('.form-input[required]');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    handleFormSuccess(form, data, action) {
        switch (action) {
            case 'register':
                this.handleRegistrationSuccess(data);
                break;
            case 'login':
                this.handleLoginSuccess(data);
                break;
            case 'verify-email':
                this.handleVerificationSuccess(data);
                break;
            case 'forgot-password':
                this.handlePasswordResetSuccess(data);
                break;
            default:
                this.showAlert('success', data.message || 'Operación exitosa');
        }
    }
    
    handleFormError(form, error) {
        this.showAlert('error', error);
    }
    
    handleRegistrationSuccess(data) {
        if (data.verification_required) {
            this.showRegistrationStep('email-verification');
            this.showAlert('info', 'Revisá tu email para verificar tu cuenta');
        } else {
            this.redirectToDashboard();
        }
    }
    
    handleLoginSuccess(data) {
        if (data.requires_2fa) {
            this.showLoginStep('two-factor');
        } else {
            // Store tokens
            this.storeTokens(data.tokens);
            this.redirectToDashboard();
        }
    }
    
    handleVerificationSuccess(data) {
        this.showAlert('success', 'Email verificado correctamente');
        setTimeout(() => {
            this.redirectToLogin();
        }, 2000);
    }
    
    handlePasswordResetSuccess(data) {
        this.showAlert('success', 'Si el email existe, recibirás un enlace de recuperación');
    }
    
    // ===== Multi-step Forms =====
    nextStep() {
        if (this.currentStep < this.maxSteps) {
            this.currentStep++;
            this.updateStepDisplay();
        }
    }
    
    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStepDisplay();
        }
    }
    
    updateStepDisplay() {
        // Hide all steps
        document.querySelectorAll('.form-step').forEach(step => {
            step.style.display = 'none';
        });
        
        // Show current step
        const currentStepElement = document.querySelector(`[data-step="${this.currentStep}"]`);
        if (currentStepElement) {
            currentStepElement.style.display = 'block';
        }
        
        // Update progress indicators
        this.updateProgressIndicators();
    }
    
    updateProgressIndicators() {
        document.querySelectorAll('.progress-step').forEach((step, index) => {
            const stepNumber = index + 1;
            
            step.classList.remove('active', 'completed');
            
            if (stepNumber < this.currentStep) {
                step.classList.add('completed');
            } else if (stepNumber === this.currentStep) {
                step.classList.add('active');
            }
        });
    }
    
    // ===== UI Helpers =====
    setFormLoading(form, isLoading) {
        const submitButton = form.querySelector('button[type="submit"]');
        
        if (isLoading) {
            submitButton.classList.add('btn-loading');
            submitButton.disabled = true;
        } else {
            submitButton.classList.remove('btn-loading');
            submitButton.disabled = false;
        }
    }
    
    showAlert(type, message) {
        // Remove existing alerts
        document.querySelectorAll('.alert').forEach(alert => alert.remove());
        
        const alertElement = document.createElement('div');
        alertElement.className = `alert alert-${type}`;
        alertElement.innerHTML = `
            <span class="alert-icon">${this.getAlertIcon(type)}</span>
            <span class="alert-message">${message}</span>
        `;
        
        const container = document.querySelector('.auth-body');
        if (container) {
            container.insertBefore(alertElement, container.firstChild);
        }
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            alertElement.remove();
        }, 5000);
    }
    
    getAlertIcon(type) {
        const icons = {
            success: '✓',
            error: '⚠',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || 'ℹ';
    }
    
    togglePasswordVisibility(toggleButton) {
        const passwordInput = toggleButton.parentElement.querySelector('input');
        const isVisible = passwordInput.type === 'text';
        
        passwordInput.type = isVisible ? 'password' : 'text';
        toggleButton.textContent = isVisible ? '👁' : '🙈';
    }
    
    // ===== Navigation =====
    redirectToDashboard() {
        window.location.href = '/Laburar/dashboard';
    }
    
    redirectToLogin() {
        window.location.href = '/Laburar/login';
    }
    
    // ===== Token Management =====
    storeTokens(tokens) {
        localStorage.setItem('access_token', tokens.access_token);
        localStorage.setItem('refresh_token', tokens.refresh_token);
    }
    
    getStoredToken() {
        return localStorage.getItem('access_token');
    }
    
    clearTokens() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    }
    
    // ===== Step Display Helpers =====
    showRegistrationStep(step) {
        document.querySelectorAll('.registration-step').forEach(stepElement => {
            stepElement.style.display = 'none';
        });
        
        const targetStep = document.querySelector(`[data-registration-step="${step}"]`);
        if (targetStep) {
            targetStep.style.display = 'block';
        }
    }
    
    showLoginStep(step) {
        document.querySelectorAll('.login-step').forEach(stepElement => {
            stepElement.style.display = 'none';
        });
        
        const targetStep = document.querySelector(`[data-login-step="${step}"]`);
        if (targetStep) {
            targetStep.style.display = 'block';
        }
    }
}

// ===== Real-time Features =====
class RealTimeValidator {
    constructor() {
        this.debounceDelay = 300;
        this.debounceTimers = new Map();
    }
    
    debounce(key, func, delay = this.debounceDelay) {
        clearTimeout(this.debounceTimers.get(key));
        this.debounceTimers.set(key, setTimeout(func, delay));
    }
    
    async checkEmailAvailability(email) {
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return { available: false, message: 'Email inválido' };
        }
        
        try {
            const response = await fetch('/Laburar/api/check-email.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            
            return await response.json();
        } catch (error) {
            return { available: true, message: 'No se pudo verificar' };
        }
    }
}

// ===== Initialize on DOM Load =====
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
    window.realTimeValidator = new RealTimeValidator();
    
    // Add email availability checking
    const emailInputs = document.querySelectorAll('input[name="email"]');
    emailInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            window.realTimeValidator.debounce('email-check', async () => {
                const result = await window.realTimeValidator.checkEmailAvailability(e.target.value);
                
                if (!result.available && e.target.value) {
                    window.authManager.updateFieldStatus(e.target, false, result.message);
                }
            });
        });
    });
});

// ===== Export for use in other scripts =====
window.AuthManager = AuthManager;