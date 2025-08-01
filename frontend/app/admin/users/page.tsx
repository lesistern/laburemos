'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  Search, 
  Filter, 
  MoreHorizontal,
  UserCheck,
  UserX,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Settings,
  RefreshCw,
  X,
  UserPlus,
  Edit,
  Trash2,
  Shield,
  Lock
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { DropdownMenu } from '@/components/ui/dropdown-menu'
import { Modal } from '@/components/ui/modal'
import { AdminPageLayout, useAdminPageState } from '@/components/admin/admin-page-layout'
import { StatsCardSkeleton, TableSkeleton, LoadingSpinner, LoadingOverlay } from '@/components/ui/loading'
import { EmptyState, UsersEmptyState, SearchEmptyState, ErrorEmptyState } from '@/components/ui/empty-state'
import { useRolePermissions } from '@/hooks/use-role-permissions'

// Real data from LaburAR database - would come from API in production
const realUsers = [
  {
    id: 1,
    firstName: 'Admin',
    lastName: 'Sistema',
    email: 'admin@laburar.com',
    userType: 'BOTH',
    phone: null,
    country: 'Argentina',
    city: 'Buenos Aires',
    province: 'CABA',
    profileImage: null,
    emailVerified: true,
    phoneVerified: false,
    identityVerified: false,
    isActive: true,
    lastLogin: new Date(),
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
    stats: {
      projectsAsClient: 0,
      projectsAsFreelancer: 0,
      totalSpent: 0,
      totalEarned: 0,
      averageRating: 0,
      completedProjects: 0
    }
  },
  {
    id: 2,
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'freelancer@test.com',
    userType: 'FREELANCER',
    phone: '+5491112345678',
    country: 'Argentina',
    city: 'Buenos Aires',
    province: 'CABA',
    profileImage: null,
    emailVerified: true,
    phoneVerified: false,
    identityVerified: false,
    isActive: true,
    lastLogin: new Date(Date.now() - 3600000), // 1 hour ago
    createdAt: new Date(Date.now() - 43200000), // 12 hours ago
    freelancerProfile: {
      id: 1,
      title: 'Desarrollador web especializado en WordPress y PHP',
      experienceYears: 0,
      completionRate: 0,
      ratingAverage: 0,
      totalReviews: 0,
      totalProjects: 0,
      totalEarnings: 0,
      skills: ['PHP', 'WordPress', 'JavaScript', 'MySQL'],
      hourlyRate: 2500.00
    },
    stats: {
      projectsAsClient: 0,
      projectsAsFreelancer: 0,
      totalSpent: 0,
      totalEarned: 0,
      averageRating: 0,
      completedProjects: 0
    }
  },
  {
    id: 3,
    firstName: 'María',
    lastName: 'González',
    email: 'cliente@test.com',
    userType: 'CLIENT',
    phone: '+5491187654321',
    country: 'Argentina',
    city: 'Buenos Aires',
    province: 'CABA',
    profileImage: null,
    emailVerified: true,
    phoneVerified: false,
    identityVerified: false,
    isActive: true,
    lastLogin: new Date(Date.now() - 7200000), // 2 hours ago
    createdAt: new Date(Date.now() - 10800000), // 3 hours ago
    stats: {
      projectsAsClient: 0,
      projectsAsFreelancer: 0,
      totalSpent: 0,
      totalEarned: 0,
      averageRating: 0,
      completedProjects: 0
    }
  }
]

const userTypeColors = {
  CLIENT: 'bg-blue-100 text-blue-800',
  FREELANCER: 'bg-green-100 text-green-800',
  BOTH: 'bg-purple-100 text-purple-800',
  ADMIN: 'bg-purple-100 text-purple-800'
}

const userTypeLabels = {
  CLIENT: 'Cliente',
  FREELANCER: 'Freelancer',
  BOTH: 'Admin',
  ADMIN: 'Admin'
}

function UsersManagementContent() {
  const [users, setUsers] = useState(realUsers)
  const [filteredUsers, setFilteredUsers] = useState(realUsers)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    userType: 'all',
    verified: 'all',
    status: 'all'
  })
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showCreateUserModal, setShowCreateUserModal] = useState(false)
  const [tableLoading, setTableLoading] = useState(false)
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
  const [userToDelete, setUserToDelete] = useState<any>(null)
  const { 
    loading, 
    error, 
    notifications, 
    handleAsyncOperation, 
    addNotification 
  } = useAdminPageState()
  
  // Role permissions
  const {
    canCreateUsers,
    canDeleteUser,
    canEditUser,
    getRoleDisplayName,
    getRoleColor,
    getMaxRoleCanCreate,
    isSuperAdmin
  } = useRolePermissions()

  // Initial data load
  useEffect(() => {
    const loadUsers = async () => {
      await handleAsyncOperation(
        async () => {
          // Simulate API call to load users
          await new Promise(resolve => setTimeout(resolve, 1500))
        },
        {
          loadingMessage: 'Cargando usuarios...',
          errorMessage: 'Error al cargar los usuarios'
        }
      )
    }

    loadUsers()
  }, [])

  // Filter users based on search term and filters
  useEffect(() => {
    let filtered = users

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Type filter
    if (filters.userType !== 'all') {
      filtered = filtered.filter(user => user.userType === filters.userType)
    }

    // Verified filter
    if (filters.verified !== 'all') {
      filtered = filtered.filter(user => 
        filters.verified === 'verified' ? user.emailVerified : !user.emailVerified
      )
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(user => 
        filters.status === 'active' ? user.isActive : !user.isActive
      )
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm, filters])

  const handleSelectUser = (userId: number) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId))
    } else {
      setSelectedUsers([...selectedUsers, userId])
    }
  }

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id))
    }
  }

  const handleBulkAction = async (action: string) => {
    await handleAsyncOperation(
      async () => {
        setTableLoading(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Update users based on action
        const updatedUsers = users.map(user => {
          if (selectedUsers.includes(user.id)) {
            switch (action) {
              case 'activate':
                return { ...user, isActive: true }
              case 'deactivate':
                return { ...user, isActive: false }
              case 'verify':
                return { ...user, emailVerified: true }
              default:
                return user
            }
          }
          return user
        })
        
        setUsers(updatedUsers)
        setSelectedUsers([])
        setTableLoading(false)
      },
      {
        successMessage: `Acción ${action} aplicada a ${selectedUsers.length} usuarios`,
        errorMessage: `Error al aplicar la acción ${action}`
      }
    )
  }

  const handleUserAction = async (userId: number, action: string) => {
    await handleAsyncOperation(
      async () => {
        setTableLoading(true)
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const updatedUsers = users.map(user => {
          if (user.id === userId) {
            switch (action) {
              case 'activate':
                return { ...user, isActive: true }
              case 'deactivate':
                return { ...user, isActive: false }
              case 'verify':
                return { ...user, emailVerified: true }
              default:
                return user
            }
          }
          return user
        })
        
        setUsers(updatedUsers)
        setTableLoading(false)
      },
      {
        successMessage: `Usuario ${action === 'activate' ? 'activado' : action === 'deactivate' ? 'desactivado' : 'verificado'} correctamente`,
        errorMessage: `Error al ${action === 'activate' ? 'activar' : action === 'deactivate' ? 'desactivar' : 'verificar'} el usuario`
      }
    )
  }

  const handleCreateUser = async (userData: any) => {
    await handleAsyncOperation(
      async () => {
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const newUser = {
          id: users.length + 1,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          userType: userData.userType,
          phone: userData.phone || null,
          country: userData.country || 'Argentina',
          city: userData.city || 'Buenos Aires',
          province: userData.province || 'CABA',
          profileImage: null,
          emailVerified: false,
          phoneVerified: false,
          identityVerified: false,
          isActive: true,
          lastLogin: null,
          createdAt: new Date(),
          stats: {
            projectsAsClient: 0,
            projectsAsFreelancer: 0,
            totalSpent: 0,
            totalEarned: 0,
            averageRating: 0,
            completedProjects: 0
          }
        }
        
        setUsers([...users, newUser])
        setShowCreateUserModal(false)
      },
      {
        successMessage: 'Usuario creado correctamente',
        errorMessage: 'Error al crear el usuario'
      }
    )
  }

  const handleDeleteUser = async (userId: number) => {
    await handleAsyncOperation(
      async () => {
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const updatedUsers = users.filter(user => user.id !== userId)
        setUsers(updatedUsers)
        setShowDeleteConfirmModal(false)
        setUserToDelete(null)
      },
      {
        successMessage: 'Usuario eliminado correctamente',
        errorMessage: 'Error al eliminar el usuario'
      }
    )
  }

  const confirmDeleteUser = (user: any) => {
    setUserToDelete(user)
    setShowDeleteConfirmModal(true)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount)
  }

  const formatDate = (date: Date | null) => {
    if (!date) return 'Nunca'
    return date.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getVerificationStatus = (user: any) => {
    const verified = [user.emailVerified, user.phoneVerified, user.identityVerified].filter(Boolean).length
    const total = 3
    return { verified, total }
  }

  return (
    <>
      <LoadingOverlay 
        isVisible={loading}
        text="Cargando usuarios..."
        size="lg"
      />
      
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-end space-x-3">
          {canCreateUsers && (
            <Button 
              variant="default" 
              size="sm"
              onClick={() => setShowCreateUserModal(true)}
              disabled={loading || tableLoading}
              className="bg-laburar-sky-blue-500 hover:bg-laburar-sky-blue-600 text-white"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Crear Usuario
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm"
            disabled={loading || tableLoading}
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            disabled={loading || tableLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${tableLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>

        {/* Stats Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatsCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6"
          >
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total usuarios</p>
                <p className="text-3xl font-bold text-gray-900">{users.length}</p>
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
                <p className="text-gray-600 text-sm font-medium">Freelancers</p>
                <p className="text-3xl font-bold text-gray-900">
                  {users.filter(u => u.userType === 'FREELANCER').length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Clientes</p>
                <p className="text-3xl font-bold text-gray-900">
                  {users.filter(u => u.userType === 'CLIENT').length}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Usuarios activos</p>
                <p className="text-3xl font-bold text-gray-900">
                  {users.filter(u => u.isActive).length}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
          </motion.div>
        )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" aria-hidden="true" />
                <Input
                  placeholder="Buscar usuarios por nombre o email..."
                  className="pl-10 w-full sm:w-80 focus:ring-2 focus:ring-laburar-sky-blue-500 focus:border-laburar-sky-blue-500 transition-all duration-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Buscar usuarios por nombre o email"
                  autoComplete="off"
                />
                {searchTerm && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setSearchTerm('')}
                    aria-label="Limpiar búsqueda"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
              
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? 'bg-gray-100' : ''}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
            </div>

            {selectedUsers.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {selectedUsers.length} seleccionados
                </span>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('activate')}>
                  Activar
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('deactivate')}>
                  Desactivar
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('verify')}>
                  Verificar
                </Button>
              </div>
            )}
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-gray-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de usuario
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={filters.userType}
                    onChange={(e) => setFilters({...filters, userType: e.target.value})}
                  >
                    <option value="all">Todos</option>
                    <option value="CLIENT">Clientes</option>
                    <option value="FREELANCER">Freelancers</option>
                    <option value="ADMIN">Administradores</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado de verificación
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={filters.verified}
                    onChange={(e) => setFilters({...filters, verified: e.target.value})}
                  >
                    <option value="all">Todos</option>
                    <option value="verified">Verificados</option>
                    <option value="unverified">No verificados</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado de cuenta
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                  >
                    <option value="all">Todos</option>
                    <option value="active">Activos</option>
                    <option value="inactive">Inactivos</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Usuarios ({filteredUsers.length})</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedUsers.length === filteredUsers.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-gray-500 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="text-left py-3 px-6 font-medium text-gray-500 text-sm">Usuario</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-500 text-sm">Tipo</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-500 text-sm">Ubicación</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-500 text-sm">Verificación</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-500 text-sm">Estado</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-500 text-sm">Último acceso</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-500 text-sm">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tableLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="py-4 px-6">
                        <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                            <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                          </div>
                        </div>
                      </td>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="py-4 px-6">
                          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12">
                      {searchTerm || filters.userType !== 'all' || filters.verified !== 'all' || filters.status !== 'all' ? (
                        <SearchEmptyState
                          action={{
                            label: 'Limpiar filtros',
                            onClick: () => {
                              setSearchTerm('')
                              setFilters({
                                userType: 'all',
                                verified: 'all',
                                status: 'all'
                              })
                            }
                          }}
                        />
                      ) : (
                        <UsersEmptyState
                          action={{
                            label: 'Invitar usuarios',
                            onClick: () => {
                              addNotification({
                                type: 'info',
                                title: 'Función próximamente',
                                message: 'La funcionalidad de invitar usuarios estará disponible pronto.'
                              })
                            }
                          }}
                          secondaryAction={{
                            label: 'Importar usuarios',
                            onClick: () => {
                              addNotification({
                                type: 'info',
                                title: 'Función próximamente',
                                message: 'La funcionalidad de importar usuarios estará disponible pronto.'
                              })
                            }
                          }}
                        />
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const verification = getVerificationStatus(user)
                    
                    return (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50 transition-colors focus-within:bg-blue-50/50"
                    >
                      <td className="py-4 px-6">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-laburar-sky-blue-500 to-laburar-sky-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {user.firstName[0]}{user.lastName[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      
                      <td className="py-4 px-6">
                        <Badge className={userTypeColors[user.userType]}>
                          {userTypeLabels[user.userType]}
                        </Badge>
                      </td>
                      
                      <td className="py-4 px-6">
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="w-4 h-4 mr-1" />
                          {user.city}, {user.country}
                        </div>
                      </td>
                      
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-1">
                          <div className="flex space-x-1">
                            {user.emailVerified ? (
                              <CheckCircle className="w-4 h-4 text-green-500" title="Email verificado" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" title="Email no verificado" />
                            )}
                            {user.phoneVerified ? (
                              <CheckCircle className="w-4 h-4 text-green-500" title="Teléfono verificado" />
                            ) : (
                              <XCircle className="w-4 h-4 text-gray-300" title="Teléfono no verificado" />
                            )}
                            {user.identityVerified ? (
                              <CheckCircle className="w-4 h-4 text-green-500" title="Identidad verificada" />
                            ) : (
                              <XCircle className="w-4 h-4 text-gray-300" title="Identidad no verificada" />
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {verification.verified}/{verification.total}
                          </span>
                        </div>
                      </td>
                      
                      <td className="py-4 px-6">
                        <Badge variant={user.isActive ? 'success' : 'destructive'}>
                          {user.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      
                      <td className="py-4 px-6">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(user.lastLogin)}
                        </div>
                      </td>
                      
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user)
                              setShowUserModal(true)
                            }}
                            title="Ver detalles del usuario"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          {canEditUser(user.userType) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user)
                                setShowUserModal(true)
                              }}
                              title="Editar usuario"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          
                          <DropdownMenu
                            trigger={
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            }
                            items={[
                              {
                                label: user.isActive ? 'Desactivar' : 'Activar',
                                onClick: () => handleUserAction(user.id, user.isActive ? 'deactivate' : 'activate'),
                                icon: user.isActive ? UserX : UserCheck,
                                disabled: !canEditUser(user.userType)
                              },
                              {
                                label: 'Verificar email',
                                onClick: () => handleUserAction(user.id, 'verify'),
                                icon: Mail,
                                disabled: user.emailVerified || !canEditUser(user.userType)
                              },
                              {
                                label: 'Ver detalles',
                                onClick: () => {
                                  setSelectedUser(user)
                                  setShowUserModal(true)
                                },
                                icon: Eye
                              },
                              ...(canDeleteUser(user.userType) ? [{
                                label: 'Eliminar usuario',
                                onClick: () => confirmDeleteUser(user),
                                icon: Trash2,
                                className: 'text-red-600 hover:text-red-700 hover:bg-red-50'
                              }] : []),
                              ...(!canEditUser(user.userType) ? [{
                                label: 'Acceso restringido',
                                onClick: () => {
                                  addNotification({
                                    type: 'warning',
                                    title: 'Acceso restringido',
                                    message: `No tienes permisos para modificar usuarios de tipo ${getRoleDisplayName(user.userType)}.`
                                  })
                                },
                                icon: Lock,
                                className: 'text-amber-600'
                              }] : [])
                            ]}
                          />
                        </div>
                      </td>
                    </motion.tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <Modal
          isOpen={showUserModal}
          onClose={() => setShowUserModal(false)}
          title={`${selectedUser.firstName} ${selectedUser.lastName}`}
          size="large"
        >
          <div className="space-y-6">
            {/* User Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Información personal</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{selectedUser.email}</span>
                    {selectedUser.emailVerified && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  {selectedUser.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{selectedUser.phone}</span>
                      {selectedUser.phoneVerified && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{selectedUser.city}, {selectedUser.country}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">Registrado: {formatDate(selectedUser.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Estado de la cuenta</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Tipo de usuario:</span>
                    <Badge className={userTypeColors[selectedUser.userType]}>
                      {userTypeLabels[selectedUser.userType]}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Estado:</span>
                    <Badge variant={selectedUser.isActive ? 'success' : 'destructive'}>
                      {selectedUser.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Último acceso:</span>
                    <span className="text-sm">{formatDate(selectedUser.lastLogin)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Estadísticas</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{selectedUser.stats.completedProjects}</p>
                  <p className="text-sm text-gray-600">Proyectos completados</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(selectedUser.stats.totalEarned)}</p>
                  <p className="text-sm text-gray-600">Total ganado</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(selectedUser.stats.totalSpent)}</p>
                  <p className="text-sm text-gray-600">Total gastado</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{selectedUser.stats.averageRating.toFixed(1)}</p>
                  <p className="text-sm text-gray-600">Calificación promedio</p>
                </div>
              </div>
            </div>

            {/* Freelancer Profile */}
            {selectedUser.freelancerProfile && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Perfil de Freelancer</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Título profesional:</span>
                    <span className="text-sm font-medium">{selectedUser.freelancerProfile.title}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Años de experiencia:</span>
                    <span className="text-sm font-medium">{selectedUser.freelancerProfile.experienceYears}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Tasa de completado:</span>
                    <span className="text-sm font-medium">{selectedUser.freelancerProfile.completionRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total de reseñas:</span>
                    <span className="text-sm font-medium">{selectedUser.freelancerProfile.totalReviews}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              {canEditUser(selectedUser.userType) ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleUserAction(selectedUser.id, selectedUser.isActive ? 'deactivate' : 'activate')}
                  >
                    {selectedUser.isActive ? 'Desactivar' : 'Activar'}
                  </Button>
                  {!selectedUser.emailVerified && (
                    <Button
                      variant="outline"
                      onClick={() => handleUserAction(selectedUser.id, 'verify')}
                    >
                      Verificar email
                    </Button>
                  )}
                  {canDeleteUser(selectedUser.userType) && (
                    <Button
                      variant="outline"
                      onClick={() => confirmDeleteUser(selectedUser)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar
                    </Button>
                  )}
                </>
              ) : (
                <div className="flex items-center space-x-2 text-amber-600">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm">
                    No tienes permisos para modificar usuarios de tipo {getRoleDisplayName(selectedUser.userType)}
                  </span>
                </div>
              )}
              <Button onClick={() => setShowUserModal(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create User Modal */}
      {showCreateUserModal && (
        <CreateUserModal
          isOpen={showCreateUserModal}
          onClose={() => setShowCreateUserModal(false)}
          onSubmit={handleCreateUser}
          availableRoles={getMaxRoleCanCreate()}
          getRoleDisplayName={getRoleDisplayName}
          getRoleColor={getRoleColor}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && userToDelete && (
        <DeleteConfirmationModal
          isOpen={showDeleteConfirmModal}
          onClose={() => {
            setShowDeleteConfirmModal(false)
            setUserToDelete(null)
          }}
          onConfirm={() => handleDeleteUser(userToDelete.id)}
          user={userToDelete}
          getRoleDisplayName={getRoleDisplayName}
        />
      )}
      </div>
    </>
  )
}

// Create User Modal Component
function CreateUserModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  availableRoles, 
  getRoleDisplayName, 
  getRoleColor 
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (userData: any) => void
  availableRoles: string[]
  getRoleDisplayName: (role: string) => string
  getRoleColor: (role: string) => string
}) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    userType: availableRoles[0] || 'CLIENT',
    phone: '',
    country: 'Argentina',
    city: 'Buenos Aires',
    province: 'CABA'
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido'
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es requerido'
    }
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El formato del email no es válido'
    }
    if (!formData.userType) {
      newErrors.userType = 'El tipo de usuario es requerido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        userType: availableRoles[0] || 'CLIENT',
        phone: '',
        country: 'Argentina',
        city: 'Buenos Aires',
        province: 'CABA'
      })
      setErrors({})
    } catch (error) {
      console.error('Error creating user:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Crear Nuevo Usuario"
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 mb-4">Información Personal</h3>
            
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre *
              </label>
              <Input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className={errors.firstName ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
                placeholder="Ingrese el nombre"
                disabled={isSubmitting}
                autoComplete="given-name"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                Apellido *
              </label>
              <Input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className={errors.lastName ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
                placeholder="Ingrese el apellido"
                disabled={isSubmitting}
                autoComplete="family-name"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
                placeholder="usuario@ejemplo.com"
                disabled={isSubmitting}
                autoComplete="email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono
              </label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+54 11 1234-5678"
                disabled={isSubmitting}
                autoComplete="tel"
              />
            </div>
          </div>

          {/* Account Configuration */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 mb-4">Configuración de Cuenta</h3>
            
            <div>
              <label htmlFor="userType" className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Usuario *
              </label>
              <select
                id="userType"
                value={formData.userType}
                onChange={(e) => handleInputChange('userType', e.target.value)}
                className={`w-full border rounded-md px-3 py-2 ${
                  errors.userType ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 
                  'border-gray-300 focus:border-laburar-sky-blue-500 focus:ring-laburar-sky-blue-500'
                }`}
                disabled={isSubmitting}
              >
                {availableRoles.map(role => (
                  <option key={role} value={role}>
                    {getRoleDisplayName(role)}
                  </option>
                ))}
              </select>
              {errors.userType && (
                <p className="mt-1 text-sm text-red-600">{errors.userType}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Solo puedes crear usuarios con roles de tu nivel o inferiores
              </p>
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                País
              </label>
              <select
                id="country"
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-laburar-sky-blue-500 focus:ring-laburar-sky-blue-500"
                disabled={isSubmitting}
              >
                <option value="Argentina">Argentina</option>
                <option value="Chile">Chile</option>
                <option value="Uruguay">Uruguay</option>
                <option value="Brasil">Brasil</option>
                <option value="Colombia">Colombia</option>
                <option value="México">México</option>
              </select>
            </div>

            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                Ciudad
              </label>
              <Input
                id="city"
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Buenos Aires"
                disabled={isSubmitting}
                autoComplete="address-level2"
              />
            </div>

            <div>
              <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-2">
                Provincia/Estado
              </label>
              <Input
                id="province"
                type="text"
                value={formData.province}
                onChange={(e) => handleInputChange('province', e.target.value)}
                placeholder="CABA"
                disabled={isSubmitting}
                autoComplete="address-level1"
              />
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Seguridad de la Cuenta</h4>
              <p className="text-sm text-blue-700 mt-1">
                El usuario será creado con estado activo. Se enviará un email de bienvenida con 
                instrucciones para establecer su contraseña. La cuenta requerirá verificación 
                de email antes del primer acceso.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-laburar-sky-blue-500 hover:bg-laburar-sky-blue-600 text-white"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Crear Usuario
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// Delete Confirmation Modal Component
function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  user,
  getRoleDisplayName
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  user: any
  getRoleDisplayName: (role: string) => string
}) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmationText, setConfirmationText] = useState('')
  const requiredText = `ELIMINAR ${user.email}`

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onConfirm()
    } finally {
      setIsDeleting(false)
    }
  }

  const canDelete = confirmationText === requiredText

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirmar Eliminación de Usuario"
      size="medium"
    >
      <div className="space-y-6">
        {/* Warning */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-900">¡Acción Irreversible!</h4>
              <p className="text-sm text-red-700 mt-1">
                Esta acción eliminará permanentemente la cuenta del usuario y todos sus datos asociados. 
                Esta operación no se puede deshacer.
              </p>
            </div>
          </div>
        </div>

        {/* User Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Usuario a eliminar:</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-laburar-sky-blue-500 to-laburar-sky-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>Tipo: {getRoleDisplayName(user.userType)}</span>
              <span>Estado: {user.isActive ? 'Activo' : 'Inactivo'}</span>
              <span>Proyectos: {user.stats.completedProjects}</span>
            </div>
          </div>
        </div>

        {/* Confirmation Input */}
        <div>
          <label htmlFor="confirmDelete" className="block text-sm font-medium text-gray-700 mb-2">
            Para confirmar, escribe: <code className="bg-gray-100 px-2 py-1 rounded text-red-600 font-mono">
              {requiredText}
            </code>
          </label>
          <Input
            id="confirmDelete"
            type="text"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            placeholder={requiredText}
            className={`font-mono ${!canDelete && confirmationText ? 'border-red-300' : ''}`}
            disabled={isDeleting}
            autoComplete="off"
          />
          {confirmationText && !canDelete && (
            <p className="mt-1 text-sm text-red-600">
              El texto no coincide. Debes escribir exactamente: {requiredText}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDelete}
            disabled={!canDelete || isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Eliminando...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar Usuario
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default function UsersManagement() {
  return (
    <AdminPageLayout
      pageName="Gestión de Usuarios"
      pageDescription="Administra todos los usuarios de la plataforma"
      showBreadcrumb={true}
      breadcrumbItems={[
        { label: 'Dashboard', href: '/admin' },
        { label: 'Usuarios' }
      ]}
    >
      <UsersManagementContent />
    </AdminPageLayout>
  )
}