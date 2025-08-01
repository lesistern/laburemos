'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { MotionCard } from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { useAuthStore } from '@/stores/auth-store'
import { getUserBadges, getCategoriesWithCounts } from '@/lib/badges'
import { BadgeDisplay } from '@/components/ui/badge-display'
import { EditProfileModal, EditFreelancerProfileModal } from '@/components/profile'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Edit,
  Star,
  Award,
  Briefcase,
  Globe,
  Camera,
  X
} from 'lucide-react'

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuthStore()
  const [showAllBadges, setShowAllBadges] = React.useState(false)
  const [showEditProfile, setShowEditProfile] = React.useState(false)
  const [showEditFreelancerProfile, setShowEditFreelancerProfile] = React.useState(false)

  // Check if user is new (no real data) - use email as indicator for demo
  const isNewUser = user?.email === 'lesistern@gmail.com'
  const isClient = user?.role === 'client'
  
  // Get user badges
  const userBadges = getUserBadges(user)

  if (!isAuthenticated || !user) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <MotionCard className="p-8 text-center">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-black mb-2">Acceso Requerido</h2>
            <p className="text-black mb-4">Necesitas iniciar sesión para ver tu perfil.</p>
            <Button variant="gradient">Iniciar Sesión</Button>
          </MotionCard>
        </div>
        <Footer />
      </>
    )
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
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-black mb-2">Mi Perfil</h1>
          <p className="text-black">Gestiona tu información personal y profesional</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header */}
            <MotionCard className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={`${user.firstName} ${user.lastName}`}
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
                    <h2 className="text-2xl font-bold text-black">{user.firstName} {user.lastName}</h2>
                    <p className="text-black capitalize">{user.role}</p>
                    <div className="flex items-center mt-2">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-black ml-1">
                        {isNewUser ? 'Sin calificaciones aún' : '4.9 (127 reseñas)'}
                      </span>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => setShowEditProfile(true)}
                >
                  <Edit className="h-4 w-4" />
                  Editar Perfil
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-laburar-sky-blue-600" />
                  <span className="text-black">{user.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-laburar-sky-blue-600" />
                  <span className="text-black">
                    {isNewUser ? 'Teléfono no agregado' : '+1 (555) 123-4567'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-laburar-sky-blue-600" />
                  <span className="text-black">
                    {isNewUser ? 'Ubicación no agregada' : 'Buenos Aires, Argentina'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-laburar-sky-blue-600" />
                  <span className="text-black">Miembro desde {new Date().getFullYear()}</span>
                </div>
              </div>
            </MotionCard>

            {/* About Section */}
            <MotionCard className="p-6">
              <h3 className="text-xl font-semibold text-black mb-4">Acerca de mí</h3>
              {isNewUser ? (
                <div className="text-center py-8">
                  <Edit className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    {isClient 
                      ? 'Agrega información sobre tu empresa y el tipo de proyectos que necesitas para atraer a los mejores freelancers.'
                      : 'Cuéntale a tus futuros clientes sobre tu experiencia, habilidades y lo que te hace único como profesional.'
                    }
                  </p>
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => setShowEditProfile(true)}
                  >
                    <Edit className="h-4 w-4" />
                    Completar información
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-black leading-relaxed mb-4">
                    Soy un desarrollador full-stack con más de 5 años de experiencia creando aplicaciones web modernas. 
                    Me especializo en React, Node.js y tecnologías cloud. Me apasiona crear soluciones eficientes y escalables 
                    que generen impacto real en los usuarios.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['React', 'Node.js', 'TypeScript', 'AWS', 'MongoDB', 'Next.js'].map((skill, index) => (
                      <span key={index} className="px-3 py-1 bg-laburar-sky-blue-100 text-laburar-sky-blue-700 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </MotionCard>

            {/* Experience Section */}
            <MotionCard className="p-6">
              <h3 className="text-xl font-semibold text-black mb-4">
                {isClient ? 'Historial de proyectos' : 'Experiencia'}
              </h3>
              {isNewUser ? (
                <div className="text-center py-8">
                  <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    {isClient 
                      ? 'Los proyectos que publiques y completes aparecerán aquí.'
                      : 'Agrega tu experiencia laboral y proyectos pasados para generar confianza con tus clientes.'
                    }
                  </p>
                  <Button variant="outline" className="gap-2">
                    <Briefcase className="h-4 w-4" />
                    {isClient ? 'Publicar primer proyecto' : 'Agregar experiencia'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border-l-2 border-laburar-sky-blue-200 pl-4">
                    <h4 className="font-semibold text-black">Senior Full Stack Developer</h4>
                    <p className="text-black">TechCorp • 2021 - Presente</p>
                    <p className="text-black text-sm mt-2">
                      Lideré el desarrollo de múltiples aplicaciones web usando React y Node.js, 
                      mejorando la eficiencia del equipo en un 40%.
                    </p>
                  </div>
                  <div className="border-l-2 border-laburar-sky-blue-200 pl-4">
                    <h4 className="font-semibold text-black">Frontend Developer</h4>  
                    <p className="text-black">StartupXYZ • 2019 - 2021</p>
                    <p className="text-black text-sm mt-2">
                      Desarrollé interfaces de usuario responsivas y optimizadas para más de 10 proyectos client-side.
                    </p>
                  </div>
                </div>
              )}
            </MotionCard>
          </div>

          {/* Right Column - Stats & Actions */}
          <div className="space-y-6">
            {/* Stats Card */}
            <MotionCard className="p-6">
              <h3 className="text-lg font-semibold text-black mb-4">Estadísticas</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-laburar-sky-blue-600" />
                    <span className="text-black">
                      {isClient ? 'Proyectos publicados' : 'Proyectos completados'}
                    </span>
                  </div>
                  <span className="font-semibold text-black">
                    {isNewUser ? '0' : '47'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-400" />
                    <span className="text-black">Calificación promedio</span>
                  </div>
                  <span className="font-semibold text-black">
                    {isNewUser ? 'N/A' : '4.9/5'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-laburar-sky-blue-600" />
                    <span className="text-black">
                      {isClient ? 'Freelancers contratados' : 'Clientes satisfechos'}
                    </span>
                  </div>
                  <span className="font-semibold text-black">
                    {isNewUser ? (isClient ? '0' : 'N/A') : (isClient ? '12' : '98%')}
                  </span>
                </div>
              </div>
            </MotionCard>

            {/* Badges Card */}
            <MotionCard className="p-6">
              <h3 className="text-lg font-semibold text-black mb-4">Insignias</h3>
              {userBadges.length > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                  {userBadges.slice(0, 6).map((badge, index) => (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <BadgeDisplay badge={badge} size="md" />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    {isClient 
                      ? 'Las insignias aparecerán conforme publiques proyectos y trabajes con freelancers.'
                      : 'Gana insignias completando proyectos con excelencia y manteniendo clientes satisfechos.'
                    }
                  </p>
                  <p className="text-sm text-gray-500">
                    Primera insignia: {isClient ? 'Publicar primer proyecto' : 'Completar primer proyecto'}
                  </p>
                </div>
              )}
              {userBadges.length > 6 && (
                <div className="mt-4 text-center">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowAllBadges(true)}
                  >
                    Ver todas las insignias ({userBadges.length})
                  </Button>
                </div>
              )}
            </MotionCard>

            {/* Quick Actions */}
            <MotionCard className="p-6">
              <h3 className="text-lg font-semibold text-black mb-4">Acciones Rápidas</h3>
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => setShowEditProfile(true)}
                >
                  <Edit className="h-4 w-4" />
                  Editar Perfil
                </Button>
                {isClient ? (
                  <>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Briefcase className="h-4 w-4" />
                      Mis Proyectos
                    </Button>
                    <Button variant="gradient" className="w-full justify-start gap-2">
                      <Star className="h-4 w-4" />
                      {isNewUser ? 'Publicar Primer Proyecto' : 'Nuevo Proyecto'}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-2"
                      onClick={() => setShowEditFreelancerProfile(true)}
                    >
                      <Briefcase className="h-4 w-4" />
                      Perfil Profesional
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Briefcase className="h-4 w-4" />
                      Ver Servicios
                    </Button>
                    <Button variant="gradient" className="w-full justify-start gap-2">
                      <Star className="h-4 w-4" />
                      {isNewUser ? 'Crear Primer Servicio' : 'Mejorar Perfil'}
                    </Button>
                  </>
                )}
              </div>
            </MotionCard>
          </div>
        </div>
      </div>
      </div>

      {/* All Badges Modal */}
      {showAllBadges && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-black">
                Todas mis insignias ({userBadges.length})
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAllBadges(false)}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Badges by Category */}
              {getCategoriesWithCounts(userBadges).map((categoryData) => (
                <div key={categoryData.name} className="mb-8">
                  <h3 className={`text-lg font-semibold mb-4 ${categoryData.color}`}>
                    {categoryData.displayName} ({categoryData.count})
                  </h3>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
                    {categoryData.badges.map((badge, index) => (
                      <motion.div
                        key={badge.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="flex flex-col items-center"
                      >
                        <BadgeDisplay badge={badge} size="md" />
                        <p className="text-xs text-center mt-2 text-gray-700 line-clamp-2">
                          {badge.name}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-center p-6 border-t bg-gray-50">
              <Button onClick={() => setShowAllBadges(false)}>
                Cerrar
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Profile Edit Modals */}
      <EditProfileModal 
        isOpen={showEditProfile} 
        onClose={() => setShowEditProfile(false)} 
      />
      
      <EditFreelancerProfileModal 
        isOpen={showEditFreelancerProfile} 
        onClose={() => setShowEditFreelancerProfile(false)} 
      />

      <Footer />
    </>
  )
}