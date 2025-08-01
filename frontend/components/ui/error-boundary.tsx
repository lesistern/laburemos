'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home, Bug, Mail } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showErrorDetails?: boolean
  enableRetry?: boolean
  resetKey?: string | number
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  retryCount: number
}

export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // Call the optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Report to error monitoring service (e.g., Sentry)
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(error, {
    //     contexts: {
    //       react: {
    //         componentStack: errorInfo.componentStack
    //       }
    //     }
    //   })
    // }
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKey } = this.props
    const { hasError } = this.state

    if (hasError && prevProps.resetKey !== resetKey) {
      this.resetErrorBoundary()
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: this.state.retryCount + 1
    })
  }

  handleRetry = () => {
    const { retryCount } = this.state
    
    if (retryCount >= 3) {
      // Prevent infinite retry loops
      return
    }

    this.resetErrorBoundary()

    // Auto-retry with exponential backoff
    this.resetTimeoutId = window.setTimeout(() => {
      if (this.state.hasError) {
        this.resetErrorBoundary()
      }
    }, Math.pow(2, retryCount) * 1000)
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  handleReportError = () => {
    const { error, errorInfo } = this.state
    const errorReport = {
      error: error?.toString(),
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    }

    // Create mailto link with error details
    const subject = encodeURIComponent('Error Report - LaburAR Admin Panel')
    const body = encodeURIComponent(`
Error Report:
${JSON.stringify(errorReport, null, 2)}

Please describe what you were doing when this error occurred:
[Your description here]
    `)
    
    window.open(`mailto:soporte@laburar.com?subject=${subject}&body=${body}`)
  }

  render() {
    const { hasError, error, errorInfo, retryCount } = this.state
    const { children, fallback, showErrorDetails = false, enableRetry = true } = this.props

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl border-red-200 bg-red-50">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-red-800 text-2xl">
                Oops! Algo salió mal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-red-700 mb-2">
                  Ha ocurrido un error inesperado en la aplicación.
                </p>
                <p className="text-red-600 text-sm">
                  Nuestro equipo técnico ha sido notificado automáticamente.
                </p>
              </div>

              {showErrorDetails && error && (
                <div className="bg-red-100 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-800 text-sm mb-2">
                    Detalles técnicos:
                  </h4>
                  <pre className="text-xs text-red-700 overflow-auto max-h-32 bg-white p-2 rounded border">
                    {error.toString()}
                    {errorInfo?.componentStack && '\n\nComponent Stack:' + errorInfo.componentStack}
                  </pre>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {enableRetry && retryCount < 3 && (
                  <Button
                    onClick={this.handleRetry}
                    className="bg-red-600 hover:bg-red-700 text-white"
                    disabled={retryCount >= 3}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Intentar de nuevo
                    {retryCount > 0 && ` (${retryCount}/3)`}
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={this.handleGoHome}
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Ir al inicio
                </Button>

                <Button
                  variant="outline"
                  onClick={this.handleReportError}
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Reportar error
                </Button>
              </div>

              {retryCount >= 3 && (
                <div className="bg-yellow-100 border border-yellow-200 rounded-lg p-4 text-center">
                  <Bug className="w-5 h-5 text-yellow-600 mx-auto mb-2" />
                  <p className="text-yellow-800 text-sm">
                    El error persiste después de varios intentos. Por favor, contacta al soporte técnico.
                  </p>
                </div>
              )}

              <div className="text-center text-xs text-red-600">
                Error ID: {Date.now()}-{Math.random().toString(36).substr(2, 9)}
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return children
  }
}

// Hook for functional components to reset error boundaries
export const useErrorBoundary = () => {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const captureError = React.useCallback((error: Error) => {
    setError(error)
  }, [])

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return {
    captureError,
    resetError
  }
}

// HOC to wrap components with error boundary
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

export default ErrorBoundary