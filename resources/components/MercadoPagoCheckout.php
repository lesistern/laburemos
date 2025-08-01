<?php
/**
 * MercadoPagoCheckout - Integración completa con MercadoPago para Argentina
 * 
 * Funcionalidades:
 * - Checkout con cuotas sin interés
 * - Cálculo automático de impuestos argentinos
 * - Métodos de pago locales (Rapipago, Pago Fácil)
 * - Integración con facturación AFIP
 * - UX optimizado para Argentina
 * 
 * @author LaburAR Team
 * @version 1.0
 * @since 2025-07-20
 */

require_once __DIR__ . '/../../app/Services/Database.php';
require_once __DIR__ . '/../../app/Models/Payment.php';

class MercadoPagoCheckout {
    
    private $package;
    private $service;
    private $freelancer;
    private $mpAccessToken;
    
    // Configuración MercadoPago Argentina
    private const MP_PUBLIC_KEY = 'TEST-your-mp-public-key';
    private const MP_ACCESS_TOKEN = 'TEST-your-mp-access-token';
    
    // Impuestos argentinos
    private const IVA_RATE = 0.21;           // 21% IVA
    private const IIBB_RATE = 0.02;          // 2% Ingresos Brutos (promedio)
    private const MP_FEE_RATE = 0.0499;      // 4.99% + IVA comisión MP
    
    // Métodos de pago argentinos
    private const PAYMENT_METHODS = [
        'credit_card' => 'Tarjeta de crédito',
        'debit_card' => 'Tarjeta de débito',
        'account_money' => 'Dinero en cuenta',
        'rapipago' => 'Rapipago',
        'pagofacil' => 'Pago Fácil',
        'bank_transfer' => 'Transferencia bancaria'
    ];
    
    public function __construct($packageData, $serviceData, $freelancerData) {
        $this->package = $packageData;
        $this->service = $serviceData;
        $this->freelancer = $freelancerData;
        $this->mpAccessToken = self::MP_ACCESS_TOKEN;
    }
    
    /**
     * Renderizar checkout completo
     */
    public function render() {
        $pricing = $this->calculatePricing();
        $installments = $this->getInstallmentOptions();
        
        return "
        <div class='mercadopago-checkout-container'>
            <div class='checkout-header'>
                {$this->renderHeader()}
            </div>
            
            <div class='checkout-content'>
                <div class='checkout-main'>
                    {$this->renderOrderSummary($pricing)}
                    {$this->renderPaymentMethods($installments)}
                    {$this->renderBuyerForm()}
                </div>
                
                <div class='checkout-sidebar'>
                    {$this->renderServiceSummary()}
                    {$this->renderPricingBreakdown($pricing)}
                    {$this->renderSecurityInfo()}
                </div>
            </div>
            
            <div class='checkout-footer'>
                {$this->renderFooter()}
            </div>
            
            {$this->renderMercadoPagoSDK()}
        </div>";
    }
    
    /**
     * Header del checkout
     */
    private function renderHeader() {
        return "
        <div class='checkout-header-content'>
            <div class='checkout-logo'>
                <img src='/assets/img/laburar-logo.png' alt='LaburAR' class='logo'>
                <span class='checkout-title'>Checkout Seguro</span>
            </div>
            
            <div class='checkout-steps'>
                <div class='step active'>
                    <span class='step-number'>1</span>
                    <span class='step-label'>Pago</span>
                </div>
                <div class='step'>
                    <span class='step-number'>2</span>
                    <span class='step-label'>Confirmación</span>
                </div>
                <div class='step'>
                    <span class='step-number'>3</span>
                    <span class='step-label'>Proyecto</span>
                </div>
            </div>
            
            <div class='security-badges'>
                <img src='/assets/img/ssl-secure.png' alt='SSL Seguro' class='security-badge'>
                <img src='/assets/img/mercadopago-logo.png' alt='MercadoPago' class='security-badge'>
            </div>
        </div>";
    }
    
    /**
     * Resumen del pedido
     */
    private function renderOrderSummary($pricing) {
        return "
        <div class='order-summary-section'>
            <h3 class='section-title'>
                <i class='icon-shopping-cart'></i>
                Resumen del pedido
            </h3>
            
            <div class='order-item'>
                <div class='item-info'>
                    <h4 class='item-title'>{$this->package['name']}</h4>
                    <p class='item-description'>{$this->service['title']}</p>
                    <div class='item-details'>
                        <span class='detail'>
                            <i class='icon-clock'></i>
                            {$this->package['delivery_days']} días de entrega
                        </span>
                        <span class='detail'>
                            <i class='icon-refresh'></i>
                            {$this->package['revisions_included']} revisiones
                        </span>
                        " . ($this->package['videollamadas_included'] > 0 ? "
                        <span class='detail'>
                            <i class='icon-video'></i>
                            {$this->package['videollamadas_included']} videollamadas
                        </span>" : '') . "
                    </div>
                </div>
                
                <div class='item-price'>
                    <span class='price-amount'>AR$ {$this->formatPrice($this->package['price'])}</span>
                </div>
            </div>
            
            <div class='order-extras'>
                {$this->renderExtrasOptions()}
            </div>
        </div>";
    }
    
    /**
     * Métodos de pago con cuotas
     */
    private function renderPaymentMethods($installments) {
        return "
        <div class='payment-methods-section'>
            <h3 class='section-title'>
                <i class='icon-credit-card'></i>
                Método de pago
            </h3>
            
            <div class='payment-methods-grid'>
                {$this->renderCreditCardOption($installments)}
                {$this->renderDebitCardOption()}
                {$this->renderCashOptions()}
                {$this->renderBankTransferOption()}
            </div>
            
            <div id='mp-checkout-container'>
                <!-- MercadoPago Checkout será inyectado aquí -->
            </div>
        </div>";
    }
    
    /**
     * Opción tarjeta de crédito con cuotas
     */
    private function renderCreditCardOption($installments) {
        return "
        <div class='payment-method credit-card active' data-method='credit_card'>
            <div class='method-header'>
                <div class='method-icon'>
                    <i class='icon-credit-card'></i>
                </div>
                <div class='method-info'>
                    <h4 class='method-title'>Tarjeta de crédito</h4>
                    <p class='method-description'>Visa, Mastercard, American Express</p>
                </div>
                <div class='method-badge popular'>
                    Más elegido
                </div>
            </div>
            
            <div class='method-content'>
                <div class='installments-section'>
                    <h5 class='installments-title'>Cuotas disponibles:</h5>
                    <div class='installments-grid'>
                        {$this->renderInstallmentOptions($installments)}
                    </div>
                </div>
                
                <div class='accepted-cards'>
                    <span class='cards-label'>Tarjetas aceptadas:</span>
                    <div class='cards-list'>
                        <img src='/assets/img/cards/visa.png' alt='Visa' class='card-logo'>
                        <img src='/assets/img/cards/mastercard.png' alt='Mastercard' class='card-logo'>
                        <img src='/assets/img/cards/amex.png' alt='American Express' class='card-logo'>
                        <img src='/assets/img/cards/naranja.png' alt='Naranja' class='card-logo'>
                        <img src='/assets/img/cards/cabal.png' alt='Cabal' class='card-logo'>
                    </div>
                </div>
            </div>
        </div>";
    }
    
    /**
     * Opciones de cuotas sin interés
     */
    private function renderInstallmentOptions($installments) {
        $options = '';
        
        foreach ($installments as $installment) {
            $isNoInterest = $installment['installment_rate'] == 0;
            $badgeClass = $isNoInterest ? 'no-interest' : 'with-interest';
            $badge = $isNoInterest ? 'Sin interés' : number_format($installment['installment_rate'], 2) . '% TEA';
            
            $options .= "
            <div class='installment-option {$badgeClass}' 
                 data-installments='{$installment['installments']}'
                 data-amount='{$installment['installment_amount']}'>
                <div class='installment-info'>
                    <span class='installment-count'>{$installment['installments']}x</span>
                    <span class='installment-amount'>AR$ {$this->formatPrice($installment['installment_amount'])}</span>
                </div>
                <div class='installment-badge {$badgeClass}'>
                    {$badge}
                </div>
                <div class='installment-total'>
                    Total: AR$ {$this->formatPrice($installment['total_amount'])}
                </div>
            </div>";
        }
        
        return $options;
    }
    
    /**
     * Breakdown de precios argentinos
     */
    private function renderPricingBreakdown($pricing) {
        return "
        <div class='pricing-breakdown-section'>
            <h3 class='section-title'>
                <i class='icon-calculator'></i>
                Detalle del precio
            </h3>
            
            <div class='pricing-list'>
                <div class='pricing-item'>
                    <span class='item-label'>Precio del servicio</span>
                    <span class='item-value'>AR$ {$this->formatPrice($pricing['base_price'])}</span>
                </div>
                
                <div class='pricing-item'>
                    <span class='item-label'>Comisión LaburAR</span>
                    <span class='item-value'>AR$ {$this->formatPrice($pricing['platform_fee'])}</span>
                </div>
                
                <div class='pricing-item'>
                    <span class='item-label'>IVA (21%)</span>
                    <span class='item-value'>AR$ {$this->formatPrice($pricing['iva'])}</span>
                </div>
                
                " . ($pricing['iibb'] > 0 ? "
                <div class='pricing-item'>
                    <span class='item-label'>Ing. Brutos (aprox.)</span>
                    <span class='item-value'>AR$ {$this->formatPrice($pricing['iibb'])}</span>
                </div>" : '') . "
                
                <div class='pricing-divider'></div>
                
                <div class='pricing-item total'>
                    <span class='item-label'>Total</span>
                    <span class='item-value'>AR$ {$this->formatPrice($pricing['total'])}</span>
                </div>
            </div>
            
            <div class='pricing-info'>
                <small class='info-text'>
                    <i class='icon-info'></i>
                    Impuestos incluidos según normativa AFIP
                </small>
            </div>
        </div>";
    }
    
    /**
     * Formulario de datos del comprador
     */
    private function renderBuyerForm() {
        return "
        <div class='buyer-form-section'>
            <h3 class='section-title'>
                <i class='icon-user'></i>
                Datos de facturación
            </h3>
            
            <form class='buyer-form' id='buyer-form'>
                <div class='form-grid'>
                    <div class='form-group'>
                        <label class='form-label' for='buyer-name'>Nombre completo *</label>
                        <input type='text' 
                               id='buyer-name' 
                               name='buyer_name' 
                               class='form-input' 
                               placeholder='Juan Pérez'
                               required>
                    </div>
                    
                    <div class='form-group'>
                        <label class='form-label' for='buyer-email'>Email *</label>
                        <input type='email' 
                               id='buyer-email' 
                               name='buyer_email' 
                               class='form-input' 
                               placeholder='juan@ejemplo.com'
                               required>
                    </div>
                    
                    <div class='form-group'>
                        <label class='form-label' for='buyer-document'>DNI/CUIT *</label>
                        <input type='text' 
                               id='buyer-document' 
                               name='buyer_document' 
                               class='form-input' 
                               placeholder='12345678'
                               required>
                    </div>
                    
                    <div class='form-group'>
                        <label class='form-label' for='buyer-phone'>Teléfono *</label>
                        <input type='tel' 
                               id='buyer-phone' 
                               name='buyer_phone' 
                               class='form-input' 
                               placeholder='+54 11 1234-5678'
                               required>
                    </div>
                </div>
                
                <div class='billing-type-section'>
                    <h4 class='subsection-title'>Tipo de facturación</h4>
                    <div class='billing-options'>
                        <label class='billing-option'>
                            <input type='radio' name='billing_type' value='consumidor_final' checked>
                            <span class='radio-custom'></span>
                            <div class='option-content'>
                                <span class='option-title'>Consumidor Final</span>
                                <span class='option-description'>Factura B sin discriminar IVA</span>
                            </div>
                        </label>
                        
                        <label class='billing-option'>
                            <input type='radio' name='billing_type' value='responsable_inscripto'>
                            <span class='radio-custom'></span>
                            <div class='option-content'>
                                <span class='option-title'>Responsable Inscripto</span>
                                <span class='option-description'>Factura A con IVA discriminado</span>
                            </div>
                        </label>
                        
                        <label class='billing-option'>
                            <input type='radio' name='billing_type' value='monotributista'>
                            <span class='radio-custom'></span>
                            <div class='option-content'>
                                <span class='option-title'>Monotributista</span>
                                <span class='option-description'>Factura C</span>
                            </div>
                        </label>
                    </div>
                </div>
                
                <div class='terms-section'>
                    <label class='checkbox-option'>
                        <input type='checkbox' name='accept_terms' required>
                        <span class='checkbox-custom'></span>
                        <span class='checkbox-label'>
                            Acepto los <a href='/terms' target='_blank'>términos y condiciones</a> 
                            y la <a href='/privacy' target='_blank'>política de privacidad</a>
                        </span>
                    </label>
                    
                    <label class='checkbox-option'>
                        <input type='checkbox' name='accept_protection' required>
                        <span class='checkbox-custom'></span>
                        <span class='checkbox-label'>
                            Entiendo la <a href='/buyer-protection' target='_blank'>protección al comprador</a> 
                            de LaburAR
                        </span>
                    </label>
                </div>
            </form>
        </div>";
    }
    
    /**
     * Información de seguridad
     */
    private function renderSecurityInfo() {
        return "
        <div class='security-info-section'>
            <h3 class='section-title'>
                <i class='icon-shield'></i>
                Compra protegida
            </h3>
            
            <div class='security-features'>
                <div class='security-feature'>
                    <i class='feature-icon icon-check-circle'></i>
                    <div class='feature-content'>
                        <h4 class='feature-title'>Pago seguro</h4>
                        <p class='feature-description'>
                            Transacción protegida por MercadoPago con certificación PCI DSS
                        </p>
                    </div>
                </div>
                
                <div class='security-feature'>
                    <i class='feature-icon icon-clock'></i>
                    <div class='feature-content'>
                        <h4 class='feature-title'>Garantía de entrega</h4>
                        <p class='feature-description'>
                            Tu dinero está protegido hasta que recibas el trabajo completo
                        </p>
                    </div>
                </div>
                
                <div class='security-feature'>
                    <i class='feature-icon icon-support'></i>
                    <div class='feature-content'>
                        <h4 class='feature-title'>Soporte 24/7</h4>
                        <p class='feature-description'>
                            Atención al cliente en español argentino las 24 horas
                        </p>
                    </div>
                </div>
                
                <div class='security-feature'>
                    <i class='feature-icon icon-file-text'></i>
                    <div class='feature-content'>
                        <h4 class='feature-title'>Facturación AFIP</h4>
                        <p class='feature-description'>
                            Factura electrónica automática según normativa argentina
                        </p>
                    </div>
                </div>
            </div>
        </div>";
    }
    
    /**
     * SDK de MercadoPago
     */
    private function renderMercadoPagoSDK() {
        return "
        <script src='https://sdk.mercadopago.com/js/v2'></script>
        <script>
            const mp = new MercadoPago('" . self::MP_PUBLIC_KEY . "', {
                locale: 'es-AR'
            });
            
            // Configuración específica argentina
            const checkoutData = {
                package_id: {$this->package['id']},
                service_id: {$this->service['id']},
                freelancer_id: {$this->freelancer['id']},
                pricing: " . json_encode($this->calculatePricing()) . ",
                country: 'AR',
                currency: 'ARS'
            };
            
            // Inicializar checkout argentino
            window.mercadoPagoCheckout = new MercadoPagoArgentino(mp, checkoutData);
        </script>";
    }
    
    // Métodos de cálculo
    
    /**
     * Calcular pricing argentino completo
     */
    private function calculatePricing() {
        $basePrice = floatval($this->package['price']);
        
        // Comisión plataforma
        $platformFee = $basePrice * 0.05; // 5% comisión LaburAR
        
        // IVA sobre comisión
        $iva = $platformFee * self::IVA_RATE;
        
        // Ingresos Brutos (solo para ciertos servicios)
        $iibb = $basePrice * self::IIBB_RATE;
        
        // Comisión MercadoPago
        $mpFee = ($basePrice + $platformFee) * self::MP_FEE_RATE;
        $mpIva = $mpFee * self::IVA_RATE;
        
        $total = $basePrice + $platformFee + $iva + $iibb + $mpFee + $mpIva;
        
        return [
            'base_price' => $basePrice,
            'platform_fee' => $platformFee,
            'iva' => $iva,
            'iibb' => $iibb,
            'mp_fee' => $mpFee,
            'mp_iva' => $mpIva,
            'total' => $total
        ];
    }
    
    /**
     * Obtener opciones de cuotas
     */
    private function getInstallmentOptions() {
        $pricing = $this->calculatePricing();
        $amount = $pricing['total'];
        
        // Simular respuesta de API MercadoPago
        return [
            [
                'installments' => 1,
                'installment_rate' => 0,
                'installment_amount' => $amount,
                'total_amount' => $amount
            ],
            [
                'installments' => 3,
                'installment_rate' => 0,
                'installment_amount' => $amount / 3,
                'total_amount' => $amount
            ],
            [
                'installments' => 6,
                'installment_rate' => 0,
                'installment_amount' => $amount / 6,
                'total_amount' => $amount
            ],
            [
                'installments' => 12,
                'installment_rate' => 0,
                'installment_amount' => $amount / 12,
                'total_amount' => $amount
            ],
            [
                'installments' => 18,
                'installment_rate' => 12.5,
                'installment_amount' => ($amount * 1.125) / 18,
                'total_amount' => $amount * 1.125
            ]
        ];
    }
    
    private function formatPrice($amount) {
        return number_format($amount, 0, ',', '.');
    }
    
    // Métodos auxiliares para renders específicos...
    
    private function renderExtrasOptions() {
        return "
        <div class='extras-options'>
            <h4 class='extras-title'>Complementos disponibles</h4>
            <div class='extras-list'>
                <label class='extra-option'>
                    <input type='checkbox' name='extras[]' value='express' data-price='1500'>
                    <span class='checkbox-custom'></span>
                    <div class='extra-content'>
                        <span class='extra-title'>Entrega express</span>
                        <span class='extra-description'>-50% tiempo de entrega</span>
                        <span class='extra-price'>+AR$ 1.500</span>
                    </div>
                </label>
                
                <label class='extra-option'>
                    <input type='checkbox' name='extras[]' value='priority' data-price='800'>
                    <span class='checkbox-custom'></span>
                    <div class='extra-content'>
                        <span class='extra-title'>Soporte prioritario</span>
                        <span class='extra-description'>Respuesta en menos de 2 horas</span>
                        <span class='extra-price'>+AR$ 800</span>
                    </div>
                </label>
            </div>
        </div>";
    }
    
    private function renderServiceSummary() {
        return "
        <div class='service-summary-section'>
            <div class='freelancer-card'>
                <img src='{$this->freelancer['avatar_url']}' alt='Freelancer' class='freelancer-avatar'>
                <div class='freelancer-info'>
                    <h4 class='freelancer-name'>{$this->freelancer['first_name']} {$this->freelancer['last_name']}</h4>
                    <p class='freelancer-title'>{$this->freelancer['professional_title']}</p>
                    <div class='freelancer-rating'>
                        <span class='rating-stars'>★★★★★</span>
                        <span class='rating-text'>{$this->freelancer['rating']} ({$this->freelancer['rating_count']} opiniones)</span>
                    </div>
                </div>
            </div>
            
            <div class='service-info'>
                <h3 class='service-title'>{$this->service['title']}</h3>
                <div class='service-features'>
                    {$this->renderServiceFeatures()}
                </div>
            </div>
        </div>";
    }
    
    private function renderServiceFeatures() {
        $features = json_decode($this->package['features'] ?? '[]', true);
        $featuresHtml = '';
        
        foreach ($features as $feature) {
            $featuresHtml .= "
            <div class='service-feature'>
                <i class='icon-check'></i>
                <span>{$feature}</span>
            </div>";
        }
        
        return $featuresHtml;
    }
    
    private function renderDebitCardOption() {
        return "
        <div class='payment-method debit-card' data-method='debit_card'>
            <div class='method-header'>
                <div class='method-icon'>
                    <i class='icon-card'></i>
                </div>
                <div class='method-info'>
                    <h4 class='method-title'>Tarjeta de débito</h4>
                    <p class='method-description'>Descuento inmediato</p>
                </div>
            </div>
        </div>";
    }
    
    private function renderCashOptions() {
        return "
        <div class='payment-method cash' data-method='cash'>
            <div class='method-header'>
                <div class='method-icon'>
                    <i class='icon-dollar-sign'></i>
                </div>
                <div class='method-info'>
                    <h4 class='method-title'>Efectivo</h4>
                    <p class='method-description'>Rapipago, Pago Fácil</p>
                </div>
            </div>
        </div>";
    }
    
    private function renderBankTransferOption() {
        return "
        <div class='payment-method bank-transfer' data-method='bank_transfer'>
            <div class='method-header'>
                <div class='method-icon'>
                    <i class='icon-bank'></i>
                </div>
                <div class='method-info'>
                    <h4 class='method-title'>Transferencia</h4>
                    <p class='method-description'>CBU/CVU</p>
                </div>
            </div>
        </div>";
    }
    
    private function renderFooter() {
        return "
        <div class='checkout-footer-content'>
            <button class='btn-complete-purchase' id='complete-purchase-btn' disabled>
                <i class='icon-lock'></i>
                <span class='btn-text'>Completar compra segura</span>
                <span class='btn-amount'>AR$ {$this->formatPrice($this->calculatePricing()['total'])}</span>
            </button>
            
            <div class='footer-info'>
                <p class='info-text'>
                    Al hacer clic en 'Completar compra' aceptás nuestros términos y condiciones.
                    Tu pago estará protegido por MercadoPago hasta que recibas el trabajo.
                </p>
            </div>
        </div>";
    }
    
    /**
     * Método estático para uso rápido
     */
    public static function quickRender($packageData, $serviceData, $freelancerData) {
        $instance = new self($packageData, $serviceData, $freelancerData);
        return $instance->render();
    }
}