-- =============================================
-- REVIEWS & REPUTATION SYSTEM SCHEMA
-- LABUREMOS Complete Platform - Phase 5
-- =============================================

-- Reviews table - Core review system
CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    reviewer_id INT NOT NULL,
    reviewee_id INT NOT NULL,
    reviewer_type ENUM('client', 'freelancer') NOT NULL,
    overall_rating DECIMAL(2,1) NOT NULL CHECK (overall_rating >= 1.0 AND overall_rating <= 5.0),
    
    -- Detailed ratings
    communication_rating DECIMAL(2,1) DEFAULT NULL CHECK (communication_rating >= 1.0 AND communication_rating <= 5.0),
    quality_rating DECIMAL(2,1) DEFAULT NULL CHECK (quality_rating >= 1.0 AND quality_rating <= 5.0),
    timeliness_rating DECIMAL(2,1) DEFAULT NULL CHECK (timeliness_rating >= 1.0 AND timeliness_rating <= 5.0),
    professionalism_rating DECIMAL(2,1) DEFAULT NULL CHECK (professionalism_rating >= 1.0 AND professionalism_rating <= 5.0),
    value_rating DECIMAL(2,1) DEFAULT NULL CHECK (value_rating >= 1.0 AND value_rating <= 5.0),
    
    -- Review content
    title VARCHAR(255) DEFAULT NULL,
    comment TEXT DEFAULT NULL,
    
    -- Recommendations
    would_recommend BOOLEAN DEFAULT NULL,
    would_work_again BOOLEAN DEFAULT NULL,
    
    -- Anti-fraud and moderation
    fraud_score DECIMAL(3,2) DEFAULT 0.00,
    moderation_status ENUM('pending', 'approved', 'rejected', 'flagged') DEFAULT 'pending',
    moderation_reason TEXT DEFAULT NULL,
    moderated_by INT DEFAULT NULL,
    moderated_at TIMESTAMP NULL DEFAULT NULL,
    
    -- Helpful votes
    helpful_votes INT DEFAULT 0,
    total_votes INT DEFAULT 0,
    
    -- System metadata
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    INDEX idx_project_reviews (project_id),
    INDEX idx_reviewer (reviewer_id),
    INDEX idx_reviewee (reviewee_id),
    INDEX idx_moderation_status (moderation_status),
    INDEX idx_created_at (created_at),
    
    -- Foreign keys
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (moderated_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Business constraints
    UNIQUE KEY unique_project_reviewer (project_id, reviewer_id),
    CONSTRAINT check_different_users CHECK (reviewer_id != reviewee_id)
);

-- User reputation aggregates
CREATE TABLE user_reputation (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    user_type ENUM('freelancer', 'client') NOT NULL,
    
    -- Overall statistics
    total_reviews INT DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    reputation_score DECIMAL(5,2) DEFAULT 0.00,
    
    -- Detailed rating averages
    avg_communication DECIMAL(3,2) DEFAULT 0.00,
    avg_quality DECIMAL(3,2) DEFAULT 0.00,
    avg_timeliness DECIMAL(3,2) DEFAULT 0.00,
    avg_professionalism DECIMAL(3,2) DEFAULT 0.00,
    avg_value DECIMAL(3,2) DEFAULT 0.00,
    
    -- Rating distribution
    rating_5_count INT DEFAULT 0,
    rating_4_count INT DEFAULT 0,
    rating_3_count INT DEFAULT 0,
    rating_2_count INT DEFAULT 0,
    rating_1_count INT DEFAULT 0,
    
    -- Recommendation stats
    positive_recommendations INT DEFAULT 0,
    total_recommendations INT DEFAULT 0,
    recommendation_rate DECIMAL(3,2) DEFAULT 0.00,
    
    -- Trust indicators
    verified_reviews INT DEFAULT 0,
    response_rate DECIMAL(3,2) DEFAULT 0.00,
    response_time_avg INT DEFAULT NULL, -- hours
    
    -- Badges and achievements
    badges JSON DEFAULT NULL,
    achievements JSON DEFAULT NULL,
    
    -- Quality indicators
    completion_rate DECIMAL(3,2) DEFAULT 0.00,
    repeat_client_rate DECIMAL(3,2) DEFAULT 0.00,
    on_time_delivery_rate DECIMAL(3,2) DEFAULT 0.00,
    
    -- Timestamps
    last_review_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_user_type (user_type),
    INDEX idx_reputation_score (reputation_score DESC),
    INDEX idx_average_rating (average_rating DESC),
    INDEX idx_total_reviews (total_reviews DESC),
    
    -- Foreign key
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Review responses (for reviewees to respond to reviews)
CREATE TABLE review_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    review_id INT NOT NULL UNIQUE,
    response_text TEXT NOT NULL,
    responder_id INT NOT NULL,
    
    -- Moderation
    moderation_status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved',
    moderated_by INT DEFAULT NULL,
    moderated_at TIMESTAMP NULL DEFAULT NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
    FOREIGN KEY (responder_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (moderated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Review helpfulness votes
CREATE TABLE review_votes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    review_id INT NOT NULL,
    voter_id INT NOT NULL,
    vote_type ENUM('helpful', 'not_helpful') NOT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE KEY unique_voter_review (review_id, voter_id),
    INDEX idx_review_votes (review_id),
    
    -- Foreign keys
    FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
    FOREIGN KEY (voter_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Review flags/reports
CREATE TABLE review_flags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    review_id INT NOT NULL,
    flagger_id INT NOT NULL,
    flag_reason ENUM('inappropriate', 'fake', 'spam', 'offensive', 'other') NOT NULL,
    flag_description TEXT DEFAULT NULL,
    
    -- Investigation
    status ENUM('pending', 'investigating', 'resolved', 'dismissed') DEFAULT 'pending',
    investigated_by INT DEFAULT NULL,
    investigation_notes TEXT DEFAULT NULL,
    resolution TEXT DEFAULT NULL,
    resolved_at TIMESTAMP NULL DEFAULT NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_review_flags (review_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    
    -- Foreign keys
    FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
    FOREIGN KEY (flagger_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (investigated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Review templates for common scenarios
CREATE TABLE review_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    template_name VARCHAR(100) NOT NULL,
    user_type ENUM('freelancer', 'client') NOT NULL,
    scenario VARCHAR(100) NOT NULL,
    
    title_template VARCHAR(255) NOT NULL,
    comment_template TEXT NOT NULL,
    
    suggested_ratings JSON DEFAULT NULL, -- Default ratings for this scenario
    
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_type_scenario (user_type, scenario),
    INDEX idx_active (is_active)
);

-- Review reminders (to encourage reviews after project completion)
CREATE TABLE review_reminders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    user_id INT NOT NULL,
    reminder_type ENUM('initial', 'followup', 'final') NOT NULL,
    
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    opened_at TIMESTAMP NULL DEFAULT NULL,
    clicked_at TIMESTAMP NULL DEFAULT NULL,
    
    -- Email/notification metadata
    email_subject VARCHAR(255) DEFAULT NULL,
    email_template VARCHAR(100) DEFAULT NULL,
    
    INDEX idx_project_user (project_id, user_id),
    INDEX idx_sent_at (sent_at),
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================
-- TRIGGERS FOR AUTO-CALCULATION
-- =============================================

DELIMITER //

-- Trigger to update user reputation when a new review is added
CREATE TRIGGER update_reputation_after_review_insert 
AFTER INSERT ON reviews 
FOR EACH ROW
BEGIN
    -- Update reputation for the reviewee
    INSERT INTO user_reputation (user_id, user_type) 
    VALUES (NEW.reviewee_id, IF(NEW.reviewer_type = 'client', 'freelancer', 'client'))
    ON DUPLICATE KEY UPDATE user_id = user_id; -- Ensure record exists
    
    CALL calculate_user_reputation(NEW.reviewee_id);
END//

-- Trigger to update user reputation when a review is updated
CREATE TRIGGER update_reputation_after_review_update 
AFTER UPDATE ON reviews 
FOR EACH ROW
BEGIN
    IF OLD.overall_rating != NEW.overall_rating OR OLD.moderation_status != NEW.moderation_status THEN
        CALL calculate_user_reputation(NEW.reviewee_id);
    END IF;
END//

-- Trigger to update user reputation when a review is deleted
CREATE TRIGGER update_reputation_after_review_delete 
AFTER DELETE ON reviews 
FOR EACH ROW
BEGIN
    CALL calculate_user_reputation(OLD.reviewee_id);
END//

-- Trigger to update helpful votes count
CREATE TRIGGER update_helpful_votes_after_vote_insert 
AFTER INSERT ON review_votes 
FOR EACH ROW
BEGIN
    UPDATE reviews 
    SET 
        helpful_votes = helpful_votes + IF(NEW.vote_type = 'helpful', 1, 0),
        total_votes = total_votes + 1
    WHERE id = NEW.review_id;
END//

CREATE TRIGGER update_helpful_votes_after_vote_delete 
AFTER DELETE ON review_votes 
FOR EACH ROW
BEGIN
    UPDATE reviews 
    SET 
        helpful_votes = helpful_votes - IF(OLD.vote_type = 'helpful', 1, 0),
        total_votes = total_votes - 1
    WHERE id = OLD.review_id;
END//

DELIMITER ;

-- =============================================
-- STORED PROCEDURES
-- =============================================

DELIMITER //

-- Procedure to calculate comprehensive user reputation
CREATE PROCEDURE calculate_user_reputation(IN target_user_id INT)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE user_type_val ENUM('freelancer', 'client');
    
    -- Get user type
    SELECT user_type INTO user_type_val FROM users WHERE id = target_user_id;
    
    -- Calculate all reputation metrics
    INSERT INTO user_reputation (user_id, user_type) 
    VALUES (target_user_id, user_type_val)
    ON DUPLICATE KEY UPDATE
        total_reviews = (
            SELECT COUNT(*) 
            FROM reviews 
            WHERE reviewee_id = target_user_id 
            AND moderation_status = 'approved'
        ),
        average_rating = (
            SELECT COALESCE(AVG(overall_rating), 0.00) 
            FROM reviews 
            WHERE reviewee_id = target_user_id 
            AND moderation_status = 'approved'
        ),
        avg_communication = (
            SELECT COALESCE(AVG(communication_rating), 0.00) 
            FROM reviews 
            WHERE reviewee_id = target_user_id 
            AND moderation_status = 'approved'
            AND communication_rating IS NOT NULL
        ),
        avg_quality = (
            SELECT COALESCE(AVG(quality_rating), 0.00) 
            FROM reviews 
            WHERE reviewee_id = target_user_id 
            AND moderation_status = 'approved'
            AND quality_rating IS NOT NULL
        ),
        avg_timeliness = (
            SELECT COALESCE(AVG(timeliness_rating), 0.00) 
            FROM reviews 
            WHERE reviewee_id = target_user_id 
            AND moderation_status = 'approved'
            AND timeliness_rating IS NOT NULL
        ),
        avg_professionalism = (
            SELECT COALESCE(AVG(professionalism_rating), 0.00) 
            FROM reviews 
            WHERE reviewee_id = target_user_id 
            AND moderation_status = 'approved'
            AND professionalism_rating IS NOT NULL
        ),
        avg_value = (
            SELECT COALESCE(AVG(value_rating), 0.00) 
            FROM reviews 
            WHERE reviewee_id = target_user_id 
            AND moderation_status = 'approved'
            AND value_rating IS NOT NULL
        ),
        rating_5_count = (
            SELECT COUNT(*) FROM reviews 
            WHERE reviewee_id = target_user_id 
            AND moderation_status = 'approved'
            AND overall_rating >= 4.5
        ),
        rating_4_count = (
            SELECT COUNT(*) FROM reviews 
            WHERE reviewee_id = target_user_id 
            AND moderation_status = 'approved'
            AND overall_rating >= 3.5 AND overall_rating < 4.5
        ),
        rating_3_count = (
            SELECT COUNT(*) FROM reviews 
            WHERE reviewee_id = target_user_id 
            AND moderation_status = 'approved'
            AND overall_rating >= 2.5 AND overall_rating < 3.5
        ),
        rating_2_count = (
            SELECT COUNT(*) FROM reviews 
            WHERE reviewee_id = target_user_id 
            AND moderation_status = 'approved'
            AND overall_rating >= 1.5 AND overall_rating < 2.5
        ),
        rating_1_count = (
            SELECT COUNT(*) FROM reviews 
            WHERE reviewee_id = target_user_id 
            AND moderation_status = 'approved'
            AND overall_rating < 1.5
        ),
        positive_recommendations = (
            SELECT COUNT(*) FROM reviews 
            WHERE reviewee_id = target_user_id 
            AND moderation_status = 'approved'
            AND would_recommend = TRUE
        ),
        total_recommendations = (
            SELECT COUNT(*) FROM reviews 
            WHERE reviewee_id = target_user_id 
            AND moderation_status = 'approved'
            AND would_recommend IS NOT NULL
        ),
        recommendation_rate = (
            SELECT CASE 
                WHEN COUNT(*) = 0 THEN 0.00
                ELSE (SUM(CASE WHEN would_recommend = TRUE THEN 1 ELSE 0 END) * 100.0 / COUNT(*))
            END
            FROM reviews 
            WHERE reviewee_id = target_user_id 
            AND moderation_status = 'approved'
            AND would_recommend IS NOT NULL
        ),
        last_review_at = (
            SELECT MAX(created_at) FROM reviews 
            WHERE reviewee_id = target_user_id 
            AND moderation_status = 'approved'
        ),
        updated_at = NOW();
    
    -- Calculate reputation score (complex algorithm)
    UPDATE user_reputation 
    SET reputation_score = LEAST(100.00, (
        (average_rating * 20) +                    -- Base score from rating (max 100)
        (LOG10(GREATEST(total_reviews, 1)) * 10) +  -- Volume bonus (max ~20)
        (recommendation_rate * 0.15) +              -- Recommendation bonus (max 15)
        (CASE 
            WHEN total_reviews >= 100 THEN 10       -- High volume bonus
            WHEN total_reviews >= 50 THEN 5         -- Medium volume bonus
            WHEN total_reviews >= 10 THEN 2         -- Low volume bonus
            ELSE 0 
        END)
    ))
    WHERE user_id = target_user_id;
    
END//

-- Procedure to detect potentially fraudulent reviews
CREATE PROCEDURE detect_review_fraud(IN review_id INT)
BEGIN
    DECLARE fraud_score DECIMAL(3,2) DEFAULT 0.00;
    DECLARE reviewer_id_val INT;
    DECLARE reviewee_id_val INT;
    DECLARE reviewer_review_count INT;
    DECLARE ip_count INT;
    DECLARE time_since_signup INT;
    
    -- Get review details
    SELECT reviewer_id, reviewee_id INTO reviewer_id_val, reviewee_id_val 
    FROM reviews WHERE id = review_id;
    
    -- Check 1: New reviewer (higher fraud risk)
    SELECT COUNT(*) INTO reviewer_review_count 
    FROM reviews WHERE reviewer_id = reviewer_id_val;
    
    IF reviewer_review_count <= 1 THEN
        SET fraud_score = fraud_score + 0.15;
    END IF;
    
    -- Check 2: IP address frequency
    SELECT COUNT(*) INTO ip_count 
    FROM reviews r1 
    WHERE r1.ip_address = (SELECT ip_address FROM reviews WHERE id = review_id)
    AND r1.ip_address IS NOT NULL;
    
    IF ip_count > 5 THEN
        SET fraud_score = fraud_score + 0.20;
    END IF;
    
    -- Check 3: Account age
    SELECT DATEDIFF(NOW(), created_at) INTO time_since_signup 
    FROM users WHERE id = reviewer_id_val;
    
    IF time_since_signup < 7 THEN
        SET fraud_score = fraud_score + 0.25;
    END IF;
    
    -- Check 4: Extreme ratings (very high or very low might be suspicious)
    IF EXISTS (SELECT 1 FROM reviews WHERE id = review_id AND (overall_rating = 5.0 OR overall_rating = 1.0)) THEN
        SET fraud_score = fraud_score + 0.10;
    END IF;
    
    -- Update fraud score
    UPDATE reviews SET fraud_score = fraud_score WHERE id = review_id;
    
    -- Auto-flag for review if score is high
    IF fraud_score >= 0.60 THEN
        UPDATE reviews 
        SET moderation_status = 'flagged' 
        WHERE id = review_id;
    END IF;
    
END//

DELIMITER ;

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- View for review statistics by project
CREATE VIEW project_review_stats AS
SELECT 
    p.id as project_id,
    p.title as project_title,
    COUNT(r.id) as total_reviews,
    AVG(r.overall_rating) as average_rating,
    COUNT(CASE WHEN r.reviewer_type = 'client' THEN 1 END) as client_reviews,
    COUNT(CASE WHEN r.reviewer_type = 'freelancer' THEN 1 END) as freelancer_reviews,
    AVG(CASE WHEN r.reviewer_type = 'client' THEN r.overall_rating END) as client_avg_rating,
    AVG(CASE WHEN r.reviewer_type = 'freelancer' THEN r.overall_rating END) as freelancer_avg_rating
FROM projects p
LEFT JOIN reviews r ON p.id = r.project_id AND r.moderation_status = 'approved'
GROUP BY p.id, p.title;

-- View for top-rated freelancers
CREATE VIEW top_freelancers AS
SELECT 
    u.id,
    u.first_name,
    u.last_name,
    u.email,
    ur.average_rating,
    ur.total_reviews,
    ur.reputation_score,
    ur.recommendation_rate
FROM users u
JOIN user_reputation ur ON u.id = ur.user_id
WHERE u.user_type = 'freelancer' 
AND ur.total_reviews >= 5
ORDER BY ur.reputation_score DESC, ur.average_rating DESC;

-- View for review moderation queue
CREATE VIEW review_moderation_queue AS
SELECT 
    r.id,
    r.project_id,
    r.overall_rating,
    r.title,
    r.comment,
    r.fraud_score,
    r.moderation_status,
    r.created_at,
    reviewer.first_name as reviewer_name,
    reviewee.first_name as reviewee_name,
    COUNT(rf.id) as flag_count
FROM reviews r
JOIN users reviewer ON r.reviewer_id = reviewer.id
JOIN users reviewee ON r.reviewee_id = reviewee.id
LEFT JOIN review_flags rf ON r.id = rf.review_id AND rf.status = 'pending'
WHERE r.moderation_status IN ('pending', 'flagged')
GROUP BY r.id
ORDER BY r.fraud_score DESC, flag_count DESC, r.created_at ASC;

-- =============================================
-- INITIAL DATA SEEDING
-- =============================================

-- Insert review templates
INSERT INTO review_templates (template_name, user_type, scenario, title_template, comment_template, suggested_ratings) VALUES
('Excellent Work - Client', 'client', 'excellent_work', 'Outstanding freelancer!', 'Exceeded my expectations in every way. Great communication, high-quality work, and delivered on time. Would definitely work with again!', '{"overall": 5.0, "communication": 5.0, "quality": 5.0, "timeliness": 5.0, "professionalism": 5.0}'),
('Good Work - Client', 'client', 'good_work', 'Good quality work', 'Solid work delivered on time. Good communication throughout the project. Minor revisions needed but overall satisfied.', '{"overall": 4.0, "communication": 4.0, "quality": 4.0, "timeliness": 4.0, "professionalism": 4.0}'),
('Issues with Communication - Client', 'client', 'communication_issues', 'Work was good but communication could improve', 'The final result was acceptable, but communication was lacking. Had to follow up multiple times for updates.', '{"overall": 3.0, "communication": 2.0, "quality": 4.0, "timeliness": 3.0, "professionalism": 3.0}'),
('Great Client - Freelancer', 'freelancer', 'great_client', 'Pleasure to work with!', 'Clear requirements, prompt payments, and respectful communication. Hope to work together again soon!', '{"overall": 5.0, "communication": 5.0, "professionalism": 5.0, "timeliness": 5.0}'),
('Good Client - Freelancer', 'freelancer', 'good_client', 'Good working relationship', 'Professional client with clear expectations. Payment was on time and communication was good.', '{"overall": 4.0, "communication": 4.0, "professionalism": 4.0, "timeliness": 4.0}');

-- Create indexes for better performance
CREATE INDEX idx_reviews_composite ON reviews(reviewee_id, moderation_status, created_at);
CREATE INDEX idx_reputation_composite ON user_reputation(user_type, reputation_score DESC, total_reviews DESC);
CREATE INDEX idx_review_flags_composite ON review_flags(status, created_at);

-- Add comment to tables
ALTER TABLE reviews COMMENT = 'Core review system with anti-fraud detection';
ALTER TABLE user_reputation COMMENT = 'Aggregated reputation data for users';
ALTER TABLE review_responses COMMENT = 'Responses to reviews by reviewees';
ALTER TABLE review_votes COMMENT = 'Helpfulness votes on reviews';
ALTER TABLE review_flags COMMENT = 'Flagged reviews for moderation';
ALTER TABLE review_templates COMMENT = 'Pre-defined review templates';
ALTER TABLE review_reminders COMMENT = 'Review reminder tracking';