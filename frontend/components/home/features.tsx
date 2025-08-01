'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { MotionCard } from '@/components/ui/card'
import {
  Shield,
  Clock,
  Award,
  Users,
  MessageSquare,
  CreditCard,
  Search,
  Star,
  Globe,
} from 'lucide-react'

const features = [
  {
    icon: Shield,
    title: 'Pagos Seguros',
    description: 'Sistema de pagos protegido con garantía de devolución. Tu dinero está seguro hasta que el trabajo esté completado.',
    color: 'from-laburar-sky-blue-500 to-laburar-sky-blue-600',
  },
  {
    icon: Clock,
    title: 'Rápido y Eficiente',
    description: 'Encuentra freelancers disponibles en minutos. Proyectos entregados en tiempo récord.',
    color: 'from-laburar-yellow-500 to-laburar-yellow-600',
  },
  {
    icon: Award,
    title: 'Calidad Garantizada',
    description: 'Solo freelancers verificados con portfolios comprobados. Calidad profesional asegurada.',
    color: 'from-laburar-sky-blue-400 to-laburar-sky-blue-700',
  },
  {
    icon: Users,
    title: 'Comunidad Global',
    description: 'Acceso a miles de profesionales especializados de todo el mundo, disponibles 24/7.',
    color: 'from-laburar-yellow-400 to-laburar-yellow-600',
  },
  {
    icon: MessageSquare,
    title: 'Comunicación Directa',
    description: 'Chat integrado para comunicarte directamente con tu freelancer durante todo el proyecto.',
    color: 'from-laburar-sky-blue-600 to-laburar-sky-blue-700',
  },
  {
    icon: CreditCard,
    title: 'Precios Transparentes',
    description: 'Sin tarifas ocultas. Ve exactamente lo que pagas antes de contratar cualquier servicio.',
    color: 'from-laburar-yellow-500 to-laburar-yellow-700',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
}

export function Features() {
  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4">
        {/* Section Header - Más compacto */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 max-w-4xl mx-auto"
        >
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-black mb-4">
            ¿Por qué elegir{' '}
            <span className="text-gradient bg-gradient-to-r from-laburar-sky-blue-500 to-laburar-sky-blue-600 bg-clip-text text-transparent">
              LaburAR
            </span>
            ?
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            La plataforma líder que conecta talento global con oportunidades excepcionales
          </p>
        </motion.div>

        {/* Features Grid - Diseño más compacto y profesional */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div key={feature.title} variants={itemVariants}>
                <MotionCard className="p-6 h-full bg-white border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300 group">
                  {/* Header con icono y título en una línea más compacta */}
                  <div className="flex items-start gap-4 mb-3">
                    <div className={`flex-shrink-0 p-3 rounded-xl bg-gradient-to-r ${feature.color} group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-black mb-2 leading-tight">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </MotionCard>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Stats Section - Reemplaza la sección de beneficios con estadísticas más profesionales */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { 
                icon: Users, 
                number: '50K+',
                label: 'Freelancers Activos',
                description: 'Profesionales verificados'
              },
              { 
                icon: Award, 
                number: '98%',
                label: 'Satisfacción',
                description: 'Proyectos exitosos'
              },
              { 
                icon: Clock, 
                number: '24/7',
                label: 'Soporte',
                description: 'Asistencia continua'
              },
              { 
                icon: Shield, 
                number: '100%',
                label: 'Seguridad',
                description: 'Pagos protegidos'
              },
            ].map((stat, index) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center group"
                >
                  <div className="inline-flex p-3 rounded-xl bg-gradient-to-r from-laburar-sky-blue-500 to-laburar-sky-blue-600 mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-black mb-1">
                    {stat.number}
                  </div>
                  <div className="text-sm font-semibold text-gray-900 mb-1">
                    {stat.label}
                  </div>
                  <div className="text-xs text-gray-500">
                    {stat.description}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </section>
  )
}