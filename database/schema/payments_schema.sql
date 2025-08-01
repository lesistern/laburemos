-- =====================================================
-- PAYMENTS SCHEMA - LABUREMOS PLATFORM
-- =====================================================
-- Payment system, transactions, escrow, and billing
-- Phase 4: Payment Management Implementation
-- MercadoPago integration for Argentina market
-- =====================================================

-- Payment Methods - Available payment options
CREATE TABLE payment_methods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    
    -- Payment Method Details
    method_type ENUM('mercadopago', 'bank_transfer', 'cash', 'crypto') NOT NULL,
    provider VARCHAR(50) DEFAULT 'mercadopago',
    
    -- MercadoPago specific
    mp_customer_id VARCHAR(100),
    mp_card_id VARCHAR(100),
    mp_payment_method_id VARCHAR(50),
    
    -- Card Information (tokenized)
    card_token VARCHAR(255),
    card_last_four VARCHAR(4),
    card_brand VARCHAR(20), -- visa, mastercard, etc.
    card_holder_name VARCHAR(255),
    expiration_month INT,
    expiration_year INT,
    
    -- Bank Transfer
    bank_name VARCHAR(100),
    account_type ENUM('savings', 'checking', 'business'),
    account_number_masked VARCHAR(50), -- masked for security
    account_holder_name VARCHAR(255),
    cbu_alias VARCHAR(50), -- CBU or Alias for Argentina
    
    -- Status & Verification
    is_verified BOOLEAN DEFAULT FALSE,
    is_default BOOLEAN DEFAULT FALSE,
    verification_status ENUM('pending', 'verified', 'failed', 'expired') DEFAULT 'pending',
    verification_date DATETIME NULL,
    
    -- Security
    fingerprint VARCHAR(64), -- Unique identifier for duplicate detection
    
    -- Meta
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    INDEX idx_user (user_id),
    INDEX idx_type (method_type),
    INDEX idx_verified (is_verified),
    INDEX idx_default (is_default, user_id),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Transactions - All financial movements
CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Related Entities
    project_id INT NULL,
    milestone_id INT NULL,
    payer_id INT NOT NULL, -- user_id who pays
    payee_id INT NOT NULL, -- user_id who receives
    
    -- Transaction Details
    transaction_type ENUM('payment', 'refund', 'commission', 'withdrawal', 'deposit', 'fee', 'bonus') NOT NULL,
    amount DECIMAL(12,2) NOT NULL, -- Total amount
    currency VARCHAR(3) DEFAULT 'ARS',
    
    -- Platform Fees
    platform_fee_percentage DECIMAL(5,2) DEFAULT 5.00, -- LABUREMOS commission %
    platform_fee_amount DECIMAL(10,2) NOT NULL,
    net_amount DECIMAL(12,2) NOT NULL, -- Amount after fees
    
    -- Payment Processing
    payment_method_id INT NULL,
    payment_provider ENUM('mercadopago', 'bank_transfer', 'manual', 'system') DEFAULT 'mercadopago',
    
    -- Status Tracking
    status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'disputed') DEFAULT 'pending',
    
    -- MercadoPago Integration
    mp_payment_id VARCHAR(100), -- MercadoPago payment ID
    mp_preference_id VARCHAR(100), -- MercadoPago preference ID
    mp_merchant_order_id VARCHAR(100),
    mp_status VARCHAR(50), -- MercadoPago status
    mp_status_detail VARCHAR(100),
    mp_payment_type VARCHAR(50),
    mp_operation_type VARCHAR(50),
    
    -- Additional Data
    description TEXT,
    metadata JSON, -- Additional transaction data
    
    -- Fraud Prevention
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_fingerprint VARCHAR(64),
    risk_score DECIMAL(3,2) DEFAULT 0.00, -- 0.00 to 1.00
    fraud_check_status ENUM('passed', 'review', 'failed', 'skipped') DEFAULT 'skipped',
    
    -- Timeline
    initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    failed_at TIMESTAMP NULL,
    
    -- Meta
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_project (project_id),
    INDEX idx_milestone (milestone_id),
    INDEX idx_payer (payer_id),
    INDEX idx_payee (payee_id),
    INDEX idx_status (status),
    INDEX idx_type (transaction_type),
    INDEX idx_provider (payment_provider),
    INDEX idx_mp_payment (mp_payment_id),
    INDEX idx_created (created_at),
    INDEX idx_amount (amount),
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    FOREIGN KEY (milestone_id) REFERENCES project_milestones(id) ON DELETE SET NULL,
    FOREIGN KEY (payer_id) REFERENCES users(id),
    FOREIGN KEY (payee_id) REFERENCES users(id),
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE SET NULL
);

-- Escrow - Hold payments until milestone completion
CREATE TABLE escrow_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Related Project/Milestone
    project_id INT NOT NULL,
    milestone_id INT NULL, -- NULL for full project payment
    
    -- Participants
    client_id INT NOT NULL,
    freelancer_id INT NOT NULL,
    
    -- Amounts
    total_amount DECIMAL(12,2) NOT NULL,
    platform_fee DECIMAL(10,2) NOT NULL,
    freelancer_amount DECIMAL(12,2) NOT NULL, -- Amount freelancer will receive
    
    -- Status
    status ENUM('active', 'released', 'refunded', 'disputed', 'cancelled') DEFAULT 'active',
    
    -- Conditions for Release
    auto_release_days INT DEFAULT 7, -- Auto-release if no action taken
    release_conditions JSON, -- Custom release conditions
    
    -- Timeline
    funded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    release_requested_at TIMESTAMP NULL,
    released_at TIMESTAMP NULL,
    auto_release_at TIMESTAMP NULL, -- Calculated release date
    
    -- Dispute Handling
    dispute_id INT NULL,
    dispute_freeze BOOLEAN DEFAULT FALSE,
    
    -- Meta
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_project (project_id),
    INDEX idx_milestone (milestone_id),
    INDEX idx_client (client_id),
    INDEX idx_freelancer (freelancer_id),
    INDEX idx_status (status),
    INDEX idx_auto_release (auto_release_at),
    
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (milestone_id) REFERENCES project_milestones(id) ON DELETE SET NULL,
    FOREIGN KEY (client_id) REFERENCES users(id),
    FOREIGN KEY (freelancer_id) REFERENCES users(id)
);

-- Escrow Transactions - Movements within escrow
CREATE TABLE escrow_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    escrow_id INT NOT NULL,
    transaction_id INT NOT NULL,
    
    -- Transaction Type within Escrow
    escrow_action ENUM('fund', 'release', 'partial_release', 'refund', 'dispute_hold', 'dispute_release') NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    
    -- Approval/Authorization
    authorized_by INT NULL, -- user_id who authorized this action
    authorization_reason TEXT,
    requires_approval BOOLEAN DEFAULT FALSE,
    approved_by INT NULL,
    approved_at TIMESTAMP NULL,
    
    -- Meta
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_escrow (escrow_id),
    INDEX idx_transaction (transaction_id),
    INDEX idx_action (escrow_action),
    INDEX idx_authorized_by (authorized_by),
    
    FOREIGN KEY (escrow_id) REFERENCES escrow_accounts(id),
    FOREIGN KEY (transaction_id) REFERENCES transactions(id),
    FOREIGN KEY (authorized_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- Withdrawals - User withdrawal requests
CREATE TABLE withdrawals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    
    -- Amount Details
    requested_amount DECIMAL(10,2) NOT NULL,
    available_balance DECIMAL(10,2) NOT NULL, -- Balance at time of request
    processing_fee DECIMAL(8,2) DEFAULT 0.00,
    final_amount DECIMAL(10,2) NOT NULL, -- Amount after fees
    currency VARCHAR(3) DEFAULT 'ARS',
    
    -- Withdrawal Method
    withdrawal_method ENUM('mercadopago', 'bank_transfer', 'cash_pickup') DEFAULT 'mercadopago',
    payment_method_id INT NULL, -- Reference to user's payment method
    
    -- Bank Transfer Details
    bank_details JSON, -- Bank account information
    
    -- Status & Processing
    status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    
    -- Processing Info
    processed_by INT NULL, -- admin user_id
    processing_notes TEXT,
    failure_reason TEXT,
    
    -- External References
    mp_transfer_id VARCHAR(100), -- MercadoPago transfer ID
    bank_reference VARCHAR(100), -- Bank transfer reference
    
    -- Timeline
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    
    -- Meta
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_method (withdrawal_method),
    INDEX idx_requested (requested_at),
    INDEX idx_amount (requested_amount),
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE SET NULL,
    FOREIGN KEY (processed_by) REFERENCES users(id)
);

-- User Balances - Track user account balances
CREATE TABLE user_balances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    
    -- Balance Details
    available_balance DECIMAL(12,2) DEFAULT 0.00, -- Available for withdrawal
    pending_balance DECIMAL(12,2) DEFAULT 0.00, -- In escrow or processing
    total_earned DECIMAL(12,2) DEFAULT 0.00, -- Lifetime earnings
    total_spent DECIMAL(12,2) DEFAULT 0.00, -- Lifetime spending
    
    -- Platform Stats
    total_fees_paid DECIMAL(10,2) DEFAULT 0.00,
    successful_transactions INT DEFAULT 0,
    failed_transactions INT DEFAULT 0,
    
    -- Currency
    currency VARCHAR(3) DEFAULT 'ARS',
    
    -- Last Activity
    last_transaction_at TIMESTAMP NULL,
    last_withdrawal_at TIMESTAMP NULL,
    
    -- Meta
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user (user_id),
    INDEX idx_available_balance (available_balance),
    INDEX idx_last_transaction (last_transaction_at),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Invoices - Billing and invoicing system
CREATE TABLE invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Invoice Numbers
    invoice_number VARCHAR(50) NOT NULL UNIQUE, -- LAB-2025-000001
    internal_reference VARCHAR(50),
    
    -- Related Entities
    project_id INT NULL,
    transaction_id INT NULL,
    client_id INT NOT NULL,
    freelancer_id INT NULL,
    
    -- Invoice Details
    invoice_type ENUM('project', 'milestone', 'service', 'refund', 'fee') NOT NULL,
    description TEXT NOT NULL,
    
    -- Amounts
    subtotal DECIMAL(10,2) NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 0.00, -- IVA rate
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'ARS',
    
    -- Status
    status ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded') DEFAULT 'draft',
    
    -- Dates
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE NULL,
    
    -- Payment Info
    payment_terms VARCHAR(100) DEFAULT 'Pago inmediato',
    payment_instructions TEXT,
    
    -- AFIP Integration (Argentina Tax Authority)
    afip_cae VARCHAR(50), -- Código de Autorización Electrónico
    afip_cae_due_date DATE,
    afip_status ENUM('pending', 'authorized', 'rejected', 'cancelled'),
    
    -- PDF Generation
    pdf_generated BOOLEAN DEFAULT FALSE,
    pdf_path VARCHAR(500),
    pdf_generated_at TIMESTAMP NULL,
    
    -- Notes
    notes TEXT,
    internal_notes TEXT,
    
    -- Meta
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_invoice_number (invoice_number),
    INDEX idx_project (project_id),
    INDEX idx_transaction (transaction_id),
    INDEX idx_client (client_id),
    INDEX idx_freelancer (freelancer_id),
    INDEX idx_status (status),
    INDEX idx_issue_date (issue_date),
    INDEX idx_due_date (due_date),
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL,
    FOREIGN KEY (client_id) REFERENCES users(id),
    FOREIGN KEY (freelancer_id) REFERENCES users(id)
);

-- Invoice Line Items - Detailed billing items
CREATE TABLE invoice_line_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    
    -- Line Item Details
    description TEXT NOT NULL,
    quantity DECIMAL(8,2) DEFAULT 1.00,
    unit_price DECIMAL(10,2) NOT NULL,
    line_total DECIMAL(10,2) NOT NULL,
    
    -- References
    project_milestone_id INT NULL,
    service_description TEXT,
    
    -- Order
    sort_order INT DEFAULT 0,
    
    -- Meta
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_invoice (invoice_id),
    INDEX idx_milestone (project_milestone_id),
    
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (project_milestone_id) REFERENCES project_milestones(id) ON DELETE SET NULL
);

-- Payment Disputes - Handle payment conflicts
CREATE TABLE payment_disputes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Related Entities
    transaction_id INT NOT NULL,
    project_id INT NULL,
    escrow_id INT NULL,
    
    -- Dispute Participants
    initiated_by INT NOT NULL, -- user_id who started dispute
    defendant_id INT NOT NULL, -- other party in dispute
    
    -- Dispute Details
    dispute_type ENUM('payment_not_received', 'service_not_delivered', 'quality_issue', 'unauthorized_charge', 'refund_request', 'other') NOT NULL,
    dispute_reason TEXT NOT NULL,
    amount_disputed DECIMAL(10,2) NOT NULL,
    
    -- Evidence
    evidence_files JSON, -- Array of file IDs/URLs
    evidence_description TEXT,
    
    -- Status
    status ENUM('open', 'investigating', 'resolved', 'escalated', 'closed') DEFAULT 'open',
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    
    -- Resolution
    resolution_type ENUM('full_refund', 'partial_refund', 'no_refund', 'additional_payment', 'service_completion', 'mediation') NULL,
    resolution_description TEXT,
    resolution_amount DECIMAL(10,2) NULL,
    resolved_by INT NULL, -- admin user_id
    
    -- Communication
    last_response_by INT NULL,
    last_response_at TIMESTAMP NULL,
    
    -- Timeline
    opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    escalated_at TIMESTAMP NULL,
    
    -- Meta
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_transaction (transaction_id),
    INDEX idx_project (project_id),
    INDEX idx_escrow (escrow_id),
    INDEX idx_initiated_by (initiated_by),
    INDEX idx_defendant (defendant_id),
    INDEX idx_status (status),
    INDEX idx_type (dispute_type),
    INDEX idx_opened (opened_at),
    
    FOREIGN KEY (transaction_id) REFERENCES transactions(id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    FOREIGN KEY (escrow_id) REFERENCES escrow_accounts(id) ON DELETE SET NULL,
    FOREIGN KEY (initiated_by) REFERENCES users(id),
    FOREIGN KEY (defendant_id) REFERENCES users(id),
    FOREIGN KEY (resolved_by) REFERENCES users(id)
);

-- Platform Configuration - Payment system settings
CREATE TABLE payment_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    config_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    
    -- Security
    is_encrypted BOOLEAN DEFAULT FALSE,
    requires_admin BOOLEAN DEFAULT TRUE,
    
    -- Meta
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_key (config_key)
);

-- =====================================================
-- INITIAL CONFIGURATION DATA
-- =====================================================

-- Platform payment configuration
INSERT INTO payment_config (config_key, config_value, config_type, description) VALUES
('platform_fee_percentage', '5.00', 'number', 'Platform commission percentage'),
('min_withdrawal_amount', '1000.00', 'number', 'Minimum withdrawal amount in ARS'),
('max_withdrawal_amount', '500000.00', 'number', 'Maximum withdrawal amount in ARS'),
('withdrawal_processing_fee', '50.00', 'number', 'Fee for processing withdrawals'),
('auto_release_days', '7', 'number', 'Days before automatic escrow release'),
('max_dispute_days', '30', 'number', 'Maximum days to open a dispute'),
('invoice_due_days', '30', 'number', 'Default invoice due date days'),
('tax_rate_default', '21.00', 'number', 'Default IVA rate percentage'),

-- MercadoPago configuration (encrypted)
('mp_access_token', '', 'string', 'MercadoPago access token'),
('mp_public_key', '', 'string', 'MercadoPago public key'),
('mp_webhook_secret', '', 'string', 'MercadoPago webhook secret'),
('mp_environment', 'sandbox', 'string', 'MercadoPago environment (sandbox/production)'),

-- Fraud prevention
('max_transaction_amount', '1000000.00', 'number', 'Maximum transaction amount'),
('fraud_check_enabled', 'true', 'boolean', 'Enable fraud checking'),
('risk_threshold', '0.75', 'number', 'Risk score threshold for blocking'),

-- Email notifications
('payment_email_enabled', 'true', 'boolean', 'Send payment email notifications'),
('invoice_email_enabled', 'true', 'boolean', 'Send invoice email notifications'),
('dispute_email_enabled', 'true', 'boolean', 'Send dispute email notifications');

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Complex queries indexes
CREATE INDEX idx_transactions_user_status ON transactions(payer_id, status, created_at);
CREATE INDEX idx_transactions_payee_status ON transactions(payee_id, status, created_at);
CREATE INDEX idx_escrow_release_pending ON escrow_accounts(status, auto_release_at);
CREATE INDEX idx_invoices_client_status ON invoices(client_id, status, issue_date);
CREATE INDEX idx_withdrawals_pending ON withdrawals(status, requested_at);
CREATE INDEX idx_disputes_open ON payment_disputes(status, opened_at);

-- Financial reporting indexes
CREATE INDEX idx_transactions_reporting ON transactions(transaction_type, status, completed_at);
CREATE INDEX idx_revenue_analysis ON transactions(platform_fee_amount, completed_at);
CREATE INDEX idx_user_financial_activity ON transactions(payer_id, payee_id, completed_at);

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- User financial summary
CREATE VIEW user_financial_summary AS
SELECT 
    u.id as user_id,
    u.email,
    ub.available_balance,
    ub.pending_balance,
    ub.total_earned,
    ub.total_spent,
    COUNT(t_paid.id) as payments_made,
    COUNT(t_received.id) as payments_received,
    COUNT(w.id) as withdrawal_requests,
    COUNT(d.id) as disputes_initiated
FROM users u
LEFT JOIN user_balances ub ON u.id = ub.user_id
LEFT JOIN transactions t_paid ON u.id = t_paid.payer_id AND t_paid.status = 'completed'
LEFT JOIN transactions t_received ON u.id = t_received.payee_id AND t_received.status = 'completed'
LEFT JOIN withdrawals w ON u.id = w.user_id
LEFT JOIN payment_disputes d ON u.id = d.initiated_by
GROUP BY u.id, u.email, ub.available_balance, ub.pending_balance, ub.total_earned, ub.total_spent;

-- Active escrow accounts
CREATE VIEW active_escrow_summary AS
SELECT 
    ea.id,
    ea.project_id,
    p.title as project_title,
    ea.total_amount,
    ea.freelancer_amount,
    ea.auto_release_at,
    uc.first_name as client_first_name,
    uc.last_name as client_last_name,
    uf.first_name as freelancer_first_name,
    uf.last_name as freelancer_last_name,
    DATEDIFF(ea.auto_release_at, NOW()) as days_until_release
FROM escrow_accounts ea
JOIN projects p ON ea.project_id = p.id
JOIN users uc ON ea.client_id = uc.id
JOIN users uf ON ea.freelancer_id = uf.id
WHERE ea.status = 'active';

-- Transaction analytics
CREATE VIEW transaction_analytics AS
SELECT 
    DATE(completed_at) as transaction_date,
    transaction_type,
    COUNT(*) as transaction_count,
    SUM(amount) as total_amount,
    SUM(platform_fee_amount) as total_fees,
    AVG(amount) as avg_transaction_amount
FROM transactions 
WHERE status = 'completed' 
AND completed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(completed_at), transaction_type;

-- =====================================================
-- TRIGGERS FOR AUTOMATIC BALANCE UPDATES
-- =====================================================

DELIMITER $$

-- Update user balance when transaction completes
CREATE TRIGGER update_user_balance_on_transaction
AFTER UPDATE ON transactions
FOR EACH ROW
BEGIN
    -- If transaction status changed to completed
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        
        -- Update payer balance (subtract)
        INSERT INTO user_balances (user_id, total_spent, successful_transactions)
        VALUES (NEW.payer_id, NEW.amount, 1)
        ON DUPLICATE KEY UPDATE
            total_spent = total_spent + NEW.amount,
            successful_transactions = successful_transactions + 1,
            last_transaction_at = NOW();
            
        -- Update payee balance (add)
        INSERT INTO user_balances (user_id, total_earned, successful_transactions)
        VALUES (NEW.payee_id, NEW.net_amount, 1)
        ON DUPLICATE KEY UPDATE
            available_balance = available_balance + NEW.net_amount,
            total_earned = total_earned + NEW.net_amount,
            successful_transactions = successful_transactions + 1,
            last_transaction_at = NOW();
            
    END IF;
    
    -- If transaction failed
    IF NEW.status = 'failed' AND OLD.status != 'failed' THEN
        
        -- Update failed transaction count for payer
        INSERT INTO user_balances (user_id, failed_transactions)
        VALUES (NEW.payer_id, 1)
        ON DUPLICATE KEY UPDATE
            failed_transactions = failed_transactions + 1;
            
    END IF;
END$$

-- Update balance when escrow is released
CREATE TRIGGER update_balance_on_escrow_release
AFTER UPDATE ON escrow_accounts
FOR EACH ROW
BEGIN
    IF NEW.status = 'released' AND OLD.status != 'released' THEN
        -- Move from pending to available balance
        UPDATE user_balances 
        SET 
            available_balance = available_balance + NEW.freelancer_amount,
            pending_balance = pending_balance - NEW.freelancer_amount
        WHERE user_id = NEW.freelancer_id;
    END IF;
END$$

-- Create user balance record when user is created
CREATE TRIGGER create_user_balance
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    INSERT INTO user_balances (user_id) VALUES (NEW.id);
END$$

DELIMITER ;

-- =====================================================
-- STORED PROCEDURES FOR COMMON OPERATIONS
-- =====================================================

DELIMITER $$

-- Create a new escrow account
CREATE PROCEDURE CreateEscrowAccount(
    IN p_project_id INT,
    IN p_milestone_id INT,
    IN p_client_id INT,
    IN p_freelancer_id INT,
    IN p_total_amount DECIMAL(12,2),
    IN p_platform_fee DECIMAL(10,2)
)
BEGIN
    DECLARE v_freelancer_amount DECIMAL(12,2);
    
    SET v_freelancer_amount = p_total_amount - p_platform_fee;
    
    INSERT INTO escrow_accounts (
        project_id, milestone_id, client_id, freelancer_id,
        total_amount, platform_fee, freelancer_amount,
        auto_release_at
    ) VALUES (
        p_project_id, p_milestone_id, p_client_id, p_freelancer_id,
        p_total_amount, p_platform_fee, v_freelancer_amount,
        DATE_ADD(NOW(), INTERVAL 7 DAY)
    );
    
    -- Update freelancer pending balance
    UPDATE user_balances 
    SET pending_balance = pending_balance + v_freelancer_amount 
    WHERE user_id = p_freelancer_id;
END$$

-- Process automatic escrow releases
CREATE PROCEDURE ProcessAutoReleases()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_escrow_id INT;
    DECLARE v_freelancer_id INT;
    DECLARE v_amount DECIMAL(12,2);
    
    DECLARE escrow_cursor CURSOR FOR 
        SELECT id, freelancer_id, freelancer_amount 
        FROM escrow_accounts 
        WHERE status = 'active' 
        AND auto_release_at <= NOW()
        AND dispute_freeze = FALSE;
        
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN escrow_cursor;
    
    release_loop: LOOP
        FETCH escrow_cursor INTO v_escrow_id, v_freelancer_id, v_amount;
        IF done THEN
            LEAVE release_loop;
        END IF;
        
        -- Release the escrow
        UPDATE escrow_accounts 
        SET status = 'released', released_at = NOW()
        WHERE id = v_escrow_id;
        
        -- Update freelancer balance (handled by trigger)
        
    END LOOP;
    
    CLOSE escrow_cursor;
END$$

DELIMITER ;

-- =====================================================
-- FINAL NOTES
-- =====================================================

-- This schema provides:
-- 1. Complete payment processing with MercadoPago
-- 2. Escrow system for secure transactions
-- 3. User balance management
-- 4. Invoice generation and tracking
-- 5. Dispute resolution system
-- 6. Withdrawal processing
-- 7. Fraud prevention measures
-- 8. Financial analytics and reporting
-- 9. AFIP integration for Argentina compliance
-- 10. Automatic balance updates via triggers