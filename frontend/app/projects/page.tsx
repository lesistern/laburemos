'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { MotionCard } from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { useAuthStore } from '@/stores/auth-store'
import { 
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  DollarSign,
  User,
  MessageSquare,
  Star,
  Download,
  Eye,
  Search,
  Filter,
  Briefcase
} from 'lucide-react'

const mockProjects = [
  {
    id: 1,
    title: 'Aplicación E-commerce para Tienda de Ropa',
    description: 'Desarrollo completo de plataforma de comercio electrónico con carrito de compras y sistema de pagos',
    budget: 2500,
    status: 'in_progress',
    progress: 65,
    deadline: '2025-08-15',
    client: {
      name: 'María González',
      avatar: '/api/placeholder/40/40',
      rating: 4.8
    },
    category: 'Desarrollo Web',
    createdAt: '2025-01-15',
    messagesCount: 23
  },
  {
    id: 2,
    title: 'Diseño de Identidad Visual para Startup',
    description: 'Creación de logo, paleta de colores, tipografías y guidelines para nueva empresa de tecnología',
    budget: 800,
    status: 'completed',
    progress: 100,
    deadline: '2025-01-20',
    client: {
      name: 'Carlos Ruiz',
      avatar: '/api/placeholder/40/40',
      rating: 5.0
    },
    category: 'Diseño Gráfico',
    createdAt: '2025-01-05',
    messagesCount: 15,
    deliveredAt: '2025-01-18'
  },
  {
    id: 3,
    title: 'Consultoría en Optimización de Base de Datos',
    description: 'Análisis y optimización de queries, índices y estructura de base de datos MySQL',
    budget: 600,
    status: 'pending',
    progress: 0,
    deadline: '2025-02-10',
    client: {
      name: 'Ana Martínez',
      avatar: '/api/placeholder/40/40',
      rating: 4.9
    },
    category: 'Consultoría',
    createdAt: '2025-01-25',
    messagesCount: 3
  },
  {
    id: 4,
    title: 'App Móvil para Gestión de Tareas',
    description: 'Desarrollo de aplicación móvil nativa para iOS y Android con sincronización en tiempo real',
    budget: 3200,
    status: 'revision',
    progress: 90,
    deadline: '2025-02-05',
    client: {
      name: 'Roberto Silva',
      avatar: '/api/placeholder/40/40',
      rating: 4.7
    },
    category: 'Desarrollo Móvil',
    createdAt: '2024-12-20',
    messagesCount: 41
  }
]

const statusConfig = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  in_progress: { label: 'En Progreso', color: 'bg-blue-100 text-blue-800', icon: Clock },
  revision: { label: 'En Revisión', color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
  completed: { label: 'Completado', color: 'bg-green-100 text-green-800', icon: CheckCircle }
}

export default function ProjectsPage() {
  const { user, isAuthenticated } = useAuthStore()
  const [projects, setProjects] = useState(mockProjects)
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  if (!isAuthenticated || !user) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <MotionCard className="p-8 text-center">
            <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-black mb-2">Acceso Requerido</h2>
            <p className="text-black mb-4">Necesitas iniciar sesión para ver tus proyectos.</p>
            <Button variant="gradient">Iniciar Sesión</Button>
          </MotionCard>
        </div>
        <Footer />
      </>
    )
  }

  const filteredProjects = projects.filter(project => {
    const matchesFilter = filter === 'all' || project.status === filter
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
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
          className="flex justify-between items-start mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-black mb-2">Mis Proyectos</h1>
            <p className="text-black">Gestiona todos tus proyectos activos y completados</p>
          </div>
          {user.role === 'client' && (
            <Button variant="gradient" className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Proyecto
            </Button>
          )}
        </motion.div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <MotionCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-black text-sm">Total Proyectos</p>
                <p className="text-2xl font-bold text-black">{projects.length}</p>
              </div>
              <Briefcase className="h-8 w-8 text-laburar-sky-blue-600" />
            </div>
          </MotionCard>

          <MotionCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-black text-sm">En Progreso</p>
                <p className="text-2xl font-bold text-black">
                  {projects.filter(p => p.status === 'in_progress').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-laburar-yellow-600" />
            </div>
          </MotionCard>

          <MotionCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-black text-sm">Completados</p>
                <p className="text-2xl font-bold text-black">
                  {projects.filter(p => p.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </MotionCard>

          <MotionCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-black text-sm">Valor Total</p>
                <p className="text-2xl font-bold text-black">
                  ${projects.reduce((acc, p) => acc + p.budget, 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </MotionCard>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar proyectos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-md border border-gray-300 bg-white focus:border-laburar-sky-blue-500 focus:outline-none"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              size="sm"
            >
              Todos
            </Button>
            <Button
              variant={filter === 'in_progress' ? 'default' : 'outline'}
              onClick={() => setFilter('in_progress')}
              size="sm"
            >
              En Progreso
            </Button>
            <Button
              variant={filter === 'completed' ? 'default' : 'outline'}
              onClick={() => setFilter('completed')}
              size="sm"
            >
              Completados
            </Button>
            <Button
              variant={filter === 'pending' ? 'default' : 'outline'}
              onClick={() => setFilter('pending')}
              size="sm"
            >
              Pendientes
            </Button>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="space-y-6">
          {filteredProjects.map((project, index) => {
            const StatusIcon = statusConfig[project.status as keyof typeof statusConfig].icon
            
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <MotionCard className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-black hover:text-laburar-sky-blue-600 transition-colors cursor-pointer">
                              {project.title}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[project.status as keyof typeof statusConfig].color}`}>
                              {statusConfig[project.status as keyof typeof statusConfig].label}
                            </span>
                          </div>
                          <p className="text-black text-sm mb-3 max-w-2xl">
                            {project.description}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-black font-medium">${project.budget.toLocaleString()}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-laburar-sky-blue-600" />
                          <span className="text-sm text-black">{formatDate(project.deadline)}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-600" />
                          <span className="text-sm text-black">{project.client.name}</span>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-400 fill-current" />
                            <span className="text-xs text-black">{project.client.rating}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-laburar-sky-blue-600" />
                          <span className="text-sm text-black">{project.messagesCount} mensajes</span>
                        </div>
                      </div>

                      {project.status !== 'pending' && project.status !== 'completed' && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-black">Progreso</span>
                            <span className="text-sm font-medium text-black">{project.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-laburar-sky-blue-500 to-laburar-sky-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-row lg:flex-col gap-2">
                      <Button variant="outline" size="sm" className="gap-1">
                        <Eye className="h-3 w-3" />
                        Ver
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1">
                        <MessageSquare className="h-3 w-3" />
                        Chat
                      </Button>
                      {project.status === 'completed' && (
                        <Button variant="outline" size="sm" className="gap-1">
                          <Download className="h-3 w-3" />
                          Descargar
                        </Button>
                      )}
                    </div>
                  </div>
                </MotionCard>
              </motion.div>
            )
          })}
        </div>

        {/* Empty State */}
        {filteredProjects.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-black mb-2">
              No se encontraron proyectos
            </h3>
            <p className="text-black mb-6">
              {searchQuery 
                ? 'Intenta con otros términos de búsqueda'
                : filter !== 'all' 
                  ? `No tienes proyectos ${statusConfig[filter as keyof typeof statusConfig]?.label.toLowerCase()} en este momento`
                  : 'Aún no tienes proyectos. ¡Comienza tu primer proyecto!'
              }
            </p>
            {!searchQuery && filter === 'all' && user.role === 'client' && (
              <Button variant="gradient" className="gap-2">
                <Plus className="h-4 w-4" />
                Crear Primer Proyecto
              </Button>
            )}
          </motion.div>
        )}
      </div>
      </div>
      <Footer />
    </>
  )
}