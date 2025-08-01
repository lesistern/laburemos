'use client'

import React, { Suspense } from 'react'
import { PageErrorBoundary } from './page-error-boundary'
import { AdminPageLoading, LoadingCard } from '@/components/ui/loading'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { AlertCircle, CheckCircle, Info, Shield } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface AdminPageLayoutProps {
  children: React.ReactNode
  pageName: string
  pageDescription?: string
  loading?: boolean
  error?: Error | null
  onRetry?: () => void
  showBreadcrumb?: boolean
  breadcrumbItems?: Array<{ label: string; href?: string }>
  headerActions?: React.ReactNode
  notifications?: Array<{
    id: string
    type: 'info' | 'success' | 'warning' | 'error'
    title: string
    message: string
    dismissible?: boolean
    onDismiss?: () => void
  }>
  className?: string
}

const NotificationBanner: React.FC<{
  notifications: AdminPageLayoutProps['notifications']
}> = ({ notifications = [] }) => {
  if (!notifications.length) return null

  const getNotificationStyle = (type: string) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-800',
          icon: CheckCircle,
          iconColor: 'text-green-600'
        }
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-800',
          icon: AlertCircle,
          iconColor: 'text-yellow-600'
        }
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          icon: AlertCircle,
          iconColor: 'text-red-600'
        }
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          icon: Info,
          iconColor: 'text-blue-600'
        }
    }
  }

  return (
    <div className="space-y-3 mb-6">
      {notifications.map((notification) => {
        const style = getNotificationStyle(notification.type)
        const Icon = style.icon

        return (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              'flex items-start space-x-3 p-4 rounded-lg border',
              style.bg,
              style.border
            )}
          >
            <Icon className={cn('w-5 h-5 mt-0.5 flex-shrink-0', style.iconColor)} />
            <div className="flex-1 min-w-0">
              <h4 className={cn('font-semibold text-sm', style.text)}>
                {notification.title}
              </h4>
              <p className={cn('text-sm mt-1', style.text)}>
                {notification.message}
              </p>
            </div>
            {notification.dismissible && notification.onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={notification.onDismiss}
                className={cn('text-xs', style.text, 'hover:bg-white/50')}
              >
                ✕
              </Button>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

const Breadcrumb: React.FC<{
  items: Array<{ label: string; href?: string }>
}> = ({ items }) => {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
      <span className="flex items-center">
        <Shield className="w-4 h-4 mr-1" />
        Admin
      </span>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <span className="text-gray-400">/</span>
          {item.href ? (
            <a 
              href={item.href} 
              className="hover:text-laburar-sky-blue-600 transition-colors"
            >
              {item.label}
            </a>
          ) : (
            <span className="text-gray-900 font-medium">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}

const PageHeader: React.FC<{
  pageName: string
  pageDescription?: string
  headerActions?: React.ReactNode
}> = ({ pageName, pageDescription, headerActions }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
      <div className="mb-4 sm:mb-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {pageName}
        </h1>
        {pageDescription && (
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            {pageDescription}
          </p>
        )}
      </div>
      {headerActions && (
        <div className="flex items-center space-x-3">
          {headerActions}
        </div>
      )}
    </div>
  )
}

const LoadingFallback: React.FC<{
  pageName: string
  pageDescription?: string
}> = ({ pageName, pageDescription }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="mb-4 sm:mb-0">
          <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
          {pageDescription && (
            <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
          )}
        </div>
        <div className="flex space-x-3">
          <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <LoadingCard
            key={i}
            title="Cargando datos..."
            height="h-32"
          />
        ))}
      </div>

      <LoadingCard
        title={`Cargando ${pageName}...`}
        description="Preparando el contenido de la página"
        height="h-96"
        variant="gradient"
      />
    </div>
  )
}

export const AdminPageLayout: React.FC<AdminPageLayoutProps> = ({
  children,
  pageName,
  pageDescription,
  loading = false,
  error = null,
  onRetry,
  showBreadcrumb = false,
  breadcrumbItems = [],
  headerActions,
  notifications = [],
  className
}) => {
  // Handle error state
  if (error) {
    return (
      <PageErrorBoundary
        pageName={pageName}
        pageDescription={pageDescription}
        enableRetry={!!onRetry}
      >
        <div>Error: {error.message}</div>
      </PageErrorBoundary>
    )
  }

  // Handle loading state
  if (loading) {
    return (
      <div className={cn('space-y-6', className)}>
        {showBreadcrumb && breadcrumbItems.length > 0 && (
          <Breadcrumb items={breadcrumbItems} />
        )}
        <LoadingFallback 
          pageName={pageName} 
          pageDescription={pageDescription} 
        />
      </div>
    )
  }

  return (
    <PageErrorBoundary
      pageName={pageName}
      pageDescription={pageDescription}
      enableRetry={!!onRetry}
    >
      <div className={cn('space-y-6', className)}>
        {/* Breadcrumb */}
        {showBreadcrumb && breadcrumbItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Breadcrumb items={breadcrumbItems} />
          </motion.div>
        )}

        {/* Notifications */}
        <NotificationBanner notifications={notifications} />

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <PageHeader
            pageName={pageName}
            pageDescription={pageDescription}
            headerActions={headerActions}
          />
        </motion.div>

        {/* Page Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Suspense 
            fallback={
              <LoadingFallback 
                pageName={pageName} 
                pageDescription={pageDescription} 
              />
            }
          >
            {children}
          </Suspense>
        </motion.div>
      </div>
    </PageErrorBoundary>
  )
}

// HOC version for easier integration
export const withAdminPageLayout = <P extends object>(
  Component: React.ComponentType<P>,
  layoutProps: Omit<AdminPageLayoutProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <AdminPageLayout {...layoutProps}>
      <Component {...props} />
    </AdminPageLayout>
  )

  WrappedComponent.displayName = `withAdminPageLayout(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// Hook for managing page state
export const useAdminPageState = () => {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)
  const [notifications, setNotifications] = React.useState<AdminPageLayoutProps['notifications']>([])

  const addNotification = React.useCallback((notification: Omit<NonNullable<AdminPageLayoutProps['notifications']>[0], 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newNotification = {
      ...notification,
      id,
      dismissible: notification.dismissible ?? true,
      onDismiss: notification.dismissible !== false 
        ? () => removeNotification(id)
        : undefined
    }
    
    setNotifications(prev => [...(prev || []), newNotification])
    
    // Auto-dismiss after 5 seconds for non-error notifications
    if (notification.type !== 'error' && notification.dismissible !== false) {
      setTimeout(() => removeNotification(id), 5000)
    }
  }, [])

  const removeNotification = React.useCallback((id: string) => {
    setNotifications(prev => prev?.filter(n => n.id !== id) || [])
  }, [])

  const clearNotifications = React.useCallback(() => {
    setNotifications([])
  }, [])

  const handleAsyncOperation = React.useCallback(async <T,>(
    operation: () => Promise<T>,
    options: {
      loadingMessage?: string
      successMessage?: string
      errorMessage?: string
    } = {}
  ): Promise<T | null> => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await operation()
      
      if (options.successMessage) {
        addNotification({
          type: 'success',
          title: 'Operación exitosa',
          message: options.successMessage
        })
      }
      
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error desconocido')
      setError(error)
      
      addNotification({
        type: 'error',
        title: 'Error',
        message: options.errorMessage || error.message,
        dismissible: false
      })
      
      return null
    } finally {
      setLoading(false)
    }
  }, [addNotification])

  const retry = React.useCallback(() => {
    setError(null)
    clearNotifications()
  }, [clearNotifications])

  return {
    loading,
    error,
    notifications,
    setLoading,
    setError,
    addNotification,
    removeNotification,
    clearNotifications,
    handleAsyncOperation,
    retry
  }
}

export default AdminPageLayout