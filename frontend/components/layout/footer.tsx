'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Briefcase,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react'
import { APP_NAME, ROUTES } from '@/lib/constants'

const footerLinks = {
  platform: {
    title: 'Plataforma',
    links: [
      { name: 'Cómo funciona', href: '/#how-it-works' },
      { name: 'Categorías', href: '/categories' },
      { name: 'Tarifas', href: '/pricing' },
    ],
  },
  freelancers: {
    title: 'Para Freelancers',
    links: [
      { name: 'Vender servicios', href: '/sell' },
      { name: 'Recursos', href: '/resources' },
      { name: 'Guías', href: '/guides' },
      { name: 'Comunidad', href: '/community' },
    ],
  },
  clients: {
    title: 'Para Clientes',
    links: [
      { name: 'Contratar', href: '/categories' },
      { name: 'Proyectos', href: '/post-project' },
      { name: 'Empresas', href: '/business' },
      { name: 'Soporte', href: '/support' },
    ],
  },
  company: {
    title: 'Compañía',
    links: [
      { name: 'Acerca de', href: '/about' },
      { name: 'Prensa', href: '/press' },
      { name: 'Carreras', href: '/careers' },
      { name: 'Blog', href: '/blog' },
    ],
  },
}

const socialLinks = [
  {
    name: 'Facebook',
    href: 'https://facebook.com',
    icon: Facebook,
  },
  {
    name: 'Twitter',
    href: 'https://twitter.com',
    icon: Twitter,
  },
  {
    name: 'Instagram',
    href: 'https://instagram.com',
    icon: Instagram,
  },
  {
    name: 'LinkedIn',
    href: 'https://linkedin.com',
    icon: Linkedin,
  },
]

export function Footer() {
  return (
    <footer className="bg-background border-t">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link href={ROUTES.HOME} className="flex items-center space-x-2 mb-4">
              <img 
                src="/assets/img/logo.png" 
                alt="LABUREMOS Logo" 
                className="h-8 w-8 object-contain"
              />
              <span className="text-xl font-bold text-gradient">{APP_NAME}</span>
            </Link>
            <p className="text-muted-foreground mb-4 max-w-md">
              Conecta con freelancers profesionales y encuentra el talento que necesitas para tu proyecto. La plataforma líder para servicios profesionales.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>contacto.laburemos@gmail.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>+54 11 1234-5678</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Buenos Aires, Argentina</span>
              </div>
            </div>
          </div>

          {/* Links Sections */}
          {Object.entries(footerLinks).map(([key, section]) => (
            <div key={key}>
              <h3 className="font-semibold text-foreground mb-3">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter Section */}
        <div className="mt-8 pt-8 border-t">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <h3 className="font-semibold text-foreground mb-2">
                Mantente actualizado
              </h3>
              <p className="text-sm text-muted-foreground">
                Recibe las últimas noticias y oportunidades directamente en tu email.
              </p>
            </div>
            <div className="flex space-x-2 w-full md:w-auto">
              <input
                type="email"
                placeholder="Tu email"
                className="flex-1 md:w-64 h-10 px-3 py-2 text-sm border border-input bg-background rounded-md ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2 bg-gradient-to-r from-laburar-blue-600 to-laburar-green-600 text-white text-sm font-medium rounded-md hover:from-laburar-blue-700 hover:to-laburar-green-700 transition-all"
              >
                Suscribirse
              </motion.button>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-8 border-t flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          {/* Social Links */}
          <div className="flex items-center space-x-4">
            {socialLinks.map((social) => {
              const Icon = social.icon
              return (
                <motion.a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 rounded-full bg-muted hover:bg-accent transition-colors"
                >
                  <Icon className="h-4 w-4" />
                  <span className="sr-only">{social.name}</span>
                </motion.a>
              )
            })}
          </div>

          {/* Legal Links */}
          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacidad
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Términos
            </Link>
            <Link href="/cookies" className="hover:text-foreground transition-colors">
              Cookies
            </Link>
            <span>© 2024 {APP_NAME}. Todos los derechos reservados.</span>
          </div>
        </div>
      </div>
    </footer>
  )
}