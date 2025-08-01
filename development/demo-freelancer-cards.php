<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="demo-token">
    <title>LaburAR - Freelancers Destacados</title>
    
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    
    <!-- Icons -->
    <style>
        .icon-location::before { content: "📍"; }
        .icon-message::before { content: "💬"; }
        .icon-user::before { content: "👤"; }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            margin: 0;
            padding: 40px 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            margin-bottom: 48px;
        }
        
        .header h1 {
            color: #ffffff;
            font-size: 2.5rem;
            font-weight: 800;
            margin: 0 0 16px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .header p {
            color: rgba(255, 255, 255, 0.9);
            font-size: 1.1rem;
            margin: 0;
        }
        
        .cards-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 32px;
            justify-items: center;
        }
        
        @media (max-width: 768px) {
            .cards-grid {
                grid-template-columns: 1fr;
                gap: 24px;
            }
            
            .header h1 {
                font-size: 2rem;
            }
        }
        
        .demo-note {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 32px;
            text-align: center;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .demo-note p {
            color: rgba(255, 255, 255, 0.9);
            margin: 0;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🇦🇷 LaburAR</h1>
            <p>Conecta con los mejores freelancers de Argentina</p>
        </div>
        
        <div class="demo-note">
            <p>💡 <strong>Demo Interactivo:</strong> Hace clic en los botones para ver las funcionalidades. Los datos son de ejemplo.</p>
        </div>
        
        <div class="cards-grid">
            <?php
            require_once 'components/FreelancerCard.php';
            
            // Sample freelancers data for Argentine platform
            $freelancers = [
                [
                    'id' => 1,
                    'name' => 'María González',
                    'title' => 'Desarrolladora Full Stack & UX Designer',
                    'description' => 'Especialista en desarrollo web con más de 5 años de experiencia. Creo soluciones digitales innovadoras para empresas argentinas y del exterior. Experta en React, Laravel y design systems.',
                    'rating' => 4.9,
                    'review_count' => 67,
                    'hourly_rate' => 2800,
                    'skills' => ['React', 'Laravel', 'PHP', 'JavaScript', 'UX Design', 'Figma', 'MySQL'],
                    'profile_image' => 'https://images.unsplash.com/photo-1494790108755-2616b612b21c?w=150&h=150&fit=crop&crop=face',
                    'is_online' => true,
                    'location' => 'Buenos Aires, Argentina'
                ],
                [
                    'id' => 2,
                    'name' => 'Carlos Mendoza',
                    'title' => 'Especialista en Marketing Digital',
                    'description' => 'Ayudo a empresas a crecer en el mundo digital. Especializado en campañas de Google Ads, Facebook Ads y estrategias de contenido para el mercado argentino.',
                    'rating' => 4.7,
                    'review_count' => 134,
                    'hourly_rate' => 2200,
                    'skills' => ['Google Ads', 'Facebook Ads', 'SEO', 'Analytics', 'Content Marketing', 'Email Marketing'],
                    'profile_image' => 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
                    'is_online' => false,
                    'location' => 'Córdoba, Argentina'
                ],
                [
                    'id' => 3,
                    'name' => 'Ana Rodríguez',
                    'title' => 'Diseñadora Gráfica & Ilustradora',
                    'description' => 'Diseño marcas memorables y materiales gráficos que conectan con tu audiencia. Especializada en identidad visual, packaging y ilustración digital.',
                    'rating' => 4.8,
                    'review_count' => 89,
                    'hourly_rate' => 1900,
                    'skills' => ['Illustrator', 'Photoshop', 'Branding', 'Logo Design', 'Packaging', 'Ilustración Digital'],
                    'profile_image' => 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
                    'is_online' => true,
                    'location' => 'Rosario, Argentina'
                ],
                [
                    'id' => 4,
                    'name' => 'Diego Fernández',
                    'title' => 'Desarrollador Mobile (iOS & Android)',
                    'description' => 'Desarrollo aplicaciones móviles nativas e híbridas. Experiencia en Flutter, React Native y desarrollo nativo para iOS y Android.',
                    'rating' => 4.6,
                    'review_count' => 52,
                    'hourly_rate' => 3200,
                    'skills' => ['Flutter', 'React Native', 'iOS', 'Android', 'Firebase', 'API Integration'],
                    'profile_image' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
                    'is_online' => true,
                    'location' => 'Mendoza, Argentina'
                ],
                [
                    'id' => 5,
                    'name' => 'Sofía Martinez',
                    'title' => 'Redactora & Content Manager',
                    'description' => 'Creo contenido que convierte. Especializada en copywriting, blogs corporativos y estrategias de contenido para redes sociales.',
                    'rating' => 4.9,
                    'review_count' => 98,
                    'hourly_rate' => 1600,
                    'skills' => ['Copywriting', 'Content Strategy', 'SEO Writing', 'Social Media', 'Blog Writing'],
                    'profile_image' => 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
                    'is_online' => false,
                    'location' => 'La Plata, Argentina'
                ],
                [
                    'id' => 6,
                    'name' => 'Martín López',
                    'title' => 'Consultor en Transformación Digital',
                    'description' => 'Ayudo a PYMES argentinas en su proceso de digitalización. Implemento soluciones tecnológicas que optimizan procesos y aumentan la productividad.',
                    'rating' => 4.7,
                    'review_count' => 73,
                    'hourly_rate' => 3500,
                    'skills' => ['Consultoría Digital', 'Business Intelligence', 'Process Automation', 'CRM', 'ERP'],
                    'profile_image' => 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face',
                    'is_online' => true,
                    'location' => 'Buenos Aires, Argentina'
                ]
            ];
            
            // Render each freelancer card
            foreach ($freelancers as $freelancer) {
                $card = new FreelancerCard($freelancer);
                echo $card->render();
            }
            ?>
        </div>
    </div>
    
    <!-- JavaScript functionality -->
    <script src="assets/js/freelancer-card.js"></script>
    
    <!-- Demo-specific JavaScript -->
    <script>
        // Demo functionality for testing
        document.addEventListener('DOMContentLoaded', function() {
            // Add demo functionality
            console.log('🚀 LaburAR Demo cargado exitosamente!');
            console.log('📊 SuperClaude Framework activo');
            console.log('🎨 Magic MCP: Generación de UI');
            console.log('🧠 Sequential MCP: Análisis sistemático');
            console.log('📚 Context7 MCP: Documentación actualizada');
            console.log('🧪 Playwright MCP: Testing automatizado');
            
            // Override functions for demo
            window.openChat = function(freelancerId) {
                const freelancer = document.querySelector(`[data-freelancer-id="${freelancerId}"] .freelancer-name`).textContent;
                alert(`💬 Chat con ${freelancer}\n\n🔗 En la versión completa, esto abriría el sistema de mensajería integrado.`);
            };
            
            window.viewProfile = function(freelancerId) {
                const freelancer = document.querySelector(`[data-freelancer-id="${freelancerId}"] .freelancer-name`).textContent;
                alert(`👤 Perfil de ${freelancer}\n\n🔗 En la versión completa, esto mostraría el perfil completo del freelancer con portfolio, testimonios y más detalles.`);
            };
            
            // Add some interactive demo features
            setTimeout(() => {
                // Simulate real-time online status updates
                const cards = document.querySelectorAll('.freelancer-card');
                setInterval(() => {
                    const randomCard = cards[Math.floor(Math.random() * cards.length)];
                    const indicator = randomCard.querySelector('.online-indicator');
                    
                    if (indicator && Math.random() > 0.7) {
                        indicator.style.opacity = '0.5';
                        setTimeout(() => {
                            indicator.style.opacity = '1';
                        }, 1000);
                    }
                }, 5000);
            }, 2000);
        });
    </script>
</body>
</html>