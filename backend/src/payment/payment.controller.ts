import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaymentService } from './payment.service';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create-intent')
  @ApiOperation({ summary: 'Create payment intent' })
  async createPaymentIntent(
    @CurrentUser('id') userId: number,
    @Body() data: { amount: number; projectId?: number },
  ) {
    return this.paymentService.createPaymentIntent(userId, data);
  }

  @Post('confirm')
  @ApiOperation({ summary: 'Confirm payment' })
  async confirmPayment(
    @CurrentUser('id') userId: number,
    @Body() data: { paymentIntentId: string },
  ) {
    return this.paymentService.confirmPayment(userId, data.paymentIntentId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get payment history' })
  async getPaymentHistory(@CurrentUser('id') userId: number) {
    return this.paymentService.getUserTransactions(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment details' })
  async getPaymentDetails(
    @CurrentUser('id') userId: number,
    @Param('id') transactionId: string,
  ) {
    return this.paymentService.getTransactionDetails(userId, parseInt(transactionId));
  }
}