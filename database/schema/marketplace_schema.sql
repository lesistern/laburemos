-- =====================================================
-- MARKETPLACE SCHEMA - LABURAR PLATFORM
-- =====================================================
-- Services catalog, categories, search, and discovery
-- Phase 2: Marketplace Core Implementation
-- =====================================================

-- Services table - Main service listings
CREATE TABLE services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    subcategory_id INT,
    
    -- Basic Info
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    short_description VARCHAR(500),
    
    -- Pricing
    pricing_type ENUM('fixed', 'hourly', 'package') NOT NULL DEFAULT 'fixed',
    base_price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'ARS',
    
    -- Package pricing (for package type)
    packages JSON, -- [{name, description, price, delivery_days, revisions}]
    
    -- Delivery & Timeline
    delivery_days INT NOT NULL DEFAULT 7,
    revisions_included INT DEFAULT 2,
    express_delivery BOOLEAN DEFAULT FALSE,
    express_delivery_days INT,
    express_delivery_fee DECIMAL(10,2),
    
    -- Media
    featured_image VARCHAR(500),
    gallery_images JSON, -- Array of image URLs
    video_url VARCHAR(500),
    
    -- Service Features
    features JSON, -- Array of service features/benefits
    requirements TEXT, -- What client needs to provide
    
    -- SEO & Discovery
    tags JSON, -- Array of tags for search
    keywords VARCHAR(1000), -- Comma separated keywords
    
    -- Stats & Performance
    views_count INT DEFAULT 0,
    orders_count INT DEFAULT 0,
    favorites_count INT DEFAULT 0,
    rating_average DECIMAL(3,2) DEFAULT 0,
    rating_count INT DEFAULT 0,
    
    -- Status & Visibility
    status ENUM('draft', 'active', 'paused', 'suspended') DEFAULT 'draft',
    featured BOOLEAN DEFAULT FALSE,
    promoted_until DATETIME NULL,
    
    -- Meta
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_category (category_id, subcategory_id),
    INDEX idx_status (status),
    INDEX idx_featured (featured),
    INDEX idx_price (base_price),
    INDEX idx_rating (rating_average),
    INDEX idx_created (created_at),
    FULLTEXT idx_search (title, description, keywords),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES service_categories(id),
    FOREIGN KEY (subcategory_id) REFERENCES service_subcategories(id)
);

-- Service Categories - Main categories for organization
CREATE TABLE service_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(100), -- Icon class or emoji
    color VARCHAR(7), -- Hex color code
    
    -- Hierarchy
    parent_id INT NULL,
    
    -- Display
    sort_order INT DEFAULT 0,
    featured BOOLEAN DEFAULT FALSE,
    
    -- Stats
    services_count INT DEFAULT 0,
    
    -- Status
    active BOOLEAN DEFAULT TRUE,
    
    -- Meta
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_parent (parent_id),
    INDEX idx_slug (slug),
    INDEX idx_active (active),
    INDEX idx_featured (featured),
    
    FOREIGN KEY (parent_id) REFERENCES service_categories(id) ON DELETE SET NULL
);

-- Service Subcategories - Detailed categorization
CREATE TABLE service_subcategories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    
    -- Display
    sort_order INT DEFAULT 0,
    
    -- Stats
    services_count INT DEFAULT 0,
    
    -- Status
    active BOOLEAN DEFAULT TRUE,
    
    -- Meta
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_category (category_id),
    INDEX idx_slug (slug),
    INDEX idx_active (active),
    
    UNIQUE KEY unique_category_slug (category_id, slug),
    
    FOREIGN KEY (category_id) REFERENCES service_categories(id) ON DELETE CASCADE
);

-- Service Tags - Flexible tagging system
CREATE TABLE service_tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    usage_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_slug (slug),
    INDEX idx_usage (usage_count)
);

-- Service Tag Relations - Many-to-many relationship
CREATE TABLE service_tag_relations (
    service_id INT NOT NULL,
    tag_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (service_id, tag_id),
    
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES service_tags(id) ON DELETE CASCADE
);

-- Service Favorites - User favorites/bookmarks
CREATE TABLE service_favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    service_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_user_service (user_id, service_id),
    INDEX idx_user (user_id),
    INDEX idx_service (service_id),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

-- Service Views - Track service visibility and analytics
CREATE TABLE service_views (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_id INT NOT NULL,
    user_id INT NULL, -- NULL for anonymous views
    ip_address VARCHAR(45),
    user_agent TEXT,
    referrer VARCHAR(500),
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_service (service_id),
    INDEX idx_user (user_id),
    INDEX idx_viewed_at (viewed_at),
    INDEX idx_ip (ip_address),
    
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Service FAQ - Frequently asked questions per service
CREATE TABLE service_faqs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_id INT NOT NULL,
    question VARCHAR(500) NOT NULL,
    answer TEXT NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_service (service_id),
    INDEX idx_sort (sort_order),
    
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

-- Service Requirements - Client requirements to start the service
CREATE TABLE service_requirements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_id INT NOT NULL,
    requirement_text VARCHAR(500) NOT NULL,
    is_mandatory BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_service (service_id),
    INDEX idx_sort (sort_order),
    
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

-- Search Filters - Saved search filters for users
CREATE TABLE search_filters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    filters JSON NOT NULL, -- {category, price_min, price_max, delivery_days, etc}
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user (user_id),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Service Comparisons - Compare multiple services
CREATE TABLE service_comparisons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    service_ids JSON NOT NULL, -- Array of service IDs
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    
    INDEX idx_user (user_id),
    INDEX idx_created (created_at),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- INITIAL DATA - CATEGORIES
-- =====================================================

INSERT INTO service_categories (name, slug, description, icon, color, sort_order, featured) VALUES
-- Development & Programming
('Development & Programming', 'development-programming', 'Web development, mobile apps, software solutions', '💻', '#0066CC', 1, TRUE),
('Design & Creative', 'design-creative', 'Graphic design, branding, UI/UX, video editing', '🎨', '#FF6B35', 2, TRUE),
('Digital Marketing', 'digital-marketing', 'SEO, social media, advertising, content marketing', '📈', '#28A745', 3, TRUE),
('Writing & Translation', 'writing-translation', 'Content writing, copywriting, translation services', '✍️', '#6F42C1', 4, TRUE),
('Business & Consulting', 'business-consulting', 'Business strategy, consulting, market research', '💼', '#20C997', 5, TRUE),
('Video & Animation', 'video-animation', 'Video editing, motion graphics, 3D animation', '🎬', '#FD7E14', 6, FALSE),
('Music & Audio', 'music-audio', 'Audio editing, music production, voiceover', '🎵', '#E83E8C', 7, FALSE),
('Lifestyle', 'lifestyle', 'Fitness, wellness, personal development', '🌱', '#17A2B8', 8, FALSE);

-- =====================================================
-- SUBCATEGORIES FOR MAIN CATEGORIES
-- =====================================================

-- Development & Programming Subcategories
INSERT INTO service_subcategories (category_id, name, slug, description, sort_order) VALUES
(1, 'Website Development', 'website-development', 'Custom websites, landing pages, CMS development', 1),
(1, 'Mobile App Development', 'mobile-app-development', 'iOS, Android, React Native, Flutter apps', 2),
(1, 'E-commerce Development', 'ecommerce-development', 'Online stores, payment integration, shopping carts', 3),
(1, 'WordPress Development', 'wordpress-development', 'WordPress themes, plugins, customization', 4),
(1, 'Backend Development', 'backend-development', 'APIs, databases, server-side development', 5),
(1, 'Frontend Development', 'frontend-development', 'React, Vue, Angular, responsive design', 6),
(1, 'Database Administration', 'database-administration', 'MySQL, PostgreSQL, MongoDB optimization', 7),
(1, 'DevOps & Cloud', 'devops-cloud', 'AWS, Docker, CI/CD, server management', 8);

-- Design & Creative Subcategories
INSERT INTO service_subcategories (category_id, name, slug, description, sort_order) VALUES
(2, 'Logo Design', 'logo-design', 'Brand identity, logo creation, business cards', 1),
(2, 'Web Design', 'web-design', 'UI/UX design, website mockups, prototypes', 2),
(2, 'Graphic Design', 'graphic-design', 'Brochures, flyers, social media graphics', 3),
(2, 'Illustration', 'illustration', 'Digital art, character design, illustrations', 4),
(2, 'Print Design', 'print-design', 'Business cards, brochures, packaging design', 5),
(2, 'Brand Identity', 'brand-identity', 'Complete branding packages, style guides', 6),
(2, 'Video Editing', 'video-editing', 'Video production, editing, motion graphics', 7),
(2, 'Photography', 'photography', 'Product photography, photo editing, retouching', 8);

-- Digital Marketing Subcategories
INSERT INTO service_subcategories (category_id, name, slug, description, sort_order) VALUES
(3, 'SEO', 'seo', 'Search engine optimization, keyword research', 1),
(3, 'Social Media Marketing', 'social-media-marketing', 'Instagram, Facebook, LinkedIn management', 2),
(3, 'Google Ads', 'google-ads', 'PPC campaigns, Google AdWords management', 3),
(3, 'Facebook Ads', 'facebook-ads', 'Facebook and Instagram advertising', 4),
(3, 'Content Marketing', 'content-marketing', 'Blog posts, content strategy, newsletters', 5),
(3, 'Email Marketing', 'email-marketing', 'Email campaigns, automation, templates', 6),
(3, 'Analytics & Reporting', 'analytics-reporting', 'Google Analytics, performance reports', 7),
(3, 'Influencer Marketing', 'influencer-marketing', 'Influencer outreach, campaign management', 8);

-- =====================================================
-- INITIAL TAGS
-- =====================================================

INSERT INTO service_tags (name, slug) VALUES
-- Programming tags
('PHP', 'php'), ('JavaScript', 'javascript'), ('React', 'react'), ('Vue.js', 'vue-js'),
('Laravel', 'laravel'), ('WordPress', 'wordpress'), ('Shopify', 'shopify'), ('WooCommerce', 'woocommerce'),
('Mobile App', 'mobile-app'), ('iOS', 'ios'), ('Android', 'android'), ('Flutter', 'flutter'),
('API Development', 'api-development'), ('Database', 'database'), ('MySQL', 'mysql'), ('MongoDB', 'mongodb'),

-- Design tags
('Logo Design', 'logo-design'), ('Branding', 'branding'), ('UI/UX', 'ui-ux'), ('Web Design', 'web-design'),
('Graphic Design', 'graphic-design'), ('Illustration', 'illustration'), ('Video Editing', 'video-editing'),
('Photoshop', 'photoshop'), ('Figma', 'figma'), ('Adobe Illustrator', 'adobe-illustrator'),

-- Marketing tags
('SEO', 'seo'), ('Social Media', 'social-media'), ('Google Ads', 'google-ads'), ('Facebook Ads', 'facebook-ads'),
('Content Writing', 'content-writing'), ('Email Marketing', 'email-marketing'), ('Analytics', 'analytics'),
('Instagram', 'instagram'), ('LinkedIn', 'linkedin'), ('TikTok', 'tiktok'),

-- General tags
('Spanish', 'spanish'), ('English', 'english'), ('Argentina', 'argentina'), ('Buenos Aires', 'buenos-aires'),
('Fast Delivery', 'fast-delivery'), ('24h Delivery', '24h-delivery'), ('Revision Included', 'revision-included'),
('Premium', 'premium'), ('Budget Friendly', 'budget-friendly'), ('Express', 'express');