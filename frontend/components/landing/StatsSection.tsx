'use client'

import { motion } from 'framer-motion'

const stats = [
  {
    number: '5.000+',
    label: 'Empleos activos',
    description: 'Nuevas oportunidades publicadas semanalmente',
    icon: '💼'
  },
  {
    number: '10.000+',
    label: 'Profesionales',
    description: 'Talento argentino registrado en nuestra plataforma',
    icon: '👨‍💻'
  },
  {
    number: '500+',
    label: 'Empresas',
    description: 'Compañías nacionales e internacionales verificadas',
    icon: '🏢'
  },
  {
    number: '95%',
    label: 'Satisfacción',
    description: 'De nuestros usuarios recomiendan LaburAR',
    icon: '⭐'
  }
]

export default function StatsSection() {
  return (
    <section className="py-24 bg-gradient-to-r from-sky-500 to-yellow-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-white mb-4">
            LaburAR en números
          </h2>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Miles de profesionales y cientos de empresas ya forman parte de la comunidad más grande de trabajo remoto en Argentina
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/20 transition-all duration-300">
                <div className="text-4xl mb-4">
                  {stat.icon}
                </div>
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-xl font-semibold text-white mb-2">
                  {stat.label}
                </div>
                <div className="text-white/80">
                  {stat.description}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-16"
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">
              🚀 Crecimiento exponencial
            </h3>
            <p className="text-white/90 text-lg">
              En los últimos 12 meses, hemos conectado más de 3.000 profesionales con sus trabajos remotos ideales, 
              generando un impacto positivo en la economía digital argentina.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}