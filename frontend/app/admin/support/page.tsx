'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  Tag,
  ArrowUpRight,
  ArrowRight,
  Eye,
  MessageCircle,
  UserCheck,
  RefreshCw,
  Download
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { DropdownMenu } from '@/components/ui/dropdown-menu'
import { Modal } from '@/components/ui/modal'

// Mock data - In real app, this would come from API
const mockTickets = [
  {
    id: 1,
    subject: 'Problema con el sistema de pagos',
    description: 'No puedo procesar el pago de mi proyecto completado. La página se queda cargando indefinidamente.',
    category: 'Pagos',
    priority: 'HIGH',
    status: 'OPEN',
    userId: 123,
    userName: 'María González',
    userEmail: 'maria.gonzalez@email.com',
    projectId: 456,
    assignedTo: null,
    assigneeName: null,
    resolvedAt: null,
    closedAt: null,
    createdAt: new Date('2024-01-15T10:30:00'),
    updatedAt: new Date('2024-01-15T10:30:00'),
    responses: []
  },
  {
    id: 2,
    subject: 'Cuenta bloqueada sin motivo',
    description: 'Mi cuenta de freelancer fue bloqueada repentinamente y no recibí ninguna notificación explicando el motivo.',
    category: 'Cuenta',
    priority: 'URGENT',
    status: 'PENDING',
    userId: 234,
    userName: 'Carlos Mendoza',
    userEmail: 'carlos.mendoza@email.com',
    projectId: null,
    assignedTo: 1,
    assigneeName: 'Admin User',
    resolvedAt: null,
    closedAt: null,
    createdAt: new Date('2024-01-14T16:45:00'),
    updatedAt: new Date('2024-01-15T09:20:00'),
    responses: [
      {
        id: 1,
        message: 'Hola Carlos, estamos revisando tu caso. Te responderemos en las próximas 24 horas.',
        isAdmin: true,
        adminName: 'Admin User',
        createdAt: new Date('2024-01-15T09:20:00')
      }
    ]
  },
  {
    id: 3,
    subject: 'Error en la calificación del proyecto',
    description: 'El cliente me calificó con 2 estrellas por error y quiere cambiar la calificación a 5 estrellas.',
    category: 'Proyectos',
    priority: 'MEDIUM',
    status: 'RESOLVED',
    userId: 345,
    userName: 'Ana Rodríguez',
    userEmail: 'ana.rodriguez@email.com',
    projectId: 789,
    assignedTo: 1,
    assigneeName: 'Admin User',
    resolvedAt: new Date('2024-01-12T14:30:00'),
    closedAt: null,
    createdAt: new Date('2024-01-10T08:20:00'),
    updatedAt: new Date('2024-01-12T14:30:00'),
    responses: [
      {
        id: 2,
        message: 'Hemos contactado al cliente y confirmado que fue un error. La calificación ha sido actualizada.',
        isAdmin: true,
        adminName: 'Admin User',
        createdAt: new Date('2024-01-12T14:30:00')
      }
    ]
  },
  {
    id: 4,
    subject: 'Problema técnico en el chat',
    description: 'Los mensajes no se están enviando correctamente en el chat del proyecto. Aparece un error 500.',
    category: 'Técnico',
    priority: 'HIGH',
    status: 'OPEN',
    userId: 456,
    userName: 'Luis García',
    userEmail: 'luis.garcia@email.com',
    projectId: 101,
    assignedTo: null,
    assigneeName: null,
    resolvedAt: null,
    closedAt: null,
    createdAt: new Date('2024-01-13T11:15:00'),
    updatedAt: new Date('2024-01-13T11:15:00'),
    responses: []
  },
  {
    id: 5,
    subject: 'Disputa sobre el alcance del proyecto',
    description: 'El freelancer dice que ciertas funcionalidades no estaban incluidas en el precio acordado.',
    category: 'Disputas',
    priority: 'HIGH',
    status: 'PENDING',
    userId: 567,
    userName: 'Pedro Martínez',
    userEmail: 'pedro.martinez@email.com',
    projectId: 202,
    assignedTo: 2,
    assigneeName: 'Support Admin',
    resolvedAt: null,
    closedAt: null,
    createdAt: new Date('2024-01-11T13:45:00'),
    updatedAt: new Date('2024-01-14T10:30:00'),
    responses: [
      {
        id: 3,
        message: 'Estamos mediando entre ambas partes para llegar a un acuerdo justo.',
        isAdmin: true,
        adminName: 'Support Admin',
        createdAt: new Date('2024-01-14T10:30:00')
      }
    ]
  }
]

const priorityColors = {
  LOW: 'bg-green-100 text-green-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800'
}

const statusColors = {
  OPEN: 'bg-blue-100 text-blue-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  RESOLVED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-800'
}

const priorityLabels = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  URGENT: 'Urgente'
}

const statusLabels = {
  OPEN: 'Abierto',
  PENDING: 'Pendiente',
  RESOLVED: 'Resuelto',
  CLOSED: 'Cerrado'
}

const categoryColors = {
  'Pagos': 'bg-purple-100 text-purple-800',
  'Cuenta': 'bg-blue-100 text-blue-800',
  'Proyectos': 'bg-green-100 text-green-800',
  'Técnico': 'bg-red-100 text-red-800',
  'Disputas': 'bg-orange-100 text-orange-800',
  'General': 'bg-gray-100 text-gray-800'
}

export default function SupportPage() {
  const [tickets, setTickets] = useState(mockTickets)
  const [filteredTickets, setFilteredTickets] = useState(mockTickets)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    category: 'all',
    assigned: 'all'
  })
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [showResponseModal, setShowResponseModal] = useState(false)
  const [responseText, setResponseText] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Filter tickets based on search term and filters
  useEffect(() => {
    let filtered = tickets

    if (searchTerm) {
      filtered = filtered.filter(ticket => 
        ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === filters.status)
    }

    if (filters.priority !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === filters.priority)
    }

    if (filters.category !== 'all') {
      filtered = filtered.filter(ticket => ticket.category === filters.category)
    }

    if (filters.assigned !== 'all') {
      filtered = filtered.filter(ticket => 
        filters.assigned === 'assigned' ? ticket.assignedTo !== null : ticket.assignedTo === null
      )
    }

    setFilteredTickets(filtered)
  }, [tickets, searchTerm, filters])

  const handleAssignTicket = async (ticketId: number, adminId: number) => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const updatedTickets = tickets.map(ticket => {
      if (ticket.id === ticketId) {
        return {
          ...ticket,
          assignedTo: adminId,
          assigneeName: 'Admin User', // In real app, get from admin users list
          status: 'PENDING',
          updatedAt: new Date()
        }
      }
      return ticket
    })
    
    setTickets(updatedTickets)
    setIsLoading(false)
  }

  const handleUpdateStatus = async (ticketId: number, newStatus: string) => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const updatedTickets = tickets.map(ticket => {
      if (ticket.id === ticketId) {
        const updates: any = {
          ...ticket,
          status: newStatus,
          updatedAt: new Date()
        }
        
        if (newStatus === 'RESOLVED') {
          updates.resolvedAt = new Date()
        } else if (newStatus === 'CLOSED') {
          updates.closedAt = new Date()
        }
        
        return updates
      }
      return ticket
    })
    
    setTickets(updatedTickets)
    setIsLoading(false)
  }

  const handleAddResponse = async () => {
    if (!responseText.trim() || !selectedTicket) return

    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))

    const newResponse = {
      id: Date.now(),
      message: responseText,
      isAdmin: true,
      adminName: 'Admin User',
      createdAt: new Date()
    }

    const updatedTickets = tickets.map(ticket => {
      if (ticket.id === selectedTicket.id) {
        return {
          ...ticket,
          responses: [...ticket.responses, newResponse],
          updatedAt: new Date(),
          status: 'PENDING'
        }
      }
      return ticket
    })

    setTickets(updatedTickets)
    setSelectedTicket({
      ...selectedTicket,
      responses: [...selectedTicket.responses, newResponse]
    })
    setResponseText('')
    setShowResponseModal(false)
    setIsLoading(false)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTicketStats = () => {
    return {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'OPEN').length,
      pending: tickets.filter(t => t.status === 'PENDING').length,
      resolved: tickets.filter(t => t.status === 'RESOLVED').length,
      urgent: tickets.filter(t => t.priority === 'URGENT').length,
      unassigned: tickets.filter(t => t.assignedTo === null).length
    }
  }

  const stats = getTicketStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Soporte</h1>
          <p className="text-gray-600 mt-1">
            Administra tickets de soporte y resuelve consultas de usuarios
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4"
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <MessageSquare className="w-6 h-6 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Abiertos</p>
                <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
              </div>
              <AlertCircle className="w-6 h-6 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="w-6 h-6 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Resueltos</p>
                <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
              </div>
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Urgentes</p>
                <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
              </div>
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Sin asignar</p>
                <p className="text-2xl font-bold text-orange-600">{stats.unassigned}</p>
              </div>
              <UserCheck className="w-6 h-6 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar tickets..."
                  className="pl-10 w-full sm:w-80"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex space-x-2">
                <select
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                >
                  <option value="all">Todos los estados</option>
                  <option value="OPEN">Abiertos</option>
                  <option value="PENDING">Pendientes</option>
                  <option value="RESOLVED">Resueltos</option>
                  <option value="CLOSED">Cerrados</option>
                </select>

                <select
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={filters.priority}
                  onChange={(e) => setFilters({...filters, priority: e.target.value})}
                >
                  <option value="all">Todas las prioridades</option>
                  <option value="LOW">Baja</option>
                  <option value="MEDIUM">Media</option>
                  <option value="HIGH">Alta</option>
                  <option value="URGENT">Urgente</option>
                </select>

                <select
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={filters.category}
                  onChange={(e) => setFilters({...filters, category: e.target.value})}
                >
                  <option value="all">Todas las categorías</option>
                  <option value="Pagos">Pagos</option>
                  <option value="Cuenta">Cuenta</option>
                  <option value="Proyectos">Proyectos</option>
                  <option value="Técnico">Técnico</option>
                  <option value="Disputas">Disputas</option>
                  <option value="General">General</option>
                </select>

                <select
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={filters.assigned}
                  onChange={(e) => setFilters({...filters, assigned: e.target.value})}
                >
                  <option value="all">Todas las asignaciones</option>
                  <option value="assigned">Asignados</option>
                  <option value="unassigned">Sin asignar</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tickets de Soporte ({filteredTickets.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-gray-500 text-sm">Ticket</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-500 text-sm">Usuario</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-500 text-sm">Categoría</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-500 text-sm">Prioridad</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-500 text-sm">Estado</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-500 text-sm">Asignado</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-500 text-sm">Fecha</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-500 text-sm">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTickets.map((ticket) => (
                  <motion.tr
                    key={ticket.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-medium text-gray-900 mb-1">#{ticket.id}</p>
                        <p className="text-sm text-gray-900 font-medium mb-1">{ticket.subject}</p>
                        <p className="text-xs text-gray-500 max-w-xs truncate">
                          {ticket.description}
                        </p>
                      </div>
                    </td>
                    
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-laburar-sky-blue-500 to-laburar-sky-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {ticket.userName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{ticket.userName}</p>
                          <p className="text-sm text-gray-500">{ticket.userEmail}</p>
                        </div>
                      </div>
                    </td>
                    
                    <td className="py-4 px-6">
                      <Badge className={categoryColors[ticket.category] || categoryColors.General}>
                        {ticket.category}
                      </Badge>
                    </td>
                    
                    <td className="py-4 px-6">
                      <Badge className={priorityColors[ticket.priority]}>
                        {priorityLabels[ticket.priority]}
                      </Badge>
                    </td>
                    
                    <td className="py-4 px-6">
                      <Badge className={statusColors[ticket.status]}>
                        {statusLabels[ticket.status]}
                      </Badge>
                    </td>
                    
                    <td className="py-4 px-6">
                      {ticket.assigneeName ? (
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{ticket.assigneeName}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Sin asignar</span>
                      )}
                    </td>
                    
                    <td className="py-4 px-6">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(ticket.createdAt)}
                      </div>
                    </td>
                    
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTicket(ticket)
                            setShowTicketModal(true)
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        <DropdownMenu
                          trigger={
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          }
                          items={[
                            {
                              label: 'Ver detalles',
                              onClick: () => {
                                setSelectedTicket(ticket)
                                setShowTicketModal(true)
                              },
                              icon: Eye
                            },
                            {
                              label: 'Responder',
                              onClick: () => {
                                setSelectedTicket(ticket)
                                setShowResponseModal(true)
                              },
                              icon: MessageCircle
                            },
                            ...(!ticket.assignedTo ? [{
                              label: 'Asignar a mí',
                              onClick: () => handleAssignTicket(ticket.id, 1),
                              icon: UserCheck
                            }] : []),
                            ...(ticket.status === 'OPEN' || ticket.status === 'PENDING' ? [{
                              label: 'Marcar como resuelto',
                              onClick: () => handleUpdateStatus(ticket.id, 'RESOLVED'),
                              icon: CheckCircle
                            }] : []),
                            ...(ticket.status === 'RESOLVED' ? [{
                              label: 'Cerrar ticket',
                              onClick: () => handleUpdateStatus(ticket.id, 'CLOSED'),
                              icon: XCircle
                            }] : [])
                          ]}
                        />
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Ticket Detail Modal */}
      {showTicketModal && selectedTicket && (
        <Modal
          isOpen={showTicketModal}
          onClose={() => setShowTicketModal(false)}
          title={`Ticket #${selectedTicket.id}`}
          size="large"
        >
          <div className="space-y-6">
            {/* Ticket Header */}
            <div className="border-b border-gray-200 pb-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {selectedTicket.subject}
                  </h3>
                  <div className="flex items-center space-x-4">
                    <Badge className={categoryColors[selectedTicket.category]}>
                      {selectedTicket.category}
                    </Badge>
                    <Badge className={priorityColors[selectedTicket.priority]}>
                      {priorityLabels[selectedTicket.priority]}
                    </Badge>
                    <Badge className={statusColors[selectedTicket.status]}>
                      {statusLabels[selectedTicket.status]}
                    </Badge>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>Creado: {formatDate(selectedTicket.createdAt)}</p>
                  <p>Actualizado: {formatDate(selectedTicket.updatedAt)}</p>
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Información del usuario</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{selectedTicket.userName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{selectedTicket.userEmail}</span>
                  </div>
                  {selectedTicket.projectId && (
                    <div className="flex items-center space-x-2">
                      <Tag className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">Proyecto #{selectedTicket.projectId}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Estado del ticket</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Asignado a:</span>
                    <span className="text-sm font-medium">
                      {selectedTicket.assigneeName || 'Sin asignar'}
                    </span>
                  </div>
                  {selectedTicket.resolvedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Resuelto:</span>
                      <span className="text-sm">{formatDate(selectedTicket.resolvedAt)}</span>
                    </div>
                  )}
                  {selectedTicket.closedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Cerrado:</span>
                      <span className="text-sm">{formatDate(selectedTicket.closedAt)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Descripción</h4>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700">{selectedTicket.description}</p>
              </div>
            </div>

            {/* Responses */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">
                Respuestas ({selectedTicket.responses.length})
              </h4>
              {selectedTicket.responses.length > 0 ? (
                <div className="space-y-4">
                  {selectedTicket.responses.map((response: any) => (
                    <div key={response.id} className={`p-4 rounded-lg ${
                      response.isAdmin ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-gray-50'
                    }`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                            response.isAdmin ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white'
                          }`}>
                            {response.isAdmin ? 'A' : 'U'}
                          </div>
                          <span className="font-medium text-gray-900">
                            {response.isAdmin ? response.adminName : selectedTicket.userName}
                          </span>
                          {response.isAdmin && (
                            <Badge variant="admin" className="text-xs">ADMIN</Badge>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(response.createdAt)}
                        </span>
                      </div>
                      <p className="text-gray-700">{response.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No hay respuestas aún.</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-3">
                {!selectedTicket.assignedTo && (
                  <Button
                    variant="outline"
                    onClick={() => handleAssignTicket(selectedTicket.id, 1)}
                  >
                    <UserCheck className="w-4 h-4 mr-2" />
                    Asignar a mí
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowTicketModal(false)
                    setShowResponseModal(true)
                  }}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Responder
                </Button>
              </div>

              <div className="flex items-center space-x-3">
                {(selectedTicket.status === 'OPEN' || selectedTicket.status === 'PENDING') && (
                  <Button
                    variant="outline"
                    onClick={() => handleUpdateStatus(selectedTicket.id, 'RESOLVED')}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Marcar resuelto
                  </Button>
                )}
                
                {selectedTicket.status === 'RESOLVED' && (
                  <Button
                    variant="outline"
                    onClick={() => handleUpdateStatus(selectedTicket.id, 'CLOSED')}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cerrar ticket
                  </Button>
                )}
                
                <Button onClick={() => setShowTicketModal(false)}>
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Response Modal */}
      {showResponseModal && selectedTicket && (
        <Modal
          isOpen={showResponseModal}
          onClose={() => setShowResponseModal(false)}
          title={`Responder a Ticket #${selectedTicket.id}`}
          size="medium"
        >
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">{selectedTicket.subject}</h4>
              <p className="text-sm text-gray-600 mb-4">
                Usuario: {selectedTicket.userName} ({selectedTicket.userEmail})
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tu respuesta
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                rows={6}
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Escribe tu respuesta aquí..."
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button variant="outline" onClick={() => setShowResponseModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddResponse} disabled={isLoading || !responseText.trim()}>
                {isLoading ? 'Enviando...' : 'Enviar Respuesta'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}