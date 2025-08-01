'use client'

import { motion } from 'framer-motion'

const steps = [
  {
    number: 1,
    title: 'Creá tu perfil profesional',
    description: 'Completá tu información personal, experiencia laboral y habilidades. Subí tu CV y destacá tus fortalezas.',
    icon: '👤',
    color: 'from-sky-500 to-sky-600'
  },
  {
    number: 2,
    title: 'Explorá oportunidades',
    description: 'Navegá por miles de ofertas de trabajo remoto filtradas por categoría, salario y modalidad.',
    icon: '🔍',
    color: 'from-yellow-500 to-yellow-600'
  },
  {
    number: 3,
    title: 'Aplicá a trabajos',
    description: 'Enviá tu postulación con un solo click. Tu perfil se adapta automáticamente a cada oferta.',
    icon: '📝',
    color: 'from-amber-600 to-amber-700'
  },
  {
    number: 4,
    title: 'Conectá con empleadores',
    description: 'Recibí respuestas directas de las empresas. Participá en entrevistas y negociá tu salario.',
    icon: '🤝',
    color: 'from-sky-600 to-sky-700'
  }
]

export default function HowItWorksSection() {
  return (
    <section id="como-funciona" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold text-gray-900 mb-4"
          >
            ¿Cómo funciona LaburAR?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xl text-gray-600 max-w-3xl mx-auto"
          >
            En solo 4 pasos simples podés encontrar tu próximo trabajo remoto y transformar tu carrera profesional
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative"
            >
              {/* Connecting line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-gray-200 to-gray-300 z-0" />
              )}
              
              <div className="relative z-10 text-center">
                {/* Step number with gradient background */}
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${step.color} text-white font-bold text-xl mb-6 shadow-lg`}>
                  {step.number}
                </div>
                
                {/* Icon */}
                <div className="text-4xl mb-4">
                  {step.icon}
                </div>
                
                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Call to action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-sky-500 to-yellow-500 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              ¿Listo para empezar tu búsqueda?
            </h3>
            <p className="text-lg mb-6 opacity-90">
              Unite a miles de profesionales que ya encontraron su trabajo remoto ideal
            </p>
            <button className="bg-white text-sky-600 font-bold py-3 px-8 rounded-lg hover:bg-gray-50 transition-colors duration-300 shadow-lg">
              Comenzar ahora gratis
            </button>
          </div>
        </motion.div>

        {/* Additional info */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center"
        >
          <div className="p-6 rounded-lg bg-sky-50">
            <div className="text-3xl mb-3">⚡</div>
            <h4 className="font-bold text-gray-900 mb-2">Proceso rápido</h4>
            <p className="text-gray-600 text-sm">
              Registro en menos de 5 minutos
            </p>
          </div>
          <div className="p-6 rounded-lg bg-yellow-50">
            <div className="text-3xl mb-3">🎯</div>
            <h4 className="font-bold text-gray-900 mb-2">Ofertas personalizadas</h4>
            <p className="text-gray-600 text-sm">
              Recibí trabajos que coincidan con tu perfil
            </p>
          </div>
          <div className="p-6 rounded-lg bg-amber-50">
            <div className="text-3xl mb-3">💼</div>
            <h4 className="font-bold text-gray-900 mb-2">100% remoto</h4>
            <p className="text-gray-600 text-sm">
              Trabajá desde cualquier lugar de Argentina
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}