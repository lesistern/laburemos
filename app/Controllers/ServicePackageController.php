<?php
/**
 * ServicePackageController - Gestión de paquetes de servicios argentinos
 * 
 * Endpoints para:
 * - CRUD de paquetes de servicios
 * - Pricing con pesos argentinos
 * - Integración con MercadoPago
 * - Validaciones de negocio
 * 
 * @author LaburAR Team
 * @version 1.0
 */

require_once '../includes/Database.php';
require_once '../includes/SecurityHelper.php';
require_once '../includes/ValidationHelper.php';
require_once '../models/ServiceArgentino.php';

class ServicePackageController {
    
    private $database;
    private $security;
    private $validator;
    
    public function __construct() {
        $this->database = Database::getInstance();
        $this->security = new SecurityHelper();
        $this->validator = new ValidationHelper();
        
        // Headers CORS argentinos
        header('Content-Type: application/json; charset=utf-8');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token');
    }
    
    /**
     * Manejar todas las requests
     */
    public function handleRequest() {
        try {
            // Validar CSRF token
            if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
                $this->security->validateCSRFToken();
            }
            
            $method = $_SERVER['REQUEST_METHOD'];
            $action = $_GET['action'] ?? '';
            
            switch ($method) {
                case 'GET':
                    $this->handleGet($action);
                    break;
                    
                case 'POST':
                    $this->handlePost($action);
                    break;
                    
                case 'PUT':
                    $this->handlePut($action);
                    break;
                    
                case 'DELETE':
                    $this->handleDelete($action);
                    break;
                    
                case 'OPTIONS':
                    http_response_code(200);
                    break;
                    
                default:
                    throw new Exception('Método no permitido');
            }
            
        } catch (Exception $e) {
            $this->sendError($e->getMessage(), 400);
        }
    }
    
    /**
     * Manejar requests GET
     */
    private function handleGet($action) {
        switch ($action) {
            case 'packages':
                $this->getPackages();
                break;
                
            case 'package':
                $this->getPackage();
                break;
                
            case 'pricing':
                $this->getPricingInfo();
                break;
                
            default:
                throw new Exception('Acción no válida');
        }
    }
    
    /**
     * Manejar requests POST
     */
    private function handlePost($action) {
        switch ($action) {
            case 'create':
                $this->createPackages();
                break;
                
            case 'duplicate':
                $this->duplicatePackage();
                break;
                
            case 'calculate_pricing':
                $this->calculatePricing();
                break;
                
            default:
                throw new Exception('Acción no válida');
        }
    }
    
    /**
     * Obtener paquetes de un servicio
     */
    private function getPackages() {
        $serviceId = $this->validator->validateRequired($_GET['service_id'] ?? '', 'ID de servicio');
        $serviceId = $this->validator->validateInteger($serviceId, 'ID de servicio');
        
        $sql = "SELECT sp.*,
                       CASE 
                           WHEN sp.currency = 'USD' THEN ROUND(sp.price * 1000, 2)
                           ELSE sp.price 
                       END as precio_ars,
                       CASE 
                           WHEN sp.cuotas_disponibles = 1 THEN 'Hasta 12 cuotas sin interés con MercadoPago'
                           ELSE 'Solo contado'
                       END as info_pago,
                       JSON_LENGTH(sp.features) as features_count
                FROM service_packages sp 
                WHERE sp.service_id = ? AND sp.is_active = TRUE
                ORDER BY FIELD(sp.package_type, 'basico', 'completo', 'premium', 'colaborativo')";
        
        $packages = $this->database->query($sql, [$serviceId]);
        
        // Enriquecer con información adicional
        foreach ($packages as &$package) {
            $package['features'] = json_decode($package['features'], true) ?? [];
            $package['precio_formateado'] = $this->formatearPrecio($package['precio_ars']);
            $package['entrega_formateada'] = $this->formatearTiempoEntrega($package['delivery_days']);
        }
        
        $this->sendSuccess([
            'packages' => $packages,
            'total' => count($packages)
        ]);
    }
    
    /**
     * Obtener un paquete específico
     */
    private function getPackage() {
        $packageId = $this->validator->validateRequired($_GET['package_id'] ?? '', 'ID de paquete');
        $packageId = $this->validator->validateInteger($packageId, 'ID de paquete');
        
        $sql = "SELECT sp.*, s.title as service_title, s.user_id,
                       u.username, u.first_name, u.last_name
                FROM service_packages sp
                JOIN services s ON sp.service_id = s.id
                JOIN users u ON s.user_id = u.id
                WHERE sp.id = ? AND sp.is_active = TRUE";
        
        $package = $this->database->queryOne($sql, [$packageId]);
        
        if (!$package) {
            throw new Exception('Paquete no encontrado');
        }
        
        // Enriquecer datos
        $package['features'] = json_decode($package['features'], true) ?? [];
        $package['precio_formateado'] = $this->formatearPrecio($package['price']);
        
        $this->sendSuccess(['package' => $package]);
    }
    
    /**
     * Crear paquetes para un servicio
     */
    private function createPackages() {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $serviceId = $this->validator->validateRequired($input['service_id'] ?? '', 'ID de servicio');
        $packages = $this->validator->validateRequired($input['packages'] ?? [], 'Paquetes');
        
        if (!is_array($packages) || empty($packages)) {
            throw new Exception('Debe proporcionar al menos un paquete');
        }
        
        try {
            $this->database->beginTransaction();
            
            // Validar que el usuario puede modificar este servicio
            $this->validarPermisoServicio($serviceId);
            
            // Eliminar paquetes existentes
            $this->database->query(
                "UPDATE service_packages SET is_active = FALSE WHERE service_id = ?",
                [$serviceId]
            );
            
            $packageIds = [];
            
            foreach ($packages as $packageData) {
                $packageId = $this->crearPaquete($serviceId, $packageData);
                $packageIds[] = $packageId;
            }
            
            $this->database->commit();
            
            $this->sendSuccess([
                'message' => 'Paquetes creados exitosamente',
                'package_ids' => $packageIds
            ]);
            
        } catch (Exception $e) {
            $this->database->rollback();
            throw $e;
        }
    }
    
    /**
     * Calcular pricing argentino
     */
    private function calculatePricing() {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $basePrice = $this->validator->validateRequired($input['base_price'] ?? '', 'Precio base');
        $currency = $input['currency'] ?? 'ARS';
        $cuotas = $input['cuotas'] ?? false;
        
        $pricing = [
            'basico' => [
                'price' => $basePrice,
                'multiplier' => 1.0,
                'description' => 'Versión esencial del servicio'
            ],
            'completo' => [
                'price' => $basePrice * 2.5,
                'multiplier' => 2.5,
                'description' => 'Versión completa con extras'
            ],
            'premium' => [
                'price' => $basePrice * 4.0,
                'multiplier' => 4.0,
                'description' => 'Máximo valor y atención personalizada'
            ],
            'colaborativo' => [
                'price' => $basePrice * 3.0,
                'multiplier' => 3.0,
                'description' => 'Incluye videollamadas y seguimiento'
            ]
        ];
        
        // Aplicar conversión si es necesario
        if ($currency === 'USD') {
            foreach ($pricing as &$tier) {
                $tier['price_ars'] = $tier['price'] * 1000;
                $tier['price_usd'] = $tier['price'];
            }
        }
        
        // Calcular cuotas si está habilitado
        if ($cuotas) {
            foreach ($pricing as &$tier) {
                $precioArs = $currency === 'USD' ? $tier['price'] * 1000 : $tier['price'];
                $tier['cuotas'] = $this->calcularCuotas($precioArs);
            }
        }
        
        $this->sendSuccess([
            'pricing' => $pricing,
            'currency' => $currency,
            'cuotas_disponibles' => $cuotas
        ]);
    }
    
    /**
     * Crear un paquete individual
     */
    private function crearPaquete($serviceId, $data) {
        // Validaciones
        $packageType = $this->validator->validateRequired($data['type'] ?? '', 'Tipo de paquete');
        $name = $this->validator->validateRequired($data['name'] ?? '', 'Nombre del paquete');
        $price = $this->validator->validateRequired($data['price'] ?? '', 'Precio');
        $deliveryDays = $this->validator->validateRequired($data['delivery_days'] ?? '', 'Días de entrega');
        
        // Validar tipo de paquete
        $tiposValidos = ['basico', 'completo', 'premium', 'colaborativo'];
        if (!in_array($packageType, $tiposValidos)) {
            throw new Exception('Tipo de paquete no válido');
        }
        
        // Validar precio
        if (!is_numeric($price) || $price <= 0) {
            throw new Exception('Precio debe ser un número positivo');
        }
        
        $sql = "INSERT INTO service_packages 
               (service_id, package_type, name, description, price, currency,
                delivery_days, revisions_included, videollamadas_included,
                features, cuotas_disponibles)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $params = [
            $serviceId,
            $packageType,
            $name,
            $data['description'] ?? '',
            $price,
            $data['currency'] ?? 'ARS',
            $deliveryDays,
            $data['revisions'] ?? 1,
            $data['videollamadas'] ?? 0,
            json_encode($data['features'] ?? []),
            $data['cuotas'] ?? false
        ];
        
        $this->database->query($sql, $params);
        return $this->database->getLastInsertId();
    }
    
    /**
     * Validar que el usuario puede modificar el servicio
     */
    private function validarPermisoServicio($serviceId) {
        $userId = $this->security->getCurrentUserId();
        
        if (!$userId) {
            throw new Exception('Usuario no autenticado');
        }
        
        $sql = "SELECT user_id FROM services WHERE id = ?";
        $service = $this->database->queryOne($sql, [$serviceId]);
        
        if (!$service) {
            throw new Exception('Servicio no encontrado');
        }
        
        if ($service['user_id'] != $userId) {
            throw new Exception('No tiene permisos para modificar este servicio');
        }
    }
    
    /**
     * Formatear precio argentino
     */
    private function formatearPrecio($precio) {
        return 'AR$ ' . number_format($precio, 0, ',', '.');
    }
    
    /**
     * Formatear tiempo de entrega
     */
    private function formatearTiempoEntrega($dias) {
        if ($dias == 1) {
            return '1 día';
        } else {
            return $dias . ' días';
        }
    }
    
    /**
     * Calcular cuotas MercadoPago
     */
    private function calcularCuotas($precio) {
        $cuotas = [];
        
        // Cuotas sin interés típicas de MercadoPago
        $opcionesCuotas = [3, 6, 12];
        
        foreach ($opcionesCuotas as $cantidad) {
            $cuotas[] = [
                'cantidad' => $cantidad,
                'valor_cuota' => round($precio / $cantidad, 2),
                'total' => $precio,
                'interes' => 0
            ];
        }
        
        return $cuotas;
    }
    
    /**
     * Enviar respuesta exitosa
     */
    private function sendSuccess($data) {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => $data,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        exit;
    }
    
    /**
     * Enviar error
     */
    private function sendError($message, $code = 400) {
        http_response_code($code);
        echo json_encode([
            'success' => false,
            'error' => $message,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        exit;
    }
}

// Inicializar controller
if ($_SERVER['REQUEST_METHOD'] !== 'OPTIONS') {
    $controller = new ServicePackageController();
    $controller->handleRequest();
}