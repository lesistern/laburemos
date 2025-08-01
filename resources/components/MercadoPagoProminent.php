<?php
/**
 * LaburAR MercadoPago Prominent UI Component
 * 
 * Displays MercadoPago payment features prominently
 * Highlights installments, security, and local payment methods
 * 
 * @author LaburAR Team
 * @version 1.0
 * @since 2025-07-21
 */

require_once __DIR__ . '/../../app/Services/MercadoPagoEnhanced.php';
require_once __DIR__ . '/../../app/Services/DatabaseHelper.php';

class MercadoPagoProminent {
    
    /**
     * Render prominent payment features section
     */
    public static function renderPaymentFeatures(): string {
        ob_start();
        ?>
        <div class="mercadopago-prominence">
            <div class="mp-header">
                <img src="/Laburar/assets/img/mercadopago-logo.svg" alt="MercadoPago" class="mp-logo">
                <h3 class="mp-title">Pagá como más te convenga</h3>
                <p class="mp-subtitle">La forma más segura de pagar en Argentina</p>
            </div>
            
            <div class="mp-features">
                <div class="mp-feature featured">
                    <div class="feature-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                    </div>
                    <div class="feature-content">
                        <h4 class="feature-title">Hasta 12 cuotas sin interés</h4>
                        <p class="feature-description">Con todas las tarjetas de crédito</p>
                    </div>
                </div>
                
                <div class="mp-feature">
                    <div class="feature-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1M10 17L6 13L7.41 11.59L10 14.17L16.59 7.58L18 9L10 17Z"/>
                        </svg>
                    </div>
                    <div class="feature-content">
                        <h4 class="feature-title">Protección al comprador</h4>
                        <p class="feature-description">Reembolso garantizado si hay problemas</p>
                    </div>
                </div>
                
                <div class="mp-feature">
                    <div class="feature-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M11.8 10.9C9.53 10.31 8.8 9.7 8.8 8.75C8.8 7.66 9.81 6.9 11.5 6.9C13.28 6.9 13.94 7.75 14 9H16.21C16.14 7.28 15.09 5.7 13 5.19V3H10V5.16C8.06 5.58 6.5 6.84 6.5 8.77C6.5 11.08 8.41 12.23 11.2 12.9C13.7 13.5 14.2 14.38 14.2 15.31C14.2 16 13.71 17.1 11.5 17.1C9.44 17.1 8.63 16.18 8.5 15H6.32C6.44 17.19 8.08 18.42 10 18.83V21H13V18.85C14.95 18.5 16.5 17.35 16.5 15.3C16.5 12.46 14.07 11.5 11.8 10.9Z"/>
                        </svg>
                    </div>
                    <div class="feature-content">
                        <h4 class="feature-title">Transferencia bancaria</h4>
                        <p class="feature-description">5% de descuento pagando por CBU/Alias</p>
                    </div>
                </div>
                
                <div class="mp-feature">
                    <div class="feature-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
                        </svg>
                    </div>
                    <div class="feature-content">
                        <h4 class="feature-title">Dinero disponible al instante</h4>
                        <p class="feature-description">Recibí el pago en tu cuenta MercadoPago</p>
                    </div>
                </div>
            </div>
            
            <div class="mp-payment-methods">
                <h4 class="methods-title">Métodos de pago aceptados</h4>
                <div class="methods-grid">
                    <img src="/Laburar/assets/img/payment-methods/visa.svg" alt="Visa" class="payment-method">
                    <img src="/Laburar/assets/img/payment-methods/mastercard.svg" alt="Mastercard" class="payment-method">
                    <img src="/Laburar/assets/img/payment-methods/amex.svg" alt="American Express" class="payment-method">
                    <img src="/Laburar/assets/img/payment-methods/cabal.svg" alt="Cabal" class="payment-method">
                    <img src="/Laburar/assets/img/payment-methods/tarjeta-naranja.svg" alt="Tarjeta Naranja" class="payment-method">
                    <img src="/Laburar/assets/img/payment-methods/banco-nacion.svg" alt="Banco Nación" class="payment-method">
                    <img src="/Laburar/assets/img/payment-methods/rapipago.svg" alt="Rapipago" class="payment-method">
                    <img src="/Laburar/assets/img/payment-methods/pagofacil.svg" alt="Pago Fácil" class="payment-method">
                </div>
            </div>
            
            <div class="mp-trust-indicators">
                <div class="trust-item">
                    <span class="trust-icon">🔒</span>
                    <span class="trust-text">Datos protegidos con encriptación SSL</span>
                </div>
                <div class="trust-item">
                    <span class="trust-icon">🏦</span>
                    <span class="trust-text">Autorizado por BCRA</span>
                </div>
                <div class="trust-item">
                    <span class="trust-icon">⚡</span>
                    <span class="trust-text">Procesamiento instantáneo</span>
                </div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Render installment calculator widget
     */
    public static function renderInstallmentCalculator(float $amount): string {
        $mp = new MercadoPagoEnhanced();
        $installmentData = $mp->getInstallmentOptions($amount);
        
        ob_start();
        ?>
        <div class="installment-calculator" data-amount="<?= $amount ?>">
            <h4 class="calculator-title">Calculá tus cuotas</h4>
            
            <div class="amount-display">
                <span class="amount-label">Monto total:</span>
                <span class="amount-value"><?= $mp->formatArgentineAmount($amount) ?></span>
            </div>
            
            <div class="installment-options">
                <?php if ($installmentData['success']): ?>
                    <?php foreach ($installmentData['options'] as $option): ?>
                        <div class="installment-option <?= $option['recommended'] ? 'recommended' : '' ?>" 
                             data-installments="<?= $option['installments'] ?>">
                            <div class="option-header">
                                <span class="installment-count"><?= $option['installments'] ?>x</span>
                                <span class="installment-amount"><?= $mp->formatArgentineAmount($option['installment_amount']) ?></span>
                                
                                <?php if ($option['is_interest_free']): ?>
                                    <span class="interest-badge free">Sin interés</span>
                                <?php else: ?>
                                    <span class="interest-badge with-interest">Con interés</span>
                                <?php endif; ?>
                                
                                <?php if ($option['recommended']): ?>
                                    <span class="recommended-badge">Recomendado</span>
                                <?php endif; ?>
                            </div>
                            
                            <div class="option-details">
                                <span class="total-amount">Total: <?= $mp->formatArgentineAmount($option['total_amount']) ?></span>
                                
                                <?php if (!$option['is_interest_free']): ?>
                                    <span class="interest-amount">
                                        (+ <?= $mp->formatArgentineAmount($option['total_amount'] - $amount) ?> de interés)
                                    </span>
                                <?php endif; ?>
                            </div>
                        </div>
                    <?php endforeach; ?>
                <?php else: ?>
                    <div class="fallback-options">
                        <div class="installment-option recommended">
                            <div class="option-header">
                                <span class="installment-count">1x</span>
                                <span class="installment-amount"><?= $mp->formatArgentineAmount($amount) ?></span>
                                <span class="interest-badge free">Sin interés</span>
                            </div>
                        </div>
                        
                        <div class="installment-option recommended">
                            <div class="option-header">
                                <span class="installment-count">3x</span>
                                <span class="installment-amount"><?= $mp->formatArgentineAmount($amount / 3) ?></span>
                                <span class="interest-badge free">Sin interés</span>
                                <span class="recommended-badge">Más elegido</span>
                            </div>
                        </div>
                    </div>
                <?php endif; ?>
            </div>
            
            <div class="calculator-footer">
                <p class="disclaimer">* Las cuotas sin interés están sujetas a disponibilidad según tu banco emisor</p>
                <div class="promo-badges">
                    <span class="promo-badge ahora-12">Ahora 12</span>
                    <span class="promo-badge ahora-3">Ahora 3</span>
                    <span class="promo-badge ahora-6">Ahora 6</span>
                </div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Render compact payment badge for service cards
     */
    public static function renderCompactBadge(): string {
        ob_start();
        ?>
        <div class="mp-compact-badge">
            <img src="/Laburar/assets/img/mercadopago-icon.svg" alt="MP" class="mp-icon">
            <span class="mp-text">Hasta 12 cuotas</span>
        </div>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Render payment button with MercadoPago branding
     */
    public static function renderPaymentButton(array $config = []): string {
        $text = $config['text'] ?? 'Pagar con MercadoPago';
        $amount = $config['amount'] ?? 0;
        $serviceId = $config['service_id'] ?? 0;
        $className = $config['class'] ?? 'btn btn-mercadopago';
        
        ob_start();
        ?>
        <button class="<?= htmlspecialchars($className) ?>" 
                data-service-id="<?= $serviceId ?>"
                data-amount="<?= $amount ?>"
                onclick="laburAR.payments.initiateMercadoPago(this)">
            <img src="/Laburar/assets/img/mercadopago-icon-white.svg" alt="MP" class="mp-button-icon">
            <span class="mp-button-text"><?= htmlspecialchars($text) ?></span>
            <?php if ($amount > 0): ?>
                <span class="mp-button-amount"><?= (new MercadoPagoEnhanced())->formatArgentineAmount($amount) ?></span>
            <?php endif; ?>
        </button>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Render checkout summary with installments
     */
    public static function renderCheckoutSummary(array $orderData): string {
        $mp = new MercadoPagoEnhanced();
        $amount = $orderData['amount'] ?? 0;
        $serviceName = $orderData['service_name'] ?? 'Servicio';
        $freelancerName = $orderData['freelancer_name'] ?? 'Freelancer';
        
        // Get fees calculation
        $fees = $mp->calculateArgentineFees($amount);
        
        ob_start();
        ?>
        <div class="mp-checkout-summary">
            <div class="checkout-header">
                <img src="/Laburar/assets/img/mercadopago-logo.svg" alt="MercadoPago" class="checkout-logo">
                <h3 class="checkout-title">Resumen de tu compra</h3>
            </div>
            
            <div class="checkout-details">
                <div class="detail-row">
                    <span class="detail-label">Servicio:</span>
                    <span class="detail-value"><?= htmlspecialchars($serviceName) ?></span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Freelancer:</span>
                    <span class="detail-value"><?= htmlspecialchars($freelancerName) ?></span>
                </div>
                <div class="detail-row total">
                    <span class="detail-label">Total a pagar:</span>
                    <span class="detail-value"><?= $mp->formatArgentineAmount($amount) ?></span>
                </div>
            </div>
            
            <!-- Installment options inline -->
            <div class="checkout-installments">
                <h4 class="installments-title">Elegí cómo pagar:</h4>
                <?= self::renderInstallmentCalculator($amount) ?>
            </div>
            
            <!-- Security badges -->
            <div class="checkout-security">
                <div class="security-badge">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z"/>
                    </svg>
                    <span>Compra protegida</span>
                </div>
                <div class="security-badge">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18 8H17V6A5 5 0 0 0 12 1A5 5 0 0 0 7 6V8H6A2 2 0 0 0 4 10V20A2 2 0 0 0 6 22H18A2 2 0 0 0 20 20V10A2 2 0 0 0 18 8M12 17A2 2 0 0 1 10 15A2 2 0 0 1 12 13A2 2 0 0 1 14 15A2 2 0 0 1 12 17M15.1 8H8.9V6A3.1 3.1 0 0 1 12 2.9A3.1 3.1 0 0 1 15.1 6V8Z"/>
                    </svg>
                    <span>Pago seguro</span>
                </div>
                <div class="security-badge">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2M10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z"/>
                    </svg>
                    <span>Garantía LaburAR</span>
                </div>
            </div>
            
            <!-- Fees breakdown (collapsible) -->
            <details class="fees-breakdown">
                <summary>Ver detalle de comisiones</summary>
                <div class="fees-detail">
                    <?php foreach ($fees['fee_breakdown'] as $label => $value): ?>
                        <div class="fee-row">
                            <span class="fee-label"><?= htmlspecialchars($label) ?>:</span>
                            <span class="fee-value"><?= htmlspecialchars($value) ?></span>
                        </div>
                    <?php endforeach; ?>
                    <div class="fee-row total">
                        <span class="fee-label">Recibirás:</span>
                        <span class="fee-value"><?= $mp->formatArgentineAmount($fees['net_amount']) ?></span>
                    </div>
                </div>
            </details>
        </div>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Render promotional banner for payment methods
     */
    public static function renderPromoBanner(): string {
        $mp = new MercadoPagoEnhanced();
        $promos = $mp->getPromotionalFinancing();
        
        ob_start();
        ?>
        <div class="mp-promo-banner">
            <div class="promo-content">
                <h3 class="promo-title">🎉 Promociones vigentes</h3>
                <div class="promo-list">
                    <?php foreach ($promos as $promo): ?>
                        <div class="promo-item">
                            <span class="promo-name"><?= $promo['name'] ?></span>
                            <span class="promo-detail">
                                <?= $promo['installments'] ?> cuotas sin interés
                            </span>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>
            <div class="promo-action">
                <a href="/promociones" class="btn btn-outline-primary">Ver todas las promos</a>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
}
?>