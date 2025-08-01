'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Loader2, Shield, Database, Users, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

// Basic loading spinner component
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  text?: string
  className?: string
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  text,
  className
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  const colorClasses = {
    primary: 'text-laburar-sky-blue-600',
    secondary: 'text-gray-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600'
  }

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="flex flex-col items-center space-y-2">
        <Loader2 className={cn(
          'animate-spin',
          sizeClasses[size],
          colorClasses[color]
        )} />
        {text && (
          <p className={cn(
            'text-sm font-medium',
            colorClasses[color]
          )}>
            {text}
          </p>
        )}
      </div>
    </div>
  )
}

// Enhanced loading card for admin sections
interface LoadingCardProps {
  title?: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  variant?: 'default' | 'gradient' | 'minimal'
  height?: string
  className?: string
}

export const LoadingCard: React.FC<LoadingCardProps> = ({
  title = 'Cargando...',
  description,
  icon: Icon = Shield,
  variant = 'default',
  height = 'h-48',
  className
}) => {
  const variants = {
    default: 'bg-white border border-gray-200',
    gradient: 'bg-gradient-to-br from-laburar-sky-blue-50 to-blue-100 border border-laburar-sky-blue-200',
    minimal: 'bg-gray-50 border border-gray-100'
  }

  return (
    <Card className={cn(variants[variant], height, className)}>
      <CardContent className="flex flex-col items-center justify-center h-full p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4"
        >
          <div className="relative">
            <div className="w-16 h-16 bg-laburar-sky-blue-100 rounded-full flex items-center justify-center mx-auto">
              <Icon className="w-8 h-8 text-laburar-sky-blue-600" />
            </div>
            <div className="absolute inset-0 w-16 h-16 border-2 border-laburar-sky-blue-200 rounded-full animate-pulse mx-auto"></div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {description && (
              <p className="text-sm text-gray-600 max-w-sm">{description}</p>
            )}
          </div>

          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-laburar-sky-blue-400 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>
        </motion.div>
      </CardContent>
    </Card>
  )
}

// Skeleton components for loading states
interface SkeletonProps {
  className?: string
  variant?: 'default' | 'circular' | 'rectangular'
  width?: string
  height?: string
  animate?: boolean
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'default',
  width,
  height,
  animate = true
}) => {
  const baseClasses = 'bg-gray-200'
  const animateClasses = animate ? 'animate-pulse' : ''
  
  const variantClasses = {
    default: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none'
  }

  const style = {
    width: width || undefined,
    height: height || undefined
  }

  return (
    <div
      className={cn(
        baseClasses,
        animateClasses,
        variantClasses[variant],
        className
      )}
      style={style}
    />
  )
}

// Table skeleton for admin tables
export const TableSkeleton: React.FC<{
  rows?: number
  columns?: number
  showHeader?: boolean
}> = ({
  rows = 5,
  columns = 4,
  showHeader = true
}) => {
  return (
    <div className="w-full">
      {showHeader && (
        <div className="flex space-x-4 p-4 bg-gray-50 border-b">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
      )}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex space-x-4 p-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton 
                key={colIndex} 
                className={cn(
                  'h-4',
                  colIndex === 0 ? 'w-8' : 'flex-1'
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// Stats card skeleton
export const StatsCardSkeleton: React.FC = () => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton variant="circular" className="w-12 h-12" />
        </div>
      </CardContent>
    </Card>
  )
}

// Chart skeleton
export const ChartSkeleton: React.FC<{ height?: string }> = ({ 
  height = 'h-64' 
}) => {
  return (
    <Card className={height}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-end space-x-1">
              {Array.from({ length: 12 }).map((_, j) => (
                <Skeleton
                  key={j}
                  className="flex-1"
                  height={`${Math.random() * 40 + 20}px`}
                />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Full page loading with admin branding
interface AdminPageLoadingProps {
  title?: string
  description?: string
  showLogo?: boolean
}

export const AdminPageLoading: React.FC<AdminPageLoadingProps> = ({
  title = 'Cargando panel de administración',
  description = 'Preparando tu dashboard...',
  showLogo = true
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center space-y-8 max-w-md">
        {showLogo && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex justify-center"
          >
            <div className="w-20 h-20 bg-gradient-to-r from-laburar-sky-blue-500 to-laburar-sky-blue-600 rounded-2xl flex items-center justify-center">
              <Shield className="w-10 h-10 text-white" />
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-4"
        >
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-600">{description}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="space-y-6"
        >
          {/* Loading progress animation */}
          <div className="flex justify-center space-x-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="w-3 h-3 bg-laburar-sky-blue-500 rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>

          {/* Loading modules */}
          <div className="space-y-3 text-sm text-gray-600">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="flex items-center justify-center space-x-2"
            >
              <Users className="w-4 h-4" />
              <span>Cargando usuarios...</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 1.2 }}
              className="flex items-center justify-center space-x-2"
            >
              <Database className="w-4 h-4" />
              <span>Conectando con base de datos...</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 1.6 }}
              className="flex items-center justify-center space-x-2"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Preparando analíticas...</span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// Overlay loading for modal dialogs and forms
interface LoadingOverlayProps {
  isVisible: boolean
  text?: string
  size?: 'sm' | 'md' | 'lg'
  backdrop?: boolean
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  text = 'Procesando...',
  size = 'md',
  backdrop = true
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            'fixed inset-0 z-50 flex items-center justify-center',
            backdrop ? 'bg-black/20 backdrop-blur-sm' : ''
          )}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-4"
          >
            <LoadingSpinner size={size} text={text} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default LoadingSpinner