-- =====================================================
-- Badge System: 100 Badges Fundador (Pioneer Badges)
-- LABUREMOS Platform - Exclusive founder badges #1-#100
-- =====================================================

USE laburemos_db;

-- Procedure to create Founder badges from 1 to 100
DELIMITER $$

DROP PROCEDURE IF EXISTS CreateFounderBadges$$

CREATE PROCEDURE CreateFounderBadges()
BEGIN
    DECLARE i INT DEFAULT 1;
    DECLARE founder_category_id INT;
    DECLARE badge_name VARCHAR(100);
    DECLARE badge_description TEXT;
    DECLARE badge_rarity VARCHAR(20);
    DECLARE badge_points INT;
    
    -- Get Pioneros category ID
    SELECT id INTO founder_category_id 
    FROM badge_categories 
    WHERE slug = 'pioneros' 
    LIMIT 1;
    
    -- If category doesn't exist, create it
    IF founder_category_id IS NULL THEN
        INSERT INTO badge_categories (name, slug, description, icon, color, display_order)
        VALUES ('Pioneros', 'pioneros', 'Badges exclusivos para los primeros usuarios de LABUREMOS', 'crown', '#f59e0b', 1);
        SET founder_category_id = LAST_INSERT_ID();
    END IF;
    
    -- Clear existing founder badges to avoid duplicates
    DELETE FROM badges WHERE slug LIKE 'fundador-%' AND category_id = founder_category_id;
    
    -- Create 100 founder badges
    WHILE i <= 100 DO
        SET badge_name = CONCAT('Fundador #', i);
        
        -- All founder badges have the same style - Exclusive rarity with consistent points
        SET badge_rarity = 'exclusive';
        SET badge_points = 500;
        
        -- Personalized description based on founder number
        IF i = 1 THEN
            SET badge_description = 'Fundador #1 - El primer usuario registrado en LABUREMOS. Eres el pionero absoluto de esta comunidad profesional.';
        ELSE
            SET badge_description = CONCAT('Fundador #', i, ' - Eres uno de los primeros 100 usuarios registrados en LABUREMOS. Tu confianza temprana fue fundamental para construir esta comunidad.');
        END IF;
        
        -- Insert the founder badge
        INSERT INTO badges (
            name, 
            slug, 
            description, 
            icon, 
            rarity, 
            points, 
            category_id, 
            is_active, 
            is_automatic,
            display_order,
            criteria,
            created_at,
            updated_at
        ) VALUES (
            badge_name,
            CONCAT('fundador-', i),
            badge_description,
            'crown',
            badge_rarity,
            badge_points,
            founder_category_id,
            1, -- is_active
            1, -- is_automatic (assigned via trigger)
            i, -- display_order
            JSON_OBJECT('registration_order', i, 'max_users', 100, 'exclusive', true),
            NOW(),
            NOW()
        );
        
        SET i = i + 1;
    END WHILE;
    
    -- Create a summary of created badges
    SELECT 
        COUNT(*) as total_badges_created,
        badge_rarity as rarity,
        COUNT(*) as count_by_rarity,
        MIN(badge_points) as min_points,
        MAX(badge_points) as max_points
    FROM badges 
    WHERE slug LIKE 'fundador-%' 
    GROUP BY badge_rarity
    ORDER BY 
        CASE badge_rarity
            WHEN 'legendary' THEN 1
            WHEN 'exclusive' THEN 2
            WHEN 'epic' THEN 3
            WHEN 'rare' THEN 4
            WHEN 'common' THEN 5
        END;
    
END$$

DELIMITER ;

-- Execute the procedure to create all founder badges
CALL CreateFounderBadges();

-- Update the trigger to assign founder badges based on registration order
DELIMITER $$

DROP TRIGGER IF EXISTS assign_founder_badge_on_registration$$

CREATE TRIGGER assign_founder_badge_on_registration
    AFTER INSERT ON users
    FOR EACH ROW
BEGIN
    DECLARE user_count INT;
    DECLARE founder_badge_id INT;
    
    -- Only assign to regular users (not admin/mod/system)
    IF NEW.role NOT IN ('admin', 'moderator', 'system', 'support') THEN
        
        -- Count total non-admin users to determine founder number
        SELECT COUNT(*) INTO user_count
        FROM users 
        WHERE role NOT IN ('admin', 'moderator', 'system', 'support')
        AND id <= NEW.id;
        
        -- If within first 100 users, assign corresponding founder badge
        IF user_count <= 100 THEN
            
            -- Get the founder badge ID for this position
            SELECT id INTO founder_badge_id
            FROM badges 
            WHERE slug = CONCAT('fundador-', user_count)
            LIMIT 1;
            
            -- Assign the founder badge
            IF founder_badge_id IS NOT NULL THEN
                INSERT INTO user_badges (user_id, badge_id, metadata, earned_at)
                VALUES (
                    NEW.id, 
                    founder_badge_id, 
                    JSON_OBJECT(
                        'auto_assigned', true,
                        'registration_position', user_count,
                        'registration_date', NEW.created_at,
                        'founder_tier', 'founder',
                        'founder_number', user_count
                    ),
                    NOW()
                );
            END IF;
        END IF;
    END IF;
END$$

DELIMITER ;

-- Display final summary
SELECT 
    '=== FOUNDER BADGES CREATION SUMMARY ===' as status,
    COUNT(*) as total_badges,
    MIN(display_order) as first_founder,
    MAX(display_order) as last_founder
FROM badges 
WHERE slug LIKE 'fundador-%';

-- Show badge distribution by rarity
SELECT 
    rarity,
    COUNT(*) as badge_count,
    CONCAT(MIN(display_order), ' - ', MAX(display_order)) as founder_range,
    CONCAT(MIN(points), ' - ', MAX(points), ' pts') as points_range
FROM badges 
WHERE slug LIKE 'fundador-%'
GROUP BY rarity
ORDER BY 
    CASE rarity
        WHEN 'legendary' THEN 1
        WHEN 'exclusive' THEN 2  
        WHEN 'epic' THEN 3
        WHEN 'rare' THEN 4
        WHEN 'common' THEN 5
    END;

-- Show some example badges
SELECT 
    display_order as founder_number,
    name,
    rarity,
    points,
    LEFT(description, 80) as description_preview
FROM badges 
WHERE slug LIKE 'fundador-%'
AND display_order IN (1, 5, 10, 25, 50, 75, 100)
ORDER BY display_order;