'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Shield,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  User,
  Activity,
  Clock,
  MapPin,
  Monitor,
  Smartphone,
  Globe,
  RefreshCw,
  Download,
  Settings,
  Key,
  UserCheck,
  UserX,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
  FileText,
  Zap,
  Database,
  Server,
  Wifi,
  Bug
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { DropdownMenu } from '@/components/ui/dropdown-menu'
import { Modal } from '@/components/ui/modal'

// Mock data for security analytics based on database schema
const mockSecurityData = {
  overview: {
    totalSecurityEvents: 1247,
    criticalAlerts: 12,
    securityScore: 87.3,
    failedLogins: 156,
    blockedIPs: 23,
    suspiciousActivities: 45,
    securityIncidents: 8,
    lastSecurityScan: new Date('2024-01-30T10:30:00')
  },
  recentAlerts: [
    {
      id: 1,
      type: 'FAILED_LOGIN',
      severity: 'HIGH',
      title: 'Múltiples intentos de acceso fallidos',
      description: 'Usuario maria.gonzalez@techcorp.com - 5 intentos fallidos en 10 minutos',
      timestamp: new Date('2024-01-31T14:25:00'),
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      location: 'Buenos Aires, Argentina',
      status: 'PENDING',
      userId: 1,
      metadata: {
        attemptCount: 5,
        timeWindow: '10 minutes',
        lastAttempt: '2024-01-31T14:25:00'
      }
    },
    {
      id: 2,
      type: 'SUSPICIOUS_LOCATION',
      severity: 'MEDIUM',
      title: 'Acceso desde ubicación inusual',
      description: 'Usuario carlos.mendoza@email.com acceso desde nueva ubicación',
      timestamp: new Date('2024-01-31T13:45:00'),
      ipAddress: '201.45.123.87',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
      location: 'Miami, Estados Unidos',
      status: 'INVESTIGATING',
      userId: 2,
      metadata: {
        previousLocation: 'Buenos Aires, Argentina',
        distanceKm: 6845,
        travelTime: '2 hours'
      }
    },
    {
      id: 3,
      type: 'UNUSUAL_ACTIVITY',
      severity: 'LOW',
      title: 'Actividad inusual de API',
      description: 'Picos de requests desde IP 10.0.1.55',
      timestamp: new Date('2024-01-31T12:15:00'),
      ipAddress: '10.0.1.55',
      userAgent: 'PostmanRuntime/7.32.3',
      location: 'Córdoba, Argentina',
      status: 'RESOLVED',
      userId: null,
      metadata: {
        requestCount: 1200,
        timeWindow: '1 hour',
        endpoint: '/api/projects/search'
      }
    },
    {
      id: 4,
      type: 'DATA_BREACH_ATTEMPT',
      severity: 'CRITICAL',
      title: 'Intento de acceso a datos sensibles',
      description: 'Intento de acceso no autorizado a información de usuarios',
      timestamp: new Date('2024-01-31T11:30:00'),
      ipAddress: '45.123.67.89',
      userAgent: 'python-requests/2.28.1',
      location: 'Desconocida',
      status: 'BLOCKED',
      userId: null,
      metadata: {
        targetEndpoint: '/api/users/export',
        sqlInjectionAttempt: true,
        blockedByFirewall: true
      }
    },
    {
      id: 5,
      type: 'PRIVILEGE_ESCALATION',
      severity: 'HIGH',
      title: 'Intento de escalada de privilegios',
      description: 'Usuario regular intentó acceder a funciones de admin',
      timestamp: new Date('2024-01-31T10:45:00'),
      ipAddress: '192.168.1.75',
      userAgent: 'Mozilla/5.0 (Linux; Android 12; SM-G991B)',
      location: 'Rosario, Argentina',
      status: 'INVESTIGATING',
      userId: 15,
      metadata: {
        attemptedAction: 'access_admin_panel',
        userRole: 'CLIENT',
        sessionId: 'sess_abc123def456'
      }
    }
  ],
  activityLogs: [
    {
      id: 1,
      userId: 1,
      action: 'LOGIN',
      entityType: 'USER_SESSION',
      entityId: 123,
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      metadata: {
        loginMethod: 'email_password',
        successful: true,
        sessionDuration: 3600
      },
      createdAt: new Date('2024-01-31T14:30:00'),
      user: {
        firstName: 'María',
        lastName: 'González',
        email: 'maria.gonzalez@techcorp.com',
        userType: 'CLIENT'
      }
    },
    {
      id: 2,
      userId: 2,
      action: 'UPDATE_PROFILE',
      entityType: 'USER',
      entityId: 2,
      ipAddress: '10.0.1.25',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      metadata: {
        changedFields: ['phone', 'address'],
        previousValues: {
          phone: '+54 11 1234-5678',
          address: 'Av. Corrientes 1234'
        }
      },
      createdAt: new Date('2024-01-31T13:15:00'),
      user: {
        firstName: 'Carlos',
        lastName: 'Mendoza',
        email: 'carlos.mendoza@email.com',
        userType: 'FREELANCER'
      }
    },
    {
      id: 3,
      userId: 3,
      action: 'CREATE_PROJECT',
      entityType: 'PROJECT',
      entityId: 456,
      ipAddress: '172.16.0.50',
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)',
      metadata: {
        projectTitle: 'Nuevo sitio web corporativo',
        budget: 15000,
        category: 'Desarrollo Web'
      },
      createdAt: new Date('2024-01-31T12:45:00'),
      user: {
        firstName: 'Ana',
        lastName: 'Rodríguez',
        email: 'ana.rodriguez@design.com',
        userType: 'CLIENT'
      }
    },
    {
      id: 4,
      userId: null,
      action: 'API_REQUEST',
      entityType: 'API_ENDPOINT',
      entityId: null,
      ipAddress: '203.45.67.89',
      userAgent: 'curl/7.84.0',
      metadata: {
        endpoint: '/api/categories',
        method: 'GET',
        responseCode: 200,
        responseTime: 245
      },
      createdAt: new Date('2024-01-31T12:30:00'),
      user: null
    },
    {
      id: 5,
      userId: 8,
      action: 'DELETE_PROJECT',
      entityType: 'PROJECT',
      entityId: 789,
      ipAddress: '192.168.1.200',
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
      metadata: {
        projectTitle: 'Campaña de marketing digital',
        reason: 'Cliente canceló el proyecto',
        refundIssued: true
      },
      createdAt: new Date('2024-01-31T11:20:00'),
      user: {
        firstName: 'Diego',
        lastName: 'Martín',
        email: 'diego.martin@marketing.com',
        userType: 'ADMIN'
      }
    }
  ],
  securitySettings: {
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      maxAge: 90,
      historyCount: 5
    },
    twoFactorAuth: {
      enabled: true,
      mandatory: false,
      methods: ['SMS', 'EMAIL', 'TOTP'],
      adoptionRate: 34.5
    },
    sessionSecurity: {
      maxSessionDuration: 24,
      idleTimeout: 4,
      concurrentSessions: 3,
      ipValidation: true
    },
    ipBlacklist: [
      { ip: '45.123.67.89', reason: 'Data breach attempt', blockedAt: new Date('2024-01-31T11:30:00') },
      { ip: '203.45.78.90', reason: 'Brute force attack', blockedAt: new Date('2024-01-30T15:20:00') },
      { ip: '156.78.90.12', reason: 'Suspicious activity', blockedAt: new Date('2024-01-29T09:45:00') }
    ],
    rateLimit: {
      apiCalls: 1000,
      windowMinutes: 60,
      enabled: true
    }
  },
  vulnerabilities: [
    {
      id: 1,
      type: 'OUTDATED_DEPENDENCY',
      severity: 'HIGH',
      title: 'Dependencia desactualizada detectada',
      description: 'La librería jsonwebtoken versión 8.5.1 tiene vulnerabilidades conocidas',
      affectedComponent: 'Authentication Service',
      cveId: 'CVE-2022-23529',
      discoveredAt: new Date('2024-01-30T10:00:00'),
      status: 'OPEN',
      recommendedAction: 'Actualizar a versión 9.0.0 o superior'
    },
    {
      id: 2,
      type: 'INSECURE_CONFIG',
      severity: 'MEDIUM',
      title: 'Configuración de seguridad mejorable',
      description: 'Headers de seguridad HTTP no están completamente configurados',
      affectedComponent: 'Web Server',
      cveId: null,
      discoveredAt: new Date('2024-01-29T14:30:00'),
      status: 'IN_PROGRESS',
      recommendedAction: 'Configurar CSP, HSTS y X-Frame-Options headers'
    },
    {
      id: 3,
      type: 'WEAK_ENCRYPTION',
      severity: 'LOW',
      title: 'Algoritmo de encriptación débil',
      description: 'Uso de MD5 para hash de archivos temporales',
      affectedComponent: 'File Upload Service',
      cveId: null,
      discoveredAt: new Date('2024-01-28T16:15:00'),
      status: 'RESOLVED',
      recommendedAction: 'Migrar a SHA-256 o superior'
    }
  ]
}

const severityColors = {
  LOW: 'bg-blue-100 text-blue-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800'
}

const statusColors = {
  PENDING: 'bg-gray-100 text-gray-800',
  INVESTIGATING: 'bg-blue-100 text-blue-800',
  RESOLVED: 'bg-green-100 text-green-800',
  BLOCKED: 'bg-red-100 text-red-800',
  OPEN: 'bg-red-100 text-red-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800'
}

const alertTypeIcons = {
  FAILED_LOGIN: Lock,
  SUSPICIOUS_LOCATION: MapPin,
  UNUSUAL_ACTIVITY: Activity,
  DATA_BREACH_ATTEMPT: Shield,
  PRIVILEGE_ESCALATION: UserX
}

export default function SecurityManagement() {
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    severity: 'all',
    status: 'all',
    type: 'all',
    dateRange: 'all'
  })
  const [selectedAlert, setSelectedAlert] = useState<any>(null)
  const [showAlertModal, setShowAlertModal] = useState(false)
  const [selectedLog, setSelectedLog] = useState<any>(null)
  const [showLogModal, setShowLogModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const handleRefresh = async () => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setLastUpdated(new Date())
    setIsLoading(false)
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDateShort = (date: Date | string | null) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('es-AR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSecurityScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getSecurityScoreIcon = (score: number) => {
    if (score >= 90) return CheckCircle
    if (score >= 70) return AlertTriangle
    return XCircle
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Seguridad del Sistema</h1>
          <p className="text-gray-600 mt-1">
            Monitoreo de seguridad, alertas y logs de auditoría
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-500">
            Última actualización: {lastUpdated.toLocaleTimeString()}
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar Logs
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Configuración
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Resumen', icon: Shield },
            { id: 'alerts', label: 'Alertas', icon: AlertTriangle },
            { id: 'logs', label: 'Logs de Auditoría', icon: Activity },
            { id: 'vulnerabilities', label: 'Vulnerabilidades', icon: Bug },
            { id: 'settings', label: 'Configuración', icon: Settings }
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
          {/* Security Score */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <Card className="lg:col-span-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Puntuación de Seguridad</p>
                    <div className="flex items-center space-x-3 mt-2">
                      <p className={`text-4xl font-bold ${getSecurityScoreColor(mockSecurityData.overview.securityScore)}`}>
                        {mockSecurityData.overview.securityScore}%
                      </p>
                      {(() => {
                        const ScoreIcon = getSecurityScoreIcon(mockSecurityData.overview.securityScore)
                        return ScoreIcon && <ScoreIcon className={`w-8 h-8 ${getSecurityScoreColor(mockSecurityData.overview.securityScore)}`} />
                      })()}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Basado en {mockSecurityData.overview.totalSecurityEvents} eventos analizados
                    </p>
                  </div>
                  <div className="p-4 bg-blue-100 rounded-full">
                    <Shield className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Alertas Críticas</p>
                    <p className="text-3xl font-bold text-gray-900">{mockSecurityData.overview.criticalAlerts}</p>
                    <p className="text-sm text-red-600 mt-1 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      Requieren atención
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-full">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">IPs Bloqueadas</p>
                    <p className="text-3xl font-bold text-gray-900">{mockSecurityData.overview.blockedIPs}</p>
                    <p className="text-sm text-orange-600 mt-1 flex items-center">
                      <Shield className="w-4 h-4 mr-1" />
                      Amenazas bloqueadas
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <Shield className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Security Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Intentos Fallidos</p>
                    <p className="text-2xl font-bold text-gray-900">{mockSecurityData.overview.failedLogins}</p>
                    <p className="text-sm text-gray-500 mt-1">Últimas 24h</p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <Lock className="w-5 h-5 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Actividades Sospechosas</p>
                    <p className="text-2xl font-bold text-gray-900">{mockSecurityData.overview.suspiciousActivities}</p>
                    <p className="text-sm text-gray-500 mt-1">Bajo investigación</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Eye className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Incidentes</p>
                    <p className="text-2xl font-bold text-gray-900">{mockSecurityData.overview.securityIncidents}</p>
                    <p className="text-sm text-gray-500 mt-1">Este mes</p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-full">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Último Escaneo</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatDateShort(mockSecurityData.overview.lastSecurityScan)}
                    </p>
                    <p className="text-sm text-green-600 mt-1 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Completado
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <Zap className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Alerts Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Alertas Recientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockSecurityData.recentAlerts.slice(0, 5).map((alert) => {
                  const AlertIcon = alertTypeIcons[alert.type as keyof typeof alertTypeIcons] || AlertTriangle
                  return (
                    <div key={alert.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className={`p-2 rounded-full ${
                        alert.severity === 'CRITICAL' ? 'bg-red-100' : 
                        alert.severity === 'HIGH' ? 'bg-orange-100' : 
                        alert.severity === 'MEDIUM' ? 'bg-yellow-100' : 'bg-blue-100'
                      }`}>
                        <AlertIcon className={`w-4 h-4 ${
                          alert.severity === 'CRITICAL' ? 'text-red-600' : 
                          alert.severity === 'HIGH' ? 'text-orange-600' : 
                          alert.severity === 'MEDIUM' ? 'text-yellow-600' : 'text-blue-600'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                          <Badge className={severityColors[alert.severity]} size="sm">
                            {alert.severity}
                          </Badge>
                          <Badge className={statusColors[alert.status]} size="sm">
                            {alert.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatDateShort(alert.timestamp)}
                          </span>
                          <span className="flex items-center">
                            <Globe className="w-3 h-3 mr-1" />
                            {alert.ipAddress}
                          </span>
                          <span className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {alert.location}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedAlert(alert)
                          setShowAlertModal(true)
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar alertas..."
                      className="pl-10 w-full sm:w-80"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <select
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={filters.severity}
                    onChange={(e) => setFilters({...filters, severity: e.target.value})}
                  >
                    <option value="all">Todas las severidades</option>
                    <option value="CRITICAL">Crítica</option>
                    <option value="HIGH">Alta</option>
                    <option value="MEDIUM">Media</option>
                    <option value="LOW">Baja</option>
                  </select>

                  <select
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                  >
                    <option value="all">Todos los estados</option>
                    <option value="PENDING">Pendiente</option>
                    <option value="INVESTIGATING">Investigando</option>
                    <option value="RESOLVED">Resuelto</option>
                    <option value="BLOCKED">Bloqueado</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alerts List */}
          <Card>
            <CardHeader>
              <CardTitle>Alertas de Seguridad ({mockSecurityData.recentAlerts.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-200">
                {mockSecurityData.recentAlerts.map((alert) => {
                  const AlertIcon = alertTypeIcons[alert.type as keyof typeof alertTypeIcons] || AlertTriangle
                  return (
                    <div key={alert.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start space-x-4">
                        <div className={`p-3 rounded-full ${
                          alert.severity === 'CRITICAL' ? 'bg-red-100' : 
                          alert.severity === 'HIGH' ? 'bg-orange-100' : 
                          alert.severity === 'MEDIUM' ? 'bg-yellow-100' : 'bg-blue-100'
                        }`}>
                          <AlertIcon className={`w-5 h-5 ${
                            alert.severity === 'CRITICAL' ? 'text-red-600' : 
                            alert.severity === 'HIGH' ? 'text-orange-600' : 
                            alert.severity === 'MEDIUM' ? 'text-yellow-600' : 'text-blue-600'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-medium text-gray-900">{alert.title}</h3>
                            <Badge className={severityColors[alert.severity]}>
                              {alert.severity}
                            </Badge>
                            <Badge className={statusColors[alert.status]}>
                              {alert.status}
                            </Badge>
                          </div>
                          <p className="text-gray-600 mb-3">{alert.description}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-2" />
                              <span>{formatDate(alert.timestamp)}</span>
                            </div>
                            <div className="flex items-center">
                              <Globe className="w-4 h-4 mr-2" />
                              <span>{alert.ipAddress}</span>
                            </div>
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-2" />
                              <span>{alert.location}</span>
                            </div>
                            <div className="flex items-center">
                              <Monitor className="w-4 h-4 mr-2" />
                              <span className="truncate" title={alert.userAgent}>
                                {alert.userAgent.split(' ')[0]}
                              </span>
                            </div>
                          </div>
                          {alert.metadata && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm text-gray-600">
                                <strong>Información adicional:</strong>
                              </p>
                              <div className="mt-1 text-sm text-gray-700">
                                {Object.entries(alert.metadata).map(([key, value]) => (
                                  <div key={key} className="flex justify-between">
                                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}:</span>
                                    <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedAlert(alert)
                              setShowAlertModal(true)
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <DropdownMenu
                            trigger={
                              <Button variant="ghost" size="sm">
                                <Settings className="w-4 h-4" />
                              </Button>
                            }
                            items={[
                              {
                                label: 'Marcar como resuelto',
                                onClick: () => console.log('Resolver alerta', alert.id),
                                icon: CheckCircle,
                                disabled: alert.status === 'RESOLVED'
                              },
                              {
                                label: 'Bloquear IP',
                                onClick: () => console.log('Bloquear IP', alert.ipAddress),
                                icon: Shield,
                                disabled: alert.status === 'BLOCKED'
                              },
                              {
                                label: 'Ver detalles',
                                onClick: () => {
                                  setSelectedAlert(alert)
                                  setShowAlertModal(true)
                                },
                                icon: Eye
                              }
                            ]}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Activity Logs Tab */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          {/* Logs Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar en logs..."
                      className="pl-10 w-full sm:w-80"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <select
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={filters.type}
                    onChange={(e) => setFilters({...filters, type: e.target.value})}
                  >
                    <option value="all">Todas las acciones</option>
                    <option value="LOGIN">Inicios de sesión</option>
                    <option value="UPDATE_PROFILE">Actualización de perfil</option>
                    <option value="CREATE_PROJECT">Creación de proyecto</option>
                    <option value="DELETE_PROJECT">Eliminación de proyecto</option>
                    <option value="API_REQUEST">Requests API</option>
                  </select>

                  <select
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={filters.dateRange}
                    onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
                  >
                    <option value="all">Todo el tiempo</option>
                    <option value="24h">Últimas 24 horas</option>
                    <option value="7d">Últimos 7 días</option>
                    <option value="30d">Últimos 30 días</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Logs */}
          <Card>
            <CardHeader>
              <CardTitle>Registro de Actividad ({mockSecurityData.activityLogs.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-6 font-medium text-gray-500 text-sm">Timestamp</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-500 text-sm">Usuario</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-500 text-sm">Acción</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-500 text-sm">IP Address</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-500 text-sm">Detalles</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-500 text-sm">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {mockSecurityData.activityLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6">
                          <div>
                            <p className="text-sm text-gray-900">{formatDateShort(log.createdAt)}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(log.createdAt).toLocaleTimeString('es-AR')}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {log.user ? (
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-gradient-to-r from-laburar-sky-blue-500 to-laburar-sky-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                                {log.user.firstName[0]}{log.user.lastName[0]}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {log.user.firstName} {log.user.lastName}
                                </p>
                                <p className="text-xs text-gray-500">{log.user.email}</p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">Sistema</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{log.action}</p>
                            <p className="text-xs text-gray-500">{log.entityType}</p>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm text-gray-600 font-mono">{log.ipAddress}</span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="max-w-xs truncate">
                            <p className="text-sm text-gray-600" title={log.userAgent}>
                              {log.userAgent}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedLog(log)
                              setShowLogModal(true)
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Vulnerabilities Tab */}
      {activeTab === 'vulnerabilities' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vulnerabilidades Detectadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockSecurityData.vulnerabilities.map((vuln) => (
                  <div key={vuln.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">{vuln.title}</h3>
                          <Badge className={severityColors[vuln.severity]}>
                            {vuln.severity}
                          </Badge>
                          <Badge className={statusColors[vuln.status]}>
                            {vuln.status}
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-3">{vuln.description}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                          <div>
                            <strong>Componente afectado:</strong> {vuln.affectedComponent}
                          </div>
                          <div>
                            <strong>Descubierto:</strong> {formatDate(vuln.discoveredAt)}
                          </div>
                          {vuln.cveId && (
                            <div>
                              <strong>CVE ID:</strong> {vuln.cveId}
                            </div>
                          )}
                        </div>
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>Acción recomendada:</strong> {vuln.recommendedAction}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Password Policy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="w-5 h-5 mr-2" />
                Política de Contraseñas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Longitud mínima:</span>
                    <span className="font-medium">{mockSecurityData.securitySettings.passwordPolicy.minLength} caracteres</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Requiere mayúsculas:</span>
                    {mockSecurityData.securitySettings.passwordPolicy.requireUppercase ? 
                      <CheckCircle className="w-5 h-5 text-green-600" /> : 
                      <XCircle className="w-5 h-5 text-red-600" />
                    }
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Requiere números:</span>
                    {mockSecurityData.securitySettings.passwordPolicy.requireNumbers ? 
                      <CheckCircle className="w-5 h-5 text-green-600" /> : 
                      <XCircle className="w-5 h-5 text-red-600" />
                    }
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Requiere símbolos:</span>
                    {mockSecurityData.securitySettings.passwordPolicy.requireSpecialChars ? 
                      <CheckCircle className="w-5 h-5 text-green-600" /> : 
                      <XCircle className="w-5 h-5 text-red-600" />
                    }
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Expiración:</span>
                    <span className="font-medium">{mockSecurityData.securitySettings.passwordPolicy.maxAge} días</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Historial:</span>
                    <span className="font-medium">{mockSecurityData.securitySettings.passwordPolicy.historyCount} contraseñas</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Two Factor Auth */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Smartphone className="w-5 h-5 mr-2" />
                Autenticación de Dos Factores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Estado:</span>
                  <Badge className={mockSecurityData.securitySettings.twoFactorAuth.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {mockSecurityData.securitySettings.twoFactorAuth.enabled ? 'Habilitado' : 'Deshabilitado'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Adopción:</span>
                  <span className="font-medium">{mockSecurityData.securitySettings.twoFactorAuth.adoptionRate}%</span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Métodos disponibles:</span>
                  <div className="flex space-x-2 mt-2">
                    {mockSecurityData.securitySettings.twoFactorAuth.methods.map((method) => (
                      <Badge key={method} variant="outline">{method}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Session Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Seguridad de Sesión
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Duración máxima:</span>
                    <span className="font-medium">{mockSecurityData.securitySettings.sessionSecurity.maxSessionDuration}h</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Timeout inactividad:</span>
                    <span className="font-medium">{mockSecurityData.securitySettings.sessionSecurity.idleTimeout}h</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Sesiones concurrentes:</span>
                    <span className="font-medium">{mockSecurityData.securitySettings.sessionSecurity.concurrentSessions}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Validación IP:</span>
                    {mockSecurityData.securitySettings.sessionSecurity.ipValidation ? 
                      <CheckCircle className="w-5 h-5 text-green-600" /> : 
                      <XCircle className="w-5 h-5 text-red-600" />
                    }
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* IP Blacklist */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                IPs Bloqueadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockSecurityData.securitySettings.ipBlacklist.map((blocked, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 font-mono">{blocked.ip}</p>
                      <p className="text-sm text-gray-600">{blocked.reason}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{formatDateShort(blocked.blockedAt)}</p>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                        Desbloquear
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alert Detail Modal */}
      {showAlertModal && selectedAlert && (
        <Modal
          isOpen={showAlertModal}
          onClose={() => setShowAlertModal(false)}
          title={`Alerta de Seguridad #${selectedAlert.id}`}
          size="large"
        >
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <Badge className={severityColors[selectedAlert.severity]}>
                {selectedAlert.severity}
              </Badge>
              <Badge className={statusColors[selectedAlert.status]}>
                {selectedAlert.status}
              </Badge>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">{selectedAlert.title}</h3>
              <p className="text-gray-600">{selectedAlert.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Información técnica</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">IP Address:</span>
                    <span className="font-mono">{selectedAlert.ipAddress}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ubicación:</span>
                    <span>{selectedAlert.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Timestamp:</span>
                    <span>{formatDate(selectedAlert.timestamp)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">User Agent</h4>
                <p className="text-sm text-gray-600 break-all">{selectedAlert.userAgent}</p>
              </div>
            </div>

            {selectedAlert.metadata && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Metadatos</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(selectedAlert.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="outline">Marcar como resuelto</Button>
              <Button variant="outline">Bloquear IP</Button>
              <Button onClick={() => setShowAlertModal(false)}>Cerrar</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Log Detail Modal */}
      {showLogModal && selectedLog && (
        <Modal
          isOpen={showLogModal}
          onClose={() => setShowLogModal(false)}
          title={`Log de Actividad #${selectedLog.id}`}
          size="large"
        >
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Acción: {selectedLog.action}</h3>
              <p className="text-gray-600">Tipo de entidad: {selectedLog.entityType}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Usuario</h4>
                {selectedLog.user ? (
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-laburar-sky-blue-500 to-laburar-sky-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {selectedLog.user.firstName[0]}{selectedLog.user.lastName[0]}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {selectedLog.user.firstName} {selectedLog.user.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{selectedLog.user.email}</p>
                      <Badge className={selectedLog.user.userType === 'CLIENT' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'} size="sm">
                        {selectedLog.user.userType}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Sistema</p>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Información técnica</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">IP Address:</span>
                    <span className="font-mono">{selectedLog.ipAddress}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Timestamp:</span>
                    <span>{formatDate(selectedLog.createdAt)}</span>
                  </div>
                  {selectedLog.entityId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Entity ID:</span>
                      <span>{selectedLog.entityId}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">User Agent</h4>
              <p className="text-sm text-gray-600 break-all">{selectedLog.userAgent}</p>
            </div>

            {selectedLog.metadata && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Metadatos</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button onClick={() => setShowLogModal(false)}>Cerrar</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}