import { create } from 'zustand'

interface UIState {
  theme: 'light' | 'dark'
  sidebarOpen: boolean
  mobileMenuOpen: boolean
  searchQuery: string
  activeCategory: string | null
  notifications: Notification[]
  unreadNotifications: number
}

interface UIActions {
  setTheme: (theme: 'light' | 'dark') => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleMobileMenu: () => void
  setMobileMenuOpen: (open: boolean) => void
  setSearchQuery: (query: string) => void
  setActiveCategory: (category: string | null) => void
  addNotification: (notification: Notification) => void
  removeNotification: (id: string) => void
  markNotificationAsRead: (id: string) => void
  clearAllNotifications: () => void
}

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: Date
  read: boolean
}

type UIStore = UIState & UIActions

export const useUIStore = create<UIStore>((set, get) => ({
  // State
  theme: 'light',
  sidebarOpen: true,
  mobileMenuOpen: false,
  searchQuery: '',
  activeCategory: null,
  notifications: [],
  unreadNotifications: 0,

  // Actions
  setTheme: (theme) => {
    set({ theme })
    // You could persist theme to localStorage here
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme)
      document.documentElement.classList.toggle('dark', theme === 'dark')
    }
  },

  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }))
  },

  setSidebarOpen: (open) => {
    set({ sidebarOpen: open })
  },

  toggleMobileMenu: () => {
    set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen }))
  },

  setMobileMenuOpen: (open) => {
    set({ mobileMenuOpen: open })
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query })
  },

  setActiveCategory: (category) => {
    set({ activeCategory: category })
  },

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, 50), // Keep only last 50
      unreadNotifications: state.unreadNotifications + (notification.read ? 0 : 1),
    }))
  },

  removeNotification: (id) => {
    set((state) => {
      const notification = state.notifications.find(n => n.id === id)
      return {
        notifications: state.notifications.filter(n => n.id !== id),
        unreadNotifications: notification && !notification.read 
          ? state.unreadNotifications - 1 
          : state.unreadNotifications,
      }
    })
  },

  markNotificationAsRead: (id) => {
    set((state) => {
      const updatedNotifications = state.notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      )
      const wasUnread = state.notifications.find(n => n.id === id && !n.read)
      
      return {
        notifications: updatedNotifications,
        unreadNotifications: wasUnread 
          ? state.unreadNotifications - 1 
          : state.unreadNotifications,
      }
    })
  },

  clearAllNotifications: () => {
    set({ notifications: [], unreadNotifications: 0 })
  },
}))