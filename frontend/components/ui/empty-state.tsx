'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { 
  Search, 
  Users, 
  FolderOpen, 
  AlertCircle, 
  Plus,
  RefreshCw,
  Database,
  FileText,
  Settings,
  Mail
} from 'lucide-react'

// Icon mapping for different empty state types
const iconMap = {
  search: Search,
  users: Users,
  files: FolderOpen,
  error: AlertCircle,
  database: Database,
  documents: FileText,
  settings: Settings,
  notifications: Mail,
  general: FolderOpen
} as const

export interface EmptyStateProps {
  /**
   * Type of empty state - determines default icon and styling
   */
  type?: keyof typeof iconMap
  /**
   * Custom icon component to display
   */
  icon?: React.ComponentType<{ className?: string }>
  /**
   * Main title text
   */
  title: string
  /**
   * Description text
   */
  description?: string
  /**
   * Primary action button
   */
  action?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'outline' | 'secondary'
    icon?: React.ComponentType<{ className?: string }>
  }
  /**
   * Secondary action button
   */
  secondaryAction?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'outline' | 'secondary'
    icon?: React.ComponentType<{ className?: string }>
  }
  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg'
  /**
   * Visual variant
   */
  variant?: 'default' | 'minimal' | 'card'
  /**
   * Custom illustration or image
   */
  illustration?: React.ReactNode
  /**
   * Additional className
   */
  className?: string
  /**
   * Show animation
   */
  animated?: boolean
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'general',
  icon: CustomIcon,
  title,
  description,
  action,
  secondaryAction,
  size = 'md',
  variant = 'default',
  illustration,
  className,
  animated = true
}) => {
  const Icon = CustomIcon || iconMap[type]

  const sizeClasses = {
    sm: {
      container: 'py-8 px-4',
      icon: 'w-12 h-12',
      iconContainer: 'w-16 h-16 mb-4',
      title: 'text-lg',
      description: 'text-sm',
      spacing: 'space-y-3'
    },
    md: {
      container: 'py-12 px-6',
      icon: 'w-16 h-16',
      iconContainer: 'w-20 h-20 mb-6',
      title: 'text-xl',
      description: 'text-base',
      spacing: 'space-y-4'
    },
    lg: {
      container: 'py-16 px-8',
      icon: 'w-20 h-20',
      iconContainer: 'w-24 h-24 mb-8',
      title: 'text-2xl',
      description: 'text-lg',
      spacing: 'space-y-6'
    }
  }

  const variantClasses = {
    default: 'bg-gray-50/50',
    minimal: '',
    card: 'bg-white border border-gray-200 rounded-xl shadow-sm'
  }

  const containerClasses = cn(
    'text-center',
    sizeClasses[size].container,
    variantClasses[variant],
    className
  )

  const iconColor = {
    search: 'text-blue-400 bg-blue-50',
    users: 'text-green-400 bg-green-50',
    files: 'text-yellow-400 bg-yellow-50',
    error: 'text-red-400 bg-red-50',
    database: 'text-purple-400 bg-purple-50',
    documents: 'text-indigo-400 bg-indigo-50',
    settings: 'text-gray-400 bg-gray-50',
    notifications: 'text-orange-400 bg-orange-50',
    general: 'text-gray-400 bg-gray-50'
  }

  const EmptyStateContent = () => (
    <div className={cn('flex flex-col items-center justify-center max-w-md mx-auto', sizeClasses[size].spacing)}>
      {/* Icon or Illustration */}
      {illustration ? (
        <div className="mb-6">
          {illustration}
        </div>
      ) : (
        <motion.div
          initial={animated ? { scale: 0, opacity: 0 } : {}}
          animate={animated ? { scale: 1, opacity: 1 } : {}}
          transition={{ duration: 0.3, type: "spring", stiffness: 400, damping: 25 }}
          className={cn(
            'flex items-center justify-center rounded-full',
            sizeClasses[size].iconContainer,
            iconColor[type]
          )}
        >
          <Icon className={cn(sizeClasses[size].icon)} aria-hidden="true" />
        </motion.div>
      )}

      {/* Content */}
      <motion.div
        initial={animated ? { y: 10, opacity: 0 } : {}}
        animate={animated ? { y: 0, opacity: 1 } : {}}
        transition={{ duration: 0.4, delay: animated ? 0.1 : 0 }}
        className="space-y-3"
      >
        <h3 className={cn('font-semibold text-gray-900', sizeClasses[size].title)}>
          {title}
        </h3>
        
        {description && (
          <p className={cn('text-gray-600 max-w-sm', sizeClasses[size].description)}>
            {description}
          </p>
        )}
      </motion.div>

      {/* Actions */}
      {(action || secondaryAction) && (
        <motion.div
          initial={animated ? { y: 10, opacity: 0 } : {}}
          animate={animated ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.4, delay: animated ? 0.2 : 0 }}
          className="flex flex-col sm:flex-row gap-3 mt-6"
        >
          {action && (
            <Button
              onClick={action.onClick}
              variant={action.variant || 'default'}
              className="flex items-center justify-center gap-2"
            >
              {action.icon && <action.icon className="w-4 h-4" />}
              {action.label}
            </Button>
          )}
          
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant={secondaryAction.variant || 'outline'}
              className="flex items-center justify-center gap-2"
            >
              {secondaryAction.icon && <secondaryAction.icon className="w-4 h-4" />}
              {secondaryAction.label}
            </Button>
          )}
        </motion.div>
      )}
    </div>
  )

  if (variant === 'card') {
    return (
      <Card className={containerClasses}>
        <CardContent className="p-0">
          <EmptyStateContent />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={containerClasses}>
      <EmptyStateContent />
    </div>
  )
}

// Preset empty states for common use cases
export const SearchEmptyState: React.FC<Pick<EmptyStateProps, 'action' | 'secondaryAction'>> = (props) => (
  <EmptyState
    type="search"
    title="No se encontraron resultados"
    description="Intenta ajustar tus criterios de búsqueda o usar términos diferentes."
    {...props}
  />
)

export const UsersEmptyState: React.FC<Pick<EmptyStateProps, 'action' | 'secondaryAction'>> = (props) => (
  <EmptyState
    type="users"
    title="No hay usuarios"
    description="Aún no se han registrado usuarios en la plataforma."
    action={{
      label: 'Invitar usuarios',
      onClick: () => {},
      icon: Plus,
      ...props.action
    }}
    {...props}
  />
)

export const ErrorEmptyState: React.FC<Pick<EmptyStateProps, 'title' | 'description' | 'action' | 'secondaryAction'>> = (props) => (
  <EmptyState
    type="error"
    title={props.title || "Algo salió mal"}
    description={props.description || "Ocurrió un error al cargar la información. Intenta nuevamente."}
    action={{
      label: 'Reintentar',
      onClick: () => {},
      icon: RefreshCw,
      ...props.action
    }}
    {...props}
  />
)

export const DataEmptyState: React.FC<Pick<EmptyStateProps, 'title' | 'description' | 'action' | 'secondaryAction'>> = (props) => (
  <EmptyState
    type="database"
    title={props.title || "No hay datos disponibles"}
    description={props.description || "No se encontraron datos para mostrar en este momento."}
    {...props}
  />
)