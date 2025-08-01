'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  FolderTree, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  ChevronRight,
  ChevronDown,
  Package,
  DollarSign,
  TrendingUp,
  BarChart3,
  Settings,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { DropdownMenu } from '@/components/ui/dropdown-menu'
import { Modal } from '@/components/ui/modal'

// Mock data - In real app, this would come from API
const mockCategories = [
  {
    id: 1,
    name: 'Tecnología',
    slug: 'tecnologia',
    description: 'Servicios relacionados con tecnología y desarrollo',
    icon: '💻',
    parentId: null,
    displayOrder: 1,
    isActive: true,
    createdAt: new Date('2023-01-15'),
    children: [
      {
        id: 2,
        name: 'Desarrollo Web',
        slug: 'desarrollo-web',
        description: 'Desarrollo de sitios web y aplicaciones web',
        icon: '🌐',
        parentId: 1,
        displayOrder: 1,
        isActive: true,
        serviceCount: 45,
        children: []
      },
      {
        id: 3,
        name: 'Desarrollo Móvil',
        slug: 'desarrollo-movil',
        description: 'Desarrollo de aplicaciones móviles',
        icon: '📱',
        parentId: 1,
        displayOrder: 2,
        isActive: true,
        serviceCount: 28,
        children: []
      }
    ],
    stats: {
      serviceCount: 73,
      activeServiceCount: 68,
      totalProjects: 234,
      completedProjects: 198,
      totalRevenue: 456780,
      averageProjectValue: 2450,
      averageRating: 4.7
    }
  },
  {
    id: 4,
    name: 'Diseño y Creatividad',
    slug: 'diseno-creatividad',
    description: 'Servicios de diseño gráfico, web y creativos',
    icon: '🎨',
    parentId: null,
    displayOrder: 2,
    isActive: true,
    createdAt: new Date('2023-01-20'),
    children: [
      {
        id: 5,
        name: 'Diseño Gráfico',
        slug: 'diseno-grafico',
        description: 'Diseño de logos, identidad corporativa y material gráfico',
        icon: '🖌️',
        parentId: 4,
        displayOrder: 1,
        isActive: true,
        serviceCount: 32,
        children: []
      },
      {
        id: 6,
        name: 'Diseño Web',
        slug: 'diseno-web',
        description: 'Diseño de interfaces y experiencia de usuario',
        icon: '🎯',
        parentId: 4,
        displayOrder: 2,
        isActive: true,
        serviceCount: 19,
        children: []
      }
    ],
    stats: {
      serviceCount: 51,
      activeServiceCount: 47,
      totalProjects: 189,
      completedProjects: 156,
      totalRevenue: 234560,
      averageProjectValue: 1240,
      averageRating: 4.6
    }
  },
  {
    id: 7,
    name: 'Marketing Digital',
    slug: 'marketing-digital',
    description: 'Servicios de marketing online y publicidad digital',
    icon: '📊',
    parentId: null,
    displayOrder: 3,
    isActive: true,
    createdAt: new Date('2023-02-05'),
    children: [],
    stats: {
      serviceCount: 28,
      activeServiceCount: 25,
      totalProjects: 95,
      completedProjects: 78,
      totalRevenue: 145320,
      averageProjectValue: 1865,
      averageRating: 4.5
    }
  },
  {
    id: 8,
    name: 'Redacción',
    slug: 'redaccion',
    description: 'Servicios de redacción y creación de contenido',
    icon: '✍️',
    parentId: null,
    displayOrder: 4,
    isActive: false,
    createdAt: new Date('2023-02-15'),
    children: [],
    stats: {
      serviceCount: 15,
      activeServiceCount: 0,
      totalProjects: 45,
      completedProjects: 38,
      totalRevenue: 67890,
      averageProjectValue: 1785,
      averageRating: 4.3
    }
  }
]

export default function CategoriesManagement() {
  const [categories, setCategories] = useState(mockCategories)
  const [filteredCategories, setFilteredCategories] = useState(mockCategories)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    status: 'all',
    hasChildren: 'all'
  })
  const [expandedCategories, setExpandedCategories] = useState<number[]>([1, 4])
  const [selectedCategory, setSelectedCategory] = useState<any>(null)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
    parentId: null as number | null,
    displayOrder: 0,
    isActive: true
  })
  const [isLoading, setIsLoading] = useState(false)

  // Filter categories based on search term and filters
  useEffect(() => {
    let filtered = categories

    if (searchTerm) {
      filtered = filtered.filter(category => 
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.children.some(child => 
          child.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(category => 
        filters.status === 'active' ? category.isActive : !category.isActive
      )
    }

    if (filters.hasChildren !== 'all') {
      filtered = filtered.filter(category => 
        filters.hasChildren === 'with_children' ? category.children.length > 0 : category.children.length === 0
      )
    }

    setFilteredCategories(filtered)
  }, [categories, searchTerm, filters])

  const toggleExpanded = (categoryId: number) => {
    if (expandedCategories.includes(categoryId)) {
      setExpandedCategories(expandedCategories.filter(id => id !== categoryId))
    } else {
      setExpandedCategories([...expandedCategories, categoryId])
    }
  }

  const handleCreateCategory = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const newCategory = {
      id: Date.now(),
      ...formData,
      createdAt: new Date(),
      children: [],
      stats: {
        serviceCount: 0,
        activeServiceCount: 0,
        totalProjects: 0,
        completedProjects: 0,
        totalRevenue: 0,
        averageProjectValue: 0,
        averageRating: 0
      }
    }

    if (formData.parentId) {
      // Add as child category
      const updatedCategories = categories.map(category => {
        if (category.id === formData.parentId) {
          return {
            ...category,
            children: [...category.children, newCategory]
          }
        }
        return category
      })
      setCategories(updatedCategories)
    } else {
      // Add as root category
      setCategories([...categories, newCategory])
    }

    setFormData({
      name: '',
      slug: '',
      description: '',
      icon: '',
      parentId: null,
      displayOrder: 0,
      isActive: true
    })
    setShowCreateModal(false)
    setIsLoading(false)
  }

  const handleEditCategory = async () => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const updateCategoryRecursive = (categories: any[]): any[] => {
      return categories.map(category => {
        if (category.id === selectedCategory.id) {
          return { ...category, ...formData }
        }
        if (category.children.length > 0) {
          return {
            ...category,
            children: updateCategoryRecursive(category.children)
          }
        }
        return category
      })
    }

    setCategories(updateCategoryRecursive(categories))
    setShowEditModal(false)
    setIsLoading(false)
  }

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta categoría?')) return

    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const deleteCategoryRecursive = (categories: any[]): any[] => {
      return categories.filter(category => {
        if (category.id === categoryId) return false
        if (category.children.length > 0) {
          category.children = deleteCategoryRecursive(category.children)
        }
        return true
      })
    }

    setCategories(deleteCategoryRecursive(categories))
    setIsLoading(false)
  }

  const handleToggleStatus = async (categoryId: number) => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const toggleStatusRecursive = (categories: any[]): any[] => {
      return categories.map(category => {
        if (category.id === categoryId) {
          return { ...category, isActive: !category.isActive }
        }
        if (category.children.length > 0) {
          return {
            ...category,
            children: toggleStatusRecursive(category.children)
          }
        }
        return category
      })
    }

    setCategories(toggleStatusRecursive(categories))
    setIsLoading(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount)
  }

  const getTotalStats = () => {
    const totals = categories.reduce((acc, category) => {
      acc.totalCategories += 1 + category.children.length
      acc.totalServices += category.stats.serviceCount
      acc.totalRevenue += category.stats.totalRevenue
      acc.totalProjects += category.stats.totalProjects
      return acc
    }, {
      totalCategories: 0,
      totalServices: 0,
      totalRevenue: 0,
      totalProjects: 0
    })
    return totals
  }

  const totalStats = getTotalStats()

  const renderCategoryRow = (category: any, level: number = 0) => {
    const isExpanded = expandedCategories.includes(category.id)
    
    return (
      <React.Fragment key={category.id}>
        <motion.tr
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="hover:bg-gray-50 transition-colors"
        >
          <td className="py-4 px-6">
            <div className="flex items-center space-x-2" style={{ paddingLeft: `${level * 20}px` }}>
              {category.children && category.children.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpanded(category.id)}
                  className="w-6 h-6 p-0"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </Button>
              )}
              <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg">
                <span className="text-lg">{category.icon}</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{category.name}</p>
                <p className="text-sm text-gray-500">{category.slug}</p>
              </div>
            </div>
          </td>
          
          <td className="py-4 px-6">
            <p className="text-sm text-gray-600 max-w-xs truncate" title={category.description}>
              {category.description}
            </p>
          </td>
          
          <td className="py-4 px-6">
            <div className="flex items-center space-x-2">
              <Package className="w-4 h-4 text-gray-400" />
              <span className="font-medium">{category.stats?.serviceCount || category.serviceCount || 0}</span>
            </div>
          </td>
          
          <td className="py-4 px-6">
            <div className="text-sm">
              <p className="font-medium">{formatCurrency(category.stats?.totalRevenue || 0)}</p>
              <p className="text-gray-500">{category.stats?.totalProjects || 0} proyectos</p>
            </div>
          </td>
          
          <td className="py-4 px-6">
            <Badge variant={category.isActive ? 'success' : 'destructive'}>
              {category.isActive ? 'Activa' : 'Inactiva'}
            </Badge>
          </td>
          
          <td className="py-4 px-6">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedCategory(category)
                  setShowCategoryModal(true)
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
                    label: 'Editar',
                    onClick: () => {
                      setSelectedCategory(category)
                      setFormData({
                        name: category.name,
                        slug: category.slug,
                        description: category.description,
                        icon: category.icon,
                        parentId: category.parentId,
                        displayOrder: category.displayOrder,
                        isActive: category.isActive
                      })
                      setShowEditModal(true)
                    },
                    icon: Edit
                  },
                  {
                    label: category.isActive ? 'Desactivar' : 'Activar',
                    onClick: () => handleToggleStatus(category.id),
                    icon: category.isActive ? AlertCircle : Settings
                  },
                  {
                    label: 'Eliminar',
                    onClick: () => handleDeleteCategory(category.id),
                    icon: Trash2,
                    className: 'text-red-600'
                  }
                ]}
              />
            </div>
          </td>
        </motion.tr>
        
        {isExpanded && category.children && category.children.map((child: any) => 
          renderCategoryRow(child, level + 1)
        )}
      </React.Fragment>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Categorías</h1>
          <p className="text-gray-600 mt-1">
            Administra las categorías y subcategorías de servicios
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Categoría
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
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
                <p className="text-gray-600 text-sm font-medium">Total categorías</p>
                <p className="text-3xl font-bold text-gray-900">{totalStats.totalCategories}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <FolderTree className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total servicios</p>
                <p className="text-3xl font-bold text-gray-900">{totalStats.totalServices}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Package className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Ingresos totales</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalStats.totalRevenue)}</p>
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
                <p className="text-gray-600 text-sm font-medium">Total proyectos</p>
                <p className="text-3xl font-bold text-gray-900">{totalStats.totalProjects}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
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
                  placeholder="Buscar categorías..."
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
                  <option value="active">Activas</option>
                  <option value="inactive">Inactivas</option>
                </select>

                <select
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={filters.hasChildren}
                  onChange={(e) => setFilters({...filters, hasChildren: e.target.value})}
                >
                  <option value="all">Todas</option>
                  <option value="with_children">Con subcategorías</option>
                  <option value="without_children">Sin subcategorías</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>Categorías ({filteredCategories.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-gray-500 text-sm">Categoría</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-500 text-sm">Descripción</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-500 text-sm">Servicios</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-500 text-sm">Ingresos</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-500 text-sm">Estado</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-500 text-sm">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCategories.map((category) => renderCategoryRow(category))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create Category Modal */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Crear Nueva Categoría"
          size="medium"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la categoría
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Ej: Desarrollo Web"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slug (URL amigable)
              </label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({...formData, slug: e.target.value})}
                placeholder="Ej: desarrollo-web"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Descripción de la categoría..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Icono (emoji)
              </label>
              <Input
                value={formData.icon}
                onChange={(e) => setFormData({...formData, icon: e.target.value})}
                placeholder="Ej: 💻"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría padre (opcional)
              </label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                value={formData.parentId || ''}
                onChange={(e) => setFormData({...formData, parentId: e.target.value ? parseInt(e.target.value) : null})}
              >
                <option value="">Sin categoría padre</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                className="rounded border-gray-300"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">
                Categoría activa
              </label>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateCategory} disabled={isLoading}>
                {isLoading ? 'Creando...' : 'Crear Categoría'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Category Modal */}
      {showEditModal && selectedCategory && (
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Editar Categoría"
          size="medium"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la categoría
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Ej: Desarrollo Web"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slug (URL amigable)
              </label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({...formData, slug: e.target.value})}
                placeholder="Ej: desarrollo-web"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Descripción de la categoría..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Icono (emoji)
              </label>
              <Input
                value={formData.icon}
                onChange={(e) => setFormData({...formData, icon: e.target.value})}
                placeholder="Ej: 💻"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActiveEdit"
                checked={formData.isActive}
                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                className="rounded border-gray-300"
              />
              <label htmlFor="isActiveEdit" className="text-sm text-gray-700">
                Categoría activa
              </label>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEditCategory} disabled={isLoading}>
                {isLoading ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Category Detail Modal */}
      {showCategoryModal && selectedCategory && (
        <Modal
          isOpen={showCategoryModal}
          onClose={() => setShowCategoryModal(false)}
          title={selectedCategory.name}
          size="large"
        >
          <div className="space-y-6">
            {/* Category Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Información básica</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{selectedCategory.icon}</span>
                    <div>
                      <p className="font-medium">{selectedCategory.name}</p>
                      <p className="text-sm text-gray-500">{selectedCategory.slug}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{selectedCategory.description}</p>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Estado:</span>
                    <Badge variant={selectedCategory.isActive ? 'success' : 'destructive'}>
                      {selectedCategory.isActive ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Estructura</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Subcategorías:</span>
                    <span className="text-sm font-medium">{selectedCategory.children?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total servicios:</span>
                    <span className="text-sm font-medium">{selectedCategory.stats.serviceCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Servicios activos:</span>
                    <span className="text-sm font-medium">{selectedCategory.stats.activeServiceCount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Estadísticas</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{selectedCategory.stats.totalProjects}</p>
                  <p className="text-sm text-gray-600">Total proyectos</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{selectedCategory.stats.completedProjects}</p>
                  <p className="text-sm text-gray-600">Completados</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(selectedCategory.stats.totalRevenue)}</p>
                  <p className="text-sm text-gray-600">Ingresos totales</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{selectedCategory.stats.averageRating.toFixed(1)}</p>
                  <p className="text-sm text-gray-600">Rating promedio</p>
                </div>
              </div>
            </div>

            {/* Subcategories */}
            {selectedCategory.children && selectedCategory.children.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Subcategorías</h3>
                <div className="space-y-2">
                  {selectedCategory.children.map((child: any) => (
                    <div key={child.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{child.icon}</span>
                        <div>
                          <p className="font-medium text-gray-900">{child.name}</p>
                          <p className="text-sm text-gray-500">{child.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{child.serviceCount} servicios</p>
                        <Badge variant={child.isActive ? 'success' : 'destructive'} className="text-xs">
                          {child.isActive ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => {
                  setFormData({
                    name: selectedCategory.name,
                    slug: selectedCategory.slug,
                    description: selectedCategory.description,
                    icon: selectedCategory.icon,
                    parentId: selectedCategory.parentId,
                    displayOrder: selectedCategory.displayOrder,
                    isActive: selectedCategory.isActive
                  })
                  setShowCategoryModal(false)
                  setShowEditModal(true)
                }}
              >
                Editar
              </Button>
              <Button onClick={() => setShowCategoryModal(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}