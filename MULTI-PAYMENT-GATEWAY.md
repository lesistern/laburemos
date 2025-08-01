# Multi-Payment Gateway Support - LaburAR

## Executive Summary

The Multi-Payment Gateway Support system enables LaburAR to accept payments through multiple providers beyond MercadoPago, including international gateways, cryptocurrency, and bank transfers. This diversification reduces dependency on a single provider and expands payment options for global clients while maintaining strong support for Argentine market needs.

## Technical Architecture

### Gateway Abstraction Layer

```typescript
// Core Payment Gateway Interface
interface PaymentGateway {
  id: string;
  name: string;
  supportedCurrencies: string[];
  supportedCountries: string[];
  features: PaymentFeature[];
  initialize(config: GatewayConfig): Promise<void>;
  createPayment(request: PaymentRequest): Promise<PaymentResponse>;
  processRefund(refundRequest: RefundRequest): Promise<RefundResponse>;
  getTransactionStatus(transactionId: string): Promise<TransactionStatus>;
  handleWebhook(payload: any): Promise<WebhookResponse>;
}

// Payment Gateway Manager
interface PaymentGatewayManager {
  registerGateway(gateway: PaymentGateway): void;
  getAvailableGateways(criteria: GatewayCriteria): PaymentGateway[];
  selectOptimalGateway(payment: PaymentRequest): PaymentGateway;
  processPayment(payment: PaymentRequest): Promise<PaymentResponse>;
  handleFailover(failedGateway: string, payment: PaymentRequest): Promise<PaymentResponse>;
}

// Supported Payment Features
enum PaymentFeature {
  ESCROW = 'escrow',
  RECURRING = 'recurring', 
  REFUNDS = 'refunds',
  PAYOUTS = 'payouts',
  MULTI_CURRENCY = 'multi_currency',
  INSTALLMENTS = 'installments',
  CRYPTOCURRENCY = 'cryptocurrency',
  BANK_TRANSFER = 'bank_transfer'
}
```

### Database Schema

```sql
-- Payment Gateways Configuration
CREATE TABLE payment_gateways (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    provider VARCHAR(50) NOT NULL, -- 'mercadopago', 'stripe', 'paypal', etc.
    is_active BOOLEAN NOT NULL DEFAULT true,
    priority INTEGER NOT NULL DEFAULT 100,
    supported_currencies JSONB NOT NULL, -- ['ARS', 'USD', 'EUR']
    supported_countries JSONB NOT NULL, -- ['AR', 'US', 'BR']
    features JSONB NOT NULL, -- ['escrow', 'recurring', 'refunds']
    configuration JSONB NOT NULL, -- Encrypted gateway-specific config
    fees JSONB NOT NULL, -- Fee structure per transaction type
    limits JSONB NOT NULL, -- Transaction limits
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment Gateway Transactions
CREATE TABLE gateway_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_transaction_id VARCHAR(255) NOT NULL,
    gateway_id VARCHAR(50) NOT NULL REFERENCES payment_gateways(id),
    project_id UUID REFERENCES projects(id),
    user_id UUID NOT NULL REFERENCES users(id),
    transaction_type VARCHAR(50) NOT NULL, -- 'payment', 'refund', 'payout'
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    amount_ars DECIMAL(12,2), -- Converted to ARS for local reporting
    exchange_rate DECIMAL(10,6),
    status VARCHAR(30) NOT NULL, -- 'pending', 'completed', 'failed', 'cancelled'
    gateway_status VARCHAR(50), -- Gateway-specific status
    metadata JSONB,
    webhook_data JSONB,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment Method Preferences per User
CREATE TABLE user_payment_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    preferred_gateway_id VARCHAR(50) REFERENCES payment_gateways(id),
    preferred_currency VARCHAR(3) NOT NULL DEFAULT 'ARS',
    auto_convert_to_ars BOOLEAN DEFAULT true,
    max_transaction_amount DECIMAL(12,2),
    allowed_payment_methods JSONB, -- ['credit_card', 'bank_transfer', 'crypto']
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Gateway Performance Metrics
CREATE TABLE gateway_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gateway_id VARCHAR(50) NOT NULL REFERENCES payment_gateways(id),
    metric_date DATE NOT NULL,
    total_transactions INTEGER DEFAULT 0,
    successful_transactions INTEGER DEFAULT 0,
    failed_transactions INTEGER DEFAULT 0,
    total_volume DECIMAL(15,2) DEFAULT 0,
    average_processing_time_ms INTEGER DEFAULT 0,
    uptime_percentage DECIMAL(5,2) DEFAULT 100.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(gateway_id, metric_date)
);
```

## Gateway Implementations

### MercadoPago Gateway (Primary for Argentina)

```typescript
// src/payment-gateways/mercadopago.gateway.ts
import { Injectable } from '@nestjs/common';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

@Injectable()
export class MercadoPagoGateway implements PaymentGateway {
  id = 'mercadopago';
  name = 'MercadoPago';
  supportedCurrencies = ['ARS', 'BRL', 'MXN', 'COP', 'CLP', 'PEN', 'UYU'];
  supportedCountries = ['AR', 'BR', 'MX', 'CO', 'CL', 'PE', 'UY'];
  features = [
    PaymentFeature.ESCROW,
    PaymentFeature.REFUNDS,
    PaymentFeature.PAYOUTS,
    PaymentFeature.INSTALLMENTS
  ];

  private client: MercadoPagoConfig;
  private preference: Preference;
  private payment: Payment;

  async initialize(config: GatewayConfig): Promise<void> {
    this.client = new MercadoPagoConfig({
      accessToken: config.accessToken,
      options: {
        timeout: 5000,
        idempotencyKey: config.idempotencyKey
      }
    });
    
    this.preference = new Preference(this.client);
    this.payment = new Payment(this.client);
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const preferenceData = {
        items: [{
          id: request.id,
          title: request.description,
          unit_price: request.amount,
          quantity: 1,
          currency_id: request.currency
        }],
        payer: {
          email: request.payer.email,
          identification: {
            type: request.payer.documentType || 'DNI',
            number: request.payer.documentNumber
          }
        },
        metadata: {
          project_id: request.projectId,
          user_id: request.userId,
          transaction_type: request.type
        },
        notification_url: `${process.env.API_BASE_URL}/api/payments/webhook/mercadopago`,
        external_reference: request.id,
        payment_methods: {
          installments: request.allowInstallments ? 12 : 1,
          default_installments: 1
        }
      };

      const preference = await this.preference.create({ body: preferenceData });
      
      return {
        success: true,
        transactionId: preference.id!,
        paymentUrl: preference.init_point!,
        sandboxUrl: preference.sandbox_init_point,
        expiresAt: preference.expires ? new Date(preference.expiration_date_to!) : undefined
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        errorCode: 'MERCADOPAGO_ERROR'
      };
    }
  }

  async processRefund(refundRequest: RefundRequest): Promise<RefundResponse> {
    try {
      const refund = await this.payment.refund({
        id: refundRequest.originalTransactionId,
        body: {
          amount: refundRequest.amount,
          reason: refundRequest.reason
        }
      });

      return {
        success: true,
        refundId: refund.id!.toString(),
        status: refund.status!,
        processedAt: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        errorCode: 'REFUND_FAILED'
      };
    }
  }

  async getTransactionStatus(transactionId: string): Promise<TransactionStatus> {
    try {
      const payment = await this.payment.get({ id: transactionId });
      
      return {
        id: transactionId,
        status: this.mapMercadoPagoStatus(payment.status!),
        amount: payment.transaction_amount!,
        currency: payment.currency_id!,
        processedAt: payment.date_approved ? new Date(payment.date_approved) : undefined,
        metadata: payment.metadata
      };
    } catch (error) {
      throw new Error(`Failed to get transaction status: ${error.message}`);
    }
  }

  async handleWebhook(payload: any): Promise<WebhookResponse> {
    try {
      const { type, data } = payload;
      
      if (type === 'payment') {
        const payment = await this.payment.get({ id: data.id });
        
        return {
          transactionId: data.id,
          status: this.mapMercadoPagoStatus(payment.status!),
          amount: payment.transaction_amount!,
          currency: payment.currency_id!,
          metadata: payment.metadata,
          processed: true
        };
      }
      
      return { processed: false };
    } catch (error) {
      throw new Error(`Webhook processing failed: ${error.message}`);
    }
  }

  private mapMercadoPagoStatus(mpStatus: string): string {
    const statusMap: Record<string, string> = {
      'approved': 'completed',
      'pending': 'pending',
      'rejected': 'failed',
      'cancelled': 'cancelled',
      'refunded': 'refunded'
    };
    
    return statusMap[mpStatus] || 'unknown';
  }
}
```

### Stripe Gateway (International Payments)

```typescript
// src/payment-gateways/stripe.gateway.ts
import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeGateway implements PaymentGateway {
  id = 'stripe';
  name = 'Stripe';
  supportedCurrencies = ['USD', 'EUR', 'GBP', 'ARS', 'BRL', 'MXN'];
  supportedCountries = ['US', 'CA', 'GB', 'FR', 'DE', 'BR', 'MX', 'AR'];
  features = [
    PaymentFeature.ESCROW,
    PaymentFeature.RECURRING,
    PaymentFeature.REFUNDS,
    PaymentFeature.MULTI_CURRENCY
  ];

  private stripe: Stripe;

  async initialize(config: GatewayConfig): Promise<void> {
    this.stripe = new Stripe(config.secretKey, {
      apiVersion: '2023-10-16',
      typescript: true
    });
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: request.currency.toLowerCase(),
            product_data: {
              name: request.description,
              metadata: {
                project_id: request.projectId,
                user_id: request.userId
              }
            },
            unit_amount: Math.round(request.amount * 100) // Convert to cents
          },
          quantity: 1
        }],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/payments/cancel`,
        metadata: {
          project_id: request.projectId,
          user_id: request.userId,
          transaction_type: request.type
        },
        customer_email: request.payer.email,
        expires_at: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      });

      return {
        success: true,
        transactionId: session.id,
        paymentUrl: session.url!,
        expiresAt: new Date(session.expires_at * 1000)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        errorCode: 'STRIPE_ERROR'
      };
    }
  }

  async processRefund(refundRequest: RefundRequest): Promise<RefundResponse> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: refundRequest.originalTransactionId,
        amount: Math.round(refundRequest.amount * 100),
        reason: refundRequest.reason || 'requested_by_customer',
        metadata: {
          refund_reason: refundRequest.reason,
          requested_by: refundRequest.requestedBy
        }
      });

      return {
        success: true,
        refundId: refund.id,
        status: refund.status,
        processedAt: new Date(refund.created * 1000)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        errorCode: 'STRIPE_REFUND_FAILED'
      };
    }
  }

  async getTransactionStatus(transactionId: string): Promise<TransactionStatus> {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(transactionId);
      
      return {
        id: transactionId,
        status: this.mapStripeStatus(session.payment_status),
        amount: session.amount_total! / 100,
        currency: session.currency!.toUpperCase(),
        processedAt: session.payment_status === 'paid' ? new Date() : undefined,
        metadata: session.metadata
      };
    } catch (error) {
      throw new Error(`Failed to get Stripe transaction status: ${error.message}`);
    }
  }

  async handleWebhook(payload: any): Promise<WebhookResponse> {
    try {
      const event = payload;
      
      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object;
          return {
            transactionId: session.id,
            status: 'completed',
            amount: session.amount_total / 100,
            currency: session.currency.toUpperCase(),
            metadata: session.metadata,
            processed: true
          };
        
        case 'payment_intent.payment_failed':
          const paymentIntent = event.data.object;
          return {
            transactionId: paymentIntent.id,
            status: 'failed',
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency.toUpperCase(),
            metadata: paymentIntent.metadata,
            processed: true
          };
      }
      
      return { processed: false };
    } catch (error) {
      throw new Error(`Stripe webhook processing failed: ${error.message}`);
    }
  }

  private mapStripeStatus(stripeStatus: string): string {
    const statusMap: Record<string, string> = {
      'paid': 'completed',
      'unpaid': 'pending',
      'no_payment_required': 'completed'
    };
    
    return statusMap[stripeStatus] || 'pending';
  }
}
```

### PayPal Gateway

```typescript
// src/payment-gateways/paypal.gateway.ts
import { Injectable } from '@nestjs/common';
import paypal from '@paypal/checkout-server-sdk';

@Injectable()
export class PayPalGateway implements PaymentGateway {
  id = 'paypal';
  name = 'PayPal';
  supportedCurrencies = ['USD', 'EUR', 'GBP', 'ARS', 'BRL', 'MXN', 'CAD', 'AUD'];
  supportedCountries = ['US', 'CA', 'GB', 'FR', 'DE', 'BR', 'MX', 'AR', 'AU'];
  features = [
    PaymentFeature.ESCROW,
    PaymentFeature.REFUNDS,
    PaymentFeature.PAYOUTS,
    PaymentFeature.MULTI_CURRENCY
  ];

  private client: paypal.core.PayPalHttpClient;

  async initialize(config: GatewayConfig): Promise<void> {
    const environment = config.sandbox 
      ? new paypal.core.SandboxEnvironment(config.clientId, config.clientSecret)
      : new paypal.core.LiveEnvironment(config.clientId, config.clientSecret);
    
    this.client = new paypal.core.PayPalHttpClient(environment);
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const orderRequest = new paypal.orders.OrdersCreateRequest();
      orderRequest.prefer('return=representation');
      orderRequest.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: request.id,
          amount: {
            currency_code: request.currency,
            value: request.amount.toFixed(2)
          },
          description: request.description,
          custom_id: request.projectId
        }],
        application_context: {
          brand_name: 'LaburAR',
          landing_page: 'BILLING',
          user_action: 'PAY_NOW',
          return_url: `${process.env.FRONTEND_URL}/payments/paypal/success`,
          cancel_url: `${process.env.FRONTEND_URL}/payments/paypal/cancel`
        }
      });

      const response = await this.client.execute(orderRequest);
      const order = response.result;
      
      const approvalUrl = order.links?.find(link => link.rel === 'approve')?.href;

      return {
        success: true,
        transactionId: order.id!,
        paymentUrl: approvalUrl!,
        expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000) // 3 hours
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        errorCode: 'PAYPAL_ERROR'
      };
    }
  }

  async processRefund(refundRequest: RefundRequest): Promise<RefundResponse> {
    try {
      const refundRequestObj = new paypal.payments.CapturesRefundRequest(
        refundRequest.originalTransactionId
      );
      
      refundRequestObj.requestBody({
        amount: {
          currency_code: refundRequest.currency,
          value: refundRequest.amount.toFixed(2)
        },
        note_to_payer: refundRequest.reason
      });

      const response = await this.client.execute(refundRequestObj);
      const refund = response.result;

      return {
        success: true,
        refundId: refund.id!,
        status: refund.status!.toLowerCase(),
        processedAt: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        errorCode: 'PAYPAL_REFUND_FAILED'
      };
    }
  }

  async getTransactionStatus(transactionId: string): Promise<TransactionStatus> {
    try {
      const orderRequest = new paypal.orders.OrdersGetRequest(transactionId);
      const response = await this.client.execute(orderRequest);
      const order = response.result;

      return {
        id: transactionId,
        status: this.mapPayPalStatus(order.status!),
        amount: parseFloat(order.purchase_units![0].amount!.value!),
        currency: order.purchase_units![0].amount!.currency_code!,
        processedAt: order.status === 'COMPLETED' ? new Date() : undefined,
        metadata: { custom_id: order.purchase_units![0].custom_id }
      };
    } catch (error) {
      throw new Error(`Failed to get PayPal transaction status: ${error.message}`);
    }
  }

  async handleWebhook(payload: any): Promise<WebhookResponse> {
    try {
      const eventType = payload.event_type;
      const resource = payload.resource;

      switch (eventType) {
        case 'CHECKOUT.ORDER.APPROVED':
          return {
            transactionId: resource.id,
            status: 'pending',
            amount: parseFloat(resource.purchase_units[0].amount.value),
            currency: resource.purchase_units[0].amount.currency_code,
            processed: true
          };

        case 'PAYMENT.CAPTURE.COMPLETED':
          return {
            transactionId: resource.supplementary_data.related_ids.order_id,
            status: 'completed',
            amount: parseFloat(resource.amount.value),
            currency: resource.amount.currency_code,
            processedAt: new Date(resource.create_time),
            processed: true
          };
      }

      return { processed: false };
    } catch (error) {
      throw new Error(`PayPal webhook processing failed: ${error.message}`);
    }
  }

  private mapPayPalStatus(paypalStatus: string): string {
    const statusMap: Record<string, string> = {
      'COMPLETED': 'completed',
      'APPROVED': 'pending',
      'CREATED': 'pending',
      'SAVED': 'pending',
      'VOIDED': 'cancelled',
      'PAYER_ACTION_REQUIRED': 'pending'
    };
    
    return statusMap[paypalStatus] || 'unknown';
  }
}
```

## Payment Gateway Manager

```typescript
// src/payment-gateways/payment-gateway.manager.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class PaymentGatewayManager implements PaymentGatewayManager {
  private readonly logger = new Logger(PaymentGatewayManager.name);
  private gateways = new Map<string, PaymentGateway>();

  constructor(
    @InjectRepository(PaymentGatewayEntity)
    private gatewayRepository: Repository<PaymentGatewayEntity>,
    @InjectRepository(GatewayTransaction)
    private transactionRepository: Repository<GatewayTransaction>,
    @InjectRepository(GatewayPerformance)
    private performanceRepository: Repository<GatewayPerformance>
  ) {}

  async registerGateway(gateway: PaymentGateway): Promise<void> {
    this.gateways.set(gateway.id, gateway);
    this.logger.log(`Registered payment gateway: ${gateway.name}`);
  }

  async getAvailableGateways(criteria: GatewayCriteria): Promise<PaymentGateway[]> {
    const dbGateways = await this.gatewayRepository.find({
      where: { isActive: true },
      order: { priority: 'ASC' }
    });

    return dbGateways
      .map(dbGateway => this.gateways.get(dbGateway.id))
      .filter(gateway => gateway && this.matchesCriteria(gateway, criteria))
      .filter(Boolean) as PaymentGateway[];
  }

  async selectOptimalGateway(payment: PaymentRequest): Promise<PaymentGateway> {
    const criteria: GatewayCriteria = {
      currency: payment.currency,
      country: payment.payer.country,
      amount: payment.amount,
      features: payment.requiredFeatures || []
    };

    const availableGateways = await this.getAvailableGateways(criteria);
    
    if (availableGateways.length === 0) {
      throw new Error('No available payment gateways for this request');
    }

    // Apply selection algorithm
    return this.applyGatewaySelectionAlgorithm(availableGateways, payment);
  }

  async processPayment(payment: PaymentRequest): Promise<PaymentResponse> {
    let lastError: Error | null = null;
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const gateway = await this.selectOptimalGateway(payment);
        this.logger.log(`Processing payment with ${gateway.name} (attempt ${attempt})`);
        
        const response = await gateway.createPayment(payment);
        
        if (response.success) {
          await this.recordTransaction(gateway.id, payment, response);
          await this.updateGatewayPerformance(gateway.id, true);
          return response;
        } else {
          lastError = new Error(response.error);
          await this.updateGatewayPerformance(gateway.id, false);
        }
      } catch (error) {
        lastError = error;
        this.logger.error(`Payment attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          await this.sleep(1000 * attempt); // Exponential backoff
        }
      }
    }

    throw lastError || new Error('All payment attempts failed');
  }

  async handleFailover(failedGateway: string, payment: PaymentRequest): Promise<PaymentResponse> {
    this.logger.warn(`Initiating failover from ${failedGateway}`);
    
    // Mark failed gateway as temporarily unavailable
    await this.temporarilyDisableGateway(failedGateway);
    
    // Process with alternative gateway
    return this.processPayment(payment);
  }

  private applyGatewaySelectionAlgorithm(
    gateways: PaymentGateway[],
    payment: PaymentRequest
  ): PaymentGateway {
    // Selection criteria weights
    const weights = {
      performance: 0.4,    // Success rate and speed
      cost: 0.3,          // Transaction fees
      features: 0.2,      // Required feature support
      preference: 0.1     // User preference
    };

    const scoredGateways = gateways.map(gateway => ({
      gateway,
      score: this.calculateGatewayScore(gateway, payment, weights)
    }));

    scoredGateways.sort((a, b) => b.score - a.score);
    
    this.logger.debug('Gateway selection scores:', scoredGateways.map(sg => ({
      gateway: sg.gateway.name,
      score: sg.score
    })));

    return scoredGateways[0].gateway;
  }

  private calculateGatewayScore(
    gateway: PaymentGateway,
    payment: PaymentRequest,
    weights: any
  ): number {
    // This would implement a sophisticated scoring algorithm
    // For now, return a simple priority-based score
    const baseScore = gateway.id === 'mercadopago' && payment.currency === 'ARS' ? 100 : 80;
    
    // Adjust for currency match
    const currencyBonus = gateway.supportedCurrencies.includes(payment.currency) ? 20 : 0;
    
    // Adjust for feature support
    const featureBonus = payment.requiredFeatures?.every(feature => 
      gateway.features.includes(feature)
    ) ? 15 : 0;

    return baseScore + currencyBonus + featureBonus;
  }

  private matchesCriteria(gateway: PaymentGateway, criteria: GatewayCriteria): boolean {
    // Check currency support
    if (criteria.currency && !gateway.supportedCurrencies.includes(criteria.currency)) {
      return false;
    }

    // Check country support
    if (criteria.country && !gateway.supportedCountries.includes(criteria.country)) {
      return false;
    }

    // Check required features
    if (criteria.features && !criteria.features.every(feature => gateway.features.includes(feature))) {
      return false;
    }

    return true;
  }

  private async recordTransaction(
    gatewayId: string,
    payment: PaymentRequest,
    response: PaymentResponse
  ): Promise<void> {
    const transaction = this.transactionRepository.create({
      externalTransactionId: response.transactionId,
      gatewayId,
      projectId: payment.projectId,
      userId: payment.userId,
      transactionType: payment.type,
      amount: payment.amount,
      currency: payment.currency,
      status: 'pending',
      metadata: { paymentUrl: response.paymentUrl }
    });

    await this.transactionRepository.save(transaction);
  }

  private async updateGatewayPerformance(gatewayId: string, success: boolean): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    let performance = await this.performanceRepository.findOne({
      where: { gatewayId, metricDate: today }
    });

    if (!performance) {
      performance = this.performanceRepository.create({
        gatewayId,
        metricDate: today
      });
    }

    performance.totalTransactions += 1;
    if (success) {
      performance.successfulTransactions += 1;
    } else {
      performance.failedTransactions += 1;
    }

    await this.performanceRepository.save(performance);
  }

  private async temporarilyDisableGateway(gatewayId: string): Promise<void> {
    // Implementation for temporarily disabling a gateway
    // Could use Redis or database flag with TTL
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## API Implementation

### Multi-Gateway Payment Controller

```typescript
// src/payments/multi-gateway-payment.controller.ts
import { Controller, Post, Get, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Multi-Gateway Payments')
@Controller('api/payments')
@UseGuards(JwtAuthGuard)
export class MultiGatewayPaymentController {
  constructor(
    private readonly paymentGatewayManager: PaymentGatewayManager,
    private readonly currencyService: CurrencyService
  ) {}

  @Get('gateways/available')
  @ApiOperation({ summary: 'Get available payment gateways' })
  async getAvailableGateways(@Query() criteria: GatewayCriteriaDto) {
    const gateways = await this.paymentGatewayManager.getAvailableGateways(criteria);
    
    return {
      gateways: gateways.map(gateway => ({
        id: gateway.id,
        name: gateway.name,
        supportedCurrencies: gateway.supportedCurrencies,
        supportedCountries: gateway.supportedCountries,
        features: gateway.features
      }))
    };
  }

  @Post('create')
  @ApiOperation({ summary: 'Create payment with optimal gateway selection' })
  async createPayment(@Body() createPaymentDto: CreatePaymentDto) {
    // Convert amount to ARS if needed for local reporting
    let amountARS = createPaymentDto.amount;
    let exchangeRate = 1;

    if (createPaymentDto.currency !== 'ARS') {
      const conversion = await this.currencyService.convertToARS(
        createPaymentDto.amount,
        createPaymentDto.currency
      );
      amountARS = conversion.amount;
      exchangeRate = conversion.rate;
    }

    const paymentRequest: PaymentRequest = {
      ...createPaymentDto,
      amountARS,
      exchangeRate
    };

    const response = await this.paymentGatewayManager.processPayment(paymentRequest);
    
    return {
      success: response.success,
      transactionId: response.transactionId,
      paymentUrl: response.paymentUrl,
      expiresAt: response.expiresAt,
      gateway: response.gateway,
      amountARS,
      exchangeRate
    };
  }

  @Post('webhook/:gatewayId')
  @ApiOperation({ summary: 'Handle webhook from specific gateway' })
  async handleWebhook(
    @Param('gatewayId') gatewayId: string,
    @Body() payload: any
  ) {
    const gateway = await this.paymentGatewayManager.getGateway(gatewayId);
    if (!gateway) {
      throw new NotFoundException(`Gateway ${gatewayId} not found`);
    }

    const result = await gateway.handleWebhook(payload);
    
    if (result.processed) {
      await this.updateTransactionStatus(result);
    }

    return { received: true };
  }

  @Get('transactions/:transactionId/status')
  @ApiOperation({ summary: 'Get transaction status from any gateway' })
  async getTransactionStatus(@Param('transactionId') transactionId: string) {
    const transaction = await this.findTransactionByExternalId(transactionId);
    
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    const gateway = await this.paymentGatewayManager.getGateway(transaction.gatewayId);
    const status = await gateway.getTransactionStatus(transactionId);
    
    return {
      ...status,
      gateway: transaction.gatewayId,
      amountARS: transaction.amountARS,
      exchangeRate: transaction.exchangeRate
    };
  }

  @Post('refund')
  @ApiOperation({ summary: 'Process refund through original gateway' })
  async processRefund(@Body() refundDto: ProcessRefundDto) {
    const transaction = await this.findTransactionByExternalId(refundDto.originalTransactionId);
    
    if (!transaction) {
      throw new NotFoundException('Original transaction not found');
    }

    const gateway = await this.paymentGatewayManager.getGateway(transaction.gatewayId);
    const refundResponse = await gateway.processRefund(refundDto);
    
    if (refundResponse.success) {
      await this.recordRefundTransaction(transaction, refundResponse);
    }

    return refundResponse;
  }
}
```

## Frontend Components

### Gateway Selection Component

```typescript
// frontend/components/payments/GatewaySelector.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, DollarSign, Shield, Zap } from 'lucide-react';

interface GatewaySelectorProps {
  amount: number;
  currency: string;
  country: string;
  requiredFeatures?: string[];
  onGatewaySelect: (gatewayId: string) => void;
}

export default function GatewaySelector({
  amount,
  currency,
  country,
  requiredFeatures = [],
  onGatewaySelect
}: GatewaySelectorProps) {
  const [availableGateways, setAvailableGateways] = useState<PaymentGateway[]>([]);
  const [selectedGateway, setSelectedGateway] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAvailableGateways();
  }, [amount, currency, country]);

  const fetchAvailableGateways = async () => {
    try {
      const response = await fetch('/api/payments/gateways/available?' + new URLSearchParams({
        currency,
        country,
        amount: amount.toString(),
        features: requiredFeatures.join(',')
      }));
      
      const data = await response.json();
      setAvailableGateways(data.gateways);
      
      // Auto-select optimal gateway
      if (data.gateways.length > 0) {
        setSelectedGateway(data.gateways[0].id);
      }
    } catch (error) {
      console.error('Error fetching gateways:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGatewayIcon = (gatewayId: string) => {
    switch (gatewayId) {
      case 'mercadopago':
        return '💙';
      case 'stripe':
        return '💳';
      case 'paypal':
        return '🅿️';
      default:
        return '💰';
    }
  };

  const getGatewayFeatures = (gateway: PaymentGateway) => {
    const featureLabels = {
      escrow: 'Escrow',
      recurring: 'Suscripciones',
      refunds: 'Reembolsos',
      payouts: 'Pagos',
      multi_currency: 'Multi-moneda',
      installments: 'Cuotas',
      cryptocurrency: 'Crypto',
      bank_transfer: 'Transferencia'
    };

    return gateway.features.map(feature => featureLabels[feature] || feature);
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  if (loading) {
    return <div className="flex justify-center p-8">Cargando métodos de pago...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Seleccionar método de pago</h3>
      
      <div className="grid gap-4">
        {availableGateways.map((gateway) => (
          <Card
            key={gateway.id}
            className={`cursor-pointer transition-all ${
              selectedGateway === gateway.id
                ? 'ring-2 ring-blue-500 border-blue-500'
                : 'hover:shadow-md'
            }`}
            onClick={() => setSelectedGateway(gateway.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getGatewayIcon(gateway.id)}</span>
                  <div>
                    <h4 className="font-semibold">{gateway.name}</h4>
                    <p className="text-sm text-gray-600">
                      {formatCurrency(amount, currency)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {gateway.features.includes('escrow') && (
                    <Badge variant="secondary" className="text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      Seguro
                    </Badge>
                  )}
                  {gateway.features.includes('installments') && (
                    <Badge variant="secondary" className="text-xs">
                      <CreditCard className="h-3 w-3 mr-1" />
                      Cuotas
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
                {getGatewayFeatures(gateway).slice(0, 4).map((feature) => (
                  <Badge key={feature} variant="outline" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>

              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>
                  Monedas: {gateway.supportedCurrencies.slice(0, 3).join(', ')}
                  {gateway.supportedCurrencies.length > 3 && ' +más'}
                </span>
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  <span>Rápido</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedGateway && (
        <Button
          onClick={() => onGatewaySelect(selectedGateway)}
          className="w-full"
          size="lg"
        >
          Continuar con {availableGateways.find(g => g.id === selectedGateway)?.name}
        </Button>
      )}
    </div>
  );
}
```

### Payment Processing Component

```typescript
// frontend/components/payments/PaymentProcessor.tsx
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import GatewaySelector from './GatewaySelector';

interface PaymentProcessorProps {
  projectId: string;
  amount: number;
  currency: string;
  description: string;
  payer: {
    email: string;
    name: string;
    country: string;
    documentType?: string;
    documentNumber?: string;
  };
  onSuccess: (transactionId: string) => void;
  onError: (error: string) => void;
}

export default function PaymentProcessor({
  projectId,
  amount,
  currency,
  description,
  payer,
  onSuccess,
  onError
}: PaymentProcessorProps) {
  const [selectedGateway, setSelectedGateway] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGatewaySelect = (gatewayId: string) => {
    setSelectedGateway(gatewayId);
    setError(null);
  };

  const processPayment = async () => {
    if (!selectedGateway) return;

    setProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          amount,
          currency,
          description,
          payer,
          preferredGateway: selectedGateway,
          type: 'project_payment'
        })
      });

      const data = await response.json();

      if (data.success) {
        if (data.paymentUrl) {
          // Redirect to payment gateway
          window.open(data.paymentUrl, '_blank');
          setPaymentUrl(data.paymentUrl);
          
          // Start polling for payment status
          pollPaymentStatus(data.transactionId);
        } else {
          onSuccess(data.transactionId);
        }
      } else {
        setError(data.error || 'Error al procesar el pago');
      }
    } catch (err) {
      setError('Error de conexión. Por favor intente nuevamente.');
    } finally {
      setProcessing(false);
    }
  };

  const pollPaymentStatus = async (transactionId: string) => {
    const maxAttempts = 60; // 5 minutes max
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/payments/transactions/${transactionId}/status`);
        const data = await response.json();

        if (data.status === 'completed') {
          onSuccess(transactionId);
          return;
        } else if (data.status === 'failed' || data.status === 'cancelled') {
          setError('El pago fue cancelado o falló');
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else {
          setError('Tiempo de espera agotado. Verifique el estado del pago.');
        }
      } catch (err) {
        console.error('Error polling payment status:', err);
      }
    };

    poll();
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Procesar Pago</CardTitle>
        <p className="text-gray-600">
          {description} - {formatCurrency(amount, currency)}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!selectedGateway ? (
          <GatewaySelector
            amount={amount}
            currency={currency}
            country={payer.country}
            requiredFeatures={['escrow', 'refunds']}
            onGatewaySelect={handleGatewaySelect}
          />
        ) : paymentUrl ? (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Clock className="h-12 w-12 text-blue-500 animate-pulse" />
            </div>
            <h3 className="text-lg font-semibold">Pago en proceso</h3>
            <p className="text-gray-600">
              Complete el pago en la ventana que se abrió. Esta página se actualizará automáticamente.
            </p>
            <Button
              variant="outline"
              onClick={() => window.open(paymentUrl, '_blank')}
            >
              Abrir ventana de pago nuevamente
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Resumen del pago</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Monto:</span>
                  <span>{formatCurrency(amount, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Método de pago:</span>
                  <span>{selectedGateway}</span>
                </div>
                <div className="flex justify-between">
                  <span>Proyecto:</span>
                  <span>{projectId}</span>
                </div>
              </div>
            </div>

            <Button
              onClick={processPayment}
              disabled={processing}
              className="w-full"
              size="lg"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                `Pagar ${formatCurrency(amount, currency)}`
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

## Argentina-Specific Features

### Currency Exchange Service

```typescript
// src/currency/currency-exchange.service.ts
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class CurrencyExchangeService {
  constructor(private readonly httpService: HttpService) {}

  async convertToARS(amount: number, fromCurrency: string): Promise<ConversionResult> {
    if (fromCurrency === 'ARS') {
      return { amount, rate: 1, timestamp: new Date() };
    }

    // Use multiple sources for exchange rates
    const rates = await Promise.allSettled([
      this.getBCRARate(fromCurrency),
      this.getDolarAPIRate(fromCurrency),
      this.getBackupRate(fromCurrency)
    ]);

    // Use the most reliable rate
    const validRates = rates
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<number>).value);

    if (validRates.length === 0) {
      throw new Error(`Unable to get exchange rate for ${fromCurrency} to ARS`);
    }

    // Use median rate to avoid outliers
    const rate = this.getMedianRate(validRates);
    const convertedAmount = amount * rate;

    return {
      amount: Math.round(convertedAmount * 100) / 100,
      rate,
      timestamp: new Date()
    };
  }

  private async getBCRARate(currency: string): Promise<number> {
    // Integration with Banco Central de la República Argentina
    try {
      const response = await this.httpService.axiosRef.get(
        `https://api.bcra.gob.ar/estadisticas/v2.0/datosvariable/4/2023-01-01/2023-12-31`
      );
      // Process BCRA response
      return response.data.Results[0].valor;
    } catch (error) {
      throw new Error('BCRA API error');
    }
  }

  private async getDolarAPIRate(currency: string): Promise<number> {
    // Integration with DolarAPI for real-time rates
    try {
      const response = await this.httpService.axiosRef.get(
        `https://api.dolarapi.com/v1/dolares/${currency.toLowerCase()}`
      );
      return response.data.venta;
    } catch (error) {
      throw new Error('DolarAPI error');
    }
  }

  private async getBackupRate(currency: string): Promise<number> {
    // Backup exchange rate service
    try {
      const response = await this.httpService.axiosRef.get(
        `https://api.exchangerate-api.com/v4/latest/${currency}`
      );
      return response.data.rates.ARS;
    } catch (error) {
      throw new Error('Backup API error');
    }
  }

  private getMedianRate(rates: number[]): number {
    const sorted = rates.sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    return sorted.length % 2 !== 0 
      ? sorted[mid] 
      : (sorted[mid - 1] + sorted[mid]) / 2;
  }
}
```

### Tax Compliance Integration

```typescript
// src/tax/multi-gateway-tax.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class MultiGatewayTaxService {
  async processPaymentTaxReporting(transaction: GatewayTransaction): Promise<void> {
    // Different tax treatment based on gateway and transaction type
    switch (transaction.gatewayId) {
      case 'mercadopago':
        await this.processLocalTaxReporting(transaction);
        break;
      case 'stripe':
      case 'paypal':
        await this.processInternationalTaxReporting(transaction);
        break;
      default:
        await this.processGenericTaxReporting(transaction);
    }
  }

  private async processLocalTaxReporting(transaction: GatewayTransaction): Promise<void> {
    // Standard AFIP reporting for local transactions
    const taxData = {
      fecha_operacion: transaction.createdAt.toISOString().split('T')[0],
      importe: transaction.amountArs,
      moneda: 'ARS',
      tipo_operacion: 'PAGO_FREELANCE',
      cuit_pagador: await this.getCUITForUser(transaction.userId),
      // ... additional AFIP fields
    };

    await this.submitToAFIP(taxData);
  }

  private async processInternationalTaxReporting(transaction: GatewayTransaction): Promise<void> {
    // Special handling for international payments
    const taxData = {
      fecha_operacion: transaction.createdAt.toISOString().split('T')[0],
      importe_original: transaction.amount,
      moneda_original: transaction.currency,
      importe_ars: transaction.amountArs,
      tipo_cambio: transaction.exchangeRate,
      plataforma_pago: transaction.gatewayId.toUpperCase(),
      tipo_operacion: 'PAGO_INTERNACIONAL',
      // ... additional fields for international transactions
    };

    await this.submitToAFIP(taxData);
    await this.processExchangeControlReporting(transaction);
  }

  private async processExchangeControlReporting(transaction: GatewayTransaction): Promise<void> {
    // Report to BCRA for exchange control compliance
    if (transaction.amount > 1000 && transaction.currency === 'USD') {
      const exchangeControlData = {
        fecha: transaction.createdAt.toISOString().split('T')[0],
        monto_usd: transaction.amount,
        tipo_cambio: transaction.exchangeRate,
        concepto: 'SERVICIOS_DIGITALES',
        plataforma: transaction.gatewayId
      };

      await this.submitToBCRA(exchangeControlData);
    }
  }
}
```

## Implementation Timeline

### Phase 1: Foundation (6-8 weeks)
- [ ] Gateway abstraction layer implementation
- [ ] MercadoPago gateway (primary)
- [ ] Database schema and basic transaction management
- [ ] Gateway selection algorithm (basic)

### Phase 2: Additional Gateways (4-6 weeks)
- [ ] Stripe gateway implementation
- [ ] PayPal gateway implementation
- [ ] Failover and retry mechanisms
- [ ] Performance monitoring system

### Phase 3: Advanced Features (4-6 weeks)
- [ ] Currency exchange integration
- [ ] Tax compliance for multiple gateways
- [ ] Advanced gateway selection algorithm
- [ ] User payment preferences

### Phase 4: Optimization (3-4 weeks)
- [ ] Load testing with multiple gateways
- [ ] Security audit
- [ ] Performance optimization
- [ ] Monitoring and alerting

## Security Considerations

### Gateway Security
- Secure storage of gateway credentials using encryption
- API key rotation and management
- Webhook signature verification for all gateways
- Rate limiting and DDoS protection

### Transaction Security
- End-to-end encryption of payment data
- PCI DSS compliance for card data handling
- Fraud detection integration
- Transaction monitoring and anomaly detection

### Data Protection
- GDPR compliance for international payments
- Argentine data protection law compliance
- Secure data transmission between gateways
- Regular security audits

## Testing Strategy

### Gateway Testing
```typescript
// tests/payment-gateways/gateway.integration.spec.ts
describe('Payment Gateway Integration', () => {
  describe('MercadoPago Gateway', () => {
    it('should create payment successfully', async () => {
      const payment = await mercadopagoGateway.createPayment(mockPaymentRequest);
      expect(payment.success).toBe(true);
      expect(payment.transactionId).toBeDefined();
    });

    it('should handle webhook correctly', async () => {
      const result = await mercadopagoGateway.handleWebhook(mockWebhookPayload);
      expect(result.processed).toBe(true);
    });
  });

  describe('Stripe Gateway', () => {
    it('should process international payment', async () => {
      const payment = await stripeGateway.createPayment(mockUSDPayment);
      expect(payment.success).toBe(true);
    });
  });
});
```

### Failover Testing
```typescript
describe('Gateway Failover', () => {
  it('should failover to secondary gateway when primary fails', async () => {
    // Mock MercadoPago failure
    jest.spyOn(mercadopagoGateway, 'createPayment').mockRejectedValue(new Error('Gateway down'));
    
    const payment = await paymentGatewayManager.processPayment(mockPaymentRequest);
    
    expect(payment.success).toBe(true);
    expect(payment.gateway).toBe('stripe'); // Fallback gateway
  });
});
```

## Performance Metrics & KPIs

### Gateway Performance
- **Transaction Success Rate**: >99% per gateway
- **Average Processing Time**: <5 seconds per transaction
- **Failover Time**: <30 seconds when gateway fails
- **API Response Time**: <2 seconds average

### Business Metrics
- **Gateway Distribution**: Track usage across gateways
- **Currency Distribution**: Monitor payment currencies
- **International vs Local**: Track payment origins
- **Cost Optimization**: Monitor transaction fees per gateway

### Argentina-Specific KPIs
- **ARS Conversion Accuracy**: <1% deviation from market rates
- **Tax Compliance**: 100% accurate reporting to AFIP
- **Exchange Control**: Timely BCRA reporting for USD transactions
- **Local Gateway Preference**: Track MercadoPago usage for ARS

## Conclusion

The Multi-Payment Gateway Support system provides LaburAR with a robust, flexible payment infrastructure that can handle diverse payment needs while maintaining strong support for the Argentine market. Key benefits include:

- **Redundancy**: Multiple gateways ensure high availability
- **Global Reach**: Support for international clients and currencies
- **Cost Optimization**: Intelligent gateway selection minimizes fees
- **Compliance**: Full tax and regulatory compliance across jurisdictions
- **User Experience**: Seamless payment experience regardless of gateway

This system positions LaburAR as a truly global platform while maintaining its strong local presence in Argentina.