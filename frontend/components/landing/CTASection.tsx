'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function CTASection() {
  return (
    <section className="py-24 bg-gradient-to-br from-sky-50 via-yellow-50 to-amber-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            ¿Listo para encontrar tu{' '}
            <span className="bg-gradient-to-r from-sky-600 to-yellow-600 bg-clip-text text-transparent">
              trabajo remoto ideal
            </span>
            ?
          </h2>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Unite a miles de profesionales que ya transformaron su carrera laboral. 
            Comenzá hoy y encontrá oportunidades que se adapten a tu estilo de vida.
          </p>

          <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center mb-12">
            <Link
              href="/register"
              className="inline-block bg-gradient-to-r from-sky-500 to-yellow-500 text-white px-10 py-4 rounded-lg font-bold text-lg hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              Registrarse gratis
            </Link>
            <Link
              href="/empleos"
              className="inline-block border-2 border-gray-300 text-gray-700 px-10 py-4 rounded-lg font-bold text-lg hover:border-sky-500 hover:text-sky-600 transition-all duration-300"
            >
              Ver empleos
            </Link>
          </div>

          {/* Features highlight */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white/70 backdrop-blur-sm rounded-xl p-6"
            >
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="font-bold text-gray-900 mb-2">Registro rápido</h3>
              <p className="text-gray-600 text-sm">
                Creá tu perfil en menos de 5 minutos
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white/70 backdrop-blur-sm rounded-xl p-6"
            >
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="font-bold text-gray-900 mb-2">100% gratis</h3>
              <p className="text-gray-600 text-sm">
                Sin costos ocultos, siempre gratuito para candidatos
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white/70 backdrop-blur-sm rounded-xl p-6"
            >
              <div className="text-3xl mb-3">🚀</div>
              <h3 className="font-bold text-gray-900 mb-2">Resultados rápidos</h3>
              <p className="text-gray-600 text-sm">
                Encontrá trabajo en promedio en 2-3 semanas
              </p>
            </motion.div>
          </div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12 flex flex-wrap justify-center items-center gap-6 text-gray-500"
          >
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✓</span>
              <span className="text-sm">SSL Seguro</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✓</span>
              <span className="text-sm">GDPR Compliant</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✓</span>
              <span className="text-sm">Soporte 24/7</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✓</span>
              <span className="text-sm">+10k usuarios</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}