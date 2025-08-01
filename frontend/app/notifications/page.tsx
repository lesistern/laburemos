'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { MotionCard } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { useAuthStore } from '@/stores/auth-store'
import { 
  Bell, 
  DollarSign, 
  Star, 
  Briefcase, 
  MessageSquare,
  Settings,
  Check,
  X,
  Filter,
  Clock
} from 'lucide-react'

const notificationTypes = {
  all: 'Todas',
  project: 'Proyectos',
  payment: 'Pagos',
  review: 'Reseñas',
  message: 'Mensajes',
  system: 'Sistema',
}

const allNotifications = [
  {
    id: 1,
    title: 'Nuevo proyecto disponible',
    message: 'Un cliente está buscando un desarrollador React para un proyecto de e-commerce',
    time: 'Hace 5 minutos',
    unread: true,
    type: 'project',
    icon: Briefcase,
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-50',
  },
  {
    id: 2,
    title: 'Pago recibido',
    message: 'Has recibido $1,500 por el proyecto "Diseño de Logo para Startup"',
    time: 'Hace 2 horas',
    unread: true,
    type: 'payment',
    icon: DollarSign,
    iconColor: 'text-green-500',
    bgColor: 'bg-green-50',
  },
  {
    id: 3,
    title: 'Nueva reseña de 5 estrellas',
    message: 'Carlos Méndez te dejó una reseña excelente por tu trabajo',
    time: 'Ayer a las 15:30',
    unread: false,
    type: 'review',
    icon: Star,
    iconColor: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
  },
  {
    id: 4,
    title: 'Mensaje nuevo',
    message: 'María García te envió un mensaje sobre tu propuesta',
    time: 'Ayer a las 14:00',
    unread: false,
    type: 'message',
    icon: MessageSquare,
    iconColor: 'text-purple-500',
    bgColor: 'bg-purple-50',
  },
  {
    id: 5,
    title: 'Actualización del sistema',
    message: 'Hemos mejorado la seguridad de tu cuenta. No se requiere acción.',
    time: 'Hace 2 días',
    unread: false,
    type: 'system',
    icon: Settings,
    iconColor: 'text-gray-500',
    bgColor: 'bg-gray-50',
  },
  {
    id: 6,
    title: 'Proyecto completado',
    message: 'Has completado exitosamente el proyecto "Aplicación móvil para restaurante"',
    time: 'Hace 3 días',
    unread: false,
    type: 'project',
    icon: Check,
    iconColor: 'text-green-500',
    bgColor: 'bg-green-50',
  },
]

export default function NotificationsPage() {
  const { user, isAuthenticated } = useAuthStore()
  const [selectedType, setSelectedType] = useState('all')
  const [notifications, setNotifications] = useState(allNotifications)

  const filteredNotifications = selectedType === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === selectedType)

  const markAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, unread: false } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, unread: false }))
    )
  }

  const deleteNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  if (!isAuthenticated || !user) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <MotionCard className="p-8 text-center">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-black mb-2">Acceso Requerido</h2>
            <p className="text-black mb-4">Necesitas iniciar sesión para ver tus notificaciones.</p>
            <Button variant="gradient">Iniciar Sesión</Button>
          </MotionCard>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-bold text-black">Notificaciones</h1>
              {notifications.some(n => n.unread) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  className="gap-2"
                >
                  <Check className="h-4 w-4" />
                  Marcar todas como leídas
                </Button>
              )}
            </div>
            <p className="text-black">Mantente al día con tu actividad en LaburAR</p>
          </motion.div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <MotionCard className="p-4">
                <h3 className="font-semibold text-black mb-4 flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filtrar por tipo
                </h3>
                <nav className="space-y-2">
                  {Object.entries(notificationTypes).map(([key, label]) => {
                    const count = key === 'all' 
                      ? notifications.length 
                      : notifications.filter(n => n.type === key).length
                    
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedType(key)}
                        className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between transition-colors ${
                          selectedType === key
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span>{label}</span>
                        <span className="text-sm text-gray-500">{count}</span>
                      </button>
                    )
                  })}
                </nav>
              </MotionCard>
            </div>

            {/* Notifications List */}
            <div className="lg:col-span-3">
              {filteredNotifications.length === 0 ? (
                <MotionCard className="p-12 text-center">
                  <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No hay notificaciones
                  </h3>
                  <p className="text-gray-600">
                    {selectedType === 'all' 
                      ? 'No tienes notificaciones en este momento.'
                      : `No tienes notificaciones de tipo ${notificationTypes[selectedType as keyof typeof notificationTypes].toLowerCase()}.`
                    }
                  </p>
                </MotionCard>
              ) : (
                <div className="space-y-4">
                  {filteredNotifications.map((notification, index) => {
                    const Icon = notification.icon
                    
                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <MotionCard className={`p-6 ${notification.unread ? 'border-blue-200' : ''}`}>
                          <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-full ${notification.bgColor}`}>
                              <Icon className={`h-5 w-5 ${notification.iconColor}`} />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="font-semibold text-black flex items-center gap-2">
                                    {notification.title}
                                    {notification.unread && (
                                      <span className="inline-block w-2 h-2 bg-blue-500 rounded-full" />
                                    )}
                                  </h3>
                                  <p className="text-gray-600 mt-1">
                                    {notification.message}
                                  </p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Clock className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm text-gray-500">
                                      {notification.time}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  {notification.unread && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => markAsRead(notification.id)}
                                      className="h-8 w-8"
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => deleteNotification(notification.id)}
                                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </MotionCard>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}