'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Info,
  Loader2 
} from 'lucide-react'

export interface ValidationRule {
  test: (value: string) => boolean
  message: string
  level?: 'error' | 'warning' | 'info'
}

export interface FormFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  /**
   * Field label
   */
  label?: string
  /**
   * Field description or help text
   */
  description?: string
  /**
   * Field error message
   */
  error?: string
  /**
   * Field success message
   */
  success?: string
  /**
   * Field warning message
   */
  warning?: string
  /**
   * Whether the field is required
   */
  required?: boolean
  /**
   * Validation rules for real-time validation
   */
  validationRules?: ValidationRule[]
  /**
   * Whether to show validation on change (real-time)
   */
  validateOnChange?: boolean
  /**
   * Whether to show validation on blur
   */
  validateOnBlur?: boolean
  /**
   * Loading state
   */
  loading?: boolean
  /**
   * Icon to display in the field
   */
  icon?: React.ComponentType<{ className?: string }>
  /**
   * Whether this is a password field with toggle visibility
   */
  isPassword?: boolean
  /**
   * Custom validation function
   */
  onValidate?: (value: string, isValid: boolean, validationMessages: string[]) => void
  /**
   * Change handler with validation
   */
  onChange?: (value: string, event: React.ChangeEvent<HTMLInputElement>) => void
  /**
   * Blur handler
   */
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void
  /**
   * Additional className for the container
   */
  containerClassName?: string
  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg'
  /**
   * Whether to show character count
   */
  showCharCount?: boolean
  /**
   * Maximum character count
   */
  maxLength?: number
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  description,
  error,
  success,
  warning,
  required,
  validationRules = [],
  validateOnChange = true,
  validateOnBlur = true,
  loading,
  icon: Icon,
  isPassword,
  onValidate,
  onChange,
  onBlur,
  containerClassName,
  size = 'md',
  showCharCount,
  maxLength,
  className,
  disabled,
  value = '',
  id,
  ...props
}) => {
  const [internalValue, setInternalValue] = useState(value as string)
  const [showPassword, setShowPassword] = useState(false)
  const [validationMessages, setValidationMessages] = useState<{ message: string; level: string }[]>([])
  const [hasBlurred, setHasBlurred] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const fieldId = id || `field-${Math.random().toString(36).substr(2, 9)}`

  // Update internal value when prop changes
  useEffect(() => {
    setInternalValue(value as string)
  }, [value])

  // Perform validation
  const performValidation = (val: string) => {
    const messages: { message: string; level: string }[] = []
    let isValid = true

    validationRules.forEach(rule => {
      if (!rule.test(val)) {
        messages.push({
          message: rule.message,
          level: rule.level || 'error'
        })
        if (rule.level !== 'warning' && rule.level !== 'info') {
          isValid = false
        }
      }
    })

    setValidationMessages(messages)
    onValidate?.(val, isValid, messages.map(m => m.message))

    return { isValid, messages }
  }

  // Handle input change
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value
    setInternalValue(newValue)
    onChange?.(newValue, event)

    if (validateOnChange && (hasBlurred || newValue.length > 0)) {
      performValidation(newValue)
    }
  }

  // Handle input blur
  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    setHasBlurred(true)
    setIsFocused(false)
    onBlur?.(event)

    if (validateOnBlur) {
      performValidation(internalValue)
    }
  }

  // Handle input focus
  const handleFocus = () => {
    setIsFocused(true)
  }

  // Determine field state
  const hasError = error || validationMessages.some(m => m.level === 'error')
  const hasWarning = warning || validationMessages.some(m => m.level === 'warning')
  const hasSuccess = success || (hasBlurred && internalValue.length > 0 && !hasError && !hasWarning)
  const hasInfo = validationMessages.some(m => m.level === 'info')

  // Size classes
  const sizeClasses = {
    sm: {
      input: 'h-8 px-3 text-sm',
      icon: 'w-4 h-4',
      label: 'text-sm',
      description: 'text-xs',
      message: 'text-xs'
    },
    md: {
      input: 'h-10 px-3 text-sm',
      icon: 'w-5 h-5',
      label: 'text-sm',
      description: 'text-sm',
      message: 'text-sm'
    },
    lg: {
      input: 'h-12 px-4 text-base',
      icon: 'w-5 h-5',
      label: 'text-base',
      description: 'text-base',
      message: 'text-sm'
    }
  }

  // Input classes
  const inputClasses = cn(
    'w-full rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1',
    sizeClasses[size].input,
    {
      'border-gray-300 focus:border-laburar-sky-blue-500 focus:ring-laburar-sky-blue-500/20': !hasError && !hasWarning && !hasSuccess,
      'border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-red-50/50': hasError,
      'border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500/20 bg-yellow-50/50': hasWarning && !hasError,
      'border-green-300 focus:border-green-500 focus:ring-green-500/20 bg-green-50/50': hasSuccess && !hasError && !hasWarning,
      'pl-10': Icon && !isPassword,
      'pr-10': isPassword || loading,
      'pr-16': isPassword && loading,
      'opacity-50 cursor-not-allowed': disabled,
      'cursor-not-allowed': loading,
    },
    className
  )

  // Get status icon
  const getStatusIcon = () => {
    if (loading) {
      return <Loader2 className={cn('animate-spin text-gray-400', sizeClasses[size].icon)} />
    }
    if (hasError) {
      return <AlertCircle className={cn('text-red-500', sizeClasses[size].icon)} />
    }
    if (hasWarning) {
      return <AlertCircle className={cn('text-yellow-500', sizeClasses[size].icon)} />
    }
    if (hasSuccess) {
      return <CheckCircle className={cn('text-green-500', sizeClasses[size].icon)} />
    }
    return null
  }

  // Get all messages to display
  const getAllMessages = () => {
    const messages = []
    if (error) messages.push({ message: error, level: 'error' })
    if (warning && !error) messages.push({ message: warning, level: 'warning' })
    if (success && !error && !warning) messages.push({ message: success, level: 'success' })
    
    // Add validation messages if they should be shown
    if (hasBlurred || isFocused) {
      validationMessages.forEach(vm => {
        if (!messages.some(m => m.message === vm.message)) {
          messages.push(vm)
        }
      })
    }

    return messages
  }

  const allMessages = getAllMessages()
  const charCount = internalValue.length
  const isOverLimit = maxLength && charCount > maxLength

  return (
    <div className={cn('w-full', containerClassName)}>
      {/* Label */}
      {label && (
        <label 
          htmlFor={fieldId}
          className={cn(
            'block font-medium text-gray-900 mb-2',
            sizeClasses[size].label,
            {
              'text-red-900': hasError,
              'text-yellow-900': hasWarning && !hasError,
              'text-green-900': hasSuccess && !hasError && !hasWarning,
            }
          )}
        >
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-label="requerido">*</span>
          )}
        </label>
      )}

      {/* Description */}
      {description && !isFocused && (
        <p className={cn(
          'text-gray-600 mb-2',
          sizeClasses[size].description
        )}>
          {description}
        </p>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Leading Icon */}
        {Icon && !isPassword && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <Icon className={cn('text-gray-400', sizeClasses[size].icon)} />
          </div>
        )}

        {/* Input */}
        <input
          ref={inputRef}
          id={fieldId}
          type={isPassword ? (showPassword ? 'text' : 'password') : 'text'}
          value={internalValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          disabled={disabled || loading}
          maxLength={maxLength}
          className={inputClasses}
          aria-invalid={hasError}
          aria-describedby={`${fieldId}-description ${fieldId}-messages`}
          {...props}
        />

        {/* Trailing Icons */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
          {/* Password Toggle */}
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? (
                <EyeOff className={sizeClasses[size].icon} />
              ) : (
                <Eye className={sizeClasses[size].icon} />
              )}
            </button>
          )}

          {/* Status Icon */}
          {getStatusIcon()}
        </div>
      </div>

      {/* Character Count */}
      {showCharCount && maxLength && (
        <div className="flex justify-end mt-1">
          <span className={cn(
            'text-xs',
            {
              'text-gray-500': !isOverLimit,
              'text-red-500': isOverLimit,
            }
          )}>
            {charCount}/{maxLength}
          </span>
        </div>
      )}

      {/* Messages */}
      <AnimatePresence>
        {allMessages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mt-2 space-y-1"
            id={`${fieldId}-messages`}
            role="alert"
            aria-live="polite"
          >
            {allMessages.map((msg, index) => (
              <motion.div
                key={`${msg.level}-${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className={cn(
                  'flex items-start space-x-2',
                  sizeClasses[size].message
                )}
              >
                {msg.level === 'error' && <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />}
                {msg.level === 'warning' && <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />}
                {msg.level === 'success' && <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />}
                {msg.level === 'info' && <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />}
                <span className={cn({
                  'text-red-600': msg.level === 'error',
                  'text-yellow-600': msg.level === 'warning',
                  'text-green-600': msg.level === 'success',
                  'text-blue-600': msg.level === 'info',
                })}>
                  {msg.message}
                </span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Common validation rules
export const validationRules = {
  required: (message = 'Este campo es requerido'): ValidationRule => ({
    test: (value) => value.trim().length > 0,
    message
  }),
  
  email: (message = 'Ingresa un email válido'): ValidationRule => ({
    test: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message
  }),
  
  minLength: (min: number, message?: string): ValidationRule => ({
    test: (value) => value.length >= min,
    message: message || `Debe tener al menos ${min} caracteres`
  }),
  
  maxLength: (max: number, message?: string): ValidationRule => ({
    test: (value) => value.length <= max,
    message: message || `No puede tener más de ${max} caracteres`
  }),
  
  password: (message = 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número'): ValidationRule => ({
    test: (value) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/.test(value),
    message
  }),
  
  phone: (message = 'Ingresa un número de teléfono válido'): ValidationRule => ({
    test: (value) => /^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/[\s\-\(\)]/g, '')),
    message
  }),
  
  noSpaces: (message = 'No se permiten espacios'): ValidationRule => ({
    test: (value) => !/\s/.test(value),
    message
  }),
  
  alphanumeric: (message = 'Solo se permiten letras y números'): ValidationRule => ({
    test: (value) => /^[a-zA-Z0-9]+$/.test(value),
    message
  })
}

export default FormField