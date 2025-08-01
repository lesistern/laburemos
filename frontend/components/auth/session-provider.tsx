'use client'

import React, { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { sessionManager } from '@/lib/session-manager'
import { SessionTimeoutDialog } from './session-timeout-dialog'

interface SessionProviderProps {
  children: React.ReactNode
}

export function SessionProvider({ children }: SessionProviderProps) {
  const { 
    isAuthenticated, 
    sessionWarningShown, 
    extendSession, 
    logoutDueToTimeout 
  } = useAuthStore()

  useEffect(() => {
    // Only start session monitoring if user is authenticated
    if (isAuthenticated) {
      sessionManager.startSession()
    }

    return () => {
      sessionManager.stopSession()
    }
  }, [isAuthenticated])

  const handleExtendSession = () => {
    extendSession()
  }

  const handleLogout = () => {
    logoutDueToTimeout()
  }

  return (
    <>
      {children}
      
      {/* Session Timeout Dialog */}
      <SessionTimeoutDialog
        isOpen={sessionWarningShown}
        timeRemaining={sessionManager.getTimeUntilExpiry()}
        onExtendSession={handleExtendSession}
        onLogout={handleLogout}
      />
    </>
  )
}