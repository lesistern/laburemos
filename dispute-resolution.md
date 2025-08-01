# Sistema de Resolución de Disputas LaburAR
## AI-Mediated Dispute Resolution System

**Versión**: 1.0  
**Fecha**: 2025-07-29  
**Stack**: NestJS + PostgreSQL + Redis + ML Pipeline  
**Target**: Mercado Freelance Argentino

---

## 📋 Resumen Ejecutivo

Sistema inteligente de resolución de disputas con 3 niveles de escalación, optimizado para el mercado freelance argentino con consideraciones específicas de regulación local, patrones culturales y marcos legales.

### Objetivos de Performance
- **AI Resolution**: 60% de casos resueltos en 24-48h
- **Human Mediation**: 35% de casos resueltos en 3-5 días  
- **Professional Arbitration**: 5% de casos en 7-14 días
- **User Satisfaction**: >85% post-resolución
- **Cost Efficiency**: <$500 ARS por caso promedio

---

## 🎯 Arquitectura del Sistema

### Stack Tecnológico
```typescript
// Core Technologies
Backend: NestJS 10.x + TypeScript
Database: PostgreSQL 15+ (con particionamiento)
Cache: Redis 7.x (decisiones AI + sessiones)
ML Pipeline: TensorFlow.js + Python backend
Queue System: Bull/Redis (procesamiento asíncrono)
Real-time: WebSockets (updates instantáneos)
Payment Integration: Stripe + MercadoPago
```

### Componentes Principales
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AI Engine     │    │ Human Mediation │    │  Professional   │
│   (24-48h)      │───▶│    (3-5 días)   │───▶│   Arbitration   │
│                 │    │                 │    │   (7-14 días)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│              Evidence Collection & Analysis Engine              │
│        (Automated Timeline + Message Analysis + ML)            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Database Schema

### Tablas Principales

```sql
-- =====================================================================
-- DISPUTE MANAGEMENT TABLES
-- =====================================================================

-- Casos de disputa principales
CREATE TABLE disputes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    case_number VARCHAR(20) NOT NULL UNIQUE COMMENT 'DIS-2025-000001',
    
    -- Partes involucradas
    freelancer_id BIGINT UNSIGNED NOT NULL,
    client_id BIGINT UNSIGNED NOT NULL,
    project_id BIGINT UNSIGNED NULL COMMENT 'Proyecto relacionado si aplica',
    
    -- Clasificación de disputa
    dispute_type ENUM(
        'payment_delay', 'payment_missing', 'work_quality', 
        'work_delay', 'scope_change', 'contract_breach',
        'cancellation', 'ip_rights', 'confidentiality'
    ) NOT NULL,
    dispute_category ENUM('payment', 'delivery', 'quality', 'contract', 'legal') NOT NULL,
    
    -- Detalles financieros
    disputed_amount DECIMAL(12,2) UNSIGNED NULL,
    currency VARCHAR(3) DEFAULT 'ARS',
    project_total_value DECIMAL(12,2) UNSIGNED NULL,
    
    -- Estado y proceso
    status ENUM(
        'submitted', 'ai_analyzing', 'ai_resolved', 'ai_escalated',
        'human_assigned', 'human_mediating', 'human_resolved', 'human_escalated',
        'arbitration_assigned', 'arbitration_hearing', 'arbitration_resolved',
        'appealed', 'appeal_resolved', 'closed'
    ) DEFAULT 'submitted',
    
    current_level ENUM('ai', 'human', 'arbitration') DEFAULT 'ai',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    
    -- Asignaciones
    assigned_mediator_id BIGINT UNSIGNED NULL,
    assigned_arbitrator_id BIGINT UNSIGNED NULL,
    
    -- Descripción y contexto
    description TEXT NOT NULL,
    desired_outcome TEXT NULL,
    
    -- Fechas críticas
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deadline_ai TIMESTAMP NULL COMMENT 'Deadline para resolución AI',
    deadline_human TIMESTAMP NULL,
    deadline_arbitration TIMESTAMP NULL,
    resolved_at TIMESTAMP NULL,
    
    -- Metadatos para ML
    ml_confidence_score DECIMAL(5,4) NULL COMMENT '0.0000-1.0000',
    ml_predicted_outcome JSON NULL,
    ml_risk_factors JSON NULL,
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (freelancer_id) REFERENCES users(id),
    FOREIGN KEY (client_id) REFERENCES users(id),
    FOREIGN KEY (assigned_mediator_id) REFERENCES users(id),
    FOREIGN KEY (assigned_arbitrator_id) REFERENCES users(id),
    
    -- Indexes
    INDEX idx_case_number (case_number),
    INDEX idx_parties (freelancer_id, client_id),
    INDEX idx_status_level (status, current_level),
    INDEX idx_dispute_type (dispute_type, dispute_category),
    INDEX idx_submitted_at (submitted_at),
    INDEX idx_priority_status (priority, status),
    INDEX idx_ml_confidence (ml_confidence_score),
    
    -- Partitioning by month
    INDEX idx_submitted_partition (submitted_at)
) ENGINE=InnoDB PARTITION BY RANGE (YEAR(submitted_at) * 100 + MONTH(submitted_at)) (
    PARTITION p202501 VALUES LESS THAN (202502),
    PARTITION p202502 VALUES LESS THAN (202503),
    PARTITION p202503 VALUES LESS THAN (202504),
    PARTITION p202504 VALUES LESS THAN (202505),
    PARTITION p202505 VALUES LESS THAN (202506),
    PARTITION p202506 VALUES LESS THAN (202507),
    PARTITION p202507 VALUES LESS THAN (202508),
    PARTITION p202508 VALUES LESS THAN (202509),
    PARTITION p202509 VALUES LESS THAN (202510),
    PARTITION p202510 VALUES LESS THAN (202511),
    PARTITION p202511 VALUES LESS THAN (202512),
    PARTITION p202512 VALUES LESS THAN (202601),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- Evidencia recolectada automáticamente
CREATE TABLE dispute_evidence (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    dispute_id BIGINT UNSIGNED NOT NULL,
    
    -- Tipo de evidencia
    evidence_type ENUM(
        'message_thread', 'file_delivery', 'payment_record', 
        'timeline_event', 'user_behavior', 'contract_term',
        'external_document', 'screenshot', 'email_thread'
    ) NOT NULL,
    
    -- Fuente de la evidencia
    source_type ENUM('automatic', 'user_submitted', 'admin_added', 'ml_extracted') NOT NULL,
    source_user_id BIGINT UNSIGNED NULL COMMENT 'Usuario que submitió evidencia',
    
    -- Contenido
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    content_text TEXT NULL COMMENT 'Contenido extraído/procesado',
    metadata JSON NULL COMMENT 'Metadata estructurada',
    
    -- Archivos relacionados
    file_path VARCHAR(500) NULL,
    file_type VARCHAR(100) NULL,
    file_size INT UNSIGNED NULL,
    
    -- Análisis ML
    sentiment_score DECIMAL(3,2) NULL COMMENT '-1.00 a 1.00',
    relevance_score DECIMAL(5,4) NULL COMMENT '0.0000-1.0000',
    keywords JSON NULL COMMENT 'Keywords extraídas por ML',
    
    -- Validación
    verified BOOLEAN DEFAULT FALSE,
    verified_by BIGINT UNSIGNED NULL,
    verified_at TIMESTAMP NULL,
    
    -- Timestamps
    evidence_date TIMESTAMP NULL COMMENT 'Fecha original de la evidencia',
    collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (dispute_id) REFERENCES disputes(id) ON DELETE CASCADE,
    FOREIGN KEY (source_user_id) REFERENCES users(id),
    FOREIGN KEY (verified_by) REFERENCES users(id),
    
    -- Indexes
    INDEX idx_dispute_type (dispute_id, evidence_type),
    INDEX idx_source (source_type, source_user_id),
    INDEX idx_relevance (relevance_score),
    INDEX idx_sentiment (sentiment_score),
    INDEX idx_evidence_date (evidence_date),
    INDEX idx_verified (verified, verified_at)
) ENGINE=InnoDB;

-- Resoluciones y decisiones
CREATE TABLE dispute_resolutions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    dispute_id BIGINT UNSIGNED NOT NULL,
    
    -- Nivel de resolución
    resolution_level ENUM('ai', 'human', 'arbitration') NOT NULL,
    resolver_id BIGINT UNSIGNED NULL COMMENT 'AI system, mediador o árbitro',
    resolver_type ENUM('ai_system', 'human_mediator', 'arbitrator') NOT NULL,
    
    -- Decisión
    decision ENUM('favor_freelancer', 'favor_client', 'split_decision', 'no_fault', 'dismissed') NOT NULL,
    reasoning TEXT NOT NULL COMMENT 'Justificación de la decisión',
    
    -- Acciones requeridas
    actions_required JSON NULL COMMENT 'Acciones específicas a tomar',
    
    -- Compensación financiera
    compensation_amount DECIMAL(12,2) NULL,
    compensation_to ENUM('freelancer', 'client', 'both', 'none') NULL,
    payment_adjustment JSON NULL COMMENT 'Ajustes de pago detallados',
    
    -- Términos de resolución
    terms_and_conditions TEXT NULL,
    deadline_compliance TIMESTAMP NULL COMMENT 'Fecha límite para cumplir resolución',
    
    -- Estado de implementación
    implementation_status ENUM('pending', 'in_progress', 'completed', 'failed') DEFAULT 'pending',
    implemented_at TIMESTAMP NULL,
    
    -- Aceptación de partes
    freelancer_accepted BOOLEAN NULL,
    client_accepted BOOLEAN NULL,
    freelancer_accepted_at TIMESTAMP NULL,
    client_accepted_at TIMESTAMP NULL,
    
    -- Métricas de calidad
    confidence_score DECIMAL(5,4) NULL COMMENT 'Confianza en la decisión',
    satisfaction_freelancer TINYINT NULL COMMENT '1-5 rating',
    satisfaction_client TINYINT NULL COMMENT '1-5 rating',
    
    -- Timestamps
    resolved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (dispute_id) REFERENCES disputes(id) ON DELETE CASCADE,
    FOREIGN KEY (resolver_id) REFERENCES users(id),
    
    -- Indexes
    INDEX idx_dispute_level (dispute_id, resolution_level),
    INDEX idx_decision (decision),
    INDEX idx_resolver (resolver_type, resolver_id),
    INDEX idx_implementation (implementation_status),
    INDEX idx_resolved_at (resolved_at),
    INDEX idx_satisfaction (satisfaction_freelancer, satisfaction_client)
) ENGINE=InnoDB;

-- Proceso de apelación
CREATE TABLE dispute_appeals (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    dispute_id BIGINT UNSIGNED NOT NULL,
    original_resolution_id BIGINT UNSIGNED NOT NULL,
    
    -- Información del apelante
    appellant_id BIGINT UNSIGNED NOT NULL COMMENT 'Usuario que apela',
    appellant_type ENUM('freelancer', 'client') NOT NULL,
    
    -- Detalles de la apelación
    appeal_reason ENUM(
        'procedural_error', 'new_evidence', 'bias_claim', 
        'legal_error', 'unfair_decision', 'incomplete_analysis'
    ) NOT NULL,
    appeal_description TEXT NOT NULL,
    new_evidence_provided BOOLEAN DEFAULT FALSE,
    
    -- Estado del proceso
    status ENUM('submitted', 'under_review', 'accepted', 'rejected', 'resolved') DEFAULT 'submitted',
    reviewed_by BIGINT UNSIGNED NULL,
    review_notes TEXT NULL,
    
    -- Decisión de apelación
    appeal_decision ENUM('upheld', 'overturned', 'modified') NULL,
    new_resolution_id BIGINT UNSIGNED NULL,
    
    -- Fechas
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    review_deadline TIMESTAMP NULL,
    resolved_at TIMESTAMP NULL,
    
    -- Foreign keys
    FOREIGN KEY (dispute_id) REFERENCES disputes(id) ON DELETE CASCADE,
    FOREIGN KEY (original_resolution_id) REFERENCES dispute_resolutions(id),
    FOREIGN KEY (appellant_id) REFERENCES users(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id),
    FOREIGN KEY (new_resolution_id) REFERENCES dispute_resolutions(id),
    
    -- Indexes
    INDEX idx_dispute_appeal (dispute_id, status),
    INDEX idx_appellant (appellant_id, appellant_type),
    INDEX idx_submitted_at (submitted_at),
    INDEX idx_review_deadline (review_deadline)
) ENGINE=InnoDB;

-- Mediadores y árbitros
CREATE TABLE dispute_mediators (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    
    -- Tipo y especialización
    mediator_type ENUM('human_mediator', 'professional_arbitrator') NOT NULL,
    specializations JSON NULL COMMENT 'Áreas de especialización',
    
    -- Calificaciones
    certifications JSON NULL COMMENT 'Certificaciones profesionales',
    experience_years TINYINT UNSIGNED NULL,
    languages JSON NULL COMMENT 'Idiomas que maneja',
    
    -- Disponibilidad
    availability_status ENUM('available', 'busy', 'unavailable') DEFAULT 'available',
    max_concurrent_cases TINYINT UNSIGNED DEFAULT 5,
    current_case_count TINYINT UNSIGNED DEFAULT 0,
    hourly_rate DECIMAL(8,2) NULL COMMENT 'Tarifa por hora en ARS',
    
    -- Métricas de performance
    total_cases_handled INT UNSIGNED DEFAULT 0,
    cases_resolved INT UNSIGNED DEFAULT 0,
    average_resolution_time DECIMAL(8,2) NULL COMMENT 'Días promedio',
    satisfaction_rating DECIMAL(3,2) DEFAULT 0.00 COMMENT '0.00-5.00',
    
    -- Configuración regional
    jurisdiction VARCHAR(100) DEFAULT 'Argentina',
    timezone VARCHAR(50) DEFAULT 'America/Argentina/Buenos_Aires',
    
    -- Estado
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_type_status (mediator_type, availability_status),
    INDEX idx_specializations (specializations(100)),
    INDEX idx_performance (satisfaction_rating, total_cases_handled),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB;

-- Log de decisiones AI
CREATE TABLE dispute_ai_decisions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    dispute_id BIGINT UNSIGNED NOT NULL,
    
    -- Modelo y versión
    ai_model_version VARCHAR(50) NOT NULL COMMENT 'v1.2.3',
    decision_algorithm VARCHAR(100) NOT NULL,
    
    -- Input data
    input_features JSON NOT NULL COMMENT 'Features usadas para la decisión',
    evidence_analyzed JSON NOT NULL COMMENT 'IDs de evidencia analizada',
    
    -- Análisis realizado
    sentiment_analysis JSON NULL,
    pattern_matching JSON NULL,
    precedent_cases JSON NULL COMMENT 'Casos similares considerados',
    
    -- Resultado
    confidence_score DECIMAL(5,4) NOT NULL COMMENT '0.0000-1.0000',
    decision_factors JSON NOT NULL COMMENT 'Factores que influyeron',
    recommended_action VARCHAR(100) NOT NULL,
    
    -- Validación humana posterior
    human_validated BOOLEAN NULL,
    human_validator_id BIGINT UNSIGNED NULL,
    validation_notes TEXT NULL,
    accuracy_score DECIMAL(3,2) NULL COMMENT 'Precisión validada (0-100)',
    
    -- Timestamps
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    validated_at TIMESTAMP NULL,
    
    -- Foreign keys
    FOREIGN KEY (dispute_id) REFERENCES disputes(id) ON DELETE CASCADE,
    FOREIGN KEY (human_validator_id) REFERENCES users(id),
    
    -- Indexes
    INDEX idx_dispute_model (dispute_id, ai_model_version),
    INDEX idx_confidence (confidence_score),
    INDEX idx_processed_at (processed_at),
    INDEX idx_validation (human_validated, accuracy_score)
) ENGINE=InnoDB;

-- Timeline automático de eventos
CREATE TABLE dispute_timelines (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    dispute_id BIGINT UNSIGNED NOT NULL,
    
    -- Evento
    event_type ENUM(
        'dispute_submitted', 'evidence_collected', 'ai_analysis_started',
        'ai_decision_made', 'escalated_to_human', 'mediator_assigned',
        'hearing_scheduled', 'resolution_proposed', 'resolution_accepted',
        'resolution_rejected', 'appeal_submitted', 'case_closed',
        'payment_processed', 'deadline_missed'
    ) NOT NULL,
    
    -- Detalles del evento
    event_description TEXT NOT NULL,
    actor_id BIGINT UNSIGNED NULL COMMENT 'Usuario que triggereó el evento',
    actor_type ENUM('system', 'user', 'ai', 'mediator', 'arbitrator') NOT NULL,
    
    -- Datos del evento
    event_data JSON NULL COMMENT 'Datos específicos del evento',
    
    -- Referencias
    related_evidence_id BIGINT UNSIGNED NULL,
    related_resolution_id BIGINT UNSIGNED NULL,
    
    -- Timestamps
    occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (dispute_id) REFERENCES disputes(id) ON DELETE CASCADE,
    FOREIGN KEY (actor_id) REFERENCES users(id),
    FOREIGN KEY (related_evidence_id) REFERENCES dispute_evidence(id),
    FOREIGN KEY (related_resolution_id) REFERENCES dispute_resolutions(id),
    
    -- Indexes
    INDEX idx_dispute_timeline (dispute_id, occurred_at),
    INDEX idx_event_type (event_type),
    INDEX idx_actor (actor_type, actor_id)
) ENGINE=InnoDB;
```

---

## 🤖 AI Engine & ML Pipeline

### Algoritmos de Decisión Automatizada

```typescript
// AI Decision Engine
interface DisputeAIAnalysis {
  disputeId: string;
  confidence: number; // 0.0 - 1.0
  recommendation: DisputeDecision;
  riskFactors: RiskFactor[];
  precedentCases: PrecedentCase[];
  requiredActions: Action[];
}

// ML Features para análisis
interface MLFeatures {
  // Datos financieros
  disputedAmount: number;
  projectValue: number;
  paymentHistory: PaymentPattern[];
  
  // Análisis de comunicación
  messageCount: number;
  sentimentScore: number; // -1.0 a 1.0
  responseTimeAvg: number; // minutos
  escalationWords: number;
  
  // Historial de usuarios
  freelancerReputation: number;
  clientReputation: number;
  previousDisputes: number;
  completionRate: number;
  
  // Evidencia disponible
  evidenceQuality: number; // 0.0 - 1.0
  evidenceCompleteness: number; // 0.0 - 1.0
  contractClarity: number; // 0.0 - 1.0
  
  // Contexto temporal
  daysSinceProjectStart: number;
  daysSinceLastMessage: number;
  isDeadlineApproaching: boolean;
}

// Scoring Algorithm
class DisputeAIScorer {
  calculateDisputeScore(features: MLFeatures): DisputeScore {
    const weights = {
      financial: 0.25,
      communication: 0.20,
      reputation: 0.20,
      evidence: 0.20,
      temporal: 0.15
    };
    
    const financialScore = this.calculateFinancialScore(features);
    const communicationScore = this.calculateCommunicationScore(features);
    const reputationScore = this.calculateReputationScore(features);
    const evidenceScore = this.calculateEvidenceScore(features);
    const temporalScore = this.calculateTemporalScore(features);
    
    const totalScore = 
      financialScore * weights.financial +
      communicationScore * weights.communication +
      reputationScore * weights.reputation +
      evidenceScore * weights.evidence +
      temporalScore * weights.temporal;
    
    return {
      total: totalScore,
      confidence: this.calculateConfidence(features),
      breakdown: {
        financial: financialScore,
        communication: communicationScore,
        reputation: reputationScore,
        evidence: evidenceScore,
        temporal: temporalScore
      }
    };
  }
  
  private calculateFinancialScore(features: MLFeatures): number {
    // Análisis basado en monto, historial de pagos, etc.
    const amountFactor = Math.min(features.disputedAmount / 100000, 1.0); // Normalizar hasta $100k ARS
    const paymentReliability = this.analyzePaymentHistory(features.paymentHistory);
    
    return (amountFactor * 0.6) + (paymentReliability * 0.4);
  }
  
  private calculateCommunicationScore(features: MLFeatures): number {
    // Análisis de sentimiento y patrones de comunicación
    const sentimentNormalized = (features.sentimentScore + 1) / 2; // -1,1 → 0,1
    const responseTimeFactor = Math.max(0, 1 - (features.responseTimeAvg / 1440)); // Penalizar > 24h
    const escalationPenalty = Math.max(0, 1 - (features.escalationWords / 10));
    
    return (sentimentNormalized * 0.4) + (responseTimeFactor * 0.3) + (escalationPenalty * 0.3);
  }
}
```

### Patrones de Reconocimiento

```typescript
// Pattern Recognition para tipos de disputa
enum DisputePattern {
  PAYMENT_DELAY_SYSTEMATIC = 'payment_delay_systematic', // Cliente con historial de retrasos
  QUALITY_MISMATCH_BRIEF = 'quality_mismatch_brief', // Disconnect entre brief y entrega
  SCOPE_CREEP_GRADUAL = 'scope_creep_gradual', // Aumento gradual de requerimientos
  CANCELLATION_PATTERN = 'cancellation_pattern', // Patrón de cancelación tardía
  PERFECTIONIST_CLIENT = 'perfectionist_client', // Cliente con múltiples revisiones
  OVERCOMMITTED_FREELANCER = 'overcommitted_freelancer' // Freelancer con múltiples proyectos
}

class PatternRecognition {
  identifyPatterns(dispute: Dispute, evidence: Evidence[]): DisputePattern[] {
    const patterns: DisputePattern[] = [];
    
    // Análisis de payment delay systematic
    if (this.isPaymentDelaySystematic(dispute, evidence)) {
      patterns.push(DisputePattern.PAYMENT_DELAY_SYSTEMATIC);
    }
    
    // Análisis de quality mismatch
    if (this.isQualityMismatchBrief(dispute, evidence)) {
      patterns.push(DisputePattern.QUALITY_MISMATCH_BRIEF);
    }
    
    return patterns;
  }
  
  private isPaymentDelaySystematic(dispute: Dispute, evidence: Evidence[]): boolean {
    // Verificar historial de pagos del cliente
    const paymentHistory = evidence.filter(e => e.type === 'payment_record');
    const delayedPayments = paymentHistory.filter(p => 
      p.metadata.daysLate > 15
    );
    
    return delayedPayments.length >= 3; // 3+ pagos tardíos = patrón
  }
  
  private isQualityMismatchBrief(dispute: Dispute, evidence: Evidence[]): boolean {
    const briefEvidence = evidence.find(e => e.type === 'contract_term');
    const deliveryEvidence = evidence.filter(e => e.type === 'file_delivery');
    
    if (!briefEvidence || !deliveryEvidence.length) return false;
    
    // Análisis ML para comparar brief vs entrega
    const matchScore = this.mlAnalysis.compareContentMatch(
      briefEvidence.content, 
      deliveryEvidence.map(d => d.content)
    );
    
    return matchScore < 0.6; // < 60% match = mismatch probable
  }
}
```

---

## 🚨 Human Escalation Triggers

### Criterios de Escalación Automática

```typescript
// Triggers para escalación humana
interface EscalationTriggers {
  // Financieros
  readonly HIGH_VALUE_THRESHOLD = 50000; // ARS
  readonly PAYMENT_DISPUTE_URGENT = 100000; // ARS
  
  // Técnicos
  readonly AI_CONFIDENCE_THRESHOLD = 0.70;
  readonly EVIDENCE_QUALITY_THRESHOLD = 0.60;
  readonly PATTERN_COMPLEXITY_THRESHOLD = 3; // Número de patrones detectados
  
  // Temporales
  readonly REPEAT_DISPUTE_DAYS = 30; // Mismas partes en 30 días
  readonly ESCALATION_REQUEST_IMMEDIATE = true;
  
  // Reputacionales
  readonly HIGH_REPUTATION_USER_THRESHOLD = 4.5; // Rating > 4.5/5
  readonly FOUNDER_BADGE_ESCALATION = true; // Usuarios con badge Founder
  
  // Legales
  readonly IP_RIGHTS_AUTOMATIC = true;
  readonly CONFIDENTIALITY_BREACH = true;
  readonly DISCRIMINATION_CLAIMS = true;
}

class EscalationEngine {
  shouldEscalateToHuman(dispute: Dispute, analysis: DisputeAIAnalysis): boolean {
    const triggers = new EscalationTriggers();
    
    // Check financial thresholds
    if (dispute.disputedAmount >= triggers.HIGH_VALUE_THRESHOLD) {
      this.logEscalation(dispute.id, 'HIGH_VALUE', dispute.disputedAmount);
      return true;
    }
    
    // Check AI confidence
    if (analysis.confidence < triggers.AI_CONFIDENCE_THRESHOLD) {
      this.logEscalation(dispute.id, 'LOW_CONFIDENCE', analysis.confidence);
      return true;
    }
    
    // Check for repeat disputes
    if (this.isRepeatDispute(dispute, triggers.REPEAT_DISPUTE_DAYS)) {
      this.logEscalation(dispute.id, 'REPEAT_DISPUTE');
      return true;
    }
    
    // Check for high-reputation users
    if (this.hasHighReputationUser(dispute, triggers.HIGH_REPUTATION_USER_THRESHOLD)) {
      this.logEscalation(dispute.id, 'HIGH_REPUTATION_USER');
      return true;
    }
    
    // Check for legal issues
    if (this.hasLegalComplexity(dispute)) {
      this.logEscalation(dispute.id, 'LEGAL_COMPLEXITY');
      return true;
    }
    
    return false;
  }
  
  shouldEscalateToArbitration(dispute: Dispute, humanAttempts: number): boolean {
    // Escalación a arbitraje profesional
    const triggers = new EscalationTriggers();
    
    // Más de 2 intentos de mediación humana fallidos
    if (humanAttempts >= 2) return true;
    
    // Disputas de alto valor siempre van a arbitraje
    if (dispute.disputedAmount >= triggers.PAYMENT_DISPUTE_URGENT) return true;
    
    // Temas legales complejos
    if (dispute.type === 'ip_rights' || dispute.type === 'confidentiality') return true;
    
    // Solicitud explícita de cualquier parte
    if (dispute.metadata?.arbitrationRequested) return true;
    
    return false;
  }
}
```

---

## 🌍 Argentina-Specific Considerations

### Marco Legal Argentino

```typescript
// Regulaciones específicas de Argentina
interface ArgentinaLegalFramework {
  // Ley de Contrato de Trabajo
  LCT: {
    applicableToFreelancers: false, // Solo empleados en relación de dependencia
    independentContractorRights: string[];
    disputeJurisdiction: 'commercial_courts';
  };
  
  // Ley de Defensa del Consumidor (24.240)
  consumerProtection: {
    applicableToB2C: true, // Cliente = consumidor, Freelancer = proveedor
    maxDisputeResolutionDays: 30;
    mandatoryMediationFirst: true;
    rightToRefund: boolean;
  };
  
  // Código Civil y Comercial
  civilCommercialCode: {
    contractTypes: ['obra', 'servicios', 'locacion'];
    paymentTerms: {
      defaultDays: 30;
      interestRate: 'banco_nacion_rate';
      latePaymentPenalty: number;
    };
  };
  
  // AFIP y regulaciones fiscales
  afipRegulations: {
    monotributoLimits: {
      annual: 8700000; // ARS 2025
      monthly: 725000; // ARS 2025
    };
    invoiceRequirements: {
      mustIssue: boolean;
      electronicInvoicing: boolean;
      taxWithholding: number; // %
    };
  };
}

class ArgentinaComplianceEngine {
  validateDisputeCompliance(dispute: Dispute): ComplianceResult {
    const framework = new ArgentinaLegalFramework();
    const violations: string[] = [];
    const recommendations: string[] = [];
    
    // Verificar si aplica Ley de Defensa del Consumidor
    if (this.isB2CRelationship(dispute)) {
      if (this.daysSinceDispute(dispute) > framework.consumerProtection.maxDisputeResolutionDays) {
        violations.push('Excede tiempo máximo resolución Ley 24.240');
      }
      recommendations.push('Aplicar mediación obligatoria según Ley 24.240');
    }
    
    // Verificar términos de pago según Código Civil
    if (dispute.type === 'payment_delay') {
      const paymentTerms = this.getContractPaymentTerms(dispute);
      if (paymentTerms.days > framework.civilCommercialCode.paymentTerms.defaultDays) {
        recommendations.push(`Aplicar interés por mora según tasa Banco Nación`);
      }
    }
    
    // Verificar compliance AFIP
    if (dispute.disputedAmount > framework.afipRegulations.monotributoLimits.monthly) {
      recommendations.push('Verificar categoría monotributo del freelancer');
      recommendations.push('Considerar retención de impuestos');
    }
    
    return {
      compliant: violations.length === 0,
      violations,
      recommendations,
      applicableLaws: this.getApplicableLaws(dispute)
    };
  }
  
  private getApplicableLaws(dispute: Dispute): string[] {
    const laws: string[] = [];
    
    if (this.isB2CRelationship(dispute)) {
      laws.push('Ley 24.240 - Defensa del Consumidor');
    }
    
    laws.push('Código Civil y Comercial - Contratos');
    
    if (dispute.type === 'ip_rights') {
      laws.push('Ley 11.723 - Propiedad Intelectual');
    }
    
    if (dispute.disputedAmount > 50000) {
      laws.push('Ley 26.589 - Mediación Prejuicial Obligatoria');
    }
    
    return laws;
  }
}
```

### Casos de Uso Específicos

```typescript
// Casos de uso específicos del mercado argentino
class ArgentinianUseCases {
  
  // Caso 1: Disputa de Facturación - Monotributo
  async handleMonotributoDispute(dispute: Dispute): Promise<ResolutionPlan> {
    const freelancer = await this.getFreelancer(dispute.freelancerId);
    const client = await this.getClient(dispute.clientId);
    
    // Verificar categoría monotributo
    const afipData = await this.afipService.getMonotributoStatus(freelancer.cuil);
    
    if (!afipData.active) {
      return {
        decision: 'favor_client',
        reasoning: 'Freelancer no posee monotributo activo para facturar',
        actions: [
          'Freelancer debe regularizar situación AFIP',
          'Cliente puede retener servicios hasta regularización'
        ],
        legalBasis: 'Obligación fiscal monotributo - AFIP'
      };
    }
    
    if (dispute.disputedAmount > afipData.monthlyLimit) {
      return {
        decision: 'split_decision',
        reasoning: 'Monto excede límite mensual monotributo',
        actions: [
          'Dividir facturación en múltiples períodos',
          'Freelancer debe considerar cambio de categoría'
        ],
        legalBasis: 'Límites monetarios monotributo 2025'
      };
    }
    
    // Caso normal - ambos en regla
    return this.standardPaymentResolution(dispute);
  }
  
  // Caso 2: Incumplimiento con Ley Defensa del Consumidor
  async handleConsumerProtectionCase(dispute: Dispute): Promise<ResolutionPlan> {
    const daysSinceDispute = this.calculateDaysSince(dispute.submittedAt);
    
    if (daysSinceDispute > 30) {
      // Automáticamente escalar - excede tiempo legal
      return {
        decision: 'escalate_immediate',
        reasoning: 'Excede 30 días establecidos por Ley 24.240',
        actions: [
          'Mediación prejudicial obligatoria',
          'Informar a autoridad de aplicación si corresponde'
        ],
        legalBasis: 'Art. 45 Ley 24.240 - Defensa del Consumidor',
        escalateTo: 'professional_arbitration'
      };
    }
    
    // Dentro de tiempo legal - resolución estándar con derechos del consumidor
    return {
      decision: this.analyzeConsumerRights(dispute),
      reasoning: 'Aplicación derechos consumidor',
      actions: [
        'Derecho a devolución si aplica',
        'Reparación o sustitución gratuita',
        'Información clara sobre términos'
      ],
      legalBasis: 'Ley 24.240 - Derechos del Consumidor'
    };
  }
  
  // Caso 3: Disputa de Calidad - Brief vs Entrega
  async handleQualityMismatch(dispute: Dispute): Promise<ResolutionPlan> {
    const evidence = await this.getDisputeEvidence(dispute.id);
    const briefEvidence = evidence.find(e => e.type === 'contract_term');
    const deliveryEvidence = evidence.filter(e => e.type === 'file_delivery');
    
    // ML Analysis de match entre brief y entrega
    const matchAnalysis = await this.mlService.analyzeContentMatch(
      briefEvidence.content,
      deliveryEvidence.map(d => d.content)
    );
    
    if (matchAnalysis.score < 0.3) {
      // Muy poco match - favor al cliente
      return {
        decision: 'favor_client',
        reasoning: `Entrega no coincide con brief (${Math.round(matchAnalysis.score * 100)}% match)`,
        actions: [
          'Rehacer trabajo según brief original',
          'Sin costo adicional para cliente',
          'Timeline extendido por rehecho'
        ],
        compensation: {
          amount: 0,
          refundPercentage: 0 // No refund, sino rehecho
        }
      };
    } else if (matchAnalysis.score < 0.7) {
      // Match parcial - decisión compartida
      return {
        decision: 'split_decision',
        reasoning: `Entrega parcialmente coincide con brief (${Math.round(matchAnalysis.score * 100)}% match)`,
        actions: [
          'Revisiones menores incluidas',
          'Costo compartido de modificaciones mayores',
          'Clarificar brief para futuros proyectos'
        ],
        compensation: {
          amount: dispute.disputedAmount * 0.25, // 25% descuento
          to: 'client'
        }
      };
    } else {
      // Buen match - favor al freelancer
      return {
        decision: 'favor_freelancer',
        reasoning: `Entrega coincide sustancialmente con brief (${Math.round(matchAnalysis.score * 100)}% match)`,
        actions: [
          'Pago completo según acordado',
          'Revisiones menores sin costo',
          'Cliente debe ser más específico en briefs futuros'
        ]
      };
    }
  }
}
```

---

## 🔌 Integration APIs

### API de Resolución de Disputas

```typescript
// NestJS Controller para Dispute Resolution
@Controller('disputes')
@UseGuards(JwtAuthGuard)
export class DisputeController {
  
  constructor(
    private readonly disputeService: DisputeService,
    private readonly aiEngine: DisputeAIEngine,
    private readonly escalationEngine: EscalationEngine
  ) {}
  
  // Crear nueva disputa
  @Post()
  async createDispute(
    @Body() createDisputeDto: CreateDisputeDto,
    @CurrentUser() user: User
  ): Promise<DisputeResponse> {
    
    // Validar que el usuario puede crear la disputa
    await this.disputeService.validateDisputeCreation(createDisputeDto, user);
    
    // Crear disputa
    const dispute = await this.disputeService.create({
      ...createDisputeDto,
      submittedBy: user.id,
      status: 'submitted',
      currentLevel: 'ai'
    });
    
    // Iniciar análisis AI automático
    this.aiEngine.analyzeDispute(dispute.id); // Async
    
    // Recolectar evidencia automática
    this.disputeService.collectAutomaticEvidence(dispute.id); // Async
    
    return {
      disputeId: dispute.id,
      caseNumber: dispute.caseNumber,
      estimatedResolutionTime: '24-48 horas',
      nextSteps: [
        'Análisis automático en progreso',
        'Recolección de evidencia iniciada',
        'Se notificará a ambas partes'
      ]
    };
  }
  
  // Obtener estado de disputa
  @Get(':id')
  async getDispute(
    @Param('id') id: string,
    @CurrentUser() user: User
  ): Promise<DisputeDetails> {
    
    const dispute = await this.disputeService.findById(id);
    
    // Verificar que el usuario puede ver esta disputa
    await this.disputeService.validateAccess(dispute, user);
    
    const evidence = await this.disputeService.getEvidence(id);
    const timeline = await this.disputeService.getTimeline(id);
    const resolution = await this.disputeService.getCurrentResolution(id);
    
    return {
      dispute: this.sanitizeDisputeForUser(dispute, user),
      evidence: evidence.filter(e => this.canUserSeeEvidence(e, user)),
      timeline,
      currentResolution: resolution,
      availableActions: await this.disputeService.getAvailableActions(dispute, user)
    };
  }
  
  // Submitir evidencia adicional
  @Post(':id/evidence')
  @UseInterceptors(FilesInterceptor('files', 10))
  async submitEvidence(
    @Param('id') disputeId: string,
    @Body() evidenceDto: SubmitEvidenceDto,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: User
  ): Promise<EvidenceResponse> {
    
    const dispute = await this.disputeService.findById(disputeId);
    await this.disputeService.validateAccess(dispute, user);
    
    // Procesar archivos
    const processedFiles = await this.fileService.processEvidenceFiles(files);
    
    // Crear evidencia
    const evidence = await this.disputeService.createEvidence({
      disputeId,
      ...evidenceDto,
      sourceUserId: user.id,
      sourceType: 'user_submitted',
      files: processedFiles
    });
    
    // Re-analizar disputa si está en nivel AI
    if (dispute.currentLevel === 'ai') {
      this.aiEngine.reanalyzeWithNewEvidence(disputeId, evidence.id);
    }
    
    return {
      evidenceId: evidence.id,
      status: 'submitted',
      message: 'Evidencia recibida y siendo procesada'
    };
  }
  
  // Aceptar resolución
  @Post(':id/accept-resolution')
  async acceptResolution(
    @Param('id') disputeId: string,
    @Body() acceptDto: AcceptResolutionDto,
    @CurrentUser() user: User
  ): Promise<AcceptanceResponse> {
    
    const dispute = await this.disputeService.findById(disputeId);
    const resolution = await this.disputeService.getCurrentResolution(disputeId);
    
    if (!resolution) {
      throw new BadRequestException('No hay resolución pendiente');
    }
    
    // Registrar aceptación
    await this.disputeService.recordAcceptance(resolution.id, user.id);
    
    // Verificar si ambas partes aceptaron
    const bothAccepted = await this.disputeService.checkBothPartiesAccepted(resolution.id);
    
    if (bothAccepted) {
      // Implementar resolución
      await this.disputeService.implementResolution(resolution.id);
      
      // Procesar pagos si corresponde
      if (resolution.compensationAmount) {
        await this.paymentService.processDisputeCompensation(resolution);
      }
      
      // Cerrar disputa
      await this.disputeService.closeDispute(disputeId, 'resolved_accepted');
    }
    
    return {
      accepted: true,
      awaitingOtherParty: !bothAccepted,
      nextSteps: bothAccepted ? ['Implementando resolución'] : ['Esperando aceptación de otra parte']
    };
  }
  
  // Apelar resolución
  @Post(':id/appeal')
  async appealResolution(
    @Param('id') disputeId: string,
    @Body() appealDto: AppealResolutionDto,
    @CurrentUser() user: User
  ): Promise<AppealResponse> {
    
    const dispute = await this.disputeService.findById(disputeId);
    const resolution = await this.disputeService.getCurrentResolution(disputeId);
    
    // Validar que se puede apelar
    await this.disputeService.validateAppealEligibility(resolution, user);
    
    // Crear apelación
    const appeal = await this.disputeService.createAppeal({
      disputeId,
      originalResolutionId: resolution.id,
      appellantId: user.id,
      ...appealDto
    });
    
    // Automáticamente escalar a nivel superior
    const nextLevel = this.escalationEngine.getNextLevel(dispute.currentLevel);
    await this.disputeService.escalateDispute(disputeId, nextLevel, 'appeal_submitted');
    
    return {
      appealId: appeal.id,
      status: 'submitted',
      estimatedReviewTime: '3-5 días hábiles',
      nextLevel: nextLevel
    };
  }
}

// DTOs para validación
export class CreateDisputeDto {
  @IsEnum(DisputeType)
  disputeType: DisputeType;
  
  @IsString()
  @MinLength(50)
  @MaxLength(2000)
  description: string;
  
  @IsOptional()
  @IsNumber()
  @Min(0)
  disputedAmount?: number;
  
  @IsOptional()
  @IsString()
  desiredOutcome?: string;
  
  @IsUUID()
  relatedProjectId?: string;
  
  @IsUUID()
  otherPartyId: string; // Freelancer o Client ID
}
```

### Integración con Sistema de Pagos

```typescript
// Integración con Stripe/MercadoPago para reversiones
@Injectable()
export class DisputePaymentService {
  
  constructor(
    private readonly stripeService: StripeService,
    private readonly mercadoPagoService: MercadoPagoService,
    private readonly disputeService: DisputeService
  ) {}
  
  async processDisputeCompensation(resolution: DisputeResolution): Promise<PaymentResult> {
    const dispute = await this.disputeService.findById(resolution.disputeId);
    
    switch (resolution.compensationTo) {
      case 'freelancer':
        return this.compensateFreelancer(dispute, resolution);
      case 'client':
        return this.refundClient(dispute, resolution);
      case 'both':
        return this.splitCompensation(dispute, resolution);
      default:
        return { success: true, message: 'No compensation required' };
    }
  }
  
  private async compensateFreelancer(
    dispute: Dispute, 
    resolution: DisputeResolution
  ): Promise<PaymentResult> {
    
    const freelancer = await this.userService.findById(dispute.freelancerId);
    const amount = resolution.compensationAmount;
    
    try {
      // Crear pago compensatorio
      const payment = await this.stripeService.createTransfer({
        amount: amount * 100, // Stripe usa centavos
        currency: 'ars',
        destination: freelancer.stripeAccountId,
        metadata: {
          disputeId: dispute.id,
          resolutionId: resolution.id,
          type: 'dispute_compensation'
        }
      });
      
      // Registrar en audit log
      await this.auditService.log({
        action: 'dispute_compensation_processed',
        userId: freelancer.id,
        resourceId: dispute.id,
        metadata: {
          amount,
          paymentId: payment.id,
          resolutionId: resolution.id
        }
      });
      
      return {
        success: true,
        paymentId: payment.id,
        amount,
        message: 'Compensación enviada al freelancer'
      };
      
    } catch (error) {
      // Log error y marcar resolución como fallida
      await this.disputeService.markResolutionFailed(
        resolution.id, 
        'payment_processing_failed',
        error.message
      );
      
      throw new PaymentProcessingException(
        'Error procesando compensación',
        error
      );
    }
  }
  
  private async refundClient(
    dispute: Dispute, 
    resolution: DisputeResolution
  ): Promise<PaymentResult> {
    
    const client = await this.userService.findById(dispute.clientId);
    const originalPayment = await this.paymentService.getOriginalPayment(dispute.projectId);
    
    if (!originalPayment) {
      throw new BadRequestException('No se encontró pago original para reembolsar');
    }
    
    try {
      // Crear refund parcial o total
      const refundAmount = Math.min(resolution.compensationAmount, originalPayment.amount);
      
      const refund = await this.stripeService.createRefund({
        charge: originalPayment.chargeId,
        amount: refundAmount * 100,
        metadata: {
          disputeId: dispute.id,
          resolutionId: resolution.id,
          type: 'dispute_refund'
        }
      });
      
      return {
        success: true,
        refundId: refund.id,
        amount: refundAmount,
        message: 'Reembolso procesado para el cliente'
      };
      
    } catch (error) {
      await this.disputeService.markResolutionFailed(
        resolution.id,
        'refund_processing_failed', 
        error.message
      );
      
      throw new PaymentProcessingException(
        'Error procesando reembolso',
        error
      );
    }
  }
}
```

---

## ⏱️ Timeline Targets & SLA

### Service Level Agreements

```typescript
// SLA definidos para el sistema
interface DisputeSLA {
  // Nivel AI
  ai: {
    responseTime: '2 horas máximo';
    resolutionTarget: '24-48 horas';
    confidenceThreshold: 0.70;
    successRate: '60% de casos';
  };
  
  // Nivel Human Mediation
  human: {
    assignmentTime: '4 horas máximo';
    firstContact: '24 horas máximo';
    resolutionTarget: '3-5 días hábiles';
    successRate: '85% de casos escalados';
  };
  
  // Nivel Professional Arbitration
  arbitration: {
    assignmentTime: '24 horas máximo';
    hearingScheduled: '48 horas máximo';
    resolutionTarget: '7-14 días hábiles';
    finalityRate: '99% (vinculante)';
  };
  
  // Appeal Process
  appeal: {
    reviewTime: '24 horas máximo';
    decisionTime: '72 horas máximo';
    implementationTime: '48 horas máximo';
  };
}

// Monitoring y alerting para SLA
@Injectable()
export class SLAMonitoringService {
  
  @Cron('0 */30 * * * *') // Cada 30 minutos
  async checkSLACompliance(): Promise<void> {
    await Promise.all([
      this.checkAISLACompliance(),
      this.checkHumanSLACompliance(),
      this.checkArbitrationSLACompliance(),
      this.checkAppealSLACompliance()
    ]);
  }
  
  private async checkAISLACompliance(): Promise<void> {
    const sla = new DisputeSLA();
    
    // Buscar disputas AI que exceden SLA
    const overdueAI = await this.disputeRepository.find({
      where: {
        currentLevel: 'ai',
        status: In(['submitted', 'ai_analyzing']),
        submittedAt: LessThan(new Date(Date.now() - 48 * 60 * 60 * 1000)) // 48h ago
      }
    });
    
    for (const dispute of overdueAI) {
      // Escalar automáticamente
      await this.escalationEngine.escalateToHuman(
        dispute.id, 
        'ai_sla_exceeded'
      );
      
      // Enviar alerta
      await this.alertingService.sendAlert({
        type: 'SLA_BREACH',
        level: 'WARNING',
        message: `AI SLA exceeded for dispute ${dispute.caseNumber}`,
        disputeId: dispute.id
      });
    }
  }
  
  private async checkHumanSLACompliance(): Promise<void> {
    // Verificar mediadores que no responden en tiempo
    const overdueHuman = await this.disputeRepository.find({
      where: {
        currentLevel: 'human',
        status: 'human_assigned',
        updatedAt: LessThan(new Date(Date.now() - 24 * 60 * 60 * 1000)) // 24h ago
      },
      relations: ['assignedMediator']
    });
    
    for (const dispute of overdueHuman) {
      // Re-asignar a otro mediador
      await this.mediatorService.reassignMediator(dispute.id, 'sla_breach');
      
      // Penalizar mediador original
      await this.mediatorService.recordSLABreach(dispute.assignedMediatorId);
    }
  }
}
```

---

## 📊 Metrics & Analytics

### Dashboard de Performance

```typescript
// Métricas para dashboard de administración
interface DisputeMetrics {
  // Volumen
  totalDisputes: number;
  disputesThisMonth: number;
  disputeGrowthRate: number;
  
  // Performance por nivel
  aiResolutionRate: number; // % resueltos en AI
  humanResolutionRate: number; // % resueltos en Human
  arbitrationRate: number; // % que llegan a arbitraje
  
  // Tiempos
  avgResolutionTimeAI: number; // horas
  avgResolutionTimeHuman: number; // días
  avgResolutionTimeArbitration: number; // días
  
  // Satisfacción
  userSatisfactionAI: number; // 1-5
  userSatisfactionHuman: number; // 1-5
  userSatisfactionArbitration: number; // 1-5
  
  // Financiero
  avgDisputeValue: number; // ARS
  totalCompensationPaid: number; // ARS
  costPerResolution: number; // ARS
  
  // Tipos de disputa
  disputeTypeBreakdown: Record<DisputeType, number>;
  escalationReasons: Record<string, number>;
}

@Injectable()
export class DisputeAnalyticsService {
  
  async generateMonthlyReport(): Promise<DisputeMetrics> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const [
      totalDisputes,
      disputesThisMonth,
      aiResolutions,
      humanResolutions,
      arbitrationCases,
      satisfactionScores,
      financialData
    ] = await Promise.all([
      this.getTotalDisputes(),
      this.getDisputesThisMonth(startOfMonth),
      this.getAIResolutionStats(),
      this.getHumanResolutionStats(),
      this.getArbitrationStats(),
      this.getSatisfactionScores(),
      this.getFinancialMetrics()
    ]);
    
    return {
      totalDisputes,
      disputesThisMonth,
      disputeGrowthRate: this.calculateGrowthRate(disputesThisMonth),
      
      aiResolutionRate: aiResolutions.successRate,
      humanResolutionRate: humanResolutions.successRate,
      arbitrationRate: arbitrationCases.rate,
      
      avgResolutionTimeAI: aiResolutions.avgTime,
      avgResolutionTimeHuman: humanResolutions.avgTime,
      avgResolutionTimeArbitration: arbitrationCases.avgTime,
      
      userSatisfactionAI: satisfactionScores.ai,
      userSatisfactionHuman: satisfactionScores.human,
      userSatisfactionArbitration: satisfactionScores.arbitration,
      
      avgDisputeValue: financialData.avgValue,
      totalCompensationPaid: financialData.totalCompensation,
      costPerResolution: financialData.avgCost,
      
      disputeTypeBreakdown: await this.getDisputeTypeBreakdown(),
      escalationReasons: await this.getEscalationReasons()
    };
  }
  
  // ML Analytics para mejora continua
  async analyzeDisputePatterns(): Promise<PatternAnalysis> {
    const disputes = await this.disputeRepository.find({
      where: {
        status: 'closed',
        resolvedAt: MoreThan(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)) // 90 días
      },
      relations: ['evidence', 'resolutions', 'freelancer', 'client']
    });
    
    // Análisis de patrones con ML
    const patterns = await this.mlAnalysisService.identifyPatterns(disputes);
    
    return {
      commonPatterns: patterns.common,
      emergingTrends: patterns.emerging,
      predictiveInsights: patterns.predictions,
      recommendedActions: patterns.recommendations
    };
  }
}
```

---

## 🚀 Implementation Roadmap

### Fase 1: Core Infrastructure (4 semanas)
```
Semana 1-2: Database Schema & Models
- ✅ Implementar tablas de disputas
- ✅ Crear modelos NestJS
- ✅ Setup relaciones con usuarios existentes

Semana 3-4: Basic API & Evidence Collection
- ✅ CRUD endpoints para disputas
- ✅ Sistema de recolección automática de evidencia
- ✅ Integración con audit logs existentes
```

### Fase 2: AI Engine (6 semanas)
```
Semana 5-8: ML Pipeline
- ✅ Algoritmos de scoring y pattern recognition
- ✅ Sentiment analysis de mensajes
- ✅ Integration con TensorFlow.js

Semana 9-10: Decision Engine
- ✅ Automated decision making
- ✅ Confidence scoring
- ✅ Escalation triggers
```

### Fase 3: Human & Arbitration (4 semanas)
```
Semana 11-12: Mediator System
- ✅ Mediator assignment algorithms
- ✅ Case management interface
- ✅ Communication tools

Semana 13-14: Arbitration Process
- ✅ Professional arbitrator network
- ✅ Hearing scheduling
- ✅ Legal compliance tools
```

### Fase 4: Integration & Testing (4 semanas)
```
Semana 15-16: Payment Integration
- ✅ Stripe/MercadoPago para compensaciones
- ✅ Automated refunds/transfers
- ✅ Financial audit trail

Semana 17-18: End-to-End Testing
- ✅ Complete user workflows
- ✅ Performance testing
- ✅ SLA monitoring setup
```

---

## 📝 Conclusiones

Este sistema de resolución de disputas para LaburAR combina:

1. **AI-First Approach**: 60% de casos resueltos automáticamente en 24-48h
2. **Human Expertise**: Mediación profesional para casos complejos
3. **Legal Compliance**: Cumplimiento específico con regulaciones argentinas
4. **Scalable Architecture**: Diseñado para crecer con la plataforma
5. **Evidence-Based**: Decisiones basadas en data real y precedentes

El sistema está optimizado para el mercado freelance argentino, considerando aspectos culturales, legales y económicos específicos del país, mientras mantiene estándares internacionales de calidad y eficiencia.