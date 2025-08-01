<?php
/**
 * LaburAR Content Validator - REAL-TIME QUALITY CONTROL
 * 
 * Validates all content in real-time to prevent dummy data
 * from entering the platform after cleanup
 * 
 * @author LaburAR Data Quality Team
 * @version 1.0
 * @since 2025-07-20
 */

class ContentValidator {
    
    // Dummy data patterns to detect and block
    private static $dummyPatterns = [
        'emails' => [
            'test', 'demo', 'example', 'admin', 'dummy', 'sample',
            '@mailinator.com', '@10minutemail.', '@tempmail.', '@guerrillamail.'
        ],
        'names' => [
            'John', 'Jane', 'Test', 'Demo', 'Admin', 'Usuario', 'User',
            'Doe', 'Smith', 'Prueba'
        ],
        'content' => [
            'Lorem ipsum', 'placeholder', 'dummy', 'sample', 'This is a test',
            'example', 'lorem', 'test content', 'demo content'
        ],
        'titles' => [
            'Test Service', 'Demo Service', 'Sample Service', 'Test Project',
            'Demo Project', 'Sample Project', 'Placeholder', 'Example'
        ],
        'generic_reviews' => [
            'Great work', 'Excellent service', 'Perfect', 'Amazing', 'Good job!',
            'Thank you!', 'Awesome!', 'Muy bueno', 'Excelente', 'Perfecto',
            'Increíble', 'Gracias'
        ],
        'placeholder_urls' => [
            'via.placeholder.com', 'placeimg.com', 'picsum.photos', 
            'placeholder.', 'demo.', 'test.', 'example.'
        ]
    ];
    
    // Quality thresholds
    private static $qualityThresholds = [
        'min_bio_length' => 50,
        'min_service_description_length' => 100,
        'min_review_length' => 20,
        'min_project_description_length' => 80,
        'max_generic_words_percentage' => 30,
        'min_rating_for_short_review' => 3.0
    ];
    
    /**
     * Validate user data before insertion/update
     */
    public static function validateUser(array $userData): array {
        $errors = [];
        
        // Validate email
        if (isset($userData['email'])) {
            $emailErrors = self::validateEmail($userData['email']);
            $errors = array_merge($errors, $emailErrors);
        }
        
        // Validate names
        if (isset($userData['first_name'])) {
            $nameErrors = self::validateName($userData['first_name'], 'first_name');
            $errors = array_merge($errors, $nameErrors);
        }
        
        if (isset($userData['last_name'])) {
            $nameErrors = self::validateName($userData['last_name'], 'last_name');
            $errors = array_merge($errors, $nameErrors);
        }
        
        // Validate bio (for freelancers)
        if (isset($userData['bio']) && isset($userData['is_freelancer']) && $userData['is_freelancer']) {
            $bioErrors = self::validateBio($userData['bio']);
            $errors = array_merge($errors, $bioErrors);
        }
        
        // Validate professional title
        if (isset($userData['professional_title'])) {
            $titleErrors = self::validateProfessionalTitle($userData['professional_title']);
            $errors = array_merge($errors, $titleErrors);
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'quality_score' => self::calculateUserQualityScore($userData)
        ];
    }
    
    /**
     * Validate service data before insertion/update
     */
    public static function validateService(array $serviceData): array {
        $errors = [];
        
        // Validate title
        if (isset($serviceData['title'])) {
            $titleErrors = self::validateServiceTitle($serviceData['title']);
            $errors = array_merge($errors, $titleErrors);
        }
        
        // Validate description
        if (isset($serviceData['description'])) {
            $descErrors = self::validateServiceDescription($serviceData['description']);
            $errors = array_merge($errors, $descErrors);
        }
        
        // Validate pricing
        if (isset($serviceData['starting_price'])) {
            $priceErrors = self::validateServicePrice($serviceData['starting_price']);
            $errors = array_merge($errors, $priceErrors);
        }
        
        // Validate image URL
        if (isset($serviceData['image_url']) && !empty($serviceData['image_url'])) {
            $imageErrors = self::validateImageUrl($serviceData['image_url']);
            $errors = array_merge($errors, $imageErrors);
        }
        
        // Validate delivery time
        if (isset($serviceData['delivery_time'])) {
            $deliveryErrors = self::validateDeliveryTime($serviceData['delivery_time']);
            $errors = array_merge($errors, $deliveryErrors);
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'quality_score' => self::calculateServiceQualityScore($serviceData)
        ];
    }
    
    /**
     * Validate review data before insertion/update
     */
    public static function validateReview(array $reviewData): array {
        $errors = [];
        
        // Validate rating
        if (isset($reviewData['rating'])) {
            $ratingErrors = self::validateRating($reviewData['rating']);
            $errors = array_merge($errors, $ratingErrors);
        }
        
        // Validate comment
        if (isset($reviewData['comment'])) {
            $commentErrors = self::validateReviewComment($reviewData['comment'], $reviewData['rating'] ?? 5);
            $errors = array_merge($errors, $commentErrors);
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'quality_score' => self::calculateReviewQualityScore($reviewData)
        ];
    }
    
    /**
     * Validate project data before insertion/update
     */
    public static function validateProject(array $projectData): array {
        $errors = [];
        
        // Validate title
        if (isset($projectData['title'])) {
            $titleErrors = self::validateProjectTitle($projectData['title']);
            $errors = array_merge($errors, $titleErrors);
        }
        
        // Validate description
        if (isset($projectData['description'])) {
            $descErrors = self::validateProjectDescription($projectData['description']);
            $errors = array_merge($errors, $descErrors);
        }
        
        // Validate budget
        if (isset($projectData['budget_min']) && isset($projectData['budget_max'])) {
            $budgetErrors = self::validateProjectBudget($projectData['budget_min'], $projectData['budget_max']);
            $errors = array_merge($errors, $budgetErrors);
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'quality_score' => self::calculateProjectQualityScore($projectData)
        ];
    }
    
    /**
     * Validate portfolio item data
     */
    public static function validatePortfolioItem(array $portfolioData): array {
        $errors = [];
        
        // Validate title
        if (isset($portfolioData['title'])) {
            $titleErrors = self::validatePortfolioTitle($portfolioData['title']);
            $errors = array_merge($errors, $titleErrors);
        }
        
        // Validate description
        if (isset($portfolioData['description'])) {
            $descErrors = self::validatePortfolioDescription($portfolioData['description']);
            $errors = array_merge($errors, $descErrors);
        }
        
        // Validate project URL
        if (isset($portfolioData['project_url']) && !empty($portfolioData['project_url'])) {
            $urlErrors = self::validateProjectUrl($portfolioData['project_url']);
            $errors = array_merge($errors, $urlErrors);
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'quality_score' => self::calculatePortfolioQualityScore($portfolioData)
        ];
    }
    
    // ================================================
    // SPECIFIC VALIDATION METHODS
    // ================================================
    
    private static function validateEmail(string $email): array {
        $errors = [];
        
        // Check basic email format
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors[] = 'El email no tiene un formato válido';
        }
        
        // Check for dummy patterns
        foreach (self::$dummyPatterns['emails'] as $pattern) {
            if (stripos($email, $pattern) !== false) {
                $errors[] = 'El email contiene patrones de datos de prueba no permitidos';
                break;
            }
        }
        
        return $errors;
    }
    
    private static function validateName(string $name, string $field): array {
        $errors = [];
        
        // Check length
        if (strlen(trim($name)) < 2) {
            $errors[] = "El campo $field debe tener al menos 2 caracteres";
        }
        
        // Check for dummy names
        foreach (self::$dummyPatterns['names'] as $dummyName) {
            if (strcasecmp(trim($name), $dummyName) === 0) {
                $errors[] = "El nombre '$name' no está permitido (datos de prueba)";
                break;
            }
        }
        
        // Check for test patterns
        if (stripos($name, 'test') !== false || stripos($name, 'demo') !== false) {
            $errors[] = "El nombre no puede contener palabras como 'test' o 'demo'";
        }
        
        return $errors;
    }
    
    private static function validateBio(string $bio): array {
        $errors = [];
        
        // Check minimum length
        if (strlen(trim($bio)) < self::$qualityThresholds['min_bio_length']) {
            $errors[] = 'La biografía debe tener al menos ' . self::$qualityThresholds['min_bio_length'] . ' caracteres';
        }
        
        // Check for dummy content
        foreach (self::$dummyPatterns['content'] as $pattern) {
            if (stripos($bio, $pattern) !== false) {
                $errors[] = 'La biografía contiene contenido de placeholder no permitido';
                break;
            }
        }
        
        return $errors;
    }
    
    private static function validateProfessionalTitle(string $title): array {
        $errors = [];
        
        // Check for dummy titles
        foreach (self::$dummyPatterns['titles'] as $dummyTitle) {
            if (stripos($title, $dummyTitle) !== false) {
                $errors[] = 'El título profesional contiene palabras no permitidas';
                break;
            }
        }
        
        return $errors;
    }
    
    private static function validateServiceTitle(string $title): array {
        $errors = [];
        
        // Check length
        if (strlen(trim($title)) < 10) {
            $errors[] = 'El título del servicio debe tener al menos 10 caracteres';
        }
        
        // Check for dummy patterns
        foreach (self::$dummyPatterns['titles'] as $dummyTitle) {
            if (stripos($title, $dummyTitle) !== false) {
                $errors[] = 'El título contiene palabras de prueba no permitidas';
                break;
            }
        }
        
        return $errors;
    }
    
    private static function validateServiceDescription(string $description): array {
        $errors = [];
        
        // Check minimum length
        if (strlen(trim($description)) < self::$qualityThresholds['min_service_description_length']) {
            $errors[] = 'La descripción debe tener al menos ' . self::$qualityThresholds['min_service_description_length'] . ' caracteres';
        }
        
        // Check for dummy content
        foreach (self::$dummyPatterns['content'] as $pattern) {
            if (stripos($description, $pattern) !== false) {
                $errors[] = 'La descripción contiene contenido de placeholder no permitido';
                break;
            }
        }
        
        return $errors;
    }
    
    private static function validateServicePrice(float $price): array {
        $errors = [];
        
        // Check realistic price range (Argentine pesos)
        if ($price < 1000) {
            $errors[] = 'El precio mínimo debe ser de AR$ 1.000';
        }
        
        if ($price > 1000000) {
            $errors[] = 'El precio máximo permitido es AR$ 1.000.000';
        }
        
        // Check for common placeholder prices
        $placeholderPrices = [1000, 5000, 10000, 15000, 20000, 25000, 50000, 100000];
        if (in_array($price, $placeholderPrices)) {
            $errors[] = 'El precio parece ser un valor placeholder. Use un precio específico.';
        }
        
        return $errors;
    }
    
    private static function validateImageUrl(string $url): array {
        $errors = [];
        
        // Check for placeholder image services
        foreach (self::$dummyPatterns['placeholder_urls'] as $pattern) {
            if (stripos($url, $pattern) !== false) {
                $errors[] = 'No se permiten URLs de imágenes placeholder';
                break;
            }
        }
        
        return $errors;
    }
    
    private static function validateDeliveryTime(int $deliveryTime): array {
        $errors = [];
        
        if ($deliveryTime < 1) {
            $errors[] = 'El tiempo de entrega debe ser al menos 1 día';
        }
        
        if ($deliveryTime > 365) {
            $errors[] = 'El tiempo de entrega no puede ser mayor a 365 días';
        }
        
        return $errors;
    }
    
    private static function validateRating(float $rating): array {
        $errors = [];
        
        if ($rating < 1 || $rating > 5) {
            $errors[] = 'La calificación debe estar entre 1 y 5';
        }
        
        return $errors;
    }
    
    private static function validateReviewComment(string $comment, float $rating): array {
        $errors = [];
        
        // Check minimum length
        if (strlen(trim($comment)) < self::$qualityThresholds['min_review_length']) {
            $errors[] = 'El comentario debe tener al menos ' . self::$qualityThresholds['min_review_length'] . ' caracteres';
        }
        
        // Check for generic reviews
        foreach (self::$dummyPatterns['generic_reviews'] as $genericReview) {
            if (strcasecmp(trim($comment), $genericReview) === 0) {
                $errors[] = 'El comentario es demasiado genérico. Proporcione detalles específicos.';
                break;
            }
        }
        
        // Check for suspiciously perfect ratings with minimal comments
        if ($rating == 5.0 && strlen(trim($comment)) < 30) {
            $errors[] = 'Calificaciones perfectas requieren comentarios más detallados';
        }
        
        // Check for dummy content patterns
        foreach (self::$dummyPatterns['content'] as $pattern) {
            if (stripos($comment, $pattern) !== false) {
                $errors[] = 'El comentario contiene contenido de prueba no permitido';
                break;
            }
        }
        
        return $errors;
    }
    
    private static function validateProjectTitle(string $title): array {
        $errors = [];
        
        // Check length
        if (strlen(trim($title)) < 10) {
            $errors[] = 'El título del proyecto debe tener al menos 10 caracteres';
        }
        
        // Check for dummy patterns
        foreach (self::$dummyPatterns['titles'] as $dummyTitle) {
            if (stripos($title, $dummyTitle) !== false) {
                $errors[] = 'El título contiene palabras de prueba no permitidas';
                break;
            }
        }
        
        return $errors;
    }
    
    private static function validateProjectDescription(string $description): array {
        $errors = [];
        
        // Check minimum length
        if (strlen(trim($description)) < self::$qualityThresholds['min_project_description_length']) {
            $errors[] = 'La descripción debe tener al menos ' . self::$qualityThresholds['min_project_description_length'] . ' caracteres';
        }
        
        // Check for dummy content
        foreach (self::$dummyPatterns['content'] as $pattern) {
            if (stripos($description, $pattern) !== false) {
                $errors[] = 'La descripción contiene contenido de placeholder no permitido';
                break;
            }
        }
        
        return $errors;
    }
    
    private static function validateProjectBudget(float $budgetMin, float $budgetMax): array {
        $errors = [];
        
        if ($budgetMin >= $budgetMax) {
            $errors[] = 'El presupuesto máximo debe ser mayor al mínimo';
        }
        
        if ($budgetMin < 5000) {
            $errors[] = 'El presupuesto mínimo debe ser de al menos AR$ 5.000';
        }
        
        if ($budgetMax > 10000000) {
            $errors[] = 'El presupuesto máximo no puede exceder AR$ 10.000.000';
        }
        
        // Check for common placeholder budgets
        if ($budgetMin == 1000 && $budgetMax == 5000) {
            $errors[] = 'Los valores de presupuesto parecen ser placeholders';
        }
        
        return $errors;
    }
    
    private static function validatePortfolioTitle(string $title): array {
        $errors = [];
        
        // Check for dummy patterns
        foreach (self::$dummyPatterns['titles'] as $dummyTitle) {
            if (stripos($title, $dummyTitle) !== false) {
                $errors[] = 'El título contiene palabras de prueba no permitidas';
                break;
            }
        }
        
        return $errors;
    }
    
    private static function validatePortfolioDescription(string $description): array {
        $errors = [];
        
        // Check minimum length
        if (strlen(trim($description)) < 30) {
            $errors[] = 'La descripción del portfolio debe tener al menos 30 caracteres';
        }
        
        // Check for dummy content
        foreach (self::$dummyPatterns['content'] as $pattern) {
            if (stripos($description, $pattern) !== false) {
                $errors[] = 'La descripción contiene contenido de placeholder no permitido';
                break;
            }
        }
        
        return $errors;
    }
    
    private static function validateProjectUrl(string $url): array {
        $errors = [];
        
        // Check for placeholder URLs
        foreach (self::$dummyPatterns['placeholder_urls'] as $pattern) {
            if (stripos($url, $pattern) !== false) {
                $errors[] = 'No se permiten URLs de proyectos placeholder';
                break;
            }
        }
        
        return $errors;
    }
    
    // ================================================
    // QUALITY SCORING METHODS
    // ================================================
    
    private static function calculateUserQualityScore(array $userData): int {
        $score = 100;
        
        // Bio quality
        if (isset($userData['bio'])) {
            $bioLength = strlen($userData['bio']);
            if ($bioLength < 50) $score -= 20;
            elseif ($bioLength < 100) $score -= 10;
            
            if (self::containsDummyContent($userData['bio'])) $score -= 30;
        }
        
        // Professional title
        if (isset($userData['professional_title']) && self::containsDummyContent($userData['professional_title'])) {
            $score -= 15;
        }
        
        // Email quality
        if (isset($userData['email']) && self::isDummyEmail($userData['email'])) {
            $score -= 25;
        }
        
        return max(0, $score);
    }
    
    private static function calculateServiceQualityScore(array $serviceData): int {
        $score = 100;
        
        // Description quality
        if (isset($serviceData['description'])) {
            $descLength = strlen($serviceData['description']);
            if ($descLength < 100) $score -= 25;
            elseif ($descLength < 200) $score -= 10;
            
            if (self::containsDummyContent($serviceData['description'])) $score -= 30;
        }
        
        // Title quality
        if (isset($serviceData['title']) && self::containsDummyContent($serviceData['title'])) {
            $score -= 20;
        }
        
        // Price realism
        if (isset($serviceData['starting_price'])) {
            $price = $serviceData['starting_price'];
            if (in_array($price, [1000, 5000, 10000, 15000, 25000, 50000])) {
                $score -= 15;
            }
        }
        
        return max(0, $score);
    }
    
    private static function calculateReviewQualityScore(array $reviewData): int {
        $score = 100;
        
        // Comment quality
        if (isset($reviewData['comment'])) {
            $commentLength = strlen($reviewData['comment']);
            if ($commentLength < 20) $score -= 30;
            elseif ($commentLength < 50) $score -= 15;
            
            if (self::isGenericReview($reviewData['comment'])) $score -= 40;
            if (self::containsDummyContent($reviewData['comment'])) $score -= 35;
        }
        
        // Rating-comment consistency
        if (isset($reviewData['rating']) && isset($reviewData['comment'])) {
            $rating = $reviewData['rating'];
            $commentLength = strlen($reviewData['comment']);
            
            if ($rating == 5.0 && $commentLength < 30) $score -= 25;
        }
        
        return max(0, $score);
    }
    
    private static function calculateProjectQualityScore(array $projectData): int {
        $score = 100;
        
        // Description quality
        if (isset($projectData['description'])) {
            $descLength = strlen($projectData['description']);
            if ($descLength < 80) $score -= 25;
            elseif ($descLength < 150) $score -= 10;
            
            if (self::containsDummyContent($projectData['description'])) $score -= 30;
        }
        
        // Budget realism
        if (isset($projectData['budget_min']) && isset($projectData['budget_max'])) {
            if ($projectData['budget_min'] == 1000 && $projectData['budget_max'] == 5000) {
                $score -= 20;
            }
        }
        
        return max(0, $score);
    }
    
    private static function calculatePortfolioQualityScore(array $portfolioData): int {
        $score = 100;
        
        // Description quality
        if (isset($portfolioData['description'])) {
            $descLength = strlen($portfolioData['description']);
            if ($descLength < 30) $score -= 20;
            elseif ($descLength < 60) $score -= 10;
            
            if (self::containsDummyContent($portfolioData['description'])) $score -= 25;
        }
        
        // Title quality
        if (isset($portfolioData['title']) && self::containsDummyContent($portfolioData['title'])) {
            $score -= 15;
        }
        
        return max(0, $score);
    }
    
    // ================================================
    // UTILITY METHODS
    // ================================================
    
    private static function containsDummyContent(string $content): bool {
        foreach (self::$dummyPatterns['content'] as $pattern) {
            if (stripos($content, $pattern) !== false) {
                return true;
            }
        }
        return false;
    }
    
    private static function isDummyEmail(string $email): bool {
        foreach (self::$dummyPatterns['emails'] as $pattern) {
            if (stripos($email, $pattern) !== false) {
                return true;
            }
        }
        return false;
    }
    
    private static function isGenericReview(string $comment): bool {
        foreach (self::$dummyPatterns['generic_reviews'] as $genericReview) {
            if (strcasecmp(trim($comment), $genericReview) === 0) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Get content quality suggestions for improvement
     */
    public static function getQualityGuidelines(string $contentType): array {
        $guidelines = [
            'user' => [
                'bio' => 'Escribí una biografía de al menos 50 caracteres que describa tu experiencia y especialidades',
                'name' => 'Usá tu nombre real, evitá palabras como "test" o "demo"',
                'email' => 'Usá un email real que revisés regularmente'
            ],
            'service' => [
                'title' => 'Creá un título descriptivo de al menos 10 caracteres',
                'description' => 'Escribí una descripción detallada de al menos 100 caracteres explicando qué incluye tu servicio',
                'price' => 'Establecé un precio realista específico, evitá números redondos como 10.000'
            ],
            'review' => [
                'comment' => 'Escribí un comentario específico de al menos 20 caracteres explicando tu experiencia',
                'rating' => 'Las calificaciones perfectas (5★) requieren comentarios más detallados'
            ],
            'project' => [
                'title' => 'Usá un título claro de al menos 10 caracteres',
                'description' => 'Describí tu proyecto en detalle (mínimo 80 caracteres) incluyendo requisitos específicos',
                'budget' => 'Establecé un rango de presupuesto realista según el alcance del proyecto'
            ]
        ];
        
        return $guidelines[$contentType] ?? [];
    }
    
    /**
     * Auto-fix common content issues
     */
    public static function autoFixContent(string $content, string $type): string {
        // Remove multiple spaces
        $content = preg_replace('/\s+/', ' ', $content);
        
        // Trim whitespace
        $content = trim($content);
        
        // Capitalize first letter for titles
        if (in_array($type, ['title', 'name'])) {
            $content = ucfirst($content);
        }
        
        // Add period to descriptions if missing
        if (in_array($type, ['description', 'bio']) && !preg_match('/[.!?]$/', $content)) {
            $content .= '.';
        }
        
        return $content;
    }
    
    /**
     * Check if platform has quality content
     */
    public static function getPlatformQualityReport(): array {
        try {
            $db = DatabaseHelper::getConnection();
            
            // Check for remaining dummy data
            $auditQueries = [
                'dummy_users' => "SELECT COUNT(*) FROM users WHERE email LIKE '%test%' OR first_name IN ('John', 'Jane', 'Test')",
                'short_bios' => "SELECT COUNT(*) FROM users WHERE is_freelancer = 1 AND (bio IS NULL OR LENGTH(bio) < 50)",
                'short_descriptions' => "SELECT COUNT(*) FROM services WHERE LENGTH(description) < 100",
                'generic_reviews' => "SELECT COUNT(*) FROM reviews WHERE comment IN ('Great work', 'Excellent', 'Perfect')",
                'placeholder_prices' => "SELECT COUNT(*) FROM services WHERE starting_price IN (1000, 5000, 10000)"
            ];
            
            $results = [];
            foreach ($auditQueries as $check => $query) {
                $stmt = $db->query($query);
                $results[$check] = $stmt->fetchColumn();
            }
            
            $totalIssues = array_sum($results);
            $qualityScore = max(0, 100 - ($totalIssues * 5));
            
            return [
                'quality_score' => $qualityScore,
                'issues' => $results,
                'total_issues' => $totalIssues,
                'production_ready' => $totalIssues === 0
            ];
            
        } catch (Exception $e) {
            return [
                'error' => 'Could not generate quality report',
                'details' => $e->getMessage()
            ];
        }
    }
}
?>