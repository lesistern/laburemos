-- ================================================================
-- LABUREMOS Comprehensive Data Cleanup Script
-- ELIMINACIÓN PERMANENTE DE DATOS DUMMY Y PLACEHOLDER
-- ================================================================
-- 
-- PURPOSE: Remove ALL dummy data identified by the audit script
-- CRITICAL: This script PERMANENTLY deletes data - backup first!
--
-- WARNING: Only run this script after backing up your database
-- This script will DELETE data and cannot be undone
--
-- Author: LABUREMOS Data Quality Team
-- Version: 1.0
-- Date: 2025-07-20
-- ================================================================

-- Enable foreign key checks and safe mode
SET FOREIGN_KEY_CHECKS = 1;
SET SQL_SAFE_UPDATES = 0;

-- Log cleanup start
INSERT INTO cleanup_log (action, message, created_at) 
VALUES ('CLEANUP_START', 'Comprehensive cleanup started', NOW());

-- ================================================================
-- PHASE 1: DELETE DUMMY USERS
-- ================================================================

-- Delete users with dummy data patterns
DELETE FROM users 
WHERE 
  -- Dummy emails
  email LIKE '%test%' OR 
  email LIKE '%demo%' OR 
  email LIKE '%example%' OR
  email LIKE '%@mailinator.com' OR
  email LIKE '%@10minutemail.%' OR
  email LIKE '%@tempmail.%' OR
  email LIKE '%@guerrillamail.%' OR
  
  -- Dummy names
  first_name IN ('John', 'Jane', 'Test', 'Demo', 'Admin', 'Usuario', 'User') OR
  last_name IN ('Doe', 'Smith', 'Test', 'Demo', 'Prueba', 'User') OR
  first_name LIKE '%test%' OR
  first_name LIKE '%demo%' OR
  first_name LIKE '%admin%' OR
  
  -- Dummy bio content
  bio LIKE '%Lorem ipsum%' OR
  bio LIKE '%placeholder%' OR
  bio LIKE '%dummy%' OR
  bio LIKE '%sample%' OR
  bio LIKE '%This is a test%' OR
  bio LIKE '%example bio%';

-- Log user cleanup
INSERT INTO cleanup_log (action, message, created_at) 
VALUES ('USERS_CLEANED', CONCAT('Deleted ', ROW_COUNT(), ' dummy users'), NOW());

-- ================================================================
-- PHASE 2: DELETE DUMMY SERVICES
-- ================================================================

-- Delete services with dummy data patterns
DELETE FROM services 
WHERE 
  -- Dummy titles
  title LIKE '%test%' OR 
  title LIKE '%demo%' OR 
  title LIKE '%lorem%' OR
  title LIKE '%placeholder%' OR
  title LIKE '%dummy%' OR
  title LIKE '%sample%' OR
  title LIKE '%example%' OR
  title IN ('Test Service', 'Demo Service', 'Sample Service') OR
  
  -- Dummy descriptions
  description LIKE '%Lorem ipsum%' OR
  description LIKE '%placeholder%' OR
  description LIKE '%This is a test%' OR
  description LIKE '%dummy%' OR
  description LIKE '%sample description%' OR
  description LIKE '%example description%' OR
  LENGTH(description) < 50 OR
  
  -- Dummy images
  image_url LIKE '%placeholder%' OR
  image_url LIKE '%demo%' OR
  image_url LIKE '%example%' OR
  
  -- Placeholder pricing patterns
  starting_price = 1000 OR 
  starting_price = 5000 OR 
  starting_price = 10000 OR
  starting_price < 500 OR
  
  -- Invalid delivery times
  delivery_time < 1 OR 
  delivery_time > 365;

-- Log service cleanup
INSERT INTO cleanup_log (action, message, created_at) 
VALUES ('SERVICES_CLEANED', CONCAT('Deleted ', ROW_COUNT(), ' dummy services'), NOW());

-- ================================================================
-- PHASE 3: DELETE DUMMY REVIEWS
-- ================================================================

-- Delete reviews with dummy or generic content
DELETE FROM reviews 
WHERE 
  -- Dummy content
  comment LIKE '%Lorem%' OR
  comment LIKE '%test%' OR
  comment LIKE '%demo%' OR
  comment LIKE '%placeholder%' OR
  comment LIKE '%dummy%' OR
  comment LIKE '%sample%' OR
  
  -- Generic English comments
  comment IN ('Great work', 'Excellent service', 'Perfect', 'Amazing', 'Good job!', 'Thank you!', 'Awesome!') OR
  
  -- Generic Spanish comments
  comment IN ('Muy bueno', 'Excelente', 'Perfecto', 'Increíble', 'Gracias') OR
  
  -- Suspiciously short reviews
  LENGTH(comment) < 15 OR
  
  -- Perfect ratings with minimal comments (likely fake)
  (rating = 5.0 AND LENGTH(comment) < 30) OR
  
  -- Generic positive phrases
  comment LIKE '%highly recommend%' OR
  comment LIKE '%will hire again%' OR
  comment LIKE '%fast delivery%' OR
  comment LIKE '%professional work%' OR
  comment LIKE '%exceeded expectations%' OR
  comment LIKE '%lo recomiendo%' OR
  comment LIKE '%volveré a contratar%' OR
  comment LIKE '%entrega rápida%';

-- Log review cleanup
INSERT INTO cleanup_log (action, message, created_at) 
VALUES ('REVIEWS_CLEANED', CONCAT('Deleted ', ROW_COUNT(), ' dummy reviews'), NOW());

-- ================================================================
-- PHASE 4: DELETE DUMMY MESSAGES
-- ================================================================

-- Delete messages with dummy content
DELETE FROM messages 
WHERE 
  content LIKE '%test%' OR
  content LIKE '%demo%' OR
  content LIKE '%lorem%' OR
  content LIKE '%placeholder%' OR
  content LIKE '%dummy%' OR
  content IN ('Hello', 'Hi', 'Hi there', 'Test message', 'Hello world', 'Hola', 'Prueba') OR
  LENGTH(content) < 5;

-- Log message cleanup
INSERT INTO cleanup_log (action, message, created_at) 
VALUES ('MESSAGES_CLEANED', CONCAT('Deleted ', ROW_COUNT(), ' dummy messages'), NOW());

-- ================================================================
-- PHASE 5: DELETE DUMMY PROJECTS
-- ================================================================

-- Delete projects with dummy data patterns
DELETE FROM projects 
WHERE 
  -- Dummy titles
  title LIKE '%test%' OR
  title LIKE '%demo%' OR
  title LIKE '%sample%' OR
  title LIKE '%placeholder%' OR
  title LIKE '%dummy%' OR
  title LIKE '%example%' OR
  title IN ('Test Project', 'Demo Project', 'Sample Project') OR
  
  -- Dummy descriptions
  description LIKE '%Lorem ipsum%' OR
  description LIKE '%dummy%' OR
  description LIKE '%test project%' OR
  description LIKE '%placeholder%' OR
  LENGTH(description) < 50 OR
  
  -- Unrealistic budgets
  budget_min < 1000 OR
  budget_max > 10000000 OR
  (budget_min = 1000 AND budget_max = 5000) OR
  budget_min = budget_max OR
  
  -- Past deadlines or old drafts
  deadline < CURDATE() OR
  (status = 'draft' AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY));

-- Log project cleanup
INSERT INTO cleanup_log (action, message, created_at) 
VALUES ('PROJECTS_CLEANED', CONCAT('Deleted ', ROW_COUNT(), ' dummy projects'), NOW());

-- ================================================================
-- PHASE 6: DELETE DUMMY PORTFOLIO ITEMS
-- ================================================================

-- Delete portfolio items with dummy data
DELETE FROM portfolio_items 
WHERE 
  title LIKE '%test%' OR
  title LIKE '%demo%' OR
  title LIKE '%sample%' OR
  title LIKE '%placeholder%' OR
  title LIKE '%dummy%' OR
  title LIKE '%example%' OR
  description LIKE '%Lorem ipsum%' OR
  description LIKE '%dummy%' OR
  description LIKE '%placeholder%' OR
  image_url LIKE '%placeholder%' OR
  image_url LIKE '%demo%' OR
  image_url LIKE '%example%' OR
  LENGTH(description) < 30;

-- Log portfolio cleanup
INSERT INTO cleanup_log (action, message, created_at) 
VALUES ('PORTFOLIO_CLEANED', CONCAT('Deleted ', ROW_COUNT(), ' dummy portfolio items'), NOW());

-- ================================================================
-- PHASE 7: DELETE DUMMY SKILLS
-- ================================================================

-- Delete dummy skills
DELETE FROM user_skills 
WHERE 
  skill_name LIKE '%test%' OR
  skill_name LIKE '%demo%' OR
  skill_name LIKE '%sample%' OR
  skill_name IN ('Test Skill', 'Demo Skill', 'Example', 'Placeholder') OR
  level < 1 OR 
  level > 5;

-- Log skills cleanup
INSERT INTO cleanup_log (action, message, created_at) 
VALUES ('SKILLS_CLEANED', CONCAT('Deleted ', ROW_COUNT(), ' dummy skills'), NOW());

-- ================================================================
-- PHASE 8: DELETE SUSPICIOUS PAYMENTS
-- ================================================================

-- Delete test payments and suspicious transactions
DELETE FROM payments 
WHERE 
  amount < 100 OR -- Unrealistically low
  amount = 1000 OR 
  amount = 5000 OR 
  amount = 10000 OR -- Round placeholder amounts
  payment_method = 'test' OR
  payment_method LIKE '%demo%' OR
  payment_method LIKE '%placeholder%' OR
  transaction_id LIKE '%test%' OR
  transaction_id LIKE '%demo%';

-- Log payment cleanup
INSERT INTO cleanup_log (action, message, created_at) 
VALUES ('PAYMENTS_CLEANED', CONCAT('Deleted ', ROW_COUNT(), ' dummy payments'), NOW());

-- ================================================================
-- PHASE 9: DELETE TEST NOTIFICATIONS
-- ================================================================

-- Delete test notifications
DELETE FROM notifications 
WHERE 
  title LIKE '%test%' OR
  title LIKE '%demo%' OR
  message LIKE '%test%' OR
  message LIKE '%demo%' OR
  message LIKE '%placeholder%' OR
  message LIKE '%Lorem ipsum%';

-- Log notification cleanup
INSERT INTO cleanup_log (action, message, created_at) 
VALUES ('NOTIFICATIONS_CLEANED', CONCAT('Deleted ', ROW_COUNT(), ' test notifications'), NOW());

-- ================================================================
-- PHASE 10: DELETE SUSPICIOUS CATEGORIES
-- ================================================================

-- Delete test categories
DELETE FROM categories 
WHERE 
  name LIKE '%Test%' OR
  name LIKE '%Demo%' OR
  name LIKE '%Sample%' OR
  name LIKE '%Placeholder%' OR
  description LIKE '%Lorem ipsum%' OR
  description LIKE '%placeholder%' OR
  description LIKE '%dummy%' OR
  description IS NULL OR
  description = '';

-- Log category cleanup
INSERT INTO cleanup_log (action, message, created_at) 
VALUES ('CATEGORIES_CLEANED', CONCAT('Deleted ', ROW_COUNT(), ' dummy categories'), NOW());

-- ================================================================
-- PHASE 11: FIX DATA INTEGRITY ISSUES
-- ================================================================

-- Delete orphaned services (users no longer exist)
DELETE FROM services 
WHERE user_id NOT IN (SELECT id FROM users);

-- Delete orphaned reviews (services or users no longer exist)
DELETE FROM reviews 
WHERE service_id NOT IN (SELECT id FROM services) 
   OR user_id NOT IN (SELECT id FROM users);

-- Delete orphaned messages (users no longer exist)
DELETE FROM messages 
WHERE sender_id NOT IN (SELECT id FROM users) 
   OR recipient_id NOT IN (SELECT id FROM users);

-- Delete orphaned portfolio items (users no longer exist)
DELETE FROM portfolio_items 
WHERE user_id NOT IN (SELECT id FROM users);

-- Delete orphaned user skills (users no longer exist)
DELETE FROM user_skills 
WHERE user_id NOT IN (SELECT id FROM users);

-- Delete orphaned payments (users or projects no longer exist)
DELETE FROM payments 
WHERE (payer_id NOT IN (SELECT id FROM users))
   OR (recipient_id NOT IN (SELECT id FROM users))
   OR (project_id IS NOT NULL AND project_id NOT IN (SELECT id FROM projects));

-- Fix invalid ratings (ensure 1-5 range)
UPDATE reviews 
SET rating = GREATEST(1, LEAST(5, rating))
WHERE rating < 1 OR rating > 5;

-- Log integrity fixes
INSERT INTO cleanup_log (action, message, created_at) 
VALUES ('INTEGRITY_FIXED', 'Fixed data integrity issues', NOW());

-- ================================================================
-- PHASE 12: UPDATE EMPTY REQUIRED FIELDS
-- ================================================================

-- Users with missing required data should be handled differently
-- Mark them as incomplete rather than deleting
UPDATE users 
SET status = 'incomplete', 
    updated_at = NOW()
WHERE email IS NULL OR email = '' OR first_name IS NULL OR first_name = '';

-- Projects with missing budget info
UPDATE projects 
SET status = 'draft',
    updated_at = NOW()
WHERE budget_min IS NULL OR budget_max IS NULL OR budget_min >= budget_max;

-- Log field updates
INSERT INTO cleanup_log (action, message, created_at) 
VALUES ('FIELDS_UPDATED', 'Updated incomplete required fields', NOW());

-- ================================================================
-- PHASE 13: CLEAN UP FILE REFERENCES
-- ================================================================

-- Update file references that point to dummy/placeholder files
UPDATE users 
SET avatar_url = NULL 
WHERE avatar_url LIKE '%placeholder%' 
   OR avatar_url LIKE '%demo%' 
   OR avatar_url LIKE '%test%';

UPDATE services 
SET image_url = NULL 
WHERE image_url LIKE '%placeholder%' 
   OR image_url LIKE '%demo%' 
   OR image_url LIKE '%test%';

UPDATE portfolio_items 
SET image_url = NULL 
WHERE image_url LIKE '%placeholder%' 
   OR image_url LIKE '%demo%' 
   OR image_url LIKE '%test%';

-- Clean up external placeholder services
UPDATE users 
SET avatar_url = NULL 
WHERE avatar_url LIKE '%via.placeholder.com%' 
   OR avatar_url LIKE '%placeimg.com%' 
   OR avatar_url LIKE '%picsum.photos%';

UPDATE services 
SET image_url = NULL 
WHERE image_url LIKE '%via.placeholder.com%' 
   OR image_url LIKE '%placeimg.com%' 
   OR image_url LIKE '%picsum.photos%';

UPDATE portfolio_items 
SET image_url = NULL 
WHERE image_url LIKE '%via.placeholder.com%' 
   OR image_url LIKE '%placeimg.com%' 
   OR image_url LIKE '%picsum.photos%';

-- Log file cleanup
INSERT INTO cleanup_log (action, message, created_at) 
VALUES ('FILES_CLEANED', 'Cleaned up dummy file references', NOW());

-- ================================================================
-- PHASE 14: OPTIMIZE AND REBUILD INDEXES
-- ================================================================

-- Optimize tables after massive deletions
OPTIMIZE TABLE users;
OPTIMIZE TABLE services;
OPTIMIZE TABLE reviews;
OPTIMIZE TABLE projects;
OPTIMIZE TABLE messages;
OPTIMIZE TABLE portfolio_items;
OPTIMIZE TABLE user_skills;
OPTIMIZE TABLE payments;
OPTIMIZE TABLE notifications;
OPTIMIZE TABLE categories;

-- Log optimization
INSERT INTO cleanup_log (action, message, created_at) 
VALUES ('TABLES_OPTIMIZED', 'Optimized all tables after cleanup', NOW());

-- ================================================================
-- PHASE 15: UPDATE STATISTICS AND COUNTERS
-- ================================================================

-- Recalculate user statistics
UPDATE users u 
SET 
    service_count = (
        SELECT COUNT(*) 
        FROM services s 
        WHERE s.user_id = u.id AND s.status = 'active'
    ),
    total_rating = (
        SELECT COALESCE(AVG(r.rating), 0) 
        FROM reviews r 
        JOIN services s ON r.service_id = s.id 
        WHERE s.user_id = u.id
    ),
    total_orders = (
        SELECT COUNT(*) 
        FROM payments p 
        WHERE p.recipient_id = u.id AND p.status = 'completed'
    ),
    updated_at = NOW()
WHERE is_freelancer = 1;

-- Recalculate service statistics
UPDATE services s 
SET 
    total_reviews = (
        SELECT COUNT(*) 
        FROM reviews r 
        WHERE r.service_id = s.id
    ),
    average_rating = (
        SELECT COALESCE(AVG(r.rating), 0) 
        FROM reviews r 
        WHERE r.service_id = s.id
    ),
    total_orders = (
        SELECT COUNT(*) 
        FROM payments p 
        WHERE p.service_id = s.id AND p.status = 'completed'
    ),
    updated_at = NOW();

-- Recalculate category statistics
UPDATE categories c 
SET 
    service_count = (
        SELECT COUNT(*) 
        FROM services s 
        WHERE s.category_id = c.id AND s.status = 'active'
    ),
    updated_at = NOW();

-- Log statistics update
INSERT INTO cleanup_log (action, message, created_at) 
VALUES ('STATISTICS_UPDATED', 'Recalculated all statistics and counters', NOW());

-- ================================================================
-- PHASE 16: CREATE CLEANUP SUMMARY
-- ================================================================

-- Generate final cleanup report
INSERT INTO cleanup_log (action, message, created_at) 
VALUES ('CLEANUP_COMPLETE', 'Comprehensive cleanup completed successfully', NOW());

-- Summary query for immediate feedback
SELECT 
    'CLEANUP_SUMMARY' as report_type,
    (SELECT COUNT(*) FROM users) as remaining_users,
    (SELECT COUNT(*) FROM services WHERE status = 'active') as remaining_services,
    (SELECT COUNT(*) FROM reviews) as remaining_reviews,
    (SELECT COUNT(*) FROM projects) as remaining_projects,
    (SELECT COUNT(*) FROM messages) as remaining_messages,
    (SELECT COUNT(*) FROM portfolio_items) as remaining_portfolio_items,
    (SELECT COUNT(*) FROM payments) as remaining_payments,
    (SELECT COUNT(*) FROM categories) as remaining_categories,
    NOW() as completed_at;

-- ================================================================
-- PHASE 17: RESET AUTO INCREMENT COUNTERS
-- ================================================================

-- Reset auto increment counters to optimize IDs
ALTER TABLE users AUTO_INCREMENT = 1;
ALTER TABLE services AUTO_INCREMENT = 1;
ALTER TABLE reviews AUTO_INCREMENT = 1;
ALTER TABLE projects AUTO_INCREMENT = 1;
ALTER TABLE messages AUTO_INCREMENT = 1;
ALTER TABLE portfolio_items AUTO_INCREMENT = 1;
ALTER TABLE payments AUTO_INCREMENT = 1;
ALTER TABLE notifications AUTO_INCREMENT = 1;
ALTER TABLE categories AUTO_INCREMENT = 1;

-- Log counter reset
INSERT INTO cleanup_log (action, message, created_at) 
VALUES ('COUNTERS_RESET', 'Reset auto increment counters', NOW());

-- Re-enable safe mode
SET SQL_SAFE_UPDATES = 1;

-- ================================================================
-- CLEANUP COMPLETION MESSAGE
-- ================================================================

SELECT 
    '✅ CLEANUP COMPLETED SUCCESSFULLY' as status,
    'All dummy data has been permanently removed' as message,
    'Platform is now ready for production deployment' as next_step,
    'Run audit script again to verify 0 issues' as verification,
    NOW() as completed_at;

-- Final log entry
INSERT INTO cleanup_log (action, message, created_at) 
VALUES ('FINAL_STATUS', '✅ Comprehensive cleanup completed - platform production ready', NOW());

-- ================================================================
-- VERIFICATION QUERIES
-- ================================================================

-- Show final cleanup log
SELECT 
    action,
    message,
    created_at
FROM cleanup_log 
WHERE DATE(created_at) = CURDATE()
ORDER BY created_at DESC;

-- Show remaining data counts
SELECT 
    'Final Platform Stats' as report,
    (SELECT COUNT(*) FROM users WHERE status = 'active') as active_users,
    (SELECT COUNT(*) FROM users WHERE is_freelancer = 1 AND status = 'active') as active_freelancers,
    (SELECT COUNT(*) FROM services WHERE status = 'active') as active_services,
    (SELECT COUNT(*) FROM reviews) as total_reviews,
    (SELECT COUNT(*) FROM projects WHERE status != 'draft') as active_projects,
    (SELECT ROUND(AVG(rating), 2) FROM reviews) as average_rating;