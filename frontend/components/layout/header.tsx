'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalTrigger,
} from '@/components/ui/modal'
import { LoginForm } from '@/components/auth/login-form'
import { RegisterForm } from '@/components/auth/register-form'
import { UserMenu } from '@/components/layout/user-menu'
import { useAuthStore } from '@/stores/auth-store'
import { useUIStore } from '@/stores/ui-store'
import {
  Search,
  Menu,
  X,
  Bell,
  MessageSquare,
  User,
  Briefcase,
  ExternalLink,
  Check,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { APP_NAME, ROUTES, CATEGORIES, POPULAR_SERVICES } from '@/lib/constants'

const navigationItems = [
  { name: 'Inicio', href: ROUTES.HOME },
  { name: 'Cómo Funciona', href: '/como-funciona' },
  { name: 'Categorías', href: '/categories' },
]

// Demo notifications and messages
const demoNotifications = [
  {
    id: 1,
    title: 'Nuevo proyecto disponible',
    message: 'Un cliente está buscando un desarrollador React',
    time: 'Hace 5 minutos',
    unread: true,
    type: 'project',
  },
  {
    id: 2,
    title: 'Pago recibido',
    message: 'Has recibido $1,500 por el proyecto "Diseño de Logo"',
    time: 'Hace 2 horas',
    unread: true,
    type: 'payment',
  },
  {
    id: 3,
    title: 'Nueva reseña',
    message: 'Carlos te dejó una reseña de 5 estrellas',
    time: 'Ayer',
    unread: false,
    type: 'review',
  },
]

const demoMessages = [
  {
    id: 1,
    sender: 'María García',
    message: 'Hola! Me interesa tu servicio de diseño web',
    time: 'Hace 10 minutos',
    unread: true,
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b1ab?w=80&h=80&fit=crop&crop=face',
  },
  {
    id: 2,
    sender: 'Juan Pérez',
    message: '¿Cuándo podrías empezar con el proyecto?',
    time: 'Hace 1 hora',
    unread: true,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face',
  },
  {
    id: 3,
    sender: 'Ana López',
    message: 'Gracias por tu propuesta, la revisaré',
    time: 'Hace 3 horas',
    unread: false,
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face',
  },
  {
    id: 4,
    sender: 'Carlos Mendoza',
    message: 'El logo quedó perfecto, muchas gracias!',
    time: 'Hace 1 día',
    unread: false,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face',
  },
  {
    id: 5,
    sender: 'Laura Ruiz',
    message: '¿Tienes disponibilidad para un proyecto de marketing?',
    time: 'Hace 2 días',
    unread: false,
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face',
  },
]

export function Header() {
  const pathname = usePathname()
  const { isAuthenticated, user } = useAuthStore()
  const { mobileMenuOpen, setMobileMenuOpen } = useUIStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [showHeaderSearch, setShowHeaderSearch] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showMessages, setShowMessages] = useState(false)
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [notifications, setNotifications] = useState(demoNotifications)
  const [messages, setMessages] = useState(demoMessages)
  const [isMobile, setIsMobile] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)
  const messageRef = useRef<HTMLDivElement>(null)
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null)
  const messageAudioRef = useRef<HTMLAudioElement | null>(null)

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/categories?search=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  const handleSearchInput = (value: string) => {
    setSearchQuery(value)
    
    if (value.trim().length > 1) {
      // Create search suggestions from categories and popular services
      const allSearchOptions = [
        ...CATEGORIES.map(cat => cat.name),
        ...POPULAR_SERVICES
      ]
      
      const filtered = allSearchOptions.filter(option =>
        option.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 6) // Limit to 6 suggestions
      
      setSearchSuggestions(filtered)
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion)
    setShowSuggestions(false)
    window.location.href = `/categories?search=${encodeURIComponent(suggestion)}`
  }

  const playNotificationSound = async () => {
    try {
      if (notificationAudioRef.current) {
        notificationAudioRef.current.currentTime = 0
        await notificationAudioRef.current.play()
        console.log('✅ Sonido de notificación reproducido')
      } else {
        console.error('❌ Audio ref no disponible para notificaciones')
      }
    } catch (error) {
      console.error('❌ Error reproduciendo sonido de notificación:', error)
    }
  }

  const playMessageSound = async () => {
    try {
      if (messageAudioRef.current) {
        messageAudioRef.current.currentTime = 0
        await messageAudioRef.current.play()
        console.log('✅ Sonido de mensaje reproducido')
      } else {
        console.error('❌ Audio ref no disponible para mensajes')
      }
    } catch (error) {
      console.error('❌ Error reproduciendo sonido de mensaje:', error)
    }
  }

  const markNotificationAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, unread: false } : notif
      )
    )
  }

  const markMessageAsRead = (id: number) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === id ? { ...msg, unread: false } : msg
      )
    )
  }

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, unread: false }))
    )
  }

  const markAllMessagesAsRead = () => {
    setMessages(prev => 
      prev.map(msg => ({ ...msg, unread: false }))
    )
  }

  const unreadNotifications = notifications.filter(n => n.unread).length
  const unreadMessages = messages.filter(m => m.unread).length

  useEffect(() => {
    const handleScroll = () => {
      // Check if we've scrolled past the hero section (approximately)
      const heroHeight = window.innerHeight * 0.8 // Assuming hero is roughly 80% of viewport height
      setShowHeaderSearch(window.scrollY > heroHeight)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Handle clicking outside of dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
      if (messageRef.current && !messageRef.current.contains(event.target as Node)) {
        setShowMessages(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Initialize audio elements
  useEffect(() => {
    if (notificationAudioRef.current) {
      notificationAudioRef.current.volume = 0.7
      console.log('🔊 Audio de notificación inicializado')
    }
    if (messageAudioRef.current) {
      messageAudioRef.current.volume = 0.7
      console.log('🔊 Audio de mensaje inicializado')
    }
  }, [])

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Temporary function to add new notification (for testing)
  const addTestNotification = () => {
    const newNotification = {
      id: Date.now(),
      title: 'Nueva notificación de prueba',
      message: `Notificación creada a las ${new Date().toLocaleTimeString()}`,
      time: 'Ahora mismo',
      unread: true,
      type: 'system',
    }
    setNotifications(prev => [newNotification, ...prev])
    playNotificationSound()
  }

  const addTestMessage = () => {
    const newMessage = {
      id: Date.now(),
      sender: 'Usuario de Prueba',
      message: `Mensaje de prueba enviado a las ${new Date().toLocaleTimeString()}`,
      time: 'Ahora mismo',
      unread: true,
      avatar: null,
    }
    setMessages(prev => [newMessage, ...prev])
    playNotificationSound() // Para mensajes nuevos usamos el sonido de notificacion.wav
  }

  const addTestChatMessage = () => {
    // Este es para simular un mensaje nuevo en una conversación de chat
    playMessageSound() // Para conversaciones de chat usamos mensaje nuevo.mp3
    console.log('Nuevo mensaje en chat - sonido reproducido')
  }

  const testAudioFiles = () => {
    console.log('🔍 Verificando archivos de audio...')
    console.log('Notification Audio:', notificationAudioRef.current)
    console.log('Message Audio:', messageAudioRef.current)
    
    if (notificationAudioRef.current) {
      console.log('Notification ready state:', notificationAudioRef.current.readyState)
      console.log('Notification src:', notificationAudioRef.current.src)
      console.log('Notification duration:', notificationAudioRef.current.duration)
    }
    
    if (messageAudioRef.current) {
      console.log('Message ready state:', messageAudioRef.current.readyState)
      console.log('Message src:', messageAudioRef.current.src)
      console.log('Message duration:', messageAudioRef.current.duration)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-laburar-sky-blue-200/50 bg-gradient-to-r from-laburar-white/95 to-laburar-sky-blue-50/90 backdrop-blur supports-[backdrop-filter]:bg-laburar-white/60 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href={ROUTES.HOME} className="flex items-center space-x-2">
            <img 
              src="/assets/img/logo.png" 
              alt="LABUREMOS Logo" 
              className="h-8 w-8 object-contain"
            />
            <span className="text-xl font-bold text-gradient">{APP_NAME}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  pathname === item.href
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Search Bar - Only show when scrolled past hero */}
          {showHeaderSearch && (
            <motion.div 
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.3 }}
              className="hidden md:flex flex-1 max-w-md mx-8"
            >
              <div className="relative w-full">
                <form onSubmit={handleSearch} className="relative w-full">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black" />
                  <input
                    type="text"
                    placeholder="Buscar servicios..."
                    value={searchQuery}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    onFocus={() => searchQuery.length > 1 && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className="h-10 w-full rounded-md border border-input bg-background pl-10 pr-12 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-sm transition-colors"
                  >
                    <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </form>
                
                {/* Search Suggestions */}
                <AnimatePresence>
                  {showSuggestions && searchSuggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto"
                    >
                      {searchSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0 flex items-center"
                        >
                          <Search className="h-3 w-3 text-gray-400 mr-2" />
                          {suggestion}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
            {isAuthenticated ? (
              <>
                {/* Temporary Test Buttons - Hide on smaller screens */}
                <div className="hidden xl:flex items-center gap-1 mr-4 border-r pr-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addTestNotification}
                    className="text-xs px-2"
                  >
                    Test Notif
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addTestMessage}
                    className="text-xs px-2"
                  >
                    Test Msg
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addTestChatMessage}
                    className="text-xs px-2"
                  >
                    Chat Msg
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testAudioFiles}
                    className="text-xs px-2"
                    title="Debug audio files"
                  >
                    🔍
                  </Button>
                </div>

                {/* Notifications */}
                <div className="relative" ref={notificationRef}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-8 w-8 lg:h-10 lg:w-10"
                    onClick={() => {
                      setShowNotifications(!showNotifications)
                      setShowMessages(false)
                    }}
                  >
                    <Bell className="h-4 w-4 lg:h-5 lg:w-5 text-gray-900" />
                    {unreadNotifications > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 lg:h-5 lg:w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                      </span>
                    )}
                  </Button>

                  {/* Notifications Dropdown */}
                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                          "absolute mt-2 bg-white rounded-lg shadow-xl border overflow-hidden z-50",
                          "w-80 sm:w-96 max-w-[calc(100vw-1rem)]",
                          "right-0 md:right-0"
                        )}
                        style={{ 
                          maxHeight: 'calc(100vh - 100px)',
                          minWidth: isMobile ? '280px' : '320px',
                          ...(window.innerWidth < 400 ? { 
                            right: '0.5rem', 
                            left: 'auto', 
                            transform: 'translateX(0)' 
                          } : {})
                        }}
                      >
                        {/* Arrow */}
                        <div className="absolute -top-2 right-4 w-4 h-4 bg-white border-l border-t transform rotate-45" />
                        
                        {/* Header */}
                        <div className="p-3 sm:p-4 border-b bg-gray-50">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Notificaciones</h3>
                            <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">{unreadNotifications} nuevas</span>
                          </div>
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-80 sm:max-h-96 overflow-y-auto">
                          {notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={cn(
                                "p-3 sm:p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors",
                                notification.unread && "bg-blue-50"
                              )}
                              onClick={() => markNotificationAsRead(notification.id)}
                            >
                              <div className="flex items-start gap-2 sm:gap-3">
                                <div className={cn(
                                  "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                                  notification.unread ? "bg-blue-500" : "bg-transparent"
                                )} />
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-gray-900 text-sm">{notification.title}</h4>
                                  <p className="text-sm text-gray-600 mt-1 break-words">{notification.message}</p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                    <span className="text-xs text-gray-500 truncate">{notification.time}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Mark all as read */}
                        <div className="border-t">
                          <button
                            onClick={markAllNotificationsAsRead}
                            className="w-full p-3 text-center hover:bg-gray-50 transition-colors"
                          >
                            <span className="text-xs sm:text-sm text-green-600 font-medium flex items-center justify-center gap-2">
                              <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                              Marcar como visto
                            </span>
                          </button>
                        </div>

                        {/* Footer */}
                        <Link href="/notifications">
                          <div className="p-3 sm:p-4 bg-gray-50 text-center hover:bg-gray-100 transition-colors">
                            <span className="text-xs sm:text-sm text-blue-600 font-medium flex items-center justify-center gap-2">
                              Ver todas las notificaciones
                              <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                            </span>
                          </div>
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Messages */}
                <div className="relative" ref={messageRef}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-8 w-8 lg:h-10 lg:w-10"
                    onClick={() => {
                      setShowMessages(!showMessages)
                      setShowNotifications(false)
                    }}
                  >
                    <MessageSquare className="h-4 w-4 lg:h-5 lg:w-5 text-gray-900" />
                    {unreadMessages > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 lg:h-5 lg:w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadMessages > 9 ? '9+' : unreadMessages}
                      </span>
                    )}
                  </Button>

                  {/* Messages Dropdown */}
                  <AnimatePresence>
                    {showMessages && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                          "absolute mt-2 bg-white rounded-lg shadow-xl border overflow-hidden z-50",
                          "w-80 sm:w-96 max-w-[calc(100vw-1rem)]",
                          "right-0 md:right-0"
                        )}
                        style={{ 
                          maxHeight: 'calc(100vh - 100px)',
                          minWidth: isMobile ? '280px' : '320px',
                          ...(window.innerWidth < 400 ? { 
                            right: '0.5rem', 
                            left: 'auto', 
                            transform: 'translateX(0)' 
                          } : {})
                        }}
                      >
                        {/* Arrow */}
                        <div className="absolute -top-2 right-4 w-4 h-4 bg-white border-l border-t transform rotate-45" />
                        
                        {/* Header */}
                        <div className="p-3 sm:p-4 border-b bg-gray-50">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Mensajes</h3>
                            <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">{unreadMessages} nuevos</span>
                          </div>
                        </div>

                        {/* Messages List */}
                        <div className="max-h-80 sm:max-h-96 overflow-y-auto">
                          {messages.map((message) => (
                            <div
                              key={message.id}
                              className={cn(
                                "p-3 sm:p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors",
                                message.unread && "bg-green-50"
                              )}
                              onClick={() => markMessageAsRead(message.id)}
                            >
                              <div className="flex items-start gap-2 sm:gap-3">
                                <div className="flex-shrink-0">
                                  {message.avatar ? (
                                    <img
                                      src={message.avatar}
                                      alt={message.sender}
                                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center text-white font-semibold text-xs sm:text-sm">
                                      {message.sender.split(' ').map(n => n[0]).join('')}
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <h4 className="font-medium text-gray-900 text-sm truncate">{message.sender}</h4>
                                    {message.unread && (
                                      <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1 line-clamp-2 break-words">{message.message}</p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                    <span className="text-xs text-gray-500 truncate">{message.time}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Mark all as read */}
                        <div className="border-t">
                          <button
                            onClick={markAllMessagesAsRead}
                            className="w-full p-3 text-center hover:bg-gray-50 transition-colors"
                          >
                            <span className="text-xs sm:text-sm text-green-600 font-medium flex items-center justify-center gap-2">
                              <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                              Marcar como visto
                            </span>
                          </button>
                        </div>

                        {/* Footer */}
                        <Link href={ROUTES.MESSAGES}>
                          <div className="p-3 sm:p-4 bg-gray-50 text-center hover:bg-gray-100 transition-colors">
                            <span className="text-xs sm:text-sm text-blue-600 font-medium flex items-center justify-center gap-2">
                              Ver todos los mensajes
                              <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                            </span>
                          </div>
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <UserMenu user={user} />
              </>
            ) : (
              <>
                <Modal>
                  <ModalTrigger asChild>
                    <Button variant="login">Iniciar Sesión</Button>
                  </ModalTrigger>
                  <ModalContent>
                    <ModalHeader>
                      <ModalTitle>Iniciar Sesión</ModalTitle>
                    </ModalHeader>
                    <LoginForm />
                  </ModalContent>
                </Modal>
                <Modal>
                  <ModalTrigger asChild>
                    <Button variant="gradient">Registrarse</Button>
                  </ModalTrigger>
                  <ModalContent>
                    <ModalHeader>
                      <ModalTitle>Crear Cuenta</ModalTitle>
                    </ModalHeader>
                    <RegisterForm />
                  </ModalContent>
                </Modal>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            {isAuthenticated && (
              <>
                {/* Mobile Notifications Icon */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-8 w-8"
                  onClick={() => {
                    setShowNotifications(!showNotifications)
                    setShowMessages(false)
                  }}
                >
                  <Bell className="h-4 w-4 text-gray-900" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </span>
                  )}
                </Button>
                
                {/* Mobile Messages Icon */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-8 w-8"
                  onClick={() => {
                    setShowMessages(!showMessages)
                    setShowNotifications(false)
                  }}
                >
                  <MessageSquare className="h-4 w-4 text-gray-900" />
                  {unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </span>
                  )}
                </Button>
              </>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleMobileMenu}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t bg-background/95 backdrop-blur"
          >
            <div className="py-4 space-y-4">
              {/* Mobile Search - Only show when scrolled past hero */}
              {showHeaderSearch && (
                <div className="relative px-4">
                  <form onSubmit={handleSearch} className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black" />
                    <input
                      type="text"
                      placeholder="Buscar servicios..."
                      value={searchQuery}
                      onChange={(e) => handleSearchInput(e.target.value)}
                      onFocus={() => searchQuery.length > 1 && setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      className="h-10 w-full rounded-md border border-input bg-background pl-10 pr-12 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                    <button
                      type="submit"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-sm transition-colors"
                    >
                      <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </form>
                  
                  {/* Mobile Search Suggestions */}
                  <AnimatePresence>
                    {showSuggestions && searchSuggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-1 mx-4 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto"
                      >
                        {searchSuggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0 flex items-center"
                          >
                            <Search className="h-3 w-3 text-gray-400 mr-2" />
                            {suggestion}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Mobile Navigation */}
              <nav className="px-4 space-y-2">
                {navigationItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'block py-2 text-sm font-medium transition-colors hover:text-primary',
                      pathname === item.href
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    )}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>

              {/* Mobile Actions */}
              <div className="px-4 pt-4 border-t space-y-2">
                {isAuthenticated ? (
                  <>
                    <Link
                      href={ROUTES.DASHBOARD}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center space-x-2 py-2 text-sm font-medium"
                    >
                      <User className="h-4 w-4" />
                      <span>Mi Panel</span>
                    </Link>
                    <Link
                      href={ROUTES.MESSAGES}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between py-2 text-sm font-medium"
                    >
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="h-4 w-4" />
                        <span>Mensajes</span>
                      </div>
                      {unreadMessages > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {unreadMessages > 9 ? '9+' : unreadMessages}
                        </span>
                      )}
                    </Link>
                    <div
                      onClick={() => {
                        setShowNotifications(!showNotifications)
                        setShowMessages(false)
                      }}
                      className="flex items-center justify-between py-2 text-sm font-medium cursor-pointer hover:text-primary"
                    >
                      <div className="flex items-center space-x-2">
                        <Bell className="h-4 w-4" />
                        <span>Notificaciones</span>
                      </div>
                      {unreadNotifications > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {unreadNotifications > 9 ? '9+' : unreadNotifications}
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <Modal>
                      <ModalTrigger asChild>
                        <Button variant="login" className="w-full justify-start">
                          Iniciar Sesión
                        </Button>
                      </ModalTrigger>
                      <ModalContent>
                        <ModalHeader>
                          <ModalTitle>Iniciar Sesión</ModalTitle>
                        </ModalHeader>
                        <LoginForm />
                      </ModalContent>
                    </Modal>
                    <Modal>
                      <ModalTrigger asChild>
                        <Button variant="gradient" className="w-full">
                          Registrarse
                        </Button>
                      </ModalTrigger>
                      <ModalContent>
                        <ModalHeader>
                          <ModalTitle>Crear Cuenta</ModalTitle>
                        </ModalHeader>
                        <RegisterForm />
                      </ModalContent>
                    </Modal>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Audio elements for sound effects */}
      <audio 
        ref={notificationAudioRef} 
        preload="auto"
        onLoadedData={() => console.log('🎵 notificacion.wav cargado')}
        onError={(e) => console.error('❌ Error cargando notificacion.wav:', e)}
      >
        <source src="/assets/sounds/notificacion.wav" type="audio/wav" />
        <source src="/assets/sounds/notificacion.wav" type="audio/x-wav" />
        Su navegador no soporta audio.
      </audio>
      <audio 
        ref={messageAudioRef} 
        preload="auto"
        onLoadedData={() => console.log('🎵 mensaje nuevo.mp3 cargado')}
        onError={(e) => console.error('❌ Error cargando mensaje nuevo.mp3:', e)}
      >
        <source src="/assets/sounds/mensaje nuevo.mp3" type="audio/mpeg" />
        <source src="/assets/sounds/mensaje nuevo.mp3" type="audio/mp3" />
        Su navegador no soporta audio.
      </audio>
    </header>
  )
}