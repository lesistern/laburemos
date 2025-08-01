'use client'

import { motion } from 'framer-motion'

const testimonials = [
  {
    name: 'María González',
    role: 'Desarrolladora Frontend',
    company: 'TechCorp Internacional',
    avatar: '👩‍💻',
    content: 'Gracias a LaburAR conseguí un trabajo remoto en una empresa internacional. El proceso fue súper fácil y transparente.',
    rating: 5
  },
  {
    name: 'Carlos Rodríguez',
    role: 'Marketing Digital',
    company: 'StartupGlobal',
    avatar: '👨‍💼',
    content: 'LaburAR me cambió la vida. Ahora trabajo para una startup europea desde Buenos Aires con un salario increíble.',
    rating: 5
  },
  {
    name: 'Ana Martínez',
    role: 'Diseñadora UX/UI',
    company: 'DesignStudio',
    avatar: '👩‍🎨',
    content: 'La plataforma me ayudó a encontrar exactamente lo que buscaba. El matching fue perfecto desde el primer intento.',
    rating: 5
  },
  {
    name: 'Juan Pablo López',
    role: 'Data Scientist',
    company: 'DataTech',
    avatar: '👨‍🔬',
    content: 'Increíble cómo LaburAR conecta talento argentino con oportunidades globales. Muy recomendable.',
    rating: 5
  },
  {
    name: 'Sofia Fernández',
    role: 'Content Manager',
    company: 'MediaCorp',
    avatar: '👩‍📝',
    content: 'El soporte de LaburAR es excepcional. Me acompañaron en todo el proceso hasta conseguir mi trabajo ideal.',
    rating: 5
  },
  {
    name: 'Diego Sánchez',
    role: 'DevOps Engineer',
    company: 'CloudTech',
    avatar: '👨‍⚙️',
    content: 'Encontré mi trabajo remoto en menos de 2 semanas. La calidad de las ofertas es impresionante.',
    rating: 5
  }
]

export default function TestimonialsSection() {
  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Lo que dicen nuestros usuarios
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Miles de profesionales ya transformaron su carrera con LaburAR
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {/* Stars */}
              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-5 h-5 text-yellow-400 fill-current"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>

              {/* Content */}
              <p className="text-gray-700 mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>

              {/* Profile */}
              <div className="flex items-center">
                <div className="text-3xl mr-4">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-bold text-gray-900">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {testimonial.role}
                  </div>
                  <div className="text-sm text-sky-600">
                    {testimonial.company}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <div className="bg-white rounded-2xl p-8 shadow-lg max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl mb-2">🏆</div>
                <div className="font-bold text-gray-900">Premio a la Innovación</div>
                <div className="text-sm text-gray-600">Startup del Año 2024</div>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">🔒</div>
                <div className="font-bold text-gray-900">100% Seguro</div>
                <div className="text-sm text-gray-600">Datos protegidos SSL</div>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">🤝</div>
                <div className="font-bold text-gray-900">Soporte 24/7</div>
                <div className="text-sm text-gray-600">Respuesta en menos de 2hs</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}