'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalTrigger,
} from '@/components/ui/modal'
import { RegisterForm } from '@/components/auth/register-form'
import { ArrowRight, Sparkles, Users, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { ROUTES } from '@/lib/constants'

const benefits = [
  'Acceso a +50,000 freelancers verificados',
  'Pagos seguros con garantía de devolución',
  'Soporte 24/7 en español',
  'Sin tarifas ocultas ni costos extra',
]

export function CallToAction() {
  return (
    <section className="py-20 bg-gradient-to-br from-laburar-sky-blue-600 via-laburar-sky-blue-700 to-laburar-sky-blue-800 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-40 h-40 bg-white/10 rounded-full blur-xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 w-60 h-60 bg-white/5 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-sm font-medium text-white mb-8"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Únete a miles de empresas exitosas
          </motion.div>

          {/* Main Heading */}
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
          >
            ¿Listo para hacer realidad{' '}
            <span className="bg-gradient-to-r from-laburar-yellow-300 to-laburar-yellow-500 bg-clip-text text-transparent">
              tu proyecto
            </span>
            ?
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            Conecta con el talento global y transforma tus ideas en resultados. Comienza hoy mismo y descubre por qué somos la plataforma preferida de miles de empresas.
          </motion.p>

          {/* Benefits List */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12 max-w-2xl mx-auto"
          >
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                className="flex items-center text-white/90"
              >
                <CheckCircle className="w-5 h-5 text-green-300 mr-3 flex-shrink-0" />
                <span className="text-left">{benefit}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
          >
            <Modal>
              <ModalTrigger asChild>
                <Button
                  variant="gradient"
                  size="xl"
                  className="font-semibold group shadow-xl hover:shadow-2xl transition-all duration-300"
                >
                  Empezar gratis ahora
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </ModalTrigger>
              <ModalContent>
                <ModalHeader>
                  <ModalTitle>Crear Cuenta Gratuita</ModalTitle>
                </ModalHeader>
                <RegisterForm />
              </ModalContent>
            </Modal>
            
            <Button
              asChild
              variant="login"
              size="xl"
              className="group shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Link href="/categories">
                Explorar categorías
                <Users className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              </Link>
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-12 border-t border-white/20"
          >
            {[
              { value: '50K+', label: 'Freelancers activos' },
              { value: '100K+', label: 'Proyectos exitosos' },
              { value: '4.9/5', label: 'Calificación promedio' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-white/80 text-sm">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Trust Badge */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-12 text-white/70 text-sm"
          >
            ✨ Sin riesgo • Registro gratuito • Cancela cuando quieras
          </motion.div>
        </div>
      </div>
    </section>
  )
}