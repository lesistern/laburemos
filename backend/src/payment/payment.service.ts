import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { StripeService } from './stripe.service';
import { TransactionType, TransactionStatus } from '@prisma/client';

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
  ) {}

  async createPaymentIntent(userId: number, data: { amount: number; projectId?: number }) {
    // Create Stripe payment intent
    const paymentIntent = await this.stripeService.createPaymentIntent(
      data.amount,
      'ars',
      {
        userId: userId.toString(),
        projectId: data.projectId?.toString() || '',
      }
    );

    // Create transaction record
    const transaction = await this.prisma.transaction.create({
      data: {
        userId,
        projectId: data.projectId,
        type: TransactionType.PAYMENT,
        amount: data.amount,
        currency: 'ARS',
        paymentMethod: 'stripe',
        paymentGateway: 'stripe',
        gatewayTransactionId: paymentIntent.paymentIntentId,
        status: TransactionStatus.PENDING,
        description: data.projectId ? `Payment for project ${data.projectId}` : 'Wallet top-up',
      },
    });

    return {
      transactionId: transaction.id,
      clientSecret: paymentIntent.clientSecret,
      amount: data.amount,
    };
  }

  async confirmPayment(userId: number, paymentIntentId: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        userId,
        gatewayTransactionId: paymentIntentId,
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Verify payment with Stripe
    const paymentIntent = await this.stripeService.retrievePaymentIntent(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      // Update transaction
      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: TransactionStatus.COMPLETED,
          processedAt: new Date(),
        },
      });

      // Update user wallet if it's a top-up
      if (!transaction.projectId) {
        await this.prisma.wallet.upsert({
          where: { userId },
          create: {
            userId,
            balance: transaction.amount,
            currency: transaction.currency || 'ARS',
          },
          update: {
            balance: { increment: transaction.amount },
          },
        });
      }

      return { success: true, transactionId: transaction.id };
    }

    throw new BadRequestException('Payment not completed');
  }

  async getUserTransactions(userId: number) {
    return this.prisma.transaction.findMany({
      where: { userId },
      include: {
        project: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTransactionDetails(userId: number, transactionId: number) {
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId,
      },
      include: {
        project: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }
}