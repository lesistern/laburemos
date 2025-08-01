<?php
/**
 * ServiceArgentino - Extensión del modelo Service para funcionalidades argentinas
 * 
 * Extiende Service.php con:
 * - Sistema de paquetes (basico/completo/premium/colaborativo)
 * - Trust signals argentinos
 * - Filtros localizados
 * - Integración MercadoPago
 * 
 * @author LaburAR Team
 * @version 1.0
 * @since 2025-07-19
 */

require_once 'Service.php';
require_once 'BaseModel.php';

class ServiceArgentino extends Service {
    
    protected static $tabla_packages = 'service_packages';
    protected static $tabla_trust = 'argentina_trust_signals';
    
    /**
     * Campos específicos argentinos
     */
    protected static $campos_argentinos = [
        'service_type',
        'argentina_features', 
        'monotributo_verified',
        'videollamada_available',
        'cuotas_disponibles',
        'talento_argentino_badge',
        'ubicacion_argentina'
    ];

    /**
     * Crear servicio argentino con paquetes
     * 
     * @param array $data Datos del servicio
     * @param array $packages Paquetes del servicio
     * @return array Resultado de la creación
     */
    public static function createServicioArgentino($data, $packages = []) {
        try {
            self::validarDatosArgentinos($data);
            
            $database = Database::getInstance();
            $database->beginTransaction();
            
            // Procesar features argentinos
            $argentinianFeatures = self::procesarFeaturesArgentinos($data);
            $data['argentina_features'] = json_encode($argentinianFeatures);
            
            // Crear servicio base usando método padre
            $serviceId = parent::create($data);
            
            // Crear paquetes si se proporcionaron
            if (!empty($packages)) {
                self::crearPaquetes($serviceId, $packages);
            } else {
                // Crear paquete básico por defecto
                self::crearPaqueteBasico($serviceId, $data);
            }
            
            $database->commit();
            
            return [
                'success' => true,
                'service_id' => $serviceId,
                'message' => 'Servicio argentino creado exitosamente'
            ];
            
        } catch (Exception $e) {
            if (isset($database)) {
                $database->rollback();
            }
            
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Obtener servicios con filtros argentinos
     * 
     * @param array $filtros Filtros específicos argentinos
     * @return array Servicios filtrados
     */
    public static function buscarConFiltrosArgentinos($filtros = []) {
        $sql = "SELECT s.*, u.username, u.avatar_url, u.first_name, u.last_name,
                       MIN(sp.price) as precio_desde,
                       COUNT(sp.id) as total_paquetes,
                       GROUP_CONCAT(DISTINCT sp.package_type) as tipos_paquetes
                FROM services s 
                JOIN users u ON s.user_id = u.id 
                LEFT JOIN service_packages sp ON s.id = sp.service_id AND sp.is_active = TRUE
                WHERE s.status = 'active'";
        
        $params = [];
        
        // Filtro monotributo verificado
        if (!empty($filtros['monotributo_verified'])) {
            $sql .= " AND s.monotributo_verified = ?";
            $params[] = 1;
        }
        
        // Filtro videollamadas disponibles
        if (!empty($filtros['videollamada_available'])) {
            $sql .= " AND s.videollamada_available = ?";
            $params[] = 1;
        }
        
        // Filtro cuotas disponibles
        if (!empty($filtros['cuotas_disponibles'])) {
            $sql .= " AND s.cuotas_disponibles = ?";
            $params[] = 1;
        }
        
        if (!empty($filtros['ubicacion'])) {
            $sql .= " AND s.ubicacion_argentina LIKE ?";
            $params[] = '%' . $filtros['ubicacion'] . '%';
        }
        
        // Filtro tipo de servicio
        if (!empty($filtros['service_type'])) {
            $sql .= " AND s.service_type = ?";
            $params[] = $filtros['service_type'];
        }
        
        // Filtro rango de precios
        if (!empty($filtros['precio_min'])) {
            $sql .= " AND EXISTS (
                SELECT 1 FROM service_packages sp2 
                WHERE sp2.service_id = s.id AND sp2.price >= ?
            )";
            $params[] = $filtros['precio_min'];
        }
        
        if (!empty($filtros['precio_max'])) {
            $sql .= " AND EXISTS (
                SELECT 1 FROM service_packages sp3 
                WHERE sp3.service_id = s.id AND sp3.price <= ?
            )";
            $params[] = $filtros['precio_max'];
        }
        
        // Filtro talent badge argentino
        if (!empty($filtros['talento_argentino'])) {
            $sql .= " AND s.talento_argentino_badge = ?";
            $params[] = 1;
        }
        
        $sql .= " GROUP BY s.id";
        
        // Ordenamiento
        $orderBy = $filtros['order_by'] ?? 'created_at';
        $orderDir = $filtros['order_dir'] ?? 'DESC';
        
        switch ($orderBy) {
            case 'precio':
                $sql .= " ORDER BY precio_desde " . $orderDir;
                break;
            case 'popularidad':
                $sql .= " ORDER BY s.views_count " . $orderDir;
                break;
            case 'rating':
                $sql .= " ORDER BY s.rating " . $orderDir;
                break;
            default:
                $sql .= " ORDER BY s.created_at " . $orderDir;
        }
        
        // Paginación
        $limit = $filtros['limit'] ?? 20;
        $offset = $filtros['offset'] ?? 0;
        $sql .= " LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        
        return self::query($sql, $params);
    }

    /**
     * Obtener paquetes de un servicio
     * 
     * @param int $serviceId ID del servicio
     * @return array Paquetes del servicio
     */
    public function getPaquetes() {
        $sql = "SELECT sp.*, 
                       CASE 
                           WHEN sp.currency = 'USD' THEN sp.price * 1000 
                           ELSE sp.price 
                       END as precio_ars,
                       CASE 
                           WHEN sp.cuotas_disponibles = 1 THEN 'Hasta 12 cuotas sin interés'
                           ELSE 'Solo contado'
                       END as info_pago
                FROM service_packages sp 
                WHERE sp.service_id = ? AND sp.is_active = TRUE
                ORDER BY FIELD(sp.package_type, 'basico', 'completo', 'premium', 'colaborativo')";
        
        return $this->database->query($sql, [$this->id]);
    }

    /**
     * Obtener trust signals del usuario del servicio
     * 
     * @return array Trust signals verificados
     */
    public function getTrustSignals() {
        $sql = "SELECT ats.*, 
                       CASE ats.signal_type
                           WHEN 'monotributo' THEN 'Monotributista Verificado'
                           WHEN 'camara_comercio' THEN 'Cámara de Comercio'
                           WHEN 'universidad' THEN 'Universidad Certificada'
                           WHEN 'referencias_locales' THEN 'Referencias Verificadas'
                           ELSE 'Verificación Especial'
                       END as badge_label,
                       CASE ats.signal_type
                           WHEN 'monotributo' THEN '#28a745'
                           WHEN 'camara_comercio' THEN '#007bff'
                           WHEN 'universidad' THEN '#6f42c1'
                           WHEN 'referencias_locales' THEN '#fd7e14'
                           ELSE '#6c757d'
                       END as badge_color
                FROM argentina_trust_signals ats
                WHERE ats.user_id = ? AND ats.verified = TRUE
                ORDER BY ats.verification_date DESC";
        
        return $this->database->query($sql, [$this->user_id]);
    }

    /**
     * Calcular score de confianza argentino
     * 
     * @return array Score y badges
     */
    public function calcularTrustScore() {
        $signals = $this->getTrustSignals();
        $score = 0;
        $badges = [];
        
        foreach ($signals as $signal) {
            switch ($signal['signal_type']) {
                case 'monotributo':
                    $score += 25;
                    break;
                case 'camara_comercio':
                    $score += 20;
                    break;
                case 'universidad':
                    $score += 15;
                    break;
                case 'referencias_locales':
                    $score += 10;
                    break;
            }
            
            $badges[] = [
                'type' => $signal['signal_type'],
                'label' => $signal['badge_label'],
                'color' => $signal['badge_color'],
                'verified_date' => $signal['verification_date']
            ];
        }
        
        // Badge especial Talento Argentino
        if ($score >= 50 || $this->talento_argentino_badge) {
            $badges[] = [
                'type' => 'talento_argentino',
                'label' => 'Talento Argentino',
                'color' => '#6FBFEF',
                'premium' => true
            ];
        }
        
        return [
            'score' => $score,
            'level' => $this->determinarNivel($score),
            'badges' => $badges
        ];
    }

    /**
     * Obtener servicios similares argentinos
     * 
     * @return array Servicios relacionados
     */
    public function getServiciosSimilares() {
        $sql = "SELECT s.id, s.title, s.user_id, u.username, 
                       MIN(sp.price) as precio_desde,
                       s.rating, s.rating_count
                FROM services s
                JOIN users u ON s.user_id = u.id
                LEFT JOIN service_packages sp ON s.id = sp.service_id
                WHERE s.category_id = ? 
                AND s.id != ? 
                AND s.status = 'active'
                AND s.ubicacion_argentina IS NOT NULL
                GROUP BY s.id
                ORDER BY s.rating DESC, s.rating_count DESC
                LIMIT 6";
        
        return $this->database->query($sql, [$this->category_id, $this->id]);
    }

    /**
     * Validar datos específicos argentinos
     * 
     * @param array $data Datos a validar
     * @throws Exception Si hay errores de validación
     */
    private static function validarDatosArgentinos($data) {
        // Validar tipo de servicio
        $tiposValidos = ['gig', 'custom', 'hybrid'];
        if (!empty($data['service_type']) && !in_array($data['service_type'], $tiposValidos)) {
            throw new Exception('Tipo de servicio no válido');
        }
        
        if (!empty($data['ubicacion_argentina'])) {
            $ubicacionesValidas = [
                'CABA', 'Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 
                'Tucumán', 'La Plata', 'Mar del Plata', 'Neuquén', 'Formosa'
            ];
            
            $ubicacionValida = false;
            foreach ($ubicacionesValidas as $ubicacion) {
                if (stripos($data['ubicacion_argentina'], $ubicacion) !== false) {
                    $ubicacionValida = true;
                    break;
                }
            }
            
            if (!$ubicacionValida) {
                throw new Exception('Ubicación argentina no válida');
            }
        }
    }

    /**
     * Procesar features específicos argentinos
     * 
     * @param array $data Datos del servicio
     * @return array Features procesados
     */
    private static function procesarFeaturesArgentinos($data) {
        return [
            'acepta_pesos' => $data['acepta_pesos'] ?? true,
            'ubicacion_argentina' => $data['ubicacion_argentina'] ?? '',
            'nivel_español' => $data['nivel_español'] ?? 'nativo',
            'horario_argentina' => $data['horario_argentina'] ?? false,
            'experiencia_local' => $data['experiencia_local'] ?? '',
            'referencias_argentinas' => $data['referencias_argentinas'] ?? 0
        ];
    }

    /**
     * Crear paquetes para un servicio
     * 
     * @param int $serviceId ID del servicio
     * @param array $packages Datos de los paquetes
     */
    private static function crearPaquetes($serviceId, $packages) {
        foreach ($packages as $package) {
            $sql = "INSERT INTO service_packages 
                   (service_id, package_type, name, description, price, currency, 
                    delivery_days, revisions_included, videollamadas_included, 
                    features, cuotas_disponibles) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            
            self::query($sql, [
                $serviceId,
                $package['type'],
                $package['name'],
                $package['description'] ?? '',
                $package['price'],
                $package['currency'] ?? 'ARS',
                $package['delivery_days'],
                $package['revisions'] ?? 1,
                $package['videollamadas'] ?? 0,
                json_encode($package['features'] ?? []),
                $package['cuotas'] ?? false
            ]);
        }
    }

    /**
     * Crear paquete básico por defecto
     * 
     * @param int $serviceId ID del servicio
     * @param array $data Datos del servicio
     */
    private static function crearPaqueteBasico($serviceId, $data) {
        $sql = "INSERT INTO service_packages 
               (service_id, package_type, name, price, delivery_days) 
               VALUES (?, 'basico', 'Servicio Básico', ?, ?)";
        
        self::query($sql, [
            $serviceId,
            $data['precio_base'] ?? 5000,
            $data['tiempo_entrega'] ?? 7
        ]);
    }

    /**
     * Determinar nivel basado en score
     * 
     * @param int $score Score de confianza
     * @return string Nivel determinado
     */
    private function determinarNivel($score) {
        if ($score >= 70) return 'elite';
        if ($score >= 50) return 'pro';
        if ($score >= 30) return 'verified';
        return 'basic';
    }
}