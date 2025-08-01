// Mock authentication for development when backend is not available
export interface MockUser {
  id: string
  email: string
  username: string
  role: 'freelancer' | 'client' | 'admin' | 'mod' | 'superadmin'
  firstName: string
  lastName: string
  avatar?: string
  emailVerified: boolean
  phoneVerified: boolean
  twoFactorEnabled: boolean
  createdAt: string
  updatedAt: string
}

// Mock users for testing
export const MOCK_USERS: Record<string, { user: MockUser; password: string }> = {
  'admin@laburemos.com': {
    password: 'admin123',
    user: {
      id: '1',
      email: 'admin@laburemos.com',
      username: 'admin',
      role: 'admin',
      firstName: 'Admin',
      lastName: 'LaburAR',
      emailVerified: true,
      phoneVerified: true,
      twoFactorEnabled: false,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z'
    }
  },
  'mod@laburemos.com': {
    password: 'mod123',
    user: {
      id: '2',
      email: 'mod@laburemos.com',
      username: 'moderator',
      role: 'mod',
      firstName: 'Moderador',
      lastName: 'LaburAR',
      emailVerified: true,
      phoneVerified: true,
      twoFactorEnabled: false,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z'
    }
  },
  'superadmin@laburemos.com': {
    password: 'super123',
    user: {
      id: '3',
      email: 'superadmin@laburemos.com',
      username: 'superadmin',
      role: 'superadmin',
      firstName: 'Super',
      lastName: 'Admin',
      emailVerified: true,
      phoneVerified: true,
      twoFactorEnabled: false,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z'
    }
  },
  'freelancer@laburemos.com': {
    password: 'freelancer123',
    user: {
      id: '4',
      email: 'freelancer@laburemos.com',
      username: 'freelancer',
      role: 'freelancer',
      firstName: 'Juan',
      lastName: 'Freelancer',
      emailVerified: true,
      phoneVerified: true,
      twoFactorEnabled: false,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z'
    }
  },
  'client@laburemos.com': {
    password: 'client123',
    user: {
      id: '5',
      email: 'client@laburemos.com',
      username: 'client',
      role: 'client',
      firstName: 'María',
      lastName: 'Cliente',
      emailVerified: true,
      phoneVerified: true,
      twoFactorEnabled: false,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z'
    }
  }
}

// Mock authentication functions
export const mockAuth = {
  login: async (email: string, password: string): Promise<{ success: boolean; data?: { user: MockUser; token: string }; error?: string }> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const mockData = MOCK_USERS[email.toLowerCase()]
    if (!mockData || mockData.password !== password) {
      return {
        success: false,
        error: 'Email o contraseña incorrectos'
      }
    }

    // Generate mock JWT token
    const token = `mock_jwt_${mockData.user.id}_${Date.now()}`
    
    return {
      success: true,
      data: {
        user: mockData.user,
        token
      }
    }
  },

  verifyToken: async (token: string): Promise<{ success: boolean; data?: MockUser; error?: string }> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Mock token validation
    if (!token || !token.startsWith('mock_jwt_')) {
      return {
        success: false,
        error: 'Token inválido'
      }
    }

    // Extract user ID from token
    const parts = token.split('_')
    if (parts.length < 3) {
      return {
        success: false,
        error: 'Token malformado'
      }
    }

    const userId = parts[2]
    const user = Object.values(MOCK_USERS).find(u => u.user.id === userId)
    
    if (!user) {
      return {
        success: false,
        error: 'Usuario no encontrado'
      }
    }

    return {
      success: true,
      data: user.user
    }
  },

  logout: async (): Promise<{ success: boolean }> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300))
    return { success: true }
  }
}

// Check if we should use mock auth (when backend is not available)
export const shouldUseMockAuth = (): boolean => {
  return process.env.NODE_ENV === 'development' && 
         (process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true' || !process.env.NEXT_PUBLIC_API_URL)
}