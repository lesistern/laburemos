'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  DollarSign, 
  Briefcase, 
  TrendingUp, 
  AlertCircle,
  Activity,
  Clock,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Eye,
  Calendar,
  Star,
  MessageSquare
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { AdminPageLayout, useAdminPageState } from '@/components/admin/admin-page-layout'
import { StatsCardSkeleton, TableSkeleton, LoadingSpinner, LoadingOverlay } from '@/components/ui/loading'

// Real data from LaburAR database - would come from API in production
const realStats = {
  totalUsers: 3,  // Admin + freelancer + client from database
  newUsersThisMonth: 3,
  activeProjects: 1,  // Based on sample service
  totalRevenue: 25000.00,  // Based on WordPress service price
  completedProjects: 0,
  pendingSupportTickets: 0,
  averageCompletionRate: 0,
  monthlyGrowthRate: 0
}

const realTimeStats = {
  onlineUsers: 3,  // Current active users
  activeProjects: 1,  // Active services
  todayRevenue: 0,  // No completed projects yet
  newRegistrations: 3  // Total registered users
}

const realKPIs = {
  averageProjectValue: 25000.00,  // Based on WordPress service price
  customerSatisfactionRate: 0.0,  // No reviews yet
  freelancerRetentionRate: 100.0,  // All users still active
  paymentSuccessRate: 0.0  // No payments processed yet
}

const realRecentActivity = [
  {
    id: 1,
    type: 'user_registration',
    description: 'Usuario administrador creado: Admin Sistema',
    timestamp: new Date(Date.now() - 86400000), // 1 day ago
    icon: Users,
    color: 'text-green-600'
  },
  {
    id: 2,
    type: 'user_registration',
    description: 'Freelancer registrado: Juan Pérez',
    timestamp: new Date(Date.now() - 43200000), // 12 hours ago
    icon: Users,
    color: 'text-green-600'
  },
  {
    id: 3,
    type: 'service_created',
    description: 'Nuevo servicio: Desarrollo de sitio web WordPress profesional',
    timestamp: new Date(Date.now() - 21600000), // 6 hours ago
    icon: Briefcase,
    color: 'text-blue-600'
  },
  {
    id: 4,
    type: 'user_registration',
    description: 'Cliente registrada: María González',
    timestamp: new Date(Date.now() - 10800000), // 3 hours ago
    icon: Users,
    color: 'text-green-600'
  }
]

const realTopFreelancers = [
  {
    id: 2,
    name: 'Juan Pérez',
    avatar: null,
    completedProjects: 0,
    totalEarnings: 0,
    averageRating: 0.0
  }
]

const realPopularCategories = [
  {
    id: 3,
    name: 'Programación y Tecnología',
    activeProjects: 1,
    totalProjects: 1,
    avgProjectValue: 25000
  }
]

function AdminDashboardContent() {
  const [refreshTime, setRefreshTime] = useState(new Date())
  const [statsLoading, setStatsLoading] = useState(false)
  const [activityLoading, setActivityLoading] = useState(false)
  const { 
    loading, 
    error, 
    notifications, 
    handleAsyncOperation, 
    addNotification 
  } = useAdminPageState()

  const handleRefresh = async () => {
    await handleAsyncOperation(
      async () => {
        setStatsLoading(true)
        setActivityLoading(true)
        
        // Simulate API calls
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setRefreshTime(new Date())
        setStatsLoading(false)
        setActivityLoading(false)
      },
      {
        successMessage: 'Dashboard actualizado correctamente',
        errorMessage: 'Error al actualizar el dashboard'
      }
    )
  }

  // Simulate occasional errors for demonstration
  const simulateError = () => {
    throw new Error('Error simulado para pruebas')
  }

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && !statsLoading && !activityLoading) {
        handleRefresh()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [loading, statsLoading, activityLoading])

  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      await handleAsyncOperation(
        async () => {
          // Simulate initial data loading
          await new Promise(resolve => setTimeout(resolve, 2000))
        },
        {
          loadingMessage: 'Cargando dashboard...',
          errorMessage: 'Error al cargar los datos iniciales'
        }
      )
    }

    loadInitialData()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount)
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Ahora'
    if (diffInMinutes < 60) return `hace ${diffInMinutes} min`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `hace ${diffInHours}h`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `hace ${diffInDays}d`
  }

  return (
    <>
      <LoadingOverlay 
        isVisible={loading}
        text="Cargando dashboard..."
        size="lg"
      />
      
      <div className="space-y-6">
        {/* Header with actions */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Última actualización: {refreshTime.toLocaleTimeString()}
          </div>
          <div className="flex items-center space-x-2">
            {process.env.NODE_ENV === 'development' && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={simulateError}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Simular Error
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={loading || statsLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${(loading || statsLoading) ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Real-time Stats */}
        {statsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatsCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
          >
            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Card className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white shadow-lg hover:shadow-xl transition-shadow duration-300 border-0 cursor-pointer group"
                    role="button"
                    tabIndex={0}
                    aria-label="Usuarios online: 23 usuarios activos en tiempo real">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-blue-100 text-xs sm:text-sm font-medium uppercase tracking-wide">Usuarios online</p>
                      <p className="text-2xl sm:text-3xl font-bold mt-1 group-hover:scale-105 transition-transform duration-200">{realTimeStats.onlineUsers}</p>
                      <p className="text-blue-100 text-xs sm:text-sm mt-2 flex items-center">
                        <Activity className="w-3 h-3 sm:w-4 sm:h-4 mr-1 animate-pulse" aria-hidden="true" />
                        En tiempo real
                      </p>
                    </div>
                    <div className="p-2 sm:p-3 bg-white/20 backdrop-blur-sm rounded-full group-hover:bg-white/30 transition-all duration-300 group-hover:scale-110">
                      <Users className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Card className="bg-gradient-to-br from-green-500 via-green-600 to-green-700 text-white shadow-lg hover:shadow-xl transition-shadow duration-300 border-0 cursor-pointer group"
                    role="button"
                    tabIndex={0}
                    aria-label={`Ingresos hoy: ${formatCurrency(realTimeStats.todayRevenue)}, sin datos previos`}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-green-100 text-xs sm:text-sm font-medium uppercase tracking-wide">Ingresos hoy</p>
                      <p className="text-xl sm:text-3xl font-bold mt-1 group-hover:scale-105 transition-transform duration-200">{formatCurrency(realTimeStats.todayRevenue)}</p>
                      <p className="text-green-100 text-xs sm:text-sm mt-2 flex items-center">
                        <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-green-200" aria-hidden="true" />
                        Sin datos previos
                      </p>
                    </div>
                    <div className="p-2 sm:p-3 bg-white/20 backdrop-blur-sm rounded-full group-hover:bg-white/30 transition-all duration-300 group-hover:scale-110">
                      <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Card className="bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 text-white shadow-lg hover:shadow-xl transition-shadow duration-300 border-0 cursor-pointer group"
                    role="button"
                    tabIndex={0}
                    aria-label={`Proyectos activos: ${realTimeStats.activeProjects} proyecto en progreso`}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-purple-100 text-xs sm:text-sm font-medium uppercase tracking-wide">Proyectos activos</p>
                      <p className="text-2xl sm:text-3xl font-bold mt-1 group-hover:scale-105 transition-transform duration-200">{realTimeStats.activeProjects}</p>
                      <p className="text-purple-100 text-xs sm:text-sm mt-2 flex items-center">
                        <Briefcase className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-purple-200" aria-hidden="true" />
                        En progreso
                      </p>
                    </div>
                    <div className="p-2 sm:p-3 bg-white/20 backdrop-blur-sm rounded-full group-hover:bg-white/30 transition-all duration-300 group-hover:scale-110">
                      <Briefcase className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Card className="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 text-white shadow-lg hover:shadow-xl transition-shadow duration-300 border-0 cursor-pointer group"
                    role="button"
                    tabIndex={0}
                    aria-label={`Registros hoy: ${realTimeStats.newRegistrations} usuarios registrados en total`}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-orange-100 text-xs sm:text-sm font-medium uppercase tracking-wide">Registros hoy</p>
                      <p className="text-2xl sm:text-3xl font-bold mt-1 group-hover:scale-105 transition-transform duration-200">{realTimeStats.newRegistrations}</p>
                      <p className="text-orange-100 text-xs sm:text-sm mt-2 flex items-center">
                        <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-orange-200" aria-hidden="true" />
                        Total usuarios
                      </p>
                    </div>
                    <div className="p-2 sm:p-3 bg-white/20 backdrop-blur-sm rounded-full group-hover:bg-white/30 transition-all duration-300 group-hover:scale-110">
                      <Users className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}

        {/* KPIs */}
        {statsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatsCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
          >
            <Card className="hover:shadow-md transition-all duration-300 border-gray-200 hover:border-blue-300 group cursor-pointer"
                  tabIndex={0}
                  role="button"
                  aria-label={`Valor promedio por proyecto: ${formatCurrency(realKPIs.averageProjectValue)}`}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-600 text-xs sm:text-sm font-medium mb-2 uppercase tracking-wide">Valor promedio proyecto</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 truncate">
                      {formatCurrency(realKPIs.averageProjectValue)}
                    </p>
                  </div>
                  <div className="p-2 sm:p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-all duration-300 group-hover:scale-110 shrink-0">
                    <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" aria-hidden="true" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Satisfacción del cliente</p>
                    <p className="text-2xl font-bold text-gray-900 flex items-center">
                      {realKPIs.customerSatisfactionRate.toFixed(1)}
                      <Star className="w-5 h-5 text-yellow-500 ml-1" />
                    </p>
                  </div>
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Star className="w-5 h-5 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Retención freelancers</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {realKPIs.freelancerRetentionRate.toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Tasa éxito pagos</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {realKPIs.paymentSuccessRate.toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          {activityLoading ? (
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    Actividad reciente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-start space-x-3 p-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-2"
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Activity className="w-5 h-5 mr-2" />
                      Actividad reciente
                    </CardTitle>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/admin/activity">
                        <Eye className="w-4 h-4 mr-2" />
                        Ver todo
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {realRecentActivity.map((activity, index) => {
                    const Icon = activity.icon
                    return (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                        className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className={`p-2 rounded-full bg-gray-100 ${activity.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {activity.description}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center mt-1">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatTimeAgo(activity.timestamp)}
                          </p>
                        </div>
                      </motion.div>
                    )
                  })}
                </CardContent>
              </Card>
            </motion.div>
          )}

        {/* Top Performers */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="space-y-6"
        >
          {/* Top Freelancers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="w-5 h-5 mr-2" />
                Top Freelancers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {realTopFreelancers.map((freelancer, index) => (
                <div key={freelancer.id} className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-laburar-sky-blue-500 to-laburar-sky-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {freelancer.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {freelancer.name}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>{freelancer.completedProjects} proyectos</span>
                      <span>•</span>
                      <span className="flex items-center">
                        <Star className="w-3 h-3 text-yellow-500 mr-1" />
                        {freelancer.averageRating}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(freelancer.totalEarnings)}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Popular Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Briefcase className="w-5 h-5 mr-2" />
                Categorías populares
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {realPopularCategories.map((category) => (
                <div key={category.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{category.name}</p>
                    <p className="text-xs text-gray-500">
                      {category.activeProjects} activos • {category.totalProjects} total
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(category.avgProjectValue)}
                    </p>
                    <p className="text-xs text-gray-500">Promedio</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* System Alerts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <CardTitle className="text-yellow-800">Alertas del sistema</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-700 font-medium">
                  {realStats.pendingSupportTickets} tickets de soporte - Sistema nuevo sin tickets pendientes
                </p>
                <p className="text-yellow-600 text-sm mt-1">
                  Se recomienda revisar y asignar estos tickets para mantener la calidad del servicio
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/support">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Ver tickets
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      </div>
    </>
  )
}

export default function AdminDashboard() {
  return (
    <AdminPageLayout
      pageName="Dashboard"
      pageDescription="Bienvenido al panel de administración de LaburAR"
      showBreadcrumb={true}
      breadcrumbItems={[
        { label: 'Dashboard' }
      ]}
    >
      <AdminDashboardContent />
    </AdminPageLayout>
  )
}