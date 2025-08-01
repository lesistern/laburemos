'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { MotionCard } from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { EmojiPicker } from '@/components/ui/emoji-picker'
import { useAuthStore } from '@/stores/auth-store'
import { 
  Send,
  Search,
  Paperclip,
  Smile,
  MoreVertical,
  ExternalLink,
  Tag,
  Star,
  Clock,
  CheckCheck,
  MessageSquare,
  User,
  Image as ImageIcon,
  File,
  Archive,
  UserX,
  Trash2,
  X,
  Plus,
  Filter,
  AlertTriangle,
  ChevronDown
} from 'lucide-react'

const mockConversations = [
  {
    id: 1,
    participant: {
      name: 'María González',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b1ab?w=150&h=150&fit=crop&crop=face&auto=format&q=80',
      role: 'Cliente',
      rating: 4.8,
      online: true
    },
    project: 'Aplicación E-commerce',
    projectStatus: 'in_progress', // 'in_progress', 'completed', 'cancelled'
    projectUrl: '#', // URL del proyecto (disponible solo si está en progreso o completado)
    tags: ['Urgente', 'Cliente Premium'],
    lastMessage: {
      content: 'Perfecto, me gusta mucho el diseño. ¿Cuándo podemos hacer la revisión final?',
      timestamp: '2025-01-28T10:30:00Z',
      sender: 'participant',
      read: false
    },
    unreadCount: 2,
    messages: [
      {
        id: 1,
        content: 'Hola! He revisado los mockups y me parecen excelentes.',
        timestamp: '2025-01-28T10:15:00Z',
        sender: 'participant',
        read: true
      },
      {
        id: 2,
        content: 'Muchas gracias María! Me alegra que te gusten. He implementado todas las sugerencias que me diste.',
        timestamp: '2025-01-28T10:20:00Z',
        sender: 'me',
        read: true
      },
      {
        id: 3,
        content: 'Perfecto, me gusta mucho el diseño. ¿Cuándo podemos hacer la revisión final?',
        timestamp: '2025-01-28T10:30:00Z',
        sender: 'participant',
        read: false
      }
    ]
  },
  {
    id: 2,
    participant: {
      name: 'Carlos Ruiz',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face&auto=format&q=80',
      role: 'Cliente',
      rating: 5.0,
      online: false
    },
    project: 'Identidad Visual Startup',
    projectStatus: 'completed',
    projectUrl: '/projects/identidad-visual-startup',
    tags: ['Completado', 'Diseño'],
    lastMessage: {
      content: 'Gracias por la entrega rápida. Todo perfecto!',
      timestamp: '2025-01-27T16:45:00Z',
      sender: 'participant',
      read: true
    },
    unreadCount: 0,
    messages: [
      {
        id: 1,
        content: 'El proyecto está completado. Te envío todos los archivos finales.',
        timestamp: '2025-01-27T16:30:00Z',
        sender: 'me',
        read: true
      },
      {
        id: 2,
        content: 'Gracias por la entrega rápida. Todo perfecto!',
        timestamp: '2025-01-27T16:45:00Z',
        sender: 'participant',
        read: true
      }
    ]
  },
  {
    id: 3,
    participant: {
      name: 'Ana Martínez',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face&auto=format&q=80',
      role: 'Freelancer',
      rating: 4.9,
      online: true
    },
    project: 'Consultoría Base de Datos',
    projectStatus: 'in_progress',
    projectUrl: '/projects/consultoria-base-datos',
    tags: ['Consultoría', 'Base de Datos'],
    lastMessage: {
      content: 'Te mando el análisis inicial que me pediste',
      timestamp: '2025-01-26T14:20:00Z',
      sender: 'me',
      read: true
    },
    unreadCount: 0,
    messages: [
      {
        id: 1,
        content: 'Necesito que revises la estructura actual de la base de datos.',
        timestamp: '2025-01-26T14:00:00Z',
        sender: 'participant',
        read: true
      },
      {
        id: 2,
        content: 'Te mando el análisis inicial que me pediste',
        timestamp: '2025-01-26T14:20:00Z',
        sender: 'me',
        read: true
      }
    ]
  },
  {
    id: 4,
    participant: {
      name: 'Diego Silva',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face&auto=format&q=80',
      role: 'Cliente',
      rating: 4.7,
      online: true
    },
    project: 'App Móvil Fitness',
    projectStatus: 'cancelled',
    projectUrl: null, // No disponible para proyectos cancelados
    tags: ['Cancelado', 'Móvil'],
    lastMessage: {
      content: '¿Podrías agregar la funcionalidad de notificaciones push?',
      timestamp: '2025-01-25T09:15:00Z',
      sender: 'participant',
      read: true
    },
    unreadCount: 0,
    messages: [
      {
        id: 1,
        content: 'El prototipo se ve increíble! Felicitaciones por el trabajo.',
        timestamp: '2025-01-25T09:00:00Z',
        sender: 'participant',
        read: true
      },
      {
        id: 2,
        content: '¿Podrías agregar la funcionalidad de notificaciones push?',
        timestamp: '2025-01-25T09:15:00Z',
        sender: 'participant',
        read: true
      }
    ]
  },
  {
    id: 5,
    participant: {
      name: 'Laura Fernández',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face&auto=format&q=80',
      role: 'Emprendedora',
      rating: 4.9,
      online: false
    },
    project: 'Rediseño Sitio Web',
    projectStatus: 'in_progress',
    projectUrl: '/projects/rediseno-sitio-web',
    tags: ['Web', 'Rediseño'],
    lastMessage: {
      content: 'Los cambios en la página principal están perfectos. Procede con el resto.',
      timestamp: '2025-01-24T15:30:00Z',
      sender: 'participant',
      read: true
    },
    unreadCount: 0,
    messages: [
      {
        id: 1,
        content: 'Hola! He visto tu portafolio y me encanta tu estilo de diseño.',
        timestamp: '2025-01-24T14:00:00Z',
        sender: 'participant',
        read: true
      },
      {
        id: 2,
        content: 'Los cambios en la página principal están perfectos. Procede con el resto.',
        timestamp: '2025-01-24T15:30:00Z',
        sender: 'participant',
        read: true
      }
    ]
  },
  {
    id: 6,
    participant: {
      name: 'Roberto Chen',
      avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150&h=150&fit=crop&crop=face&auto=format&q=80',
      role: 'Desarrollador',
      rating: 5.0,
      online: true
    },
    project: 'Integración API Payment',
    projectStatus: 'completed',
    projectUrl: '/projects/integracion-api-payment',
    tags: ['API', 'Pagos', 'Completado'],
    lastMessage: {
      content: 'Documentación lista. La API está funcionando correctamente en producción.',
      timestamp: '2025-01-24T11:45:00Z',
      sender: 'me',
      read: true
    },
    unreadCount: 0,
    messages: [
      {
        id: 1,
        content: '¿Podrías ayudarme con la integración de Stripe en mi proyecto?',
        timestamp: '2025-01-24T10:00:00Z',
        sender: 'participant',
        read: true
      },
      {
        id: 2,
        content: 'Documentación lista. La API está funcionando correctamente en producción.',
        timestamp: '2025-01-24T11:45:00Z',
        sender: 'me',
        read: true
      }
    ]
  }
]

export default function MessagesPage() {
  const { user, isAuthenticated } = useAuthStore()
  const [conversations, setConversations] = useState(mockConversations)
  const [selectedConversation, setSelectedConversation] = useState(conversations[0])
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSidebar, setShowSidebar] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [screenSize, setScreenSize] = useState('desktop')
  const [showOptionsMenu, setShowOptionsMenu] = useState(false)
  const [showTagsModal, setShowTagsModal] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [originalTitle, setOriginalTitle] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'completed' | 'cancelled'>('all')
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{
    type: 'archive' | 'block' | 'delete'
    title: string
    message: string
    action: () => void
  } | null>(null)

  // Tags predefinidos que el freelancer puede usar
  const availableTags = [
    'Urgente', 'Cliente Premium', 'Revisión Pendiente', 'Pago Pendiente',
    'Primera Entrega', 'Seguimiento', 'Completado', 'Cancelado',
    'Web', 'Móvil', 'Diseño', 'Desarrollo', 'API', 'Base de Datos',
    'Consultoría', 'Marketing', 'E-commerce', 'Startup'
  ]

  // Update browser tab title with unread messages count
  const updateBrowserTitle = React.useCallback(() => {
    const totalUnread = conversations.reduce((total, conv) => total + conv.unreadCount, 0)
    
    if (totalUnread > 0) {
      document.title = `(${totalUnread}) Mensajes - LaburAR`
      
      // Add red dot to favicon (simulate notification)
      const canvas = document.createElement('canvas')
      canvas.width = 32
      canvas.height = 32
      const ctx = canvas.getContext('2d')
      
      if (ctx) {
        // Load original favicon
        const img = new Image()
        img.onload = () => {
          // Draw original favicon
          ctx.drawImage(img, 0, 0, 32, 32)
          
          // Add red notification dot
          ctx.fillStyle = '#ef4444'
          ctx.beginPath()
          ctx.arc(24, 8, 6, 0, 2 * Math.PI)
          ctx.fill()
          
          // Add white border to dot
          ctx.strokeStyle = '#ffffff'
          ctx.lineWidth = 2
          ctx.stroke()
          
          // Update favicon
          const link = document.querySelector('link[rel="icon"]') as HTMLLinkElement
          if (link) {
            link.href = canvas.toDataURL('image/png')
          }
        }
        img.src = '/favicon.ico'
      }
    } else {
      document.title = originalTitle || 'Mensajes - LaburAR'
      
      // Reset favicon to original
      const link = document.querySelector('link[rel="icon"]') as HTMLLinkElement
      if (link) {
        link.href = '/favicon.ico'
      }
    }
  }, [conversations, originalTitle])

  // Initialize and detect screen size
  React.useEffect(() => {
    // Store original title
    setOriginalTitle(document.title)
    
    const checkScreenSize = () => {
      const width = window.innerWidth
      
      if (width < 640) {
        setScreenSize('mobile')
        setIsMobile(true)
        setShowSidebar(false)
      } else if (width < 1024) {
        setScreenSize('tablet')
        setIsMobile(true)
        setShowSidebar(false)
      } else {
        setScreenSize('desktop')
        setIsMobile(false)
        setShowSidebar(true)
      }
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Update browser title when conversations change
  React.useEffect(() => {
    updateBrowserTitle()
  }, [updateBrowserTitle])

  // Reset title when component unmounts
  React.useEffect(() => {
    return () => {
      if (originalTitle) {
        document.title = originalTitle
      }
      const link = document.querySelector('link[rel="icon"]') as HTMLLinkElement
      if (link) {
        link.href = '/favicon.ico'
      }
    }
  }, [originalTitle])

  // Close menus when clicking outside  
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      
      if (showOptionsMenu && !target.closest('.options-menu-container')) {
        setShowOptionsMenu(false)
      }
      
      if (showTagsModal && !target.closest('.tags-modal-container')) {
        setShowTagsModal(false)
      }

      if (showStatusDropdown && !target.closest('.status-dropdown-container')) {
        setShowStatusDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showOptionsMenu, showTagsModal, showStatusDropdown])

  // Close confirm modal on Escape key
  React.useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showConfirmModal) {
        handleCancelAction()
      }
    }

    document.addEventListener('keydown', handleEscapeKey)
    return () => document.removeEventListener('keydown', handleEscapeKey)
  }, [showConfirmModal])

  if (!isAuthenticated || !user) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <MotionCard className="p-8 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-black mb-2">Acceso Requerido</h2>
            <p className="text-black mb-4">Necesitas iniciar sesión para ver tus mensajes.</p>
            <Button variant="gradient">Iniciar Sesión</Button>
          </MotionCard>
        </div>
      </>
    )
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const message = {
      id: Date.now(),
      content: newMessage,
      timestamp: new Date().toISOString(),
      sender: 'me' as const,
      read: false
    }

    setSelectedConversation(prev => ({
      ...prev,
      messages: [...prev.messages, message],
      lastMessage: message
    }))

    setConversations(prev => 
      prev.map(conv => 
        conv.id === selectedConversation.id 
          ? { ...conv, messages: [...conv.messages, message], lastMessage: message }
          : conv
      )
    )

    setNewMessage('')
  }

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji)
  }

  const handleSelectConversation = (conversation: typeof conversations[0]) => {
    setSelectedConversation(conversation)
    if (screenSize === 'mobile' || screenSize === 'tablet') {
      setShowSidebar(false)
    }
  }

  const handleBackToList = () => {
    if (screenSize === 'mobile' || screenSize === 'tablet') {
      setShowSidebar(true)
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return formatTime(timestamp)
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer'
    } else {
      return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })
    }
  }

  const handleArchiveConversation = () => {
    setConfirmAction({
      type: 'archive',
      title: 'Archivar Conversación',
      message: `¿Estás seguro de que quieres archivar la conversación con ${selectedConversation.participant.name}? Podrás encontrarla en la sección de archivados.`,
      action: () => {
        alert('Conversación archivada correctamente')
        setShowOptionsMenu(false)
        setShowConfirmModal(false)
        setConfirmAction(null)
      }
    })
    setShowConfirmModal(true)
  }

  const handleBlockUser = () => {
    setConfirmAction({
      type: 'block',
      title: 'Bloquear Usuario',
      message: `¿Estás seguro de que quieres bloquear a ${selectedConversation.participant.name}? No podrás recibir más mensajes de este usuario y no aparecerá en tu lista de contactos.`,
      action: () => {
        alert(`Usuario ${selectedConversation.participant.name} bloqueado correctamente`)
        setShowOptionsMenu(false)
        setShowConfirmModal(false)
        setConfirmAction(null)
      }
    })
    setShowConfirmModal(true)
  }

  const handleDeleteConversation = () => {
    setConfirmAction({
      type: 'delete',
      title: 'Eliminar Conversación',
      message: `¿Estás seguro de que quieres eliminar permanentemente la conversación con ${selectedConversation.participant.name}? Esta acción no se puede deshacer y perderás todo el historial de mensajes.`,
      action: () => {
        setConversations(prev => prev.filter(conv => conv.id !== selectedConversation.id))
        if (conversations.length > 1) {
          setSelectedConversation(conversations.find(conv => conv.id !== selectedConversation.id) || conversations[0])
        }
        setShowOptionsMenu(false)
        setShowConfirmModal(false)
        setConfirmAction(null)
        alert('Conversación eliminada correctamente')
      }
    })
    setShowConfirmModal(true)
  }

  const handleCancelAction = () => {
    setShowConfirmModal(false)
    setConfirmAction(null)
  }

  const isProjectFinished = selectedConversation.projectStatus === 'completed' || selectedConversation.projectStatus === 'cancelled'

  const handleViewProject = () => {
    if (selectedConversation.projectUrl) {
      // En un caso real, esto abriría el proyecto en una nueva pestaña
      alert(`Abriendo proyecto: ${selectedConversation.project}`)
      // window.open(selectedConversation.projectUrl, '_blank')
    }
  }

  const handleAddTag = (tag: string) => {
    const updatedConversations = conversations.map(conv => 
      conv.id === selectedConversation.id 
        ? { ...conv, tags: [...conv.tags, tag] }
        : conv
    )
    setConversations(updatedConversations)
    setSelectedConversation(prev => ({ ...prev, tags: [...prev.tags, tag] }))
  }

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedConversations = conversations.map(conv => 
      conv.id === selectedConversation.id 
        ? { ...conv, tags: conv.tags.filter(tag => tag !== tagToRemove) }
        : conv
    )
    setConversations(updatedConversations)
    setSelectedConversation(prev => ({ 
      ...prev, 
      tags: prev.tags.filter(tag => tag !== tagToRemove) 
    }))
  }

  const handleAddCustomTag = () => {
    if (newTag.trim() && !selectedConversation.tags.includes(newTag.trim())) {
      handleAddTag(newTag.trim())
      setNewTag('')
    }
  }

  const getTagColor = (tag: string) => {
    const colorMap: { [key: string]: string } = {
      'Urgente': 'bg-red-500',
      'Cliente Premium': 'bg-purple-500',
      'Completado': 'bg-green-500',
      'Cancelado': 'bg-gray-500',
      'Revisión Pendiente': 'bg-yellow-500',
      'Pago Pendiente': 'bg-orange-500',
      'Primera Entrega': 'bg-blue-500',
      'Seguimiento': 'bg-indigo-500',
    }
    return colorMap[tag] || 'bg-gray-400'
  }

  const filteredConversations = conversations.filter(conv => {
    // Filter by search query
    const matchesSearch = conv.participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.project.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Filter by status
    const matchesStatus = statusFilter === 'all' || conv.projectStatus === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusCount = (status: string) => {
    if (status === 'all') return conversations.length
    return conversations.filter(conv => conv.projectStatus === status).length
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'all': return 'Todos los proyectos'
      case 'in_progress': return 'En progreso'
      case 'completed': return 'Completados'
      case 'cancelled': return 'Cancelados'
      default: return 'Todos los proyectos'
    }
  }

  const handleStatusFilterChange = (newStatus: typeof statusFilter) => {
    setStatusFilter(newStatus)
    setShowStatusDropdown(false)
  }

  return (
    <>
      <Header />
      <style jsx>{`
        .messages-container {
          height: calc(100vh - 64px) !important;
          display: flex;
          flex-direction: row;
        }
        
        .chat-area {
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 0;
        }
        
        .messages-list {
          flex: 1;
          overflow-y: auto;
          min-height: 0;
        }
        
        .message-input-area {
          flex-shrink: 0;
          border-top: 1px solid #e5e7eb;
        }
        
        @media (max-width: 640px) {
          .messages-container {
            height: calc(100vh - 64px) !important;
          }
          
          .message-input-area {
            padding: 12px;
          }
        }
        
        @media (min-width: 641px) and (max-width: 1023px) {
          .messages-container {
            height: calc(100vh - 64px) !important;
          }
        }
        
        @media (min-width: 1024px) {
          .messages-container {
            height: calc(100vh - 64px) !important;
          }
        }
      `}</style>
      <div className="messages-container bg-gray-50 flex relative"
           style={{ height: 'calc(100vh - 64px)', minHeight: 'calc(100vh - 64px)' }}>
      {/* Mobile Overlay */}
      {isMobile && showSidebar && (
        <div 
          className="absolute inset-0 bg-black bg-opacity-50 z-10"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Sidebar - Conversations List */}
      <div className={`${
        showSidebar ? 'translate-x-0' : '-translate-x-full'
      } ${
        screenSize === 'mobile' 
          ? 'absolute inset-y-0 left-0 z-20 w-full' 
          : screenSize === 'tablet'
          ? 'absolute inset-y-0 left-0 z-20 w-80'
          : 'relative w-80 flex-shrink-0'
      } bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out`}>
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h1 className="text-lg sm:text-xl font-bold text-black">Mensajes</h1>
            
            <div className="flex items-center gap-2">
              {/* Status Filter Dropdown */}
              <div className="relative status-dropdown-container">
                <button
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className="flex items-center justify-between h-8 sm:h-9 px-2 sm:px-3 rounded-lg border border-gray-300 bg-gray-50 hover:bg-gray-100 focus:border-laburar-sky-blue-500 focus:outline-none text-xs sm:text-sm transition-colors min-w-0"
                >
                  <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                    <Filter className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-700 truncate">
                      {statusFilter === 'all' ? 'Todos' : 
                       statusFilter === 'in_progress' ? 'Progreso' :
                       statusFilter === 'completed' ? 'Completados' :
                       'Cancelados'} ({getStatusCount(statusFilter)})
                    </span>
                  </div>
                  <ChevronDown className={`h-3 w-3 sm:h-4 sm:w-4 text-gray-500 transition-transform flex-shrink-0 ml-1 ${
                    showStatusDropdown ? 'rotate-180' : ''
                  }`} />
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {showStatusDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden"
                    >
                      <div className="py-1">
                        <button
                          onClick={() => handleStatusFilterChange('all')}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between transition-colors ${
                            statusFilter === 'all' ? 'bg-laburar-sky-blue-50 text-laburar-sky-blue-700' : 'text-gray-700'
                          }`}
                        >
                          <span>Todos los proyectos</span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            {getStatusCount('all')}
                          </span>
                        </button>
                        <button
                          onClick={() => handleStatusFilterChange('in_progress')}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between transition-colors ${
                            statusFilter === 'in_progress' ? 'bg-yellow-50 text-yellow-700' : 'text-gray-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <span>En progreso</span>
                          </div>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            {getStatusCount('in_progress')}
                          </span>
                        </button>
                        <button
                          onClick={() => handleStatusFilterChange('completed')}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between transition-colors ${
                            statusFilter === 'completed' ? 'bg-green-50 text-green-700' : 'text-gray-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Completados</span>
                          </div>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            {getStatusCount('completed')}
                          </span>
                        </button>
                        <button
                          onClick={() => handleStatusFilterChange('cancelled')}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between transition-colors ${
                            statusFilter === 'cancelled' ? 'bg-red-50 text-red-700' : 'text-gray-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span>Cancelados</span>
                          </div>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            {getStatusCount('cancelled')}
                          </span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {(screenSize === 'mobile' || screenSize === 'tablet') && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowSidebar(false)}
                  className="h-8 w-8"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              )}
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar conversaciones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 sm:h-10 pl-10 pr-4 rounded-lg border border-gray-300 bg-gray-50 focus:border-laburar-sky-blue-500 focus:outline-none text-sm"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conversation) => (
            <motion.div
              key={conversation.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`p-3 sm:p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedConversation.id === conversation.id ? 'bg-laburar-sky-blue-50 border-r-2 border-r-laburar-sky-blue-500' : ''
              }`}
              onClick={() => handleSelectConversation(conversation)}
            >
              <div className="flex items-start gap-3">
                <div className="relative flex-shrink-0">
                  <img
                    src={conversation.participant.avatar}
                    alt={conversation.participant.name}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.participant.name)}&background=667eea&color=fff&size=150`;
                    }}
                  />
                  {conversation.participant.online && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-400 border-2 border-white rounded-full" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-black truncate text-sm sm:text-base">
                      {conversation.participant.name}
                    </h3>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                      {formatDate(conversation.lastMessage.timestamp)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs text-laburar-sky-blue-600 font-medium truncate flex-1">
                      {conversation.project}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full text-white text-[10px] font-medium flex-shrink-0 ${
                      conversation.projectStatus === 'completed' ? 'bg-green-500' :
                      conversation.projectStatus === 'cancelled' ? 'bg-red-500' :
                      'bg-yellow-500'
                    }`}>
                      {conversation.projectStatus === 'completed' ? 'Completado' :
                       conversation.projectStatus === 'cancelled' ? 'Cancelado' :
                       'En progreso'}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 truncate mb-2">
                    {conversation.lastMessage.content}
                  </p>

                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-400 fill-current" />
                      <span className="text-xs text-gray-500">{conversation.participant.rating}</span>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <div className="bg-laburar-sky-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                        {conversation.unreadCount}
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {conversation.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {conversation.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium text-white ${getTagColor(tag)}`}
                        >
                          {tag}
                        </span>
                      ))}
                      {conversation.tags.length > 3 && (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium text-gray-500 bg-gray-200">
                          +{conversation.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Mobile Menu Button */}
      {(screenSize === 'mobile' || screenSize === 'tablet') && !showSidebar && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowSidebar(true)}
          className="absolute top-3 left-3 z-30 bg-white shadow-lg border-2 border-gray-200"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </Button>
      )}

      {/* Main Chat Area */}
      <div className={`chat-area ${
        isMobile && showSidebar ? 'hidden' : 'flex'
      } flex-1 w-full min-w-0`}>
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Back button for mobile */}
              {(screenSize === 'mobile' || screenSize === 'tablet') && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleBackToList}
                  className="mr-2"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Button>
              )}
              <div className="relative">
                <img
                  src={selectedConversation.participant.avatar}
                  alt={selectedConversation.participant.name}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedConversation.participant.name)}&background=667eea&color=fff&size=150`;
                  }}
                />
                {selectedConversation.participant.online && (
                  <div className="absolute -bottom-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-green-400 border-2 border-white rounded-full" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-black text-sm sm:text-base truncate">{selectedConversation.participant.name}</h2>
                <p className="text-xs sm:text-sm text-laburar-sky-blue-600 truncate">{selectedConversation.project}</p>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              {/* Ver Proyecto Button */}
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 sm:h-10 sm:w-10"
                onClick={handleViewProject}
                disabled={!selectedConversation.projectUrl}
                title={selectedConversation.projectUrl ? 'Ver proyecto' : 'Proyecto no disponible'}
              >
                <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              
              {/* Gestionar Tags Button */}
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 sm:h-10 sm:w-10"
                onClick={() => setShowTagsModal(true)}
                title="Gestionar tags"
              >
                <Tag className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              
              {/* Options Menu */}
              <div className="relative options-menu-container">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 sm:h-10 sm:w-10"
                  onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                >
                  <MoreVertical className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {showOptionsMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border z-50"
                    >
                    {/* Project Status Indicator */}
                    <div className="px-3 py-2 border-b bg-gray-50 text-xs text-gray-600">
                      Estado: <span className={`font-medium ${
                        selectedConversation.projectStatus === 'completed' ? 'text-green-600' :
                        selectedConversation.projectStatus === 'cancelled' ? 'text-red-600' :
                        'text-yellow-600'
                      }`}>
                        {selectedConversation.projectStatus === 'completed' ? 'Completado' :
                         selectedConversation.projectStatus === 'cancelled' ? 'Cancelado' :
                         'En progreso'}
                      </span>
                    </div>

                    {/* Options */}
                    <div className="py-1">
                      <button
                        onClick={handleArchiveConversation}
                        disabled={!isProjectFinished}
                        className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
                          isProjectFinished 
                            ? 'hover:bg-gray-50 text-gray-700' 
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <Archive className="h-4 w-4" />
                        Archivar
                      </button>
                      
                      <button
                        onClick={handleBlockUser}
                        disabled={!isProjectFinished}
                        className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
                          isProjectFinished 
                            ? 'hover:bg-gray-50 text-gray-700' 
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <UserX className="h-4 w-4" />
                        Bloquear
                      </button>
                      
                      <button
                        onClick={handleDeleteConversation}
                        disabled={!isProjectFinished}
                        className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
                          isProjectFinished 
                            ? 'hover:bg-red-50 text-red-600' 
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </button>
                    </div>

                    {/* Warning for disabled options */}
                    {!isProjectFinished && (
                      <div className="px-3 py-2 border-t bg-yellow-50 text-xs text-yellow-700">
                        <div className="flex items-start gap-2">
                          <span className="text-yellow-500">⚠️</span>
                          <span>Las opciones se habilitarán cuando el proyecto sea completado o cancelado.</span>
                        </div>
                      </div>
                    )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="messages-list p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50">
          {selectedConversation.messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`w-full max-w-[75%] sm:max-w-[85%] lg:max-w-md ${
                message.sender === 'me' 
                  ? 'bg-laburar-sky-blue-500 text-white' 
                  : 'bg-white text-black'
              } rounded-2xl px-3 py-2 sm:px-4 sm:py-2 shadow-sm`}>
                <p className="text-sm break-words">{message.content}</p>
                <div className={`flex items-center justify-end gap-1 mt-1 ${
                  message.sender === 'me' ? 'text-white/70' : 'text-gray-500'
                }`}>
                  <span className="text-xs">{formatTime(message.timestamp)}</span>
                  {message.sender === 'me' && (
                    <CheckCheck className={`h-3 w-3 ${message.read ? 'text-blue-200' : 'text-white/50'}`} />
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Message Input */}
        <div className="message-input-area bg-white p-4 sm:p-5">
          <form onSubmit={handleSendMessage} className="flex items-center gap-3 sm:gap-4">
            {/* Desktop attachment buttons */}
            <div className="hidden sm:flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                size="icon"
                className="h-12 w-12 flex-shrink-0"
              >
                <Paperclip className="h-5 w-5" />
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="icon"
                className="h-12 w-12 flex-shrink-0"
              >
                <ImageIcon className="h-5 w-5" />
              </Button>
            </div>

            {/* Mobile attachment button */}
            <div className="sm:hidden">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-12 w-12 flex-shrink-0"
              >
                <Paperclip className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 relative">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 sm:px-5 sm:py-4 focus:border-laburar-sky-blue-500 focus:outline-none text-base leading-relaxed overflow-hidden"
                rows={1}
                style={{ 
                  minHeight: '48px', 
                  maxHeight: '144px',
                  height: '48px'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage(e)
                  }
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = '48px'
                  const newHeight = Math.min(target.scrollHeight, 144)
                  target.style.height = newHeight + 'px'
                  
                  // Solo mostrar scroll si es necesario
                  if (target.scrollHeight > 144) {
                    target.style.overflowY = 'auto'
                  } else {
                    target.style.overflowY = 'hidden'
                  }
                }}
              />
            </div>

            {/* Emoji button - outside textarea */}
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-12 w-12 flex-shrink-0"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Smile className="h-5 w-5" />
              </Button>
              
              <EmojiPicker
                isOpen={showEmojiPicker}
                onClose={() => setShowEmojiPicker(false)}
                onEmojiSelect={handleEmojiSelect}
              />
            </div>

            <Button 
              type="submit" 
              variant="gradient" 
              size="icon"
              disabled={!newMessage.trim()}
              className="h-12 w-12 flex-shrink-0"
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>

      {/* Tags Management Modal */}
      <AnimatePresence>
        {showTagsModal && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setShowTagsModal(false)}
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="tags-modal-container bg-white rounded-lg shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Gestionar Tags - {selectedConversation.participant.name}
                  </h3>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowTagsModal(false)}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Content */}
                <div className="p-4 max-h-96 overflow-y-auto">
                  {/* Current Tags */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Tags actuales:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedConversation.tags.length > 0 ? (
                        selectedConversation.tags.map((tag, index) => (
                          <span
                            key={index}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white ${getTagColor(tag)}`}
                          >
                            {tag}
                            <button
                              onClick={() => handleRemoveTag(tag)}
                              className="hover:bg-white hover:bg-opacity-20 rounded-full p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No hay tags asignados</p>
                      )}
                    </div>
                  </div>

                  {/* Add Custom Tag */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Agregar tag personalizado:</h4>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Nuevo tag..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAddCustomTag()
                          }
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-laburar-sky-blue-500 focus:border-transparent"
                      />
                      <Button
                        onClick={handleAddCustomTag}
                        disabled={!newTag.trim() || selectedConversation.tags.includes(newTag.trim())}
                        size="sm"
                        className="px-3"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Predefined Tags */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Tags disponibles:</h4>
                    <div className="flex flex-wrap gap-2">
                      {availableTags
                        .filter(tag => !selectedConversation.tags.includes(tag))
                        .map((tag) => (
                          <button
                            key={tag}
                            onClick={() => handleAddTag(tag)}
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white transition-opacity hover:opacity-80 ${getTagColor(tag)}`}
                          >
                            {tag}
                            <Plus className="h-3 w-3 ml-1" />
                          </button>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
                  <Button
                    variant="outline"
                    onClick={() => setShowTagsModal(false)}
                  >
                    Cerrar
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && confirmAction && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-50"
              onClick={handleCancelAction}
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className={`flex items-center gap-3 p-4 border-b ${
                  confirmAction.type === 'delete' ? 'bg-red-50' :
                  confirmAction.type === 'block' ? 'bg-orange-50' :
                  'bg-blue-50'
                }`}>
                  <div className={`p-2 rounded-full ${
                    confirmAction.type === 'delete' ? 'bg-red-100' :
                    confirmAction.type === 'block' ? 'bg-orange-100' :
                    'bg-blue-100'
                  }`}>
                    {confirmAction.type === 'delete' ? (
                      <Trash2 className={`h-5 w-5 text-red-600`} />
                    ) : confirmAction.type === 'block' ? (
                      <UserX className={`h-5 w-5 text-orange-600`} />
                    ) : (
                      <Archive className={`h-5 w-5 text-blue-600`} />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {confirmAction.title}
                    </h3>
                    <div className="flex items-center gap-1 mt-1">
                      <AlertTriangle className="h-3 w-3 text-amber-500" />
                      <span className="text-xs text-amber-600 font-medium">Acción irreversible</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {confirmAction.message}
                  </p>
                  
                  {confirmAction.type === 'delete' && (
                    <div className="mt-3 p-3 bg-red-50 border-l-4 border-red-400 rounded">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                        <p className="text-xs text-red-700 font-medium">
                          ⚠️ Esta acción eliminará permanentemente todos los mensajes y no se puede deshacer.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 p-4 bg-gray-50 border-t">
                  <Button
                    variant="outline"
                    onClick={handleCancelAction}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={confirmAction.action}
                    className={`flex-1 ${
                      confirmAction.type === 'delete' 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : confirmAction.type === 'block'
                        ? 'bg-orange-600 hover:bg-orange-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {confirmAction.type === 'delete' ? 'Eliminar definitivamente' :
                     confirmAction.type === 'block' ? 'Bloquear usuario' :
                     'Archivar conversación'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      </div>
    </>
  )
}