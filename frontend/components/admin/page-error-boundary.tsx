'use client'

import React from 'react'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  AlertTriangle, 
  RefreshCw, 
  ArrowLeft, 
  Shield,
  Database,
  Wifi,
  Server,
  Bug,
  ExternalLink
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PageErrorBoundaryProps {
  children: React.ReactNode
  pageName?: string
  pageDescription?: string
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  enableRetry?: boolean
  showBackButton?: boolean
}

const AdminErrorFallback: React.FC<{
  error: Error
  resetError: () => void
  pageName?: string
  pageDescription?: string
  enableRetry?: boolean
  showBackButton?: boolean
}> = ({ 
  error, 
  resetError, 
  pageName = 'Admin Panel', 
  pageDescription,
  enableRetry = true,
  showBackButton = true
}) => {
  const router = useRouter()
  const [retryCount, setRetryCount] = React.useState(0)
  const [isRetrying, setIsRetrying] = React.useState(false)

  const errorType = React.useMemo(() => {
    const errorMessage = error.message.toLowerCase()
    
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return 'network'
    } else if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
      return 'permission'
    } else if (errorMessage.includes('database') || errorMessage.includes('sql')) {
      return 'database'
    } else if (errorMessage.includes('server') || errorMessage.includes('500')) {
      return 'server'
    }
    return 'unknown'
  }, [error])

  const getErrorInfo = () => {
    switch (errorType) {
      case 'network':
        return {
          icon: Wifi,
          title: 'Problema de conexión',
          description: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        }
      case 'permission':
        return {
          icon: Shield,
          title: 'Acceso denegado',
          description: 'No tienes permisos para acceder a esta página. Contacta al administrador.',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        }
      case 'database':
        return {
          icon: Database,
          title: 'Error de base de datos',
          description: 'Problema temporal con la base de datos. Inténtalo nuevamente.',
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200'
        }
      case 'server':
        return {
          icon: Server,
          title: 'Error del servidor',
          description: 'El servidor está experimentando problemas. Nuestro equipo ha sido notificado.',
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200'
        }
      default:
        return {
          icon: AlertTriangle,
          title: 'Error inesperado',
          description: 'Ha ocurrido un error inesperado. Por favor, inténtalo nuevamente.',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        }
    }
  }

  const errorInfo = getErrorInfo()
  const Icon = errorInfo.icon

  const handleRetry = async () => {
    if (retryCount >= 3) return
    
    setIsRetrying(true)
    setRetryCount(prev => prev + 1)
    
    // Add delay to prevent immediate retry
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    resetError()
    setIsRetrying(false)
  }

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/admin')
    }
  }

  const handleGoToDashboard = () => {
    router.push('/admin')
  }

  const handleReloadPage = () => {
    window.location.reload()
  }

  const handleReportError = () => {
    const errorReport = {
      page: pageName,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    }

    const subject = encodeURIComponent(`Error en ${pageName} - LaburAR Admin`)
    const body = encodeURIComponent(`
Página: ${pageName}
${pageDescription ? `Descripción: ${pageDescription}` : ''}

Error: ${error.message}

Detalles técnicos:
${JSON.stringify(errorReport, null, 2)}

Describe qué estabas haciendo cuando ocurrió el error:
[Tu descripción aquí]
    `)
    
    window.open(`mailto:admin@laburar.com?subject=${subject}&body=${body}`)
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <Card className={`w-full max-w-2xl ${errorInfo.borderColor} ${errorInfo.bgColor}`}>
        <CardHeader className="text-center pb-4">
          <div className={`mx-auto w-16 h-16 ${errorInfo.bgColor} rounded-full flex items-center justify-center mb-4 border-2 ${errorInfo.borderColor}`}>
            <Icon className={`w-8 h-8 ${errorInfo.color}`} />
          </div>
          <CardTitle className={`${errorInfo.color} text-xl`}>
            {errorInfo.title}
          </CardTitle>
          {pageName && (
            <p className="text-gray-600 text-sm mt-1">
              en {pageName}
            </p>
          )}
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className={`${errorInfo.color} font-medium mb-2`}>
              {errorInfo.description}
            </p>
            {pageDescription && (
              <p className="text-gray-600 text-sm">
                {pageDescription}
              </p>
            )}
          </div>

          {/* Error details in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-gray-100 border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 text-sm mb-2 flex items-center">
                <Bug className="w-4 h-4 mr-2" />
                Detalles del error (desarrollo):
              </h4>
              <pre className="text-xs text-gray-700 overflow-auto max-h-32 bg-white p-2 rounded border">
                {error.message}
              </pre>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {enableRetry && retryCount < 3 && (
              <Button
                onClick={handleRetry}
                disabled={isRetrying || retryCount >= 3}
                className={`${errorInfo.color.replace('text-', 'bg-')} hover:${errorInfo.color.replace('text-', 'bg-')}/90 text-white`}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
                {isRetrying ? 'Reintentando...' : 'Reintentar'}
                {retryCount > 0 && ` (${retryCount}/3)`}
              </Button>
            )}

            {showBackButton && (
              <Button
                variant="outline"
                onClick={handleGoBack}
                className={`border-gray-300 text-gray-700 hover:bg-gray-50`}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            )}

            <Button
              variant="outline"
              onClick={handleGoToDashboard}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Shield className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </div>

          {/* Additional actions */}
          <div className="flex flex-col sm:flex-row gap-2 justify-center text-sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReloadPage}
              className="text-gray-600 hover:text-gray-800"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Recargar página
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleReportError}
              className="text-gray-600 hover:text-gray-800"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              Reportar error
            </Button>
          </div>

          {retryCount >= 3 && (
            <div className="bg-yellow-100 border border-yellow-200 rounded-lg p-4 text-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mx-auto mb-2" />
              <p className="text-yellow-800 text-sm">
                El error persiste después de varios intentos. 
                Por favor, contacta al soporte técnico o recarga la página.
              </p>
            </div>
          )}

          {/* Error ID for support */}
          <div className="text-center text-xs text-gray-500 pt-4 border-t border-gray-200">
            ID de error: {Date.now()}-{Math.random().toString(36).substr(2, 9)}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export const PageErrorBoundary: React.FC<PageErrorBoundaryProps> = ({
  children,
  pageName,
  pageDescription,
  onError,
  enableRetry = true,
  showBackButton = true
}) => {
  return (
    <ErrorBoundary
      onError={onError}
      enableRetry={enableRetry}
      fallback={undefined}
    >
      {({ error, resetError }) => {
        if (error) {
          return (
            <AdminErrorFallback
              error={error}
              resetError={resetError}
              pageName={pageName}
              pageDescription={pageDescription}
              enableRetry={enableRetry}
              showBackButton={showBackButton}
            />
          )
        }
        return children
      }}
    </ErrorBoundary>
  )
}

// HOC version
export const withPageErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<PageErrorBoundaryProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <PageErrorBoundary {...options}>
      <Component {...props} />
    </PageErrorBoundary>
  )

  WrappedComponent.displayName = `withPageErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

export default PageErrorBoundary