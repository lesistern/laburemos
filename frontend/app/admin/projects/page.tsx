'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Briefcase,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Calendar,
  Clock,
  DollarSign,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  PlayCircle,
  PauseCircle,
  RefreshCw,
  Download,
  FileText,
  MessageSquare,
  Star,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { DropdownMenu } from '@/components/ui/dropdown-menu'
import { Modal } from '@/components/ui/modal'

// Real data from LaburAR database - currently no active projects yet
const realProjects = [
  // No active projects yet - the WordPress service is available but no client has hired it yet
  // When projects are created, they would appear here
]

// Sample available services (not actual projects)
const realServices = [
  {
    id: 1,
    title: 'Desarrollo de sitio web WordPress profesional',
    description: 'Creo sitios web profesionales con WordPress, completamente personalizados según tus necesidades. Incluye diseño responsive, optimización SEO básica y panel de administración.',
    basePrice: 25000.00,
    deliveryTimeDays: 7,
    status: 'ACTIVE',
    freelancer: {
      id: 2,
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'freelancer@test.com',
      profileImage: null
    },
    category: {
      id: 3,
      name: 'Programación y Tecnología'
    },
    packages: [
      { type: 'basico', name: 'Paquete Básico', price: 25000.00, features: ['5 páginas', 'Diseño responsive', 'Formulario de contacto'] },
      { type: 'completo', name: 'Paquete Completo', price: 45000.00, features: ['10 páginas', 'Blog integrado', 'SEO básico', '3 revisiones'] },
      { type: 'premium', name: 'Paquete Premium', price: 75000.00, features: ['E-commerce completo', 'Pasarela de pagos', 'SEO avanzado', 'Capacitación'] }
    ]
  }
]

const projectStatusColors = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PUBLISHED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  DELIVERED: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  DISPUTED: 'bg-red-100 text-red-800'
}

const projectStatusLabels = {
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicado',
  IN_PROGRESS: 'En Progreso',
  DELIVERED: 'Entregado',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
  DISPUTED: 'En Disputa'
}

const paymentStatusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ESCROW: 'bg-blue-100 text-blue-800',
  RELEASED: 'bg-green-100 text-green-800',
  REFUNDED: 'bg-red-100 text-red-800'
}

const paymentStatusLabels = {
  PENDING: 'Pendiente',
  ESCROW: 'En Garantía',
  RELEASED: 'Liberado',
  REFUNDED: 'Reembolsado'
}

const milestoneStatusColors = {
  PENDING: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  SUBMITTED: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800'
}

export default function ProjectsManagement() {
  const [projects, setProjects] = useState(realProjects)
  const [filteredProjects, setFilteredProjects] = useState(realProjects)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    status: 'all',
    paymentStatus: 'all'
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount)
  }

  // Since we have no projects yet, show a message about available services
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Proyectos</h1>
          <p className="text-gray-600 mt-1">
            Administra proyectos activos, completados y servicios disponibles
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Proyectos activos</p>
                <p className="text-3xl font-bold text-gray-900">{realProjects.length}</p>
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
                <p className="text-gray-600 text-sm font-medium">Servicios disponibles</p>
                <p className="text-3xl font-bold text-gray-900">{realServices.length}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Valor total servicios</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(realServices.reduce((total, service) => total + service.basePrice, 0))}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Ingresos totales</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(0)}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Status */}
      {realProjects.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay proyectos activos</h3>
            <p className="text-gray-600 mb-6">
              La plataforma está lista y hay {realServices.length} servicio disponible esperando clientes.
            </p>
            
            {/* Show available services */}
            <div className="text-left max-w-2xl mx-auto">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Servicios disponibles:</h4>
              {realServices.map((service) => (
                <div key={service.id} className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-900">{service.title}</h5>
                      <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-sm text-gray-500">
                          Freelancer: {service.freelancer.firstName} {service.freelancer.lastName}
                        </span>
                        <span className="text-sm text-gray-500">
                          Categoría: {service.category.name}
                        </span>
                        <Badge variant="success">
                          {service.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(service.basePrice)}
                      </p>
                      <p className="text-sm text-gray-500">{service.deliveryTimeDays} días</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div>
          {/* Projects table would go here when there are projects */}
        </div>
      )}
    </div>
  )
}
