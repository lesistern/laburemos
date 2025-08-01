'use client'

import React from 'react'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth-store'
import { useToast } from '@/hooks/use-toast'
import {
  User,
  Settings,
  Briefcase,
  MessageSquare,
  Wallet,
  LogOut,
  Shield,
} from 'lucide-react'
import { ROUTES } from '@/lib/constants'
import { getInitials } from '@/lib/utils'
import type { User as UserType } from '@/types'

interface UserMenuProps {
  user: UserType | null
}

export function UserMenu({ user }: UserMenuProps) {
  const { logout } = useAuthStore()
  const { toast } = useToast()

  const handleLogout = () => {
    logout()
    toast({
      title: 'Sesión cerrada',
      description: 'Has cerrado sesión correctamente.',
      variant: 'default',
    })
  }

  if (!user) return null

  const userInitials = getInitials(`${user.firstName} ${user.lastName}`)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={`${user.firstName} ${user.lastName}`}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-laburar-sky-blue-500 to-laburar-sky-blue-600 text-white font-medium">
              {userInitials}
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <Link href={ROUTES.PROFILE} className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Mi Perfil</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link href={ROUTES.DASHBOARD} className="cursor-pointer">
            <Shield className="mr-2 h-4 w-4" />
            <span>Panel</span>
          </Link>
        </DropdownMenuItem>
        
        {user.role === 'freelancer' && (
          <DropdownMenuItem asChild>
            <Link href={ROUTES.SERVICES} className="cursor-pointer">
              <Briefcase className="mr-2 h-4 w-4" />
              <span>Mis Servicios</span>
            </Link>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem asChild>
          <Link href={ROUTES.PROJECTS} className="cursor-pointer">
            <Briefcase className="mr-2 h-4 w-4" />
            <span>Proyectos</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link href={ROUTES.MESSAGES} className="cursor-pointer">
            <MessageSquare className="mr-2 h-4 w-4" />
            <span>Mensajes</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link href={ROUTES.WALLET} className="cursor-pointer">
            <Wallet className="mr-2 h-4 w-4" />
            <span>Billetera</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <Link href={ROUTES.SETTINGS} className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Configuración</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar Sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}