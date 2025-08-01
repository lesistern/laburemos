import { API_BASE_URL } from './constants'
import { mockAuth, shouldUseMockAuth } from './mock-auth'

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
    // Get token from localStorage if available (client-side only)
    if (typeof window !== 'undefined') {
      const authStorage = localStorage.getItem('auth-storage')
      if (authStorage) {
        try {
          const parsed = JSON.parse(authStorage)
          this.token = parsed.state?.token || null
        } catch (error) {
          console.warn('Failed to parse auth storage:', error)
        }
      }
    }
  }

  setToken(token: string | null) {
    this.token = token
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    return headers
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`
      
      const response = await fetch(url, {
        headers: this.getHeaders(),
        ...options,
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.error || `HTTP ${response.status}`,
        }
      }

      return {
        success: true,
        data,
      }
    } catch (error) {
      console.error('API request failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Generic CRUD methods
  async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  // API Status and Health
  async getHealth() {
    return this.get('/health')
  }

  async getApiStatus() {
    return this.get('/api/status')
  }

  // Categories endpoints
  async getCategories() {
    return this.get('/api/categories')
  }

  // Services endpoints
  async getServices(params?: any) {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    return this.get(`/api/services${query}`)
  }

  // Auth endpoints (to be implemented in backend)
  async login(credentials: { email: string; password: string }) {
    // Use mock auth if backend is not available
    if (shouldUseMockAuth()) {
      return mockAuth.login(credentials.email, credentials.password)
    }
    return this.post('/api/auth/login', credentials)
  }

  async register(userData: {
    email: string
    password: string
    name: string
    role: string
  }) {
    return this.post('/api/auth/register', userData)
  }

  async logout() {
    // Use mock auth if backend is not available
    if (shouldUseMockAuth()) {
      const result = await mockAuth.logout()
      this.setToken(null)
      return result
    }
    const result = await this.post('/api/auth/logout')
    this.setToken(null)
    return result
  }

  async refreshToken() {
    if (shouldUseMockAuth()) {
      return { success: false, error: 'Refresh not supported in mock mode' }
    }
    return this.post('/api/auth/refresh')
  }

  async verifyToken() {
    // Use mock auth if backend is not available
    if (shouldUseMockAuth()) {
      return mockAuth.verifyToken(this.token || '')
    }
    return this.get('/api/auth/verify')
  }

  // User endpoints (to be implemented in backend)
  async getProfile() {
    return this.get('/api/user/profile')
  }

  async updateProfile(userData: any) {
    return this.patch('/api/users/profile', userData)
  }

  async updateFreelancerProfile(profileData: any) {
    return this.patch('/api/users/freelancer-profile', profileData)
  }

  // Project endpoints (to be implemented in backend)
  async getProjects(params?: any) {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    return this.get(`/api/projects${query}`)
  }

  async getProject(id: string) {
    return this.get(`/api/projects/${id}`)
  }

  async createProject(projectData: any) {
    return this.post('/api/projects', projectData)
  }

  async updateProject(id: string, projectData: any) {
    return this.put(`/api/projects/${id}`, projectData)
  }

  async deleteProject(id: string) {
    return this.delete(`/api/projects/${id}`)
  }

  // Payment endpoints (to be implemented in backend)
  async getPayments() {
    return this.get('/api/payments')
  }

  async createPayment(paymentData: any) {
    return this.post('/api/payments', paymentData)
  }

  // Notification endpoints (to be implemented in backend)
  async getNotifications() {
    return this.get('/api/notifications')
  }

  async markNotificationAsRead(id: string) {
    return this.patch(`/api/notifications/${id}/read`)
  }

  // Legacy API compatibility for existing components
  async getEmojis(params?: { action?: string; category?: string; limit?: number }) {
    // For now, fall back to the legacy PHP API until backend is updated
    const query = params ? `?${new URLSearchParams(params as any)}` : ''
    const legacyUrl = `/api/emojis.php${query}`
    
    try {
      const response = await fetch(legacyUrl)
      return await response.json()
    } catch (error) {
      console.warn('Legacy emoji API failed, trying modern API')
      return this.get(`/emojis${query}`)
    }
  }
}

// Create singleton instance
export const apiClient = new ApiClient(API_BASE_URL)

// WebSocket connection for real-time features
export class WebSocketManager {
  private ws: WebSocket | null = null
  private url: string
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectInterval = 1000
  private listeners: { [event: string]: Function[] } = {}

  constructor(url: string) {
    this.url = url
  }

  connect(token?: string) {
    if (typeof window === 'undefined') return

    try {
      const wsUrl = token ? `${this.url}?token=${token}` : this.url
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        console.log('WebSocket connected')
        this.reconnectAttempts = 0
        this.emit('connected')
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.emit('message', data)
          
          // Emit specific event types
          if (data.type) {
            this.emit(data.type, data)
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      this.ws.onclose = () => {
        console.log('WebSocket disconnected')
        this.emit('disconnected')
        this.handleReconnect()
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        this.emit('error', error)
      }
    } catch (error) {
      console.error('Failed to connect WebSocket:', error)
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      setTimeout(() => {
        console.log(`Attempting to reconnect WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
        this.connect()
      }, this.reconnectInterval * this.reconnectAttempts)
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    } else {
      console.warn('WebSocket is not connected')
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(callback)
  }

  off(event: string, callback: Function) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback)
    }
  }

  private emit(event: string, data?: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data))
    }
  }
}

// Create WebSocket manager instance
const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3001'
export const wsManager = new WebSocketManager(wsUrl)

// Export default client
export default apiClient