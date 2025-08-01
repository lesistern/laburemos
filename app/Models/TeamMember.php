<?php
/**
 * TeamMember Model - Gestión del equipo técnico y administrativo
 * Modelo especializado para miembros del equipo LaburAR
 * 
 * @package LaburAR
 * @version 2.0
 * @author Claude Code
 */

namespace LaburAR\Models;

class TeamMember {
    private $db;
    
    // Constantes para departamentos
    const DEPARTMENTS = [
        'development' => 'Desarrollo',
        'design' => 'Diseño',
        'qa_testing' => 'QA y Testing',
        'devops' => 'DevOps',
        'marketing' => 'Marketing',
        'sales' => 'Ventas',
        'support' => 'Soporte',
        'management' => 'Gestión',
        'executive' => 'Ejecutivo',
        'operations' => 'Operaciones',
        'security' => 'Seguridad',
        'data_analytics' => 'Análisis de Datos'
    ];
    
    // Constantes para niveles de rol
    const ROLE_LEVELS = [
        'junior' => 'Junior',
        'mid' => 'Mid-level',
        'senior' => 'Senior',
        'lead' => 'Lead',
        'manager' => 'Manager',
        'director' => 'Director',
        'ceo' => 'CEO'
    ];
    
    // Constantes para niveles de acceso
    const ACCESS_LEVELS = [
        'basic' => 'Básico',
        'advanced' => 'Avanzado',
        'admin' => 'Administrador',
        'super_admin' => 'Super Administrador'
    ];
    
    public function __construct($database) {
        $this->db = $database;
    }
    
    /**
     * Obtener miembro del equipo por ID de usuario
     */
    public function getByUserId($userId) {
        $conn = $this->db->getConnection();
        
        $stmt = $conn->prepare("
            SELECT 
                tm.*,
                u.first_name,
                u.last_name,
                u.email,
                u.profile_image,
                u.last_login,
                u.created_at as user_created_at
            FROM team_members tm
            INNER JOIN users u ON tm.user_id = u.id
            WHERE tm.user_id = ? AND tm.is_active = TRUE
        ");
        
        $stmt->execute([$userId]);
        return $stmt->fetch(\PDO::FETCH_ASSOC);
    }
    
    /**
     * Obtener miembro del equipo por employee_id
     */
    public function getByEmployeeId($employeeId) {
        $conn = $this->db->getConnection();
        
        $stmt = $conn->prepare("
            SELECT 
                tm.*,
                u.first_name,
                u.last_name,
                u.email,
                u.profile_image
            FROM team_members tm
            INNER JOIN users u ON tm.user_id = u.id
            WHERE tm.employee_id = ? AND tm.is_active = TRUE
        ");
        
        $stmt->execute([$employeeId]);
        return $stmt->fetch(\PDO::FETCH_ASSOC);
    }
    
    /**
     * Obtener todos los miembros por departamento
     */
    public function getByDepartment($department) {
        $conn = $this->db->getConnection();
        
        $stmt = $conn->prepare("
            SELECT 
                tm.*,
                u.first_name,
                u.last_name,
                u.email,
                u.profile_image,
                u.last_login
            FROM team_members tm
            INNER JOIN users u ON tm.user_id = u.id
            WHERE tm.department = ? AND tm.is_active = TRUE
            ORDER BY tm.role_level DESC, u.first_name ASC
        ");
        
        $stmt->execute([$department]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
    
    /**
     * Obtener miembros por nivel de acceso
     */
    public function getByAccessLevel($accessLevel) {
        $conn = $this->db->getConnection();
        
        $stmt = $conn->prepare("
            SELECT 
                tm.*,
                u.first_name,
                u.last_name,
                u.email,
                u.department
            FROM team_members tm
            INNER JOIN users u ON tm.user_id = u.id
            WHERE tm.access_level = ? AND tm.is_active = TRUE
            ORDER BY tm.department, u.first_name
        ");
        
        $stmt->execute([$accessLevel]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
    
    /**
     * Crear nuevo miembro del equipo
     */
    public function create($data) {
        $conn = $this->db->getConnection();
        
        try {
            $conn->beginTransaction();
            
            // Generar employee_id único
            $employeeId = $this->generateEmployeeId();
            
            $stmt = $conn->prepare("
                INSERT INTO team_members (
                    user_id, employee_id, department, position, role_level,
                    access_level, permissions, hire_date, employment_type,
                    work_location, office_location, emergency_contact_name,
                    emergency_contact_phone, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ");
            
            $result = $stmt->execute([
                $data['user_id'],
                $employeeId,
                $data['department'],
                $data['position'],
                $data['role_level'] ?? 'junior',
                $data['access_level'] ?? 'basic',
                json_encode($data['permissions'] ?? []),
                $data['hire_date'] ?? date('Y-m-d'),
                $data['employment_type'] ?? 'full_time',
                $data['work_location'] ?? 'remote',
                $data['office_location'] ?? null,
                $data['emergency_contact_name'] ?? null,
                $data['emergency_contact_phone'] ?? null
            ]);
            
            if ($result) {
                // Actualizar usuario para marcarlo como team
                $stmt = $conn->prepare("
                    UPDATE users SET 
                        user_category = 'team',
                        is_client = FALSE,
                        is_freelancer = FALSE,
                        updated_at = NOW()
                    WHERE id = ?
                ");
                $stmt->execute([$data['user_id']]);
                
                $conn->commit();
                return $employeeId;
            }
            
            $conn->rollback();
            return false;
            
        } catch (\Exception $e) {
            $conn->rollback();
            throw $e;
        }
    }
    
    /**
     * Actualizar miembro del equipo
     */
    public function update($userId, $data) {
        $conn = $this->db->getConnection();
        
        $setClauses = [];
        $params = [];
        
        $allowedFields = [
            'department', 'position', 'role_level', 'access_level', 
            'permissions', 'employment_type', 'work_location', 
            'office_location', 'emergency_contact_name', 'emergency_contact_phone'
        ];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $setClauses[] = "$field = ?";
                if ($field === 'permissions') {
                    $params[] = json_encode($data[$field]);
                } else {
                    $params[] = $data[$field];
                }
            }
        }
        
        if (empty($setClauses)) {
            return false;
        }
        
        $setClauses[] = "updated_at = NOW()";
        $params[] = $userId;
        
        $sql = "UPDATE team_members SET " . implode(', ', $setClauses) . " WHERE user_id = ?";
        
        $stmt = $conn->prepare($sql);
        return $stmt->execute($params);
    }
    
    /**
     * Desactivar miembro del equipo
     */
    public function deactivate($userId, $reason = null) {
        $conn = $this->db->getConnection();
        
        try {
            $conn->beginTransaction();
            
            // Desactivar team member
            $stmt = $conn->prepare("
                UPDATE team_members SET 
                    is_active = FALSE,
                    can_login = FALSE,
                    updated_at = NOW()
                WHERE user_id = ?
            ");
            $stmt->execute([$userId]);
            
            // Opcional: registrar razón en historial
            if ($reason) {
                $stmt = $conn->prepare("
                    INSERT INTO user_role_history (
                        user_id, new_roles, change_reason, change_date
                    ) VALUES (?, ?, ?, NOW())
                ");
                $stmt->execute([
                    $userId,
                    json_encode(['status' => 'deactivated']),
                    $reason
                ]);
            }
            
            $conn->commit();
            return true;
            
        } catch (\Exception $e) {
            $conn->rollback();
            throw $e;
        }
    }
    
    /**
     * Verificar si el usuario tiene un permiso específico
     */
    public function hasPermission($userId, $permission) {
        $conn = $this->db->getConnection();
        
        $stmt = $conn->prepare("
            SELECT permissions, access_level
            FROM team_members
            WHERE user_id = ? AND is_active = TRUE
        ");
        
        $stmt->execute([$userId]);
        $member = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$member) {
            return false;
        }
        
        // Super admin tiene todos los permisos
        if ($member['access_level'] === 'super_admin') {
            return true;
        }
        
        $permissions = json_decode($member['permissions'], true) ?? [];
        return in_array($permission, $permissions);
    }
    
    /**
     * Agregar permiso a miembro del equipo
     */
    public function addPermission($userId, $permission) {
        $conn = $this->db->getConnection();
        
        $stmt = $conn->prepare("
            SELECT permissions FROM team_members WHERE user_id = ?
        ");
        $stmt->execute([$userId]);
        $result = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$result) {
            return false;
        }
        
        $permissions = json_decode($result['permissions'], true) ?? [];
        
        if (!in_array($permission, $permissions)) {
            $permissions[] = $permission;
            
            $stmt = $conn->prepare("
                UPDATE team_members 
                SET permissions = ?, updated_at = NOW()
                WHERE user_id = ?
            ");
            
            return $stmt->execute([json_encode($permissions), $userId]);
        }
        
        return true; // Ya tiene el permiso
    }
    
    /**
     * Remover permiso de miembro del equipo
     */
    public function removePermission($userId, $permission) {
        $conn = $this->db->getConnection();
        
        $stmt = $conn->prepare("
            SELECT permissions FROM team_members WHERE user_id = ?
        ");
        $stmt->execute([$userId]);
        $result = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$result) {
            return false;
        }
        
        $permissions = json_decode($result['permissions'], true) ?? [];
        $permissions = array_values(array_diff($permissions, [$permission]));
        
        $stmt = $conn->prepare("
            UPDATE team_members 
            SET permissions = ?, updated_at = NOW()
            WHERE user_id = ?
        ");
        
        return $stmt->execute([json_encode($permissions), $userId]);
    }
    
    /**
     * Obtener estadísticas del equipo
     */
    public function getTeamStats() {
        $conn = $this->db->getConnection();
        
        $stmt = $conn->prepare("
            SELECT 
                COUNT(*) as total_members,
                COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_members,
                COUNT(CASE WHEN can_login = TRUE THEN 1 END) as can_login_members,
                department,
                COUNT(*) as dept_count
            FROM team_members
            GROUP BY department
            WITH ROLLUP
        ");
        
        $stmt->execute();
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
    
    /**
     * Obtener jerarquía del equipo
     */
    public function getTeamHierarchy() {
        $conn = $this->db->getConnection();
        
        $stmt = $conn->prepare("
            SELECT 
                tm.department,
                tm.role_level,
                COUNT(*) as count,
                GROUP_CONCAT(
                    CONCAT(u.first_name, ' ', u.last_name, ' (', tm.position, ')')
                    SEPARATOR '; '
                ) as members
            FROM team_members tm
            INNER JOIN users u ON tm.user_id = u.id
            WHERE tm.is_active = TRUE
            GROUP BY tm.department, tm.role_level
            ORDER BY tm.department, 
                FIELD(tm.role_level, 'ceo', 'director', 'manager', 'lead', 'senior', 'mid', 'junior')
        ");
        
        $stmt->execute();
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
    
    /**
     * Buscar miembros del equipo
     */
    public function search($searchTerm, $filters = []) {
        $conn = $this->db->getConnection();
        
        $whereConditions = ["tm.is_active = TRUE"];
        $params = [];
        
        if (!empty($searchTerm)) {
            $whereConditions[] = "(
                u.first_name LIKE ? OR 
                u.last_name LIKE ? OR 
                u.email LIKE ? OR
                tm.position LIKE ? OR
                tm.employee_id LIKE ?
            )";
            $searchParam = '%' . $searchTerm . '%';
            $params = array_merge($params, array_fill(0, 5, $searchParam));
        }
        
        if (isset($filters['department']) && !empty($filters['department'])) {
            $whereConditions[] = "tm.department = ?";
            $params[] = $filters['department'];
        }
        
        if (isset($filters['role_level']) && !empty($filters['role_level'])) {
            $whereConditions[] = "tm.role_level = ?";
            $params[] = $filters['role_level'];
        }
        
        if (isset($filters['access_level']) && !empty($filters['access_level'])) {
            $whereConditions[] = "tm.access_level = ?";
            $params[] = $filters['access_level'];
        }
        
        $sql = "
            SELECT 
                tm.*,
                u.first_name,
                u.last_name,
                u.email,
                u.profile_image,
                u.last_login
            FROM team_members tm
            INNER JOIN users u ON tm.user_id = u.id
            WHERE " . implode(' AND ', $whereConditions) . "
            ORDER BY tm.department, tm.role_level DESC, u.first_name
        ";
        
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
    
    /**
     * Generar employee_id único
     */
    private function generateEmployeeId() {
        $conn = $this->db->getConnection();
        
        // Obtener el último ID usado
        $stmt = $conn->prepare("
            SELECT MAX(CAST(SUBSTRING(employee_id, 4) AS UNSIGNED)) as last_id
            FROM team_members 
            WHERE employee_id LIKE 'EMP%'
        ");
        $stmt->execute();
        $result = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        $nextId = ($result['last_id'] ?? 0) + 1;
        return 'EMP' . str_pad($nextId, 4, '0', STR_PAD_LEFT);
    }
    
    /**
     * Obtener permisos disponibles por departamento
     */
    public static function getAvailablePermissions($department = null) {
        $allPermissions = [
            'development' => [
                'code_review', 'technical_decisions', 'deployment_management',
                'database_access', 'system_architecture', 'mentoring'
            ],
            'design' => [
                'ui_design', 'ux_research', 'prototyping', 'user_testing',
                'brand_management', 'design_systems'
            ],
            'qa_testing' => [
                'quality_assurance', 'testing_coordination', 'bug_management',
                'release_approval', 'automation_testing', 'performance_testing'
            ],
            'devops' => [
                'server_management', 'deployment_automation', 'monitoring',
                'security_operations', 'infrastructure_management'
            ],
            'management' => [
                'team_management', 'project_management', 'budget_management',
                'strategic_planning', 'performance_reviews'
            ],
            'executive' => [
                'full_access', 'strategic_decisions', 'financial_management',
                'team_hiring', 'partnership_management'
            ],
            'support' => [
                'customer_support', 'ticket_management', 'user_assistance',
                'documentation_access'
            ],
            'security' => [
                'security_auditing', 'access_control', 'incident_response',
                'compliance_management'
            ]
        ];
        
        if ($department && isset($allPermissions[$department])) {
            return $allPermissions[$department];
        }
        
        return $allPermissions;
    }
    
    /**
     * Validar datos de miembro del equipo
     */
    public function validateTeamMemberData($data, $isUpdate = false) {
        $errors = [];
        
        if (!$isUpdate || isset($data['department'])) {
            if (empty($data['department']) || !array_key_exists($data['department'], self::DEPARTMENTS)) {
                $errors[] = 'Departamento válido es requerido';
            }
        }
        
        if (!$isUpdate || isset($data['position'])) {
            if (empty($data['position'])) {
                $errors[] = 'Posición es requerida';
            }
        }
        
        if (!$isUpdate || isset($data['role_level'])) {
            if (isset($data['role_level']) && !array_key_exists($data['role_level'], self::ROLE_LEVELS)) {
                $errors[] = 'Nivel de rol válido es requerido';
            }
        }
        
        if (!$isUpdate || isset($data['access_level'])) {
            if (isset($data['access_level']) && !array_key_exists($data['access_level'], self::ACCESS_LEVELS)) {
                $errors[] = 'Nivel de acceso válido es requerido';
            }
        }
        
        return $errors;
    }
}
?>