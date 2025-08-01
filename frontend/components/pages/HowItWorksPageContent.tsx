'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useAnimation, useInView } from 'framer-motion'
import { 
  Briefcase, 
  Search, 
  Users, 
  Shield, 
  Star,
  FileText,
  MessageSquare,
  Wallet,
  TrendingUp,
  CheckCircle,
  ArrowDown,
  Zap,
  Clock,
  HeartHandshake,
  Laptop,
  Target,
  Award,
  Sparkles
} from 'lucide-react'

interface Step {
  number: number
  title: string
  description: string
  icon: React.ReactNode
}

const clientSteps: Step[] = [
  {
    number: 1,
    title: 'Explorá servicios disponibles',
    description: 'Buscá entre miles de servicios profesionales en diferentes categorías',
    icon: <Search className="w-6 h-6" />
  },
  {
    number: 2,
    title: 'Revisá perfiles y portafolios',
    description: 'Analizá freelancers, reseñas y trabajos anteriores para elegir el mejor',
    icon: <Users className="w-6 h-6" />
  },
  {
    number: 3,
    title: 'Contactá y negociá detalles',
    description: 'Chateá con el freelancer y personalizá el servicio según tus necesidades',
    icon: <MessageSquare className="w-6 h-6" />
  },
  {
    number: 4,
    title: 'Realizá el pedido y pagá seguro',
    description: 'Confirmá detalles y pagá con protección, tu dinero está seguro',
    icon: <Shield className="w-6 h-6" />
  },
  {
    number: 5,
    title: 'Recibí tu trabajo y calificá',
    description: 'Obtené el resultado esperado y dejá tu reseña para ayudar a otros',
    icon: <Star className="w-6 h-6" />
  }
]

const freelancerSteps: Step[] = [
  {
    number: 1,
    title: 'Creá tu perfil y servicios',
    description: 'Registrá tu perfil y publicá los servicios que ofrecés con precios claros',
    icon: <Laptop className="w-6 h-6" />
  },
  {
    number: 2,
    title: 'Optimizá tus ofertas',
    description: 'Mejorá descripciones, precios y portafolio para atraer más clientes',
    icon: <Target className="w-6 h-6" />
  },
  {
    number: 3,
    title: 'Recibí pedidos de clientes',
    description: 'Los clientes eligen tus servicios y te contactan directamente',
    icon: <Briefcase className="w-6 h-6" />
  },
  {
    number: 4,
    title: 'Entregá trabajo de calidad',
    description: 'Cumplí con los requisitos y plazos acordados para satisfacer al cliente',
    icon: <CheckCircle className="w-6 h-6" />
  },
  {
    number: 5,
    title: 'Cobrá y mejorá tu reputación',
    description: 'Recibí pagos seguros y construí tu historial con reseñas positivas',
    icon: <TrendingUp className="w-6 h-6" />
  }
]

const clientFeatures = [
  { icon: <Shield className="w-5 h-5" />, title: 'Pagos seguros', description: 'Tu dinero está protegido hasta que apruebes el trabajo' },
  { icon: <CheckCircle className="w-5 h-5" />, title: 'Garantía de calidad', description: 'Profesionales verificados y con reseñas reales' },
  { icon: <Zap className="w-5 h-5" />, title: 'Soporte 24/7', description: 'Ayuda disponible cuando la necesitás' }
]

const freelancerFeatures = [
  { icon: <Clock className="w-5 h-5" />, title: 'Horario flexible', description: 'Trabajá cuando quieras, desde donde quieras' },
  { icon: <Wallet className="w-5 h-5" />, title: 'Múltiples métodos de pago', description: 'Cobrá de la forma que prefieras' },
  { icon: <Award className="w-5 h-5" />, title: 'Desarrollo de habilidades', description: 'Aprendé y crecé con cada proyecto' }
]

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100
    }
  }
}

const scaleVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      delay: 0.2
    }
  }
}

export default function HowItWorksPageContent() {
  const [isClient, setIsClient] = useState(true)
  const [isChanging, setIsChanging] = useState(false)
  
  const currentSteps = isClient ? clientSteps : freelancerSteps
  const currentFeatures = isClient ? clientFeatures : freelancerFeatures
  const gradientClass = isClient 
    ? 'from-blue-500 to-blue-700' 
    : 'from-emerald-500 to-emerald-700'
  const bgGradientClass = isClient
    ? 'from-blue-50 to-blue-100'
    : 'from-emerald-50 to-emerald-100'
  const buttonClass = isClient
    ? 'bg-blue-600 hover:bg-blue-700'
    : 'bg-emerald-600 hover:bg-emerald-700'

  // Handle mode change with animation delay
  const handleModeChange = (newIsClient: boolean) => {
    if (newIsClient !== isClient) {
      setIsChanging(true)
      setTimeout(() => {
        setIsClient(newIsClient)
        setIsChanging(false)
      }, 300)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Toggle Section */}
      <motion.div 
        className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm shadow-sm"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
          <motion.div 
            className="flex justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-gray-100 p-1 rounded-full flex gap-1 relative">
              {/* Animated background indicator */}
              <motion.div
                className="absolute inset-1 w-[calc(50%-4px)] h-[calc(100%-8px)] bg-white rounded-full shadow-md"
                animate={{
                  left: isClient ? '2px' : 'calc(50% + 2px)'
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
              
              <button
                onClick={() => handleModeChange(true)}
                className={`relative w-36 sm:w-44 py-2 sm:py-3 rounded-full font-medium transition-all duration-300 text-sm sm:text-base ${
                  isClient 
                    ? 'text-blue-600' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <span className="relative z-10">Soy cliente</span>
              </button>
              <button
                onClick={() => handleModeChange(false)}
                className={`relative w-36 sm:w-44 py-2 sm:py-3 rounded-full font-medium transition-all duration-300 text-sm sm:text-base ${
                  !isClient 
                    ? 'text-emerald-600' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <span className="relative z-10">Soy Freelancer</span>
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Hero Section */}
      <motion.div 
        className={`bg-gradient-to-br ${bgGradientClass} py-12 sm:py-16 transition-colors duration-700 relative overflow-hidden`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Lava Lamp Effect */}
        <motion.div
          className="absolute inset-0 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          transition={{ duration: 1 }}
        >
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute rounded-full ${isClient ? 'bg-blue-400' : 'bg-emerald-400'} blur-xl`}
              style={{
                width: Math.random() * 200 + 80,
                height: Math.random() * 200 + 80,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                x: [0, Math.random() * 150 - 75, Math.random() * 150 - 75, 0],
                y: [0, Math.random() * 150 - 75, Math.random() * 150 - 75, 0],
                scale: [1, 0.7, 1.3, 1],
              }}
              transition={{
                duration: Math.random() * 15 + 20,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
          {/* Additional smaller bubbles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={`small-${i}`}
              className={`absolute rounded-full ${isClient ? 'bg-blue-300' : 'bg-emerald-300'} blur-lg`}
              style={{
                width: Math.random() * 60 + 20,
                height: Math.random() * 60 + 20,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                x: [0, Math.random() * 80 - 40, Math.random() * 80 - 40, 0],
                y: [0, Math.random() * 80 - 40, Math.random() * 80 - 40, 0],
                scale: [0.5, 1.2, 0.8, 0.5],
                opacity: [0.3, 0.6, 0.4, 0.3],
              }}
              transition={{
                duration: Math.random() * 10 + 12,
                repeat: Infinity,
                ease: "easeInOut",
                delay: Math.random() * 5,
              }}
            />
          ))}
        </motion.div>

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={isClient ? 'client' : 'freelancer'}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.9 }}
              transition={{ 
                duration: 0.5,
                type: "spring",
                stiffness: 100
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 mb-6"
              >
                <Sparkles className={`w-6 h-6 ${isClient ? 'text-blue-600' : 'text-emerald-600'}`} />
                <span className={`text-sm font-medium ${isClient ? 'text-blue-700' : 'text-emerald-700'}`}>
                  {isClient ? 'Para empresas' : 'Para freelancers'}
                </span>
              </motion.div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-gray-900 min-h-[8rem] sm:min-h-[6rem] md:min-h-[4rem] flex items-center justify-center">
                <span className="text-center">
                  {isClient 
                    ? 'Encontrá el talento perfecto para tu proyecto'
                    : 'Ganá dinero con tus habilidades y experiencia'
                  }
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-700 max-w-2xl mx-auto">
                {isClient
                  ? 'Conectate con profesionales calificados y llevá tu proyecto al siguiente nivel'
                  : 'Unite a miles de freelancers que trabajan en lo que aman'
                }
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Steps Section - Vertical Layout */}
      <div className="py-12 sm:py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Cómo funciona
            </h2>
            <p className="text-gray-600">
              {isClient ? 'Contratá servicios en 5 simples pasos' : 'Vendé tus servicios en 5 simples pasos'}
            </p>
          </motion.div>
          
          <div className="relative">
            {/* Vertical line connecting steps - animated */}
            <motion.div 
              className="absolute left-4 sm:left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-gray-200 via-gray-300 to-gray-200 hidden sm:block"
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.5 }}
              style={{ originY: 0 }}
            />
            
            <AnimatePresence mode="wait">
              <motion.div
                key={isClient ? 'client-steps' : 'freelancer-steps'}
                variants={containerVariants}
                initial="hidden"
                animate={isChanging ? "hidden" : "visible"}
                exit="hidden"
                className="space-y-6 sm:space-y-8"
              >
                {currentSteps.map((step, index) => (
                  <motion.div
                    key={`${isClient ? 'client' : 'freelancer'}-${step.number}`}
                    variants={itemVariants}
                    className="relative flex gap-4 sm:gap-6 items-start"
                    whileInView="visible"
                    initial="hidden"
                    viewport={{ once: true, margin: "-50px" }}
                  >
                    {/* Step number */}
                    <div className="relative flex-shrink-0">
                      <div className={`relative z-10 w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br ${gradientClass} text-white flex items-center justify-center font-bold text-lg sm:text-xl shadow-lg`}>
                        {step.number}
                      </div>
                    </div>
                    
                    {/* Content card with hover effect */}
                    <motion.div 
                      className="flex-1 pb-6 sm:pb-8"
                      whileHover={{ x: 10 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <motion.div 
                        className="bg-white rounded-xl shadow-md p-4 sm:p-6 hover:shadow-xl transition-all duration-300 border border-gray-100"
                        whileHover={{ 
                          borderColor: isClient ? 'rgb(59, 130, 246, 0.3)' : 'rgb(16, 185, 129, 0.3)',
                        }}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`p-2 rounded-lg bg-gradient-to-br ${gradientClass} text-white`}>
                            {step.icon}
                          </div>
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                            {step.title}
                          </h3>
                        </div>
                        <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                          {step.description}
                        </p>
                      </motion.div>
                    </motion.div>
                    
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className={`py-12 sm:py-16 bg-gradient-to-br ${bgGradientClass} transition-colors duration-700 relative overflow-hidden`}>
        {/* Animated background pattern */}
        <motion.div
          className="absolute inset-0 opacity-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.05 }}
        >
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, ${isClient ? 'rgb(59, 130, 246)' : 'rgb(16, 185, 129)'} 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }} />
        </motion.div>

        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {isClient ? 'Ventajas para clientes' : 'Ventajas para freelancers'}
            </h2>
            <p className="text-gray-600">
              {isClient ? 'Todo lo que necesitás para contratar con confianza' : 'Todo lo que necesitás para trabajar con libertad'}
            </p>
          </motion.div>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={isClient ? 'client-features' : 'freelancer-features'}
              variants={containerVariants}
              initial="hidden"
              animate={isChanging ? "hidden" : "visible"}
              exit="hidden"
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6"
            >
              {currentFeatures.map((feature, index) => (
                <motion.div
                  key={`${isClient ? 'client' : 'freelancer'}-feature-${index}`}
                  variants={scaleVariants}
                  whileInView="visible"
                  initial="hidden"
                  viewport={{ once: true }}
                  className="group"
                >
                  <motion.div
                    className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 h-full border border-transparent"
                    whileHover={{ 
                      y: -5,
                      borderColor: isClient ? 'rgb(59, 130, 246, 0.2)' : 'rgb(16, 185, 129, 0.2)'
                    }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <motion.div 
                      className={`inline-flex p-3 rounded-full bg-gradient-to-br ${gradientClass} text-white mb-4 group-hover:scale-110 transition-transform duration-300`}
                      whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      {feature.icon}
                    </motion.div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {feature.description}
                    </p>
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-12 sm:py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
            className="text-center"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={isClient ? 'client-cta' : 'freelancer-cta'}
                initial={{ opacity: 0, rotateX: 90 }}
                animate={{ opacity: 1, rotateX: 0 }}
                exit={{ opacity: 0, rotateX: -90 }}
                transition={{ duration: 0.5 }}
                className={`bg-gradient-to-br ${gradientClass} rounded-2xl p-8 sm:p-12 text-white relative overflow-hidden`}
              >
                {/* Background animation */}
                <motion.div
                  className="absolute inset-0 opacity-10"
                  animate={{
                    background: [
                      'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
                      'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)',
                      'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                    {isClient 
                      ? '¿Listo para encontrar el talento ideal?'
                      : '¿Listo para empezar a ganar?'
                    }
                  </h2>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-lg sm:text-xl mb-8 opacity-90"
                >
                  {isClient
                    ? 'Explorá miles de servicios profesionales y encontrá lo que necesitás'
                    : 'Creá tu perfil y empezá a vender tus servicios hoy mismo'
                  }
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                >
                  <motion.button 
                    className={`${buttonClass} text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-lg transition-all duration-300 shadow-lg relative overflow-hidden group`}
                    whileHover={{ 
                      scale: 1.05,
                      boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {/* Button background animation */}
                    <motion.div
                      className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20"
                      initial={false}
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
                    />
                    
                    <span className="relative z-10 text-sm sm:text-base">
                      {isClient 
                        ? 'Explorá servicios ahora'
                        : 'Empezá a vender hoy'
                      }
                    </span>
                  </motion.button>
                </motion.div>

                {/* Floating elements */}
                <motion.div
                  className="absolute top-4 right-4 opacity-20"
                  animate={{ 
                    rotate: 360,
                    scale: [1, 1.2, 1] 
                  }}
                  transition={{ 
                    rotate: { duration: 10, repeat: Infinity, ease: "linear" },
                    scale: { duration: 2, repeat: Infinity }
                  }}
                >
                  <Sparkles className="w-8 h-8" />
                </motion.div>

                <motion.div
                  className="absolute bottom-4 left-4 opacity-20"
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Star className="w-6 h-6" />
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  )
}