# Dynamic Commission Structure - LaburAR

## Executive Summary

The Dynamic Commission Structure system enables LaburAR to optimize revenue while providing competitive rates for users. This intelligent system adjusts fees based on user behavior, transaction volume, market conditions, and business objectives while maintaining transparency and compliance with Argentine regulations.

## Technical Architecture

### Core Commission Engine

```typescript
// Commission Calculation Engine
interface CommissionEngine {
  calculateCommission(transaction: TransactionRequest): Promise<CommissionResult>;
  getActiveRules(): Promise<CommissionRule[]>;
  updateRules(rules: CommissionRule[]): Promise<void>;
  generateCommissionReport(period: DateRange): Promise<CommissionReport>;
}

// Commission Rule Structure
interface CommissionRule {
  id: string;
  name: string;
  description: string;
  priority: number;
  isActive: boolean;
  conditions: RuleCondition[];
  actions: RuleAction[];
  validFrom: Date;
  validTo?: Date;
  applicableToUsers?: string[];
  applicableToProjects?: string[];
  metadata: Record<string, any>;
}

// Rule Conditions
interface RuleCondition {
  type: ConditionType;
  field: string;
  operator: ComparisonOperator;
  value: any;
  logicalOperator?: LogicalOperator;
}

enum ConditionType {
  USER_TIER = 'user_tier',
  TRANSACTION_AMOUNT = 'transaction_amount',
  MONTHLY_VOLUME = 'monthly_volume',
  USER_RATING = 'user_rating',
  PROJECT_CATEGORY = 'project_category',
  PAYMENT_METHOD = 'payment_method',
  TIME_OF_DAY = 'time_of_day',
  DAY_OF_WEEK = 'day_of_week',
  GEOGRAPHIC_REGION = 'geographic_region',
  PLATFORM_USAGE = 'platform_usage'
}

// Commission Actions
interface RuleAction {
  type: ActionType;
  operation: 'set' | 'add' | 'subtract' | 'multiply' | 'percentage';
  value: number;
  cap?: number;
  floor?: number;
}

enum ActionType {
  BASE_COMMISSION = 'base_commission',
  DISCOUNT = 'discount',
  BONUS = 'bonus',
  FIXED_FEE = 'fixed_fee',
  PERCENTAGE_ADJUSTMENT = 'percentage_adjustment'
}
```

### Database Schema

```sql
-- Commission Rules Table
CREATE TABLE commission_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    priority INTEGER NOT NULL DEFAULT 100,
    is_active BOOLEAN NOT NULL DEFAULT true,
    rule_type VARCHAR(50) NOT NULL, -- 'user_tier', 'volume_based', 'promotional', etc.
    conditions JSONB NOT NULL,
    actions JSONB NOT NULL,
    valid_from TIMESTAMP NOT NULL,
    valid_to TIMESTAMP,
    applicable_users JSONB, -- Array of user IDs or criteria
    applicable_projects JSONB, -- Array of project types or criteria
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- User Tiers Table
CREATE TABLE user_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier_name VARCHAR(50) NOT NULL UNIQUE, -- 'starter', 'professional', 'enterprise'
    min_monthly_volume DECIMAL(12,2) NOT NULL DEFAULT 0,
    min_completed_projects INTEGER NOT NULL DEFAULT 0,
    min_rating DECIMAL(3,2) NOT NULL DEFAULT 0,
    max_dispute_rate DECIMAL(5,2) NOT NULL DEFAULT 100,
    base_commission_rate DECIMAL(5,4) NOT NULL, -- e.g., 0.0500 for 5%
    benefits JSONB DEFAULT '{}',
    requirements JSONB DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Tier Assignments
CREATE TABLE user_tier_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    tier_id UUID NOT NULL REFERENCES user_tiers(id),
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    monthly_volume DECIMAL(12,2) DEFAULT 0,
    completed_projects INTEGER DEFAULT 0,
    current_rating DECIMAL(3,2),
    dispute_rate DECIMAL(5,2) DEFAULT 0,
    auto_assigned BOOLEAN DEFAULT true,
    notes TEXT,
    UNIQUE(user_id, tier_id)
);

-- Commission Calculations History
CREATE TABLE commission_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    project_id UUID REFERENCES projects(id),
    base_amount DECIMAL(12,2) NOT NULL, -- ARS
    calculated_commission DECIMAL(12,2) NOT NULL, -- ARS
    effective_rate DECIMAL(7,4) NOT NULL, -- Final percentage applied
    applied_rules JSONB NOT NULL, -- Array of rule IDs and calculations
    rule_details JSONB NOT NULL, -- Detailed breakdown of calculations
    user_tier VARCHAR(50),
    transaction_metadata JSONB DEFAULT '{}',
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Promotional Campaigns
CREATE TABLE promotional_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    campaign_type VARCHAR(50) NOT NULL, -- 'new_user', 'volume_bonus', 'referral'
    discount_type VARCHAR(20) NOT NULL, -- 'percentage', 'fixed', 'tiered'
    discount_value DECIMAL(7,4) NOT NULL,
    max_discount_amount DECIMAL(12,2),
    eligibility_criteria JSONB NOT NULL,
    usage_limits JSONB DEFAULT '{}', -- per user, total, etc.
    valid_from TIMESTAMP NOT NULL,
    valid_to TIMESTAMP NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    total_discount_given DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Commission Rate Overrides (for special cases)
CREATE TABLE commission_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    project_id UUID REFERENCES projects(id),
    override_type VARCHAR(50) NOT NULL, -- 'user_specific', 'project_specific', 'temporary'
    commission_rate DECIMAL(7,4) NOT NULL,
    fixed_fee DECIMAL(12,2),
    reason TEXT NOT NULL,
    approved_by UUID NOT NULL REFERENCES users(id),
    valid_from TIMESTAMP NOT NULL,
    valid_to TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Commission Engine Implementation

### Core Commission Service

```typescript
// src/commission/commission.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class CommissionService implements CommissionEngine {
  private readonly logger = new Logger(CommissionService.name);

  constructor(
    @InjectRepository(CommissionRule)
    private ruleRepository: Repository<CommissionRule>,
    @InjectRepository(UserTierAssignment)
    private tierRepository: Repository<UserTierAssignment>,
    @InjectRepository(CommissionCalculation)
    private calculationRepository: Repository<CommissionCalculation>,
    @InjectRepository(PromotionalCampaign)
    private campaignRepository: Repository<PromotionalCampaign>,
    private userService: UserService,
    private analyticsService: AnalyticsService
  ) {}

  async calculateCommission(transaction: TransactionRequest): Promise<CommissionResult> {
    this.logger.log(`Calculating commission for transaction: ${transaction.id}`);

    try {
      // 1. Get user context and tier
      const userContext = await this.getUserContext(transaction.userId);
      
      // 2. Get applicable rules
      const applicableRules = await this.getApplicableRules(transaction, userContext);
      
      // 3. Apply rules in priority order
      const calculation = await this.applyCommissionRules(
        transaction,
        userContext,
        applicableRules
      );

      // 4. Apply promotional campaigns
      const finalCalculation = await this.applyPromotionalDiscounts(
        calculation,
        transaction,
        userContext
      );

      // 5. Validate and enforce limits
      const validatedCalculation = this.validateAndEnforceLimits(finalCalculation);

      // 6. Store calculation for audit trail
      await this.storeCalculation(transaction, validatedCalculation);

      return validatedCalculation;
    } catch (error) {
      this.logger.error(`Commission calculation failed:`, error);
      
      // Fallback to default commission
      return this.getDefaultCommission(transaction);
    }
  }

  private async getUserContext(userId: string): Promise<UserContext> {
    const user = await this.userService.findById(userId);
    const tier = await this.tierRepository.findOne({
      where: { userId, expiresAt: null },
      relations: ['tier']
    });

    const monthlyStats = await this.analyticsService.getUserMonthlyStats(userId);
    
    return {
      user,
      tier: tier?.tier,
      monthlyVolume: monthlyStats.volume,
      completedProjects: monthlyStats.completedProjects,
      rating: user.rating,
      disputeRate: monthlyStats.disputeRate,
      registrationDate: user.createdAt,
      lastActivityDate: user.lastActiveAt,
      paymentMethods: await this.getUserPaymentMethods(userId),
      location: user.location
    };
  }

  private async getApplicableRules(
    transaction: TransactionRequest,
    userContext: UserContext
  ): Promise<CommissionRule[]> {
    const now = new Date();
    
    const rules = await this.ruleRepository.find({
      where: {
        isActive: true,
        validFrom: { $lte: now },
        $or: [
          { validTo: null },
          { validTo: { $gte: now } }
        ]
      },
      order: { priority: 'ASC' }
    });

    // Filter rules based on conditions
    const applicableRules = [];
    
    for (const rule of rules) {
      if (await this.evaluateRuleConditions(rule, transaction, userContext)) {
        applicableRules.push(rule);
      }
    }

    return applicableRules;
  }

  private async evaluateRuleConditions(
    rule: CommissionRule,
    transaction: TransactionRequest,
    userContext: UserContext
  ): Promise<boolean> {
    for (const condition of rule.conditions) {
      if (!await this.evaluateCondition(condition, transaction, userContext)) {
        return false;
      }
    }
    return true;
  }

  private async evaluateCondition(
    condition: RuleCondition,
    transaction: TransactionRequest,
    userContext: UserContext
  ): Promise<boolean> {
    let fieldValue: any;

    // Get field value based on condition type
    switch (condition.type) {
      case ConditionType.USER_TIER:
        fieldValue = userContext.tier?.tierName;
        break;
      case ConditionType.TRANSACTION_AMOUNT:
        fieldValue = transaction.amount;
        break;
      case ConditionType.MONTHLY_VOLUME:
        fieldValue = userContext.monthlyVolume;
        break;
      case ConditionType.USER_RATING:
        fieldValue = userContext.rating;
        break;
      case ConditionType.PROJECT_CATEGORY:
        fieldValue = transaction.projectCategory;
        break;
      case ConditionType.PAYMENT_METHOD:
        fieldValue = transaction.paymentMethod;
        break;
      case ConditionType.TIME_OF_DAY:
        fieldValue = new Date().getHours();
        break;
      case ConditionType.DAY_OF_WEEK:
        fieldValue = new Date().getDay();
        break;
      case ConditionType.GEOGRAPHIC_REGION:
        fieldValue = userContext.location?.region;
        break;
      default:
        return false;
    }

    // Apply comparison operator
    return this.compareValues(fieldValue, condition.operator, condition.value);
  }

  private compareValues(fieldValue: any, operator: ComparisonOperator, conditionValue: any): boolean {
    switch (operator) {
      case 'equals':
        return fieldValue === conditionValue;
      case 'not_equals':
        return fieldValue !== conditionValue;
      case 'greater_than':
        return Number(fieldValue) > Number(conditionValue);
      case 'greater_than_or_equal':
        return Number(fieldValue) >= Number(conditionValue);
      case 'less_than':
        return Number(fieldValue) < Number(conditionValue);
      case 'less_than_or_equal':
        return Number(fieldValue) <= Number(conditionValue);
      case 'in':
        return Array.isArray(conditionValue) && conditionValue.includes(fieldValue);
      case 'not_in':
        return Array.isArray(conditionValue) && !conditionValue.includes(fieldValue);
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(conditionValue).toLowerCase());
      default:
        return false;
    }
  }

  private async applyCommissionRules(
    transaction: TransactionRequest,
    userContext: UserContext,
    rules: CommissionRule[]
  ): Promise<CommissionCalculation> {
    // Start with base commission from user tier
    let baseCommission = userContext.tier?.baseCommissionRate || 0.05; // 5% default
    let totalCommission = transaction.amount * baseCommission;
    
    const appliedRules: AppliedRule[] = [{
      ruleId: 'base_tier',
      ruleName: `Base ${userContext.tier?.tierName || 'default'} commission`,
      type: 'base_commission',
      originalAmount: totalCommission,
      adjustment: 0,
      finalAmount: totalCommission,
      rate: baseCommission
    }];

    // Apply each rule in order
    for (const rule of rules) {
      for (const action of rule.actions) {
        const adjustment = this.calculateRuleAdjustment(
          action,
          transaction.amount,
          totalCommission,
          baseCommission
        );

        const previousAmount = totalCommission;
        totalCommission = this.applyAdjustment(totalCommission, action, adjustment);

        appliedRules.push({
          ruleId: rule.id,
          ruleName: rule.name,
          type: action.type,
          originalAmount: previousAmount,
          adjustment: totalCommission - previousAmount,
          finalAmount: totalCommission,
          rate: totalCommission / transaction.amount
        });
      }
    }

    return {
      transactionId: transaction.id,
      baseAmount: transaction.amount,
      baseCommission,
      calculatedCommission: totalCommission,
      effectiveRate: totalCommission / transaction.amount,
      appliedRules,
      userTier: userContext.tier?.tierName,
      calculatedAt: new Date()
    };
  }

  private calculateRuleAdjustment(
    action: RuleAction,
    transactionAmount: number,
    currentCommission: number,
    baseRate: number
  ): number {
    switch (action.operation) {
      case 'set':
        return action.value;
      case 'add':
        return action.value;
      case 'subtract':
        return -action.value;
      case 'multiply':
        return currentCommission * (action.value - 1);
      case 'percentage':
        return transactionAmount * (action.value / 100);
      default:
        return 0;
    }
  }

  private applyAdjustment(
    currentCommission: number,
    action: RuleAction,
    adjustment: number
  ): number {
    let newCommission: number;

    switch (action.operation) {
      case 'set':
        newCommission = adjustment;
        break;
      case 'percentage':
        newCommission = adjustment;
        break;
      default:
        newCommission = currentCommission + adjustment;
    }

    // Apply caps and floors
    if (action.cap !== undefined) {
      newCommission = Math.min(newCommission, action.cap);
    }
    if (action.floor !== undefined) {
      newCommission = Math.max(newCommission, action.floor);
    }

    return Math.max(0, newCommission); // Never negative
  }

  private async applyPromotionalDiscounts(
    calculation: CommissionCalculation,
    transaction: TransactionRequest,
    userContext: UserContext
  ): Promise<CommissionCalculation> {
    const activeCampaigns = await this.getActiveCampaigns(userContext);
    
    let bestDiscount = 0;
    let appliedCampaign: PromotionalCampaign | null = null;

    for (const campaign of activeCampaigns) {
      const discount = this.calculateCampaignDiscount(
        campaign,
        calculation.calculatedCommission,
        transaction,
        userContext
      );

      if (discount > bestDiscount) {
        bestDiscount = discount;
        appliedCampaign = campaign;
      }
    }

    if (appliedCampaign && bestDiscount > 0) {
      const discountedCommission = calculation.calculatedCommission - bestDiscount;
      
      calculation.appliedRules.push({
        ruleId: appliedCampaign.id,
        ruleName: `Promoción: ${appliedCampaign.name}`,
        type: 'promotional_discount',
        originalAmount: calculation.calculatedCommission,
        adjustment: -bestDiscount,
        finalAmount: discountedCommission,
        rate: discountedCommission / calculation.baseAmount
      });

      calculation.calculatedCommission = discountedCommission;
      calculation.effectiveRate = discountedCommission / calculation.baseAmount;
      calculation.promotionalCampaign = appliedCampaign;
      
      // Update campaign usage
      await this.updateCampaignUsage(appliedCampaign.id, bestDiscount);
    }

    return calculation;
  }

  private validateAndEnforceLimits(calculation: CommissionCalculation): CommissionResult {
    // Enforce minimum and maximum commission limits
    const MIN_COMMISSION = 1; // ARS 1 minimum
    const MAX_COMMISSION_RATE = 0.15; // 15% maximum
    
    let finalCommission = calculation.calculatedCommission;
    
    // Apply minimum
    if (finalCommission < MIN_COMMISSION) {
      finalCommission = MIN_COMMISSION;
    }
    
    // Apply maximum rate
    const maxCommission = calculation.baseAmount * MAX_COMMISSION_RATE;
    if (finalCommission > maxCommission) {
      finalCommission = maxCommission;
    }

    return {
      ...calculation,
      calculatedCommission: finalCommission,
      effectiveRate: finalCommission / calculation.baseAmount,
      limitEnforced: finalCommission !== calculation.calculatedCommission
    };
  }

  private async storeCalculation(
    transaction: TransactionRequest,
    result: CommissionResult
  ): Promise<void> {
    const calculation = this.calculationRepository.create({
      transactionId: transaction.id,
      userId: transaction.userId,
      projectId: transaction.projectId,
      baseAmount: result.baseAmount,
      calculatedCommission: result.calculatedCommission,
      effectiveRate: result.effectiveRate,
      appliedRules: result.appliedRules,
      ruleDetails: {
        originalCalculation: result,
        limitEnforced: result.limitEnforced,
        promotionalCampaign: result.promotionalCampaign?.id
      },
      userTier: result.userTier,
      transactionMetadata: {
        paymentMethod: transaction.paymentMethod,
        projectCategory: transaction.projectCategory,
        calculatedAt: result.calculatedAt
      }
    });

    await this.calculationRepository.save(calculation);
  }

  private getDefaultCommission(transaction: TransactionRequest): CommissionResult {
    const defaultRate = 0.05; // 5% fallback
    const commission = transaction.amount * defaultRate;
    
    return {
      transactionId: transaction.id,
      baseAmount: transaction.amount,
      baseCommission: defaultRate,
      calculatedCommission: commission,
      effectiveRate: defaultRate,
      appliedRules: [{
        ruleId: 'fallback',
        ruleName: 'Default fallback commission',
        type: 'base_commission',
        originalAmount: commission,
        adjustment: 0,
        finalAmount: commission,
        rate: defaultRate
      }],
      userTier: 'default',
      calculatedAt: new Date(),
      limitEnforced: false,
      fallbackUsed: true
    };
  }
}
```

### Tier Management Service

```typescript
// src/commission/tier-management.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class TierManagementService {
  private readonly logger = new Logger(TierManagementService.name);

  constructor(
    @InjectRepository(UserTierAssignment)
    private tierAssignmentRepository: Repository<UserTierAssignment>,
    @InjectRepository(UserTier)
    private tierRepository: Repository<UserTier>,
    private analyticsService: AnalyticsService,
    private notificationService: NotificationService
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async updateUserTiers(): Promise<void> {
    this.logger.log('Starting daily tier recalculation');

    const users = await this.getAllActiveUsers();
    const tiers = await this.tierRepository.find({ where: { isActive: true } });

    let updatedCount = 0;
    let upgradedCount = 0;
    let downgradedCount = 0;

    for (const user of users) {
      try {
        const userStats = await this.calculateUserStats(user.id);
        const newTier = this.calculateOptimalTier(userStats, tiers);
        const currentAssignment = await this.getCurrentTierAssignment(user.id);

        if (!currentAssignment || currentAssignment.tierId !== newTier.id) {
          await this.updateUserTier(user.id, newTier, userStats, currentAssignment);
          updatedCount++;

          if (currentAssignment && this.getTierLevel(newTier) > this.getTierLevel(currentAssignment.tier)) {
            upgradedCount++;
            await this.notificationService.sendTierUpgradeNotification(user.id, newTier);
          } else if (currentAssignment && this.getTierLevel(newTier) < this.getTierLevel(currentAssignment.tier)) {
            downgradedCount++;
            await this.notificationService.sendTierDowngradeNotification(user.id, newTier);
          }
        }
      } catch (error) {
        this.logger.error(`Failed to update tier for user ${user.id}:`, error);
      }
    }

    this.logger.log(`Tier recalculation complete: ${updatedCount} updated, ${upgradedCount} upgraded, ${downgradedCount} downgraded`);
  }

  private async calculateUserStats(userId: string): Promise<UserStats> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    return {
      monthlyVolume: await this.analyticsService.getUserVolume(userId, thirtyDaysAgo),
      quarterlyVolume: await this.analyticsService.getUserVolume(userId, ninetyDaysAgo),
      completedProjects: await this.analyticsService.getCompletedProjects(userId, thirtyDaysAgo),
      averageRating: await this.analyticsService.getAverageRating(userId),
      disputeRate: await this.analyticsService.getDisputeRate(userId, ninetyDaysAgo),
      responseTime: await this.analyticsService.getAverageResponseTime(userId),
      completionRate: await this.analyticsService.getProjectCompletionRate(userId),
      repeatClientRate: await this.analyticsService.getRepeatClientRate(userId)
    };
  }

  private calculateOptimalTier(userStats: UserStats, tiers: UserTier[]): UserTier {
    // Sort tiers by requirements (ascending)
    const sortedTiers = tiers.sort((a, b) => a.minMonthlyVolume - b.minMonthlyVolume);
    
    let optimalTier = sortedTiers[0]; // Default to lowest tier

    for (const tier of sortedTiers) {
      const meetsVolumeReq = userStats.monthlyVolume >= tier.minMonthlyVolume;
      const meetsProjectReq = userStats.completedProjects >= tier.minCompletedProjects;
      const meetsRatingReq = userStats.averageRating >= tier.minRating;
      const meetsDisputeReq = userStats.disputeRate <= tier.maxDisputeRate;

      if (meetsVolumeReq && meetsProjectReq && meetsRatingReq && meetsDisputeReq) {
        optimalTier = tier;
      }
    }

    return optimalTier;
  }

  private async updateUserTier(
    userId: string,
    newTier: UserTier,
    userStats: UserStats,
    currentAssignment?: UserTierAssignment
  ): Promise<void> {
    // Deactivate current assignment
    if (currentAssignment) {
      currentAssignment.expiresAt = new Date();
      await this.tierAssignmentRepository.save(currentAssignment);
    }

    // Create new assignment
    const newAssignment = this.tierAssignmentRepository.create({
      userId,
      tierId: newTier.id,
      monthlyVolume: userStats.monthlyVolume,
      completedProjects: userStats.completedProjects,
      currentRating: userStats.averageRating,
      disputeRate: userStats.disputeRate,
      autoAssigned: true,
      notes: `Auto-assigned based on performance: Volume ARS ${userStats.monthlyVolume.toFixed(2)}, Projects: ${userStats.completedProjects}, Rating: ${userStats.averageRating.toFixed(2)}`
    });

    await this.tierAssignmentRepository.save(newAssignment);
  }

  async getTierBenefits(userId: string): Promise<TierBenefits> {
    const assignment = await this.getCurrentTierAssignment(userId);
    
    if (!assignment) {
      return this.getDefaultTierBenefits();
    }

    const tier = assignment.tier;
    
    return {
      tierName: tier.tierName,
      commissionRate: tier.baseCommissionRate,
      benefits: tier.benefits,
      requirements: tier.requirements,
      nextTier: await this.getNextTier(tier),
      progressToNextTier: await this.calculateProgressToNextTier(userId, tier)
    };
  }

  private async calculateProgressToNextTier(userId: string, currentTier: UserTier): Promise<TierProgress | null> {
    const nextTier = await this.getNextTier(currentTier);
    
    if (!nextTier) return null;

    const userStats = await this.calculateUserStats(userId);
    
    return {
      volumeProgress: Math.min(userStats.monthlyVolume / nextTier.minMonthlyVolume, 1),
      projectsProgress: Math.min(userStats.completedProjects / nextTier.minCompletedProjects, 1),
      ratingProgress: Math.min(userStats.averageRating / nextTier.minRating, 1),
      disputeProgress: userStats.disputeRate <= nextTier.maxDisputeRate ? 1 : nextTier.maxDisputeRate / userStats.disputeRate,
      estimatedTimeToUpgrade: this.estimateTimeToUpgrade(userStats, nextTier)
    };
  }
}
```

## API Implementation

### Commission API Controller

```typescript
// src/commission/commission.controller.ts
import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard, AdminGuard } from '../auth/guards';

@ApiTags('Commission System')
@Controller('api/commission')
@UseGuards(JwtAuthGuard)
export class CommissionController {
  constructor(
    private readonly commissionService: CommissionService,
    private readonly tierManagementService: TierManagementService,
    private readonly campaignService: CampaignService
  ) {}

  @Post('calculate')
  @ApiOperation({ summary: 'Calculate commission for transaction' })
  @ApiResponse({ status: 200, description: 'Commission calculated successfully' })
  async calculateCommission(@Body() calculateDto: CalculateCommissionDto) {
    const result = await this.commissionService.calculateCommission(calculateDto);
    
    return {
      transactionId: result.transactionId,
      baseAmount: result.baseAmount,
      calculatedCommission: result.calculatedCommission,
      effectiveRate: (result.effectiveRate * 100).toFixed(2) + '%',
      breakdown: result.appliedRules.map(rule => ({
        ruleName: rule.ruleName,
        type: rule.type,
        adjustment: rule.adjustment,
        adjustmentPercent: ((rule.adjustment / result.baseAmount) * 100).toFixed(2) + '%'
      })),
      userTier: result.userTier,
      savings: result.promotionalCampaign
        ? `ARS ${result.appliedRules.find(r => r.type === 'promotional_discount')?.adjustment || 0}`
        : null
    };
  }

  @Get('tiers/my-benefits')
  @ApiOperation({ summary: 'Get current user tier benefits' })
  async getMyTierBenefits(@Request() req) {
    const benefits = await this.tierManagementService.getTierBenefits(req.user.id);
    
    return {
      currentTier: {
        name: benefits.tierName,
        commissionRate: (benefits.commissionRate * 100).toFixed(2) + '%',
        benefits: benefits.benefits,
        monthlyVolumeDiscount: benefits.benefits.monthlyVolumeDiscount || 0
      },
      nextTier: benefits.nextTier ? {
        name: benefits.nextTier.tierName,
        commissionRate: (benefits.nextTier.baseCommissionRate * 100).toFixed(2) + '%',
        requirements: benefits.nextTier.requirements
      } : null,
      progress: benefits.progressToNextTier
    };
  }

  @Get('history')
  @ApiOperation({ summary: 'Get commission calculation history' })
  async getCommissionHistory(
    @Request() req,
    @Query() query: CommissionHistoryQueryDto
  ) {
    const history = await this.commissionService.getUserCommissionHistory(
      req.user.id,
      query
    );
    
    return {
      transactions: history.transactions.map(calc => ({
        transactionId: calc.transactionId,
        date: calc.calculatedAt,
        baseAmount: calc.baseAmount,
        commission: calc.calculatedCommission,
        effectiveRate: (calc.effectiveRate * 100).toFixed(2) + '%',
        tier: calc.userTier,
        rulesApplied: calc.appliedRules.length,
        savings: calc.appliedRules
          .filter(r => r.adjustment < 0)
          .reduce((sum, r) => sum + Math.abs(r.adjustment), 0)
      })),
      summary: {
        totalTransactions: history.summary.totalTransactions,
        totalCommissionPaid: history.summary.totalCommissionPaid,
        averageRate: (history.summary.averageRate * 100).toFixed(2) + '%',
        totalSavings: history.summary.totalSavings
      }
    };
  }

  @Get('campaigns/active')
  @ApiOperation({ summary: 'Get active promotional campaigns' })
  async getActiveCampaigns(@Request() req) {
    const campaigns = await this.campaignService.getActiveCampaignsForUser(req.user.id);
    
    return {
      campaigns: campaigns.map(campaign => ({
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
        discountType: campaign.discountType,
        discountValue: campaign.discountType === 'percentage' 
          ? (campaign.discountValue * 100).toFixed(1) + '%'
          : `ARS ${campaign.discountValue}`,
        validUntil: campaign.validTo,
        estimatedSavings: this.calculateEstimatedSavings(campaign, req.user.monthlyVolume)
      }))
    };
  }

  // Admin endpoints
  @Post('rules')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Create new commission rule' })
  async createCommissionRule(@Body() ruleDto: CreateCommissionRuleDto) {
    return this.commissionService.createRule(ruleDto);
  }

  @Put('rules/:ruleId')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Update commission rule' })
  async updateCommissionRule(
    @Param('ruleId') ruleId: string,
    @Body() updateDto: UpdateCommissionRuleDto
  ) {
    return this.commissionService.updateRule(ruleId, updateDto);
  }

  @Post('campaigns')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Create promotional campaign' })
  async createCampaign(@Body() campaignDto: CreateCampaignDto) {
    return this.campaignService.createCampaign(campaignDto);
  }

  @Get('analytics/revenue')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get commission revenue analytics' })
  async getRevenueAnalytics(@Query() query: AnalyticsQueryDto) {
    return this.commissionService.getRevenueAnalytics(query);
  }

  @Get('analytics/tier-distribution')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get user tier distribution' })
  async getTierDistribution() {
    return this.tierManagementService.getTierDistribution();
  }
}
```

## Frontend Components

### Commission Calculator Component

```typescript
// frontend/components/commission/CommissionCalculator.tsx
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Calculator, TrendingDown, Award, Info } from 'lucide-react';

interface CommissionCalculatorProps {
  userTier?: string;
  onCalculate?: (result: CommissionCalculation) => void;
}

export default function CommissionCalculator({ userTier, onCalculate }: CommissionCalculatorProps) {
  const [amount, setAmount] = useState<string>('');
  const [calculation, setCalculation] = useState<CommissionCalculation | null>(null);
  const [loading, setLoading] = useState(false);

  const calculateCommission = async () => {
    if (!amount || Number(amount) <= 0) return;

    setLoading(true);
    try {
      const response = await fetch('/api/commission/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(amount),
          currency: 'ARS',
          type: 'project_payment',
          userId: 'current-user' // This would come from auth context
        })
      });

      const result = await response.json();
      setCalculation(result);
      onCalculate?.(result);
    } catch (error) {
      console.error('Error calculating commission:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(value);
  };

  const getProgressColor = (type: string) => {
    switch (type) {
      case 'base_commission':
        return 'bg-blue-500';
      case 'promotional_discount':
        return 'bg-green-500';
      case 'tier_discount':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Calculadora de Comisiones
        </CardTitle>
        {userTier && (
          <Badge className="w-fit">
            <Award className="h-3 w-3 mr-1" />
            Tier {userTier}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="amount">Monto del Proyecto (ARS)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="10000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-lg"
            />
          </div>

          <Button 
            onClick={calculateCommission}
            disabled={!amount || loading}
            size="lg"
            className="w-full"
          >
            {loading ? 'Calculando...' : 'Calcular Comisión'}
          </Button>
        </div>

        {calculation && (
          <div className="space-y-4">
            <Separator />
            
            {/* Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Monto Base</p>
                <p className="text-2xl font-bold">{formatCurrency(calculation.baseAmount)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Comisión LaburAR</p>
                <p className="text-2xl font-bold text-red-600">
                  -{formatCurrency(calculation.calculatedCommission)}
                </p>
                <p className="text-sm text-gray-500">({calculation.effectiveRate})</p>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-green-800">Recibirás:</span>
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(calculation.baseAmount - calculation.calculatedCommission)}
                </span>
              </div>
            </div>

            {/* Breakdown */}
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Info className="h-4 w-4" />
                Desglose de la Comisión
              </h4>
              
              {calculation.breakdown.map((rule, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getProgressColor(rule.type)}`} />
                    <div>
                      <p className="font-medium">{rule.ruleName}</p>
                      <p className="text-sm text-gray-600">{rule.adjustmentPercent}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${rule.adjustment < 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {rule.adjustment < 0 ? '' : '+'}
                      {formatCurrency(rule.adjustment)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Savings */}
            {calculation.savings && Number(calculation.savings.replace(/[^0-9.-]+/g, '')) > 0 && (
              <div className="bg-green-100 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <TrendingDown className="h-4 w-4" />
                  <span className="font-semibold">
                    ¡Ahorraste {calculation.savings} en comisiones!
                  </span>
                </div>
              </div>
            )}

            {/* Tier Information */}
            {calculation.userTier && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-800 font-medium">
                  Como usuario {calculation.userTier}, disfrutas de tarifas preferenciales.
                </p>
                <p className="text-blue-600 text-sm mt-1">
                  Continúa usando la plataforma para mantener o mejorar tu tier.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### Tier Progress Component

```typescript
// frontend/components/commission/TierProgress.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Award, TrendingUp, Target, Calendar } from 'lucide-react';

interface TierProgressProps {
  userId?: string;
}

export default function TierProgress({ userId }: TierProgressProps) {
  const [tierData, setTierData] = useState<TierBenefits | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTierData();
  }, [userId]);

  const fetchTierData = async () => {
    try {
      const response = await fetch('/api/commission/tiers/my-benefits');
      const data = await response.json();
      setTierData(data);
    } catch (error) {
      console.error('Error fetching tier data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatProgressPercentage = (progress: number) => {
    return Math.min(progress * 100, 100);
  };

  const getTierColor = (tierName: string) => {
    switch (tierName.toLowerCase()) {
      case 'starter':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'professional':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'enterprise':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'elite':
        return 'bg-gold-100 text-gold-800 border-gold-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Cargando información de tier...</div>;
  }

  if (!tierData) {
    return <div className="text-center p-8 text-gray-500">No se pudo cargar la información del tier</div>;
  }

  return (
    <div className="space-y-6">
      {/* Current Tier */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Tu Tier Actual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <Badge className={`text-lg px-4 py-2 ${getTierColor(tierData.currentTier.name)}`}>
              {tierData.currentTier.name}
            </Badge>
            <div className="text-right">
              <p className="text-sm text-gray-600">Comisión actual</p>
              <p className="text-2xl font-bold text-green-600">{tierData.currentTier.commissionRate}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">Beneficios actuales:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(tierData.currentTier.benefits).map(([key, value]) => (
                <div key={key} className="flex justify-between p-2 bg-gray-50 rounded">
                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}:</span>
                  <span className="font-semibold">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Tier Progress */}
      {tierData.nextTier && tierData.progress && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Progreso al Siguiente Tier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Próximo tier: {tierData.nextTier.name}</span>
                <Badge variant="outline">{tierData.nextTier.commissionRate}</Badge>
              </div>

              <div className="space-y-4">
                {/* Volume Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Volumen mensual</span>
                    <span>{formatProgressPercentage(tierData.progress.volumeProgress).toFixed(1)}%</span>
                  </div>
                  <Progress value={formatProgressPercentage(tierData.progress.volumeProgress)} className="h-2" />
                </div>

                {/* Projects Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Proyectos completados</span>
                    <span>{formatProgressPercentage(tierData.progress.projectsProgress).toFixed(1)}%</span>
                  </div>
                  <Progress value={formatProgressPercentage(tierData.progress.projectsProgress)} className="h-2" />
                </div>

                {/* Rating Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Calificación promedio</span>
                    <span>{formatProgressPercentage(tierData.progress.ratingProgress).toFixed(1)}%</span>
                  </div>
                  <Progress value={formatProgressPercentage(tierData.progress.ratingProgress)} className="h-2" />
                </div>

                {/* Dispute Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Tasa de disputas (objetivo: bajo)</span>
                    <span>{formatProgressPercentage(tierData.progress.disputeProgress).toFixed(1)}%</span>
                  </div>
                  <Progress value={formatProgressPercentage(tierData.progress.disputeProgress)} className="h-2" />
                </div>
              </div>

              {tierData.progress.estimatedTimeToUpgrade && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Calendar className="h-4 w-4" />
                    <span className="font-semibold">
                      Tiempo estimado para upgrade: {tierData.progress.estimatedTimeToUpgrade}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <h5 className="font-semibold">Requisitos para {tierData.nextTier.name}:</h5>
                {Object.entries(tierData.nextTier.requirements).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}:</span>
                    <span>{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips for Advancement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Consejos para Avanzar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-green-800 font-medium">✓ Completa más proyectos</p>
              <p className="text-green-600 text-sm">
                Aumenta tu volumen mensual y experiencia completando más trabajos.
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-blue-800 font-medium">✓ Mantén alta calificación</p>
              <p className="text-blue-600 text-sm">
                Entrega trabajos de calidad y mantén buena comunicación con clientes.
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <p className="text-purple-800 font-medium">✓ Evita disputas</p>
              <p className="text-purple-600 text-sm">
                Comunícate claramente y cumple con los acuerdos establecidos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

## Argentina-Specific Features

### Tax Integration for Dynamic Fees

```typescript
// src/tax/dynamic-fee-tax.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class DynamicFeeTaxService {
  async processCommissionTaxReporting(
    calculation: CommissionCalculation,
    user: User
  ): Promise<void> {
    // Calculate tax implications of dynamic commission structure
    const taxableAmount = calculation.calculatedCommission;
    const effectiveRate = calculation.effectiveRate;

    // AFIP reporting for commission income
    const afipData = {
      periodo: new Date().toISOString().slice(0, 7).replace('-', ''),
      cuit_plataforma: process.env.LABURAR_CUIT,
      cuit_freelancer: user.cuit,
      importe_comision: taxableAmount,
      tasa_aplicada: effectiveRate,
      descuentos_aplicados: this.calculateTotalDiscounts(calculation),
      tier_usuario: calculation.userTier,
      reglas_aplicadas: calculation.appliedRules.map(rule => ({
        id: rule.ruleId,
        nombre: rule.ruleName,
        ajuste: rule.adjustment
      }))
    };

    await this.submitCommissionToAFIP(afipData);
  }

  async generateCommissionInvoice(
    calculation: CommissionCalculation,
    user: User
  ): Promise<AFIPInvoice> {
    // Generate AFIP-compliant invoice for commission
    const invoiceData = {
      tipo_cbte: 11, // Factura C
      punto_vta: process.env.AFIP_PUNTO_VENTA,
      cbt_desde: await this.getNextInvoiceNumber(),
      cbt_hasta: await this.getNextInvoiceNumber(),
      imp_total: calculation.calculatedCommission,
      imp_neto: calculation.calculatedCommission / 1.21,
      imp_iva: calculation.calculatedCommission - (calculation.calculatedCommission / 1.21),
      fecha_cbte: new Date().toISOString().split('T')[0].replace(/-/g, ''),
      doc_tipo: 80, // CUIT
      doc_nro: user.cuit,
      concepto: 'Comisión por servicio de intermediación - LaburAR',
      observaciones: `Tier: ${calculation.userTier}, Tasa efectiva: ${(calculation.effectiveRate * 100).toFixed(2)}%`
    };

    return this.afipService.generateInvoice(invoiceData);
  }
}
```

### Inflation-Adjusted Commission Caps

```typescript
// src/commission/inflation-adjustment.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class InflationAdjustmentService {
  async adjustCommissionCapsForInflation(): Promise<void> {
    // Get current inflation rate from INDEC
    const inflationRate = await this.getMonthlyInflationRate();
    
    if (inflationRate > 2) { // If monthly inflation > 2%
      // Adjust commission caps and minimum fees
      const rules = await this.commissionService.getActiveRules();
      
      for (const rule of rules) {
        if (rule.actions.some(action => action.cap || action.floor)) {
          const adjustedRule = this.applyInflationAdjustment(rule, inflationRate);
          await this.commissionService.updateRule(rule.id, adjustedRule);
        }
      }

      // Update tier requirements
      await this.adjustTierRequirementsForInflation(inflationRate);
    }
  }

  private async getMonthlyInflationRate(): Promise<number> {
    // Integration with INDEC API for official inflation data
    try {
      const response = await this.httpService.axiosRef.get(
        'https://api.bcra.gob.ar/estadisticas/v2.0/datosvariable/31/2023-01-01/2023-12-31'
      );
      
      const latestData = response.data.Results[response.data.Results.length - 1];
      return latestData.valor / 100; // Convert percentage to decimal
    } catch (error) {
      this.logger.warn('Failed to fetch inflation data, using fallback rate');
      return 0.03; // 3% fallback rate
    }
  }

  private applyInflationAdjustment(rule: CommissionRule, inflationRate: number): CommissionRule {
    const adjustmentFactor = 1 + inflationRate;
    
    const adjustedActions = rule.actions.map(action => ({
      ...action,
      cap: action.cap ? Math.round(action.cap * adjustmentFactor) : action.cap,
      floor: action.floor ? Math.round(action.floor * adjustmentFactor) : action.floor
    }));

    return {
      ...rule,
      actions: adjustedActions,
      metadata: {
        ...rule.metadata,
        lastInflationAdjustment: new Date().toISOString(),
        inflationRateApplied: inflationRate
      }
    };
  }
}
```

## Implementation Timeline

### Phase 1: Core System (8-10 weeks)
- [ ] Commission engine and rule system
- [ ] User tier management
- [ ] Basic API implementation
- [ ] Database schema and migrations

### Phase 2: Advanced Features (6-8 weeks) 
- [ ] Promotional campaigns system
- [ ] Frontend components and dashboard
- [ ] Advanced rule conditions and actions
- [ ] Real-time tier calculation

### Phase 3: Argentina-Specific Features (4-6 weeks)
- [ ] AFIP tax integration for dynamic fees
- [ ] Inflation adjustment system
- [ ] Argentine regulation compliance
- [ ] Local reporting requirements

### Phase 4: Optimization & Testing (4-6 weeks)
- [ ] Performance optimization
- [ ] Comprehensive testing
- [ ] Security audit
- [ ] Load testing and monitoring

## Security Considerations

### Financial Security
- All commission calculations audited and logged
- Rule changes require multi-level approval
- Fraud detection for unusual commission patterns
- Secure storage of financial data

### Data Protection
- Encryption of sensitive commission data
- Access controls for admin functions
- Audit trail for all rule changes
- Compliance with financial regulations

## Testing Strategy

### Unit Tests
```typescript
// tests/commission/commission.service.spec.ts
describe('CommissionService', () => {
  describe('calculateCommission', () => {
    it('should apply tier-based discount correctly', async () => {
      const transaction = {
        amount: 10000,
        userId: 'professional-user',
        currency: 'ARS'
      };

      const result = await commissionService.calculateCommission(transaction);
      
      expect(result.userTier).toBe('professional');
      expect(result.effectiveRate).toBeLessThan(0.05); // Less than 5% base rate
    });

    it('should apply promotional discounts', async () => {
      // Test promotional campaign application
    });

    it('should enforce minimum and maximum limits', async () => {
      // Test commission limits
    });
  });
});
```

### Integration Tests
```typescript
describe('Commission Flow Integration', () => {
  it('should handle tier upgrades correctly', async () => {
    // Test tier upgrade scenario and commission impact
  });

  it('should process bulk commission calculations', async () => {
    // Test performance with multiple simultaneous calculations
  });
});
```

## Performance Metrics & KPIs

### System Performance
- **Calculation Speed**: <200ms average per commission calculation
- **Rule Processing**: <50ms per rule evaluation
- **Tier Updates**: Complete daily recalculation in <30 minutes
- **API Response**: <100ms for commission queries

### Business Metrics
- **Revenue Optimization**: Track commission revenue vs user satisfaction
- **Tier Distribution**: Monitor user progression through tiers
- **Discount Utilization**: Track promotional campaign effectiveness
- **User Retention**: Measure impact of dynamic fees on user retention

### Argentina-Specific KPIs
- **Inflation Adjustment Accuracy**: Monthly adjustment within 0.5% of INDEC rate
- **Tax Compliance**: 100% accurate AFIP reporting of commission income
- **Local Currency Stability**: Commission calculations stable in ARS
- **Regulatory Compliance**: Full compliance with Argentine financial regulations

## Conclusion

The Dynamic Commission Structure system provides LaburAR with a sophisticated, fair, and profitable fee system that adapts to user behavior and market conditions. Key benefits include:

- **User Incentives**: Tier-based rewards encourage platform engagement
- **Revenue Optimization**: Dynamic pricing maximizes platform revenue
- **Market Competitiveness**: Promotional campaigns maintain competitive positioning
- **Regulatory Compliance**: Full integration with Argentine tax and financial systems
- **Transparency**: Clear communication of fee structure builds user trust

This system positions LaburAR to optimize revenue while maintaining user satisfaction and regulatory compliance in the Argentine market.