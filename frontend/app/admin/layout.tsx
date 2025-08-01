'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutDashboard, 
  Users, 
  FolderTree, 
  BarChart3, 
  MessageSquare, 
  Settings,
  LogOut,
  Menu,
  X,
  ProjectorIcon as Projects,
  CreditCard,
  AlertTriangle,
  FileText,
  Bell,
  Shield,
  ChevronRight,
  Search,
  Sun,
  Moon,
  Monitor
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { AdminGuard } from '@/components/admin/admin-guard'
import { SessionProvider } from '@/components/auth/session-provider'
import { useAdminAuth, getRoleLabel, getRoleBadgeVariant } from '@/hooks/use-admin-auth'

const sidebarItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    description: 'Vista general del panel'
  },
  {
    title: 'Usuarios',
    href: '/admin/users',
    icon: Users,
    description: 'Gestión de usuarios',
    badge: 'nuevo'
  },
  {
    title: 'Categorías',
    href: '/admin/categories',
    icon: FolderTree,
    description: 'Gestión de categorías'
  },
  {
    title: 'Proyectos',
    href: '/admin/projects',
    icon: Projects,
    description: 'Gestión de proyectos'
  },
  {
    title: 'Analíticas',
    href: '/admin/analytics',
    icon: BarChart3,
    description: 'Métricas y reportes'
  },
  {
    title: 'Soporte',
    href: '/admin/support',
    icon: MessageSquare,
    description: 'Tickets de soporte',
    badge: '12'
  },
  {
    title: 'Pagos',
    href: '/admin/payments',
    icon: CreditCard,
    description: 'Gestión de pagos'
  },
  {
    title: 'Reportes',
    href: '/admin/reports',
    icon: FileText,
    description: 'Informes del sistema'
  },
  {
    title: 'Seguridad',
    href: '/admin/security',
    icon: Shield,
    description: 'Seguridad y logs'
  },
  {
    title: 'Configuración',
    href: '/admin/settings',
    icon: Settings,
    description: 'Configuración del sistema'
  }
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('light')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const pathname = usePathname()
  const { user } = useAdminAuth()
  const searchInputRef = useRef<HTMLInputElement>(null)

  const handleLogout = async () => {
    const { logout } = await import('@/stores/auth-store').then(m => m.useAuthStore.getState())
    await logout()
    window.location.href = '/'
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd/Ctrl + K for search
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        setSearchOpen(true)
        setTimeout(() => searchInputRef.current?.focus(), 100)
      }
      // Escape to close search
      if (event.key === 'Escape' && searchOpen) {
        setSearchOpen(false)
        setSearchTerm('')
      }
      // Cmd/Ctrl + B to toggle sidebar
      if ((event.metaKey || event.ctrlKey) && event.key === 'b') {
        event.preventDefault()
        setSidebarCollapsed(!sidebarCollapsed)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [searchOpen, sidebarCollapsed])

  // Filter sidebar items based on search
  const filteredSidebarItems = sidebarItems.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <AdminGuard>
      <SessionProvider>
        <div className="min-h-screen bg-gray-50 lg:flex">
      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <nav 
        className={`fixed inset-y-0 left-0 z-50 bg-white shadow-xl transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:flex-shrink-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-72'} w-72`}
        aria-label="Panel de administración"
        role="navigation"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={`flex items-center justify-between border-b border-gray-200 transition-all duration-300
            ${sidebarCollapsed ? 'p-3' : 'p-6'}`}>
            <div className={`flex items-center transition-all duration-300 ${sidebarCollapsed ? 'justify-center' : 'space-x-3'}`}>
              <div className="w-10 h-10 bg-gradient-to-r from-laburar-sky-blue-500 to-laburar-sky-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              {!sidebarCollapsed && (
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
                  <p className="text-sm text-gray-500">LaburAR</p>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-1">
              {!sidebarCollapsed && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden lg:flex"
                  onClick={() => setSidebarCollapsed(true)}
                  aria-label="Contraer barra lateral"
                  title="Contraer barra lateral (Ctrl+B)"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
              {sidebarCollapsed && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden lg:flex"
                  onClick={() => setSidebarCollapsed(false)}
                  aria-label="Expandir barra lateral"
                  title="Expandir barra lateral (Ctrl+B)"
                >
                  <Menu className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(false)}
                aria-label="Cerrar menú de navegación"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* User info */}
          <div className={`border-b border-gray-200 transition-all duration-300
            ${sidebarCollapsed ? 'p-3' : 'p-6'}`}>
            {!sidebarCollapsed ? (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white font-semibold text-sm" aria-hidden="true">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{user?.firstName} {user?.lastName}</p>
                  <p className="text-sm text-gray-500">{user?.role ? getRoleLabel(user.role) : 'Usuario'}</p>
                </div>
                <Badge variant={user?.role ? getRoleBadgeVariant(user.role) : 'default'} className="shrink-0">
                  {user?.role?.toUpperCase() || 'USER'}
                </Badge>
              </div>
            ) : (
              <div className="flex justify-center">
                <div 
                  className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-md"
                  title={`${user?.firstName} ${user?.lastName} - ${user?.role ? getRoleLabel(user.role) : 'Usuario'}`}
                >
                  <span className="text-white font-semibold text-sm" aria-hidden="true">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Search */}
          {!sidebarCollapsed && (
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Buscar páginas... (⌘K)"
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-laburar-sky-blue-500 focus:border-transparent transition-colors"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Buscar páginas del panel de administración"
                />
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto" role="navigation" aria-label="Navegación principal">
            {filteredSidebarItems.length === 0 && searchTerm ? (
              <div className="p-4 text-center text-gray-500">
                <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No se encontraron páginas</p>
                <p className="text-xs text-gray-400">Intenta con otros términos</p>
              </div>
            ) : (
              filteredSidebarItems.map((item, index) => {
                const isActive = pathname === item.href
                const Icon = item.icon

                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
                    <Link
                      href={item.href}
                      className={`group flex items-center justify-between rounded-xl transition-all duration-200 
                        ${sidebarCollapsed ? 'p-3 mx-1' : 'p-3 mx-2'}
                        ${isActive
                          ? 'bg-gradient-to-r from-laburar-sky-blue-50 to-laburar-sky-blue-100 text-laburar-sky-blue-700 shadow-sm border border-laburar-sky-blue-200'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm hover:scale-[0.98] active:scale-95'
                        }
                        focus:outline-none focus:ring-2 focus:ring-laburar-sky-blue-500 focus:ring-offset-2`}
                      onClick={() => setSidebarOpen(false)}
                      aria-current={isActive ? 'page' : undefined}
                      title={sidebarCollapsed ? `${item.title} - ${item.description}` : undefined}
                    >
                      <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'}`}>
                        <div className={`flex-shrink-0 transition-transform duration-200 group-hover:scale-110
                          ${isActive ? 'text-laburar-sky-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                          <Icon className="w-5 h-5" aria-hidden="true" />
                        </div>
                        {!sidebarCollapsed && (
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium truncate transition-colors duration-200
                              ${isActive ? 'text-laburar-sky-blue-900' : 'text-gray-700 group-hover:text-gray-900'}`}>
                              {item.title}
                            </p>
                            <p className={`text-xs truncate transition-colors duration-200
                              ${isActive ? 'text-laburar-sky-blue-600' : 'text-gray-500 group-hover:text-gray-600'}`}>
                              {item.description}
                            </p>
                          </div>
                        )}
                      </div>
                      {!sidebarCollapsed && item.badge && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.1 }}
                        >
                          <Badge 
                            variant={item.badge === 'nuevo' ? 'success' : 'warning'}
                            className="text-xs font-medium shrink-0"
                          >
                            {item.badge}
                          </Badge>
                        </motion.div>
                      )}
                      {sidebarCollapsed && item.badge && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                      )}
                    </Link>
                  </motion.div>
                )
              })
            )}
          </nav>

          {/* Footer */}
          <div className={`border-t border-gray-200 transition-all duration-300
            ${sidebarCollapsed ? 'p-2' : 'p-4'}`}>
            <Button
              variant="ghost"
              className={`w-full transition-all duration-200 text-red-600 hover:text-red-700 hover:bg-red-50 focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                ${sidebarCollapsed ? 'justify-center' : 'justify-start'}`}
              onClick={handleLogout}
              aria-label={sidebarCollapsed ? "Cerrar sesión" : undefined}
              title={sidebarCollapsed ? "Cerrar sesión" : undefined}
            >
              <LogOut className={`w-5 h-5 ${sidebarCollapsed ? '' : 'mr-3'}`} aria-hidden="true" />
              {!sidebarCollapsed && 'Cerrar sesión'}
            </Button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="flex-1 lg:flex lg:flex-col lg:min-w-0">
        {/* Top header */}
        <header className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4">
            <div className="flex items-center space-x-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden focus:ring-2 focus:ring-laburar-sky-blue-500"
                onClick={() => setSidebarOpen(true)}
                aria-label="Abrir menú de navegación"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold text-gray-900 truncate">
                  {sidebarItems.find(item => item.href === pathname)?.title || 'Admin Panel'}
                </h2>
                <p className="text-sm text-gray-600 truncate">
                  {sidebarItems.find(item => item.href === pathname)?.description || 'Panel de administración'}
                </p>
              </div>
            </div>

            {/* Header actions */}
            <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
              {/* Quick search for mobile */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="sm:hidden focus:ring-2 focus:ring-laburar-sky-blue-500"
                onClick={() => setSearchOpen(true)}
                aria-label="Buscar páginas"
              >
                <Search className="w-5 h-5" />
              </Button>

              {/* Theme switcher */}
              <div className="hidden md:flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className={`p-1.5 ${themeMode === 'light' ? 'bg-white shadow-sm' : ''}`}
                  onClick={() => setThemeMode('light')}
                  aria-label="Modo claro"
                >
                  <Sun className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className={`p-1.5 ${themeMode === 'dark' ? 'bg-white shadow-sm' : ''}`}
                  onClick={() => setThemeMode('dark')}
                  aria-label="Modo oscuro"
                >
                  <Moon className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className={`p-1.5 ${themeMode === 'system' ? 'bg-white shadow-sm' : ''}`}
                  onClick={() => setThemeMode('system')}
                  aria-label="Modo sistema"
                >
                  <Monitor className="w-4 h-4" />
                </Button>
              </div>

              {/* Notifications */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative focus:ring-2 focus:ring-laburar-sky-blue-500"
                aria-label="Notificaciones"
              >
                <Bell className="w-5 h-5" />
                <motion.span 
                  className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  aria-hidden="true"
                />
                <span className="sr-only">3 notificaciones nuevas</span>
              </Button>
              
              {/* System alerts */}
              <Button 
                variant="ghost" 
                size="icon"
                className="focus:ring-2 focus:ring-yellow-500"
                aria-label="Alertas del sistema"
              >
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </Button>

              {/* System status */}
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-green-50 rounded-lg border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" aria-hidden="true" />
                <span className="text-sm font-medium text-green-700">Sistema</span>
                <Badge variant="success" className="text-xs">
                  Operativo
                </Badge>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:overflow-auto" role="main">
          <ErrorBoundary
            showErrorDetails={process.env.NODE_ENV === 'development'}
            enableRetry={true}
            onError={(error, errorInfo) => {
              console.error('Admin layout error:', error, errorInfo)
              // Here you could send to error monitoring service
            }}
          >
            {children}
          </ErrorBoundary>
        </main>
      </div>

      {/* Mobile Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-16 px-4"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-md p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center space-x-3 mb-4">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Buscar páginas del panel..."
                  className="flex-1 text-lg font-medium outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {filteredSidebarItems.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No se encontraron páginas</p>
                  </div>
                ) : (
                  filteredSidebarItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center space-x-3 p-3 rounded-lg transition-colors
                          ${isActive 
                            ? 'bg-laburar-sky-blue-50 text-laburar-sky-blue-700' 
                            : 'hover:bg-gray-50'
                          }`}
                        onClick={() => {
                          setSearchOpen(false)
                          setSearchTerm('')
                        }}
                      >
                        <Icon className={`w-5 h-5 ${isActive ? 'text-laburar-sky-blue-600' : 'text-gray-400'}`} />
                        <div className="flex-1">
                          <p className={`font-medium ${isActive ? 'text-laburar-sky-blue-900' : 'text-gray-900'}`}>
                            {item.title}
                          </p>
                          <p className={`text-sm ${isActive ? 'text-laburar-sky-blue-600' : 'text-gray-500'}`}>
                            {item.description}
                          </p>
                        </div>
                        {item.badge && (
                          <Badge variant={item.badge === 'nuevo' ? 'success' : 'warning'} className="text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    )
                  })
                )}
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500 text-center">
                Presiona <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">ESC</kbd> para cerrar
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
        </div>
      </SessionProvider>
    </AdminGuard>
  )
}