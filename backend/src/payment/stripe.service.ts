import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: Stripe;

  constructor(private configService: ConfigService) {
    this.stripe = new Stripe(this.configService.get<string>('stripe.secretKey'), {
      apiVersion: '2023-08-16',
    });
  }

  async createPaymentIntent(amount: number, currency: string = 'usd', metadata?: any) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      this.logger.log(`Payment intent created: ${paymentIntent.id} for amount ${amount} ${currency}`);
      
      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      this.logger.error('Failed to create payment intent:', error);
      throw new BadRequestException('Failed to create payment intent');
    }
  }

  async confirmPaymentIntent(paymentIntentId: string) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId);
      
      this.logger.log(`Payment intent confirmed: ${paymentIntentId}`);
      
      return {
        status: paymentIntent.status,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      this.logger.error('Failed to confirm payment intent:', error);
      throw new BadRequestException('Failed to confirm payment');
    }
  }

  async retrievePaymentIntent(paymentIntentId: string) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      
      this.logger.log(`Payment intent retrieved: ${paymentIntentId}`);
      
      return paymentIntent;
    } catch (error) {
      this.logger.error('Failed to retrieve payment intent:', error);
      throw new BadRequestException('Failed to retrieve payment intent');
    }
  }

  async createCustomer(email: string, name?: string, metadata?: any) {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata,
      });

      this.logger.log(`Stripe customer created: ${customer.id} for ${email}`);
      
      return customer;
    } catch (error) {
      this.logger.error('Failed to create Stripe customer:', error);
      throw new BadRequestException('Failed to create customer');
    }
  }

  async retrieveCustomer(customerId: string) {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);
      return customer;
    } catch (error) {
      this.logger.error('Failed to retrieve Stripe customer:', error);
      throw new BadRequestException('Failed to retrieve customer');
    }
  }

  async createSetupIntent(customerId: string) {
    try {
      const setupIntent = await this.stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
      });

      return {
        clientSecret: setupIntent.client_secret,
        setupIntentId: setupIntent.id,
      };
    } catch (error) {
      this.logger.error('Failed to create setup intent:', error);
      throw new BadRequestException('Failed to create setup intent');
    }
  }

  async listPaymentMethods(customerId: string) {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      return paymentMethods.data;
    } catch (error) {
      this.logger.error('Failed to list payment methods:', error);
      throw new BadRequestException('Failed to list payment methods');
    }
  }

  async createRefund(paymentIntentId: string, amount?: number, reason?: string) {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        ...(amount && { amount: Math.round(amount * 100) }),
        ...(reason && { reason: reason as Stripe.RefundCreateParams.Reason }),
      });

      this.logger.log(`Refund created: ${refund.id} for payment intent ${paymentIntentId}`);
      
      return refund;
    } catch (error) {
      this.logger.error('Failed to create refund:', error);
      throw new BadRequestException('Failed to create refund');
    }
  }

  async constructWebhookEvent(payload: Buffer, signature: string): Promise<Stripe.Event> {
    try {
      const webhookSecret = this.configService.get<string>('stripe.webhookSecret');
      return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      this.logger.error('Failed to construct webhook event:', error);
      throw new BadRequestException('Invalid webhook signature');
    }
  }

  async handleWebhookEvent(event: Stripe.Event) {
    this.logger.log(`Handling Stripe webhook: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await this.handlePaymentIntentSucceeded(paymentIntent);
        break;
      
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        await this.handlePaymentIntentFailed(failedPayment);
        break;
      
      case 'charge.dispute.created':
        const dispute = event.data.object as Stripe.Dispute;
        await this.handleChargeDispute(dispute);
        break;
        
      default:
        this.logger.log(`Unhandled webhook event type: ${event.type}`);
    }
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    // Update payment status in database
    // Send notification to user
    // Update project status if applicable
    this.logger.log(`Payment succeeded: ${paymentIntent.id}`);
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    // Update payment status in database
    // Send notification to user
    // Handle failed payment logic
    this.logger.log(`Payment failed: ${paymentIntent.id}`);
  }

  private async handleChargeDispute(dispute: Stripe.Dispute) {
    // Handle dispute logic
    // Notify relevant parties
    this.logger.log(`Charge disputed: ${dispute.id}`);
  }

  async createTransfer(amount: number, destination: string, currency: string = 'usd') {
    try {
      const transfer = await this.stripe.transfers.create({
        amount: Math.round(amount * 100),
        currency,
        destination,
      });

      this.logger.log(`Transfer created: ${transfer.id} to ${destination}`);
      
      return transfer;
    } catch (error) {
      this.logger.error('Failed to create transfer:', error);
      throw new BadRequestException('Failed to create transfer');
    }
  }

  async createConnectAccount(email: string, country: string = 'US') {
    try {
      const account = await this.stripe.accounts.create({
        type: 'express',
        email,
        country,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      this.logger.log(`Connect account created: ${account.id} for ${email}`);
      
      return account;
    } catch (error) {
      this.logger.error('Failed to create connect account:', error);
      throw new BadRequestException('Failed to create connect account');
    }
  }

  async createAccountLink(accountId: string, refreshUrl: string, returnUrl: string) {
    try {
      const accountLink = await this.stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
      });

      return accountLink;
    } catch (error) {
      this.logger.error('Failed to create account link:', error);
      throw new BadRequestException('Failed to create account link');
    }
  }
}