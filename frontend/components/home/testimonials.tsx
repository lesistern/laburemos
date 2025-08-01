'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { MotionCard } from '@/components/ui/card'
import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    id: 1,
    name: 'María González',
    role: 'CEO, TechStart',
    avatar: '/api/placeholder/80/80',
    rating: 5,
    content: 'LaburAR me permitió encontrar desarrolladores excepcionales para mi startup. La calidad del trabajo y la comunicación fueron impecables. Definitivamente lo recomiendo.',
    project: 'Desarrollo de aplicación web',
  },
  {
    id: 2,
    name: 'Carlos Mendoza',
    role: 'Director de Marketing, Fashion Co.',
    avatar: '/api/placeholder/80/80',
    rating: 5,
    content: 'Necesitaba un rediseño completo de marca y encontré al diseñador perfecto. El proceso fue transparente y el resultado superó mis expectativas.',
    project: 'Rediseño de marca',
  },
  {
    id: 3,
    name: 'Ana Rodríguez',
    role: 'Fundadora, EcoLife',
    avatar: '/api/placeholder/80/80', 
    rating: 5,
    content: 'Como emprendedora, LaburAR ha sido fundamental para escalar mi negocio. Acceso a talento global de primera calidad a precios justos.',
    project: 'Campaña de marketing digital',
  },
  {
    id: 4,
    name: 'Diego Fernández',
    role: 'Gerente de Producto, RetailMax',
    avatar: '/api/placeholder/80/80',
    rating: 5,
    content: 'La plataforma es intuitiva y segura. He trabajado con múltiples freelancers y todos han entregado trabajos de excelente calidad en tiempo y forma.',
    project: 'Desarrollo de e-commerce',
  },
  {
    id: 5,
    name: 'Sofía López',
    role: 'Directora Creativa, Bloom Agency',
    avatar: '/api/placeholder/80/80',
    rating: 5,
    content: 'LaburAR nos conecta con freelancers especializados que se convierten en una extensión de nuestro equipo. La calidad y profesionalismo son excepcionales.',
    project: 'Producción de contenido visual',
  },
  {
    id: 6,
    name: 'Roberto Silva',
    role: 'CTO, DataTech Solutions',
    avatar: '/api/placeholder/80/80',
    rating: 5,
    content: 'Para proyectos técnicos complejos, LaburAR siempre tiene el talento adecuado. La verificación de habilidades y el soporte al cliente son excelentes.',
    project: 'Desarrollo de IA y ML',
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

export function Testimonials() {
  return (
    <section className="py-20 bg-white">
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
            Lo que dicen nuestros{' '}
            <span className="text-gradient bg-gradient-to-r from-laburar-sky-blue-500 to-laburar-sky-blue-600 bg-clip-text text-transparent">
              clientes
            </span>
          </h2>
          <p className="text-xl text-black max-w-3xl mx-auto">
            Miles de empresas y emprendedores confían en LaburAR para encontrar el talento que necesitan. Descubre por qué nos eligen.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div key={testimonial.id} variants={itemVariants}>
              <MotionCard className="p-8 h-full bg-white border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 relative">
                {/* Quote Icon */}
                <div className="absolute -top-3 -left-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-laburar-sky-blue-500 to-laburar-sky-blue-600 rounded-full flex items-center justify-center">
                    <Quote className="h-4 w-4 text-white" />
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-black mb-6 leading-relaxed">
                  &ldquo;{testimonial.content}&rdquo;
                </p>

                {/* Project */}
                <div className="text-sm text-laburar-sky-blue-600 font-medium mb-4">
                  Proyecto: {testimonial.project}
                </div>

                {/* Author */}
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-laburar-yellow-500 to-laburar-yellow-600 rounded-full flex items-center justify-center text-white font-semibold mr-4">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-semibold text-black">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-black">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </MotionCard>
            </motion.div>
          ))}
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center opacity-60">
            {/* Company Logos Placeholder */}
            {[
              'TechStart',
              'Fashion Co.',
              'EcoLife',
              'RetailMax',
            ].map((company, index) => (
              <motion.div
                key={company}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 0.6, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                className="text-2xl font-bold text-gray-400 hover:text-gray-600 transition-colors duration-300"
              >
                {company}
              </motion.div>
            ))}
          </div>
          
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-gray-500 mt-8 text-sm"
          >
            Más de 10,000 empresas confían en LaburAR para sus proyectos
          </motion.p>
        </motion.div>
      </div>
    </section>
  )
}