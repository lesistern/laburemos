'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { MotionCard, Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { useAuthStore } from '@/stores/auth-store'
import {
  DollarSign,
  Users,
  Briefcase,
  Star,
  TrendingUp,
  MessageSquare,
  Calendar,
  Award,
  Plus,
  Eye,
  Clock,
} from 'lucide-react'
import Link from 'next/link'
import { ROUTES } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'

const stats = [
  {
    title: 'Ingresos este mes',
    value: '$12,450',
    change: '+12.5%',
    changeType: 'positive' as const,
    icon: DollarSign,
    color: 'from-green-500 to-green-600',
  },
  {
    title: 'Proyectos activos',
    value: '8',
    change: '+2',
    changeType: 'positive' as const,
    icon: Briefcase,
    color: 'from-blue-500 to-blue-600',
  },
  {
    title: 'Calificación promedio',
    value: '4.9',
    change: '+0.1',
    changeType: 'positive' as const,
    icon: Star,
    color: 'from-yellow-500 to-orange-500',
  },
  {
    title: 'Nuevos clientes',
    value: '24',
    change: '+8.2%',
    changeType: 'positive' as const,
    icon: Users,
    color: 'from-purple-500 to-purple-600',
  },
]

const recentProjects = [
  {
    id: 1,
    title: 'Desarrollo de E-commerce',
    client: 'TechStart Inc.',
    status: 'En progreso',
    dueDate: '2024-02-15',
    value: '$2,500',
    progress: 75,
  },
  {
    id: 2,
    title: 'Diseño de aplicación móvil',
    client: 'Fashion Co.',
    status: 'Revisión',
    dueDate: '2024-02-12',
    value: '$1,800',
    progress: 90,
  },
  {
    id: 3,
    title: 'Campaña de marketing digital',
    client: 'EcoLife',
    status: 'Completado',
    dueDate: '2024-02-08',
    value: '$950',
    progress: 100,
  },
]

const recentMessages = [
  {
    id: 1,
    from: 'Ana Martínez',
    subject: 'Revisión del diseño',
    time: 'hace 2h',
    unread: true,
  },
  {
    id: 2,
    from: 'Carlos Ruiz',
    subject: 'Nuevo proyecto disponible',
    time: 'hace 4h',
    unread: true,
  },
  {
    id: 3,
    from: 'Lucía Fernández',
    subject: 'Pago procesado',
    time: 'hace 1d',
    unread: false,
  },
]

export default function DashboardPage() {
  const { user } = useAuthStore()

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Acceso requerido</h2>
          <p className="text-gray-600 mb-4">Necesitas iniciar sesión para ver el dashboard.</p>
          <Button asChild>
            <Link href={ROUTES.HOME}>Volver al inicio</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Check if user is new (no real data) - use email as indicator for demo
  const isNewUser = user.email === 'lesistern@gmail.com'
  const isClient = user.role === 'client'

  // Define stats based on user type and status
  const getStatsForUser = () => {
    if (isNewUser && isClient) {
      return [
        {
          title: 'Proyectos activos',
          value: '0',
          change: 'Nuevo usuario',
          changeType: 'neutral' as const,
          icon: Briefcase,
          color: 'from-blue-500 to-blue-600',
        },
        {
          title: 'Presupuesto disponible',
          value: '$0',
          change: 'Configurar wallet',
          changeType: 'neutral' as const,
          icon: DollarSign,
          color: 'from-green-500 to-green-600',
        },
        {
          title: 'Freelancers contactados',
          value: '0',
          change: 'Empezar búsqueda',
          changeType: 'neutral' as const,
          icon: Users,
          color: 'from-purple-500 to-purple-600',
        },
        {
          title: 'Perfil completado',
          value: '20%',
          change: 'Completar perfil',
          changeType: 'neutral' as const,
          icon: Star,
          color: 'from-yellow-500 to-orange-500',
        },
      ]
    } else if (isNewUser && !isClient) {
      // New freelancers see freelancer + client stats
      return [
        {
          title: 'Servicios ofrecidos',
          value: '0',
          change: 'Crear primer servicio',
          changeType: 'neutral' as const,
          icon: Briefcase,
          color: 'from-blue-500 to-blue-600',
        },
        {
          title: 'Ingresos este mes',
          value: '$0',
          change: 'Comenzar a vender',
          changeType: 'neutral' as const,
          icon: DollarSign,
          color: 'from-green-500 to-green-600',
        },
        {
          title: 'Clientes/Proyectos',
          value: '0',
          change: 'Obtener primeros trabajos',
          changeType: 'neutral' as const,
          icon: Users,
          color: 'from-purple-500 to-purple-600',
        },
        {
          title: 'Calificación',
          value: 'N/A',
          change: 'Sin calificaciones aún',
          changeType: 'neutral' as const,
          icon: Star,
          color: 'from-yellow-500 to-orange-500',
        },
      ]
    } else if (!isNewUser && !isClient) {
      // Established freelancers get full freelancer + client dashboard
      return [
        {
          title: 'Ingresos este mes',
          value: '$12,450',
          change: '+12.5%',
          changeType: 'positive' as const,
          icon: DollarSign,
          color: 'from-green-500 to-green-600',
        },
        {
          title: 'Servicios activos',
          value: '8',
          change: '+2',
          changeType: 'positive' as const,
          icon: Briefcase,
          color: 'from-blue-500 to-blue-600',
        },
        {
          title: 'Calificación promedio',
          value: '4.9',
          change: '+0.1',
          changeType: 'positive' as const,
          icon: Star,
          color: 'from-yellow-500 to-orange-500',
        },
        {
          title: 'Clientes totales',
          value: '24',
          change: '+8.2%',
          changeType: 'positive' as const,
          icon: Users,
          color: 'from-purple-500 to-purple-600',
        },
      ]
    } else {
      // Established clients - return existing stats
      return stats
    }
  }

  const userStats = getStatsForUser()

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              ¡Hola, {user.firstName}! 👋
            </h1>
            <p className="text-gray-600">
              {isNewUser 
                ? `Bienvenido a LaburAR. ${isClient ? 'Comienza publicando tu primer proyecto.' : 'Comienza creando tu primer servicio.'}`
                : 'Aquí tienes un resumen de tu actividad reciente.'
              }
            </p>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            {userStats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                >
                  <MotionCard className="p-6 bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">
                          {stat.title}
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {stat.value}
                        </p>
                        <p className={`text-sm flex items-center mt-1 ${
                          stat.changeType === 'positive' 
                            ? 'text-green-600' 
                            : stat.changeType === 'neutral'
                            ? 'text-gray-500'
                            : 'text-red-600'
                        }`}>
                          {stat.changeType === 'positive' ? (
                            <TrendingUp className="w-4 h-4 mr-1" />
                          ) : stat.changeType === 'neutral' ? (
                            <Clock className="w-4 h-4 mr-1" />
                          ) : (
                            <TrendingUp className="w-4 h-4 mr-1 rotate-180" />
                          )}
                          {stat.change}
                        </p>
                      </div>
                      <div className={`p-3 rounded-lg bg-gradient-to-r ${stat.color}`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </MotionCard>
                </motion.div>
              )
            })}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Projects or Getting Started */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="lg:col-span-2"
            >
              <Card className="bg-white">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Briefcase className="w-5 h-5 mr-2" />
                      {isNewUser 
                        ? (isClient ? 'Primeros pasos como cliente' : 'Primeros pasos como freelancer')
                        : 'Proyectos recientes'
                      }
                    </CardTitle>
                    {!isNewUser && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={ROUTES.PROJECTS}>
                          <Eye className="w-4 h-4 mr-2" />
                          Ver todos
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isNewUser ? (
                    <div className="space-y-4">
                      {isClient ? (
                        // Getting started steps for clients
                        <>
                          <div className="flex items-start p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-center justify-center w-8 h-8 bg-laburar-sky-blue-100 text-laburar-sky-blue-600 rounded-full mr-4 mt-1">
                              <span className="text-sm font-semibold">1</span>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-1">Completa tu perfil</h4>
                              <p className="text-sm text-gray-600 mb-2">
                                Agrega información sobre tu empresa y el tipo de proyectos que necesitas.
                              </p>
                              <Button size="sm" variant="outline" asChild>
                                <Link href={ROUTES.PROFILE}>Completar perfil</Link>
                              </Button>
                            </div>
                          </div>
                          
                          <div className="flex items-start p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-500 rounded-full mr-4 mt-1">
                              <span className="text-sm font-semibold">2</span>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-1">Explora las categorías</h4>
                              <p className="text-sm text-gray-600 mb-2">
                                Busca freelancers y servicios que se adapten a tus necesidades.
                              </p>
                              <Button size="sm" variant="outline" asChild>
                                <Link href={"/categories"}>Ver categorías</Link>
                              </Button>
                            </div>
                          </div>

                          <div className="flex items-start p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-500 rounded-full mr-4 mt-1">
                              <span className="text-sm font-semibold">3</span>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-1">Publica tu primer proyecto</h4>
                              <p className="text-sm text-gray-600 mb-2">
                                Describe tu proyecto y recibe propuestas de freelancers calificados.
                              </p>
                              <Button size="sm" variant="gradient">
                                Publicar proyecto
                              </Button>
                            </div>
                          </div>
                        </>
                      ) : (
                        // Getting started steps for freelancers
                        <>
                          <div className="flex items-start p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-center justify-center w-8 h-8 bg-laburar-sky-blue-100 text-laburar-sky-blue-600 rounded-full mr-4 mt-1">
                              <span className="text-sm font-semibold">1</span>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-1">Completa tu perfil profesional</h4>
                              <p className="text-sm text-gray-600 mb-2">
                                Agrega tu experiencia, habilidades y portafolio para atraer clientes.
                              </p>
                              <Button size="sm" variant="outline" asChild>
                                <Link href={ROUTES.PROFILE}>Completar perfil</Link>
                              </Button>
                            </div>
                          </div>
                          
                          <div className="flex items-start p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-500 rounded-full mr-4 mt-1">
                              <span className="text-sm font-semibold">2</span>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-1">Crea tu primer servicio</h4>
                              <p className="text-sm text-gray-600 mb-2">
                                Define qué servicios ofreces, precios y tiempos de entrega.
                              </p>
                              <Button size="sm" variant="gradient" asChild>
                                <Link href="/services/new">Crear servicio</Link>
                              </Button>
                            </div>
                          </div>

                          <div className="flex items-start p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-500 rounded-full mr-4 mt-1">
                              <span className="text-sm font-semibold">3</span>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-1">Busca oportunidades</h4>
                              <p className="text-sm text-gray-600 mb-2">
                                Explora proyectos disponibles y envía propuestas competitivas.
                              </p>
                              <Button size="sm" variant="outline" asChild>
                                <Link href={"/categories"}>Ver proyectos</Link>
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentProjects.map((project, index) => (
                        <motion.div
                          key={project.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                        >
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">
                              {project.title}
                            </h4>
                            <p className="text-sm text-gray-600 mb-2">
                              {project.client}
                            </p>
                            <div className="flex items-center text-sm text-gray-500">
                              <Calendar className="w-4 h-4 mr-1" />
                              Entrega: {new Date(project.dueDate).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className="font-semibold text-gray-900 mb-1">
                              {project.value}
                            </div>
                            <div className={`text-sm px-2 py-1 rounded-full ${
                              project.status === 'Completado'
                                ? 'bg-green-100 text-green-700'
                                : project.status === 'En progreso'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {project.status}
                            </div>
                            <div className="w-16 h-2 bg-gray-200 rounded-full mt-2">
                              <div
                                className="h-full bg-laburar-blue-600 rounded-full"
                                style={{ width: `${project.progress}%` }}
                              />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Messages & Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="space-y-6"
            >
              {/* Quick Actions */}
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Plus className="w-5 h-5 mr-2" />
                    Acciones rápidas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isClient ? (
                    // Actions for clients
                    <>
                      <Button variant="gradient" className="w-full justify-start">
                        <Plus className="w-4 h-4 mr-2" />
                        Publicar proyecto
                      </Button>
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <Link href={"/categories"}>
                          <Briefcase className="w-4 h-4 mr-2" />
                          Buscar freelancers
                        </Link>
                      </Button>
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <Link href={ROUTES.PROFILE}>
                          <Award className="w-4 h-4 mr-2" />
                          Actualizar perfil
                        </Link>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start border-laburar-sky-blue-200 text-laburar-sky-blue-600 hover:bg-laburar-sky-blue-50"
                        onClick={() => {
                          // Convert to freelancer
                          const { updateUser } = useAuthStore.getState()
                          updateUser({ role: 'freelancer' })
                        }}
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Convertirse en freelancer
                      </Button>
                    </>
                  ) : (
                    // Actions for freelancers (who also have client functions by default)
                    <>
                      <Button variant="gradient" className="w-full justify-start" asChild>
                        <Link href="/services/new">
                          <Plus className="w-4 h-4 mr-2" />
                          Crear nuevo servicio
                        </Link>
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Plus className="w-4 h-4 mr-2" />
                        Publicar proyecto
                      </Button>
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <Link href={"/categories"}>
                          <Briefcase className="w-4 h-4 mr-2" />
                          Explorar categorías
                        </Link>
                      </Button>
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <Link href={ROUTES.PROFILE}>
                          <Award className="w-4 h-4 mr-2" />
                          Actualizar perfil
                        </Link>
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Recent Messages */}
              <Card className="bg-white">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <MessageSquare className="w-5 h-5 mr-2" />
                      Mensajes recientes
                    </CardTitle>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={ROUTES.MESSAGES}>
                        Ver todos
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isNewUser ? (
                    <div className="text-center py-8">
                      <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h4 className="font-semibold text-gray-900 mb-2">No hay mensajes aún</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        {isClient 
                          ? 'Los mensajes de freelancers aparecerán aquí'
                          : 'Los mensajes de clientes aparecerán aquí'
                        }
                      </p>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={"/categories"}>
                          {isClient ? 'Buscar freelancers' : 'Buscar proyectos'}
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentMessages.map((message, index) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                          className={`p-3 rounded-lg border cursor-pointer hover:border-gray-300 transition-colors ${
                            message.unread ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-1">
                            <h5 className="font-medium text-gray-900 text-sm">
                              {message.from}
                            </h5>
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="w-3 h-3 mr-1" />
                              {message.time}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            {message.subject}
                          </p>
                          {message.unread && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}