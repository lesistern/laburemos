<?php
/**
 * TrustSignalEngine - Motor de Trust Signals Argentinos
 * 
 * Sistema de verificación y scoring específico para Argentina:
 * - Verificación AFIP (monotributo)
 * - Verificación universidades argentinas
 * - Verificación cámaras de comercio
 * - Sistema de referencias locales
 * - Scoring multi-algoritmo
 * 
 * @author LaburAR Team
 * @version 1.0
 * @since 2025-07-19
 */

require_once 'Database.php';
require_once 'SecurityHelper.php';
require_once 'ValidationHelper.php';

class TrustSignalEngine {
    
    private $database;
    private $security;
    private $validator;
    
    // Configuración de scoring
    private const SCORES = [
        'monotributo' => 25,
        'camara_comercio' => 20,
        'universidad' => 15,
        'referencias_locales' => 10,
        'identidad_verificada' => 5
    ];
    
    // Configuración de badges
    private const BADGE_COLORS = [
        'monotributo' => '#28a745',
        'camara_comercio' => '#007bff',
        'universidad' => '#6f42c1',
        'referencias_locales' => '#fd7e14',
        'identidad_verificada' => '#17a2b8'
    ];
    
    // APIs externas (simuladas para desarrollo)
    private const AFIP_API_URL = 'https://api.afip.gob.ar/v1/monotributo/';
    private const UNIVERSIDADES_ARGENTINAS = [
        'Universidad de Buenos Aires',
        'Universidad Católica Argentina',
        'Universidad de Córdoba',
        'Universidad Tecnológica Nacional',
        'Universidad del Salvador',
        'Universidad Austral',
        'Universidad de San Andrés'
    ];
    
    public function __construct() {
        $this->database = Database::getInstance();
        $this->security = new SecurityHelper();
        $this->validator = new ValidationHelper();
    }
    
    /**
     * Verificar monotributo con AFIP
     * 
     * @param int $userId ID del usuario
     * @param string $cuit CUIT del usuario
     * @param string $documentPath Ruta del documento
     * @return array Resultado de la verificación
     */
    public function verificarMonotributo($userId, $cuit, $documentPath = null) {
        try {
            // Validaciones iniciales
            $this->validarUsuario($userId);
            $cuit = $this->validarCUIT($cuit);
            
            // Verificar si ya tiene verificación activa
            if ($this->tieneVerificacionActiva($userId, 'monotributo')) {
                throw new Exception('Usuario ya tiene verificación de monotributo activa');
            }
            
            // Simular consulta a AFIP API
            $afipResponse = $this->consultarAFIP($cuit);
            
            $verified = false;
            $metadata = [
                'cuit' => $cuit,
                'consulta_afip' => $afipResponse,
                'documento_adjunto' => $documentPath,
                'fecha_consulta' => date('Y-m-d H:i:s')
            ];
            
            // Determinar si está verificado
            if ($afipResponse['activo'] && $afipResponse['categoria'] === 'monotributo') {
                $verified = true;
                $metadata['categoria_afip'] = $afipResponse['categoria'];
                $metadata['fecha_alta'] = $afipResponse['fecha_alta'];
            }
            
            // Guardar verificación
            $verificationId = $this->guardarVerificacion([
                'user_id' => $userId,
                'signal_type' => 'monotributo',
                'verified' => $verified,
                'verification_method' => 'api_afip',
                'metadata' => json_encode($metadata),
                'expiry_date' => date('Y-m-d H:i:s', strtotime('+1 year'))
            ]);
            
            return [
                'success' => true,
                'verified' => $verified,
                'verification_id' => $verificationId,
                'message' => $verified ? 'Monotributo verificado exitosamente' : 'No se pudo verificar monotributo',
                'badge' => $verified ? $this->generarBadge('monotributo') : null
            ];
            
        } catch (Exception $e) {
            throw $e;
        }
    }
    
    /**
     * Verificar universidad argentina
     * 
     * @param int $userId ID del usuario
     * @param string $universidad Nombre de la universidad
     * @param string $carrera Carrera estudiada
     * @param string $documentPath Ruta del documento
     * @return array Resultado de la verificación
     */
    public function verificarUniversidad($userId, $universidad, $carrera, $documentPath) {
        try {
            $this->validarUsuario($userId);
            
            if (empty($documentPath)) {
                throw new Exception('Documento de título universitario requerido');
            }
            
            $universidadValida = false;
            foreach (self::UNIVERSIDADES_ARGENTINAS as $uniValida) {
                if (stripos($universidad, $uniValida) !== false) {
                    $universidadValida = true;
                    break;
                }
            }
            
            if (!$universidadValida) {
                throw new Exception('Universidad no reconocida como argentina');
            }
            
            $metadata = [
                'universidad' => $universidad,
                'carrera' => $carrera,
                'documento_path' => $documentPath,
                'fecha_verificacion' => date('Y-m-d H:i:s'),
                'estado' => 'pendiente_revision_manual'
            ];
            
            // Por ahora, todas las verificaciones universitarias requieren revisión manual
            $verificationId = $this->guardarVerificacion([
                'user_id' => $userId,
                'signal_type' => 'universidad',
                'verified' => false, // Será actualizado por admin
                'verification_method' => 'documento',
                'metadata' => json_encode($metadata)
            ]);
            
            return [
                'success' => true,
                'verification_id' => $verificationId,
                'verified' => false,
                'message' => 'Documento recibido. Verificación pendiente de revisión manual.',
                'estimated_review_time' => '2-3 días hábiles'
            ];
            
        } catch (Exception $e) {
            throw $e;
        }
    }
    
    /**
     * Verificar cámara de comercio
     * 
     * @param int $userId ID del usuario
     * @param string $numeroMatricula Número de matrícula
     * @param string $camara Nombre de la cámara
     * @return array Resultado de la verificación
     */
    public function verificarCamaraComercio($userId, $numeroMatricula, $camara) {
        try {
            $this->validarUsuario($userId);
            
            // Simular consulta a API de Cámara
            $camaraResponse = $this->consultarCamaraComercio($numeroMatricula, $camara);
            
            $verified = $camaraResponse['activo'] && $camaraResponse['al_dia'];
            
            $metadata = [
                'numero_matricula' => $numeroMatricula,
                'camara' => $camara,
                'respuesta_camara' => $camaraResponse,
                'fecha_consulta' => date('Y-m-d H:i:s')
            ];
            
            $verificationId = $this->guardarVerificacion([
                'user_id' => $userId,
                'signal_type' => 'camara_comercio',
                'verified' => $verified,
                'verification_method' => 'automatico',
                'metadata' => json_encode($metadata),
                'expiry_date' => date('Y-m-d H:i:s', strtotime('+6 months'))
            ]);
            
            return [
                'success' => true,
                'verified' => $verified,
                'verification_id' => $verificationId,
                'message' => $verified ? 'Cámara de Comercio verificada' : 'No se pudo verificar membresía',
                'badge' => $verified ? $this->generarBadge('camara_comercio') : null
            ];
            
        } catch (Exception $e) {
            throw $e;
        }
    }
    
    /**
     * Verificar referencias locales
     * 
     * @param int $userId ID del usuario
     * @param array $referencias Array de referencias
     * @return array Resultado de la verificación
     */
    public function verificarReferenciasLocales($userId, $referencias) {
        try {
            $this->validarUsuario($userId);
            
            if (count($referencias) < 3) {
                throw new Exception('Mínimo 3 referencias requeridas');
            }
            
            $referenciasValidadas = 0;
            $referenciasData = [];
            
            foreach ($referencias as $referencia) {
                $resultado = $this->validarReferencia($referencia);
                $referenciasData[] = $resultado;
                
                if ($resultado['validada']) {
                    $referenciasValidadas++;
                }
            }
            
            $verified = $referenciasValidadas >= 3;
            
            $metadata = [
                'total_referencias' => count($referencias),
                'referencias_validadas' => $referenciasValidadas,
                'referencias_data' => $referenciasData,
                'fecha_verificacion' => date('Y-m-d H:i:s')
            ];
            
            $verificationId = $this->guardarVerificacion([
                'user_id' => $userId,
                'signal_type' => 'referencias_locales',
                'verified' => $verified,
                'verification_method' => 'automatico',
                'metadata' => json_encode($metadata)
            ]);
            
            return [
                'success' => true,
                'verified' => $verified,
                'verification_id' => $verificationId,
                'referencias_validadas' => $referenciasValidadas,
                'message' => $verified ? 'Referencias locales verificadas' : 'Insuficientes referencias válidas',
                'badge' => $verified ? $this->generarBadge('referencias_locales') : null
            ];
            
        } catch (Exception $e) {
            throw $e;
        }
    }
    
    /**
     * Calcular trust score completo de un usuario
     * 
     * @param int $userId ID del usuario
     * @return array Score y badges
     */
    public function calcularTrustScore($userId) {
        $signals = $this->getTrustSignals($userId);
        $score = 0;
        $badges = [];
        $breakdown = [];
        
        foreach ($signals as $signal) {
            if (!$signal['verified']) continue;
            
            $signalScore = self::SCORES[$signal['signal_type']] ?? 0;
            $score += $signalScore;
            
            $breakdown[] = [
                'signal_type' => $signal['signal_type'],
                'score' => $signalScore,
                'verified_date' => $signal['verification_date']
            ];
            
            $badges[] = $this->generarBadge($signal['signal_type'], $signal);
        }
        
        // Badge especial Talento Argentino
        if ($score >= 50) {
            $badges[] = [
                'type' => 'talento_argentino',
                'label' => 'Talento Argentino',
                'color' => '#6FBFEF',
                'icon' => 'star',
                'premium' => true,
                'description' => 'Freelancer verificado de excelencia argentina'
            ];
            
            // Actualizar badge en servicios
            $this->actualizarTalentoArgentino($userId, true);
        }
        
        return [
            'user_id' => $userId,
            'total_score' => $score,
            'level' => $this->determinarNivel($score),
            'badges' => $badges,
            'breakdown' => $breakdown,
            'verification_count' => count($signals),
            'last_updated' => date('Y-m-d H:i:s')
        ];
    }
    
    /**
     * Obtener trust signals de un usuario
     * 
     * @param int $userId ID del usuario
     * @return array Trust signals
     */
    public function getTrustSignals($userId) {
        $sql = "SELECT * FROM argentina_trust_signals 
                WHERE user_id = ? AND verified = TRUE
                AND (expiry_date IS NULL OR expiry_date > NOW())
                ORDER BY verification_date DESC";
        
        return $this->database->query($sql, [$userId]);
    }
    
    /**
     * Generar badge visual
     * 
     * @param string $signalType Tipo de signal
     * @param array $signalData Datos del signal
     * @return array Datos del badge
     */
    private function generarBadge($signalType, $signalData = null) {
        $badges = [
            'monotributo' => [
                'type' => 'monotributo_verificado',
                'label' => 'Monotributista Verificado',
                'icon' => 'check-circle',
                'description' => 'Verificado por AFIP como monotributista activo'
            ],
            'camara_comercio' => [
                'type' => 'camara_comercio',
                'label' => 'Cámara de Comercio',
                'icon' => 'building',
                'description' => 'Miembro verificado de Cámara de Comercio'
            ],
            'universidad' => [
                'type' => 'universidad_argentina',
                'label' => 'Universidad Certificada',
                'icon' => 'graduation-cap',
                'description' => 'Título universitario verificado'
            ],
            'referencias_locales' => [
                'type' => 'referencias_verificadas',
                'label' => 'Referencias Verificadas',
                'icon' => 'users',
                'description' => 'Referencias locales validadas'
            ],
            'identidad_verificada' => [
                'type' => 'identidad_verificada',
                'label' => 'Identidad Verificada',
                'icon' => 'id-card',
                'description' => 'Identidad verificada con documento'
            ]
        ];
        
        $badge = $badges[$signalType] ?? null;
        
        if ($badge) {
            $badge['color'] = self::BADGE_COLORS[$signalType];
            $badge['verified_date'] = $signalData['verification_date'] ?? date('Y-m-d H:i:s');
        }
        
        return $badge;
    }
    
    /**
     * Validar CUIT argentino
     * 
     * @param string $cuit CUIT a validar
     * @return string CUIT limpio
     */
    private function validarCUIT($cuit) {
        // Limpiar CUIT
        $cuit = preg_replace('/[^0-9]/', '', $cuit);
        
        if (strlen($cuit) !== 11) {
            throw new Exception('CUIT debe tener 11 dígitos');
        }
        
        // Validar dígito verificador
        if (!$this->validarDigitoVerificadorCUIT($cuit)) {
            throw new Exception('CUIT inválido - dígito verificador incorrecto');
        }
        
        return $cuit;
    }
    
    /**
     * Validar dígito verificador de CUIT
     * 
     * @param string $cuit CUIT de 11 dígitos
     * @return bool Es válido
     */
    private function validarDigitoVerificadorCUIT($cuit) {
        $multiplicadores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
        $suma = 0;
        
        for ($i = 0; $i < 10; $i++) {
            $suma += intval($cuit[$i]) * $multiplicadores[$i];
        }
        
        $resto = $suma % 11;
        $digitoVerificador = $resto < 2 ? $resto : 11 - $resto;
        
        return intval($cuit[10]) === $digitoVerificador;
    }
    
    /**
     * Simular consulta a AFIP
     * 
     * @param string $cuit CUIT a consultar
     * @return array Respuesta simulada
     */
    private function consultarAFIP($cuit) {
        // Simulación para desarrollo
        // En producción sería una consulta real a AFIP
        
        $respuestas = [
            '20123456789' => [
                'activo' => true,
                'categoria' => 'monotributo',
                'fecha_alta' => '2020-01-15',
                'actividades' => ['Desarrollo de software']
            ],
            '27987654321' => [
                'activo' => true,
                'categoria' => 'responsable_inscripto',
                'fecha_alta' => '2018-06-20',
                'actividades' => ['Consultoría']
            ]
        ];
        
        return $respuestas[$cuit] ?? [
            'activo' => false,
            'categoria' => null,
            'error' => 'CUIT no encontrado en AFIP'
        ];
    }
    
    /**
     * Simular consulta a Cámara de Comercio
     * 
     * @param string $matricula Número de matrícula
     * @param string $camara Nombre de la cámara
     * @return array Respuesta simulada
     */
    private function consultarCamaraComercio($matricula, $camara) {
        // Simulación para desarrollo
        return [
            'activo' => true,
            'al_dia' => true,
            'fecha_afiliacion' => '2019-03-10',
            'categoria' => 'Socio Activo'
        ];
    }
    
    /**
     * Validar una referencia individual
     * 
     * @param array $referencia Datos de la referencia
     * @return array Resultado de validación
     */
    private function validarReferencia($referencia) {
        $email = $referencia['email'] ?? '';
        $telefono = $referencia['telefono'] ?? '';
        $nombre = $referencia['nombre'] ?? '';
        
        // Validaciones básicas
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return ['validada' => false, 'error' => 'Email inválido'];
        }
        
        if (strlen($nombre) < 3) {
            return ['validada' => false, 'error' => 'Nombre muy corto'];
        }
        
        // Simular validación (en producción sería email/SMS real)
        $validada = true;
        
        return [
            'validada' => $validada,
            'nombre' => $nombre,
            'email' => $email,
            'telefono' => $telefono,
            'fecha_validacion' => date('Y-m-d H:i:s')
        ];
    }
    
    /**
     * Guardar verificación en base de datos
     * 
     * @param array $data Datos de la verificación
     * @return int ID de verificación
     */
    private function guardarVerificacion($data) {
        $sql = "INSERT INTO argentina_trust_signals 
               (user_id, signal_type, verified, verification_date, 
                expiry_date, verification_method, metadata, verifier_user_id)
               VALUES (?, ?, ?, NOW(), ?, ?, ?, ?)";
        
        $params = [
            $data['user_id'],
            $data['signal_type'],
            $data['verified'],
            $data['expiry_date'] ?? null,
            $data['verification_method'],
            $data['metadata'],
            $data['verifier_user_id'] ?? null
        ];
        
        $this->database->query($sql, $params);
        return $this->database->getLastInsertId();
    }
    
    /**
     * Validar que el usuario existe
     * 
     * @param int $userId ID del usuario
     * @throws Exception Si el usuario no existe
     */
    private function validarUsuario($userId) {
        $sql = "SELECT id FROM users WHERE id = ?";
        $user = $this->database->queryOne($sql, [$userId]);
        
        if (!$user) {
            throw new Exception('Usuario no encontrado');
        }
    }
    
    /**
     * Verificar si tiene verificación activa
     * 
     * @param int $userId ID del usuario
     * @param string $signalType Tipo de signal
     * @return bool Tiene verificación activa
     */
    private function tieneVerificacionActiva($userId, $signalType) {
        $sql = "SELECT id FROM argentina_trust_signals 
                WHERE user_id = ? AND signal_type = ? AND verified = TRUE
                AND (expiry_date IS NULL OR expiry_date > NOW())";
        
        $result = $this->database->queryOne($sql, [$userId, $signalType]);
        return !empty($result);
    }
    
    /**
     * Determinar nivel basado en score
     * 
     * @param int $score Score total
     * @return string Nivel
     */
    private function determinarNivel($score) {
        if ($score >= 70) return 'elite';
        if ($score >= 50) return 'pro';
        if ($score >= 30) return 'verified';
        return 'basic';
    }
    
    /**
     * Actualizar badge Talento Argentino en servicios
     * 
     * @param int $userId ID del usuario
     * @param bool $enabled Activar badge
     */
    private function actualizarTalentoArgentino($userId, $enabled) {
        $sql = "UPDATE services SET talento_argentino_badge = ? WHERE user_id = ?";
        $this->database->query($sql, [$enabled, $userId]);
    }
}