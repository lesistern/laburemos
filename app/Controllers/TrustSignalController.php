<?php
/**
 * TrustSignalController - API para gestión de Trust Signals
 * 
 * Endpoints:
 * - POST /verify/monotributo - Verificar monotributo
 * - POST /verify/universidad - Verificar universidad  
 * - POST /verify/camara - Verificar cámara de comercio
 * - POST /verify/referencias - Verificar referencias
 * - GET /trust-score/:userId - Obtener trust score
 * - GET /badges/:userId - Obtener badges
 * 
 * @author LaburAR Team
 * @version 1.0
 */

require_once '../includes/Database.php';
require_once '../includes/SecurityHelper.php';
require_once '../includes/ValidationHelper.php';
require_once '../includes/TrustSignalEngine.php';

class TrustSignalController {
    
    private $database;
    private $security;
    private $validator;
    private $trustEngine;
    
    public function __construct() {
        $this->database = Database::getInstance();
        $this->security = new SecurityHelper();
        $this->validator = new ValidationHelper();
        $this->trustEngine = new TrustSignalEngine();
        
        // Headers CORS
        header('Content-Type: application/json; charset=utf-8');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token');
    }
    
    /**
     * Manejar request principal
     */
    public function handleRequest() {
        try {
            // Rate limiting para verificaciones
            $this->aplicarRateLimiting();
            
            // Validar CSRF para operaciones de modificación
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
            case 'trust-score':
                $this->getTrustScore();
                break;
                
            case 'badges':
                $this->getBadges();
                break;
                
            case 'signals':
                $this->getTrustSignals();
                break;
                
            case 'verification-status':
                $this->getVerificationStatus();
                break;
                
            case 'admin-stats':
                $this->getAdminStats();
                break;
                
            case 'admin-verifications':
                $this->getAdminVerifications();
                break;
                
            case 'admin-verification-detail':
                $this->getAdminVerificationDetail();
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
            case 'verify-monotributo':
                $this->verifyMonotributo();
                break;
                
            case 'verify-universidad':
                $this->verifyUniversidad();
                break;
                
            case 'verify-camara':
                $this->verifyCamara();
                break;
                
            case 'verify-referencias':
                $this->verifyReferencias();
                break;
                
            case 'admin-approve':
                $this->adminApprove();
                break;
                
            default:
                throw new Exception('Acción no válida');
        }
    }
    
    /**
     * Verificar monotributo
     */
    private function verifyMonotributo() {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $userId = $this->security->getCurrentUserId();
        if (!$userId) {
            throw new Exception('Usuario no autenticado');
        }
        
        $cuit = $this->validator->validateRequired($input['cuit'] ?? '', 'CUIT');
        $documentPath = $input['document_path'] ?? null;
        
        $resultado = $this->trustEngine->verificarMonotributo($userId, $cuit, $documentPath);
        
        $this->sendSuccess($resultado);
    }
    
    /**
     * Verificar universidad
     */
    private function verifyUniversidad() {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $userId = $this->security->getCurrentUserId();
        if (!$userId) {
            throw new Exception('Usuario no autenticado');
        }
        
        $universidad = $this->validator->validateRequired($input['universidad'] ?? '', 'Universidad');
        $carrera = $this->validator->validateRequired($input['carrera'] ?? '', 'Carrera');
        $documentPath = $this->validator->validateRequired($input['document_path'] ?? '', 'Documento');
        
        $resultado = $this->trustEngine->verificarUniversidad($userId, $universidad, $carrera, $documentPath);
        
        $this->sendSuccess($resultado);
    }
    
    /**
     * Verificar cámara de comercio
     */
    private function verifyCamara() {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $userId = $this->security->getCurrentUserId();
        if (!$userId) {
            throw new Exception('Usuario no autenticado');
        }
        
        $matricula = $this->validator->validateRequired($input['matricula'] ?? '', 'Matrícula');
        $camara = $this->validator->validateRequired($input['camara'] ?? '', 'Cámara');
        
        $resultado = $this->trustEngine->verificarCamaraComercio($userId, $matricula, $camara);
        
        $this->sendSuccess($resultado);
    }
    
    /**
     * Verificar referencias locales
     */
    private function verifyReferencias() {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $userId = $this->security->getCurrentUserId();
        if (!$userId) {
            throw new Exception('Usuario no autenticado');
        }
        
        $referencias = $this->validator->validateRequired($input['referencias'] ?? [], 'Referencias');
        
        if (!is_array($referencias) || count($referencias) < 3) {
            throw new Exception('Mínimo 3 referencias requeridas');
        }
        
        $resultado = $this->trustEngine->verificarReferenciasLocales($userId, $referencias);
        
        $this->sendSuccess($resultado);
    }
    
    /**
     * Obtener trust score de usuario
     */
    private function getTrustScore() {
        $userId = $_GET['user_id'] ?? null;
        
        if (!$userId) {
            $userId = $this->security->getCurrentUserId();
        }
        
        if (!$userId) {
            throw new Exception('ID de usuario requerido');
        }
        
        $trustScore = $this->trustEngine->calcularTrustScore($userId);
        
        $this->sendSuccess(['trust_score' => $trustScore]);
    }
    
    /**
     * Obtener badges de usuario
     */
    private function getBadges() {
        $userId = $_GET['user_id'] ?? null;
        
        if (!$userId) {
            $userId = $this->security->getCurrentUserId();
        }
        
        if (!$userId) {
            throw new Exception('ID de usuario requerido');
        }
        
        $trustScore = $this->trustEngine->calcularTrustScore($userId);
        
        $this->sendSuccess([
            'badges' => $trustScore['badges'],
            'total_score' => $trustScore['total_score'],
            'level' => $trustScore['level']
        ]);
    }
    
    /**
     * Obtener trust signals
     */
    private function getTrustSignals() {
        $userId = $_GET['user_id'] ?? null;
        
        if (!$userId) {
            $userId = $this->security->getCurrentUserId();
        }
        
        if (!$userId) {
            throw new Exception('ID de usuario requerido');
        }
        
        $signals = $this->trustEngine->getTrustSignals($userId);
        
        $this->sendSuccess(['trust_signals' => $signals]);
    }
    
    /**
     * Obtener estado de verificaciones
     */
    private function getVerificationStatus() {
        $userId = $this->security->getCurrentUserId();
        if (!$userId) {
            throw new Exception('Usuario no autenticado');
        }
        
        $sql = "SELECT signal_type, verified, verification_date, expiry_date,
                       CASE 
                           WHEN expiry_date IS NOT NULL AND expiry_date < NOW() THEN 'expired'
                           WHEN verified = 1 THEN 'verified'
                           ELSE 'pending'
                       END as status
                FROM argentina_trust_signals 
                WHERE user_id = ?
                ORDER BY verification_date DESC";
        
        $verifications = $this->database->query($sql, [$userId]);
        
        $status = [
            'monotributo' => 'not_started',
            'universidad' => 'not_started',
            'camara_comercio' => 'not_started',
            'referencias_locales' => 'not_started'
        ];
        
        foreach ($verifications as $verification) {
            $status[$verification['signal_type']] = $verification['status'];
        }
        
        $this->sendSuccess(['verification_status' => $status]);
    }
    
    /**
     * Obtener estadísticas para admin
     */
    private function getAdminStats() {
        if (!$this->security->isAdmin()) {
            throw new Exception('Permisos insuficientes');
        }
        
        $stats = [];
        
        // Verificaciones aprobadas
        $sql = "SELECT COUNT(*) as count FROM argentina_trust_signals WHERE verified = 1";
        $result = $this->database->queryOne($sql);
        $stats['aprobadas'] = $result['count'];
        
        // Verificaciones pendientes
        $sql = "SELECT COUNT(*) as count FROM argentina_trust_signals WHERE verified = 0";
        $result = $this->database->queryOne($sql);
        $stats['pendientes'] = $result['count'];
        
        // Talentos Argentinos
        $sql = "SELECT COUNT(*) as count FROM services WHERE talento_argentino_badge = 1";
        $result = $this->database->queryOne($sql);
        $stats['talentos_argentinos'] = $result['count'];
        
        // Score promedio
        $sql = "SELECT AVG(trust_score) as avg_score FROM (
                    SELECT user_id, COUNT(*) * 20 as trust_score 
                    FROM argentina_trust_signals 
                    WHERE verified = 1 
                    GROUP BY user_id
                ) as scores";
        $result = $this->database->queryOne($sql);
        $stats['score_promedio'] = $result['avg_score'] ?? 0;
        
        $this->sendSuccess($stats);
    }
    
    /**
     * Obtener verificaciones para admin
     */
    private function getAdminVerifications() {
        if (!$this->security->isAdmin()) {
            throw new Exception('Permisos insuficientes');
        }
        
        $page = $_GET['page'] ?? 1;
        $limit = $_GET['limit'] ?? 20;
        $offset = ($page - 1) * $limit;
        
        $whereConditions = [];
        $params = [];
        
        // Filtros
        if (!empty($_GET['tipo'])) {
            $whereConditions[] = "ats.signal_type = ?";
            $params[] = $_GET['tipo'];
        }
        
        if (!empty($_GET['estado'])) {
            switch ($_GET['estado']) {
                case 'pending':
                    $whereConditions[] = "ats.verified = 0";
                    break;
                case 'verified':
                    $whereConditions[] = "ats.verified = 1";
                    break;
            }
        }
        
        $whereClause = empty($whereConditions) ? '' : 'WHERE ' . implode(' AND ', $whereConditions);
        
        $sql = "SELECT ats.*, u.username, u.email, u.avatar_url,
                       CASE 
                           WHEN ats.verified = 1 THEN 'verified'
                           WHEN ats.verified = 0 THEN 'pending'
                           ELSE 'unknown'
                       END as status,
                       CASE 
                           WHEN ats.metadata IS NOT NULL THEN 1
                           ELSE 0
                       END as has_documents
                FROM argentina_trust_signals ats
                JOIN users u ON ats.user_id = u.id
                $whereClause
                ORDER BY ats.created_at DESC
                LIMIT ? OFFSET ?";
        
        $params[] = $limit;
        $params[] = $offset;
        
        $verifications = $this->database->query($sql, $params);
        
        // Contar total para paginación
        $countSql = "SELECT COUNT(*) as total 
                     FROM argentina_trust_signals ats 
                     JOIN users u ON ats.user_id = u.id 
                     $whereClause";
        $countParams = array_slice($params, 0, -2); // Remover limit y offset
        $totalResult = $this->database->queryOne($countSql, $countParams);
        $total = $totalResult['total'];
        
        $this->sendSuccess([
            'verifications' => $verifications,
            'pagination' => [
                'current_page' => (int)$page,
                'total_pages' => ceil($total / $limit),
                'total_items' => (int)$total,
                'items_per_page' => (int)$limit
            ]
        ]);
    }
    
    /**
     * Obtener detalle de verificación para admin
     */
    private function getAdminVerificationDetail() {
        if (!$this->security->isAdmin()) {
            throw new Exception('Permisos insuficientes');
        }
        
        $verificationId = $_GET['id'] ?? null;
        if (!$verificationId) {
            throw new Exception('ID de verificación requerido');
        }
        
        $sql = "SELECT ats.*, u.username, u.email, u.avatar_url
                FROM argentina_trust_signals ats
                JOIN users u ON ats.user_id = u.id
                WHERE ats.id = ?";
        
        $verification = $this->database->queryOne($sql, [$verificationId]);
        
        if (!$verification) {
            throw new Exception('Verificación no encontrada');
        }
        
        // Procesar metadata para extraer documentos
        $metadata = json_decode($verification['metadata'], true) ?? [];
        $documents = [];
        
        if (isset($metadata['documento_path'])) {
            $documents[] = [
                'name' => basename($metadata['documento_path']),
                'url' => $metadata['documento_path'],
                'size' => file_exists($metadata['documento_path']) ? filesize($metadata['documento_path']) : 0
            ];
        }
        
        $verification['documents'] = $documents;
        
        $this->sendSuccess(['verification' => $verification]);
    }
    
    /**
     * Aprobar verificación (solo admins)
     */
    private function adminApprove() {
        // Verificar permisos de admin
        if (!$this->security->isAdmin()) {
            throw new Exception('Permisos insuficientes');
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        $verificationId = $this->validator->validateRequired($input['verification_id'] ?? '', 'ID de verificación');
        $approved = $this->validator->validateRequired($input['approved'] ?? '', 'Aprobación');
        $comments = $input['comments'] ?? '';
        
        $sql = "UPDATE argentina_trust_signals 
                SET verified = ?, verifier_user_id = ?, 
                    verification_date = NOW(),
                    metadata = JSON_SET(
                        COALESCE(metadata, '{}'), 
                        '$.admin_comments', ?,
                        '$.admin_review_date', NOW()
                    )
                WHERE id = ?";
        
        $adminUserId = $this->security->getCurrentUserId();
        
        $this->database->query($sql, [
            $approved ? 1 : 0,
            $adminUserId,
            $comments,
            $verificationId
        ]);
        
        $this->sendSuccess([
            'message' => 'Verificación actualizada',
            'approved' => $approved
        ]);
    }
    
    /**
     * Aplicar rate limiting
     */
    private function aplicarRateLimiting() {
        $action = $_GET['action'] ?? '';
        
        // Rate limiting más estricto para verificaciones
        $verificacionActions = ['verify-monotributo', 'verify-universidad', 'verify-camara', 'verify-referencias'];
        
        if (in_array($action, $verificacionActions)) {
            $clientId = $_SERVER['REMOTE_ADDR'];
            
            // Implementar rate limiting simple basado en sesión
            $sessionKey = 'rate_limit_' . $action;
            $now = time();
            $window = 3600; // 1 hora
            $limit = 5; // 5 verificaciones por hora
            
            if (!isset($_SESSION[$sessionKey])) {
                $_SESSION[$sessionKey] = [];
            }
            
            // Limpiar requests antiguos
            $_SESSION[$sessionKey] = array_filter($_SESSION[$sessionKey], function($timestamp) use ($now, $window) {
                return ($now - $timestamp) < $window;
            });
            
            // Verificar límite
            if (count($_SESSION[$sessionKey]) >= $limit) {
                throw new Exception('Límite de verificaciones excedido. Intente más tarde.');
            }
            
            // Registrar request actual
            $_SESSION[$sessionKey][] = $now;
        }
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
    $controller = new TrustSignalController();
    $controller->handleRequest();
}