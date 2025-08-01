import { Metadata } from 'next'
import { HomePageContent } from '@/components/pages/home-page-content'

export const metadata: Metadata = {
  title: 'LABUREMOS - Plataforma de Trabajo Remoto para Argentina',
  description: 'Conecta con oportunidades de trabajo remoto en Argentina. Encuentra empleos flexibles, construye tu carrera profesional y trabaja desde cualquier lugar.',
  keywords: 'trabajo remoto, empleo Argentina, trabajos flexibles, carrera profesional, freelance',
  openGraph: {
    title: 'LABUREMOS - Plataforma de Trabajo Remoto para Argentina',
    description: 'Conecta con oportunidades de trabajo remoto en Argentina.',
    url: 'https://laburemos.com.ar',
    siteName: 'LABUREMOS',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'es_AR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LABUREMOS - Plataforma de Trabajo Remoto para Argentina',
    description: 'Conecta con oportunidades de trabajo remoto en Argentina.',
    images: ['/og-image.jpg'],
  },
}

export default function HomePage() {
  return <HomePageContent />
}