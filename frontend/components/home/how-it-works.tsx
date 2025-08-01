'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { MotionCard } from '@/components/ui/card'
import { Search, MessageSquare, CheckCircle, Star } from 'lucide-react'

const steps = [
  {
    number: '01',
    icon: Search,
    title: 'Busca y Descubre',
    description: 'Explora miles de servicios profesionales en múltiples categorías. Filtra por precio, calificación, tiempo de entrega y más.',
    color: 'from-laburar-sky-blue-500 to-laburar-sky-blue-600',
  },
  {
    number: '02',
    icon: MessageSquare,
    title: 'Conecta y Negocia',
    description: 'Chatea directamente con freelancers, discute detalles del proyecto y personaliza el servicio según tus necesidades.',
    color: 'from-laburar-yellow-500 to-laburar-yellow-600',
  },
  {
    number: '03',
    icon: CheckCircle,
    title: 'Recibe tu Trabajo',
    description: 'Recibe entregas de alta calidad en el tiempo acordado. Solicita revisiones hasta estar 100% satisfecho.',
    color: 'from-laburar-sky-blue-600 to-laburar-sky-blue-700',
  },
  {
    number: '04',
    icon: Star,
    title: 'Califica y Recomienda',
    description: 'Deja tu reseña y ayuda a otros usuarios a encontrar los mejores freelancers. Construyamos juntos una comunidad de confianza.',
    color: 'from-laburar-yellow-400 to-laburar-yellow-600',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
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

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-gradient-to-br from-gray-50 via-white to-laburar-blue-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-6">
            ¿Cómo{' '}
            <span className="text-gradient bg-gradient-to-r from-laburar-sky-blue-500 to-laburar-sky-blue-600 bg-clip-text text-transparent">
              funciona
            </span>
            ?
          </h2>
          <p className="text-xl text-black max-w-3xl mx-auto">
            En solo 4 pasos simples, conecta con el freelancer perfecto y lleva tu proyecto al siguiente nivel.
          </p>
        </motion.div>

        {/* Steps Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16"
        >
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <motion.div key={step.number} variants={itemVariants}>
                <MotionCard className="p-8 h-full bg-white/80 backdrop-blur-sm border border-white/20 hover:border-white/40 transition-all duration-300 relative">
                  {/* Step Number */}
                  <div className="absolute -top-4 -left-4">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                      {step.number}
                    </div>
                  </div>

                  {/* Icon */}
                  <div className="mb-6 mt-4">
                    <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${step.color}`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-black mb-4">
                    {step.title}
                  </h3>
                  <p className="text-black leading-relaxed">
                    {step.description}
                  </p>
                </MotionCard>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Process Flow Visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative"
        >
          {/* Connection Lines */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-laburar-blue-200 via-laburar-green-200 to-laburar-blue-200 -translate-y-1/2" />
          
          {/* Process Steps Visual */}
          <div className="flex flex-col lg:flex-row items-center justify-between space-y-8 lg:space-y-0 lg:space-x-8">
            {[
              { title: 'Cliente publica proyecto', desc: 'Define qué necesitas', icon: '💼' },
              { title: 'Freelancers aplican', desc: 'Recibe propuestas', icon: '👥' },
              { title: 'Selecciona el mejor', desc: 'Elige tu freelancer ideal', icon: '✨' },
              { title: 'Proyecto completado', desc: 'Recibe tu trabajo finalizado', icon: '🎉' },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                className="flex flex-col items-center text-center max-w-xs"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-laburar-blue-100 to-laburar-green-100 rounded-full flex items-center justify-center text-2xl mb-4 relative z-10">
                  {item.icon}
                </div>
                <h4 className="font-semibold text-black mb-2">{item.title}</h4>
                <p className="text-sm text-black">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}