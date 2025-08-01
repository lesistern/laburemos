'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  Briefcase,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  LineChart,
  Activity
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// Mock data for analytics
const mockRevenueData = {
  totalRevenue: 892340.50,
  growthRate: 15.3,
  averageTransactionValue: 1285.75,
  timeSeries: [
    { period: '2024-01', revenue: 65230, transactionCount: 52, averageValue: 1254 },
    { period: '2024-02', revenue: 78450, transactionCount: 63, averageValue: 1245 },
    { period: '2024-03', revenue: 89120, transactionCount: 71, averageValue: 1255 },
    { period: '2024-04', revenue: 95780, transactionCount: 76, averageValue: 1260 },
    { period: '2024-05', revenue: 102340, transactionCount: 84, averageValue: 1218 },
    { period: '2024-06', revenue: 118560, transactionCount: 89, averageValue: 1332 },
  ],
  byCategory: [
    { categoryName: 'Desarrollo Web', revenue: 245680, percentage: 27.5, projectCount: 156 },
    { categoryName: 'Diseño Gráfico', revenue: 178920, percentage: 20.1, projectCount: 189 },
    { categoryName: 'Marketing Digital', revenue: 156780, percentage: 17.6, projectCount: 98 },
    { categoryName: 'Desarrollo Móvil', revenue: 145230, percentage: 16.3, projectCount: 87 },
    { categoryName: 'Otros', revenue: 165730, percentage: 18.5, projectCount: 124 }
  ],
  byPaymentMethod: [
    { method: 'Stripe', revenue: 456780, percentage: 51.2, transactionCount: 287 },
    { method: 'MercadoPago', revenue: 312450, percentage: 35.0, transactionCount: 198 },
    { method: 'Transferencia', revenue: 123110, percentage: 13.8, transactionCount: 67 }
  ],
  topFreelancers: [
    { id: 1, firstName: 'Carlos', lastName: 'Mendoza', revenue: 45680, projectCount: 18, averageProjectValue: 2538 },
    { id: 2, firstName: 'Ana', lastName: 'Rodríguez', revenue: 38920, projectCount: 22, averageProjectValue: 1769 },
    { id: 3, firstName: 'Luis', lastName: 'García', revenue: 34560, projectCount: 15, averageProjectValue: 2304 }
  ]
}

const mockUserAnalytics = {
  acquisition: {
    totalNewUsers: 156,
    growthRate: 23.5,
    byUserType: {
      clients: 89,
      freelancers: 67
    },
    bySource: {
      organic: 78,
      referral: 34,
      social: 28,
      paid: 16
    }
  },
  engagement: {
    averageSessionDuration: 18.5,
    averageProjectsPerUser: 2.4,
    userRetentionRate: 78.3,
    activeUsersDaily: 234,
    activeUsersWeekly: 567,
    activeUsersMonthly: 892
  },
  activityTimeline: [
    { period: '2024-01', newRegistrations: 89, activeUsers: 456, projectsCreated: 123, projectsCompleted: 98 },
    { period: '2024-02', newRegistrations: 104, activeUsers: 523, projectsCreated: 145, projectsCompleted: 118 },
    { period: '2024-03', newRegistrations: 126, activeUsers: 587, projectsCreated: 167, projectsCompleted: 134 },
    { period: '2024-04', newRegistrations: 142, activeUsers: 634, projectsCreated: 189, projectsCompleted: 156 },
    { period: '2024-05', newRegistrations: 156, activeUsers: 689, projectsCreated: 201, projectsCompleted: 167 },
    { period: '2024-06', newRegistrations: 178, activeUsers: 734, projectsCreated: 234, projectsCompleted: 189 }
  ],
  geographicDistribution: [
    { country: 'Argentina', city: 'Buenos Aires', userCount: 456, percentage: 34.2 },
    { country: 'Argentina', city: 'Córdoba', userCount: 234, percentage: 17.5 },
    { country: 'Argentina', city: 'Rosario', userCount: 156, percentage: 11.7 },
    { country: 'Argentina', city: 'Mendoza', userCount: 123, percentage: 9.2 },
    { country: 'Argentina', city: 'Otras', userCount: 365, percentage: 27.4 }
  ]
}

const mockProjectAnalytics = {
  overview: {
    totalProjects: 1247,
    completedProjects: 892,
    activeProjects: 234,
    cancelledProjects: 121,
    averageCompletionTime: 12.5,
    completionRate: 71.5,
    averageProjectValue: 1285.75
  },
  trends: [
    { period: '2024-01', created: 145, completed: 123, cancelled: 18, averageValue: 1254, completionRate: 84.8 },
    { period: '2024-02', created: 167, completed: 134, cancelled: 22, averageValue: 1289, completionRate: 80.2 },
    { period: '2024-03', created: 189, completed: 156, cancelled: 25, averageValue: 1325, completionRate: 82.5 },
    { period: '2024-04', created: 201, completed: 167, cancelled: 19, averageValue: 1298, completionRate: 83.1 },
    { period: '2024-05', created: 234, completed: 189, cancelled: 28, averageValue: 1367, completionRate: 80.8 },
    { period: '2024-06', created: 267, completed: 234, cancelled: 23, averageValue: 1412, completionRate: 87.6 }
  ],
  byCategory: [
    { categoryName: 'Desarrollo Web', totalProjects: 234, completedProjects: 189, averageValue: 2450, averageRating: 4.7, completionRate: 80.8 },
    { categoryName: 'Diseño Gráfico', totalProjects: 189, completedProjects: 156, averageValue: 950, averageRating: 4.6, completionRate: 82.5 },
    { categoryName: 'Marketing Digital', totalProjects: 156, completedProjects: 134, averageValue: 1200, averageRating: 4.5, completionRate: 85.9 },
    { categoryName: 'Desarrollo Móvil', totalProjects: 123, completedProjects: 98, averageValue: 3200, averageRating: 4.8, completionRate: 79.7 }
  ],
  statusDistribution: {
    pending: 89,
    accepted: 145,
    inProgress: 234,
    delivered: 67,
    completed: 892,
    cancelled: 121,
    disputed: 23
  },
  valueDistribution: {
    under100: 156,
    range100to500: 345,
    range500to1000: 289,
    range1000to5000: 234,
    over5000: 123
  }
}

export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('6months')
  const [selectedMetric, setSelectedMetric] = useState('revenue')
  const [isLoading, setIsLoading] = useState(false)

  const handleRefresh = async () => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const getMonthName = (period: string) => {
    const monthNames = {
      '2024-01': 'Enero',
      '2024-02': 'Febrero', 
      '2024-03': 'Marzo',
      '2024-04': 'Abril',
      '2024-05': 'Mayo',
      '2024-06': 'Junio'
    }
    return monthNames[period as keyof typeof monthNames] || period
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analíticas Avanzadas</h1>
          <p className="text-gray-600 mt-1">
            Métricas detalladas y análisis del rendimiento de la plataforma
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <option value="7days">Últimos 7 días</option>
            <option value="30days">Últimos 30 días</option>
            <option value="3months">Últimos 3 meses</option>
            <option value="6months">Últimos 6 meses</option>
            <option value="1year">Último año</option>
          </select>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Ingresos totales</p>
                <p className="text-3xl font-bold">{formatCurrency(mockRevenueData.totalRevenue)}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span className="text-blue-100 text-sm">
                    {formatPercentage(mockRevenueData.growthRate)} vs mes anterior
                  </span>
                </div>
              </div>
              <div className="p-3 bg-white/20 rounded-full">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Usuarios activos</p>
                <p className="text-3xl font-bold">{mockUserAnalytics.engagement.activeUsersMonthly}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span className="text-green-100 text-sm">
                    {formatPercentage(mockUserAnalytics.acquisition.growthRate)} crecimiento
                  </span>
                </div>
              </div>
              <div className="p-3 bg-white/20 rounded-full">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Proyectos completados</p>
                <p className="text-3xl font-bold">{mockProjectAnalytics.overview.completedProjects}</p>
                <div className="flex items-center mt-2">
                  <Activity className="w-4 h-4 mr-1" />
                  <span className="text-purple-100 text-sm">
                    {mockProjectAnalytics.overview.completionRate.toFixed(1)}% tasa de éxito
                  </span>
                </div>
              </div>
              <div className="p-3 bg-white/20 rounded-full">
                <Briefcase className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Valor promedio proyecto</p>
                <p className="text-3xl font-bold">
                  {formatCurrency(mockRevenueData.averageTransactionValue)}
                </p>
                <div className="flex items-center mt-2">
                  <BarChart3 className="w-4 h-4 mr-1" />
                  <span className="text-orange-100 text-sm">
                    Por transacción
                  </span>
                </div>
              </div>
              <div className="p-3 bg-white/20 rounded-full">
                <BarChart3 className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trends */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <LineChart className="w-5 h-5 mr-2" />
                  Tendencia de Ingresos
                </CardTitle>
                <Button variant="ghost" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  Ver detalles
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockRevenueData.timeSeries.map((data, index) => (
                  <div key={data.period} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="font-medium text-gray-900">{getMonthName(data.period)}</p>
                        <p className="text-sm text-gray-500">{data.transactionCount} transacciones</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(data.revenue)}</p>
                      <div className="flex items-center text-sm">
                        {index > 0 && (
                          <>
                            {data.revenue > mockRevenueData.timeSeries[index - 1].revenue ? (
                              <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                            ) : (
                              <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                            )}
                            <span className={data.revenue > mockRevenueData.timeSeries[index - 1].revenue ? 'text-green-600' : 'text-red-600'}>
                              {((data.revenue - mockRevenueData.timeSeries[index - 1].revenue) / mockRevenueData.timeSeries[index - 1].revenue * 100).toFixed(1)}%
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* User Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Actividad de Usuarios
                </CardTitle>
                <Button variant="ghost" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  Ver detalles
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{mockUserAnalytics.engagement.activeUsersDaily}</p>
                    <p className="text-sm text-gray-600">Usuarios diarios</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{mockUserAnalytics.engagement.activeUsersWeekly}</p>
                    <p className="text-sm text-gray-600">Usuarios semanales</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Retención de usuarios:</span>
                    <span className="font-medium">{mockUserAnalytics.engagement.userRetentionRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Duración promedio sesión:</span>
                    <span className="font-medium">{mockUserAnalytics.engagement.averageSessionDuration} min</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Proyectos por usuario:</span>
                    <span className="font-medium">{mockUserAnalytics.engagement.averageProjectsPerUser}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3">Fuentes de registro</h4>
                  <div className="space-y-2">
                    {Object.entries(mockUserAnalytics.acquisition.bySource).map(([source, count]) => (
                      <div key={source} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 capitalize">{source}:</span>
                        <span className="font-medium">{count} usuarios</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Revenue by Category */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="w-5 h-5 mr-2" />
              Ingresos por Categoría
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockRevenueData.byCategory.map((category, index) => (
                <div key={category.categoryName} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">{category.categoryName}</h4>
                    <Badge variant="secondary">{category.percentage}%</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Ingresos:</span>
                      <span className="font-medium">{formatCurrency(category.revenue)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Proyectos:</span>
                      <span className="font-medium">{category.projectCount}</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-laburar-sky-blue-500 to-laburar-sky-blue-600 h-2 rounded-full"
                      style={{ width: `${category.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Project Analytics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Análisis de Proyectos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Project Status Distribution */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Distribución por Estado</h4>
                <div className="space-y-3">
                  {Object.entries(mockProjectAnalytics.statusDistribution).map(([status, count]) => {
                    const statusLabels: { [key: string]: string } = {
                      pending: 'Pendientes',
                      accepted: 'Aceptados',
                      inProgress: 'En progreso',
                      delivered: 'Entregados',
                      completed: 'Completados',
                      cancelled: 'Cancelados',
                      disputed: 'En disputa'
                    }
                    
                    const statusColors: { [key: string]: string } = {
                      pending: 'bg-yellow-500',
                      accepted: 'bg-blue-500',
                      inProgress: 'bg-purple-500',
                      delivered: 'bg-green-500',
                      completed: 'bg-green-600',
                      cancelled: 'bg-red-500',
                      disputed: 'bg-orange-500'
                    }

                    const percentage = (count / mockProjectAnalytics.overview.totalProjects * 100).toFixed(1)
                    
                    return (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${statusColors[status]}`}></div>
                          <span className="text-sm text-gray-700">{statusLabels[status]}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-medium">{count}</span>
                          <span className="text-sm text-gray-500 ml-2">({percentage}%)</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Project Value Distribution */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Distribución por Valor</h4>
                <div className="space-y-3">
                  {Object.entries(mockProjectAnalytics.valueDistribution).map(([range, count]) => {
                    const rangeLabels: { [key: string]: string } = {
                      under100: 'Menos de $100',
                      range100to500: '$100 - $500',
                      range500to1000: '$500 - $1,000',
                      range1000to5000: '$1,000 - $5,000',
                      over5000: 'Más de $5,000'
                    }
                    
                    const percentage = (count / mockProjectAnalytics.overview.totalProjects * 100).toFixed(1)
                    
                    return (
                      <div key={range} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{rangeLabels[range]}</span>
                        <div className="text-right">
                          <span className="font-medium">{count}</span>
                          <span className="text-sm text-gray-500 ml-2">({percentage}%)</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Top Performers */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Top Freelancers por Ingresos
              </CardTitle>
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                Ver todos
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRevenueData.topFreelancers.map((freelancer, index) => (
                <div key={freelancer.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-laburar-sky-blue-500 to-laburar-sky-blue-600 rounded-full text-white font-semibold">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {freelancer.firstName} {freelancer.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {freelancer.projectCount} proyectos completados
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(freelancer.revenue)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Promedio: {formatCurrency(freelancer.averageProjectValue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Geographic Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Distribución Geográfica de Usuarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockUserAnalytics.geographicDistribution.map((location) => (
                <div key={`${location.country}-${location.city}`} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{location.city}</h4>
                    <Badge variant="secondary">{location.percentage}%</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{location.country}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Usuarios:</span>
                    <span className="font-medium">{location.userCount}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full"
                      style={{ width: `${location.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}