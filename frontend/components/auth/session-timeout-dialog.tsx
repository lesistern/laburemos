'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, AlertTriangle, LogOut, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface SessionTimeoutDialogProps {
  isOpen: boolean
  timeRemaining: number
  onExtendSession: () => void
  onLogout: () => void
}

export function SessionTimeoutDialog({ 
  isOpen, 
  timeRemaining, 
  onExtendSession, 
  onLogout 
}: SessionTimeoutDialogProps) {
  const [countdown, setCountdown] = useState(timeRemaining)

  useEffect(() => {
    if (!isOpen) return

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1000) {
          onLogout()
          return 0
        }
        return prev - 1000
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isOpen, onLogout])

  useEffect(() => {
    setCountdown(timeRemaining)
  }, [timeRemaining])

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getUrgencyColor = (ms: number): string => {
    if (ms < 60000) return 'text-red-600' // Less than 1 minute
    if (ms < 180000) return 'text-orange-600' // Less than 3 minutes
    return 'text-yellow-600' // 3-5 minutes
  }

  const getProgressWidth = (ms: number): number => {
    const totalWarningTime = 5 * 60 * 1000 // 5 minutes in ms
    return Math.max(0, Math.min(100, (ms / totalWarningTime) * 100))
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && onExtendSession()}
          >
            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.3 }}
            >
              <Card className="w-full max-w-md p-6 shadow-2xl border-0 bg-white">
                {/* Header */}
                <div className="text-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                    className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg"
                  >
                    <AlertTriangle className="w-8 h-8 text-white" />
                  </motion.div>
                  
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Sesión Por Expirar
                  </h2>
                  
                  <p className="text-gray-600 text-sm">
                    Tu sesión expirará por inactividad
                  </p>
                </div>

                {/* Countdown Display */}
                <div className="text-center mb-6">
                  <div className={`text-4xl font-mono font-bold mb-2 ${getUrgencyColor(countdown)}`}>
                    {formatTime(countdown)}
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <motion.div
                      className={`h-2 rounded-full transition-all duration-1000 ${
                        countdown < 60000 
                          ? 'bg-red-500' 
                          : countdown < 180000 
                          ? 'bg-orange-500' 
                          : 'bg-yellow-500'
                      }`}
                      style={{ width: `${getProgressWidth(countdown)}%` }}
                      animate={{ 
                        width: `${getProgressWidth(countdown)}%`,
                        scale: countdown < 60000 ? [1, 1.02, 1] : 1
                      }}
                      transition={{ 
                        scale: { 
                          duration: 0.5, 
                          repeat: countdown < 60000 ? Infinity : 0 
                        }
                      }}
                    />
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    minutos restantes
                  </p>
                </div>

                {/* Warning Message */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-center">
                  <Clock className="w-5 h-5 text-yellow-600 mx-auto mb-2" />
                  <p className="text-sm text-yellow-800">
                    <strong>¿Sigues ahí?</strong><br />
                    Tu sesión se cerrará automáticamente por seguridad.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button 
                    onClick={onExtendSession}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    size="lg"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Continuar Sesión
                  </Button>
                  
                  <Button 
                    onClick={onLogout}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar Sesión
                  </Button>
                </div>

                {/* Footer Info */}
                <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                  <p className="text-xs text-gray-500">
                    Las sesiones expiran después de 30 minutos de inactividad por seguridad.
                  </p>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}