'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/auth-store'
import { useToast } from '@/hooks/use-toast'
import { Eye, EyeOff, Mail, Lock, User, Users } from 'lucide-react'
import { motion } from 'framer-motion'

const registerSchema = z.object({
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z.string().email('Ingresa un email válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string(),
  role: z.enum(['freelancer', 'client']),
  terms: z.boolean().refine((val) => val === true, {
    message: 'Debes aceptar los términos y condiciones',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

type RegisterFormData = z.infer<typeof registerSchema>

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuthStore()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'freelancer',
    },
  })

  const watchedRole = watch('role')

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    
    try {
      const response = await fetch(`http://localhost:3001/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          userType: data.role.toUpperCase(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Use the error message from backend if available
        throw new Error(result.message || 'Error en el registro. Por favor, inténtelo de nuevo.');
      }

      // Assuming the backend returns { data: { user, accessToken, refreshToken } }
      // and the login store function expects (user, token)
      if (result.data && result.data.user && result.data.accessToken) {
        login(result.data.user, result.data.accessToken);
        
        toast({
          title: '¡Cuenta creada!',
          description: 'Tu cuenta ha sido creada exitosamente. ¡Bienvenido a LaburAR!',
          variant: 'success',
        });
      } else {
        throw new Error('Respuesta inesperada del servidor.');
      }
    } catch (error: any) {
      toast({
        title: 'Error de Registro',
        description: error.message || 'No se pudo crear la cuenta. Inténtalo nuevamente.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
    >
      {/* Role Selection */}
      <div className="space-y-2">
        <Label>Tipo de cuenta</Label>
        <div className="grid grid-cols-2 gap-4">
          <label className={`relative flex cursor-pointer items-center space-x-3 rounded-lg border p-4 transition-all hover:bg-accent ${watchedRole === 'freelancer' ? 'border-primary bg-primary/5' : 'border-border'}`}>
            <input
              type="radio"
              value="freelancer"
              className="sr-only"
              {...register('role')}
            />
            <div className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${watchedRole === 'freelancer' ? 'border-primary' : 'border-muted-foreground'}`}>
              {watchedRole === 'freelancer' && (
                <div className="h-2 w-2 rounded-full bg-primary" />
              )}
            </div>
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <div>
                <p className="text-sm font-medium">Freelancer</p>
                <p className="text-xs text-muted-foreground">Ofrece servicios</p>
              </div>
            </div>
          </label>
          
          <label className={`relative flex cursor-pointer items-center space-x-3 rounded-lg border p-4 transition-all hover:bg-accent ${watchedRole === 'client' ? 'border-primary bg-primary/5' : 'border-border'}`}>
            <input
              type="radio"
              value="client"
              className="sr-only"
              {...register('role')}
            />
            <div className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${watchedRole === 'client' ? 'border-primary' : 'border-muted-foreground'}`}>
              {watchedRole === 'client' && (
                <div className="h-2 w-2 rounded-full bg-primary" />
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <div>
                <p className="text-sm font-medium">Cliente</p>
                <p className="text-xs text-muted-foreground">Contrata servicios</p>
              </div>
            </div>
          </label>
        </div>
        {errors.role && (
          <p className="text-sm text-destructive">{errors.role.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* First Name */}
        <div className="space-y-2">
          <Label htmlFor="firstName">Nombre</Label>
          <Input
            id="firstName"
            placeholder="Tu nombre"
            error={!!errors.firstName}
            {...register('firstName')}
          />
          {errors.firstName && (
            <p className="text-sm text-destructive">{errors.firstName.message}</p>
          )}
        </div>

        {/* Last Name */}
        <div className="space-y-2">
          <Label htmlFor="lastName">Apellido</Label>
          <Input
            id="lastName"
            placeholder="Tu apellido"
            error={!!errors.lastName}
            {...register('lastName')}
          />
          {errors.lastName && (
            <p className="text-sm text-destructive">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="tu@email.com"
            className="pl-10"
            error={!!errors.email}
            {...register('email')}
          />
        </div>
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Mínimo 6 caracteres"
            className="pl-10 pr-10"
            error={!!errors.password}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      {/* Confirm Password Field */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirma tu contraseña"
            className="pl-10 pr-10"
            error={!!errors.confirmPassword}
            {...register('confirmPassword')}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      {/* Terms Agreement */}
      <div className="space-y-2">
        <label className="flex items-start space-x-2">
          <input
            type="checkbox"
            className="mt-1 rounded border-gray-300 text-primary focus:ring-primary"
            {...register('terms')}
          />
          <span className="text-sm text-muted-foreground">
            Acepto los{' '}
            <button type="button" className="text-primary hover:underline">
              términos y condiciones
            </button>{' '}
            y la{' '}
            <button type="button" className="text-primary hover:underline">
              política de privacidad
            </button>
          </span>
        </label>
        {errors.terms && (
          <p className="text-sm text-destructive">{errors.terms.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="gradient"
        size="lg"
        className="w-full"
        loading={isLoading}
      >
        Crear Cuenta
      </Button>
    </motion.form>
  )
}