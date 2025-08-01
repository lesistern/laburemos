'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { MotionCard } from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { useAuthStore } from '@/stores/auth-store' 
import { useToast } from '@/hooks/use-toast'
import { getUserBadges, getCategoriesWithCounts } from '@/lib/badges'
import { BadgeDisplay } from '@/components/ui/badge-display'
import { 
  Settings,
  User,
  Bell,
  Shield,
  CreditCard,
  Globe,
  Eye,
  EyeOff,
  Save,
  Camera,
  Mail,
  Phone,
  MapPin,
  Link as LinkIcon,
  Trash2,
  Download,
  AlertTriangle,
  Award
} from 'lucide-react'

const settingsCategories = [
  { id: 'profile', label: 'Perfil', icon: User },
  { id: 'badges', label: 'Insignias', icon: Award },
  { id: 'notifications', label: 'Notificaciones', icon: Bell },
  { id: 'privacy', label: 'Privacidad', icon: Shield },
  { id: 'billing', label: 'Facturación', icon: CreditCard },
  { id: 'language', label: 'Idioma', icon: Globe },
]

export default function SettingsPage() {
  const { user, isAuthenticated } = useAuthStore()
  const { toast } = useToast()
  const [activeCategory, setActiveCategory] = useState('profile')
  
  // Get user badges
  const userBadges = getUserBadges(user)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  // Form states
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: '+1 (555) 123-4567',
    location: 'Buenos Aires, Argentina',
    website: 'https://miportfolio.com',
    bio: 'Desarrollador full-stack con más de 5 años de experiencia...',
    skills: ['React', 'Node.js', 'TypeScript', 'AWS']
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    projectUpdates: true,
    messageNotifications: true,
    marketingEmails: false,
    weeklyDigest: true
  })

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    showEmail: false,
    showPhone: false,
    allowMessages: true,
    showOnlineStatus: true
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  if (!isAuthenticated || !user) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <MotionCard className="p-8 text-center">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-black mb-2">Acceso Requerido</h2>
            <p className="text-black mb-4">Necesitas iniciar sesión para acceder a la configuración.</p>
            <Button variant="gradient">Iniciar Sesión</Button>
          </MotionCard>
        </div>
        <Footer />
      </>
    )
  }

  const handleSaveProfile = () => {
    // Simulate API call
    toast({
      title: 'Perfil actualizado',
      description: 'Los cambios han sido guardados correctamente.',
      variant: 'default'
    })
  }

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Las contraseñas no coinciden.',
        variant: 'destructive'
      })
      return
    }

    // Simulate API call
    toast({
      title: 'Contraseña actualizada',
      description: 'Tu contraseña ha sido cambiada correctamente.',
      variant: 'default'
    })

    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
  }

  const renderProfileSettings = () => (
    <div className="space-y-6">
      {/* Profile Picture */}
      <div className="flex items-center gap-6">
        <div className="relative">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt="Profile"
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-laburar-sky-blue-500 to-laburar-sky-blue-600 flex items-center justify-center text-white text-2xl font-semibold">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
          )}
          <Button
            size="icon"
            variant="outline"
            className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
          >
            <Camera className="h-4 w-4" />
          </Button>
        </div>
        <div>
          <h3 className="font-semibold text-black">Foto de perfil</h3>
          <p className="text-sm text-gray-600">JPG, PNG o GIF. Máximo 2MB</p>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" size="sm">Cambiar foto</Button>
            <Button variant="outline" size="sm" className="text-red-600">Eliminar</Button>
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-black mb-1">Nombre</label>
          <input
            type="text"
            value={profileData.firstName}
            onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
            className="w-full h-10 px-3 rounded-md border border-gray-300 focus:border-laburar-sky-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-black mb-1">Apellido</label>
          <input
            type="text"
            value={profileData.lastName}
            onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
            className="w-full h-10 px-3 rounded-md border border-gray-300 focus:border-laburar-sky-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-1">Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="email"
            value={profileData.email}
            onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full h-10 pl-10 pr-3 rounded-md border border-gray-300 focus:border-laburar-sky-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-black mb-1">Teléfono</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="tel"
              value={profileData.phone}
              onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full h-10 pl-10 pr-3 rounded-md border border-gray-300 focus:border-laburar-sky-blue-500 focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-black mb-1">Ubicación</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={profileData.location}
              onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
              className="w-full h-10 pl-10 pr-3 rounded-md border border-gray-300 focus:border-laburar-sky-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-1">Sitio web</label>
        <div className="relative">
          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="url"
            value={profileData.website}
            onChange={(e) => setProfileData(prev => ({ ...prev, website: e.target.value }))}
            className="w-full h-10 pl-10 pr-3 rounded-md border border-gray-300 focus:border-laburar-sky-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-1">Biografía</label>
        <textarea
          value={profileData.bio}
          onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
          rows={4}
          className="w-full px-3 py-2 rounded-md border border-gray-300 focus:border-laburar-sky-blue-500 focus:outline-none resize-none"
          placeholder="Cuéntanos sobre ti..."
        />
        <p className="text-xs text-gray-500 mt-1">Máximo 500 caracteres</p>
      </div>

      {/* Change Password */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-black mb-4">Cambiar contraseña</h3>
        
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-black mb-1">Contraseña actual</label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                className="w-full h-10 px-3 pr-10 rounded-md border border-gray-300 focus:border-laburar-sky-blue-500 focus:outline-none"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">Nueva contraseña</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                className="w-full h-10 px-3 pr-10 rounded-md border border-gray-300 focus:border-laburar-sky-blue-500 focus:outline-none"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">Confirmar contraseña</label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="w-full h-10 px-3 rounded-md border border-gray-300 focus:border-laburar-sky-blue-500 focus:outline-none"
            />
          </div>

          <Button onClick={handleChangePassword} variant="outline">
            Cambiar contraseña
          </Button>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleSaveProfile} variant="gradient" className="gap-2">
          <Save className="h-4 w-4" />
          Guardar cambios
        </Button>
      </div>
    </div>
  )

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-black mb-4">Preferencias de notificación</h3>
        
        <div className="space-y-4">
          {Object.entries(notificationSettings).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-black">
                  {key === 'emailNotifications' && 'Notificaciones por email'}
                  {key === 'pushNotifications' && 'Notificaciones push'}
                  {key === 'projectUpdates' && 'Actualizaciones de proyectos'}
                  {key === 'messageNotifications' && 'Nuevos mensajes'}
                  {key === 'marketingEmails' && 'Emails de marketing'}
                  {key === 'weeklyDigest' && 'Resumen semanal'}
                </p>
                <p className="text-sm text-gray-600">
                  {key === 'emailNotifications' && 'Recibe notificaciones importantes por email'}
                  {key === 'pushNotifications' && 'Notificaciones en el navegador'}
                  {key === 'projectUpdates' && 'Cambios en el estado de tus proyectos'}
                  {key === 'messageNotifications' && 'Cuando recibas nuevos mensajes'}
                  {key === 'marketingEmails' && 'Ofertas y promociones especiales'}
                  {key === 'weeklyDigest' && 'Resumen de tu actividad semanal'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setNotificationSettings(prev => ({ ...prev, [key]: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-laburar-sky-blue-500"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderBadgesSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-black mb-4">Mis Insignias</h3>
        <p className="text-gray-600 mb-6">
          Estas son todas las insignias que has ganado en LaburAR. Algunas son más raras que otras.
        </p>
        
        {userBadges.length > 0 ? (
          <>
            {/* Badges by Category */}
            <div className="space-y-8">
              {getCategoriesWithCounts(userBadges).map((categoryData) => (
                <div key={categoryData.name}>
                  <h4 className={`text-md font-semibold mb-3 ${categoryData.color}`}>
                    {categoryData.displayName} ({categoryData.count})
                  </h4>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                    {categoryData.badges.map((badge, index) => (
                      <motion.div
                        key={badge.id}
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                        className="flex flex-col items-center"
                      >
                        <BadgeDisplay badge={badge} size="md" />
                        <p className="text-xs text-center mt-1 text-gray-700 line-clamp-2">
                          {badge.name}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Badge Statistics */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xl font-bold text-black">{userBadges.length}</div>
                <div className="text-xs text-gray-600">Total</div>
              </div>
              <div className="text-center p-3 bg-pink-50 rounded-lg">
                <div className="text-xl font-bold text-pink-600">
                  {userBadges.filter(b => b.category === 'exclusivo').length}
                </div>
                <div className="text-xs text-gray-600">Exclusivas</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-xl font-bold text-yellow-600">
                  {userBadges.filter(b => b.category === 'legendario').length}
                </div>
                <div className="text-xs text-gray-600">Legendarias</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-xl font-bold text-purple-600">
                  {userBadges.filter(b => b.category === 'épico').length}
                </div>
                <div className="text-xs text-gray-600">Épicas</div>
              </div>
              <div className="text-center p-3 bg-indigo-50 rounded-lg">
                <div className="text-xl font-bold text-indigo-600">
                  {userBadges.filter(b => b.category === 'habilidades').length}
                </div>
                <div className="text-xs text-gray-600">Habilidades</div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Sin insignias aún</h4>
            <p className="text-gray-600 mb-6">
              Completa proyectos y cumple objetivos para ganar tus primeras insignias.
            </p>
            <Button variant="gradient">Explorar objetivos</Button>
          </div>
        )}
      </div>
    </div>
  )

  const renderDangerZone = () => (
    <div className="border-t pt-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Zona de peligro</h3>
            <p className="text-red-700 mb-4">
              Estas acciones son permanentes y no se pueden deshacer.
            </p>
            
            <div className="space-y-3">
              <Button variant="outline" className="gap-2 border-red-300 text-red-700 hover:bg-red-50">
                <Download className="h-4 w-4" />
                Descargar mis datos
              </Button>
              
              <Button variant="outline" className="gap-2 border-red-300 text-red-700 hover:bg-red-50">
                <Trash2 className="h-4 w-4" />
                Eliminar cuenta
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
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
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-black mb-2">Configuración</h1>
          <p className="text-black">Gestiona tu cuenta y preferencias</p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64">
            <MotionCard className="p-4">
              <nav className="space-y-2">
                {settingsCategories.map((category) => {
                  const Icon = category.icon
                  return (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeCategory === category.id
                          ? 'bg-laburar-sky-blue-50 text-laburar-sky-blue-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {category.label}
                    </button>
                  )
                })}
              </nav>
            </MotionCard>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <MotionCard className="p-6">
              {activeCategory === 'profile' && renderProfileSettings()}
              {activeCategory === 'badges' && renderBadgesSettings()}
              {activeCategory === 'notifications' && renderNotificationSettings()}
              {activeCategory === 'privacy' && (
                <div>
                  <h3 className="text-lg font-semibold text-black mb-4">Configuración de privacidad</h3>
                  <p className="text-gray-600">Configuración de privacidad próximamente...</p>
                </div>
              )}
              {activeCategory === 'billing' && (
                <div>
                  <h3 className="text-lg font-semibold text-black mb-4">Facturación</h3>
                  <p className="text-gray-600">Configuración de facturación próximamente...</p>
                </div>
              )}
              {activeCategory === 'language' && (
                <div>
                  <h3 className="text-lg font-semibold text-black mb-4">Idioma y región</h3>
                  <p className="text-gray-600">Configuración de idioma próximamente...</p>
                </div>
              )}
              
              {activeCategory === 'profile' && renderDangerZone()}
            </MotionCard>
          </div>
        </div>
      </div>
      </div>
      <Footer />
    </>
  )
}