'use client'

import { useState, useEffect } from 'react'
import { getOrGenerateFingerprint } from '@/lib/device-fingerprint'

interface NdaCheckResult {
  hasAccepted: boolean
  data?: {
    id: number
    email: string
    acceptedAt: string
    ndaVersion: string
  }
}

interface NdaAcceptanceData {
  email: string
  deviceFingerprint: string
}

interface UseNdaCheckReturn {
  shouldShowPopup: boolean
  isLoading: boolean
  isAccepting: boolean
  error: string | null
  acceptNda: (email: string) => Promise<void>
  skipNda: () => void
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export function useNdaCheck(): UseNdaCheckReturn {
  const [shouldShowPopup, setShouldShowPopup] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isAccepting, setIsAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deviceFingerprint, setDeviceFingerprint] = useState<string>('')

  useEffect(() => {
    checkNdaStatus()
  }, [])

  const checkNdaStatus = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Generar device fingerprint
      const fingerprint = getOrGenerateFingerprint()
      setDeviceFingerprint(fingerprint)

      // Verificar si ya aceptó el NDA
      const response = await fetch(`${API_BASE_URL}/nda/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceFingerprint: fingerprint,
          ipAddress: 'auto' // El backend detecta la IP automáticamente
        })
      })

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
      }

      const result: NdaCheckResult = await response.json()
      
      // Si no ha aceptado el NDA, mostrar popup
      setShouldShowPopup(!result.hasAccepted)

      console.log('NDA Check Result:', {
        hasAccepted: result.hasAccepted,
        deviceFingerprint: fingerprint,
        shouldShow: !result.hasAccepted
      })

    } catch (error) {
      console.error('Error verificando NDA:', error)
      setError('Error al verificar el estado del NDA')
      // En caso de error, mostrar el popup por seguridad
      setShouldShowPopup(true)
    } finally {
      setIsLoading(false)
    }
  }

  const acceptNda = async (email: string) => {
    try {
      setIsAccepting(true)
      setError(null)

      const acceptanceData: NdaAcceptanceData = {
        email: email.trim(),
        deviceFingerprint,
        ipAddress: 'auto',
      }

      const response = await fetch(`${API_BASE_URL}/nda/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(acceptanceData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        if (response.status === 409) {
          // NDA ya aceptado, ocultar popup
          setShouldShowPopup(false)
          return
        }
        
        throw new Error(errorData.message || `Error HTTP: ${response.status}`)
      }

      const result = await response.json()
      
      console.log('NDA Aceptado:', result)
      
      // Ocultar popup después de aceptación exitosa
      setShouldShowPopup(false)

      // Opcional: Mostrar mensaje de éxito
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('nda_accepted_at', new Date().toISOString())
      }

    } catch (error) {
      console.error('Error aceptando NDA:', error)
      const message = error instanceof Error ? error.message : 'Error desconocido'
      setError(`Error al aceptar NDA: ${message}`)
      throw error // Re-throw para que el componente pueda manejarlo
    } finally {
      setIsAccepting(false)
    }
  }

  const skipNda = () => {
    // Función para omitir el NDA (solo para desarrollo/testing)
    setShouldShowPopup(false)
    console.warn('NDA omitido - Solo para desarrollo')
  }

  return {
    shouldShowPopup,
    isLoading,
    isAccepting,
    error,
    acceptNda,
    skipNda
  }
}