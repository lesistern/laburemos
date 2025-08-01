'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Settings,
  Save,
  RefreshCw,
  Globe,
  Mail,
  Bell,
  Shield,
  Database,
  Server,
  Cloud,
  Users,
  DollarSign,
  FileText,
  Image,
  Zap,
  Key,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Upload,
  Download,
  Trash2,
  Edit,
  Plus,
  Minus,
  RotateCcw,
  HelpCircle,
  ExternalLink,
  Toggle,
  Palette,
  Type,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'

// Mock data for system settings
const mockSystemSettings = {
  general: {
    siteName: 'LaburAR',
    siteDescription: 'Plataforma freelance líder en Argentina',
    siteUrl: 'https://laburemos.com.ar',
    supportEmail: 'soporte@laburemos.com.ar',
    adminEmail: 'admin@laburemos.com.ar',
    timezone: 'America/Argentina/Buenos_Aires',
    language: 'es',
    currency: 'ARS',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    maintenanceMode: false,
    allowRegistrations: true,
    requireEmailVerification: true,
    termsUrl: '/terminos-y-condiciones',
    privacyUrl: '/politica-de-privacidad'
  },
  branding: {
    logoUrl: '/images/logo.png',
    faviconUrl: '/images/favicon.ico',
    primaryColor: '#0EA5E9',
    secondaryColor: '#64748B',
    accentColor: '#F59E0B',
    fontFamily: 'Inter',
    customCSS: '',
    headerBgColor: '#FFFFFF',
    footerBgColor: '#1F2937'
  },
  email: {
    provider: 'smtp',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUsername: 'notifications@laburemos.com.ar',
    smtpPassword: '••••••••••••',
    smtpEncryption: 'tls',
    fromEmail: 'no-reply@laburemos.com.ar',
    fromName: 'LaburAR Platform',
    templatesEnabled: true,
    sendTestEmail: false
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    inAppNotifications: true,
    notificationFrequency: 'instant', // instant, daily, weekly
    adminAlerts: true,
    systemAlerts: true,
    securityAlerts: true,
    marketingEmails: false
  },
  payments: {
    platformFeePercentage: 5.0,
    minWithdrawalAmount: 1000,
    maxWithdrawalAmount: 100000,
    withdrawalProcessingDays: 3,
    paymentGateways: [
      { name: 'MercadoPago', enabled: true, publicKey: 'TEST-••••••••', secretKey: '••••••••••••' },
      { name: 'Stripe', enabled: false, publicKey: 'pk_test_••••••••', secretKey: 'sk_test_••••••••' }
    ],
    escrowEnabled: true,
    autoReleaseDays: 7,
    currency: 'ARS',
    taxRate: 21.0
  },
  security: {
    sessionTimeout: 24,
    maxLoginAttempts: 5,
    lockoutDuration: 30,
    passwordMinLength: 8,
    passwordRequireNumbers: true,
    passwordRequireSpecialChars: true,
    passwordRequireUppercase: true,
    twoFactorEnabled: true,
    ipWhitelisting: false,
    rateLimitEnabled: true,
    rateLimitRequests: 1000,
    rateLimitWindow: 60,
    securityHeaders: true,
    sslForced: true
  },
  storage: {
    provider: 's3',
    s3Bucket: 'laburemos-files-2025',
    s3Region: 'us-east-1',
    s3AccessKey: 'AKIA••••••••••••',
    s3SecretKey: '••••••••••••••••••••',
    maxFileSize: 10, // MB
    allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'zip'],
    cdnEnabled: true,
    cdnUrl: 'https://d2ijlktcsmmfsd.cloudfront.net'
  },
  api: {
    rateLimit: 1000,
    rateLimitWindow: 60,
    apiVersioning: true,
    currentVersion: 'v1',
    deprecationNotices: true,
    cors: {
      enabled: true,
      allowedOrigins: ['https://laburemos.com.ar', 'https://www.laburemos.com.ar'],
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization']
    },
    webhooks: {
      enabled: true,
      signingSecret: '••••••••••••••••••••',
      retryAttempts: 3,
      timeout: 30
    }
  },
  analytics: {
    googleAnalyticsId: 'GA-••••••••••',
    facebookPixelId: 'FB-••••••••••',
    hotjarId: 'HJ-••••••••••',
    trackingEnabled: true,
    cookieConsent: true,
    dataRetentionDays: 365,
    anonymizeIPs: true
  },
  backup: {
    enabled: true,
    frequency: 'daily', // daily, weekly, monthly
    retention: 30, // days
    location: 's3',
    compression: true,
    encryption: true,
    lastBackup: new Date('2024-01-31T02:00:00'),
    nextBackup: new Date('2024-02-01T02:00:00')
  },
  integrations: [
    { name: 'Slack', enabled: true, status: 'connected', webhook: 'https://hooks.slack.com/••••••••' },
    { name: 'Discord', enabled: false, status: 'disconnected', webhook: '' },
    { name: 'Zapier', enabled: true, status: 'connected', apiKey: '••••••••••••' },
    { name: 'Google Workspace', enabled: true, status: 'connected', clientId: '••••••••••••' }
  ]
}

export default function SystemSettings() {
  const [activeTab, setActiveTab] = useState('general')
  const [settings, setSettings] = useState(mockSystemSettings)
  const [isLoading, setIsLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  const handleSave = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsLoading(false)
    setHasChanges(false)
    setSaveMessage('Configuración guardada exitosamente')
    setTimeout(() => setSaveMessage(''), 3000)
  }

  const handleReset = () => {
    setSettings(mockSystemSettings)
    setHasChanges(false)
    setSaveMessage('Configuración restablecida')
    setTimeout(() => setSaveMessage(''), 3000)
  }

  const updateSetting = (section: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [key]: value
      }
    }))
    setHasChanges(true)
  }

  const testEmailConnection = async () => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsLoading(false)
    setSaveMessage('Email de prueba enviado exitosamente')
    setTimeout(() => setSaveMessage(''), 3000)
  }

  const formatFileSize = (sizeInMB: number) => {
    return sizeInMB >= 1024 ? `${sizeInMB / 1024} GB` : `${sizeInMB} MB`
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configuración del Sistema</h1>
          <p className="text-gray-600 mt-1">
            Administra la configuración general de la plataforma
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {saveMessage && (
            <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-3 py-1 rounded-lg">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">{saveMessage}</span>
            </div>
          )}
          {hasChanges && (
            <Badge variant="warning" className="animate-pulse">
              Cambios sin guardar
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={handleReset} disabled={!hasChanges}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Restablecer
          </Button>
          <Button 
            size="sm" 
            onClick={handleSave} 
            disabled={!hasChanges || isLoading}
            className="bg-laburar-sky-blue-600 hover:bg-laburar-sky-blue-700"
          >
            <Save className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {[
            { id: 'general', label: 'General', icon: Settings },
            { id: 'branding', label: 'Marca', icon: Palette },
            { id: 'email', label: 'Email', icon: Mail },
            { id: 'notifications', label: 'Notificaciones', icon: Bell },
            { id: 'payments', label: 'Pagos', icon: DollarSign },
            { id: 'security', label: 'Seguridad', icon: Shield },
            { id: 'storage', label: 'Almacenamiento', icon: Database },
            { id: 'api', label: 'API', icon: Server },
            { id: 'analytics', label: 'Analíticas', icon: FileText },
            { id: 'backup', label: 'Respaldos', icon: Cloud },
            { id: 'integrations', label: 'Integraciones', icon: Zap }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 whitespace-nowrap ${
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

      {/* General Tab */}
      {activeTab === 'general' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="w-5 h-5 mr-2" />
                Configuración General del Sitio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Sitio
                  </label>
                  <Input
                    value={settings.general.siteName}
                    onChange={(e) => updateSetting('general', 'siteName', e.target.value)}
                    placeholder="Nombre de la plataforma"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL del Sitio
                  </label>
                  <Input
                    value={settings.general.siteUrl}
                    onChange={(e) => updateSetting('general', 'siteUrl', e.target.value)}
                    placeholder="https://ejemplo.com"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción del Sitio
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded-md px-3 py-2 h-24 resize-none"
                    value={settings.general.siteDescription}
                    onChange={(e) => updateSetting('general', 'siteDescription', e.target.value)}
                    placeholder="Descripción breve de la plataforma"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email de Soporte
                  </label>
                  <Input
                    type="email"
                    value={settings.general.supportEmail}
                    onChange={(e) => updateSetting('general', 'supportEmail', e.target.value)}
                    placeholder="soporte@ejemplo.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email de Administración
                  </label>
                  <Input
                    type="email"
                    value={settings.general.adminEmail}
                    onChange={(e) => updateSetting('general', 'adminEmail', e.target.value)}
                    placeholder="admin@ejemplo.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zona Horaria
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={settings.general.timezone}
                    onChange={(e) => updateSetting('general', 'timezone', e.target.value)}
                  >
                    <option value="America/Argentina/Buenos_Aires">Buenos Aires (GMT-3)</option>
                    <option value="America/New_York">Nueva York (GMT-5)</option>
                    <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
                    <option value="Europe/Madrid">Madrid (GMT+1)</option>
                    <option value="UTC">UTC (GMT+0)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Idioma Principal
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={settings.general.language}
                    onChange={(e) => updateSetting('general', 'language', e.target.value)}
                  >
                    <option value="es">Español</option>
                    <option value="en">English</option>
                    <option value="pt">Português</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Moneda
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={settings.general.currency}
                    onChange={(e) => updateSetting('general', 'currency', e.target.value)}
                  >
                    <option value="ARS">Peso Argentino (ARS)</option>
                    <option value="USD">Dólar Americano (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                    <option value="BRL">Real Brasileño (BRL)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Formato de Fecha
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={settings.general.dateFormat}
                    onChange={(e) => updateSetting('general', 'dateFormat', e.target.value)}
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Configuraciones de Acceso</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Modo de Mantenimiento</p>
                      <p className="text-sm text-gray-500">Deshabilita el acceso público al sitio</p>
                    </div>
                    <button
                      onClick={() => updateSetting('general', 'maintenanceMode', !settings.general.maintenanceMode)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.general.maintenanceMode ? 'bg-laburar-sky-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.general.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Permitir Registros</p>
                      <p className="text-sm text-gray-500">Los usuarios pueden crear nuevas cuentas</p>
                    </div>
                    <button
                      onClick={() => updateSetting('general', 'allowRegistrations', !settings.general.allowRegistrations)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.general.allowRegistrations ? 'bg-laburar-sky-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.general.allowRegistrations ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Verificación de Email</p>
                      <p className="text-sm text-gray-500">Requiere verificación al registrarse</p>
                    </div>
                    <button
                      onClick={() => updateSetting('general', 'requireEmailVerification', !settings.general.requireEmailVerification)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.general.requireEmailVerification ? 'bg-laburar-sky-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.general.requireEmailVerification ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Email Tab */}
      {activeTab === 'email' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="w-5 h-5 mr-2" />
                Configuración de Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proveedor de Email
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={settings.email.provider}
                    onChange={(e) => updateSetting('email', 'provider', e.target.value)}
                  >
                    <option value="smtp">SMTP</option>
                    <option value="sendgrid">SendGrid</option>
                    <option value="mailgun">Mailgun</option>
                    <option value="ses">Amazon SES</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Host SMTP
                  </label>
                  <Input
                    value={settings.email.smtpHost}
                    onChange={(e) => updateSetting('email', 'smtpHost', e.target.value)}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Puerto SMTP
                  </label>
                  <Input
                    type="number"
                    value={settings.email.smtpPort}
                    onChange={(e) => updateSetting('email', 'smtpPort', parseInt(e.target.value))}
                    placeholder="587"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Encriptación
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={settings.email.smtpEncryption}
                    onChange={(e) => updateSetting('email', 'smtpEncryption', e.target.value)}
                  >
                    <option value="tls">TLS</option>
                    <option value="ssl">SSL</option>
                    <option value="none">Ninguna</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Usuario SMTP
                  </label>
                  <Input
                    value={settings.email.smtpUsername}
                    onChange={(e) => updateSetting('email', 'smtpUsername', e.target.value)}
                    placeholder="usuario@gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña SMTP
                  </label>
                  <div className="relative">
                    <Input
                      type="password"
                      value={settings.email.smtpPassword}
                      onChange={(e) => updateSetting('email', 'smtpPassword', e.target.value)}
                      placeholder="••••••••••••"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Remitente
                  </label>
                  <Input
                    type="email"
                    value={settings.email.fromEmail}
                    onChange={(e) => updateSetting('email', 'fromEmail', e.target.value)}
                    placeholder="no-reply@ejemplo.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre Remitente
                  </label>
                  <Input
                    value={settings.email.fromName}
                    onChange={(e) => updateSetting('email', 'fromName', e.target.value)}
                    placeholder="Mi Plataforma"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Templates de Email</p>
                  <p className="text-sm text-gray-500">Usar plantillas personalizadas para emails</p>
                </div>
                <button
                  onClick={() => updateSetting('email', 'templatesEnabled', !settings.email.templatesEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.email.templatesEnabled ? 'bg-laburar-sky-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.email.templatesEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={testEmailConnection}
                  disabled={isLoading}
                  className="flex items-center"
                >
                  <Mail className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  {isLoading ? 'Enviando...' : 'Enviar Email de Prueba'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Configuración de Pagos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comisión de Plataforma (%)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={settings.payments.platformFeePercentage}
                    onChange={(e) => updateSetting('payments', 'platformFeePercentage', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Moneda Principal
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={settings.payments.currency}
                    onChange={(e) => updateSetting('payments', 'currency', e.target.value)}
                  >
                    <option value="ARS">Peso Argentino (ARS)</option>
                    <option value="USD">Dólar Americano (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto Mínimo de Retiro
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={settings.payments.minWithdrawalAmount}
                    onChange={(e) => updateSetting('payments', 'minWithdrawalAmount', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto Máximo de Retiro
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={settings.payments.maxWithdrawalAmount}
                    onChange={(e) => updateSetting('payments', 'maxWithdrawalAmount', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Días de Procesamiento de Retiros
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    value={settings.payments.withdrawalProcessingDays}
                    onChange={(e) => updateSetting('payments', 'withdrawalProcessingDays', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tasa de Impuestos (%)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={settings.payments.taxRate}
                    onChange={(e) => updateSetting('payments', 'taxRate', parseFloat(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Gateways de Pago</h3>
                <div className="space-y-4">
                  {settings.payments.paymentGateways.map((gateway, index) => (
                    <div key={gateway.name} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-medium text-gray-900">{gateway.name}</h4>
                          <Badge className={gateway.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {gateway.enabled ? 'Habilitado' : 'Deshabilitado'}
                          </Badge>
                        </div>
                        <button
                          onClick={() => {
                            const updated = [...settings.payments.paymentGateways]
                            updated[index].enabled = !updated[index].enabled
                            updateSetting('payments', 'paymentGateways', updated)
                          }}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            gateway.enabled ? 'bg-laburar-sky-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              gateway.enabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      {gateway.enabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Clave Pública
                            </label>
                            <Input
                              value={gateway.publicKey}
                              onChange={(e) => {
                                const updated = [...settings.payments.paymentGateways]
                                updated[index].publicKey = e.target.value
                                updateSetting('payments', 'paymentGateways', updated)
                              }}
                              placeholder="Clave pública"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Clave Secreta
                            </label>
                            <Input
                              type="password"
                              value={gateway.secretKey}
                              onChange={(e) => {
                                const updated = [...settings.payments.paymentGateways]
                                updated[index].secretKey = e.target.value
                                updateSetting('payments', 'paymentGateways', updated)
                              }}
                              placeholder="••••••••••••"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Sistema de Garantía</p>
                    <p className="text-sm text-gray-500">Retener pagos hasta completar proyecto</p>
                  </div>
                  <button
                    onClick={() => updateSetting('payments', 'escrowEnabled', !settings.payments.escrowEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.payments.escrowEnabled ? 'bg-laburar-sky-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.payments.escrowEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {settings.payments.escrowEnabled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Días para Liberación Automática
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="30"
                      value={settings.payments.autoReleaseDays}
                      onChange={(e) => updateSetting('payments', 'autoReleaseDays', parseInt(e.target.value))}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Configuración de Seguridad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timeout de Sesión (horas)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="168"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Máximo Intentos de Login
                  </label>
                  <Input
                    type="number"
                    min="3"
                    max="10"
                    value={settings.security.maxLoginAttempts}
                    onChange={(e) => updateSetting('security', 'maxLoginAttempts', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duración de Bloqueo (minutos)
                  </label>
                  <Input
                    type="number"
                    min="5"
                    max="1440"
                    value={settings.security.lockoutDuration}
                    onChange={(e) => updateSetting('security', 'lockoutDuration', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Longitud Mínima de Contraseña
                  </label>
                  <Input
                    type="number"
                    min="6"
                    max="50"
                    value={settings.security.passwordMinLength}
                    onChange={(e) => updateSetting('security', 'passwordMinLength', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Política de Contraseñas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Requiere Números</p>
                      <p className="text-sm text-gray-500">Las contraseñas deben incluir números</p>
                    </div>
                    <button
                      onClick={() => updateSetting('security', 'passwordRequireNumbers', !settings.security.passwordRequireNumbers)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.security.passwordRequireNumbers ? 'bg-laburar-sky-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.security.passwordRequireNumbers ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Requiere Símbolos</p>
                      <p className="text-sm text-gray-500">Caracteres especiales requeridos</p>
                    </div>
                    <button
                      onClick={() => updateSetting('security', 'passwordRequireSpecialChars', !settings.security.passwordRequireSpecialChars)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.security.passwordRequireSpecialChars ? 'bg-laburar-sky-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.security.passwordRequireSpecialChars ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Requiere Mayúsculas</p>
                      <p className="text-sm text-gray-500">Al menos una letra mayúscula</p>
                    </div>
                    <button
                      onClick={() => updateSetting('security', 'passwordRequireUppercase', !settings.security.passwordRequireUppercase)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.security.passwordRequireUppercase ? 'bg-laburar-sky-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.security.passwordRequireUppercase ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Autenticación 2FA</p>
                      <p className="text-sm text-gray-500">Habilitar autenticación de dos factores</p>
                    </div>
                    <button
                      onClick={() => updateSetting('security', 'twoFactorEnabled', !settings.security.twoFactorEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.security.twoFactorEnabled ? 'bg-laburar-sky-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.security.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Rate Limiting & Protecciones</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Requests por Ventana
                    </label>
                    <Input
                      type="number"
                      min="100"
                      max="10000"
                      value={settings.security.rateLimitRequests}
                      onChange={(e) => updateSetting('security', 'rateLimitRequests', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ventana de Tiempo (minutos)
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="1440"
                      value={settings.security.rateLimitWindow}
                      onChange={(e) => updateSetting('security', 'rateLimitWindow', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Rate Limiting</p>
                      <p className="text-sm text-gray-500">Limitar requests por IP</p>
                    </div>
                    <button
                      onClick={() => updateSetting('security', 'rateLimitEnabled', !settings.security.rateLimitEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.security.rateLimitEnabled ? 'bg-laburar-sky-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.security.rateLimitEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Forzar SSL</p>
                      <p className="text-sm text-gray-500">Redireccionar HTTP a HTTPS</p>
                    </div>
                    <button
                      onClick={() => updateSetting('security', 'sslForced', !settings.security.sslForced)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.security.sslForced ? 'bg-laburar-sky-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.security.sslForced ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Backup Tab */}
      {activeTab === 'backup' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Cloud className="w-5 h-5 mr-2" />
                Configuración de Respaldos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frecuencia de Respaldo
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={settings.backup.frequency}
                    onChange={(e) => updateSetting('backup', 'frequency', e.target.value)}
                  >
                    <option value="daily">Diario</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Retención (días)
                  </label>
                  <Input
                    type="number"
                    min="7"
                    max="365"
                    value={settings.backup.retention}
                    onChange={(e) => updateSetting('backup', 'retention', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ubicación de Respaldo
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={settings.backup.location}
                    onChange={(e) => updateSetting('backup', 'location', e.target.value)}
                  >
                    <option value="s3">Amazon S3</option>
                    <option value="gcs">Google Cloud Storage</option>
                    <option value="azure">Azure Blob Storage</option>
                    <option value="local">Almacenamiento Local</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Respaldos Habilitados</p>
                    <p className="text-sm text-gray-500">Crear respaldos automáticamente</p>
                  </div>
                  <button
                    onClick={() => updateSetting('backup', 'enabled', !settings.backup.enabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.backup.enabled ? 'bg-laburar-sky-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.backup.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Compresión</p>
                    <p className="text-sm text-gray-500">Comprimir archivos de respaldo</p>
                  </div>
                  <button
                    onClick={() => updateSetting('backup', 'compression', !settings.backup.compression)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.backup.compression ? 'bg-laburar-sky-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.backup.compression ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Encriptación</p>
                    <p className="text-sm text-gray-500">Encriptar archivos de respaldo</p>
                  </div>
                  <button
                    onClick={() => updateSetting('backup', 'encryption', !settings.backup.encryption)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.backup.encryption ? 'bg-laburar-sky-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.backup.encryption ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Estado de Respaldos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Último respaldo:</span>
                    <span className="font-medium">{formatDate(settings.backup.lastBackup)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Próximo respaldo:</span>
                    <span className="font-medium">{formatDate(settings.backup.nextBackup)}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Crear Respaldo Manual
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Integrations Tab */}
      {activeTab === 'integrations' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="w-5 h-5 mr-2" />
                Integraciones de Terceros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {settings.integrations.map((integration, index) => (
                  <div key={integration.name} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-laburar-sky-blue-500 to-laburar-sky-blue-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                          {integration.name[0]}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{integration.name}</h3>
                          <div className="flex items-center space-x-2">
                            <Badge className={integration.status === 'connected' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {integration.status === 'connected' ? 'Conectado' : 'Desconectado'}
                            </Badge>
                            <Badge className={integration.enabled ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
                              {integration.enabled ? 'Habilitado' : 'Deshabilitado'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            const updated = [...settings.integrations]
                            updated[index].enabled = !updated[index].enabled
                            updateSetting('integrations', '', updated)
                          }}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            integration.enabled ? 'bg-laburar-sky-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              integration.enabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {integration.enabled && (
                      <div className="mt-4 grid grid-cols-1 gap-4">
                        {integration.webhook && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Webhook URL
                            </label>
                            <Input
                              value={integration.webhook}
                              onChange={(e) => {
                                const updated = [...settings.integrations]
                                updated[index].webhook = e.target.value
                                updateSetting('integrations', '', updated)
                              }}
                              placeholder="https://..."
                            />
                          </div>
                        )}
                        {integration.apiKey && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              API Key
                            </label>
                            <Input
                              type="password"
                              value={integration.apiKey}
                              onChange={(e) => {
                                const updated = [...settings.integrations]
                                updated[index].apiKey = e.target.value
                                updateSetting('integrations', '', updated)
                              }}
                              placeholder="••••••••••••"
                            />
                          </div>
                        )}
                        {integration.clientId && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Client ID
                            </label>
                            <Input
                              value={integration.clientId}
                              onChange={(e) => {
                                const updated = [...settings.integrations]
                                updated[index].clientId = e.target.value
                                updateSetting('integrations', '', updated)
                              }}
                              placeholder="Client ID"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Nueva Integración
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Save Confirmation Modal */}
      {showSaveModal && (
        <Modal
          isOpen={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          title="Confirmar Cambios"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              ¿Estás seguro de que deseas guardar todos los cambios realizados en la configuración?
            </p>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowSaveModal(false)}>
                Cancelar
              </Button>
              <Button onClick={() => {
                setShowSaveModal(false)
                handleSave()
              }}>
                Guardar Cambios
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}