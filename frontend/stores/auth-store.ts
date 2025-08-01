import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@/types'
import { sessionManager } from '@/lib/session-manager'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  sessionWarningShown: boolean
}

interface AuthActions {
  login: (user: User, token: string) => void
  loginWithCredentials: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  updateUser: (user: Partial<User>) => void
  updateProfile: (profileData: any) => Promise<boolean>
  updateFreelancerProfile: (profileData: any) => Promise<boolean>
  setLoading: (loading: boolean) => void
  checkAuth: () => Promise<void>
  showSessionWarning: () => void
  hideSessionWarning: () => void
  extendSession: () => void
  logoutDueToTimeout: () => Promise<void>
}

type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      sessionWarningShown: false,

      // Actions
      login: (user: User, token: string) => {
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          sessionWarningShown: false,
        })
        
        // Start session monitoring
        sessionManager.startSession()
        sessionManager.setCallbacks({
          onWarning: () => get().showSessionWarning(),
          onTimeout: () => get().logoutDueToTimeout(),
          onActivity: () => get().hideSessionWarning()
        })
      },

      loginWithCredentials: async (email: string, password: string): Promise<boolean> => {
        set({ isLoading: true })
        
        try {
          const { apiClient } = await import('@/lib/api')
          const result = await apiClient.login({ email, password })
          
          if (result.success && result.data) {
            const { user, token } = result.data
            apiClient.setToken(token)
            
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
            })
            
            return true
          } else {
            set({ isLoading: false })
            return false
          }
        } catch (error) {
          console.error('Login failed:', error)
          set({ isLoading: false })
          return false
        }
      },

      logout: async () => {
        const { token } = get()
        
        if (token) {
          try {
            const { apiClient } = await import('@/lib/api')
            apiClient.setToken(token)
            await apiClient.logout()
          } catch (error) {
            console.error('Logout API call failed:', error)
          }
        }
        
        // Stop session monitoring
        sessionManager.stopSession()
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          sessionWarningShown: false,
        })
      },

      updateUser: (userData: Partial<User>) => {
        const { user } = get()
        if (user) {
          set({
            user: { ...user, ...userData },
          })
        }
      },

      updateProfile: async (profileData: any): Promise<boolean> => {
        const { token, user } = get()
        if (!token || !user) return false

        set({ isLoading: true })

        try {
          const { apiClient } = await import('@/lib/api')
          apiClient.setToken(token)
          
          const result = await apiClient.updateProfile(profileData)
          
          if (result.success && result.data) {
            set({
              user: { ...user, ...result.data.data },
              isLoading: false,
            })
            return true
          } else {
            set({ isLoading: false })
            return false
          }
        } catch (error) {
          console.error('Profile update failed:', error)
          set({ isLoading: false })
          return false
        }
      },

      updateFreelancerProfile: async (profileData: any): Promise<boolean> => {
        const { token, user } = get()
        if (!token || !user || user.role !== 'freelancer') return false

        set({ isLoading: true })

        try {
          const { apiClient } = await import('@/lib/api')
          apiClient.setToken(token)
          
          const result = await apiClient.updateFreelancerProfile(profileData)
          
          if (result.success && result.data) {
            set({
              user: { 
                ...user, 
                freelancerProfile: result.data.data 
              },
              isLoading: false,
            })
            return true
          } else {
            set({ isLoading: false })
            return false
          }
        } catch (error) {
          console.error('Freelancer profile update failed:', error)
          set({ isLoading: false })
          return false
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      checkAuth: async () => {
        const { token } = get()
        if (!token) {
          set({ isLoading: false })
          return
        }

        set({ isLoading: true })

        try {
          // Import API client dynamically to avoid SSR issues
          const { apiClient } = await import('@/lib/api')
          apiClient.setToken(token)
          
          const result = await apiClient.verifyToken()

          if (result.success && result.data) {
            set({
              user: result.data,
              isAuthenticated: true,
              isLoading: false,
            })
          } else {
            // Token is invalid
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
            })
          }
        } catch (error) {
          console.error('Auth check failed:', error)
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },

      // Session management actions
      showSessionWarning: () => {
        set({ sessionWarningShown: true })
      },

      hideSessionWarning: () => {
        set({ sessionWarningShown: false })
      },

      extendSession: () => {
        sessionManager.extendSession()
        set({ sessionWarningShown: false })
      },

      logoutDueToTimeout: async () => {
        const { logout } = get()
        console.log('🔐 Session expired - logging out user')
        await logout()
        
        // Redirect to login with timeout message
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login?message=session_expired'
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)