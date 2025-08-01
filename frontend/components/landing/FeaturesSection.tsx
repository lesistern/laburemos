'use client'

import { motion } from 'framer-motion'

const features = [
  {
    title: 'Ofertas verificadas',
    description: 'Todas las empresas son verificadas manualmente para garantizar oportunidades legítimas.',
    icon: '🛡️',
    color: 'from-sky-500 to-sky-600'
  },
  {
    title: 'Matching inteligente',
    description: 'Nuestro algoritmo te conecta con trabajos que realmente se ajustan a tu perfil.',
    icon: '🎯',
    color: 'from-yellow-500 to-yellow-600'
  },
  {
    title: 'Salarios transparentes',
    description: 'Conocé el rango salarial desde el primer momento. Sin sorpresas.',
    icon: '💰',
    color: 'from-amber-600 to-amber-700'
  },
  {
    title: 'Comunidad activa',
    description: 'Unite a nuestra comunidad de profesionales remotos y compartí experiencias.',
    icon: '👥',
    color: 'from-sky-600 to-sky-700'
  },
  {
    title: 'Herramientas gratis',
    description: 'Accedé a recursos, plantillas y guías para mejorar tu perfil profesional.',
    icon: '🔧',
    color: 'from-yellow-600 to-yellow-700'
  },
  {
    title: 'Soporte 24/7',
    description: 'Nuestro equipo está disponible para ayudarte en cada paso del proceso.',
    icon: '🚀',
    color: 'from-amber-700 to-amber-800'
  }
]

export default function FeaturesSection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold text-gray-900 mb-4"
          >
            ¿Por qué elegir LaburAR?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xl text-gray-600 max-w-3xl mx-auto"
          >
            Somos la plataforma más confiable para encontrar trabajo remoto en Argentina
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative p-8 rounded-2xl bg-gradient-to-br from-gray-50 to-white shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              {/* Background decoration */}
              <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${feature.color} rounded-bl-full opacity-10 group-hover:opacity-20 transition-opacity duration-300`}></div>
              
              {/* Icon */}
              <div className="text-4xl mb-4">
                {feature.icon}
              </div>
              
              {/* Content */}
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}