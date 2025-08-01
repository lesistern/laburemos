-- =============================================
-- CORE USERS & AUTHENTICATION
-- =============================================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_type VARCHAR(50) NOT NULL, -- Consider using an ENUM type if supported by your PostgreSQL version, or a CHECK constraint
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    phone VARCHAR(50),
    country VARCHAR(255),
    city VARCHAR(255),
    profile_image TEXT,
    status VARCHAR(50) NOT NULL, -- Consider using an ENUM type or CHECK constraint
    email_verified_at TIMESTAMP WITHOUT TIME ZONE,
    phone_verified_at TIMESTAMP WITHOUT TIME ZONE,
    last_active TIMESTAMP WITHOUT TIME ZONE,
    is_online BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_info JSONB,
    expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    last_activity TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE password_resets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    ip_address VARCHAR(45),
    is_revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE freelancer_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL,
    bio TEXT,
    title VARCHAR(255),
    hourly_rate DECIMAL(10, 2),
    availability VARCHAR(50), -- Consider using an ENUM type or CHECK constraint
    timezone VARCHAR(50),
    portfolio_url TEXT,
    languages JSONB,
    certifications JSONB,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- SKILLS SYSTEM
-- =============================================

CREATE TABLE skills (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(255),
    subcategory VARCHAR(255),
    description TEXT,
    is_trending BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE freelancer_skills (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    skill_id INTEGER NOT NULL,
    proficiency_level VARCHAR(50), -- Consider using an ENUM type or CHECK constraint
    years_experience INTEGER,
    endorsed_count INTEGER DEFAULT 0,
    hourly_rate_skill DECIMAL(10, 2),
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, skill_id)
);

CREATE TABLE portfolio_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INTEGER,
    project_url VARCHAR(255),
    media_files JSONB,
    technologies_used JSONB,
    completion_date DATE,
    client_name VARCHAR(255),
    project_value DECIMAL(15, 2),
    is_featured BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- CATEGORIES & SERVICES
-- =============================================

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(255),
    color VARCHAR(50),
    parent_id INTEGER,
    sort_order INTEGER DEFAULT 0,
    level INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    base_price DECIMAL(10, 2) NOT NULL,
    delivery_time INTEGER,
    requirements TEXT,
    gallery_images JSONB,
    faq JSONB,
    extras JSONB,
    total_orders INTEGER DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE service_packages (
    id SERIAL PRIMARY KEY,
    service_id INTEGER NOT NULL,
    package_type VARCHAR(50), -- Consider using an ENUM type or CHECK constraint
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    delivery_time INTEGER,
    features JSONB,
    max_revisions INTEGER,
    extras_included JSONB,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- PROJECTS & PROPOSALS
-- =============================================

CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL,
    freelancer_id INTEGER,
    category_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    budget_min DECIMAL(15, 2),
    budget_max DECIMAL(15, 2),
    budget_type VARCHAR(50), -- Consider using an ENUM type or CHECK constraint
    deadline DATE,
    status VARCHAR(50) NOT NULL, -- Consider using an ENUM type or CHECK constraint
    required_skills JSONB,
    experience_level VARCHAR(50), -- Consider using an ENUM type or CHECK constraint
    proposal_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    is_urgent BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITHOUT TIME ZONE,
    completed_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE proposals (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    freelancer_id INTEGER NOT NULL,
    service_package_id INTEGER,
    cover_letter TEXT,
    proposed_amount DECIMAL(15, 2) NOT NULL,
    proposed_timeline INTEGER,
    milestones JSONB,
    attachments JSONB,
    status VARCHAR(50) NOT NULL, -- Consider using an ENUM type or CHECK constraint
    client_viewed_at TIMESTAMP WITHOUT TIME ZONE,
    responded_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE project_milestones (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(15, 2) NOT NULL,
    due_date DATE,
    status VARCHAR(50) NOT NULL, -- Consider using an ENUM type or CHECK constraint
    deliverables JSONB,
    completed_at TIMESTAMP WITHOUT TIME ZONE,
    approved_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- COMMUNICATION SYSTEM
-- =============================================

CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    project_id INTEGER,
    participant_1_id INTEGER NOT NULL,
    participant_2_id INTEGER NOT NULL,
    last_message_id INTEGER,
    last_message_at TIMESTAMP WITHOUT TIME ZONE,
    unread_count_p1 INTEGER DEFAULT 0,
    unread_count_p2 INTEGER DEFAULT 0,
    is_archived_p1 BOOLEAN DEFAULT FALSE,
    is_archived_p2 BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    message_content TEXT,
    message_type VARCHAR(50), -- Consider using an ENUM type or CHECK constraint
    attachments JSONB,
    metadata JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITHOUT TIME ZONE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE video_calls (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL,
    initiator_id INTEGER NOT NULL,
    room_id VARCHAR(255) UNIQUE NOT NULL,
    duration_minutes INTEGER,
    status VARCHAR(50), -- Consider using an ENUM type or CHECK constraint
    recording_url JSONB,
    scheduled_at TIMESTAMP WITHOUT TIME ZONE,
    started_at TIMESTAMP WITHOUT TIME ZONE,
    ended_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- PAYMENTS SYSTEM
-- =============================================

CREATE TABLE wallets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL,
    available_balance DECIMAL(15, 2) DEFAULT 0.00,
    pending_balance DECIMAL(15, 2) DEFAULT 0.00,
    escrow_balance DECIMAL(15, 2) DEFAULT 0.00,
    lifetime_earnings DECIMAL(15, 2) DEFAULT 0.00,
    lifetime_spent DECIMAL(15, 2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'USD',
    last_transaction_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payment_methods (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL, -- Consider using an ENUM type or CHECK constraint
    provider VARCHAR(255),
    external_id VARCHAR(255),
    last_four VARCHAR(4),
    brand VARCHAR(255),
    billing_details JSONB,
    is_default BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    metadata JSONB,
    verified_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    from_user_id INTEGER,
    to_user_id INTEGER,
    project_id INTEGER,
    milestone_id INTEGER,
    transaction_id VARCHAR(255) UNIQUE NOT NULL,
    external_transaction_id VARCHAR(255),
    type VARCHAR(50) NOT NULL, -- Consider using an ENUM type or CHECK constraint
    amount DECIMAL(15, 2) NOT NULL,
    fee_amount DECIMAL(15, 2) DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL,
    status VARCHAR(50) NOT NULL, -- Consider using an ENUM type or CHECK constraint
    payment_method VARCHAR(255),
    gateway VARCHAR(255),
    gateway_response JSONB,
    metadata JSONB,
    description TEXT,
    processed_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE escrow_accounts (
    id SERIAL PRIMARY KEY,
    project_id INTEGER UNIQUE NOT NULL,
    milestone_id INTEGER,
    client_id INTEGER NOT NULL,
    freelancer_id INTEGER NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    fee_amount DECIMAL(15, 2) DEFAULT 0.00,
    status VARCHAR(50) NOT NULL, -- Consider using an ENUM type or CHECK constraint
    release_conditions TEXT,
    funded_at TIMESTAMP WITHOUT TIME ZONE,
    released_at TIMESTAMP WITHOUT TIME ZONE,
    expires_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE withdrawal_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    fee_amount DECIMAL(15, 2) DEFAULT 0.00,
    payment_method_id INTEGER,
    payment_details JSONB,
    status VARCHAR(50) NOT NULL, -- Consider using an ENUM type or CHECK constraint
    admin_notes TEXT,
    processed_by_admin_id INTEGER,
    processed_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- REVIEWS & REPUTATION
-- =============================================

CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    reviewer_id INTEGER NOT NULL,
    reviewee_id INTEGER NOT NULL,
    reviewer_type VARCHAR(50), -- Consider using an ENUM type or CHECK constraint
    rating INTEGER NOT NULL,
    comment TEXT,
    criteria_ratings JSONB,
    pros_cons JSONB,
    is_public BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE review_responses (
    id SERIAL PRIMARY KEY,
    review_id INTEGER UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    response TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_reputation (
    user_id INTEGER PRIMARY KEY,
    overall_rating DECIMAL(3, 2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    completed_projects INTEGER DEFAULT 0,
    success_rate DECIMAL(5, 2) DEFAULT 0.00,
    response_time_avg_hours INTEGER,
    client_satisfaction DECIMAL(5, 2) DEFAULT 0.00,
    quality_score DECIMAL(5, 2) DEFAULT 0.00,
    professionalism_score DECIMAL(5, 2) DEFAULT 0.00,
    communication_score DECIMAL(5, 2) DEFAULT 0.00,
    total_earnings INTEGER DEFAULT 0,
    repeat_clients INTEGER DEFAULT 0,
    last_calculated TIMESTAMP WITHOUT TIME ZONE,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- GAMIFICATION SYSTEM
-- =============================================

CREATE TABLE badge_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(255),
    color VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE badges (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(255),
    rarity VARCHAR(50), -- Consider using an ENUM type or CHECK constraint
    requirements JSONB,
    rewards JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    is_automatic BOOLEAN DEFAULT FALSE,
    earned_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_badges (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    badge_id INTEGER NOT NULL,
    earned_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    progress_data JSONB,
    is_featured BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT TRUE,
    earn_description TEXT,
    UNIQUE (user_id, badge_id)
);

CREATE TABLE badge_milestones (
    id SERIAL PRIMARY KEY,
    badge_id INTEGER NOT NULL,
    milestone_name VARCHAR(255) NOT NULL,
    requirements JSONB,
    sort_order INTEGER DEFAULT 0,
    progress_weight DECIMAL(5, 2),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- FILE MANAGEMENT
-- =============================================

CREATE TABLE file_uploads (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    entity_type VARCHAR(50), -- e.g., 'project', 'message', 'profile'
    entity_id INTEGER,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    file_size INTEGER,
    mime_type VARCHAR(255),
    storage_provider VARCHAR(50), -- e.g., 's3', 'local'
    storage_path TEXT NOT NULL,
    cdn_url TEXT,
    thumbnail_url TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    is_temporary BOOLEAN DEFAULT FALSE,
    download_count INTEGER DEFAULT 0,
    virus_scan_status VARCHAR(50), -- e.g., 'pending', 'clean', 'infected'
    metadata JSONB,
    expires_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE project_attachments (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    file_upload_id INTEGER NOT NULL,
    attachment_type VARCHAR(50), -- e.g., 'brief', 'deliverable', 'revision'
    uploaded_by_id INTEGER NOT NULL,
    description TEXT,
    is_final_deliverable BOOLEAN DEFAULT FALSE,
    requires_approval BOOLEAN DEFAULT FALSE,
    approved_at TIMESTAMP WITHOUT TIME ZONE,
    approved_by_id INTEGER,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (project_id, file_upload_id)
);

-- =============================================
-- NOTIFICATIONS
-- =============================================

CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type VARCHAR(50), -- e.g., 'system', 'message', 'project_update'
    priority VARCHAR(50), -- e.g., 'high', 'medium', 'low'
    data JSONB,
    action_buttons JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    is_dismissed BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITHOUT TIME ZONE,
    expires_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notification_preferences (
    user_id INTEGER PRIMARY KEY,
    email_notifications JSONB,
    push_notifications JSONB,
    sms_notifications JSONB,
    frequency VARCHAR(50), -- e.g., 'instant', 'daily', 'weekly'
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    timezone VARCHAR(50),
    marketing_emails BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- USER FEATURES
-- =============================================

CREATE TABLE favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- e.g., 'freelancer', 'service', 'project'
    entity_id INTEGER NOT NULL,
    notes TEXT,
    tags JSONB,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, entity_type, entity_id)
);

CREATE TABLE saved_searches (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    search_name VARCHAR(255) NOT NULL,
    search_criteria JSONB,
    alert_frequency VARCHAR(50), -- e.g., 'daily', 'weekly', 'never'
    is_active BOOLEAN DEFAULT TRUE,
    results_count INTEGER DEFAULT 0,
    last_alert_sent TIMESTAMP WITHOUT TIME ZONE,
    last_executed TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- DISPUTES & SUPPORT
-- =============================================

CREATE TABLE disputes (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    initiator_id INTEGER NOT NULL,
    respondent_id INTEGER NOT NULL,
    reason VARCHAR(255),
    description TEXT,
    disputed_amount DECIMAL(15, 2),
    status VARCHAR(50) NOT NULL, -- e.g., 'open', 'in_review', 'resolved'
    resolution_type VARCHAR(50), -- e.g., 'refund', 'partial_refund', 'freelancer_paid'
    evidence JSONB,
    resolution TEXT,
    admin_id INTEGER,
    admin_assigned_at TIMESTAMP WITHOUT TIME ZONE,
    resolved_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dispute_messages (
    id SERIAL PRIMARY KEY,
    dispute_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    message TEXT,
    attachments JSONB,
    is_admin_message BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE support_tickets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    ticket_number VARCHAR(255) UNIQUE NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(255),
    priority VARCHAR(50), -- e.g., 'low', 'medium', 'high', 'urgent'
    status VARCHAR(50) NOT NULL, -- e.g., 'open', 'pending', 'closed'
    assigned_admin_id INTEGER,
    attachments JSONB,
    first_response_at TIMESTAMP WITHOUT TIME ZONE,
    resolved_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE support_responses (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    response TEXT,
    is_admin_response BOOLEAN DEFAULT FALSE,
    attachments JSONB,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- ANALYTICS & LOGS
-- =============================================

CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(255),
    entity_id INTEGER,
    data JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    session_id VARCHAR(255),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_analytics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL,
    date DATE NOT NULL,
    profile_views INTEGER DEFAULT 0,
    service_views INTEGER DEFAULT 0,
    message_sent INTEGER DEFAULT 0,
    proposals_sent INTEGER DEFAULT 0,
    projects_created INTEGER DEFAULT 0,
    earnings_day DECIMAL(15, 2) DEFAULT 0.00,
    login_count INTEGER DEFAULT 0,
    active_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- FOREIGN KEY CONSTRAINTS
-- =============================================

ALTER TABLE user_sessions ADD CONSTRAINT fk_user_sessions_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE password_resets ADD CONSTRAINT fk_password_resets_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE refresh_tokens ADD CONSTRAINT fk_refresh_tokens_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE freelancer_profiles ADD CONSTRAINT fk_freelancer_profiles_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE freelancer_skills ADD CONSTRAINT fk_freelancer_skills_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE freelancer_skills ADD CONSTRAINT fk_freelancer_skills_skill_id FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE;
ALTER TABLE portfolio_items ADD CONSTRAINT fk_portfolio_items_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE portfolio_items ADD CONSTRAINT fk_portfolio_items_category_id FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;
ALTER TABLE categories ADD CONSTRAINT fk_categories_parent_id FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL;
ALTER TABLE services ADD CONSTRAINT fk_services_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE services ADD CONSTRAINT fk_services_category_id FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE;
ALTER TABLE service_packages ADD CONSTRAINT fk_service_packages_service_id FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE;
ALTER TABLE projects ADD CONSTRAINT fk_projects_client_id FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE projects ADD CONSTRAINT fk_projects_freelancer_id FOREIGN KEY (freelancer_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE projects ADD CONSTRAINT fk_projects_category_id FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE;
ALTER TABLE proposals ADD CONSTRAINT fk_proposals_project_id FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE proposals ADD CONSTRAINT fk_proposals_freelancer_id FOREIGN KEY (freelancer_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE proposals ADD CONSTRAINT fk_proposals_service_package_id FOREIGN KEY (service_package_id) REFERENCES service_packages(id) ON DELETE SET NULL;
ALTER TABLE project_milestones ADD CONSTRAINT fk_project_milestones_project_id FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE conversations ADD CONSTRAINT fk_conversations_project_id FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE conversations ADD CONSTRAINT fk_conversations_participant_1_id FOREIGN KEY (participant_1_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE conversations ADD CONSTRAINT fk_conversations_participant_2_id FOREIGN KEY (participant_2_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE conversations ADD CONSTRAINT fk_conversations_last_message_id FOREIGN KEY (last_message_id) REFERENCES messages(id) ON DELETE SET NULL;
ALTER TABLE messages ADD CONSTRAINT fk_messages_conversation_id FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;
ALTER TABLE messages ADD CONSTRAINT fk_messages_sender_id FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE messages ADD CONSTRAINT fk_messages_receiver_id FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE video_calls ADD CONSTRAINT fk_video_calls_conversation_id FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;
ALTER TABLE video_calls ADD CONSTRAINT fk_video_calls_initiator_id FOREIGN KEY (initiator_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE wallets ADD CONSTRAINT fk_wallets_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE payment_methods ADD CONSTRAINT fk_payment_methods_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE transactions ADD CONSTRAINT fk_transactions_from_user_id FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE transactions ADD CONSTRAINT fk_transactions_to_user_id FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE transactions ADD CONSTRAINT fk_transactions_project_id FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE transactions ADD CONSTRAINT fk_transactions_milestone_id FOREIGN KEY (milestone_id) REFERENCES project_milestones(id) ON DELETE SET NULL;
ALTER TABLE escrow_accounts ADD CONSTRAINT fk_escrow_accounts_project_id FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE escrow_accounts ADD CONSTRAINT fk_escrow_accounts_milestone_id FOREIGN KEY (milestone_id) REFERENCES project_milestones(id) ON DELETE SET NULL;
ALTER TABLE escrow_accounts ADD CONSTRAINT fk_escrow_accounts_client_id FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE escrow_accounts ADD CONSTRAINT fk_escrow_accounts_freelancer_id FOREIGN KEY (freelancer_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE withdrawal_requests ADD CONSTRAINT fk_withdrawal_requests_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE withdrawal_requests ADD CONSTRAINT fk_withdrawal_requests_payment_method_id FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE SET NULL;
ALTER TABLE withdrawal_requests ADD CONSTRAINT fk_withdrawal_requests_processed_by_admin_id FOREIGN KEY (processed_by_admin_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE reviews ADD CONSTRAINT fk_reviews_project_id FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE reviews ADD CONSTRAINT fk_reviews_reviewer_id FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE reviews ADD CONSTRAINT fk_reviews_reviewee_id FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE review_responses ADD CONSTRAINT fk_review_responses_review_id FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE;
ALTER TABLE review_responses ADD CONSTRAINT fk_review_responses_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE user_reputation ADD CONSTRAINT fk_user_reputation_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE badges ADD CONSTRAINT fk_badges_category_id FOREIGN KEY (category_id) REFERENCES badge_categories(id) ON DELETE CASCADE;
ALTER TABLE user_badges ADD CONSTRAINT fk_user_badges_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE user_badges ADD CONSTRAINT fk_user_badges_badge_id FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE;
ALTER TABLE badge_milestones ADD CONSTRAINT fk_badge_milestones_badge_id FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE;
ALTER TABLE file_uploads ADD CONSTRAINT fk_file_uploads_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE project_attachments ADD CONSTRAINT fk_project_attachments_project_id FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE project_attachments ADD CONSTRAINT fk_project_attachments_file_upload_id FOREIGN KEY (file_upload_id) REFERENCES file_uploads(id) ON DELETE CASCADE;
ALTER TABLE project_attachments ADD CONSTRAINT fk_project_attachments_uploaded_by_id FOREIGN KEY (uploaded_by_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE project_attachments ADD CONSTRAINT fk_project_attachments_approved_by_id FOREIGN KEY (approved_by_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE notifications ADD CONSTRAINT fk_notifications_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE notification_preferences ADD CONSTRAINT fk_notification_preferences_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE favorites ADD CONSTRAINT fk_favorites_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE saved_searches ADD CONSTRAINT fk_saved_searches_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE disputes ADD CONSTRAINT fk_disputes_project_id FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE disputes ADD CONSTRAINT fk_disputes_initiator_id FOREIGN KEY (initiator_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE disputes ADD CONSTRAINT fk_disputes_respondent_id FOREIGN KEY (respondent_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE disputes ADD CONSTRAINT fk_disputes_admin_id FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE dispute_messages ADD CONSTRAINT fk_dispute_messages_dispute_id FOREIGN KEY (dispute_id) REFERENCES disputes(id) ON DELETE CASCADE;
ALTER TABLE dispute_messages ADD CONSTRAINT fk_dispute_messages_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE support_tickets ADD CONSTRAINT fk_support_tickets_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE support_tickets ADD CONSTRAINT fk_support_tickets_assigned_admin_id FOREIGN KEY (assigned_admin_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE support_responses ADD CONSTRAINT fk_support_responses_ticket_id FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE;
ALTER TABLE support_responses ADD CONSTRAINT fk_support_responses_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE activity_logs ADD CONSTRAINT fk_activity_logs_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE user_analytics ADD CONSTRAINT fk_user_analytics_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;