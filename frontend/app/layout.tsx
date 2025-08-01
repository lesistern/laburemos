import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LABUREMOS - Plataforma de Freelancers Profesional',
  description: 'Conecta con freelancers profesionales y encuentra el talento que necesitas para tu proyecto',
  keywords: 'freelancers, profesionales, servicios, proyectos, trabajo remoto',
  authors: [{ name: 'LABUREMOS Team' }],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/logo-16.ico', sizes: '16x16', type: 'image/x-icon' },
      { url: '/logo-32.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/logo-64.ico', sizes: '64x64', type: 'image/x-icon' },
    ],
    apple: [
      { url: '/assets/img/logo.png', sizes: '256x256', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'LABUREMOS - Plataforma de Freelancers Profesional',
    description: 'Conecta con freelancers profesionales y encuentra el talento que necesitas',
    type: 'website',
    locale: 'es_AR',
    siteName: 'LABUREMOS',
    images: [
      {
        url: '/assets/img/logo.png',
        width: 256,
        height: 256,
        alt: 'LABUREMOS Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LABUREMOS - Plataforma de Freelancers',
    description: 'Conecta con freelancers profesionales',
    images: ['/assets/img/logo.png'],
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}