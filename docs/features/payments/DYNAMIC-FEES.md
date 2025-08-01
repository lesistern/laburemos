# Dynamic Commission Structure - LABUREMOS

## Executive Summary

The Dynamic Commission Structure system enables LABUREMOS to optimize revenue while providing competitive rates for users. This intelligent system adjusts fees based on user behavior, transaction volume, market conditions, and business objectives while maintaining transparency and compliance with Argentine regulations.

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

The Dynamic Commission Structure system provides LABUREMOS with a sophisticated, fair, and profitable fee system that adapts to user behavior and market conditions. Key benefits include:

- **User Incentives**: Tier-based rewards encourage platform engagement
- **Revenue Optimization**: Dynamic pricing maximizes platform revenue
- **Market Competitiveness**: Promotional campaigns maintain competitive positioning
- **Regulatory Compliance**: Full integration with Argentine tax and financial systems
- **Transparency**: Clear communication of fee structure builds user trust

This system positions LABUREMOS to optimize revenue while maintaining user satisfaction and regulatory compliance in the Argentine market.