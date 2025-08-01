<?php
/**
 * Migration: Create Portfolio and Media System
 * LaburAR Complete Platform - Portfolio Management
 * Generated: 2025-01-18
 * Version: 1.0
 */

class Migration_003_CreatePortfolioMedia
{
    private $pdo;
    
    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }
    
    /**
     * Run the migration
     */
    public function up()
    {
        try {
            $this->pdo->beginTransaction();
            
            // Create portfolio and media tables
            $this->createPortfolioItemsTable();
            $this->createMediaFilesTable();
            $this->createCategoriesTable();
            
            // Insert initial categories
            $this->insertInitialCategories();
            
            $this->pdo->commit();
            echo "✅ Migration 003: Portfolio and media system created successfully\n";
            
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw new Exception("Migration 003 failed: " . $e->getMessage());
        }
    }
    
    /**
     * Rollback the migration
     */
    public function down()
    {
        try {
            $this->pdo->beginTransaction();
            
            $this->pdo->exec("DROP TABLE IF EXISTS media_files");
            $this->pdo->exec("DROP TABLE IF EXISTS portfolio_items");
            $this->pdo->exec("DROP TABLE IF EXISTS categories");
            
            $this->pdo->commit();
            echo "✅ Migration 003: Portfolio and media tables dropped successfully\n";
            
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw new Exception("Migration 003 rollback failed: " . $e->getMessage());
        }
    }
    
    private function createPortfolioItemsTable()
    {
        $sql = "
        CREATE TABLE portfolio_items (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            freelancer_id BIGINT UNSIGNED NOT NULL,
            
            -- Portfolio item details
            title VARCHAR(255) NOT NULL,
            description TEXT NULL,
            project_url VARCHAR(500) NULL,
            
            -- Project metadata
            project_duration_days INT UNSIGNED NULL,
            budget_range_min DECIMAL(12,2) UNSIGNED NULL,
            budget_range_max DECIMAL(12,2) UNSIGNED NULL,
            currency VARCHAR(3) DEFAULT 'ARS',
            
            -- Skills used (JSON array of skill IDs)
            skills_used JSON NULL,
            
            -- Client testimonial
            client_testimonial TEXT NULL,
            client_name VARCHAR(255) NULL,
            client_company VARCHAR(255) NULL,
            
            -- Display options
            featured BOOLEAN DEFAULT FALSE,
            display_order INT UNSIGNED DEFAULT 0,
            is_public BOOLEAN DEFAULT TRUE,
            
            -- Timestamps
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            
            -- Foreign keys
            FOREIGN KEY (freelancer_id) REFERENCES freelancers(id) ON DELETE CASCADE,
            
            -- Indexes
            INDEX idx_freelancer_featured (freelancer_id, featured),
            INDEX idx_display_order (display_order),
            INDEX idx_is_public (is_public),
            INDEX idx_budget_range (budget_range_min, budget_range_max),
            INDEX idx_portfolio_featured_public (freelancer_id, featured, is_public),
            
            -- Full text search
            FULLTEXT(title, description, client_testimonial)
        ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
        
        $this->pdo->exec($sql);
    }
    
    private function createMediaFilesTable()
    {
        $sql = "
        CREATE TABLE media_files (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            
            -- Ownership
            owner_id BIGINT UNSIGNED NOT NULL,
            owner_type ENUM('user', 'freelancer', 'client', 'portfolio_item') NOT NULL,
            related_id BIGINT UNSIGNED NULL COMMENT 'ID of related entity (portfolio_item, etc)',
            
            -- File information
            file_type ENUM('image', 'video', 'document', 'audio') NOT NULL,
            file_path VARCHAR(500) NOT NULL,
            file_name VARCHAR(255) NOT NULL,
            file_size INT UNSIGNED NOT NULL COMMENT 'File size in bytes',
            mime_type VARCHAR(100) NOT NULL,
            
            -- Image/video specific
            width INT UNSIGNED NULL,
            height INT UNSIGNED NULL,
            duration INT UNSIGNED NULL COMMENT 'Duration in seconds for video/audio',
            
            -- SEO and accessibility
            alt_text VARCHAR(255) NULL,
            title VARCHAR(255) NULL,
            description TEXT NULL,
            
            -- Processing status
            processing_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
            thumbnail_path VARCHAR(500) NULL,
            
            -- Security
            virus_scan_status ENUM('pending', 'clean', 'infected', 'error') DEFAULT 'pending',
            virus_scan_at TIMESTAMP NULL,
            
            -- Metadata
            metadata JSON NULL COMMENT 'EXIF data, etc',
            
            -- Timestamps
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            
            -- Indexes
            INDEX idx_owner (owner_id, owner_type),
            INDEX idx_related (related_id),
            INDEX idx_file_type (file_type),
            INDEX idx_processing_status (processing_status),
            INDEX idx_virus_scan (virus_scan_status),
            INDEX idx_uploaded_at (uploaded_at)
        ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
        
        $this->pdo->exec($sql);
    }
    
    private function createCategoriesTable()
    {
        $sql = "
        CREATE TABLE categories (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            slug VARCHAR(100) NOT NULL UNIQUE,
            parent_id INT UNSIGNED NULL,
            description TEXT NULL,
            icon VARCHAR(100) NULL,
            sort_order INT UNSIGNED DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            
            -- SEO
            meta_title VARCHAR(255) NULL,
            meta_description TEXT NULL,
            
            -- Timestamps
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            
            -- Foreign keys
            FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
            
            -- Indexes
            INDEX idx_parent (parent_id),
            INDEX idx_slug (slug),
            INDEX idx_is_active (is_active),
            INDEX idx_sort_order (sort_order)
        ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
        
        $this->pdo->exec($sql);
    }
    
    private function insertInitialCategories()
    {
        $categories = [
            // Main categories
            ['Desarrollo Web', 'desarrollo-web', null, 'Servicios de programación y desarrollo web', 'code', 1],
            ['Diseño Gráfico', 'diseno-grafico', null, 'Servicios de diseño visual y gráfico', 'palette', 2],
            ['Marketing Digital', 'marketing-digital', null, 'Servicios de marketing online y publicidad', 'trending-up', 3],
            ['Redacción y Traducción', 'redaccion-traduccion', null, 'Servicios de escritura y traducción', 'edit-3', 4],
            ['Audio y Video', 'audio-video', null, 'Servicios de producción multimedia', 'video', 5],
            ['Consultoría', 'consultoria', null, 'Servicios de consultoría empresarial', 'briefcase', 6],
            ['Datos y Analytics', 'datos-analytics', null, 'Servicios de análisis de datos', 'bar-chart-2', 7],
        ];
        
        $stmt = $this->pdo->prepare("
            INSERT INTO categories (name, slug, parent_id, description, icon, sort_order) 
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        
        $categoryIds = [];
        
        foreach ($categories as $category) {
            $stmt->execute($category);
            $categoryIds[$category[1]] = $this->pdo->lastInsertId();
        }
        
        // Subcategories
        $subcategories = [
            // Desarrollo Web subcategories
            ['Frontend Development', 'frontend-development', $categoryIds['desarrollo-web'], 'Desarrollo de interfaces de usuario', 'monitor', 1],
            ['Backend Development', 'backend-development', $categoryIds['desarrollo-web'], 'Desarrollo del lado del servidor', 'server', 2],
            ['Full Stack Development', 'fullstack-development', $categoryIds['desarrollo-web'], 'Desarrollo completo frontend y backend', 'layers', 3],
            ['E-commerce', 'ecommerce', $categoryIds['desarrollo-web'], 'Tiendas online y comercio electrónico', 'shopping-cart', 4],
            ['WordPress', 'wordpress', $categoryIds['desarrollo-web'], 'Desarrollo con WordPress', 'wordpress', 5],
            ['Aplicaciones Móviles', 'aplicaciones-moviles', $categoryIds['desarrollo-web'], 'Desarrollo de apps móviles', 'smartphone', 6],
            
            // Diseño Gráfico subcategories  
            ['Logo y Branding', 'logo-branding', $categoryIds['diseno-grafico'], 'Diseño de logotipos e identidad', 'zap', 1],
            ['UI/UX Design', 'ui-ux-design', $categoryIds['diseno-grafico'], 'Diseño de interfaces y experiencia', 'figma', 2],
            ['Diseño Web', 'diseno-web', $categoryIds['diseno-grafico'], 'Diseño de sitios web', 'globe', 3],
            ['Diseño Impreso', 'diseno-impreso', $categoryIds['diseno-grafico'], 'Materiales para impresión', 'printer', 4],
            ['Ilustración', 'ilustracion', $categoryIds['diseno-grafico'], 'Ilustraciones digitales y tradicionales', 'image', 5],
            ['Motion Graphics', 'motion-graphics', $categoryIds['diseno-grafico'], 'Gráficos en movimiento', 'play-circle', 6],
            
            // Marketing Digital subcategories
            ['SEO', 'seo', $categoryIds['marketing-digital'], 'Optimización para motores de búsqueda', 'search', 1],
            ['Google Ads', 'google-ads', $categoryIds['marketing-digital'], 'Publicidad en Google', 'target', 2],
            ['Redes Sociales', 'redes-sociales', $categoryIds['marketing-digital'], 'Marketing en redes sociales', 'share-2', 3],
            ['Email Marketing', 'email-marketing', $categoryIds['marketing-digital'], 'Marketing por correo', 'mail', 4],
            ['Content Marketing', 'content-marketing', $categoryIds['marketing-digital'], 'Marketing de contenidos', 'file-text', 5],
            ['Influencer Marketing', 'influencer-marketing', $categoryIds['marketing-digital'], 'Marketing con influencers', 'users', 6],
            
            // Redacción y Traducción subcategories
            ['Copywriting', 'copywriting', $categoryIds['redaccion-traduccion'], 'Escritura persuasiva', 'pen-tool', 1],
            ['Redacción Web', 'redaccion-web', $categoryIds['redaccion-traduccion'], 'Contenido para sitios web', 'globe', 2],
            ['Traducción', 'traduccion', $categoryIds['redaccion-traduccion'], 'Servicios de traducción', 'globe', 3],
            ['Redacción Técnica', 'redaccion-tecnica', $categoryIds['redaccion-traduccion'], 'Documentación técnica', 'book', 4],
            ['Ghostwriting', 'ghostwriting', $categoryIds['redaccion-traduccion'], 'Escritura fantasma', 'user-x', 5],
            
            // Audio y Video subcategories
            ['Edición de Video', 'edicion-video', $categoryIds['audio-video'], 'Edición y post-producción', 'film', 1],
            ['Edición de Audio', 'edicion-audio', $categoryIds['audio-video'], 'Edición de audio y música', 'headphones', 2],
            ['Animación', 'animacion', $categoryIds['audio-video'], 'Animación 2D y 3D', 'play', 3],
            ['Locución', 'locucion', $categoryIds['audio-video'], 'Voice over y doblaje', 'mic', 4],
            ['Producción Musical', 'produccion-musical', $categoryIds['audio-video'], 'Producción de música', 'music', 5],
            
            // Consultoría subcategories
            ['Consultoría de Negocios', 'consultoria-negocios', $categoryIds['consultoria'], 'Estrategia empresarial', 'trending-up', 1],
            ['Gestión de Proyectos', 'gestion-proyectos', $categoryIds['consultoria'], 'Project management', 'calendar', 2],
            ['Consultoría Financiera', 'consultoria-financiera', $categoryIds['consultoria'], 'Asesoría financiera', 'dollar-sign', 3],
            ['Recursos Humanos', 'recursos-humanos', $categoryIds['consultoria'], 'Gestión de RRHH', 'users', 4],
            ['Legal', 'legal', $categoryIds['consultoria'], 'Asesoría legal', 'shield', 5],
            
            // Datos y Analytics subcategories
            ['Análisis de Datos', 'analisis-datos', $categoryIds['datos-analytics'], 'Data analysis', 'bar-chart', 1],
            ['Business Intelligence', 'business-intelligence', $categoryIds['datos-analytics'], 'BI y reporting', 'pie-chart', 2],
            ['Machine Learning', 'machine-learning', $categoryIds['datos-analytics'], 'ML e inteligencia artificial', 'cpu', 3],
            ['Investigación de Mercado', 'investigacion-mercado', $categoryIds['datos-analytics'], 'Market research', 'search', 4],
        ];
        
        foreach ($subcategories as $subcategory) {
            $stmt->execute($subcategory);
        }
        
        echo "✅ Inserted " . count($categories) . " main categories and " . count($subcategories) . " subcategories\n";
    }
}
?>