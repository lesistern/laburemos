<?php
/**
 * Modern Freelancer Profile Card Component
 * For LaburAR Argentine Freelance Platform
 * 
 * Features:
 * - Responsive design optimized for mobile-first
 * - Argentine peso pricing display
 * - Skills showcase with tags
 * - Star rating system
 * - Professional profile image
 * - Quick action buttons
 */

class FreelancerCard {
    private $freelancer;
    
    public function __construct($freelancerData) {
        $this->freelancer = $freelancerData;
    }
    
    public function render() {
        $name = htmlspecialchars($this->freelancer['name']);
        $title = htmlspecialchars($this->freelancer['title']);
        $description = htmlspecialchars($this->freelancer['description']);
        $rating = floatval($this->freelancer['rating']);
        $reviewCount = intval($this->freelancer['review_count']);
        $hourlyRate = floatval($this->freelancer['hourly_rate']);
        $skills = $this->freelancer['skills'] ?? [];
        $profileImage = htmlspecialchars($this->freelancer['profile_image'] ?? '/assets/img/default-avatar.jpg');
        $isOnline = $this->freelancer['is_online'] ?? false;
        $location = htmlspecialchars($this->freelancer['location'] ?? '');
        
        ob_start();
        ?>
        <div class="freelancer-card" data-freelancer-id="<?= $this->freelancer['id'] ?>">
            <!-- Header with Profile Image and Status -->
            <div class="card-header">
                <div class="profile-image-container">
                    <img src="<?= $profileImage ?>" 
                         alt="<?= $name ?>" 
                         class="profile-image"
                         loading="lazy">
                    <?php if ($isOnline): ?>
                        <div class="online-indicator" title="En línea"></div>
                    <?php endif; ?>
                </div>
                
                <div class="profile-info">
                    <h3 class="freelancer-name"><?= $name ?></h3>
                    <p class="freelancer-title"><?= $title ?></p>
                    <?php if ($location): ?>
                        <p class="location">
                            <i class="icon-location"></i>
                            <?= $location ?>
                        </p>
                    <?php endif; ?>
                </div>
                
                <div class="rating-container">
                    <div class="stars">
                        <?php for ($i = 1; $i <= 5; $i++): ?>
                            <span class="star <?= $i <= $rating ? 'filled' : '' ?>">★</span>
                        <?php endfor; ?>
                    </div>
                    <span class="rating-number"><?= number_format($rating, 1) ?></span>
                    <span class="review-count">(<?= $reviewCount ?> reseñas)</span>
                </div>
            </div>

            <!-- Description -->
            <div class="card-body">
                <p class="description"><?= $description ?></p>
                
                <!-- Skills Tags -->
                <?php if (!empty($skills)): ?>
                    <div class="skills-container">
                        <h4 class="skills-title">Habilidades</h4>
                        <div class="skills-tags">
                            <?php foreach (array_slice($skills, 0, 6) as $skill): ?>
                                <span class="skill-tag"><?= htmlspecialchars($skill) ?></span>
                            <?php endforeach; ?>
                            <?php if (count($skills) > 6): ?>
                                <span class="skill-tag more">+<?= count($skills) - 6 ?> más</span>
                            <?php endif; ?>
                        </div>
                    </div>
                <?php endif; ?>
            </div>

            <!-- Footer with Pricing and Actions -->
            <div class="card-footer">
                <div class="pricing">
                    <span class="rate-label">Desde</span>
                    <span class="hourly-rate">AR$ <?= number_format($hourlyRate, 0, ',', '.') ?></span>
                    <span class="rate-unit">/hora</span>
                </div>
                
                <div class="action-buttons">
                    <button class="btn btn-secondary btn-contact" 
                            onclick="openChat(<?= $this->freelancer['id'] ?>)">
                        <i class="icon-message"></i>
                        Contactar
                    </button>
                    <button class="btn btn-primary btn-hire" 
                            onclick="viewProfile(<?= $this->freelancer['id'] ?>)">
                        <i class="icon-user"></i>
                        Ver Perfil
                    </button>
                </div>
            </div>
        </div>
        
        <style>
        .freelancer-card {
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: 1px solid #f1f5f9;
            overflow: hidden;
            max-width: 400px;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        .freelancer-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 40px rgba(0, 0, 0, 0.12);
            border-color: #e2e8f0;
        }
        
        .card-header {
            padding: 24px 24px 16px;
            position: relative;
        }
        
        .profile-image-container {
            position: relative;
            width: 80px;
            height: 80px;
            margin: 0 auto 16px;
        }
        
        .profile-image {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            object-fit: cover;
            border: 3px solid #f8fafc;
            box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05);
        }
        
        .online-indicator {
            position: absolute;
            bottom: 4px;
            right: 4px;
            width: 20px;
            height: 20px;
            background: #10b981;
            border: 3px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
        }
        
        .profile-info {
            text-align: center;
            margin-bottom: 16px;
        }
        
        .freelancer-name {
            font-size: 20px;
            font-weight: 700;
            color: #1e293b;
            margin: 0 0 4px;
            line-height: 1.3;
        }
        
        .freelancer-title {
            font-size: 14px;
            color: #64748b;
            margin: 0 0 8px;
            font-weight: 500;
        }
        
        .location {
            font-size: 13px;
            color: #94a3b8;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
        }
        
        .rating-container {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            flex-wrap: wrap;
        }
        
        .stars {
            display: flex;
            gap: 2px;
        }
        
        .star {
            font-size: 16px;
            color: #e2e8f0;
            transition: color 0.2s;
        }
        
        .star.filled {
            color: #fbbf24;
        }
        
        .rating-number {
            font-weight: 600;
            color: #1e293b;
            font-size: 14px;
        }
        
        .review-count {
            font-size: 13px;
            color: #64748b;
        }
        
        .card-body {
            padding: 0 24px 20px;
        }
        
        .description {
            font-size: 14px;
            line-height: 1.6;
            color: #475569;
            margin: 0 0 20px;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        
        .skills-container {
            margin-bottom: 8px;
        }
        
        .skills-title {
            font-size: 13px;
            font-weight: 600;
            color: #374151;
            margin: 0 0 10px;
        }
        
        .skills-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }
        
        .skill-tag {
            background: #f1f5f9;
            color: #475569;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            border: 1px solid #e2e8f0;
            transition: all 0.2s;
        }
        
        .skill-tag:hover {
            background: #e2e8f0;
            transform: translateY(-1px);
        }
        
        .skill-tag.more {
            background: #3b82f6;
            color: #ffffff;
            border-color: #3b82f6;
        }
        
        .card-footer {
            padding: 20px 24px 24px;
            border-top: 1px solid #f1f5f9;
            background: #fafbfc;
        }
        
        .pricing {
            text-align: center;
            margin-bottom: 16px;
        }
        
        .rate-label {
            font-size: 12px;
            color: #64748b;
            font-weight: 500;
        }
        
        .hourly-rate {
            font-size: 24px;
            font-weight: 800;
            color: #059669;
            margin: 0 4px;
            display: inline-block;
        }
        
        .rate-unit {
            font-size: 14px;
            color: #64748b;
            font-weight: 500;
        }
        
        .action-buttons {
            display: flex;
            gap: 12px;
        }
        
        .btn {
            flex: 1;
            padding: 12px 16px;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 600;
            border: none;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            text-decoration: none;
        }
        
        .btn-primary {
            background: #3b82f6;
            color: #ffffff;
        }
        
        .btn-primary:hover {
            background: #2563eb;
            transform: translateY(-1px);
            box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
        }
        
        .btn-secondary {
            background: #f8fafc;
            color: #475569;
            border: 1px solid #e2e8f0;
        }
        
        .btn-secondary:hover {
            background: #f1f5f9;
            border-color: #cbd5e1;
            transform: translateY(-1px);
        }
        
        /* Argentine Flag Colors Accent */
        .freelancer-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, #74ACDF 33.33%, #FFFFFF 33.33%, #FFFFFF 66.66%, #F6B40E 66.66%);
        }
        
        /* Mobile Responsive */
        @media (max-width: 480px) {
            .freelancer-card {
                margin: 0 16px;
                max-width: none;
            }
            
            .card-header, .card-body, .card-footer {
                padding-left: 20px;
                padding-right: 20px;
            }
            
            .action-buttons {
                flex-direction: column;
            }
            
            .btn {
                flex: none;
            }
        }
        
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
            .freelancer-card {
                background: #1e293b;
                border-color: #334155;
            }
            
            .freelancer-name {
                color: #f8fafc;
            }
            
            .card-footer {
                background: #0f172a;
                border-color: #334155;
            }
        }
        </style>
        <?php
        return ob_get_clean();
    }
}

// Usage example:
/*
$sampleFreelancer = [
    'id' => 123,
    'name' => 'María González',
    'title' => 'Desarrolladora Full Stack & Diseñadora UX',
    'description' => 'Especialista en desarrollo web con más de 5 años de experiencia. Creo soluciones digitales innovadoras para empresas argentinas y del exterior.',
    'rating' => 4.8,
    'review_count' => 47,
    'hourly_rate' => 2500,
    'skills' => ['PHP', 'JavaScript', 'React', 'Laravel', 'MySQL', 'UX Design', 'Figma'],
    'profile_image' => '/assets/img/freelancers/maria-gonzalez.jpg',
    'is_online' => true,
    'location' => 'Buenos Aires, Argentina'
];

$card = new FreelancerCard($sampleFreelancer);
echo $card->render();
*/
?>