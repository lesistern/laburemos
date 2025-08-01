-- =====================================================
-- PROJECTS SCHEMA - LABURAR PLATFORM
-- =====================================================
-- Project management, proposals, milestones, and workflows
-- Phase 3: Project Management Implementation
-- =====================================================

-- Projects table - Main project management
CREATE TABLE projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    freelancer_id INT NULL, -- NULL until assigned
    service_id INT NULL, -- NULL for custom projects
    
    -- Basic Info
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    
    -- Project Classification
    category_id INT,
    complexity ENUM('simple', 'medium', 'complex', 'enterprise') DEFAULT 'medium',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    
    -- Budget & Pricing
    budget_type ENUM('fixed', 'hourly', 'milestone') NOT NULL,
    budget_amount DECIMAL(10,2),
    hourly_rate DECIMAL(8,2),
    currency VARCHAR(3) DEFAULT 'ARS',
    
    -- Timeline
    estimated_duration INT, -- in days
    start_date DATE,
    deadline DATE,
    completed_at DATETIME NULL,
    
    -- Project Status
    status ENUM('draft', 'posted', 'proposals_review', 'in_progress', 'review', 'completed', 'cancelled', 'disputed') DEFAULT 'draft',
    
    -- Deliverables & Files
    deliverables_description TEXT,
    source_files_required BOOLEAN DEFAULT FALSE,
    
    -- Revisions
    revisions_included INT DEFAULT 2,
    revisions_used INT DEFAULT 0,
    
    -- Communication
    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
    client_last_seen DATETIME,
    freelancer_last_seen DATETIME,
    
    -- Ratings (after completion)
    client_rating DECIMAL(2,1) NULL,
    freelancer_rating DECIMAL(2,1) NULL,
    client_review TEXT NULL,
    freelancer_review TEXT NULL,
    
    -- Meta
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_client (client_id),
    INDEX idx_freelancer (freelancer_id),
    INDEX idx_service (service_id),
    INDEX idx_status (status),
    INDEX idx_deadline (deadline),
    INDEX idx_created (created_at),
    INDEX idx_activity (last_activity),
    
    FOREIGN KEY (client_id) REFERENCES users(id),
    FOREIGN KEY (freelancer_id) REFERENCES users(id),
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES service_categories(id)
);

-- Project Proposals - Freelancer bids/proposals
CREATE TABLE project_proposals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    freelancer_id INT NOT NULL,
    
    -- Proposal Details
    cover_letter TEXT NOT NULL,
    proposed_budget DECIMAL(10,2) NOT NULL,
    proposed_timeline INT NOT NULL, -- in days
    
    -- Proposal Status
    status ENUM('submitted', 'withdrawn', 'accepted', 'rejected', 'negotiating') DEFAULT 'submitted',
    
    -- Negotiation
    negotiation_notes TEXT,
    client_feedback TEXT,
    
    -- Proposal Enhancements
    portfolio_items JSON, -- Array of portfolio item IDs
    similar_work_examples TEXT,
    questions_for_client TEXT,
    
    -- Meta
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP NULL,
    
    INDEX idx_project (project_id),
    INDEX idx_freelancer (freelancer_id),
    INDEX idx_status (status),
    INDEX idx_submitted (submitted_at),
    
    UNIQUE KEY unique_project_freelancer (project_id, freelancer_id),
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (freelancer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Project Milestones - Break projects into phases
CREATE TABLE project_milestones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    
    -- Milestone Details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    deliverables TEXT,
    
    -- Budget allocation
    amount DECIMAL(10,2) NOT NULL,
    percentage DECIMAL(5,2), -- percentage of total budget
    
    -- Timeline
    estimated_days INT,
    due_date DATE,
    completed_at DATETIME NULL,
    
    -- Status
    status ENUM('pending', 'in_progress', 'delivered', 'approved', 'revision_requested') DEFAULT 'pending',
    
    -- Order
    sort_order INT DEFAULT 0,
    
    -- Approval
    client_approved BOOLEAN DEFAULT FALSE,
    approval_date DATETIME NULL,
    revision_notes TEXT,
    
    -- Meta
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_project (project_id),
    INDEX idx_status (status),
    INDEX idx_due_date (due_date),
    INDEX idx_sort (sort_order),
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Project Files - File management for projects
CREATE TABLE project_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    milestone_id INT NULL,
    uploaded_by INT NOT NULL, -- user_id
    
    -- File Details
    original_name VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL, -- stored file name
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL, -- in bytes
    mime_type VARCHAR(100),
    
    -- File Classification
    file_type ENUM('requirement', 'deliverable', 'reference', 'revision', 'final') NOT NULL,
    is_source_file BOOLEAN DEFAULT FALSE,
    
    -- Versioning
    version VARCHAR(20) DEFAULT '1.0',
    previous_version_id INT NULL,
    
    -- Approval
    approved BOOLEAN DEFAULT FALSE,
    approved_by INT NULL,
    approved_at DATETIME NULL,
    
    -- Description
    description TEXT,
    
    -- Meta
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_project (project_id),
    INDEX idx_milestone (milestone_id),
    INDEX idx_uploaded_by (uploaded_by),
    INDEX idx_file_type (file_type),
    INDEX idx_uploaded_at (uploaded_at),
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (milestone_id) REFERENCES project_milestones(id) ON DELETE SET NULL,
    FOREIGN KEY (uploaded_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    FOREIGN KEY (previous_version_id) REFERENCES project_files(id)
);

-- Project Messages - Communication within projects
CREATE TABLE project_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    sender_id INT NOT NULL,
    
    -- Message Content
    message TEXT NOT NULL,
    message_type ENUM('text', 'file', 'milestone_update', 'system') DEFAULT 'text',
    
    -- File attachment (if any)
    attached_file_id INT NULL,
    
    -- Message Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at DATETIME NULL,
    
    -- System messages
    system_action VARCHAR(100) NULL, -- 'milestone_completed', 'payment_released', etc.
    system_data JSON NULL,
    
    -- Meta
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_project (project_id),
    INDEX idx_sender (sender_id),
    INDEX idx_sent_at (sent_at),
    INDEX idx_is_read (is_read),
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (attached_file_id) REFERENCES project_files(id) ON DELETE SET NULL
);

-- Project Timeline - Activity tracking
CREATE TABLE project_timeline (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    user_id INT NULL, -- NULL for system events
    
    -- Event Details
    event_type VARCHAR(50) NOT NULL,
    event_description TEXT NOT NULL,
    event_data JSON, -- Additional event metadata
    
    -- Related entities
    milestone_id INT NULL,
    file_id INT NULL,
    proposal_id INT NULL,
    
    -- Visibility
    visible_to_client BOOLEAN DEFAULT TRUE,
    visible_to_freelancer BOOLEAN DEFAULT TRUE,
    
    -- Meta
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_project (project_id),
    INDEX idx_user (user_id),
    INDEX idx_event_type (event_type),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (milestone_id) REFERENCES project_milestones(id) ON DELETE SET NULL,
    FOREIGN KEY (file_id) REFERENCES project_files(id) ON DELETE SET NULL,
    FOREIGN KEY (proposal_id) REFERENCES project_proposals(id) ON DELETE SET NULL
);

-- Project Invitations - Direct freelancer invitations
CREATE TABLE project_invitations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    freelancer_id INT NOT NULL,
    invited_by INT NOT NULL, -- client_id
    
    -- Invitation Details
    personal_message TEXT,
    custom_budget DECIMAL(10,2),
    custom_timeline INT, -- in days
    
    -- Status
    status ENUM('sent', 'viewed', 'accepted', 'declined', 'expired') DEFAULT 'sent',
    
    -- Response
    response_message TEXT,
    
    -- Timing
    expires_at DATETIME,
    responded_at DATETIME NULL,
    
    -- Meta
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_project (project_id),
    INDEX idx_freelancer (freelancer_id),
    INDEX idx_status (status),
    INDEX idx_expires_at (expires_at),
    
    UNIQUE KEY unique_project_freelancer_invitation (project_id, freelancer_id),
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (freelancer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Project Templates - Reusable project structures
CREATE TABLE project_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    created_by INT NOT NULL,
    category_id INT,
    
    -- Template Details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Template Structure
    milestones JSON, -- Array of milestone templates
    deliverables JSON, -- Standard deliverables list
    requirements_template TEXT,
    
    -- Pricing Guidelines
    suggested_budget_min DECIMAL(10,2),
    suggested_budget_max DECIMAL(10,2),
    suggested_timeline_days INT,
    
    -- Usage
    usage_count INT DEFAULT 0,
    is_public BOOLEAN DEFAULT FALSE,
    
    -- Meta
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_created_by (created_by),
    INDEX idx_category (category_id),
    INDEX idx_public (is_public),
    
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES service_categories(id)
);

-- Project Disputes - Conflict resolution
CREATE TABLE project_disputes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    initiated_by INT NOT NULL, -- user_id
    
    -- Dispute Details
    dispute_type ENUM('payment', 'quality', 'timeline', 'scope', 'communication', 'other') NOT NULL,
    description TEXT NOT NULL,
    evidence_files JSON, -- Array of file IDs
    
    -- Resolution
    status ENUM('open', 'investigating', 'resolved', 'escalated', 'closed') DEFAULT 'open',
    resolution TEXT,
    resolved_by INT NULL, -- admin user_id
    
    -- Outcome
    refund_amount DECIMAL(10,2) DEFAULT 0,
    additional_payment DECIMAL(10,2) DEFAULT 0,
    
    -- Timeline
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME NULL,
    
    INDEX idx_project (project_id),
    INDEX idx_initiated_by (initiated_by),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (initiated_by) REFERENCES users(id),
    FOREIGN KEY (resolved_by) REFERENCES users(id)
);

-- =====================================================
-- INITIAL DATA - PROJECT CATEGORIES & TEMPLATES
-- =====================================================

-- Default project complexity configurations
INSERT INTO project_templates (created_by, category_id, name, description, milestones, suggested_budget_min, suggested_budget_max, suggested_timeline_days, is_public) VALUES
-- Web Development Templates
(1, 1, 'Landing Page Simple', 'Página de aterrizaje básica con formulario de contacto', 
 '[{"title":"Diseño y Wireframes","percentage":20},{"title":"Desarrollo Frontend","percentage":50},{"title":"Implementación y Testing","percentage":30}]', 
 15000, 35000, 7, TRUE),

(1, 1, 'E-commerce Básico', 'Tienda online con carrito y pasarela de pagos', 
 '[{"title":"Planificación y Diseño","percentage":15},{"title":"Setup Base y Productos","percentage":25},{"title":"Carrito y Checkout","percentage":35},{"title":"Testing y Deploy","percentage":25}]', 
 80000, 200000, 21, TRUE),

(1, 1, 'Aplicación Web Completa', 'Sistema web con panel de administración', 
 '[{"title":"Análisis y Arquitectura","percentage":10},{"title":"Backend API","percentage":30},{"title":"Frontend Dashboard","percentage":35},{"title":"Integrations y Testing","percentage":25}]', 
 150000, 500000, 45, TRUE),

-- Design Templates
(1, 2, 'Identidad Visual Completa', 'Logo, papelería y manual de marca', 
 '[{"title":"Investigación y Concepto","percentage":25},{"title":"Propuestas de Logo","percentage":40},{"title":"Manual de Marca","percentage":35}]', 
 25000, 80000, 14, TRUE),

(1, 2, 'Diseño UI/UX App', 'Diseño completo de interfaz para aplicación móvil', 
 '[{"title":"Research y Wireframes","percentage":30},{"title":"Diseño Visual","percentage":45},{"title":"Prototipo Interactivo","percentage":25}]', 
 40000, 120000, 21, TRUE),

-- Marketing Templates
(1, 3, 'Campaña Digital Integral', 'Estrategia completa de marketing digital', 
 '[{"title":"Auditoría y Estrategia","percentage":20},{"title":"Creación de Contenido","percentage":40},{"title":"Implementación y Optimización","percentage":40}]', 
 30000, 100000, 30, TRUE),

(1, 3, 'SEO On-Page Completo', 'Optimización SEO integral del sitio web', 
 '[{"title":"Auditoría SEO","percentage":25},{"title":"Optimización Técnica","percentage":35},{"title":"Contenido y Keywords","percentage":40}]', 
 20000, 60000, 21, TRUE);

-- Project status workflow configurations
CREATE TABLE project_status_workflows (
    id INT AUTO_INCREMENT PRIMARY KEY,
    from_status VARCHAR(50) NOT NULL,
    to_status VARCHAR(50) NOT NULL,
    required_role ENUM('client', 'freelancer', 'admin', 'any') NOT NULL,
    conditions JSON, -- Additional conditions for transition
    automated BOOLEAN DEFAULT FALSE,
    
    INDEX idx_from_status (from_status),
    INDEX idx_to_status (to_status)
);

-- Define allowed status transitions
INSERT INTO project_status_workflows (from_status, to_status, required_role, automated) VALUES
-- Client actions
('draft', 'posted', 'client', FALSE),
('proposals_review', 'in_progress', 'client', FALSE),
('review', 'completed', 'client', FALSE),
('in_progress', 'cancelled', 'client', FALSE),

-- Freelancer actions
('in_progress', 'review', 'freelancer', FALSE),

-- System automated transitions
('posted', 'proposals_review', 'any', TRUE),
('completed', 'completed', 'any', TRUE),

-- Admin actions
('disputed', 'in_progress', 'admin', FALSE),
('disputed', 'cancelled', 'admin', FALSE),
('disputed', 'completed', 'admin', FALSE);

-- Create indexes for better performance
CREATE INDEX idx_projects_search ON projects(status, category_id, budget_amount, deadline);
CREATE INDEX idx_proposals_active ON project_proposals(status, submitted_at);
CREATE INDEX idx_milestones_active ON project_milestones(status, due_date);
CREATE INDEX idx_messages_unread ON project_messages(project_id, is_read, sent_at);
CREATE INDEX idx_timeline_recent ON project_timeline(project_id, created_at);

-- Create views for common queries
CREATE VIEW active_projects AS
SELECT p.*, 
       uc.first_name as client_first_name, uc.last_name as client_last_name,
       uf.first_name as freelancer_first_name, uf.last_name as freelancer_last_name,
       sc.name as category_name
FROM projects p
LEFT JOIN users uc ON p.client_id = uc.id
LEFT JOIN users uf ON p.freelancer_id = uf.id
LEFT JOIN service_categories sc ON p.category_id = sc.id
WHERE p.status IN ('posted', 'proposals_review', 'in_progress', 'review');

CREATE VIEW project_stats AS
SELECT project_id,
       COUNT(CASE WHEN pm.status = 'submitted' THEN 1 END) as proposals_count,
       COUNT(CASE WHEN pmil.status = 'completed' THEN 1 END) as completed_milestones,
       COUNT(pmil.id) as total_milestones,
       MAX(pmsg.sent_at) as last_message_at
FROM projects p
LEFT JOIN project_proposals pm ON p.id = pm.project_id
LEFT JOIN project_milestones pmil ON p.id = pmil.project_id
LEFT JOIN project_messages pmsg ON p.id = pmsg.project_id
GROUP BY p.id;