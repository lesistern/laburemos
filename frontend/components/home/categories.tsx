'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { MotionCard } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Palette,
  Code,
  TrendingUp,
  PenTool,
  Video,
  Music,
  Briefcase,
  Database,
  ArrowRight,
} from 'lucide-react'
import { CATEGORIES, ROUTES } from '@/lib/constants'

const iconMap = {
  'Palette': Palette,
  'Code': Code,
  'TrendingUp': TrendingUp,
  'PenTool': PenTool,
  'Video': Video,
  'Music': Music,
  'Briefcase': Briefcase,
  'Database': Database,
}

const categoryColors = [
  'from-laburar-sky-blue-500 to-laburar-sky-blue-600',
  'from-laburar-yellow-500 to-laburar-yellow-600',
  'from-laburar-sky-blue-400 to-laburar-sky-blue-700',
  'from-laburar-yellow-400 to-laburar-yellow-600',
  'from-laburar-sky-blue-600 to-laburar-sky-blue-700',
  'from-laburar-yellow-500 to-laburar-yellow-700',
  'from-laburar-sky-blue-300 to-laburar-sky-blue-600',
  'from-laburar-yellow-300 to-laburar-yellow-600',
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
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
}

export function Categories() {
  return (
    <section id="categories" className="py-20 bg-white">
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
            Explora{' '}
            <span className="text-gradient bg-gradient-to-r from-laburar-sky-blue-500 to-laburar-sky-blue-600 bg-clip-text text-transparent">
              categorías
            </span>
          </h2>
          <p className="text-xl text-black max-w-3xl mx-auto">
            Desde desarrollo web hasta marketing digital, encuentra exactamente el servicio que necesitas en nuestras categorías especializadas.
          </p>
        </motion.div>

        {/* Categories Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          {CATEGORIES.map((category, index) => {
            const IconComponent = iconMap[category.icon as keyof typeof iconMap]
            const colorClass = categoryColors[index % categoryColors.length]
            
            return (
              <motion.div key={category.id} variants={itemVariants}>
                <Link href={`/categories?category=${category.slug}`}>
                  <MotionCard className="p-6 h-full bg-white border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 group cursor-pointer">
                    {/* Icon */}
                    <div className="mb-4">
                      <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${colorClass} group-hover:scale-110 transition-transform duration-300`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="text-lg font-bold text-black mb-2 group-hover:text-laburar-sky-blue-600 transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-sm text-black mb-4">
                      {getCategoryDescription(category.name)}
                    </p>
                    
                    {/* Arrow */}
                    <div className="flex items-center text-laburar-sky-blue-600 text-sm font-medium">
                      <span>Ver servicios</span>
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </MotionCard>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Popular Services */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 pt-16 border-t border-gray-200"
        >
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-black mb-4">
              Servicios más populares
            </h3>
            <p className="text-black max-w-2xl mx-auto">
              Los servicios más solicitados por nuestros clientes. Encuentra profesionales especializados en estas áreas.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {[
              'Desarrollo Web',
              'Diseño de Logos',
              'Marketing en Redes Sociales',
              'Redacción de Contenido',
              'Edición de Video',
              'SEO',
              'E-commerce',
              'Apps Móviles',
              'Traducción',
              'Consultoría',
              'Fotografía',
              'Animación',
            ].map((service, index) => (
              <motion.div
                key={service}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Link
                  href={`/categories?search=${encodeURIComponent(service)}`}
                  className="inline-block px-4 py-2 bg-gray-100 hover:bg-laburar-sky-blue-50 text-black hover:text-laburar-sky-blue-700 rounded-full text-sm font-medium transition-colors duration-200"
                >
                  {service}
                </Link>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center">
            <Button asChild variant="gradient" size="lg">
              <Link href="/categories">
                Explorar todas las categorías
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function getCategoryDescription(name: string): string {
  const descriptions: Record<string, string> = {
    'Diseño y Creatividad': 'Logos, branding, UI/UX, ilustración y más',
    'Programación y Tecnología': 'Desarrollo web, apps, software y sistemas',
    'Marketing Digital': 'SEO, SEM, redes sociales y publicidad online',
    'Redacción y Traducción': 'Contenido, copywriting, traducción profesional',
    'Video y Animación': 'Edición, motion graphics, animación 2D/3D',
    'Música y Audio': 'Producción, mezcla, masterización, locunción',
    'Negocios': 'Consultoría, plan de negocios, análisis financiero',
    'Datos': 'Análisis de datos, visualización, machine learning',
  }
  return descriptions[name] || 'Servicios profesionales especializados'
}