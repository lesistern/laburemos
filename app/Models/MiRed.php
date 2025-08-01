<?php
/**
 * MiRed - Modelo para sistema de relaciones a largo plazo
 * 
 * Core diferenciador de LaburAR vs. Fiverr:
 * - Relaciones vs. transacciones únicas
 * - Sistema de confianza evolutivo
 * - Términos preferenciales personalizados
 * - Recomendaciones entre red
 * 
 * @author LaburAR Team
 * @version 1.0
 * @since 2025-07-20
 */

require_once __DIR__ . '/../includes/Database.php';

class MiRed {
    
    // Tipos de conexión
    const CONNECTION_FAVORITE = 'favorite';
    const CONNECTION_TRUSTED = 'trusted';
    const CONNECTION_PARTNER = 'partner';
    const CONNECTION_EXCLUSIVE = 'exclusive';
    
    // Niveles de prioridad
    const PRIORITY_LOW = 'low';
    const PRIORITY_MEDIUM = 'medium';
    const PRIORITY_HIGH = 'high';
    const PRIORITY_VIP = 'vip';
    
    // Estados de actividad
    const ACTIVITY_RECENT = 'recent';
    const ACTIVITY_MODERATE = 'moderate';
    const ACTIVITY_INACTIVE = 'inactive';
    const ACTIVITY_DORMANT = 'dormant';
    
    // Tipos de interacción
    const INTERACTION_MESSAGE = 'message';
    const INTERACTION_VIDEOCALL = 'videocall';
    const INTERACTION_PROJECT_START = 'project_start';
    const INTERACTION_PROJECT_COMPLETE = 'project_complete';
    const INTERACTION_PAYMENT = 'payment';
    const INTERACTION_REVIEW = 'review';
    const INTERACTION_REFERRAL = 'referral';
    
    private static $database;
    
    /**
     * Inicializar conexión a base de datos
     */
    private static function getDatabase() {
        if (self::$database === null) {
            self::$database = Database::getInstance();
        }
        return self::$database;
    }
    
    /**
     * Obtener Mi Red completa de un usuario
     * 
     * @param int $userId ID del usuario
     * @param string $userType 'freelancer' o 'client'
     * @return array Conexiones del usuario
     */
    public static function getMyNetwork($userId, $userType = 'client') {
        $db = self::getDatabase();
        $field = $userType === 'freelancer' ? 'freelancer_id' : 'client_id';
        
        $sql = "SELECT * FROM v_mi_red_dashboard 
                WHERE {$field} = ? 
                ORDER BY relationship_score DESC, last_project_date DESC";
        
        try {
            $stmt = $db->prepare($sql);
            $stmt->execute([$userId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            error_log("Error getting network: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Crear nueva conexión en Mi Red
     * 
     * @param int $freelancerId ID del freelancer
     * @param int $clientId ID del cliente
     * @param array $options Opciones adicionales
     * @return int|false ID de la conexión creada o false en error
     */
    public static function createConnection($freelancerId, $clientId, $options = []) {
        $db = self::getDatabase();
        
        $data = array_merge([
            'connection_type' => self::CONNECTION_FAVORITE,
            'relationship_score' => 3.0,
            'priority_level' => self::PRIORITY_MEDIUM,
            'notification_preferences' => json_encode([
                'new_projects' => true,
                'price_changes' => true,
                'availability' => true,
                'milestones' => true
            ]),
            'argentina_features' => json_encode([
                'timezone_sync' => true,
                'local_meetings' => false,
                'peso_pricing' => true,
                'afip_invoicing' => true
            ]),
            'preferred_communication' => 'chat',
            'timezone' => 'America/Argentina/Buenos_Aires'
        ], $options);
        
        $sql = "INSERT INTO red_connections 
               (freelancer_id, client_id, connection_type, relationship_score, 
                priority_level, notification_preferences, collaboration_terms,
                preferred_communication, argentina_features, timezone)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        try {
            $stmt = $db->prepare($sql);
            $result = $stmt->execute([
                $freelancerId,
                $clientId,
                $data['connection_type'],
                $data['relationship_score'],
                $data['priority_level'],
                $data['notification_preferences'],
                $data['collaboration_terms'] ?? null,
                $data['preferred_communication'],
                $data['argentina_features'],
                $data['timezone']
            ]);
            
            return $result ? $db->lastInsertId() : false;
            
        } catch (Exception $e) {
            error_log("Error creating connection: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Actualizar score de relación
     * 
     * @param int $connectionId ID de la conexión
     * @param string $interactionType Tipo de interacción
     * @param float $impactScore Score de impacto (-5.0 a +5.0)
     * @return bool Éxito de la operación
     */
    public static function updateRelationshipScore($connectionId, $interactionType, $impactScore) {
        $db = self::getDatabase();
        
        try {
            $sql = "CALL sp_update_relationship_score(?, ?, ?)";
            $stmt = $db->prepare($sql);
            $stmt->execute([$connectionId, $interactionType, $impactScore]);
            
            return true;
            
        } catch (Exception $e) {
            error_log("Error updating relationship score: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Obtener sugerencias de conexiones
     * 
     * @param int $userId ID del usuario
     * @param string $userType Tipo de usuario
     * @param int $limit Cantidad de sugerencias
     * @return array Sugerencias de conexiones
     */
    public static function getSuggestedConnections($userId, $userType, $limit = 10) {
        $db = self::getDatabase();
        
        try {
            $sql = "CALL sp_suggest_mi_red_connections(?, ?, ?)";
            $stmt = $db->prepare($sql);
            $stmt->execute([$userId, $userType, $limit]);
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
            
        } catch (Exception $e) {
            error_log("Error getting suggested connections: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Obtener conexiones por prioridad
     * 
     * @param int $userId ID del usuario
     * @param string $userType Tipo de usuario
     * @param string $priority Nivel de prioridad
     * @return array Conexiones filtradas por prioridad
     */
    public static function getConnectionsByPriority($userId, $userType, $priority) {
        $db = self::getDatabase();
        $field = $userType === 'freelancer' ? 'freelancer_id' : 'client_id';
        
        $sql = "SELECT * FROM v_mi_red_dashboard 
                WHERE {$field} = ? AND priority_level = ?
                ORDER BY relationship_score DESC";
        
        try {
            $stmt = $db->prepare($sql);
            $stmt->execute([$userId, $priority]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            error_log("Error getting connections by priority: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Obtener métricas de Mi Red
     * 
     * @param int $userId ID del usuario
     * @param string $userType Tipo de usuario
     * @return array Métricas detalladas
     */
    public static function getNetworkMetrics($userId, $userType) {
        $db = self::getDatabase();
        $field = $userType === 'freelancer' ? 'freelancer_id' : 'client_id';
        
        $sql = "SELECT 
                    COUNT(*) as total_connections,
                    AVG(relationship_score) as avg_relationship_score,
                    SUM(projects_together) as total_projects,
                    SUM(total_spent) as total_revenue,
                    
                    -- Distribución por tipo de conexión
                    SUM(CASE WHEN connection_type = 'favorite' THEN 1 ELSE 0 END) as favorites,
                    SUM(CASE WHEN connection_type = 'trusted' THEN 1 ELSE 0 END) as trusted,
                    SUM(CASE WHEN connection_type = 'partner' THEN 1 ELSE 0 END) as partners,
                    SUM(CASE WHEN connection_type = 'exclusive' THEN 1 ELSE 0 END) as exclusive,
                    
                    -- Actividad reciente
                    SUM(CASE WHEN last_project_date >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as active_last_month,
                    SUM(CASE WHEN last_project_date >= DATE_SUB(NOW(), INTERVAL 90 DAY) THEN 1 ELSE 0 END) as active_last_quarter,
                    
                    -- Valor promedio por conexión
                    AVG(total_spent / GREATEST(projects_together, 1)) as avg_project_value,
                    
                    -- Top performers
                    MAX(relationship_score) as highest_score,
                    MAX(total_spent) as highest_spending_connection
                    
                FROM red_connections 
                WHERE {$field} = ? AND status = 'active'";
        
        try {
            $stmt = $db->prepare($sql);
            $stmt->execute([$userId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$result) {
                return self::getEmptyMetrics();
            }
            
            // Agregar métricas calculadas
            $result['growth_rate'] = self::calculateGrowthRate($userId, $userType);
            $result['network_health'] = self::calculateNetworkHealth($result);
            $result['recommendations'] = self::getNetworkRecommendations($userId, $result);
            
            return $result;
            
        } catch (Exception $e) {
            error_log("Error getting network metrics: " . $e->getMessage());
            return self::getEmptyMetrics();
        }
    }
    
    /**
     * Obtener conexiones que necesitan atención
     * 
     * @param int $userId ID del usuario
     * @param string $userType Tipo de usuario
     * @return array Conexiones que requieren acción
     */
    public static function getConnectionsNeedingAttention($userId, $userType) {
        $db = self::getDatabase();
        $field = $userType === 'freelancer' ? 'freelancer_id' : 'client_id';
        
        $sql = "SELECT *,
                    CASE 
                        WHEN last_project_date < DATE_SUB(NOW(), INTERVAL 90 DAY) THEN 'reconnect'
                        WHEN projects_together >= 3 AND connection_type = 'favorite' THEN 'upgrade'
                        WHEN relationship_score < 3.0 THEN 'improve'
                        WHEN referrals_made = 0 AND projects_together >= 2 THEN 'ask_referral'
                        ELSE NULL
                    END as action_needed,
                    
                    DATEDIFF(NOW(), last_project_date) as days_inactive
                    
                FROM v_mi_red_dashboard 
                WHERE {$field} = ? 
                AND status = 'active'
                HAVING action_needed IS NOT NULL
                ORDER BY 
                    CASE action_needed
                        WHEN 'improve' THEN 1
                        WHEN 'reconnect' THEN 2
                        WHEN 'upgrade' THEN 3
                        WHEN 'ask_referral' THEN 4
                    END,
                    days_inactive DESC";
        
        try {
            $stmt = $db->prepare($sql);
            $stmt->execute([$userId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            error_log("Error getting connections needing attention: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Establecer términos preferenciales para una conexión
     * 
     * @param int $connectionId ID de la conexión
     * @param array $terms Términos preferenciales
     * @return bool Éxito de la operación
     */
    public static function setPreferredTerms($connectionId, $terms) {
        $db = self::getDatabase();
        
        try {
            $db->beginTransaction();
            
            // Desactivar términos anteriores
            $sql = "UPDATE red_preferred_terms 
                    SET is_active = FALSE 
                    WHERE connection_id = ?";
            $stmt = $db->prepare($sql);
            $stmt->execute([$connectionId]);
            
            // Insertar nuevos términos
            foreach ($terms as $termType => $config) {
                $sql = "INSERT INTO red_preferred_terms 
                       (connection_id, term_type, term_config) 
                       VALUES (?, ?, ?)";
                $stmt = $db->prepare($sql);
                $stmt->execute([
                    $connectionId, 
                    $termType, 
                    json_encode($config)
                ]);
            }
            
            $db->commit();
            return true;
            
        } catch (Exception $e) {
            $db->rollback();
            error_log("Error setting preferred terms: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Crear recomendación dentro de la red
     * 
     * @param int $recommenderId ID de quien recomienda
     * @param int $recommendedId ID de quien es recomendado
     * @param int $recipientId ID de quien recibe la recomendación
     * @param array $data Datos adicionales de la recomendación
     * @return int|false ID de la recomendación creada o false en error
     */
    public static function createRecommendation($recommenderId, $recommendedId, $recipientId, $data = []) {
        $db = self::getDatabase();
        
        $recommendationData = array_merge([
            'trust_level' => 'medium',
            'recommendation_text' => '',
            'referral_bonus' => 0.00,
            'service_category_id' => null
        ], $data);
        
        $sql = "INSERT INTO red_recommendations 
               (recommender_id, recommended_id, recipient_id, service_category_id,
                recommendation_text, trust_level, referral_bonus)
               VALUES (?, ?, ?, ?, ?, ?, ?)";
        
        try {
            $stmt = $db->prepare($sql);
            $result = $stmt->execute([
                $recommenderId,
                $recommendedId,
                $recipientId,
                $recommendationData['service_category_id'],
                $recommendationData['recommendation_text'],
                $recommendationData['trust_level'],
                $recommendationData['referral_bonus']
            ]);
            
            return $result ? $db->lastInsertId() : false;
            
        } catch (Exception $e) {
            error_log("Error creating recommendation: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Actualizar tipo de conexión
     * 
     * @param int $connectionId ID de la conexión
     * @param string $newType Nuevo tipo de conexión
     * @return bool Éxito de la operación
     */
    public static function upgradeConnection($connectionId, $newType) {
        $validTypes = [
            self::CONNECTION_FAVORITE,
            self::CONNECTION_TRUSTED,
            self::CONNECTION_PARTNER,
            self::CONNECTION_EXCLUSIVE
        ];
        
        if (!in_array($newType, $validTypes)) {
            return false;
        }
        
        $db = self::getDatabase();
        $sql = "UPDATE red_connections 
                SET connection_type = ?, 
                    relationship_score = LEAST(5.0, relationship_score + 0.5),
                    updated_at = NOW()
                WHERE id = ?";
        
        try {
            $stmt = $db->prepare($sql);
            return $stmt->execute([$newType, $connectionId]);
        } catch (Exception $e) {
            error_log("Error upgrading connection: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Obtener historial de interacciones de una conexión
     * 
     * @param int $connectionId ID de la conexión
     * @param int $limit Límite de resultados
     * @return array Historial de interacciones
     */
    public static function getConnectionHistory($connectionId, $limit = 50) {
        $db = self::getDatabase();
        
        $sql = "SELECT * FROM red_interaction_history 
                WHERE connection_id = ? 
                ORDER BY created_at DESC 
                LIMIT ?";
        
        try {
            $stmt = $db->prepare($sql);
            $stmt->execute([$connectionId, $limit]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            error_log("Error getting connection history: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Verificar si existe conexión entre dos usuarios
     * 
     * @param int $freelancerId ID del freelancer
     * @param int $clientId ID del cliente
     * @return array|false Datos de la conexión o false si no existe
     */
    public static function getConnection($freelancerId, $clientId) {
        $db = self::getDatabase();
        
        $sql = "SELECT * FROM red_connections 
                WHERE freelancer_id = ? AND client_id = ? 
                AND status = 'active'";
        
        try {
            $stmt = $db->prepare($sql);
            $stmt->execute([$freelancerId, $clientId]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            error_log("Error getting connection: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Pausar o reactivar conexión
     * 
     * @param int $connectionId ID de la conexión
     * @param string $status 'active', 'paused', 'inactive'
     * @return bool Éxito de la operación
     */
    public static function updateConnectionStatus($connectionId, $status) {
        $validStatuses = ['active', 'paused', 'inactive'];
        
        if (!in_array($status, $validStatuses)) {
            return false;
        }
        
        $db = self::getDatabase();
        $sql = "UPDATE red_connections 
                SET status = ?, updated_at = NOW() 
                WHERE id = ?";
        
        try {
            $stmt = $db->prepare($sql);
            return $stmt->execute([$status, $connectionId]);
        } catch (Exception $e) {
            error_log("Error updating connection status: " . $e->getMessage());
            return false;
        }
    }
    
    // Métodos privados auxiliares
    
    /**
     * Calcular tasa de crecimiento de la red
     */
    private static function calculateGrowthRate($userId, $userType) {
        $db = self::getDatabase();
        $field = $userType === 'freelancer' ? 'freelancer_id' : 'client_id';
        
        $sql = "SELECT 
                    COUNT(*) as current_month,
                    (SELECT COUNT(*) FROM red_connections 
                     WHERE {$field} = ? 
                     AND created_at >= DATE_SUB(DATE_SUB(NOW(), INTERVAL 1 MONTH), INTERVAL 1 MONTH)
                     AND created_at < DATE_SUB(NOW(), INTERVAL 1 MONTH)) as previous_month
                FROM red_connections 
                WHERE {$field} = ? 
                AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)";
        
        try {
            $stmt = $db->prepare($sql);
            $stmt->execute([$userId, $userId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$result || $result['previous_month'] == 0) {
                return $result['current_month'] > 0 ? 100 : 0;
            }
            
            return round((($result['current_month'] - $result['previous_month']) / $result['previous_month']) * 100, 2);
            
        } catch (Exception $e) {
            error_log("Error calculating growth rate: " . $e->getMessage());
            return 0;
        }
    }
    
    /**
     * Calcular salud de la red (0-100)
     */
    private static function calculateNetworkHealth($metrics) {
        $score = 0;
        
        // Diversidad de tipos de conexión
        $totalConnections = $metrics['total_connections'];
        if ($totalConnections > 0) {
            $diversity = ($metrics['trusted'] + $metrics['partners'] + $metrics['exclusive']) / $totalConnections;
            $score += $diversity * 30; // Máximo 30 puntos
        }
        
        // Score promedio de relaciones
        $score += ($metrics['avg_relationship_score'] / 5.0) * 40; // Máximo 40 puntos
        
        // Actividad reciente
        if ($totalConnections > 0) {
            $activity = $metrics['active_last_month'] / $totalConnections;
            $score += $activity * 30; // Máximo 30 puntos
        }
        
        return round($score);
    }
    
    /**
     * Generar recomendaciones para mejorar la red
     */
    private static function getNetworkRecommendations($userId, $metrics) {
        $recommendations = [];
        
        if ($metrics['total_connections'] < 5) {
            $recommendations[] = [
                'type' => 'grow_network',
                'message' => 'Agregá más freelancers a tu red para mejores oportunidades',
                'action' => 'explore_freelancers',
                'priority' => 'high'
            ];
        }
        
        if ($metrics['avg_relationship_score'] < 3.5) {
            $recommendations[] = [
                'type' => 'improve_relationships',
                'message' => 'Trabajá en mejorar la calidad de tus relaciones',
                'action' => 'view_low_score_connections',
                'priority' => 'medium'
            ];
        }
        
        if ($metrics['total_connections'] > 0 && ($metrics['active_last_month'] / $metrics['total_connections']) < 0.3) {
            $recommendations[] = [
                'type' => 'increase_activity',
                'message' => 'Reconectá con freelancers inactivos en tu red',
                'action' => 'view_inactive_connections',
                'priority' => 'medium'
            ];
        }
        
        if ($metrics['exclusive'] == 0 && $metrics['total_connections'] > 3) {
            $recommendations[] = [
                'type' => 'upgrade_connections',
                'message' => 'Considerá upgradeá algunas conexiones a "Socio Exclusivo"',
                'action' => 'view_upgrade_candidates',
                'priority' => 'low'
            ];
        }
        
        return $recommendations;
    }
    
    /**
     * Obtener métricas vacías para casos de error
     */
    private static function getEmptyMetrics() {
        return [
            'total_connections' => 0,
            'avg_relationship_score' => 0,
            'total_projects' => 0,
            'total_revenue' => 0,
            'favorites' => 0,
            'trusted' => 0,
            'partners' => 0,
            'exclusive' => 0,
            'active_last_month' => 0,
            'active_last_quarter' => 0,
            'avg_project_value' => 0,
            'highest_score' => 0,
            'highest_spending_connection' => 0,
            'growth_rate' => 0,
            'network_health' => 0,
            'recommendations' => []
        ];
    }
    
    /**
     * Registrar interacción manualmente
     * 
     * @param int $connectionId ID de la conexión
     * @param string $interactionType Tipo de interacción
     * @param array $data Datos adicionales
     * @param float $impactScore Score de impacto
     * @return bool Éxito de la operación
     */
    public static function logInteraction($connectionId, $interactionType, $data = [], $impactScore = 0.0) {
        $db = self::getDatabase();
        
        $sql = "INSERT INTO red_interaction_history 
               (connection_id, interaction_type, interaction_data, impact_score, notes)
               VALUES (?, ?, ?, ?, ?)";
        
        try {
            $stmt = $db->prepare($sql);
            return $stmt->execute([
                $connectionId,
                $interactionType,
                json_encode($data),
                $impactScore,
                $data['notes'] ?? null
            ]);
        } catch (Exception $e) {
            error_log("Error logging interaction: " . $e->getMessage());
            return false;
        }
    }
}