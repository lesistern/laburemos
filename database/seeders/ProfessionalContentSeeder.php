<?php
/**
 * LaburAR Professional Content Seeder
 * 
 * Seeds the database with realistic, professional content
 * specifically tailored for the Argentine market
 * 
 * @author LaburAR Data Quality Team
 * @version 1.0
 * @since 2025-07-20
 */

require_once __DIR__ . '/../../includes/DatabaseHelper.php';

class ProfessionalContentSeeder {
    
    private $db;
    private $logFile;
    private $startTime;
    private $seededData = [];
    
    // Data arrays
    private $argentineFirstNames = [
        'María', 'José', 'Ana', 'Juan', 'Luis', 'Carmen', 'Antonio', 'Isabel', 'Francisco', 'Dolores',
        'Manuel', 'Pilar', 'David', 'Josefa', 'Javier', 'Teresa', 'Alejandro', 'Rosa', 'Miguel', 'Antonia',
        'Carlos', 'Lucía', 'Rafael', 'Francisca', 'Fernando', 'Elena', 'Sergio', 'Mercedes', 'Pablo', 'Cristina',
        'Jorge', 'Concepción', 'Alberto', 'Manuela', 'Ángel', 'Esperanza', 'Adrián', 'Amparo', 'Gonzalo', 'Soledad',
        'Diego', 'Valentina', 'Martín', 'Camila', 'Santiago', 'Sofia', 'Nicolás', 'Isabella', 'Mateo', 'Catalina'
    ];
    
    private $argentineLastNames = [
        'González', 'Rodríguez', 'García', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Martín', 'Jiménez',
        'Ruiz', 'Hernández', 'Díaz', 'Moreno', 'Álvarez', 'Muñoz', 'Romero', 'Alonso', 'Gutiérrez', 'Navarro',
        'Torres', 'Domínguez', 'Vázquez', 'Ramos', 'Gil', 'Ramírez', 'Serrano', 'Blanco', 'Suárez', 'Molina',
        'Morales', 'Ortega', 'Delgado', 'Castro', 'Ortiz', 'Rubio', 'Marín', 'Sanz', 'Iglesias', 'Medina',
        'Garrido', 'Cortés', 'Castillo', 'Santos', 'Lozano', 'Guerrero', 'Cano', 'Prieto', 'Méndez', 'Cruz'
    ];
    
    private $argentineCities = [
        'Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'Tucumán', 'La Plata', 'Mar del Plata', 'Salta',
        'Santa Fe', 'San Juan', 'Resistencia', 'Neuquén', 'Santiago del Estero', 'Corrientes', 'Posadas',
        'Bahía Blanca', 'Paraná', 'Formosa', 'San Luis', 'La Rioja', 'Catamarca', 'Río Cuarto', 'Comodoro Rivadavia',
        'San Salvador de Jujuy', 'Santa Rosa', 'Tandil', 'San Nicolás', 'Quilmes', 'Lanús', 'San Isidro'
    ];
    
    private $professionalTitles = [
        'Diseñador Gráfico Senior', 'Desarrollador Full Stack', 'Community Manager', 'Copywriter Especializado',
        'Contador Público', 'Arquitecto', 'Diseñador UX/UI', 'Traductor Público', 'Consultor en Marketing Digital',
        'Fotógrafo Profesional', 'Editor de Video', 'Analista de Datos', 'Especialista en SEO', 'Redactor de Contenidos',
        'Diseñador Web', 'Programador Mobile', 'Consultor E-commerce', 'Especialista en Redes Sociales',
        'Ilustrador Digital', 'Productor Audiovisual', 'Consultor de Negocios', 'Especialista en WordPress',
        'Animador 2D/3D', 'Locutor Profesional', 'Consultor en Recursos Humanos', 'Especialista en Google Ads',
        'Diseñador de Logotipos', 'Desarrollador de Apps', 'Especialista en Shopify', 'Consultor Fiscal'
    ];
    
    private $serviceCategories = [
        [
            'name' => 'Diseño Gráfico',
            'slug' => 'diseno-grafico',
            'description' => 'Servicios profesionales de diseño visual para tu marca y negocio',
            'icon' => '🎨'
        ],
        [
            'name' => 'Desarrollo Web',
            'slug' => 'desarrollo-web', 
            'description' => 'Desarrollo de sitios web y aplicaciones web profesionales',
            'icon' => '💻'
        ],
        [
            'name' => 'Marketing Digital',
            'slug' => 'marketing-digital',
            'description' => 'Estrategias de marketing online para hacer crecer tu negocio',
            'icon' => '📱'
        ],
        [
            'name' => 'Redacción y Contenido',
            'slug' => 'redaccion-contenido',
            'description' => 'Creación de contenido de calidad para tu audiencia',
            'icon' => '✏️'
        ],
        [
            'name' => 'Video y Animación',
            'slug' => 'video-animacion',
            'description' => 'Producción audiovisual y animaciones profesionales',
            'icon' => '🎬'
        ],
        [
            'name' => 'Traducción',
            'slug' => 'traduccion',
            'description' => 'Servicios de traducción profesional y certificada',
            'icon' => '🌍'
        ],
        [
            'name' => 'Fotografía',
            'slug' => 'fotografia',
            'description' => 'Servicios fotográficos para eventos, productos y más',
            'icon' => '📸'
        ],
        [
            'name' => 'Música y Audio',
            'slug' => 'musica-audio',
            'description' => 'Producción musical, locución y edición de audio',
            'icon' => '🎵'
        ],
        [
            'name' => 'Programación',
            'slug' => 'programacion',
            'description' => 'Desarrollo de software y soluciones tecnológicas',
            'icon' => '⚙️'
        ],
        [
            'name' => 'Consultoría',
            'slug' => 'consultoria',
            'description' => 'Asesoramiento profesional en diversas áreas de negocio',
            'icon' => '💼'
        ]
    ];
    
    public function __construct() {
        $this->startTime = microtime(true);
        $this->logFile = __DIR__ . '/seeding-execution.log';
        
        try {
            $this->db = DatabaseHelper::getConnection();
            $this->log("🔗 Database connection established");
        } catch (Exception $e) {
            $this->log("❌ Database connection failed: " . $e->getMessage());
            exit(1);
        }
    }
    
    public function seedProfessionalContent($options = []) {
        $userCount = $options['users'] ?? 25;
        $serviceCount = $options['services'] ?? 50;
        $reviewCount = $options['reviews'] ?? 75;
        $projectCount = $options['projects'] ?? 15;
        
        $this->log("\n" . str_repeat("=", 70));
        $this->log("🌱 LaburAR Professional Content Seeding - STARTING");
        $this->log(str_repeat("=", 70));
        $this->log("📊 Targets: {$userCount} users, {$serviceCount} services, {$reviewCount} reviews, {$projectCount} projects");
        
        try {
            // Phase 1: Seed categories
            $this->seedCategories();
            
            // Phase 2: Seed professional users
            $this->seedProfessionalUsers($userCount);
            
            // Phase 3: Seed professional services
            $this->seedProfessionalServices($serviceCount);
            
            // Phase 4: Seed realistic reviews
            $this->seedRealisticReviews($reviewCount);
            
            // Phase 5: Seed professional projects
            $this->seedProfessionalProjects($projectCount);
            
            // Phase 6: Seed portfolio items
            $this->seedPortfolioItems();
            
            // Phase 7: Update statistics
            $this->updatePlatformStatistics();
            
            // Phase 8: Generate final report
            $this->generateSeedingReport();
            
        } catch (Exception $e) {
            $this->log("❌ SEEDING FAILED: " . $e->getMessage());
            throw $e;
        }
    }
    
    private function seedCategories(): void {
        $this->log("📂 Seeding professional categories...");
        
        foreach ($this->serviceCategories as $category) {
            try {
                $stmt = $this->db->prepare("
                    INSERT INTO categories (name, slug, description, icon, status, created_at, updated_at)
                    VALUES (?, ?, ?, ?, 'active', NOW(), NOW())
                    ON DUPLICATE KEY UPDATE
                    description = VALUES(description),
                    icon = VALUES(icon),
                    updated_at = NOW()
                ");
                
                $stmt->execute([
                    $category['name'],
                    $category['slug'],
                    $category['description'],
                    $category['icon']
                ]);
                
                $this->seededData['categories'][] = $category['name'];
                
            } catch (PDOException $e) {
                $this->log("⚠️  Category exists: " . $category['name']);
            }
        }
        
        $this->log("✅ Seeded " . count($this->seededData['categories']) . " categories");
    }
    
    private function seedProfessionalUsers(int $count): void {
        $this->log("👥 Seeding professional users...");
        
        for ($i = 0; $i < $count; $i++) {
            $firstName = $this->getRandomElement($this->argentineFirstNames);
            $lastName = $this->getRandomElement($this->argentineLastNames);
            $city = $this->getRandomElement($this->argentineCities);
            $professionalTitle = $this->getRandomElement($this->professionalTitles);
            
            $email = $this->generateProfessionalEmail($firstName, $lastName);
            $bio = $this->generateProfessionalBio($firstName, $professionalTitle, $city);
            
            try {
                $stmt = $this->db->prepare("
                    INSERT INTO users (
                        first_name, last_name, email, password_hash, bio, 
                        professional_title, location, country, 
                        is_freelancer, user_type, status, 
                        email_verified, phone_verified, identity_verified,
                        created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Argentina', 1, 'freelancer', 'active', 1, 0, 0, NOW(), NOW())
                ");
                
                $passwordHash = password_hash('TempPass123!', PASSWORD_DEFAULT);
                
                $stmt->execute([
                    $firstName,
                    $lastName,
                    $email,
                    $passwordHash,
                    $bio,
                    $professionalTitle,
                    $city
                ]);
                
                $userId = $this->db->lastInsertId();
                $this->seededData['users'][] = [
                    'id' => $userId,
                    'name' => "$firstName $lastName",
                    'email' => $email,
                    'title' => $professionalTitle
                ];
                
                // Add skills for this user
                $this->addUserSkills($userId, $professionalTitle);
                
            } catch (PDOException $e) {
                $this->log("⚠️  User creation failed: " . $e->getMessage());
            }
        }
        
        $this->log("✅ Seeded " . count($this->seededData['users']) . " professional users");
    }
    
    private function seedProfessionalServices(int $count): void {
        $this->log("🛍️ Seeding professional services...");
        
        if (empty($this->seededData['users'])) {
            $this->log("❌ No users available for services");
            return;
        }
        
        $serviceTemplates = $this->getServiceTemplates();
        
        for ($i = 0; $i < $count; $i++) {
            $user = $this->getRandomElement($this->seededData['users']);
            $template = $this->getRandomElement($serviceTemplates);
            $category = $this->getRandomElement($this->serviceCategories);
            
            // Get category ID
            $categoryStmt = $this->db->prepare("SELECT id FROM categories WHERE slug = ?");
            $categoryStmt->execute([$category['slug']]);
            $categoryId = $categoryStmt->fetchColumn();
            
            if (!$categoryId) continue;
            
            $title = $this->customizeServiceTitle($template['title'], $user['name']);
            $description = $this->customizeServiceDescription($template['description'], $user['title']);
            $price = $this->generateRealisticPrice($template['base_price']);
            
            try {
                $stmt = $this->db->prepare("
                    INSERT INTO services (
                        user_id, category_id, title, description, 
                        starting_price, delivery_time, revision_count,
                        status, featured, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, NOW(), NOW())
                ");
                
                $stmt->execute([
                    $user['id'],
                    $categoryId,
                    $title,
                    $description,
                    $price,
                    rand(3, 21), // 3-21 days delivery
                    rand(1, 5),  // 1-5 revisions
                    rand(0, 1)   // featured randomly
                ]);
                
                $serviceId = $this->db->lastInsertId();
                $this->seededData['services'][] = [
                    'id' => $serviceId,
                    'user_id' => $user['id'],
                    'title' => $title,
                    'price' => $price
                ];
                
            } catch (PDOException $e) {
                $this->log("⚠️  Service creation failed: " . $e->getMessage());
            }
        }
        
        $this->log("✅ Seeded " . count($this->seededData['services']) . " professional services");
    }
    
    private function seedRealisticReviews(int $count): void {
        $this->log("⭐ Seeding realistic reviews...");
        
        if (empty($this->seededData['services']) || empty($this->seededData['users'])) {
            $this->log("❌ No services or users available for reviews");
            return;
        }
        
        $reviewTemplates = $this->getReviewTemplates();
        
        for ($i = 0; $i < $count; $i++) {
            $service = $this->getRandomElement($this->seededData['services']);
            $reviewer = $this->getRandomElement($this->seededData['users']);
            
            // Don't review own service
            if ($reviewer['id'] === $service['user_id']) continue;
            
            $template = $this->getRandomElement($reviewTemplates);
            $rating = $this->generateRealisticRating();
            $comment = $this->customizeReviewComment($template, $service['title'], $rating);
            
            try {
                $stmt = $this->db->prepare("
                    INSERT INTO reviews (
                        user_id, service_id, rating, comment, 
                        status, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, 'approved', ?, NOW())
                ");
                
                // Random date within last 6 months
                $createdAt = date('Y-m-d H:i:s', strtotime('-' . rand(1, 180) . ' days'));
                
                $stmt->execute([
                    $reviewer['id'],
                    $service['id'],
                    $rating,
                    $comment,
                    $createdAt
                ]);
                
                $this->seededData['reviews'][] = [
                    'service_id' => $service['id'],
                    'rating' => $rating,
                    'comment' => substr($comment, 0, 50) . '...'
                ];
                
            } catch (PDOException $e) {
                $this->log("⚠️  Review creation failed: " . $e->getMessage());
            }
        }
        
        $this->log("✅ Seeded " . count($this->seededData['reviews']) . " realistic reviews");
    }
    
    private function seedProfessionalProjects(int $count): void {
        $this->log("📋 Seeding professional projects...");
        
        if (empty($this->seededData['users'])) {
            $this->log("❌ No users available for projects");
            return;
        }
        
        $projectTemplates = $this->getProjectTemplates();
        
        for ($i = 0; $i < $count; $i++) {
            $client = $this->getRandomElement($this->seededData['users']);
            $template = $this->getRandomElement($projectTemplates);
            $category = $this->getRandomElement($this->serviceCategories);
            
            // Get category ID
            $categoryStmt = $this->db->prepare("SELECT id FROM categories WHERE slug = ?");
            $categoryStmt->execute([$category['slug']]);
            $categoryId = $categoryStmt->fetchColumn();
            
            if (!$categoryId) continue;
            
            $title = $this->customizeProjectTitle($template['title']);
            $description = $this->customizeProjectDescription($template['description']);
            $budgetMin = $template['budget_min'] + rand(-5000, 5000);
            $budgetMax = $budgetMin + rand(10000, 50000);
            
            try {
                $stmt = $this->db->prepare("
                    INSERT INTO projects (
                        client_id, category_id, title, description,
                        budget_min, budget_max, deadline, skills_required,
                        status, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                ");
                
                $deadline = date('Y-m-d', strtotime('+' . rand(15, 90) . ' days'));
                $skills = implode(',', array_slice($template['skills'], 0, rand(2, 4)));
                $status = $this->getRandomElement(['open', 'in_progress', 'completed']);
                
                $stmt->execute([
                    $client['id'],
                    $categoryId,
                    $title,
                    $description,
                    $budgetMin,
                    $budgetMax,
                    $deadline,
                    $skills,
                    $status
                ]);
                
                $this->seededData['projects'][] = [
                    'id' => $this->db->lastInsertId(),
                    'title' => $title,
                    'budget' => "AR$ " . number_format($budgetMin) . " - " . number_format($budgetMax)
                ];
                
            } catch (PDOException $e) {
                $this->log("⚠️  Project creation failed: " . $e->getMessage());
            }
        }
        
        $this->log("✅ Seeded " . count($this->seededData['projects']) . " professional projects");
    }
    
    private function seedPortfolioItems(): void {
        $this->log("🎨 Seeding portfolio items...");
        
        if (empty($this->seededData['users'])) {
            $this->log("❌ No users available for portfolio");
            return;
        }
        
        $portfolioTemplates = $this->getPortfolioTemplates();
        
        foreach ($this->seededData['users'] as $user) {
            $itemCount = rand(2, 5); // 2-5 portfolio items per user
            
            for ($i = 0; $i < $itemCount; $i++) {
                $template = $this->getRandomElement($portfolioTemplates);
                $title = $this->customizePortfolioTitle($template['title'], $user['title']);
                $description = $this->customizePortfolioDescription($template['description']);
                
                try {
                    $stmt = $this->db->prepare("
                        INSERT INTO portfolio_items (
                            user_id, title, description, project_url,
                            technologies, status, created_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, 'active', ?, NOW())
                    ");
                    
                    $createdAt = date('Y-m-d H:i:s', strtotime('-' . rand(30, 365) . ' days'));
                    
                    $stmt->execute([
                        $user['id'],
                        $title,
                        $description,
                        $template['url'],
                        implode(',', $template['technologies']),
                        $createdAt
                    ]);
                    
                } catch (PDOException $e) {
                    $this->log("⚠️  Portfolio item creation failed: " . $e->getMessage());
                }
            }
        }
        
        $this->log("✅ Seeded portfolio items for all users");
    }
    
    private function addUserSkills(int $userId, string $professionalTitle): void {
        $skillSets = [
            'Diseñador Gráfico' => ['Adobe Photoshop', 'Adobe Illustrator', 'Branding', 'Logo Design', 'Print Design'],
            'Desarrollador' => ['PHP', 'JavaScript', 'MySQL', 'HTML/CSS', 'React'],
            'Community Manager' => ['Social Media', 'Content Creation', 'Facebook Ads', 'Instagram', 'Analytics'],
            'Copywriter' => ['Redacción', 'SEO Writing', 'Content Strategy', 'Email Marketing', 'Storytelling'],
            'Default' => ['Comunicación', 'Trabajo en Equipo', 'Responsabilidad', 'Creatividad', 'Proactividad']
        ];
        
        $skills = $skillSets['Default'];
        foreach ($skillSets as $titleKey => $skillSet) {
            if (strpos($professionalTitle, $titleKey) !== false) {
                $skills = $skillSet;
                break;
            }
        }
        
        foreach ($skills as $skill) {
            try {
                $stmt = $this->db->prepare("
                    INSERT INTO user_skills (user_id, skill_name, level, verified, created_at)
                    VALUES (?, ?, ?, 0, NOW())
                ");
                
                $stmt->execute([
                    $userId,
                    $skill,
                    rand(3, 5) // Skill level 3-5
                ]);
                
            } catch (PDOException $e) {
                // Skill might already exist, ignore
            }
        }
    }
    
    private function updatePlatformStatistics(): void {
        $this->log("📊 Updating platform statistics...");
        
        // Update user statistics
        $this->db->exec("
            UPDATE users u 
            SET 
                service_count = (SELECT COUNT(*) FROM services s WHERE s.user_id = u.id AND s.status = 'active'),
                total_rating = (SELECT COALESCE(AVG(r.rating), 0) FROM reviews r JOIN services s ON r.service_id = s.id WHERE s.user_id = u.id),
                updated_at = NOW()
            WHERE is_freelancer = 1
        ");
        
        // Update service statistics
        $this->db->exec("
            UPDATE services s 
            SET 
                total_reviews = (SELECT COUNT(*) FROM reviews r WHERE r.service_id = s.id),
                average_rating = (SELECT COALESCE(AVG(r.rating), 0) FROM reviews r WHERE r.service_id = s.id),
                updated_at = NOW()
        ");
        
        // Update category statistics
        $this->db->exec("
            UPDATE categories c 
            SET 
                service_count = (SELECT COUNT(*) FROM services s WHERE s.category_id = c.id AND s.status = 'active'),
                updated_at = NOW()
        ");
        
        $this->log("✅ Platform statistics updated");
    }
    
    private function generateSeedingReport(): void {
        $executionTime = round(microtime(true) - $this->startTime, 2);
        
        $this->log("\n" . str_repeat("=", 70));
        $this->log("🎉 PROFESSIONAL CONTENT SEEDING COMPLETED");
        $this->log(str_repeat("=", 70));
        $this->log("⏱️  Total execution time: {$executionTime} seconds");
        
        // Generate final statistics
        $stats = [
            'Categories' => count($this->seededData['categories'] ?? []),
            'Users' => count($this->seededData['users'] ?? []),
            'Services' => count($this->seededData['services'] ?? []),
            'Reviews' => count($this->seededData['reviews'] ?? []),
            'Projects' => count($this->seededData['projects'] ?? [])
        ];
        
        $this->log("📊 Seeded Content Summary:");
        foreach ($stats as $type => $count) {
            $this->log("   📈 $type: $count");
        }
        
        // Get final platform statistics
        try {
            $platformStats = $this->getFinalPlatformStats();
            
            $this->log("\n📊 Final Platform Statistics:");
            foreach ($platformStats as $stat => $value) {
                $this->log("   📈 $stat: $value");
            }
            
        } catch (Exception $e) {
            $this->log("⚠️  Could not generate final stats: " . $e->getMessage());
        }
        
        $this->log("\n✅ Platform now has PROFESSIONAL CONTENT");
        $this->log("🚀 Ready for production deployment with realistic data");
        $this->log("📄 Seeding log saved: " . $this->logFile);
    }
    
    private function getFinalPlatformStats(): array {
        $statsQuery = "
            SELECT 
                (SELECT COUNT(*) FROM users WHERE status = 'active') as active_users,
                (SELECT COUNT(*) FROM users WHERE is_freelancer = 1 AND status = 'active') as active_freelancers,
                (SELECT COUNT(*) FROM services WHERE status = 'active') as active_services,
                (SELECT COUNT(*) FROM reviews) as total_reviews,
                (SELECT COUNT(*) FROM projects) as total_projects,
                (SELECT COALESCE(ROUND(AVG(rating), 2), 0) FROM reviews) as average_rating,
                (SELECT COUNT(*) FROM categories) as total_categories
        ";
        
        $stmt = $this->db->query($statsQuery);
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return [
            'Active Users' => $stats['active_users'],
            'Active Freelancers' => $stats['active_freelancers'],
            'Active Services' => $stats['active_services'],
            'Total Reviews' => $stats['total_reviews'],
            'Total Projects' => $stats['total_projects'],
            'Average Rating' => $stats['average_rating'] . '★',
            'Total Categories' => $stats['total_categories']
        ];
    }
    
    // Helper methods for generating realistic content
    private function generateProfessionalEmail(string $firstName, string $lastName): string {
        $domains = ['gmail.com', 'hotmail.com', 'yahoo.com.ar', 'outlook.com', 'protonmail.com'];
        $firstName = $this->slugify($firstName);
        $lastName = $this->slugify($lastName);
        $domain = $this->getRandomElement($domains);
        
        $patterns = [
            "$firstName.$lastName@$domain",
            "$firstName" . substr($lastName, 0, 1) . "@$domain",
            "$firstName" . rand(10, 99) . "@$domain",
            "$lastName.$firstName@$domain"
        ];
        
        return $this->getRandomElement($patterns);
    }
    
    private function generateProfessionalBio(string $firstName, string $title, string $city): string {
        $templates = [
            "Soy $firstName, $title con más de {years} años de experiencia. Especializada en brindar soluciones de calidad para empresas de todo el país. Ubicada en $city, trabajo de forma remota con clientes de toda Argentina.",
            "$title profesional con {years} años de trayectoria en el mercado argentino. Me especializo en proyectos creativos y funcionales que impulsan el crecimiento de tu negocio. Basada en $city.",
            "Hola! Soy $firstName, $title apasionada por crear experiencias únicas. Con {years} años de experiencia ayudando a empresas argentinas a destacarse en su mercado. Trabajo desde $city para toda Argentina.",
            "$title con sólida formación y {years} años de experiencia profesional. Me dedico a entregar resultados excepcionales que superen las expectativas de mis clientes. Radicada en $city."
        ];
        
        $template = $this->getRandomElement($templates);
        $years = rand(3, 15);
        
        return str_replace('{years}', $years, $template);
    }
    
    private function generateRealisticPrice(int $basePrice): int {
        $multiplier = rand(80, 150) / 100; // 80% to 150% of base
        $price = $basePrice * $multiplier;
        
        // Round to nearest 500 pesos (realistic Argentine pricing)
        return round($price / 500) * 500;
    }
    
    private function generateRealisticRating(): float {
        // Weighted towards higher ratings (more realistic)
        $weights = [1 => 2, 2 => 3, 3 => 8, 4 => 25, 5 => 62]; // Percentages
        $total = array_sum($weights);
        $random = rand(1, $total);
        
        $cumulative = 0;
        foreach ($weights as $rating => $weight) {
            $cumulative += $weight;
            if ($random <= $cumulative) {
                // Add decimal precision
                return $rating + (rand(0, 9) / 10);
            }
        }
        
        return 5.0;
    }
    
    private function getServiceTemplates(): array {
        return [
            [
                'title' => 'Diseño de logo profesional y manual de marca',
                'description' => 'Creo logos únicos y memorables para tu empresa, incluyendo manual de marca completo con aplicaciones y variantes. Proceso colaborativo con hasta 3 propuestas iniciales y revisiones ilimitadas hasta que quedes 100% satisfecho.',
                'base_price' => 25000
            ],
            [
                'title' => 'Desarrollo de sitio web responsive con WordPress',
                'description' => 'Desarrollo sitios web profesionales y responsive usando WordPress. Incluye diseño personalizado, optimización SEO, integración con redes sociales y panel de administración intuitivo. Hosting gratuito por 3 meses.',
                'base_price' => 75000
            ],
            [
                'title' => 'Gestión completa de redes sociales',
                'description' => 'Manejo integral de tus redes sociales: creación de contenido, diseño de publicaciones, programación, interacción con audiencia y reportes mensuales. Incluye estrategia personalizada y calendario editorial.',
                'base_price' => 45000
            ],
            [
                'title' => 'Redacción de contenido SEO para blog',
                'description' => 'Redacto artículos optimizados para SEO que posicionen tu web en Google. Investigación de palabras clave, estructura optimizada y contenido de valor para tu audiencia. Incluye imágenes y meta descripciones.',
                'base_price' => 8000
            ],
            [
                'title' => 'Video promocional animado para redes sociales',
                'description' => 'Creo videos animados profesionales para promocionar tu producto o servicio. Incluye guión, diseño de personajes, animación 2D, música y locución. Formato optimizado para todas las redes sociales.',
                'base_price' => 35000
            ]
        ];
    }
    
    private function getReviewTemplates(): array {
        return [
            "Excelente trabajo, superó mis expectativas. La comunicación fue fluida durante todo el proceso y entregó antes del plazo acordado. Muy recomendable para futuros proyectos.",
            "Profesional de primera. Entendió perfectamente lo que necesitaba y lo plasmó de manera excepcional. La atención al detalle es increíble. Sin dudas volvería a contratarlo.",
            "Muy conforme con el resultado final. El proceso fue muy organizado y siempre estuvo disponible para consultas. La calidad del trabajo es excelente y cumple con todos los requisitos.",
            "Quedé muy satisfecha con el trabajo realizado. Es una persona muy profesional, responsable y creativa. El resultado final fue mejor de lo que imaginaba. Lo recomiendo 100%.",
            "Excelente experiencia trabajando juntos. Muy profesional, cumplió con los tiempos acordados y el resultado final es de muy buena calidad. Definitivamente lo volvería a contactar."
        ];
    }
    
    private function getProjectTemplates(): array {
        return [
            [
                'title' => 'Desarrollo de e-commerce para tienda de ropa',
                'description' => 'Necesito desarrollar una tienda online para vender ropa femenina. Debe incluir catálogo de productos, carrito de compras, integración con MercadoPago, panel de administración y diseño responsive.',
                'budget_min' => 150000,
                'skills' => ['E-commerce', 'WordPress', 'WooCommerce', 'MercadoPago', 'Diseño Web']
            ],
            [
                'title' => 'Campaña de marketing digital para lanzamiento de producto',
                'description' => 'Busco especialista en marketing digital para lanzar nuevo producto. Incluye estrategia en redes sociales, Google Ads, email marketing y análisis de resultados durante 3 meses.',
                'budget_min' => 100000,
                'skills' => ['Marketing Digital', 'Google Ads', 'Facebook Ads', 'Email Marketing', 'Analytics']
            ],
            [
                'title' => 'Diseño de identidad visual completa para startup',
                'description' => 'Startup tecnológica necesita identidad visual completa: logo, paleta de colores, tipografías, papelería, presentaciones y guidelines de marca. Buscamos estilo moderno y profesional.',
                'budget_min' => 80000,
                'skills' => ['Branding', 'Diseño Gráfico', 'Logo Design', 'Identidad Visual', 'Manual de Marca']
            ]
        ];
    }
    
    private function getPortfolioTemplates(): array {
        return [
            [
                'title' => 'Rediseño de sitio web corporativo',
                'description' => 'Rediseño completo del sitio web institucional con enfoque en experiencia de usuario y conversión.',
                'url' => 'https://ejemplo-web.com',
                'technologies' => ['WordPress', 'HTML/CSS', 'JavaScript', 'PHP']
            ],
            [
                'title' => 'Campaña de branding para restaurante',
                'description' => 'Desarrollo de identidad visual completa para cadena de restaurantes, incluyendo logo, menús y señalética.',
                'url' => 'https://ejemplo-branding.com',
                'technologies' => ['Adobe Illustrator', 'Photoshop', 'Branding', 'Print Design']
            ],
            [
                'title' => 'App mobile para delivery',
                'description' => 'Aplicación móvil para servicio de delivery con geolocalización y pagos online.',
                'url' => 'https://ejemplo-app.com',
                'technologies' => ['React Native', 'Node.js', 'MongoDB', 'API REST']
            ]
        ];
    }
    
    private function customizeServiceTitle(string $template, string $userName): string {
        // Add slight variations to make titles unique
        $variations = [
            'profesional y completo',
            'de alta calidad',
            'personalizado para tu marca',
            'moderno y efectivo',
            'adaptado a tu negocio'
        ];
        
        $variation = $this->getRandomElement($variations);
        return str_replace('profesional', $variation, $template);
    }
    
    private function customizeServiceDescription(string $template, string $userTitle): string {
        // Add professional credentials
        $credentials = [
            'Con más de 5 años de experiencia en el rubro.',
            'Freelancer certificado con portfolio comprobable.',
            'Especialista en soluciones para el mercado argentino.',
            'Trabajo con empresas de diferentes tamaños y rubros.'
        ];
        
        $credential = $this->getRandomElement($credentials);
        return $template . ' ' . $credential;
    }
    
    private function customizeReviewComment(string $template, string $serviceTitle, float $rating): string {
        if ($rating >= 4.5) {
            return $template;
        } elseif ($rating >= 3.5) {
            return "Buen trabajo en general. " . substr($template, 0, 100) . " Algunas mejoras menores pero resultado satisfactorio.";
        } else {
            return "El trabajo cumple con lo básico solicitado. " . substr($template, 0, 80) . " Hay margen de mejora en algunos aspectos.";
        }
    }
    
    private function customizeProjectTitle(string $template): string {
        $companies = ['mi empresa', 'nuestra startup', 'la compañía', 'mi negocio', 'nuestro emprendimiento'];
        $company = $this->getRandomElement($companies);
        
        return str_replace('tienda', $company, $template);
    }
    
    private function customizeProjectDescription(string $template): string {
        return $template . ' Preferiblemente freelancer argentino para mejor comunicación y comprensión del mercado local.';
    }
    
    private function customizePortfolioTitle(string $template, string $userTitle): string {
        return $template . ' - ' . explode(' ', $userTitle)[0];
    }
    
    private function customizePortfolioDescription(string $template): string {
        return $template . ' Proyecto desarrollado para cliente argentino con foco en resultados medibles.';
    }
    
    private function getRandomElement(array $array) {
        return $array[array_rand($array)];
    }
    
    private function slugify(string $text): string {
        $text = iconv('UTF-8', 'ASCII//TRANSLIT', $text);
        $text = preg_replace('/[^a-zA-Z0-9]/', '', $text);
        return strtolower($text);
    }
    
    private function log(string $message): void {
        $timestamp = date('Y-m-d H:i:s');
        $logEntry = "[$timestamp] $message\n";
        
        file_put_contents($this->logFile, $logEntry, FILE_APPEND | LOCK_EX);
        
        if (php_sapi_name() === 'cli') {
            echo $logEntry;
        }
    }
}

// Execute seeding if run from command line
if (php_sapi_name() === 'cli') {
    echo "\n";
    echo "╔══════════════════════════════════════════════════════════════╗\n";
    echo "║            LaburAR Professional Content Seeding             ║\n";
    echo "║                     PLATFORM DATA                         ║\n";
    echo "╚══════════════════════════════════════════════════════════════╝\n";
    echo "\n";
    
    try {
        $options = [
            'users' => 25,
            'services' => 50,
            'reviews' => 75,
            'projects' => 15
        ];
        
        // Parse command line arguments
        if (in_array('--demo', $argv)) {
            $options = ['users' => 10, 'services' => 20, 'reviews' => 30, 'projects' => 5];
        }
        if (in_array('--full', $argv)) {
            $options = ['users' => 50, 'services' => 100, 'reviews' => 150, 'projects' => 30];
        }
        
        $seeder = new ProfessionalContentSeeder();
        $seeder->seedProfessionalContent($options);
        
        echo "\n🎉 SUCCESS: Professional content seeded successfully!\n";
        echo "🚀 Platform ready for production with realistic Argentine data\n\n";
        exit(0);
        
    } catch (Exception $e) {
        echo "\n❌ SEEDING FAILED: " . $e->getMessage() . "\n\n";
        exit(1);
    }
}

// For web access
if (isset($_GET['seed_content'])) {
    header('Content-Type: application/json');
    
    try {
        $options = [
            'users' => (int)($_GET['users'] ?? 25),
            'services' => (int)($_GET['services'] ?? 50),
            'reviews' => (int)($_GET['reviews'] ?? 75),
            'projects' => (int)($_GET['projects'] ?? 15)
        ];
        
        $seeder = new ProfessionalContentSeeder();
        $seeder->seedProfessionalContent($options);
        
        echo json_encode([
            'success' => true,
            'message' => 'Professional content seeded successfully',
            'status' => 'content_ready',
            'log_file' => 'seeding-execution.log'
        ]);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage(),
            'status' => 'seeding_failed'
        ]);
    }
}
?>