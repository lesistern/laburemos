'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Shield, AlertTriangle, LogIn, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAdminAuth } from '@/hooks/use-admin-auth'
import Link from 'next/link'

interface AdminGuardProps {
  children: React.ReactNode
  requiredRoles?: ('admin' | 'mod' | 'superadmin')[]
}

export function AdminGuard({ children, requiredRoles = ['admin', 'mod', 'superadmin'] }: AdminGuardProps) {
  const { user, isAuthenticated, hasAdminAccess, isLoading, adminRole } = useAdminAuth()

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 bg-laburar-sky-blue-100 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-laburar-sky-blue-600 animate-pulse" />
          </div>
          <p className="text-gray-600 font-medium">Verificando acceso...</p>
          <div className="w-32 h-1 bg-gray-200 rounded-full mx-auto mt-3 overflow-hidden">
            <motion.div
              className="h-full bg-laburar-sky-blue-500 rounded-full"
              animate={{ x: [-128, 128] }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      </div>
    )
  }

  // Show access denied if not authenticated or not admin
  if (!isAuthenticated || !hasAdminAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="p-8 text-center shadow-xl border-0 bg-white">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center"
            >
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Acceso Restringido
              </h1>
              
              {!isAuthenticated ? (
                <div>
                  <p className="text-gray-600 mb-6">
                    Debes iniciar sesión para acceder al panel de administración.
                  </p>
                  
                  <div className="space-y-3">
                    <Button asChild className="w-full">
                      <Link href="/auth/login?redirect=/admin">
                        <LogIn className="w-4 h-4 mr-2" />
                        Iniciar Sesión
                      </Link>
                    </Button>
                    
                    <Button variant="outline" asChild className="w-full">
                      <Link href="/">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Volver al Inicio
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 mb-2">
                    Tu cuenta no tiene permisos para acceder al panel de administración.
                  </p>
                  <p className="text-sm text-gray-500 mb-6">
                    Solo usuarios con roles de <strong>Administrador</strong>, <strong>Moderador</strong> o <strong>Super Administrador</strong> pueden acceder.
                  </p>
                  
                  <div className="space-y-3">
                    <Button variant="outline" asChild className="w-full">
                      <Link href="/dashboard">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Ir a Mi Panel
                      </Link>
                    </Button>
                    
                    <Button variant="ghost" asChild className="w-full">
                      <Link href="/">
                        Volver al Inicio
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </Card>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 text-center"
          >
            <p className="text-xs text-gray-500">
              ¿Necesitas acceso administrativo?{' '}
              <Link href="/contact" className="text-laburar-sky-blue-600 hover:underline">
                Contacta al equipo
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  // Check specific role requirements
  if (requiredRoles && adminRole && !requiredRoles.includes(adminRole)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md shadow-xl border-0 bg-white">
          <div className="w-20 h-20 mx-auto mb-6 bg-yellow-100 rounded-full flex items-center justify-center">
            <Shield className="w-10 h-10 text-yellow-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Permisos Insuficientes
          </h1>
          
          <p className="text-gray-600 mb-6">
            Tu rol actual no tiene permisos para acceder a esta sección.
          </p>
          
          <Button variant="outline" asChild>
            <Link href="/admin">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Panel Admin
            </Link>
          </Button>
        </Card>
      </div>
    )
  }

  // User has access, render children
  return <>{children}</>
}