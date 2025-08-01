import { Metadata } from 'next'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import HowItWorksPageContent from '@/components/pages/HowItWorksPageContent'

export const metadata: Metadata = {
  title: '¿Cómo funciona LABUREMOS? - Guía paso a paso',
  description: 'Descubrí cómo funciona LABUREMOS en 4 pasos simples. Desde crear tu perfil hasta conseguir tu trabajo remoto ideal en Argentina.',
  keywords: 'como funciona LABUREMOS, trabajo remoto, guía paso a paso, empleo Argentina, tutorial trabajo remoto',
  openGraph: {
    title: '¿Cómo funciona LABUREMOS? - Guía paso a paso',
    description: 'Descubrí cómo funciona LABUREMOS en 4 pasos simples para conseguir tu trabajo remoto ideal.',
    url: 'https://laburemos.com.ar/como-funciona',
    siteName: 'LABUREMOS',
    images: [
      {
        url: '/og-image-como-funciona.jpg',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'es_AR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '¿Cómo funciona LABUREMOS? - Guía paso a paso',
    description: 'Descubrí cómo funciona LABUREMOS en 4 pasos simples para conseguir tu trabajo remoto ideal.',
    images: ['/og-image-como-funciona.jpg'],
  },
}

export default function ComoFuncionaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-sky-100 to-blue-50">
      <Header />
      <main>
        <HowItWorksPageContent />
      </main>
      <Footer />
    </div>
  )
}