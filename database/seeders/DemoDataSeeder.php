<?php
/**
 * Demo Data Seeder
 * LaburAR Complete Platform - Sample Data for Testing
 * Generated: 2025-01-18
 * Version: 1.0
 */

class DemoDataSeeder
{
    private $pdo;
    
    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }
    
    /**
     * Run the seeder
     */
    public function run()
    {
        try {
            $this->pdo->beginTransaction();
            
            echo "🌱 Seeding demo data...\n\n";
            
            // Create demo users
            $this->createDemoUsers();
            
            // Create freelancer profiles and skills
            $this->createFreelancerProfiles();
            
            // Create client profiles
            $this->createClientProfiles();
            
            // Create portfolio items
            $this->createPortfolioItems();
            
            // Create user preferences
            $this->createUserPreferences();
            
            // Create sample verifications
            $this->createSampleVerifications();
            
            $this->pdo->commit();
            echo "✅ Demo data seeding completed successfully!\n";
            
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw new Exception("Demo data seeding failed: " . $e->getMessage());
        }
    }
    
    private function createDemoUsers()
    {
        echo "👥 Creating demo users...\n";
        
        $users = [
            // Freelancers
            [
                'email' => 'maria.dev@gmail.com',
                'password_hash' => password_hash('123456', PASSWORD_DEFAULT),
                'user_type' => 'freelancer',
                'status' => 'active',
                'email_verified_at' => date('Y-m-d H:i:s'),
                'phone' => '+5491123456789',
                'phone_verified_at' => date('Y-m-d H:i:s'),
                'last_login_at' => date('Y-m-d H:i:s', strtotime('-2 hours'))
            ],
            [
                'email' => 'carlos.designer@outlook.com',
                'password_hash' => password_hash('123456', PASSWORD_DEFAULT),
                'user_type' => 'freelancer',
                'status' => 'active',
                'email_verified_at' => date('Y-m-d H:i:s'),
                'phone' => '+5491198765432',
                'phone_verified_at' => date('Y-m-d H:i:s'),
                'last_login_at' => date('Y-m-d H:i:s', strtotime('-1 day'))
            ],
            [
                'email' => 'ana.marketing@yahoo.com',
                'password_hash' => password_hash('123456', PASSWORD_DEFAULT),
                'user_type' => 'freelancer',
                'status' => 'active',
                'email_verified_at' => date('Y-m-d H:i:s'),
                'phone' => '+5491155443322',
                'phone_verified_at' => date('Y-m-d H:i:s'),
                'last_login_at' => date('Y-m-d H:i:s', strtotime('-3 hours'))
            ],
            [
                'email' => 'luciana.writer@gmail.com',
                'password_hash' => password_hash('123456', PASSWORD_DEFAULT),
                'user_type' => 'freelancer',
                'status' => 'active',
                'email_verified_at' => date('Y-m-d H:i:s'),
                'phone' => '+5491177889900',
                'phone_verified_at' => date('Y-m-d H:i:s'),
                'last_login_at' => date('Y-m-d H:i:s', strtotime('-5 hours'))
            ],
            
            // Clients
            [
                'email' => 'admin@techstartup.com.ar',
                'password_hash' => password_hash('123456', PASSWORD_DEFAULT),
                'user_type' => 'client',
                'status' => 'active',
                'email_verified_at' => date('Y-m-d H:i:s'),
                'phone' => '+5491144556677',
                'phone_verified_at' => date('Y-m-d H:i:s'),
                'last_login_at' => date('Y-m-d H:i:s', strtotime('-1 hour'))
            ],
            [
                'email' => 'proyectos@agenciadigital.com',
                'password_hash' => password_hash('123456', PASSWORD_DEFAULT),
                'user_type' => 'client',
                'status' => 'active',
                'email_verified_at' => date('Y-m-d H:i:s'),
                'phone' => '+5491166778899',
                'phone_verified_at' => date('Y-m-d H:i:s'),
                'last_login_at' => date('Y-m-d H:i:s', strtotime('-30 minutes'))
            ],
            [
                'email' => 'rrhh@empresagrande.com.ar',
                'password_hash' => password_hash('123456', PASSWORD_DEFAULT),
                'user_type' => 'client',
                'status' => 'active',
                'email_verified_at' => date('Y-m-d H:i:s'),
                'phone' => '+5491133445566',
                'phone_verified_at' => date('Y-m-d H:i:s'),
                'last_login_at' => date('Y-m-d H:i:s', strtotime('-2 days'))
            ]
        ];
        
        $stmt = $this->pdo->prepare("
            INSERT INTO users (email, password_hash, user_type, status, email_verified_at, phone, phone_verified_at, last_login_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        foreach ($users as $user) {
            $stmt->execute([
                $user['email'],
                $user['password_hash'],
                $user['user_type'],
                $user['status'],
                $user['email_verified_at'],
                $user['phone'],
                $user['phone_verified_at'],
                $user['last_login_at']
            ]);
        }
        
        echo "✅ Created " . count($users) . " demo users\n";
    }
    
    private function createFreelancerProfiles()
    {
        echo "💼 Creating freelancer profiles...\n";
        
        // Get freelancer user IDs
        $stmt = $this->pdo->query("SELECT id, email FROM users WHERE user_type = 'freelancer' ORDER BY id");
        $freelancerUsers = $stmt->fetchAll();
        
        $profiles = [
            [
                'professional_name' => 'María González',
                'title' => 'Desarrolladora Full Stack',
                'bio' => 'Desarrolladora con 5 años de experiencia en PHP, Laravel, React y Vue.js. Especializada en aplicaciones web escalables y APIs RESTful. Trabajo con metodologías ágiles y tengo experiencia en e-commerce y fintech.',
                'hourly_rate_min' => 2500.00,
                'hourly_rate_max' => 4000.00,
                'location' => 'Buenos Aires, Argentina',
                'cuil' => '27123456789',
                'tax_condition' => 'monotributo',
                'portfolio_description' => 'Portfolio enfocado en desarrollo de aplicaciones web modernas usando las últimas tecnologías.',
                'website_url' => 'https://mariadev.com.ar',
                'response_time_avg' => 120,
                'completion_rate' => 98.50,
                'total_earnings' => 450000.00,
                'total_projects' => 23
            ],
            [
                'professional_name' => 'Carlos Mendez',
                'title' => 'Diseñador UX/UI & Brand Designer',
                'bio' => 'Diseñador con más de 6 años creando experiencias digitales memorables. Especializado en diseño de interfaces, sistemas de diseño y branding. Trabajo con Figma, Adobe Suite y prototipado avanzado.',
                'hourly_rate_min' => 2000.00,
                'hourly_rate_max' => 3500.00,
                'location' => 'Córdoba, Argentina',
                'cuil' => '20987654321',
                'tax_condition' => 'responsable_inscripto',
                'portfolio_description' => 'Diseños que combinan estética y funcionalidad para crear productos digitales exitosos.',
                'website_url' => 'https://carlosdesign.studio',
                'response_time_avg' => 90,
                'completion_rate' => 96.20,
                'total_earnings' => 320000.00,
                'total_projects' => 31
            ],
            [
                'professional_name' => 'Ana Rodríguez',
                'title' => 'Marketing Digital & SEO Specialist',
                'bio' => 'Especialista en marketing digital con 4 años de experiencia. Experta en Google Ads, Facebook Ads, SEO y analytics. He ayudado a más de 50 empresas a aumentar su presencia online y conversiones.',
                'hourly_rate_min' => 1800.00,
                'hourly_rate_max' => 3000.00,
                'location' => 'Rosario, Argentina',
                'cuil' => '27456789123',
                'tax_condition' => 'monotributo',
                'portfolio_description' => 'Estrategias de marketing que generan resultados medibles y ROI positivo.',
                'website_url' => 'https://anamarketing.com.ar',
                'response_time_avg' => 60,
                'completion_rate' => 94.80,
                'total_earnings' => 280000.00,
                'total_projects' => 42
            ],
            [
                'professional_name' => 'Luciana Torres',
                'title' => 'Copywriter & Content Strategist',
                'bio' => 'Copywriter especializada en contenido que convierte. 3 años de experiencia creando copy para landing pages, email marketing, redes sociales y blogs. Experta en storytelling y psicología del consumidor.',
                'hourly_rate_min' => 1500.00,
                'hourly_rate_max' => 2800.00,
                'location' => 'Mendoza, Argentina',
                'cuil' => '27789123456',
                'tax_condition' => 'monotributo',
                'portfolio_description' => 'Palabras que conectan, persuaden y convierten. Portfolio de casos de éxito reales.',
                'website_url' => 'https://lucianawords.com',
                'response_time_avg' => 45,
                'completion_rate' => 99.10,
                'total_earnings' => 195000.00,
                'total_projects' => 67
            ]
        ];
        
        $stmt = $this->pdo->prepare("
            INSERT INTO freelancers (
                user_id, professional_name, title, bio, hourly_rate_min, hourly_rate_max, 
                location, cuil, tax_condition, portfolio_description, website_url,
                response_time_avg, completion_rate, total_earnings, total_projects
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        foreach ($profiles as $index => $profile) {
            $stmt->execute([
                $freelancerUsers[$index]['id'],
                $profile['professional_name'],
                $profile['title'],
                $profile['bio'],
                $profile['hourly_rate_min'],
                $profile['hourly_rate_max'],
                $profile['location'],
                $profile['cuil'],
                $profile['tax_condition'],
                $profile['portfolio_description'],
                $profile['website_url'],
                $profile['response_time_avg'],
                $profile['completion_rate'],
                $profile['total_earnings'],
                $profile['total_projects']
            ]);
        }
        
        // Add skills to freelancers
        $this->assignSkillsToFreelancers();
        
        echo "✅ Created " . count($profiles) . " freelancer profiles\n";
    }
    
    private function assignSkillsToFreelancers()
    {
        // Get freelancer IDs
        $stmt = $this->pdo->query("SELECT id FROM freelancers ORDER BY id");
        $freelancerIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        // Get skill IDs
        $stmt = $this->pdo->query("SELECT id, name FROM skills");
        $skills = $stmt->fetchAll();
        $skillsByName = array_column($skills, 'id', 'name');
        
        // Define skills for each freelancer
        $freelancerSkills = [
            // María (Full Stack Developer)
            $freelancerIds[0] => [
                ['skill' => 'PHP', 'level' => 'expert', 'years' => 5],
                ['skill' => 'Laravel', 'level' => 'expert', 'years' => 4],
                ['skill' => 'JavaScript', 'level' => 'advanced', 'years' => 5],
                ['skill' => 'React', 'level' => 'advanced', 'years' => 3],
                ['skill' => 'Vue.js', 'level' => 'intermediate', 'years' => 2],
                ['skill' => 'MySQL', 'level' => 'advanced', 'years' => 5],
                ['skill' => 'Node.js', 'level' => 'intermediate', 'years' => 2]
            ],
            
            // Carlos (Designer)
            $freelancerIds[1] => [
                ['skill' => 'Figma', 'level' => 'expert', 'years' => 4],
                ['skill' => 'UI Design', 'level' => 'expert', 'years' => 6],
                ['skill' => 'UX Design', 'level' => 'advanced', 'years' => 5],
                ['skill' => 'Adobe Photoshop', 'level' => 'advanced', 'years' => 6],
                ['skill' => 'Adobe Illustrator', 'level' => 'advanced', 'years' => 6],
                ['skill' => 'Logo Design', 'level' => 'expert', 'years' => 5],
                ['skill' => 'Brand Identity', 'level' => 'advanced', 'years' => 4]
            ],
            
            // Ana (Marketing)
            $freelancerIds[2] => [
                ['skill' => 'Google Ads', 'level' => 'expert', 'years' => 4],
                ['skill' => 'Facebook Ads', 'level' => 'expert', 'years' => 4],
                ['skill' => 'SEO', 'level' => 'advanced', 'years' => 3],
                ['skill' => 'Google Analytics', 'level' => 'advanced', 'years' => 4],
                ['skill' => 'Content Marketing', 'level' => 'intermediate', 'years' => 2],
                ['skill' => 'Social Media Management', 'level' => 'advanced', 'years' => 4],
                ['skill' => 'Email Marketing', 'level' => 'intermediate', 'years' => 2]
            ],
            
            // Luciana (Copywriter)
            $freelancerIds[3] => [
                ['skill' => 'Copywriting', 'level' => 'expert', 'years' => 3],
                ['skill' => 'Content Writing', 'level' => 'expert', 'years' => 3],
                ['skill' => 'Redacción Comercial', 'level' => 'expert', 'years' => 3],
                ['skill' => 'Content Marketing', 'level' => 'advanced', 'years' => 2],
                ['skill' => 'Social Media Management', 'level' => 'intermediate', 'years' => 2],
                ['skill' => 'Email Marketing', 'level' => 'advanced', 'years' => 3]
            ]
        ];
        
        $stmt = $this->pdo->prepare("
            INSERT INTO freelancer_skills (freelancer_id, skill_id, proficiency_level, years_experience, verification_status) 
            VALUES (?, ?, ?, ?, ?)
        ");
        
        foreach ($freelancerSkills as $freelancerId => $skills) {
            foreach ($skills as $skill) {
                if (isset($skillsByName[$skill['skill']])) {
                    $stmt->execute([
                        $freelancerId,
                        $skillsByName[$skill['skill']],
                        $skill['level'],
                        $skill['years'],
                        'verified' // Some skills pre-verified for demo
                    ]);
                }
            }
        }
    }
    
    private function createClientProfiles()
    {
        echo "🏢 Creating client profiles...\n";
        
        // Get client user IDs
        $stmt = $this->pdo->query("SELECT id FROM users WHERE user_type = 'client' ORDER BY id");
        $clientUsers = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        $profiles = [
            [
                'company_name' => 'TechStartup SRL',
                'industry' => 'Tecnología',
                'company_size' => '11-50',
                'cuit' => '30123456789',
                'fiscal_address' => 'Av. Corrientes 1234, CABA, Argentina',
                'contact_person' => 'Martín López',
                'position' => 'CTO',
                'budget_range_min' => 50000.00,
                'budget_range_max' => 200000.00,
                'company_description' => 'Startup de tecnología enfocada en soluciones SaaS para el mercado latinoamericano.',
                'company_website' => 'https://techstartup.com.ar',
                'projects_completed' => 8,
                'total_spent' => 180000.00,
                'avg_project_budget' => 22500.00
            ],
            [
                'company_name' => 'Agencia Digital Creativa',
                'industry' => 'Marketing y Publicidad',
                'company_size' => '51-200',
                'cuit' => '30987654321',
                'fiscal_address' => 'Av. Santa Fe 3456, CABA, Argentina',
                'contact_person' => 'Sofía Ramírez',
                'position' => 'Directora de Proyectos',
                'budget_range_min' => 30000.00,
                'budget_range_max' => 150000.00,
                'company_description' => 'Agencia especializada en marketing digital y desarrollo web para medianas empresas.',
                'company_website' => 'https://agenciadigital.com',
                'projects_completed' => 15,
                'total_spent' => 320000.00,
                'avg_project_budget' => 21333.33
            ],
            [
                'company_name' => 'Empresa Grande SA',
                'industry' => 'Servicios Financieros',
                'company_size' => '500+',
                'cuit' => '30456789123',
                'fiscal_address' => 'Av. 9 de Julio 567, CABA, Argentina',
                'contact_person' => 'Roberto Silva',
                'position' => 'Gerente de IT',
                'budget_range_min' => 100000.00,
                'budget_range_max' => 500000.00,
                'company_description' => 'Empresa líder en servicios financieros con presencia en toda Latinoamérica.',
                'company_website' => 'https://empresagrande.com.ar',
                'projects_completed' => 5,
                'total_spent' => 890000.00,
                'avg_project_budget' => 178000.00
            ]
        ];
        
        $stmt = $this->pdo->prepare("
            INSERT INTO clients (
                user_id, company_name, industry, company_size, cuit, fiscal_address,
                contact_person, position, budget_range_min, budget_range_max,
                company_description, company_website, projects_completed, total_spent, avg_project_budget
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        foreach ($profiles as $index => $profile) {
            $stmt->execute([
                $clientUsers[$index],
                $profile['company_name'],
                $profile['industry'],
                $profile['company_size'],
                $profile['cuit'],
                $profile['fiscal_address'],
                $profile['contact_person'],
                $profile['position'],
                $profile['budget_range_min'],
                $profile['budget_range_max'],
                $profile['company_description'],
                $profile['company_website'],
                $profile['projects_completed'],
                $profile['total_spent'],
                $profile['avg_project_budget']
            ]);
        }
        
        echo "✅ Created " . count($profiles) . " client profiles\n";
    }
    
    private function createPortfolioItems()
    {
        echo "🎨 Creating portfolio items...\n";
        
        // Get freelancer IDs
        $stmt = $this->pdo->query("SELECT id FROM freelancers ORDER BY id");
        $freelancerIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        $portfolioItems = [
            // María's portfolio
            [
                'freelancer_id' => $freelancerIds[0],
                'title' => 'E-commerce Platform para Moda',
                'description' => 'Desarrollo completo de plataforma e-commerce con Laravel y Vue.js. Incluye sistema de pagos con MercadoPago, gestión de inventario, panel de administración y dashboard analytics.',
                'project_url' => 'https://modashop.demo.com',
                'project_duration_days' => 90,
                'budget_range_min' => 80000.00,
                'budget_range_max' => 120000.00,
                'client_testimonial' => 'María entregó un trabajo excepcional. La plataforma superó nuestras expectativas en funcionalidad y diseño.',
                'client_name' => 'Laura Vega',
                'client_company' => 'Moda Trendy',
                'featured' => true,
                'display_order' => 1
            ],
            [
                'freelancer_id' => $freelancerIds[0],
                'title' => 'API REST para App Fintech',
                'description' => 'Desarrollo de API robusta para aplicación fintech. Arquitectura escalable con microservicios, autenticación JWT, integración bancaria y cumplimiento PCI DSS.',
                'project_duration_days' => 60,
                'budget_range_min' => 60000.00,
                'budget_range_max' => 90000.00,
                'client_testimonial' => 'La API que desarrolló María es sólida, segura y bien documentada. Excelente trabajo técnico.',
                'client_name' => 'Diego Martín',
                'client_company' => 'FinTech Innovar',
                'featured' => false,
                'display_order' => 2
            ],
            
            // Carlos's portfolio
            [
                'freelancer_id' => $freelancerIds[1],
                'title' => 'Rediseño UX/UI App Banking',
                'description' => 'Rediseño completo de aplicación bancaria móvil. Research de usuarios, wireframes, prototipos interactivos y sistema de diseño. Aumento del 40% en satisfacción del usuario.',
                'project_url' => 'https://bankingapp.demo.com',
                'project_duration_days' => 45,
                'budget_range_min' => 50000.00,
                'budget_range_max' => 75000.00,
                'client_testimonial' => 'Carlos transformó completamente la experiencia de nuestra app. Los usuarios lo notaron inmediatamente.',
                'client_name' => 'Patricia Sosa',
                'client_company' => 'Banco Regional',
                'featured' => true,
                'display_order' => 1
            ],
            [
                'freelancer_id' => $freelancerIds[1],
                'title' => 'Identidad Visual Startup Tech',
                'description' => 'Desarrollo completo de identidad visual para startup. Logo, paleta de colores, tipografías, manual de marca y aplicaciones en diferentes medios digitales e impresos.',
                'project_duration_days' => 30,
                'budget_range_min' => 35000.00,
                'budget_range_max' => 50000.00,
                'client_testimonial' => 'La identidad que creó Carlos define perfectamente nuestra marca. Trabajo profesional y creativo.',
                'client_name' => 'Tomás Ríos',
                'client_company' => 'TechFlow Startup',
                'featured' => false,
                'display_order' => 2
            ],
            
            // Ana's portfolio
            [
                'freelancer_id' => $freelancerIds[2],
                'title' => 'Campaña Google Ads E-commerce',
                'description' => 'Estrategia completa de Google Ads para e-commerce de electrónicos. Optimización de campañas, landing pages y seguimiento de conversiones. ROI del 350%.',
                'project_duration_days' => 90,
                'budget_range_min' => 40000.00,
                'budget_range_max' => 60000.00,
                'client_testimonial' => 'Ana triplicó nuestras ventas online. Su expertise en Google Ads es excepcional.',
                'client_name' => 'Ricardo Paz',
                'client_company' => 'ElectroTech',
                'featured' => true,
                'display_order' => 1
            ],
            
            // Luciana's portfolio
            [
                'freelancer_id' => $freelancerIds[3],
                'title' => 'Copywriting para SaaS B2B',
                'description' => 'Copy completo para plataforma SaaS B2B. Página web, email marketing, caso de éxito y contenido para redes sociales. Aumento del 60% en conversiones.',
                'project_duration_days' => 21,
                'budget_range_min' => 25000.00,
                'budget_range_max' => 35000.00,
                'client_testimonial' => 'El copy de Luciana convierte. Nuestra tasa de conversión mejoró significativamente.',
                'client_name' => 'Andrés Costa',
                'client_company' => 'SaaS Solutions',
                'featured' => true,
                'display_order' => 1
            ]
        ];
        
        $stmt = $this->pdo->prepare("
            INSERT INTO portfolio_items (
                freelancer_id, title, description, project_url, project_duration_days,
                budget_range_min, budget_range_max, client_testimonial, client_name,
                client_company, featured, display_order
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        foreach ($portfolioItems as $item) {
            $stmt->execute([
                $item['freelancer_id'],
                $item['title'],
                $item['description'],
                $item['project_url'] ?? null,
                $item['project_duration_days'],
                $item['budget_range_min'],
                $item['budget_range_max'],
                $item['client_testimonial'],
                $item['client_name'],
                $item['client_company'],
                $item['featured'],
                $item['display_order']
            ]);
        }
        
        echo "✅ Created " . count($portfolioItems) . " portfolio items\n";
    }
    
    private function createUserPreferences()
    {
        echo "⚙️  Creating user preferences...\n";
        
        $stmt = $this->pdo->query("SELECT id FROM users");
        $userIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        $stmt = $this->pdo->prepare("
            INSERT INTO user_preferences (user_id) VALUES (?)
        ");
        
        foreach ($userIds as $userId) {
            $stmt->execute([$userId]);
        }
        
        echo "✅ Created preferences for " . count($userIds) . " users\n";
    }
    
    private function createSampleVerifications()
    {
        echo "✅ Creating sample verifications...\n";
        
        // Get user IDs
        $stmt = $this->pdo->query("SELECT id FROM users LIMIT 4");
        $userIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        $verifications = [
            ['user_id' => $userIds[0], 'type' => 'email', 'status' => 'verified'],
            ['user_id' => $userIds[0], 'type' => 'phone', 'status' => 'verified'],
            ['user_id' => $userIds[1], 'type' => 'email', 'status' => 'verified'],
            ['user_id' => $userIds[1], 'type' => 'phone', 'status' => 'verified'],
            ['user_id' => $userIds[2], 'type' => 'email', 'status' => 'verified'],
            ['user_id' => $userIds[3], 'type' => 'email', 'status' => 'verified'],
        ];
        
        $stmt = $this->pdo->prepare("
            INSERT INTO verifications (user_id, verification_type, status, verified_at) 
            VALUES (?, ?, ?, ?)
        ");
        
        foreach ($verifications as $verification) {
            $stmt->execute([
                $verification['user_id'],
                $verification['type'],
                $verification['status'],
                date('Y-m-d H:i:s')
            ]);
        }
        
        echo "✅ Created " . count($verifications) . " sample verifications\n";
    }
}

// CLI Interface for running seeder
if (php_sapi_name() === 'cli') {
    echo "🌱 LaburAR Demo Data Seeder\n";
    echo "============================\n\n";
    
    try {
        // Database connection
        $pdo = new PDO(
            "mysql:host=localhost;dbname=laburar_platform;charset=utf8mb4",
            'root',
            '',
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]
        );
        
        $seeder = new DemoDataSeeder($pdo);
        $seeder->run();
        
        echo "\n🎉 Demo data seeding completed! You can now test with:\n";
        echo "📧 Freelancers: maria.dev@gmail.com, carlos.designer@outlook.com, ana.marketing@yahoo.com, luciana.writer@gmail.com\n";
        echo "📧 Clients: admin@techstartup.com.ar, proyectos@agenciadigital.com, rrhh@empresagrande.com.ar\n";
        echo "🔑 Password: 123456 (for all demo accounts)\n\n";
        
    } catch (Exception $e) {
        echo "❌ Seeder failed: " . $e->getMessage() . "\n";
        exit(1);
    }
}
?>