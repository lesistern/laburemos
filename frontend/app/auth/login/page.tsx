'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Eye, EyeOff, LogIn, ArrowLeft, Shield, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuthStore } from '@/stores/auth-store'
import { shouldUseMockAuth } from '@/lib/mock-auth'
import Link from 'next/link'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const { loginWithCredentials, isLoading, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const redirect = searchParams.get('redirect') || '/dashboard'
  const message = searchParams.get('message')

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(redirect)
    }
  }, [isAuthenticated, router, redirect])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Por favor ingresa tu email y contraseña')
      return
    }

    try {
      const success = await loginWithCredentials(email, password)
      if (success) {
        router.replace(redirect)
      } else {
        setError('Email o contraseña incorrectos')
      }
    } catch (error) {
      setError('Error al iniciar sesión. Intenta nuevamente.')
    }
  }

  const getMessageText = (messageType: string | null) => {
    switch (messageType) {
      case 'admin_access_required':
        return {
          text: 'Necesitas permisos de administrador para acceder a esta sección.',
          type: 'warning' as const
        }
      case 'session_expired':
        return {
          text: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.',
          type: 'info' as const
        }
      default:
        return null
    }
  }

  const messageInfo = getMessageText(message)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-laburar-sky-blue-500 to-laburar-sky-blue-600 rounded-full flex items-center justify-center shadow-lg"
          >
            {redirect === '/admin' ? (
              <Shield className="w-8 h-8 text-white" />
            ) : (
              <LogIn className="w-8 h-8 text-white" />
            )}
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-900">
            {redirect === '/admin' ? 'Acceso Administrativo' : 'Iniciar Sesión'}
          </h1>
          <p className="text-gray-600 mt-2">
            {redirect === '/admin' 
              ? 'Ingresa tus credenciales de administrador'
              : 'Bienvenido de vuelta a LaburAR'
            }
          </p>
        </div>

        {/* Message Alert */}
        {messageInfo && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <Alert variant={messageInfo.type === 'warning' ? 'destructive' : 'default'}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{messageInfo.text}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Login Form */}
        <Card className="p-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="transition-all duration-200"
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contraseña"
                  className="pr-12 transition-all duration-200"
                  disabled={isLoading}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              size="lg"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Iniciando sesión...
                </div>
              ) : (
                <div className="flex items-center">
                  <LogIn className="w-4 h-4 mr-2" />
                  Iniciar Sesión
                </div>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <Link 
                href="/auth/forgot-password" 
                className="text-laburar-sky-blue-600 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
              <Link 
                href="/auth/register" 
                className="text-laburar-sky-blue-600 hover:underline"
              >
                Crear cuenta
              </Link>
            </div>
          </div>
        </Card>

        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 text-center"
        >
          <Button variant="ghost" asChild>
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al inicio
            </Link>
          </Button>
        </motion.div>

        {/* Admin Login Info */}
        {redirect === '/admin' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200"
          >
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-1">
                  Acceso Administrativo Requerido
                </p>
                <p className="text-blue-700">
                  Solo usuarios con roles de <strong>Administrador</strong>, <strong>Moderador</strong> o <strong>Super Administrador</strong> pueden acceder al panel de administración.
                </p>
              </div>
            </div>
          </motion.div>
        )}

      </motion.div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
      <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
    </div>}>
      <LoginForm />
    </Suspense>
  )
}