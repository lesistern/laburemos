import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'

export type AdminRole = 'admin' | 'mod' | 'superadmin'

export const ADMIN_ROLES: AdminRole[] = ['admin', 'mod', 'superadmin']

export function useAdminAuth() {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore()
  const router = useRouter()

  const isAdmin = user && ADMIN_ROLES.includes(user.role as AdminRole)
  const hasAdminAccess = isAuthenticated && isAdmin

  useEffect(() => {
    // Check authentication on mount
    if (!user && !isLoading) {
      checkAuth()
    }
  }, [user, isLoading, checkAuth])

  useEffect(() => {
    // Redirect if not authenticated or not admin
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      router.replace('/auth/login?redirect=/admin&message=admin_access_required')
    }
  }, [isAuthenticated, isAdmin, isLoading, router])

  return {
    user,
    isAuthenticated,
    isAdmin,
    hasAdminAccess,
    isLoading,
    adminRole: user?.role as AdminRole | undefined
  }
}

export function hasRole(userRole: string | undefined, requiredRoles: AdminRole[]): boolean {
  return userRole ? requiredRoles.includes(userRole as AdminRole) : false
}

export function canAccessAdminPanel(userRole: string | undefined): boolean {
  return hasRole(userRole, ADMIN_ROLES)
}

export function getRoleLabel(role: string): string {
  const roleLabels = {
    'superadmin': 'Super Administrador',
    'admin': 'Administrador',
    'mod': 'Moderador',
    'freelancer': 'Freelancer',
    'client': 'Cliente'
  }
  return roleLabels[role as keyof typeof roleLabels] || role
}

export function getRoleBadgeVariant(role: string): 'admin' | 'mod' | 'superadmin' | 'default' {
  if (['admin', 'mod', 'superadmin'].includes(role)) {
    return role as 'admin' | 'mod' | 'superadmin'
  }
  return 'default'
}