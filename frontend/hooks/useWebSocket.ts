'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useAuthStore } from '@/stores/auth-store'

interface UseWebSocketOptions {
  onMessage?: (data: any) => void
  onConnected?: () => void
  onDisconnected?: () => void
  onError?: (error: any) => void
  autoConnect?: boolean
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { token } = useAuthStore()
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5
  const reconnectInterval = 1000

  const connect = useCallback(() => {
    if (typeof window === 'undefined') return

    try {
      const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3001'
      const url = token ? `${wsUrl}?token=${token}` : wsUrl
      
      wsRef.current = new WebSocket(url)

      wsRef.current.onopen = () => {
        console.log('WebSocket connected')
        reconnectAttemptsRef.current = 0
        options.onConnected?.()
      }

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          options.onMessage?.(data)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected')
        options.onDisconnected?.()
        
        // Auto reconnect
        if (options.autoConnect !== false && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++
          setTimeout(() => {
            console.log(`Attempting to reconnect WebSocket (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`)
            connect()
          }, reconnectInterval * reconnectAttemptsRef.current)
        }
      }

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error)
        options.onError?.(error)
      }
    } catch (error) {
      console.error('Failed to connect WebSocket:', error)
      options.onError?.(error)
    }
  }, [token, options])

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  const send = useCallback((data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    } else {
      console.warn('WebSocket is not connected')
    }
  }, [])

  const isConnected = wsRef.current?.readyState === WebSocket.OPEN

  useEffect(() => {
    if (options.autoConnect !== false) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [connect, disconnect, options.autoConnect])

  return {
    connect,
    disconnect,
    send,
    isConnected,
  }
}

// Specialized hooks for different features
export function useNotifications() {
  const onMessage = useCallback((data: any) => {
    if (data.type === 'notification') {
      // Handle notification
      console.log('New notification:', data)
      // You can dispatch to a notifications store here
    }
  }, [])

  return useWebSocket({
    onMessage,
    autoConnect: true,
  })
}

export function useChat() {
  const onMessage = useCallback((data: any) => {
    if (data.type === 'message') {
      // Handle chat message
      console.log('New chat message:', data)
      // You can dispatch to a chat store here
    }
  }, [])

  const { send, ...rest } = useWebSocket({
    onMessage,
    autoConnect: true,
  })

  const sendMessage = useCallback((message: string, conversationId: string) => {
    send({
      type: 'message',
      data: {
        message,
        conversationId,
      },
    })
  }, [send])

  return {
    ...rest,
    sendMessage,
  }
}

export function useProjectUpdates() {
  const onMessage = useCallback((data: any) => {
    if (data.type === 'project_update') {
      // Handle project update
      console.log('Project update:', data)
      // You can dispatch to a projects store here
    }
  }, [])

  return useWebSocket({
    onMessage,
    autoConnect: true,
  })
}