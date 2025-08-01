import * as jose from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function verifyJWT(token: string) {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jose.jwtVerify(token, secret)
    return payload
  } catch (error) {
    throw new Error('Invalid token')
  }
}

export function isAdmin(role: string): boolean {
  return ['admin', 'mod', 'superadmin'].includes(role?.toLowerCase())
}

export function canAccessAdminPanel(user: any): boolean {
  return user && isAdmin(user.role)
}

export function hasRole(userRole: string | undefined, allowedRoles: string[]): boolean {
  return userRole ? allowedRoles.includes(userRole.toLowerCase()) : false
}

export function canAccessResource(user: any, requiredRoles: string[]): boolean {
  return user && hasRole(user.role, requiredRoles)
}