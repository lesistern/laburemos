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
  Edit,
  Eye,
  Trash2,
  Star,
  Clock,
  DollarSign,
  BarChart,
  Package,
  Users,
  TrendingUp,
  Settings
} from 'lucide-react'

const mockServices = [
  {
    id: 1,
    title: 'Desarrollo de Aplicación Web Completa',
    description: 'Desarrollo full-stack de aplicaciones web modernas con React y Node.js',
    price: 1500,
    duration: '2-3 semanas',
    category: 'Desarrollo Web',
    status: 'active',
    orders: 23,
    rating: 4.9,
    image: '/api/placeholder/300/200'
  },
  {
    id: 2,
    title: 'Diseño UI/UX para Apps Móviles',
    description: 'Diseño completo de interfaces para aplicaciones móviles iOS y Android',
    price: 800,
    duration: '1-2 semanas',
    category: 'Diseño',
    status: 'active',
    orders: 15,
    rating: 4.8,
    image: '/api/placeholder/300/200'
  },
  {
    id: 3,
    title: 'Consultoría en Arquitectura de Software',
    description: 'Asesoramiento profesional en arquitectura y escalabilidad de sistemas',
    price: 200,
    duration: '2-5 días',
    category: 'Consultoría',
    status: 'paused',
    orders: 8,
    rating: 5.0,
    image: '/api/placeholder/300/200'
  }
]

export default function ServicesPage() {
  const { user, isAuthenticated } = useAuthStore()
  const [services, setServices] = useState(mockServices)
  const [filter, setFilter] = useState('all')

  if (!isAuthenticated || !user) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <MotionCard className="p-8 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-black mb-2">Acceso Requerido</h2>
            <p className="text-black mb-4">Necesitas iniciar sesión para ver tus servicios.</p>
            <Button variant="gradient">Iniciar Sesión</Button>
          </MotionCard>
        </div>
        <Footer />
      </>
    )
  }

  if (user.role !== 'freelancer') {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <MotionCard className="p-8 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-black mb-2">Solo para Freelancers</h2>
            <p className="text-black mb-4">Esta sección está disponible solo para freelancers.</p>
            <Button variant="gradient">Convertirse en Freelancer</Button>
          </MotionCard>
        </div>
        <Footer />
      </>
    )
  }

  const filteredServices = services.filter(service => 
    filter === 'all' || service.status === filter
  )

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
            <h1 className="text-3xl font-bold text-black mb-2">Mis Servicios</h1>
            <p className="text-black">Gestiona y optimiza tus servicios profesionales</p>
          </div>
          <Button variant="gradient" className="gap-2">
            <Plus className="h-4 w-4" />
            Crear Servicio
          </Button>
        </motion.div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <MotionCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-black text-sm">Servicios Activos</p>
                <p className="text-2xl font-bold text-black">
                  {services.filter(s => s.status === 'active').length}
                </p>
              </div>
              <Package className="h-8 w-8 text-laburar-sky-blue-600" />
            </div>
          </MotionCard>

          <MotionCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-black text-sm">Órdenes Totales</p>
                <p className="text-2xl font-bold text-black">
                  {services.reduce((acc, s) => acc + s.orders, 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-laburar-yellow-600" />
            </div>
          </MotionCard>

          <MotionCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-black text-sm">Calificación Promedio</p>
                <p className="text-2xl font-bold text-black">
                  {(services.reduce((acc, s) => acc + s.rating, 0) / services.length).toFixed(1)}
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-400" />
            </div>
          </MotionCard>

          <MotionCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-black text-sm">Ingresos Estimados</p>
                <p className="text-2xl font-bold text-black">$12,400</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </MotionCard>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            Todos ({services.length})
          </Button>
          <Button
            variant={filter === 'active' ? 'default' : 'outline'}
            onClick={() => setFilter('active')}
          >
            Activos ({services.filter(s => s.status === 'active').length})
          </Button>
          <Button
            variant={filter === 'paused' ? 'default' : 'outline'}
            onClick={() => setFilter('paused')}
          >
            Pausados ({services.filter(s => s.status === 'paused').length})
          </Button>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <MotionCard className="overflow-hidden group hover:shadow-lg transition-shadow">
                <div className="relative">
                  <img 
                    src={service.image} 
                    alt={service.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium ${
                    service.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {service.status === 'active' ? 'Activo' : 'Pausado'}
                  </div>
                  <div className="absolute top-3 right-3 flex gap-1">
                    <Button size="icon" variant="outline" className="h-8 w-8 bg-white/90">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="outline" className="h-8 w-8 bg-white/90">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="mb-3">
                    <span className="text-xs text-laburar-sky-blue-600 font-medium bg-laburar-sky-blue-50 px-2 py-1 rounded-full">
                      {service.category}
                    </span>
                  </div>

                  <h3 className="font-semibold text-black mb-2 group-hover:text-laburar-sky-blue-600 transition-colors">
                    {service.title}
                  </h3>
                  
                  <p className="text-black text-sm mb-4 line-clamp-2">
                    {service.description}
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-semibold text-black">${service.price}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-laburar-sky-blue-600" />
                        <span className="text-sm text-black">{service.duration}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium text-black">{service.rating}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-laburar-sky-blue-600" />
                        <span className="text-sm text-black">{service.orders} órdenes</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1 gap-1">
                        <BarChart className="h-3 w-3" />
                        Estadísticas
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1">
                        <Settings className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1 text-red-600 hover:text-red-700">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </MotionCard>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredServices.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-black mb-2">
              No hay servicios {filter !== 'all' ? filter === 'active' ? 'activos' : 'pausados' : ''}
            </h3>
            <p className="text-black mb-6">
              {filter === 'all' 
                ? 'Crea tu primer servicio para empezar a recibir órdenes'
                : `No tienes servicios ${filter === 'active' ? 'activos' : 'pausados'} en este momento`
              }
            </p>
            <Button variant="gradient" className="gap-2">
              <Plus className="h-4 w-4" />
              Crear Primer Servicio
            </Button>
          </motion.div>
        )}
      </div>
      </div>
      <Footer />
    </>
  )
}