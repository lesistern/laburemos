'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  FileText,
  Search,
  Filter,
  Calendar,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Briefcase,
  Star,
  BarChart3,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  Settings,
  Target,
  Zap,
  Globe
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

// Mock data for reports based on database schema
const mockReportsData = {
  overview: {
    totalUsers: 1247,
    totalProjects: 892,
    totalRevenue: 2845000,
    activeUsers: 234,
    completionRate: 87.3,
    averageRating: 4.7,
    lastMonth: {
      newUsers: 89,
      newProjects: 156,
      revenue: 340000,
      activeUsers: 198
    }
  },
  userMetrics: {
    totalUsers: 1247,
    newUsersThisMonth: 89,
    activeUsers: 234,
    clientsCount: 672,
    freelancersCount: 563,
    adminCount: 12,
    verifiedUsers: 1089,
    userGrowthRate: 12.5,
    retentionRate: 78.4,
    averageSessionDuration: 24.7
  },
  projectMetrics: {
    totalProjects: 892,
    activeProjects: 156,
    completedProjects: 645,
    cancelledProjects: 67,
    disputedProjects: 24,
    averageProjectValue: 3186.75,
    projectCompletionRate: 87.3,
    averageCompletionTime: 12.4,
    onTimeDeliveryRate: 89.2
  },
  financialMetrics: {
    totalRevenue: 2845000,
    monthlyRevenue: 340000,
    totalPayouts: 2560000,
    platformFees: 285000,
    pendingPayments: 156000,
    averageTransactionValue: 2186.30,
    paymentSuccessRate: 98.2,
    refundRate: 2.1
  },
  categoryData: [
    { name: 'Desarrollo Web', projects: 234, revenue: 875000, avgValue: 3740, growth: 15.2 },
    { name: 'Diseño Gráfico', projects: 189, revenue: 425000, avgValue: 2249, growth: 8.7 },
    { name: 'Marketing Digital', projects: 156, revenue: 620000, avgValue: 3974, growth: 22.1 },
    { name: 'Redacción', projects: 98, revenue: 186000, avgValue: 1898, growth: 5.3 },
    { name: 'Desarrollo Móvil', projects: 87, revenue: 485000, avgValue: 5575, growth: 28.4 },
    { name: 'Consultoría', projects: 65, revenue: 325000, avgValue: 5000, growth: 12.8 },
    { name: 'Traducción', projects: 63, revenue: 95000, avgValue: 1508, growth: -2.1 }
  ],
  topPerformers: {
    freelancers: [
      { id: 1, name: 'Carlos Mendoza', projects: 32, earnings: 285000, rating: 4.9, completionRate: 95.5 },
      { id: 2, name: 'Ana Rodríguez', projects: 28, earnings: 245000, rating: 4.8, completionRate: 92.3 },
      { id: 3, name: 'Diego Martín', projects: 25, earnings: 235000, rating: 4.7, completionRate: 88.9 },
      { id: 4, name: 'Lucía Fernández', projects: 22, earnings: 198000, rating: 4.9, completionRate: 94.1 },
      { id: 5, name: 'Alejandro Ruiz', projects: 19, earnings: 175000, rating: 4.6, completionRate: 87.4 }
    ],
    clients: [
      { id: 1, name: 'TechCorp SA', projects: 15, spent: 125000, avgRating: 4.8 },
      { id: 2, name: 'Startup Innovadora', projects: 12, spent: 89000, avgRating: 4.6 },
      { id: 3, name: 'E-commerce Plus', projects: 11, spent: 76000, avgRating: 4.7 },
      { id: 4, name: 'Digital Agency', projects: 9, spent: 68000, avgRating: 4.5 },
      { id: 5, name: 'Marketing Pro', projects: 8, spent: 55000, avgRating: 4.4 }
    ]
  },
  monthlyTrends: [
    { month: 'Jul 2023', users: 1034, projects: 98, revenue: 185000 },
    { month: 'Ago 2023', users: 1067, projects: 112, revenue: 210000 },
    { month: 'Sep 2023', users: 1089, projects: 125, revenue: 235000 },
    { month: 'Oct 2023', users: 1123, projects: 134, revenue: 252000 },
    { month: 'Nov 2023', users: 1156, projects: 128, revenue: 241000 },
    { month: 'Dic 2023', users: 1178, projects: 145, revenue: 275000 },
    { month: 'Ene 2024', users: 1247, projects: 156, revenue: 340000 }
  ],
  supportMetrics: {
    totalTickets: 234,
    openTickets: 18,
    resolvedTickets: 198,
    closedTickets: 216,
    averageResponseTime: 4.2,
    averageResolutionTime: 24.8,
    customerSatisfaction: 4.6,
    ticketsByCategory: [
      { category: 'Pagos', count: 67, percentage: 28.6 },
      { category: 'Técnico', count: 54, percentage: 23.1 },
      { category: 'Cuenta', count: 43, percentage: 18.4 },
      { category: 'Proyectos', count: 38, percentage: 16.2 },
      { category: 'Otros', count: 32, percentage: 13.7 }
    ]
  }
}

export default function ReportsManagement() {
  const [activeTab, setActiveTab] = useState('overview')
  const [dateRange, setDateRange] = useState('30')
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const handleRefresh = async () => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setLastUpdated(new Date())
    setIsLoading(false)
  }

  const handleExport = (reportType: string) => {
    console.log(`Exportando reporte: ${reportType}`)
    // Implementar lógica de exportación
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

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-AR').format(num)
  }

  const getGrowthColor = (growth: number) => {
    return growth > 0 ? 'text-green-600' : growth < 0 ? 'text-red-600' : 'text-gray-600'
  }

  const getGrowthIcon = (growth: number) => {
    return growth > 0 ? ArrowUpRight : growth < 0 ? ArrowDownRight : null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reportes y Analíticas</h1>
          <p className="text-gray-600 mt-1">
            Análisis detallado del rendimiento de la plataforma
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-500">
            Última actualización: {lastUpdated.toLocaleTimeString()}
          </div>
          <select
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="7">Últimos 7 días</option>
            <option value="30">Últimos 30 días</option>
            <option value="90">Últimos 90 días</option>
            <option value="365">Último año</option>
          </select>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('all')}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Resumen General', icon: BarChart3 },
            { id: 'users', label: 'Usuarios', icon: Users },
            { id: 'projects', label: 'Proyectos', icon: Briefcase },
            { id: 'financial', label: 'Financiero', icon: DollarSign },
            { id: 'performance', label: 'Rendimiento', icon: Target },
            { id: 'support', label: 'Soporte', icon: Activity }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-laburar-sky-blue-500 text-laburar-sky-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
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
                    <p className="text-blue-100 text-sm font-medium">Total Usuarios</p>
                    <p className="text-3xl font-bold">{formatNumber(mockReportsData.overview.totalUsers)}</p>
                    <p className="text-blue-100 text-sm mt-1 flex items-center">
                      <ArrowUpRight className="w-4 h-4 mr-1" />
                      +{mockReportsData.overview.lastMonth.newUsers} este mes
                    </p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-full">
                    <Users className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Ingresos Totales</p>
                    <p className="text-3xl font-bold">{formatCurrency(mockReportsData.overview.totalRevenue)}</p>
                    <p className="text-green-100 text-sm mt-1 flex items-center">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      {formatCurrency(mockReportsData.overview.lastMonth.revenue)} este mes
                    </p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-full">
                    <DollarSign className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Proyectos Totales</p>
                    <p className="text-3xl font-bold">{formatNumber(mockReportsData.overview.totalProjects)}</p>
                    <p className="text-purple-100 text-sm mt-1 flex items-center">
                      <Briefcase className="w-4 h-4 mr-1" />
                      +{mockReportsData.overview.lastMonth.newProjects} este mes
                    </p>
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
                    <p className="text-orange-100 text-sm font-medium">Tasa de Finalización</p>
                    <p className="text-3xl font-bold">{mockReportsData.overview.completionRate}%</p>
                    <p className="text-orange-100 text-sm mt-1 flex items-center">
                      <Star className="w-4 h-4 mr-1" />
                      {mockReportsData.overview.averageRating} rating promedio
                    </p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-full">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Tendencias Mensuales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockReportsData.monthlyTrends.slice(-6).map((month, index) => (
                    <div key={month.month} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{month.month}</span>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">{formatCurrency(month.revenue)}</p>
                          <p className="text-xs text-gray-500">{month.projects} proyectos</p>
                        </div>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-laburar-sky-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(month.revenue / 350000) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="w-5 h-5 mr-2" />
                  Distribución por Categorías
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockReportsData.categoryData.slice(0, 5).map((category, index) => (
                    <div key={category.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full bg-${['blue', 'green', 'purple', 'yellow', 'red'][index]}-500`}></div>
                        <span className="text-sm text-gray-600">{category.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{category.projects} proyectos</p>
                        <p className="text-xs text-gray-500">{formatCurrency(category.revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Performers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="w-5 h-5 mr-2" />
                  Top Freelancers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockReportsData.topPerformers.freelancers.slice(0, 5).map((freelancer, index) => (
                    <div key={freelancer.id} className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full text-white font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{freelancer.name}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>{freelancer.projects} proyectos</span>
                          <span className="flex items-center">
                            <Star className="w-3 h-3 mr-1 text-yellow-500" />
                            {freelancer.rating}
                          </span>
                          <span>{freelancer.completionRate}% completado</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(freelancer.earnings)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="w-5 h-5 mr-2" />
                  Top Clientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockReportsData.topPerformers.clients.slice(0, 5).map((client, index) => (
                    <div key={client.id} className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full text-white font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{client.name}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>{client.projects} proyectos</span>
                          <span className="flex items-center">
                            <Star className="w-3 h-3 mr-1 text-yellow-500" />
                            {client.avgRating}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(client.spent)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Usuarios totales</p>
                    <p className="text-3xl font-bold text-gray-900">{formatNumber(mockReportsData.userMetrics.totalUsers)}</p>
                    <p className={`text-sm mt-1 flex items-center ${getGrowthColor(mockReportsData.userMetrics.userGrowthRate)}`}>
                      <ArrowUpRight className="w-4 h-4 mr-1" />
                      {formatPercentage(mockReportsData.userMetrics.userGrowthRate)}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Usuarios activos</p>
                    <p className="text-3xl font-bold text-gray-900">{formatNumber(mockReportsData.userMetrics.activeUsers)}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {((mockReportsData.userMetrics.activeUsers / mockReportsData.userMetrics.totalUsers) * 100).toFixed(1)}% del total
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <Activity className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Tasa de retención</p>
                    <p className="text-3xl font-bold text-gray-900">{mockReportsData.userMetrics.retentionRate}%</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Usuarios que regresan
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Target className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Sesión promedio</p>
                    <p className="text-3xl font-bold text-gray-900">{mockReportsData.userMetrics.averageSessionDuration}m</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Duración en minutos
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* User Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribución de usuarios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Clientes</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">{formatNumber(mockReportsData.userMetrics.clientsCount)}</span>
                      <p className="text-xs text-gray-500">
                        {((mockReportsData.userMetrics.clientsCount / mockReportsData.userMetrics.totalUsers) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Freelancers</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">{formatNumber(mockReportsData.userMetrics.freelancersCount)}</span>
                      <p className="text-xs text-gray-500">
                        {((mockReportsData.userMetrics.freelancersCount / mockReportsData.userMetrics.totalUsers) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Administradores</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">{formatNumber(mockReportsData.userMetrics.adminCount)}</span>
                      <p className="text-xs text-gray-500">
                        {((mockReportsData.userMetrics.adminCount / mockReportsData.userMetrics.totalUsers) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estado de verificación</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-gray-600">Usuarios verificados</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">{formatNumber(mockReportsData.userMetrics.verifiedUsers)}</span>
                      <p className="text-xs text-gray-500">
                        {((mockReportsData.userMetrics.verifiedUsers / mockReportsData.userMetrics.totalUsers) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                      <span className="text-sm text-gray-600">Pendientes de verificación</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">{formatNumber(mockReportsData.userMetrics.totalUsers - mockReportsData.userMetrics.verifiedUsers)}</span>
                      <p className="text-xs text-gray-500">
                        {(((mockReportsData.userMetrics.totalUsers - mockReportsData.userMetrics.verifiedUsers) / mockReportsData.userMetrics.totalUsers) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Projects Tab */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Proyectos totales</p>
                    <p className="text-3xl font-bold text-gray-900">{formatNumber(mockReportsData.projectMetrics.totalProjects)}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatCurrency(mockReportsData.projectMetrics.averageProjectValue)} promedio
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Briefcase className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Tasa de finalización</p>
                    <p className="text-3xl font-bold text-gray-900">{mockReportsData.projectMetrics.projectCompletionRate}%</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatNumber(mockReportsData.projectMetrics.completedProjects)} completados
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Entrega a tiempo</p>
                    <p className="text-3xl font-bold text-gray-900">{mockReportsData.projectMetrics.onTimeDeliveryRate}%</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {mockReportsData.projectMetrics.averageCompletionTime} días promedio
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Clock className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Proyectos activos</p>
                    <p className="text-3xl font-bold text-gray-900">{formatNumber(mockReportsData.projectMetrics.activeProjects)}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {mockReportsData.projectMetrics.disputedProjects} en disputa
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <Activity className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Category Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento por categoría</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Categoría</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Proyectos</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Ingresos</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Valor promedio</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Crecimiento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {mockReportsData.categoryData.map((category) => {
                      const GrowthIcon = getGrowthIcon(category.growth)
                      return (
                        <tr key={category.name} className="hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-900">{category.name}</td>
                          <td className="py-3 px-4 text-gray-600">{formatNumber(category.projects)}</td>
                          <td className="py-3 px-4 text-gray-600">{formatCurrency(category.revenue)}</td>
                          <td className="py-3 px-4 text-gray-600">{formatCurrency(category.avgValue)}</td>
                          <td className="py-3 px-4">
                            <div className={`flex items-center ${getGrowthColor(category.growth)}`}>
                              {GrowthIcon && <GrowthIcon className="w-4 h-4 mr-1" />}
                              <span className="font-medium">{formatPercentage(category.growth)}</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Financial Tab */}
      {activeTab === 'financial' && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Ingresos totales</p>
                    <p className="text-3xl font-bold text-gray-900">{formatCurrency(mockReportsData.financialMetrics.totalRevenue)}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatCurrency(mockReportsData.financialMetrics.monthlyRevenue)} este mes
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Comisiones plataforma</p>
                    <p className="text-3xl font-bold text-gray-900">{formatCurrency(mockReportsData.financialMetrics.platformFees)}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {((mockReportsData.financialMetrics.platformFees / mockReportsData.financialMetrics.totalRevenue) * 100).toFixed(1)}% del total
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Pagos procesados</p>
                    <p className="text-3xl font-bold text-gray-900">{formatCurrency(mockReportsData.financialMetrics.totalPayouts)}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {mockReportsData.financialMetrics.paymentSuccessRate}% éxito
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Pagos pendientes</p>
                    <p className="text-3xl font-bold text-gray-900">{formatCurrency(mockReportsData.financialMetrics.pendingPayments)}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {mockReportsData.financialMetrics.refundRate}% tasa reembolso
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Financial Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Flujo de ingresos mensual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockReportsData.monthlyTrends.slice(-6).map((month) => (
                    <div key={month.month} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{month.month}</span>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium">{formatCurrency(month.revenue)}</span>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(month.revenue / 350000) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribución de ingresos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Pagos a freelancers</span>
                    </div>
                    <span className="font-semibold">{formatCurrency(mockReportsData.financialMetrics.totalPayouts)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Comisiones plataforma</span>
                    </div>
                    <span className="font-semibold">{formatCurrency(mockReportsData.financialMetrics.platformFees)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Pagos pendientes</span>
                    </div>
                    <span className="font-semibold">{formatCurrency(mockReportsData.financialMetrics.pendingPayments)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Rating promedio</p>
                    <p className="text-3xl font-bold text-gray-900 flex items-center">
                      {mockReportsData.overview.averageRating}
                      <Star className="w-6 h-6 text-yellow-500 ml-2" />
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Satisfacción general
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <Star className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Tasa de finalización</p>
                    <p className="text-3xl font-bold text-gray-900">{mockReportsData.projectMetrics.projectCompletionRate}%</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Proyectos completados
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Tiempo promedio</p>
                    <p className="text-3xl font-bold text-gray-900">{mockReportsData.projectMetrics.averageCompletionTime}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      días para completar
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Entrega puntual</p>
                    <p className="text-3xl font-bold text-gray-900">{mockReportsData.projectMetrics.onTimeDeliveryRate}%</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Proyectos a tiempo
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Zap className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Performance by Category */}
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento por categoría</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {mockReportsData.categoryData.slice(0, 5).map((category, index) => (
                  <div key={category.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full bg-${['blue', 'green', 'purple', 'yellow', 'red'][index]}-500`}></div>
                      <div>
                        <p className="font-medium text-gray-900">{category.name}</p>
                        <p className="text-sm text-gray-500">{category.projects} proyectos</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatCurrency(category.avgValue)}</p>
                        <p className="text-xs text-gray-500">Valor promedio</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className={`bg-${['blue', 'green', 'purple', 'yellow', 'red'][index]}-500 h-2 rounded-full transition-all duration-300`}
                            style={{ width: `${Math.min((category.avgValue / 6000) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <span className={`text-sm font-medium ${getGrowthColor(category.growth)}`}>
                          {formatPercentage(category.growth)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Support Tab */}
      {activeTab === 'support' && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Tickets totales</p>
                    <p className="text-3xl font-bold text-gray-900">{formatNumber(mockReportsData.supportMetrics.totalTickets)}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {mockReportsData.supportMetrics.openTickets} abiertos
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Activity className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Tiempo de respuesta</p>
                    <p className="text-3xl font-bold text-gray-900">{mockReportsData.supportMetrics.averageResponseTime}h</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Promedio de respuesta
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <Clock className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Tiempo de resolución</p>
                    <p className="text-3xl font-bold text-gray-900">{mockReportsData.supportMetrics.averageResolutionTime}h</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Promedio de resolución
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <CheckCircle className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Satisfacción</p>
                    <p className="text-3xl font-bold text-gray-900 flex items-center">
                      {mockReportsData.supportMetrics.customerSatisfaction}
                      <Star className="w-6 h-6 text-yellow-500 ml-2" />
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Rating promedio
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <Star className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Support Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tickets por categoría</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockReportsData.supportMetrics.ticketsByCategory.map((category, index) => (
                    <div key={category.category} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full bg-${['blue', 'green', 'purple', 'yellow', 'red'][index]}-500`}></div>
                        <span className="text-sm text-gray-600">{category.category}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium">{category.count} tickets</span>
                        <span className="text-xs text-gray-500">{category.percentage}%</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className={`bg-${['blue', 'green', 'purple', 'yellow', 'red'][index]}-500 h-2 rounded-full transition-all duration-300`}
                            style={{ width: `${category.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estado de tickets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Resueltos</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">{formatNumber(mockReportsData.supportMetrics.resolvedTickets)}</span>
                      <p className="text-xs text-gray-500">
                        {((mockReportsData.supportMetrics.resolvedTickets / mockReportsData.supportMetrics.totalTickets) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Abiertos</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">{formatNumber(mockReportsData.supportMetrics.openTickets)}</span>
                      <p className="text-xs text-gray-500">
                        {((mockReportsData.supportMetrics.openTickets / mockReportsData.supportMetrics.totalTickets) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Cerrados</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">{formatNumber(mockReportsData.supportMetrics.closedTickets)}</span>
                      <p className="text-xs text-gray-500">
                        {((mockReportsData.supportMetrics.closedTickets / mockReportsData.supportMetrics.totalTickets) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}