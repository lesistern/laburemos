<?php
/**
 * UserV2 Model - Nueva estructura de usuarios flexible
 * Soporta sistema de flags is_client/is_freelancer + equipo técnico separado
 * 
 * @package LaburAR
 * @version 2.0
 * @author Claude Code
 */

namespace LaburAR\Models;

class UserV2 {
    private $db;
    
    public function __construct($database) {
        $this->db = $database;
    }
    
    /**
     * Obtener usuario por ID con información de roles
     */
    public function getUserById($userId) {
        $conn = $this->db->getConnection();
        
        $stmt = $conn->prepare("
            SELECT 
                u.*,
                CASE 
                    WHEN u.user_category = 'team' THEN tm.position
                    WHEN u.is_freelancer THEN fp.title
                    ELSE 'Cliente'
                END as display_title,
                CASE 
                    WHEN u.user_category = 'team' THEN tm.access_level
                    ELSE 'user'
                END as access_level,
                tm.department,
                tm.employee_id,
                tm.permissions,
                fp.rating_average,
                fp.total_projects
            FROM users u
            LEFT JOIN team_members tm ON u.id = tm.user_id AND u.user_category = 'team'
            LEFT JOIN freelancer_profiles fp ON u.id = fp.user_id AND u.is_freelancer = TRUE
            WHERE u.id = ? AND u.is_active = TRUE
        ");
        
        $stmt->execute([$userId]);
        return $stmt->fetch(\PDO::FETCH_ASSOC);
    }
    
    /**
     * Autenticar usuario con nuevo sistema de roles
     */
    public function authenticate($email, $password) {
        $conn = $this->db->getConnection();
        
        $stmt = $conn->prepare("
            SELECT 
                u.id,
                u.email,
                u.password_hash,
                u.first_name,
                u.last_name,
                u.user_category,
                u.is_client,
                u.is_freelancer,
                u.is_active,
                tm.access_level,
                tm.department,
                tm.can_login
            FROM users u
            LEFT JOIN team_members tm ON u.id = tm.user_id
            WHERE u.email = ? AND u.is_active = TRUE
        ");
        
        $stmt->execute([$email]);
        $user = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$user) {
            return false;
        }
        
        // Verificar password
        if (!password_verify($password, $user['password_hash'])) {
            return false;
        }
        
        // Verificar si team member puede loguearse
        if ($user['user_category'] === 'team' && !$user['can_login']) {
            return false;
        }
        
        // Actualizar último login
        $this->updateLastLogin($user['id']);
        
        return $user;
    }
    
    /**
     * Crear nuevo usuario público (cliente/freelancer)
     */
    public function createPublicUser($data) {
        $conn = $this->db->getConnection();
        
        try {
            $conn->beginTransaction();
            
            $stmt = $conn->prepare("
                INSERT INTO users (
                    email, password_hash, first_name, last_name, phone,
                    country, city, user_category, is_client, is_freelancer,
                    email_verified, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'public', ?, ?, FALSE, NOW())
            ");
            
            $stmt->execute([
                $data['email'],
                password_hash($data['password'], PASSWORD_DEFAULT),
                $data['first_name'],
                $data['last_name'],
                $data['phone'] ?? null,
                $data['country'] ?? 'Argentina',
                $data['city'] ?? null,
                $data['is_client'] ?? true,
                $data['is_freelancer'] ?? false
            ]);
            
            $userId = $conn->lastInsertId();
            
            // Si es freelancer, crear perfil
            if ($data['is_freelancer']) {
                $stmt = $conn->prepare("
                    INSERT INTO freelancer_profiles (user_id, created_at) 
                    VALUES (?, NOW())
                ");
                $stmt->execute([$userId]);
            }
            
            $conn->commit();
            return $userId;
            
        } catch (\Exception $e) {
            $conn->rollback();
            throw $e;
        }
    }
    
    /**
     * Obtener todos los usuarios públicos (clientes/freelancers)
     */
    public function getPublicUsers($filters = []) {
        $conn = $this->db->getConnection();
        
        $whereConditions = ["u.user_category = 'public'", "u.is_active = TRUE"];
        $params = [];
        
        if (isset($filters['is_client']) && $filters['is_client']) {
            $whereConditions[] = "u.is_client = TRUE";
        }
        
        if (isset($filters['is_freelancer']) && $filters['is_freelancer']) {
            $whereConditions[] = "u.is_freelancer = TRUE";
        }
        
        if (isset($filters['search']) && !empty($filters['search'])) {
            $whereConditions[] = "(u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)";
            $searchTerm = '%' . $filters['search'] . '%';
            $params = array_merge($params, [$searchTerm, $searchTerm, $searchTerm]);
        }
        
        $sql = "
            SELECT 
                u.id,
                u.email,
                u.first_name,
                u.last_name,
                u.is_client,
                u.is_freelancer,
                u.country,
                u.city,
                u.created_at,
                u.last_login,
                fp.title as freelancer_title,
                fp.rating_average,
                fp.total_projects,
                CASE 
                    WHEN u.is_client AND u.is_freelancer THEN 'both'
                    WHEN u.is_client THEN 'client'
                    WHEN u.is_freelancer THEN 'freelancer'
                    ELSE 'inactive'
                END as user_role
            FROM users u
            LEFT JOIN freelancer_profiles fp ON u.id = fp.user_id
            WHERE " . implode(' AND ', $whereConditions) . "
            ORDER BY u.created_at DESC
        ";
        
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
    
    /**
     * Obtener miembros del equipo técnico
     */
    public function getTeamMembers($filters = []) {
        $conn = $this->db->getConnection();
        
        $whereConditions = ["u.user_category = 'team'", "u.is_active = TRUE", "tm.is_active = TRUE"];
        $params = [];
        
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
                u.id,
                u.email,
                u.first_name,
                u.last_name,
                u.profile_image,
                u.last_login,
                u.created_at,
                tm.employee_id,
                tm.department,
                tm.position,
                tm.role_level,
                tm.access_level,
                tm.employment_type,
                tm.work_location,
                tm.permissions,
                tm.hire_date,
                tm.can_login
            FROM users u
            INNER JOIN team_members tm ON u.id = tm.user_id
            WHERE " . implode(' AND ', $whereConditions) . "
            ORDER BY tm.department, tm.role_level DESC, u.first_name
        ";
        
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
    
    /**
     * Asignar rol de cliente a usuario
     */
    public function assignClientRole($userId, $changedBy = null, $reason = null) {
        $conn = $this->db->getConnection();
        
        $stmt = $conn->prepare("CALL AssignClientRole(?, ?, ?)");
        return $stmt->execute([$userId, $changedBy, $reason]);
    }
    
    /**
     * Asignar rol de freelancer a usuario
     */
    public function assignFreelancerRole($userId, $changedBy = null, $reason = null) {
        $conn = $this->db->getConnection();
        
        $stmt = $conn->prepare("CALL AssignFreelancerRole(?, ?, ?)");
        return $stmt->execute([$userId, $changedBy, $reason]);
    }
    
    /**
     * Crear miembro del equipo técnico
     */
    public function createTeamMember($userId, $teamData, $createdBy = null) {
        $conn = $this->db->getConnection();
        
        $stmt = $conn->prepare("
            CALL CreateTeamMember(?, ?, ?, ?, ?, ?, ?)
        ");
        
        return $stmt->execute([
            $userId,
            $teamData['department'],
            $teamData['position'],
            $teamData['role_level'] ?? 'junior',
            $teamData['access_level'] ?? 'basic',
            json_encode($teamData['permissions'] ?? []),
            $createdBy
        ]);
    }
    
    /**
     * Verificar permisos de usuario
     */
    public function hasPermission($userId, $permission) {
        $conn = $this->db->getConnection();
        
        $stmt = $conn->prepare("
            SELECT tm.permissions, tm.access_level
            FROM users u
            INNER JOIN team_members tm ON u.id = tm.user_id
            WHERE u.id = ? AND u.user_category = 'team' AND tm.is_active = TRUE
        ");
        
        $stmt->execute([$userId]);
        $teamMember = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$teamMember) {
            return false; // Usuario público o no encontrado
        }
        
        // Super admin tiene todos los permisos
        if ($teamMember['access_level'] === 'super_admin') {
            return true;
        }
        
        // Verificar en permisos específicos
        $permissions = json_decode($teamMember['permissions'], true) ?? [];
        return in_array($permission, $permissions);
    }
    
    /**
     * Obtener estadísticas de usuarios
     */
    public function getUserStats() {
        $conn = $this->db->getConnection();
        
        $stmt = $conn->prepare("
            SELECT 
                COUNT(CASE WHEN user_category = 'public' AND is_client = TRUE THEN 1 END) as total_clients,
                COUNT(CASE WHEN user_category = 'public' AND is_freelancer = TRUE THEN 1 END) as total_freelancers,
                COUNT(CASE WHEN user_category = 'public' AND is_client = TRUE AND is_freelancer = TRUE THEN 1 END) as dual_role_users,
                COUNT(CASE WHEN user_category = 'team' THEN 1 END) as team_members,
                COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_users,
                COUNT(*) as total_users
            FROM users
        ");
        
        $stmt->execute();
        return $stmt->fetch(\PDO::FETCH_ASSOC);
    }
    
    /**
     * Obtener historial de cambios de roles
     */
    public function getRoleHistory($userId, $limit = 50) {
        $conn = $this->db->getConnection();
        
        $stmt = $conn->prepare("
            SELECT 
                urh.*,
                u_changed.first_name as changed_by_name,
                u_changed.last_name as changed_by_lastname
            FROM user_role_history urh
            LEFT JOIN users u_changed ON urh.changed_by = u_changed.id
            WHERE urh.user_id = ?
            ORDER BY urh.change_date DESC
            LIMIT ?
        ");
        
        $stmt->execute([$userId, $limit]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
    
    /**
     * Validar estructura de datos de usuario
     */
    public function validateUserData($data, $isUpdate = false) {
        $errors = [];
        
        if (!$isUpdate || isset($data['email'])) {
            if (empty($data['email']) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                $errors[] = 'Email válido es requerido';
            }
        }
        
        if (!$isUpdate || isset($data['password'])) {
            if (!$isUpdate && (empty($data['password']) || strlen($data['password']) < 8)) {
                $errors[] = 'Password debe tener al menos 8 caracteres';
            }
        }
        
        if (!$isUpdate || isset($data['first_name'])) {
            if (empty($data['first_name'])) {
                $errors[] = 'Nombre es requerido';
            }
        }
        
        if (!$isUpdate || isset($data['last_name'])) {
            if (empty($data['last_name'])) {
                $errors[] = 'Apellido es requerido';
            }
        }
        
        return $errors;
    }
    
    /**
     * Actualizar último login
     */
    private function updateLastLogin($userId) {
        $conn = $this->db->getConnection();
        
        $stmt = $conn->prepare("
            UPDATE users 
            SET last_login = NOW() 
            WHERE id = ?
        ");
        
        return $stmt->execute([$userId]);
    }
    
    /**
     * Obtener usuarios con rol dual (cliente + freelancer)
     */
    public function getDualRoleUsers() {
        $conn = $this->db->getConnection();
        
        $stmt = $conn->prepare("
            SELECT 
                u.*,
                fp.title,
                fp.rating_average,
                fp.total_projects
            FROM users u
            LEFT JOIN freelancer_profiles fp ON u.id = fp.user_id
            WHERE u.user_category = 'public' 
            AND u.is_client = TRUE 
            AND u.is_freelancer = TRUE
            AND u.is_active = TRUE
            ORDER BY u.created_at DESC
        ");
        
        $stmt->execute();
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
    
    /**
     * Buscar usuarios por múltiples criterios
     */
    public function searchUsers($searchTerm, $filters = []) {
        $conn = $this->db->getConnection();
        
        $whereConditions = ["u.is_active = TRUE"];
        $params = [];
        
        // Búsqueda por término
        if (!empty($searchTerm)) {
            $whereConditions[] = "(
                u.first_name LIKE ? OR 
                u.last_name LIKE ? OR 
                u.email LIKE ? OR
                fp.title LIKE ? OR
                tm.position LIKE ?
            )";
            $searchParam = '%' . $searchTerm . '%';
            $params = array_merge($params, array_fill(0, 5, $searchParam));
        }
        
        // Filtros adicionales
        if (isset($filters['category']) && !empty($filters['category'])) {
            $whereConditions[] = "u.user_category = ?";
            $params[] = $filters['category'];
        }
        
        $sql = "
            SELECT 
                u.id,
                u.email,
                u.first_name,
                u.last_name,
                u.user_category,
                u.is_client,
                u.is_freelancer,
                u.created_at,
                fp.title as freelancer_title,
                tm.position as team_position,
                tm.department
            FROM users u
            LEFT JOIN freelancer_profiles fp ON u.id = fp.user_id
            LEFT JOIN team_members tm ON u.id = tm.user_id
            WHERE " . implode(' AND ', $whereConditions) . "
            ORDER BY u.first_name, u.last_name
        ";
        
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
}
?>