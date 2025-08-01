-- ================================================================
-- LABUREMOS Data Audit Script - Comprehensive Dummy Data Detection
-- ================================================================
-- 
-- PURPOSE: Identify all dummy, test, placeholder, and low-quality data
-- across the entire LABUREMOS platform to ensure production readiness
--
-- WARNING: This audit should show 0 issues before production launch
--
-- Author: LABUREMOS Data Quality Team
-- Version: 1.0
-- Date: 2025-07-20
-- ================================================================

-- === USER DATA AUDIT ===
-- Identify dummy user accounts and incomplete profiles
SELECT 'USERS' as table_name, 'Dummy users found' as issue, COUNT(*) as count
FROM users 
WHERE 
  email LIKE '%test%' OR 
  email LIKE '%demo%' OR 
  email LIKE '%example%' OR
  email LIKE '%@mailinator.com' OR
  email LIKE '%@10minutemail.%' OR
  email LIKE '%@tempmail.%' OR
  email LIKE '%@guerrillamail.%' OR
  first_name IN ('John', 'Jane', 'Test', 'Demo', 'Admin', 'Usuario', 'User') OR
  last_name IN ('Doe', 'Smith', 'Test', 'Demo', 'Prueba', 'User') OR
  first_name LIKE '%test%' OR
  first_name LIKE '%demo%' OR
  first_name LIKE '%admin%' OR
  bio LIKE '%Lorem ipsum%' OR
  bio LIKE '%placeholder%' OR
  bio LIKE '%dummy%' OR
  bio LIKE '%sample%' OR
  bio LIKE '%This is a test%' OR
  bio LIKE '%example bio%'

UNION ALL

-- === INCOMPLETE USER PROFILES ===
SELECT 'USERS' as table_name, 'Incomplete user profiles' as issue, COUNT(*) as count
FROM users 
WHERE 
  bio IS NULL OR 
  bio = '' OR 
  LENGTH(bio) < 30 OR
  avatar_url IS NULL OR 
  avatar_url = '' OR
  avatar_url LIKE '%placeholder%' OR
  avatar_url LIKE '%demo%' OR
  (is_freelancer = 1 AND professional_title IS NULL) OR
  (is_freelancer = 1 AND professional_title = '')

UNION ALL

-- === SERVICE DATA AUDIT ===
-- Identify dummy services and poor quality listings
SELECT 'SERVICES' as table_name, 'Dummy services found' as issue, COUNT(*) as count
FROM services 
WHERE 
  title LIKE '%test%' OR 
  title LIKE '%demo%' OR 
  title LIKE '%lorem%' OR
  title LIKE '%placeholder%' OR
  title LIKE '%dummy%' OR
  title LIKE '%sample%' OR
  title LIKE '%example%' OR
  title IN ('Test Service', 'Demo Service', 'Sample Service') OR
  description LIKE '%Lorem ipsum%' OR
  description LIKE '%placeholder%' OR
  description LIKE '%This is a test%' OR
  description LIKE '%dummy%' OR
  description LIKE '%sample description%' OR
  description LIKE '%example description%' OR
  LENGTH(description) < 50

UNION ALL

-- === LOW QUALITY SERVICES ===
SELECT 'SERVICES' as table_name, 'Low quality services' as issue, COUNT(*) as count
FROM services 
WHERE 
  image_url IS NULL OR 
  image_url = '' OR
  image_url LIKE '%placeholder%' OR
  image_url LIKE '%demo%' OR
  image_url LIKE '%example%' OR
  starting_price < 500 OR -- Unrealistically low prices
  starting_price = 1000 OR starting_price = 5000 OR starting_price = 10000 -- Round numbers suggest placeholder
  delivery_time < 1 OR delivery_time > 365 -- Unrealistic delivery times

UNION ALL

-- === REVIEW DATA AUDIT ===
-- Identify fake, generic, or dummy reviews
SELECT 'REVIEWS' as table_name, 'Dummy reviews found' as issue, COUNT(*) as count
FROM reviews 
WHERE 
  comment LIKE '%Lorem%' OR
  comment LIKE '%test%' OR
  comment LIKE '%demo%' OR
  comment LIKE '%placeholder%' OR
  comment LIKE '%dummy%' OR
  comment LIKE '%sample%' OR
  comment IN ('Great work', 'Excellent service', 'Perfect', 'Amazing', 'Good job!', 'Thank you!', 'Awesome!') OR
  comment IN ('Muy bueno', 'Excelente', 'Perfecto', 'Increíble', 'Gracias') OR
  LENGTH(comment) < 15 -- Suspiciously short reviews

UNION ALL

-- === GENERIC REVIEWS ===
SELECT 'REVIEWS' as table_name, 'Generic reviews found' as issue, COUNT(*) as count
FROM reviews 
WHERE 
  rating = 5.0 AND LENGTH(comment) < 30 OR -- Perfect rating with minimal comment
  comment LIKE '%highly recommend%' OR
  comment LIKE '%will hire again%' OR
  comment LIKE '%fast delivery%' OR
  comment LIKE '%professional work%' OR
  comment LIKE '%exceeded expectations%' OR
  comment LIKE '%lo recomiendo%' OR
  comment LIKE '%volveré a contratar%' OR
  comment LIKE '%entrega rápida%'

UNION ALL

-- === MESSAGE DATA AUDIT ===
-- Identify dummy messages and conversations
SELECT 'MESSAGES' as table_name, 'Dummy messages found' as issue, COUNT(*) as count
FROM messages 
WHERE 
  content LIKE '%test%' OR
  content LIKE '%demo%' OR
  content LIKE '%lorem%' OR
  content LIKE '%placeholder%' OR
  content LIKE '%dummy%' OR
  content IN ('Hello', 'Hi', 'Hi there', 'Test message', 'Hello world', 'Hola', 'Prueba') OR
  LENGTH(content) < 5

UNION ALL

-- === PROJECT DATA AUDIT ===
-- Identify dummy projects and incomplete postings
SELECT 'PROJECTS' as table_name, 'Dummy projects found' as issue, COUNT(*) as count
FROM projects 
WHERE 
  title LIKE '%test%' OR
  title LIKE '%demo%' OR
  title LIKE '%sample%' OR
  title LIKE '%placeholder%' OR
  title LIKE '%dummy%' OR
  title LIKE '%example%' OR
  title IN ('Test Project', 'Demo Project', 'Sample Project') OR
  description LIKE '%Lorem ipsum%' OR
  description LIKE '%dummy%' OR
  description LIKE '%test project%' OR
  description LIKE '%placeholder%' OR
  LENGTH(description) < 50

UNION ALL

-- === LOW QUALITY PROJECTS ===
SELECT 'PROJECTS' as table_name, 'Low quality projects' as issue, COUNT(*) as count
FROM projects 
WHERE 
  budget_min < 1000 OR -- Unrealistically low budget
  budget_max > 10000000 OR -- Unrealistically high budget
  (budget_min = 1000 AND budget_max = 5000) OR -- Common placeholder values
  deadline < CURDATE() OR -- Past deadlines
  status = 'draft' AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY) -- Old drafts

UNION ALL

-- === PORTFOLIO DATA AUDIT ===
-- Identify dummy portfolio items
SELECT 'PORTFOLIO_ITEMS' as table_name, 'Dummy portfolio items found' as issue, COUNT(*) as count
FROM portfolio_items 
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
  LENGTH(description) < 30

UNION ALL

-- === CATEGORY DATA AUDIT ===
-- Identify test categories and incomplete category data
SELECT 'CATEGORIES' as table_name, 'Suspicious categories found' as issue, COUNT(*) as count
FROM categories 
WHERE 
  name LIKE '%Test%' OR
  name LIKE '%Demo%' OR
  name LIKE '%Sample%' OR
  name LIKE '%Placeholder%' OR
  description LIKE '%Lorem ipsum%' OR
  description LIKE '%placeholder%' OR
  description LIKE '%dummy%' OR
  description IS NULL OR
  description = ''

UNION ALL

-- === SKILL DATA AUDIT ===
-- Identify dummy skills and incomplete skill data
SELECT 'USER_SKILLS' as table_name, 'Dummy skills found' as issue, COUNT(*) as count
FROM user_skills 
WHERE 
  skill_name LIKE '%test%' OR
  skill_name LIKE '%demo%' OR
  skill_name LIKE '%sample%' OR
  skill_name IN ('Test Skill', 'Demo Skill', 'Example', 'Placeholder') OR
  level < 1 OR level > 5 -- Invalid skill levels

UNION ALL

-- === PAYMENT DATA AUDIT ===
-- Identify test payments and suspicious transactions
SELECT 'PAYMENTS' as table_name, 'Suspicious payments found' as issue, COUNT(*) as count
FROM payments 
WHERE 
  amount < 100 OR -- Unrealistically low payments
  amount = 1000 OR amount = 5000 OR amount = 10000 OR -- Round placeholder amounts
  payment_method = 'test' OR
  payment_method LIKE '%demo%' OR
  payment_method LIKE '%placeholder%' OR
  transaction_id LIKE '%test%' OR
  transaction_id LIKE '%demo%'

UNION ALL

-- === NOTIFICATION DATA AUDIT ===
-- Identify test notifications
SELECT 'NOTIFICATIONS' as table_name, 'Test notifications found' as issue, COUNT(*) as count
FROM notifications 
WHERE 
  title LIKE '%test%' OR
  title LIKE '%demo%' OR
  message LIKE '%test%' OR
  message LIKE '%demo%' OR
  message LIKE '%placeholder%' OR
  message LIKE '%Lorem ipsum%'

UNION ALL

-- === IMAGE/FILE AUDIT ===
-- Identify placeholder images and files across all tables
SELECT 'FILE_AUDIT' as table_name, 'Placeholder images found' as issue, COUNT(*) as count
FROM (
  SELECT image_url as file_path FROM services WHERE image_url IS NOT NULL
  UNION ALL
  SELECT avatar_url as file_path FROM users WHERE avatar_url IS NOT NULL
  UNION ALL
  SELECT image_url as file_path FROM portfolio_items WHERE image_url IS NOT NULL
  UNION ALL
  SELECT icon as file_path FROM categories WHERE icon IS NOT NULL AND icon LIKE 'http%'
) files
WHERE 
  file_path LIKE '%placeholder%' OR
  file_path LIKE '%demo%' OR
  file_path LIKE '%test%' OR
  file_path LIKE '%sample%' OR
  file_path LIKE '%lorem%' OR
  file_path LIKE '%dummy%' OR
  file_path LIKE '%example%' OR
  file_path LIKE '%via.placeholder.com%' OR
  file_path LIKE '%placeimg.com%' OR
  file_path LIKE '%picsum.photos%'

UNION ALL

-- === DATA CONSISTENCY AUDIT ===
-- Check for orphaned and inconsistent data
SELECT 'DATA_CONSISTENCY' as table_name, 'Orphaned services' as issue, COUNT(*) as count
FROM services 
WHERE user_id NOT IN (SELECT id FROM users)

UNION ALL

SELECT 'DATA_CONSISTENCY' as table_name, 'Orphaned reviews' as issue, COUNT(*) as count
FROM reviews 
WHERE service_id NOT IN (SELECT id FROM services) OR user_id NOT IN (SELECT id FROM users)

UNION ALL

SELECT 'DATA_CONSISTENCY' as table_name, 'Invalid ratings' as issue, COUNT(*) as count
FROM reviews 
WHERE rating < 1 OR rating > 5

UNION ALL

SELECT 'DATA_CONSISTENCY' as table_name, 'Empty required fields' as issue, COUNT(*) as count
FROM users 
WHERE email IS NULL OR email = '' OR first_name IS NULL OR first_name = ''

UNION ALL

-- === SUSPICIOUS PATTERNS AUDIT ===
-- Identify suspicious patterns that indicate dummy data
SELECT 'SUSPICIOUS_PATTERNS' as table_name, 'Users with sequential IDs and similar data' as issue, COUNT(*) as count
FROM users u1
JOIN users u2 ON u2.id = u1.id + 1
WHERE 
  u1.first_name = u2.first_name OR
  (u1.email LIKE '%1@%' AND u2.email LIKE '%2@%') OR
  (SUBSTRING(u1.email, 1, LOCATE('@', u1.email) - 1) = SUBSTRING(u2.email, 1, LOCATE('@', u2.email) - 1))

UNION ALL

SELECT 'SUSPICIOUS_PATTERNS' as table_name, 'Services with identical descriptions' as issue, COUNT(*) as count
FROM (
  SELECT description, COUNT(*) as cnt
  FROM services 
  WHERE description IS NOT NULL AND description != ''
  GROUP BY description
  HAVING COUNT(*) > 1
) duplicates

UNION ALL

-- === CONTENT QUALITY AUDIT ===
-- Check overall content quality metrics
SELECT 'CONTENT_QUALITY' as table_name, 'Short service descriptions' as issue, COUNT(*) as count
FROM services 
WHERE LENGTH(description) < 100

UNION ALL

SELECT 'CONTENT_QUALITY' as table_name, 'Short user bios' as issue, COUNT(*) as count
FROM users 
WHERE is_freelancer = 1 AND (bio IS NULL OR LENGTH(bio) < 50)

UNION ALL

SELECT 'CONTENT_QUALITY' as table_name, 'Projects without proper budget' as issue, COUNT(*) as count
FROM projects 
WHERE budget_min IS NULL OR budget_max IS NULL OR budget_min >= budget_max

ORDER BY table_name, issue;

-- ================================================================
-- DETAILED EXAMPLES FOR MANUAL REVIEW
-- ================================================================

-- Get specific examples of problematic data for manual inspection
SELECT 'USER_EXAMPLES' as type, id, email, CONCAT(first_name, ' ', last_name) as name, 
       LEFT(bio, 100) as bio_preview, avatar_url
FROM users 
WHERE 
  email LIKE '%test%' OR 
  email LIKE '%demo%' OR 
  first_name IN ('John', 'Jane', 'Test', 'Demo', 'Usuario') OR
  bio LIKE '%Lorem ipsum%' OR
  bio LIKE '%placeholder%'
LIMIT 10;

SELECT 'SERVICE_EXAMPLES' as type, id, title, LEFT(description, 100) as description_preview, 
       starting_price, image_url
FROM services 
WHERE 
  title LIKE '%test%' OR 
  title LIKE '%demo%' OR 
  description LIKE '%Lorem ipsum%' OR
  description LIKE '%placeholder%' OR
  starting_price IN (1000, 5000, 10000)
LIMIT 10;

SELECT 'REVIEW_EXAMPLES' as type, id, user_id, service_id, comment, rating, created_at
FROM reviews 
WHERE 
  comment LIKE '%Lorem%' OR
  comment IN ('Great work', 'Excellent service', 'Perfect', 'Amazing') OR
  LENGTH(comment) < 20
LIMIT 10;

SELECT 'PROJECT_EXAMPLES' as type, id, title, LEFT(description, 100) as description_preview,
       budget_min, budget_max, status
FROM projects 
WHERE 
  title LIKE '%test%' OR
  title LIKE '%demo%' OR
  description LIKE '%Lorem ipsum%' OR
  budget_min = budget_max OR
  (budget_min = 1000 AND budget_max = 5000)
LIMIT 10;

-- ================================================================
-- SUMMARY STATISTICS
-- ================================================================

SELECT 'SUMMARY_STATS' as type, 'Total Users' as metric, COUNT(*) as value FROM users
UNION ALL
SELECT 'SUMMARY_STATS' as type, 'Active Freelancers' as metric, COUNT(*) as value FROM users WHERE is_freelancer = 1 AND status = 'active'
UNION ALL
SELECT 'SUMMARY_STATS' as type, 'Total Services' as metric, COUNT(*) as value FROM services WHERE status = 'active'
UNION ALL
SELECT 'SUMMARY_STATS' as type, 'Total Reviews' as metric, COUNT(*) as value FROM reviews
UNION ALL
SELECT 'SUMMARY_STATS' as type, 'Total Projects' as metric, COUNT(*) as value FROM projects
UNION ALL
SELECT 'SUMMARY_STATS' as type, 'Average Rating' as metric, ROUND(AVG(rating), 2) as value FROM reviews
UNION ALL
SELECT 'SUMMARY_STATS' as type, 'Users with Complete Profiles' as metric, 
       COUNT(*) as value FROM users WHERE bio IS NOT NULL AND LENGTH(bio) >= 50 AND avatar_url IS NOT NULL
UNION ALL
SELECT 'SUMMARY_STATS' as type, 'Services with Quality Descriptions' as metric,
       COUNT(*) as value FROM services WHERE LENGTH(description) >= 100;

-- ================================================================
-- AUDIT COMPLETION MESSAGE
-- ================================================================
SELECT 'AUDIT_COMPLETE' as status, 
       'Data audit completed - review results above' as message,
       'If any issues found, run cleanup script before production' as next_step,
       NOW() as completed_at;