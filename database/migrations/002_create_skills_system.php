<?php
/**
 * Migration: Create Skills and Verification System
 * LaburAR Complete Platform - Skills Management
 * Generated: 2025-01-18
 * Version: 1.0
 */

class Migration_002_CreateSkillsSystem
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
            
            // Create skills tables
            $this->createSkillsTable();
            $this->createFreelancerSkillsTable();
            
            // Create verification tables
            $this->createVerificationsTable();
            $this->createReputationScoresTable();
            
            // Insert initial skills data
            $this->insertInitialSkills();
            
            $this->pdo->commit();
            echo "✅ Migration 002: Skills and verification system created successfully\n";
            
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw new Exception("Migration 002 failed: " . $e->getMessage());
        }
    }
    
    /**
     * Rollback the migration
     */
    public function down()
    {
        try {
            $this->pdo->beginTransaction();
            
            $this->pdo->exec("DROP TABLE IF EXISTS reputation_scores");
            $this->pdo->exec("DROP TABLE IF EXISTS verifications");
            $this->pdo->exec("DROP TABLE IF EXISTS freelancer_skills");
            $this->pdo->exec("DROP TABLE IF EXISTS skills");
            
            $this->pdo->commit();
            echo "✅ Migration 002: Skills and verification tables dropped successfully\n";
            
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw new Exception("Migration 002 rollback failed: " . $e->getMessage());
        }
    }
    
    private function createSkillsTable()
    {
        $sql = "
        CREATE TABLE skills (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE,
            category VARCHAR(50) NOT NULL,
            subcategory VARCHAR(50) NULL,
            difficulty_level ENUM('beginner', 'intermediate', 'advanced', 'expert') DEFAULT 'intermediate',
            market_demand ENUM('low', 'medium', 'high', 'very_high') DEFAULT 'medium',
            description TEXT NULL,
            
            -- Metadata
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            
            -- Indexes
            INDEX idx_category (category),
            INDEX idx_subcategory (subcategory),
            INDEX idx_difficulty (difficulty_level),
            INDEX idx_market_demand (market_demand),
            INDEX idx_is_active (is_active),
            
            -- Full text search
            FULLTEXT(name, description)
        ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
        
        $this->pdo->exec($sql);
    }
    
    private function createFreelancerSkillsTable()
    {
        $sql = "
        CREATE TABLE freelancer_skills (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            freelancer_id BIGINT UNSIGNED NOT NULL,
            skill_id INT UNSIGNED NOT NULL,
            
            -- Skill proficiency
            proficiency_level ENUM('beginner', 'intermediate', 'advanced', 'expert') NOT NULL,
            years_experience TINYINT UNSIGNED NULL,
            
            -- Verification status
            verified_by BIGINT UNSIGNED NULL COMMENT 'User ID who verified this skill',
            verified_at TIMESTAMP NULL,
            verification_status ENUM('unverified', 'pending', 'verified', 'rejected') DEFAULT 'unverified',
            
            -- Supporting evidence
            portfolio_samples JSON NULL COMMENT 'Array of portfolio item IDs',
            certification_url VARCHAR(500) NULL,
            certification_name VARCHAR(255) NULL,
            
            -- Timestamps
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            
            -- Foreign keys
            FOREIGN KEY (freelancer_id) REFERENCES freelancers(id) ON DELETE CASCADE,
            FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
            FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
            
            -- Unique constraint
            UNIQUE KEY unique_freelancer_skill (freelancer_id, skill_id),
            
            -- Indexes
            INDEX idx_proficiency (proficiency_level),
            INDEX idx_verification_status (verification_status),
            INDEX idx_verified_at (verified_at),
            INDEX idx_years_experience (years_experience)
        ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
        
        $this->pdo->exec($sql);
    }
    
    private function createVerificationsTable()
    {
        $sql = "
        CREATE TABLE verifications (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            user_id BIGINT UNSIGNED NOT NULL,
            
            -- Verification type
            verification_type ENUM('email', 'phone', 'identity', 'cuil_cuit', 'address', 'skill', 'reference') NOT NULL,
            status ENUM('pending', 'in_review', 'verified', 'rejected', 'expired') DEFAULT 'pending',
            
            -- Verification data (encrypted JSON)
            verification_data JSON NULL COMMENT 'Encrypted verification details',
            
            -- Verification process
            verified_by BIGINT UNSIGNED NULL COMMENT 'Admin/system user who verified',
            verified_at TIMESTAMP NULL,
            expires_at TIMESTAMP NULL,
            rejection_reason TEXT NULL,
            
            -- Documents and evidence
            document_ids JSON NULL COMMENT 'Array of media_file IDs',
            
            -- External verification
            external_reference VARCHAR(255) NULL COMMENT 'AFIP reference, etc',
            external_verified_at TIMESTAMP NULL,
            
            -- Notes and metadata
            notes TEXT NULL,
            metadata JSON NULL,
            
            -- Timestamps
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            
            -- Foreign keys
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
            
            -- Indexes
            INDEX idx_user_type (user_id, verification_type),
            INDEX idx_status (status),
            INDEX idx_verified_at (verified_at),
            INDEX idx_expires_at (expires_at),
            INDEX idx_external_reference (external_reference)
        ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
        
        $this->pdo->exec($sql);
    }
    
    private function createReputationScoresTable()
    {
        $sql = "
        CREATE TABLE reputation_scores (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            user_id BIGINT UNSIGNED NOT NULL,
            
            -- Overall reputation
            overall_score DECIMAL(3,2) DEFAULT 0.00 COMMENT 'Overall score 0.00-5.00',
            
            -- Detailed scores
            communication_score DECIMAL(3,2) DEFAULT 0.00,
            quality_score DECIMAL(3,2) DEFAULT 0.00,
            timeliness_score DECIMAL(3,2) DEFAULT 0.00,
            professionalism_score DECIMAL(3,2) DEFAULT 0.00,
            
            -- Review statistics
            total_reviews INT UNSIGNED DEFAULT 0,
            five_star_count INT UNSIGNED DEFAULT 0,
            four_star_count INT UNSIGNED DEFAULT 0,
            three_star_count INT UNSIGNED DEFAULT 0,
            two_star_count INT UNSIGNED DEFAULT 0,
            one_star_count INT UNSIGNED DEFAULT 0,
            
            -- Calculation metadata
            calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            calculation_version VARCHAR(10) DEFAULT '1.0',
            
            -- Timestamps
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            
            -- Foreign keys
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            
            -- Unique constraint
            UNIQUE KEY unique_user_reputation (user_id),
            
            -- Indexes
            INDEX idx_overall_score (overall_score),
            INDEX idx_total_reviews (total_reviews),
            INDEX idx_calculated_at (calculated_at),
            
            -- Constraints
            CONSTRAINT chk_score_range 
            CHECK (overall_score >= 0.00 AND overall_score <= 5.00)
        ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
        
        $this->pdo->exec($sql);
    }
    
    private function insertInitialSkills()
    {
        $skills = [
            // Programming & Development
            ['PHP', 'desarrollo', 'backend', 'intermediate', 'high', 'Lenguaje de programación para desarrollo web backend'],
            ['JavaScript', 'desarrollo', 'frontend', 'intermediate', 'very_high', 'Lenguaje de programación para frontend y aplicaciones web'],
            ['React', 'desarrollo', 'frontend', 'advanced', 'very_high', 'Biblioteca de JavaScript para interfaces de usuario'],
            ['Vue.js', 'desarrollo', 'frontend', 'advanced', 'high', 'Framework progresivo de JavaScript para UI'],
            ['Laravel', 'desarrollo', 'backend', 'advanced', 'high', 'Framework PHP para desarrollo web'],
            ['Symfony', 'desarrollo', 'backend', 'expert', 'medium', 'Framework PHP enterprise'],
            ['MySQL', 'desarrollo', 'database', 'intermediate', 'high', 'Sistema de gestión de bases de datos relacionales'],
            ['PostgreSQL', 'desarrollo', 'database', 'advanced', 'medium', 'Base de datos relacional avanzada'],
            ['MongoDB', 'desarrollo', 'database', 'intermediate', 'medium', 'Base de datos NoSQL'],
            ['Node.js', 'desarrollo', 'backend', 'advanced', 'high', 'Runtime de JavaScript para backend'],
            ['Python', 'desarrollo', 'backend', 'intermediate', 'very_high', 'Lenguaje de programación versátil'],
            ['Django', 'desarrollo', 'backend', 'advanced', 'medium', 'Framework web de Python'],
            ['WordPress', 'desarrollo', 'cms', 'beginner', 'medium', 'Sistema de gestión de contenidos'],
            ['Shopify', 'desarrollo', 'ecommerce', 'intermediate', 'high', 'Plataforma de e-commerce'],
            ['WooCommerce', 'desarrollo', 'ecommerce', 'intermediate', 'high', 'Plugin de e-commerce para WordPress'],
            
            // Design
            ['Adobe Photoshop', 'diseño', 'grafico', 'intermediate', 'high', 'Software de edición de imágenes y diseño gráfico'],
            ['Adobe Illustrator', 'diseño', 'grafico', 'intermediate', 'high', 'Software de diseño vectorial'],
            ['Adobe InDesign', 'diseño', 'editorial', 'advanced', 'medium', 'Software de maquetación editorial'],
            ['Figma', 'diseño', 'ui_ux', 'intermediate', 'very_high', 'Herramienta de diseño de interfaces colaborativa'],
            ['Sketch', 'diseño', 'ui_ux', 'intermediate', 'medium', 'Herramienta de diseño para Mac'],
            ['Adobe XD', 'diseño', 'ui_ux', 'intermediate', 'medium', 'Herramienta de diseño de experiencias'],
            ['UI Design', 'diseño', 'ui_ux', 'advanced', 'very_high', 'Diseño de interfaces de usuario'],
            ['UX Design', 'diseño', 'ui_ux', 'expert', 'very_high', 'Diseño de experiencia de usuario'],
            ['Logo Design', 'diseño', 'branding', 'intermediate', 'high', 'Diseño de logotipos e identidad'],
            ['Brand Identity', 'diseño', 'branding', 'advanced', 'high', 'Diseño de identidad corporativa'],
            ['Web Design', 'diseño', 'web', 'intermediate', 'high', 'Diseño de sitios web'],
            ['Motion Graphics', 'diseño', 'multimedia', 'advanced', 'medium', 'Gráficos en movimiento'],
            
            // Marketing
            ['Google Ads', 'marketing', 'digital', 'intermediate', 'high', 'Plataforma de publicidad de Google'],
            ['Facebook Ads', 'marketing', 'digital', 'intermediate', 'high', 'Publicidad en redes sociales de Meta'],
            ['Instagram Marketing', 'marketing', 'social', 'intermediate', 'high', 'Marketing en Instagram'],
            ['LinkedIn Marketing', 'marketing', 'social', 'intermediate', 'medium', 'Marketing en LinkedIn'],
            ['TikTok Marketing', 'marketing', 'social', 'intermediate', 'high', 'Marketing en TikTok'],
            ['SEO', 'marketing', 'digital', 'advanced', 'very_high', 'Optimización para motores de búsqueda'],
            ['SEM', 'marketing', 'digital', 'advanced', 'high', 'Marketing en motores de búsqueda'],
            ['Content Marketing', 'marketing', 'contenido', 'intermediate', 'high', 'Marketing de contenidos'],
            ['Email Marketing', 'marketing', 'email', 'intermediate', 'medium', 'Marketing por correo electrónico'],
            ['Social Media Management', 'marketing', 'social', 'beginner', 'medium', 'Gestión de redes sociales'],
            ['Influencer Marketing', 'marketing', 'social', 'intermediate', 'high', 'Marketing con influencers'],
            ['Growth Hacking', 'marketing', 'digital', 'expert', 'high', 'Técnicas de crecimiento acelerado'],
            
            // Writing & Translation
            ['Redacción Comercial', 'redaccion', 'comercial', 'intermediate', 'high', 'Escritura para fines comerciales y marketing'],
            ['Copywriting', 'redaccion', 'publicitaria', 'advanced', 'high', 'Escritura persuasiva para publicidad'],
            ['Content Writing', 'redaccion', 'contenido', 'intermediate', 'high', 'Escritura de contenidos'],
            ['Technical Writing', 'redaccion', 'tecnica', 'advanced', 'medium', 'Escritura técnica y documentación'],
            ['Traducción EN-ES', 'traduccion', 'idiomas', 'advanced', 'medium', 'Traducción inglés-español'],
            ['Traducción PT-ES', 'traduccion', 'idiomas', 'advanced', 'low', 'Traducción portugués-español'],
            ['Localización', 'traduccion', 'idiomas', 'expert', 'medium', 'Adaptación cultural de contenidos'],
            ['Subtitulado', 'traduccion', 'multimedia', 'intermediate', 'medium', 'Subtítulos para video'],
            
            // Business & Consulting
            ['Business Analysis', 'consultoria', 'negocios', 'advanced', 'high', 'Análisis de procesos de negocio'],
            ['Project Management', 'consultoria', 'gestion', 'advanced', 'high', 'Gestión de proyectos'],
            ['Strategic Planning', 'consultoria', 'estrategia', 'expert', 'medium', 'Planificación estratégica'],
            ['Market Research', 'consultoria', 'investigacion', 'intermediate', 'high', 'Investigación de mercados'],
            ['Financial Planning', 'finanzas', 'planificacion', 'advanced', 'medium', 'Planificación financiera'],
            ['Contabilidad', 'finanzas', 'contabilidad', 'intermediate', 'medium', 'Servicios contables y financieros'],
            ['Auditoría', 'finanzas', 'auditoria', 'expert', 'low', 'Servicios de auditoría'],
            
            // Audio & Video
            ['Video Editing', 'multimedia', 'video', 'intermediate', 'high', 'Edición de video'],
            ['Audio Editing', 'multimedia', 'audio', 'intermediate', 'medium', 'Edición de audio'],
            ['Animation', 'multimedia', 'animacion', 'advanced', 'medium', 'Animación 2D/3D'],
            ['Voice Over', 'multimedia', 'audio', 'intermediate', 'medium', 'Locución y doblaje'],
            ['Podcast Production', 'multimedia', 'audio', 'intermediate', 'medium', 'Producción de podcasts'],
            
            // Data & Analytics
            ['Data Analysis', 'datos', 'analisis', 'advanced', 'high', 'Análisis de datos'],
            ['Excel', 'datos', 'herramientas', 'intermediate', 'high', 'Microsoft Excel avanzado'],
            ['Power BI', 'datos', 'visualizacion', 'advanced', 'medium', 'Business Intelligence con Power BI'],
            ['Google Analytics', 'marketing', 'analisis', 'intermediate', 'high', 'Análisis web con Google Analytics'],
            ['SQL', 'desarrollo', 'database', 'advanced', 'high', 'Lenguaje de consulta de bases de datos']
        ];
        
        $stmt = $this->pdo->prepare("
            INSERT INTO skills (name, category, subcategory, difficulty_level, market_demand, description) 
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        
        foreach ($skills as $skill) {
            $stmt->execute($skill);
        }
        
        echo "✅ Inserted " . count($skills) . " initial skills\n";
    }
}
?>