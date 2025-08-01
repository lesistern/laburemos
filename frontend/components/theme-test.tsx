'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeTest() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-white dark:bg-gray-800 border rounded-lg shadow-lg">
      <p className="text-sm mb-2">Current theme: {theme}</p>
      <div className="flex gap-2">
        <button 
          onClick={() => setTheme('light')}
          className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded"
        >
          Light
        </button>
        <button 
          onClick={() => setTheme('dark')}
          className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded"
        >
          Dark
        </button>
        <button 
          onClick={() => setTheme('system')}
          className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded"
        >
          System
        </button>
      </div>
    </div>
  )
}