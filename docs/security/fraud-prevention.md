# LABUREMOS - Sistema de Prevención de Fraude

## Introducción

Este documento detalla el sistema integral de prevención de fraude de LABUREMOS, diseñado específicamente para el mercado freelance argentino. Incluye detección basada en IA, patrones específicos de Argentina, monitoreo en tiempo real y respuestas automatizadas.

## 1. Sistema de Detección de Fraude con IA

### 1.1 Algoritmos de Machine Learning

```typescript
// Modelo de riesgo de fraude con scoring 0-100
interface FraudRiskModel {
  userId: number;
  riskScore: number; // 0-100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors: FraudFactor[];
  confidence: number; // 0-1
  timestamp: Date;
}

interface FraudFactor {
  category: 'BEHAVIORAL' | 'PAYMENT' | 'IDENTITY' | 'GEOLOCATION' | 'PATTERN';
  factor: string;
  weight: number; // 0-1
  severity: number; // 0-10
  description: string;
}
```

### 1.2 Modelos de Detección

#### Modelo de Comportamiento Anómalo
```sql
-- Detección de comportamientos inusuales
SELECT 
  u.id,
  u.email,
  CASE 
    WHEN COUNT(p.id) > 20 AND u.created_at > NOW() - INTERVAL '7 days' THEN 50
    WHEN AVG(p.budget) > u.hourly_rate * 100 THEN 30
    WHEN COUNT(DISTINCT p.client_id) > 15 AND u.created_at > NOW() - INTERVAL '30 days' THEN 40
    ELSE 0
  END as behavioral_risk_score
FROM users u
LEFT JOIN projects p ON u.id = p.freelancer_id
WHERE u.user_type = 'FREELANCER'
GROUP BY u.id;
```

#### Modelo de Velocidad de Transacciones
```typescript
interface TransactionVelocityModel {
  checkVelocityRisk(userId: number, amount: number): Promise<number> {
    const recentTransactions = await this.getRecentTransactions(userId, '24h');
    const weeklyTotal = await this.getWeeklyTransactions(userId);
    
    let risk = 0;
    
    // Más de 10 transacciones en 24h
    if (recentTransactions.length > 10) risk += 40;
    
    // Monto semanal > 500,000 ARS
    if (weeklyTotal > 500000) risk += 30;
    
    // Transacciones en horarios inusuales (2-6 AM)
    const nightTransactions = recentTransactions.filter(t => 
      t.createdAt.getHours() >= 2 && t.createdAt.getHours() <= 6
    );
    if (nightTransactions.length > 3) risk += 25;
    
    return Math.min(risk, 100);
  }
}
```

## 2. Patrones Específicos de Argentina

### 2.1 Detección de Patrones Económicos Locales

#### Inflación y Cotización USD
```typescript
interface ArgentinaEconomicContext {
  // Cotización del dólar blue vs oficial
  usdBlueRate: number;
  usdOfficialRate: number;
  inflationRate: number; // mensual
  
  // Patrones de fraude relacionados con la economía
  detectCurrencyManipulation(transactions: Transaction[]): FraudAlert[] {
    const alerts: FraudAlert[] = [];
    
    // Conversiones masivas antes de devaluaciones
    const usdConversions = transactions.filter(t => 
      t.currency === 'USD' && t.amount > 10000
    );
    
    if (usdConversions.length > 5) {
      alerts.push({
        type: 'CURRENCY_MANIPULATION',
        severity: 'HIGH',
        description: 'Conversiones masivas a USD detectadas',
        riskIncrease: 40
      });
    }
    
    // Precios anormalmente bajos en ARS (posible lavado)
    const lowPriceProjects = transactions.filter(t => 
      t.currency === 'ARS' && t.amount < 1000 && t.type === 'PAYMENT'
    );
    
    if (lowPriceProjects.length > 10) {
      alerts.push({
        type: 'PRICE_MANIPULATION',
        severity: 'MEDIUM',
        description: 'Proyectos con precios anormalmente bajos',
        riskIncrease: 25
      });
    }
    
    return alerts;
  }
}
```

#### Patrones de Facturación Ficticia
```typescript
interface ArgentinaTaxPatterns {
  // Detección de monotributistas con facturación anormal
  detectAbnormalBilling(user: User, transactions: Transaction[]): number {
    let risk = 0;
    
    // Monotributista con ingresos > límite mensual
    if (user.taxCategory === 'MONOTRIBUTO') {
      const monthlyIncome = this.getMonthlyIncome(transactions);
      const limit = this.getMonotributoLimit(user.monotributoCategory);
      
      if (monthlyIncome > limit * 1.2) {
        risk += 35;
      }
    }
    
    // Facturación concentrada en pocos días del mes
    const dailyDistribution = this.getDailyIncomeDistribution(transactions);
    if (dailyDistribution.concentrationIndex > 0.8) {
      risk += 20;
    }
    
    // CUIT/CUIL inválido o duplicado
    if (!this.validateCUIT(user.dniCuit)) {
      risk += 30;
    }
    
    return risk;
  }
}
```

### 2.2 Detección Geográfica Argentina

```typescript
interface ArgentinaGeoFraud {
  // Provincias con mayor riesgo de fraude
  highRiskProvinces: string[] = ['FORMOSA', 'CHACO', 'SANTIAGO_DEL_ESTERO'];
  
  // Detección de ubicaciones inconsistentes
  detectLocationInconsistencies(user: User, sessions: UserSession[]): number {
    let risk = 0;
    
    // IP de diferentes provincias en corto tiempo
    const locations = sessions.map(s => this.getProvinceFromIP(s.ipAddress));
    const uniqueProvinces = [...new Set(locations)];
    
    if (uniqueProvinces.length > 3 && sessions.length < 20) {
      risk += 30;
    }
    
    // Usuario registrado en provincia de alto riesgo
    if (this.highRiskProvinces.includes(user.stateProvince)) {
      risk += 15;
    }
    
    // Horarios de conexión inconsistentes con zona horaria
    const argTimeZone = 'America/Argentina/Buenos_Aires';
    const suspiciousSessions = sessions.filter(s => {
      const localHour = new Date(s.createdAt).toLocaleString('en-US', {
        timeZone: argTimeZone,
        hour: 'numeric'
      });
      return parseInt(localHour) >= 2 && parseInt(localHour) <= 6;
    });
    
    if (suspiciousSessions.length > sessions.length * 0.4) {
      risk += 20;
    }
    
    return risk;
  }
}
```

## 3. Monitoreo en Tiempo Real

### 3.1 Sistema de Alertas en Tiempo Real

```typescript
@Injectable()
export class RealTimeFraudMonitor {
  constructor(
    private readonly redisService: RedisService,
    private readonly websocketGateway: WebSocketGateway,
    private readonly emailService: EmailService
  ) {}

  // Monitoreo de transacciones en tiempo real
  async monitorTransaction(transaction: Transaction): Promise<void> {
    const riskScore = await this.calculateRiskScore(transaction);
    
    if (riskScore >= 70) {
      await this.triggerFraudAlert({
        transactionId: transaction.id,
        userId: transaction.userId,
        riskScore,
        type: 'HIGH_RISK_TRANSACTION',
        timestamp: new Date()
      });
    }
    
    // Almacenar en Redis para análisis de patrones
    await this.redisService.set(
      `transaction_risk:${transaction.id}`,
      { riskScore, factors: this.getRiskFactors(transaction) },
      3600 // 1 hora
    );
  }

  // Análisis de comportamiento de usuario
  async analyzeUserBehavior(userId: number): Promise<BehaviorAnalysis> {
    const userSessions = await this.getUserSessions(userId, '24h');
    const recentTransactions = await this.getRecentTransactions(userId, '7d');
    
    const analysis: BehaviorAnalysis = {
      sessionPattern: this.analyzeSessionPattern(userSessions),
      transactionPattern: this.analyzeTransactionPattern(recentTransactions),
      geolocationRisk: this.analyzeGeolocation(userSessions),
      velocityRisk: this.analyzeVelocity(recentTransactions),
      overallRisk: 0
    };
    
    // Calcular riesgo general
    analysis.overallRisk = (
      analysis.sessionPattern.risk * 0.2 +
      analysis.transactionPattern.risk * 0.4 +
      analysis.geolocationRisk * 0.2 +
      analysis.velocityRisk * 0.2
    );
    
    return analysis;
  }
}
```

### 3.2 Sistema de Scoring Dinámico

```typescript
interface DynamicRiskScoring {
  // Factores de riesgo con pesos dinámicos
  riskFactors: {
    // Comportamiento del usuario (35%)
    newAccountActivity: { weight: 0.15, threshold: 7 }; // días
    velocityTransactions: { weight: 0.10, threshold: 10 }; // transac/día
    unusualHours: { weight: 0.10, threshold: 0.3 }; // ratio
    
    // Patrones de pago (30%)
    highValueTransactions: { weight: 0.15, threshold: 100000 }; // ARS
    currencyArbitrage: { weight: 0.10, threshold: 0.05 }; // diferencia %
    paymentMethodChanges: { weight: 0.05, threshold: 3 }; // cambios/mes
    
    // Identidad y verificación (20%)
    unverifiedIdentity: { weight: 0.10, threshold: 0 }; // boolean
    suspiciousDocuments: { weight: 0.05, threshold: 0 }; // boolean
    multipleAccounts: { weight: 0.05, threshold: 1 }; // cuentas
    
    // Geolocalización (15%)
    multipleLocations: { weight: 0.08, threshold: 3 }; // provincias
    vpnUsage: { weight: 0.04, threshold: 0 }; // boolean
    highRiskLocation: { weight: 0.03, threshold: 0 }; // boolean
  };

  calculateDynamicScore(user: User, context: FraudContext): number {
    let totalScore = 0;
    
    for (const [factor, config] of Object.entries(this.riskFactors)) {
      const value = this.extractValue(user, context, factor);
      const normalizedValue = this.normalizeValue(value, config.threshold);
      totalScore += normalizedValue * config.weight * 100;
    }
    
    // Ajuste por contexto económico argentino
    totalScore = this.applyArgentinaContext(totalScore, context);
    
    return Math.min(Math.max(totalScore, 0), 100);
  }
}
```

## 4. Respuestas Automatizadas

### 4.1 Sistema de Acciones Automáticas

```typescript
@Injectable()
export class AutomatedFraudResponse {
  
  async executeResponse(alert: FraudAlert): Promise<void> {
    const actions = this.determineActions(alert.riskScore, alert.type);
    
    for (const action of actions) {
      try {
        await this.executeAction(action, alert);
      } catch (error) {
        this.logger.error(`Failed to execute action ${action.type}:`, error);
      }
    }
  }

  private determineActions(riskScore: number, alertType: string): FraudAction[] {
    const actions: FraudAction[] = [];
    
    // Acciones basadas en nivel de riesgo
    if (riskScore >= 90) {
      // CRÍTICO - Congelamiento inmediato
      actions.push(
        { type: 'FREEZE_ACCOUNT', priority: 1, immediate: true },
        { type: 'BLOCK_TRANSACTIONS', priority: 1, immediate: true },
        { type: 'NOTIFY_ADMIN', priority: 1, immediate: true },
        { type: 'LOG_SECURITY_EVENT', priority: 1, immediate: true }
      );
    } else if (riskScore >= 70) {
      // ALTO - Revisión manual obligatoria
      actions.push(
        { type: 'REQUIRE_MANUAL_REVIEW', priority: 2, immediate: true },
        { type: 'LIMIT_TRANSACTION_AMOUNT', priority: 2, immediate: false },
        { type: 'REQUEST_ADDITIONAL_VERIFICATION', priority: 2, immediate: false },
        { type: 'NOTIFY_SECURITY_TEAM', priority: 2, immediate: true }
      );
    } else if (riskScore >= 50) {
      // MEDIO - Monitoreo intensivo
      actions.push(
        { type: 'INCREASE_MONITORING', priority: 3, immediate: false },
        { type: 'REQUIRE_2FA', priority: 3, immediate: false },
        { type: 'LIMIT_DAILY_TRANSACTIONS', priority: 3, immediate: false }
      );
    }
    
    // Acciones específicas por tipo de alerta
    switch (alertType) {
      case 'CURRENCY_MANIPULATION':
        actions.push({ type: 'FREEZE_USD_TRANSACTIONS', priority: 2, immediate: true });
        break;
      case 'IDENTITY_FRAUD':
        actions.push({ type: 'REQUIRE_IDENTITY_REVERIFICATION', priority: 1, immediate: true });
        break;
      case 'VELOCITY_ABUSE':
        actions.push({ type: 'IMPLEMENT_COOLDOWN', priority: 2, immediate: true });
        break;
    }
    
    return actions.sort((a, b) => a.priority - b.priority);
  }

  private async executeAction(action: FraudAction, alert: FraudAlert): Promise<void> {
    switch (action.type) {
      case 'FREEZE_ACCOUNT':
        await this.freezeAccount(alert.userId);
        break;
        
      case 'BLOCK_TRANSACTIONS':
        await this.blockTransactions(alert.userId);
        break;
        
      case 'REQUIRE_MANUAL_REVIEW':
        await this.createManualReviewTicket(alert);
        break;
        
      case 'NOTIFY_ADMIN':
        await this.notifyAdmins(alert);
        break;
        
      case 'LIMIT_TRANSACTION_AMOUNT':
        await this.setTransactionLimits(alert.userId, { daily: 50000, monthly: 200000 });
        break;
        
      case 'REQUEST_ADDITIONAL_VERIFICATION':
        await this.requestVerification(alert.userId, ['IDENTITY', 'ADDRESS', 'INCOME']);
        break;
    }
  }
}
```

## Implementation Timeline

### Phase 1: Core Detection (6-8 weeks)
- [ ] Basic fraud detection algorithms
- [ ] Risk scoring system
- [ ] Real-time monitoring
- [ ] Database schema implementation

### Phase 2: Argentina-Specific Features (4-6 weeks)
- [ ] BCRA compliance checks
- [ ] UIF reporting integration
- [ ] Geographic fraud detection
- [ ] Currency manipulation detection

### Phase 3: Automated Response (4-5 weeks)
- [ ] Automated action system
- [ ] Notification framework
- [ ] Manual review processes
- [ ] Admin dashboard

### Phase 4: Advanced Features (6-8 weeks)
- [ ] Machine learning models
- [ ] Pattern recognition
- [ ] Network analysis
- [ ] Behavioral analytics

## Security Considerations

### Data Protection
- All fraud data encrypted at rest and in transit
- Access controls for fraud investigation tools
- Audit trails for all fraud-related actions
- Compliance with Argentine data protection laws

### Performance
- Real-time processing capability for 10,000+ transactions/hour
- Low latency fraud checks (<200ms)
- Scalable infrastructure for growth
- Backup and disaster recovery

## Performance Metrics & KPIs

### Detection Accuracy
- **True Positive Rate**: >85% of actual fraud detected
- **False Positive Rate**: <5% of legitimate transactions flagged
- **Detection Time**: <30 seconds for critical alerts
- **Response Time**: <60 seconds for automated actions

### Business Impact
- **Fraud Prevention**: >90% of attempted fraud blocked
- **User Experience**: <2% of users affected by false positives
- **Regulatory Compliance**: 100% compliance with BCRA/UIF requirements
- **Financial Loss**: <0.1% of transaction volume lost to fraud

## Conclusion

This comprehensive fraud prevention system positions LABUREMOS as a leader in financial security for freelance platforms in Argentina. The system combines advanced AI detection with local regulatory compliance, ensuring both security and user experience while meeting all Argentine financial regulations.