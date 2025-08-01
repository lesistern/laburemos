'use client'

import { Header } from '@/components/layout/header'
import { Hero } from '@/components/home/hero'
import { Features } from '@/components/home/features'
import { HowItWorks } from '@/components/home/how-it-works'
import { Testimonials } from '@/components/home/testimonials'
import { CallToAction } from '@/components/home/call-to-action'
import { Footer } from '@/components/layout/footer'
import { NdaPopup } from '@/components/nda/nda-popup'
import { useNdaCheck } from '@/hooks/useNdaCheck'
import { LoadingSpinner } from '@/components/ui/loading'

export function HomePageContent() {
  const { 
    shouldShowPopup, 
    isLoading, 
    isAccepting, 
    error, 
    acceptNda, 
    skipNda 
  } = useNdaCheck()

  const handleAcceptNda = async (email: string) => {
    try {
      await acceptNda(email)
    } catch (error) {
      console.error('Error en aceptación de NDA:', error)
      // El error ya se maneja en el hook
    }
  }

  const handleCancelNda = () => {
    // No se permite cancelar el NDA - es obligatorio para acceder
    // Esta función se mantiene para compatibilidad pero no hace nada
    console.log('Intento de cancelar NDA - acción bloqueada')
  }

  return (
    <>
      <Header />
      <main className="min-h-screen">
        <Hero />
        <Features />
        <Testimonials />
        <CallToAction />
      </main>
      <Footer />
      
      {/* NDA Popup - Se muestra condicionalmente */}
      <NdaPopup
        isOpen={shouldShowPopup}
        onAccept={handleAcceptNda}
        onCancel={handleCancelNda}
        isLoading={isAccepting}
      />

      {/* Loading inicial mientras verificamos NDA */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 flex flex-col items-center gap-4">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-gray-600">Verificando acceso...</p>
          </div>
        </div>
      )}

      {/* Error de verificación NDA */}
      {error && !shouldShowPopup && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50 max-w-sm">
          <div className="flex">
            <div className="flex-1">
              <p className="text-sm font-medium">Error de verificación</p>
              <p className="text-sm">{error}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="ml-2 text-red-700 hover:text-red-900"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}