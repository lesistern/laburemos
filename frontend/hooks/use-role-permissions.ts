import { useAdminAuth } from './use-admin-auth'

export type UserRole = 'freelancer' | 'client' | 'admin' | 'mod' | 'superadmin'

export interface RolePermissions {
  // User Management
  canCreateUsers: boolean
  canEditUsers: boolean
  canDeleteUsers: boolean
  canViewUsers: boolean
  
  // Role-specific permissions
  canDeleteAdmin: boolean
  canDeleteMod: boolean
  canDeleteFreelancer: boolean
  canDeleteClient: boolean
  
  // System permissions
  canAccessSettings: boolean
  canAccessSecurity: boolean
  canAccessReports: boolean
  canManageSystem: boolean
}

const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  // Super Admin - Full access
  superadmin: {
    canCreateUsers: true,
    canEditUsers: true,
    canDeleteUsers: true,
    canViewUsers: true,
    canDeleteAdmin: true,
    canDeleteMod: true,
    canDeleteFreelancer: true,
    canDeleteClient: true,
    canAccessSettings: true,
    canAccessSecurity: true,
    canAccessReports: true,
    canManageSystem: true,
  },
  
  // Admin - High access but cannot delete other admins/mods
  admin: {
    canCreateUsers: true,
    canEditUsers: true,
    canDeleteUsers: true,
    canViewUsers: true,
    canDeleteAdmin: false,
    canDeleteMod: false,
    canDeleteFreelancer: true,
    canDeleteClient: true,
    canAccessSettings: true,
    canAccessSecurity: true,
    canAccessReports: true,
    canManageSystem: false,
  },
  
  // Moderator - Limited admin access
  mod: {
    canCreateUsers: false,
    canEditUsers: true,
    canDeleteUsers: false,
    canViewUsers: true,
    canDeleteAdmin: false,
    canDeleteMod: false,
    canDeleteFreelancer: false,
    canDeleteClient: false,
    canAccessSettings: false,
    canAccessSecurity: false,
    canAccessReports: true,
    canManageSystem: false,
  },
  
  // Freelancer - No admin access
  freelancer: {
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canViewUsers: false,
    canDeleteAdmin: false,
    canDeleteMod: false,
    canDeleteFreelancer: false,
    canDeleteClient: false,
    canAccessSettings: false,
    canAccessSecurity: false,
    canAccessReports: false,
    canManageSystem: false,
  },
  
  // Client - No admin access
  client: {
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canViewUsers: false,
    canDeleteAdmin: false,
    canDeleteMod: false,
    canDeleteFreelancer: false,
    canDeleteClient: false,
    canAccessSettings: false,
    canAccessSecurity: false,
    canAccessReports: false,
    canManageSystem: false,
  },
}

export function useRolePermissions() {
  const { user, adminRole } = useAdminAuth()
  
  const permissions = adminRole ? ROLE_PERMISSIONS[adminRole] : ROLE_PERMISSIONS.client
  
  // Helper functions for specific checks
  const canDeleteUser = (targetUserRole: UserRole): boolean => {
    if (!permissions.canDeleteUsers) return false
    
    switch (targetUserRole) {
      case 'admin':
        return permissions.canDeleteAdmin
      case 'mod':
        return permissions.canDeleteMod
      case 'freelancer':
        return permissions.canDeleteFreelancer
      case 'client':
        return permissions.canDeleteClient
      case 'superadmin':
        return false // Only superadmin can delete superadmin (but not themselves)
      default:
        return false
    }
  }
  
  const canEditUser = (targetUserRole: UserRole): boolean => {
    if (!permissions.canEditUsers) return false
    
    // Superadmin can edit everyone except other superadmins
    if (adminRole === 'superadmin') {
      return targetUserRole !== 'superadmin' || user?.id === targetUserRole
    }
    
    // Admin can edit freelancers and clients only
    if (adminRole === 'admin') {
      return ['freelancer', 'client'].includes(targetUserRole)
    }
    
    // Mod can edit freelancers and clients only
    if (adminRole === 'mod') {
      return ['freelancer', 'client'].includes(targetUserRole)
    }
    
    return false
  }
  
  const getMaxRoleCanCreate = (): UserRole[] => {
    if (!permissions.canCreateUsers) return []
    
    if (adminRole === 'superadmin') {
      return ['admin', 'mod', 'freelancer', 'client']
    }
    
    if (adminRole === 'admin') {
      return ['mod', 'freelancer', 'client']
    }
    
    return []
  }
  
  const getRoleDisplayName = (role: UserRole): string => {
    const names = {
      superadmin: 'Super Administrador',
      admin: 'Administrador',
      mod: 'Moderador',
      freelancer: 'Freelancer',
      client: 'Cliente'
    }
    return names[role] || role
  }
  
  const getRoleColor = (role: UserRole): string => {
    const colors = {
      superadmin: 'purple',
      admin: 'blue',
      mod: 'orange',
      freelancer: 'green',
      client: 'gray'
    }
    return colors[role] || 'gray'
  }
  
  return {
    permissions,
    userRole: adminRole,
    canDeleteUser,
    canEditUser,
    getMaxRoleCanCreate,
    getRoleDisplayName,
    getRoleColor,
    
    // Quick access to common permissions
    canCreateUsers: permissions.canCreateUsers,
    canManageUsers: permissions.canCreateUsers || permissions.canEditUsers || permissions.canDeleteUsers,
    canAccessUserManagement: permissions.canViewUsers,
    isAdmin: adminRole === 'admin',
    isSuperAdmin: adminRole === 'superadmin',
    isMod: adminRole === 'mod',
  }
}