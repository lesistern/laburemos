import React from 'react'
import { Button } from '@/components/ui/button'
import { Search, Home, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <Search className="w-10 h-10 text-gray-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            404
          </h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">
            Página no encontrada
          </h2>
          <p className="text-gray-600">
            La página que buscas no existe o ha sido movida a otra ubicación.
          </p>
        </div>

        <div className="space-y-3">
          <Button 
            asChild
            className="w-full"
            size="lg"
          >
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Ir al inicio
            </Link>
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="w-full"
            size="lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver atrás
          </Button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            ¿Necesitas ayuda? Contacta a nuestro{' '}
            <Link 
              href="/support" 
              className="text-blue-600 hover:underline"
            >
              equipo de soporte
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}