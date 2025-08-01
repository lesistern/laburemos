'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// Interfaz para emoji OpenMoji
interface OpenMojiEmoji {
  id: string
  name: string
  category: string
  url: string
  unicode: string
}

// Configuración de categorías con íconos representativos
const emojiCategories = {
  frequent: {
    name: 'Frecuentes',
    icon: '⭐',
    loadFromApi: false,
    emojis: [
      '😀', '😂', '😊', '😍', '🥰', '😘', '😉', '😎', '🤔', '😅',
      '👍', '👏', '🙌', '👋', '🤝', '💪', '❤️', '💯', '🔥', '✨',
      '🎉', '🚀', '💡', '⚡', '🌟', '🎯', '✅', '❌', '⏰', '📱'
    ]
  },
  people: {
    name: 'Personas y Emociones',
    icon: '😀',
    loadFromApi: true,
    apiCategory: 'people'
  },
  nature: {
    name: 'Naturaleza y Animales',
    icon: '🐶',
    loadFromApi: true,
    apiCategory: 'nature'
  },
  food: {
    name: 'Comida y Bebidas',
    icon: '🍎',
    loadFromApi: true,
    apiCategory: 'food'
  },
  activities: {
    name: 'Actividades y Deportes',
    icon: '⚽',
    loadFromApi: true,
    apiCategory: 'activities'
  },
  travel: {
    name: 'Viajes y Lugares',
    icon: '✈️',
    loadFromApi: true,
    apiCategory: 'travel'
  },
  objects: {
    name: 'Objetos y Símbolos',
    icon: '⌚',
    loadFromApi: true,
    apiCategory: 'objects'
  },
  symbols: {
    name: 'Símbolos',
    icon: '❤️',
    loadFromApi: true,
    apiCategory: 'symbols'
  }
}

interface EmojiPickerProps {
  isOpen: boolean
  onClose: () => void
  onEmojiSelect: (emoji: string) => void
  className?: string
}

export function EmojiPicker({
  isOpen,
  onClose,
  onEmojiSelect,
  className
}: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState('frequent')
  const [searchQuery, setSearchQuery] = useState('')
  const [loadedEmojis, setLoadedEmojis] = useState<{ [key: string]: OpenMojiEmoji[] }>({})
  const [loading, setLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<OpenMojiEmoji[]>([])
  const pickerRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  // Cargar emojis de una categoría
  const loadCategoryEmojis = async (categoryKey: string) => {
    const category = emojiCategories[categoryKey as keyof typeof emojiCategories]
    
    if (!category.loadFromApi || loadedEmojis[categoryKey]) {
      return
    }

    setLoading(true)
    try {
      // Import API client dynamically
      const { apiClient } = await import('@/lib/api')
      
      // Try to load emojis from the API
      const result = await apiClient.getEmojis({
        action: 'category',
        category: category.apiCategory,
        limit: 50
      })
      
      if (result.success && result.data?.emojis) {
        setLoadedEmojis(prev => ({
          ...prev,
          [categoryKey]: result.data.emojis
        }))
      } else {
        console.warn(`Error desde API: ${result.error || 'Unknown error'}`)
        // Fallback a emojis populares
        loadFallbackEmojis(categoryKey)
      }
    } catch (error) {
      console.error(`Error cargando emojis de ${categoryKey}:`, error)
      loadFallbackEmojis(categoryKey)
    } finally {
      setLoading(false)
    }
  }

  // Fallback para cuando no se pueden cargar emojis OpenMoji
  const loadFallbackEmojis = (categoryKey: string) => {
    const fallbackEmojis = {
      people: ['😀', '😂', '😊', '😍', '🥰', '😘', '😉', '😎', '🤔', '😅', '👍', '👏', '🙌', '👋', '🤝', '💪'],
      nature: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈'],
      food: ['🍎', '🍏', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝'],
      activities: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅'],
      travel: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵'],
      objects: ['📱', '💻', '⌨️', '🖥️', '🖱️', '📷', '📸', '🎥', '📺', '📻', '⌚', '⏰', '🕰️', '⏱️', '⏲️', '⌛'],
      symbols: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖']
    }

    const categoryEmojis = fallbackEmojis[categoryKey as keyof typeof fallbackEmojis] || []
    const fallbackData = categoryEmojis.map((emoji, index) => ({
      id: `fallback-${categoryKey}-${index}`,
      name: emoji,
      category: categoryKey,
      url: '',
      unicode: emoji
    }))

    setLoadedEmojis(prev => ({
      ...prev,
      [categoryKey]: fallbackData
    }))
  }

  // Cargar emojis cuando cambia la categoría activa
  useEffect(() => {
    if (isOpen && activeCategory !== 'frequent') {
      loadCategoryEmojis(activeCategory)
    }
  }, [activeCategory, isOpen])

  // Búsqueda de emojis
  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([])
      return
    }

    const results: OpenMojiEmoji[] = []
    const query = searchQuery.toLowerCase()

    // Buscar en emojis cargados
    Object.values(loadedEmojis).forEach(categoryEmojis => {
      const matches = categoryEmojis.filter(emoji => 
        emoji.name.toLowerCase().includes(query) ||
        emoji.category.toLowerCase().includes(query)
      )
      results.push(...matches)
    })

    setSearchResults(results.slice(0, 50)) // Limitar resultados
  }, [searchQuery, loadedEmojis])

  // Emoji search keywords map for better search functionality
  const emojiKeywords: { [key: string]: string[] } = {
    '😀': ['feliz', 'sonrisa', 'alegre', 'contento'],
    '😂': ['risa', 'llorar', 'gracioso', 'divertido'],
    '😍': ['amor', 'corazones', 'enamorado', 'gustar'],
    '🥰': ['amor', 'tierno', 'enamorado', 'corazones'],
    '😘': ['beso', 'guiño', 'amor', 'cariño'],
    '😉': ['guiño', 'coqueto', 'complicidad'],
    '😎': ['genial', 'cool', 'gafas', 'chévere'],
    '🤔': ['pensar', 'dudar', 'reflexionar'],
    '😅': ['risa', 'nervioso', 'sudor'],
    '👍': ['bien', 'ok', 'perfecto', 'pulgar'],
    '👏': ['aplaudir', 'bravo', 'felicitar'],
    '🙌': ['celebrar', 'alegría', 'hurra'],
    '👋': ['hola', 'saludar', 'despedir'],
    '🤝': ['acuerdo', 'trato', 'manos'],
    '💪': ['fuerza', 'músculo', 'poder'],
    '❤️': ['amor', 'corazón', 'querer'],
    '💯': ['cien', 'perfecto', 'excelente'],
    '🔥': ['fuego', 'genial', 'increíble'],
    '✨': ['brillar', 'especial', 'magia'],
    '🎉': ['fiesta', 'celebrar', 'party'],
    '🚀': ['cohete', 'rápido', 'éxito'],
    '💡': ['idea', 'bombilla', 'innovar'],
    '⚡': ['rayo', 'energía', 'rápido'],
    '🌟': ['estrella', 'especial', 'brillar'],
    '🎯': ['objetivo', 'meta', 'diana'],
    '✅': ['correcto', 'hecho', 'bien'],
    '❌': ['mal', 'error', 'no'],
    '⏰': ['tiempo', 'hora', 'reloj'],
    '📱': ['teléfono', 'celular', 'móvil']
  }

  // Obtener emojis para mostrar
  const getDisplayEmojis = () => {
    if (searchQuery) {
      return searchResults
    }

    const category = emojiCategories[activeCategory as keyof typeof emojiCategories]
    
    if (category.loadFromApi) {
      return loadedEmojis[activeCategory] || []
    }
    
    // Para categoría "frequent", convertir strings a objetos OpenMojiEmoji
    return (category.emojis || []).map((emoji, index) => ({
      id: `freq-${index}`,
      name: emoji,
      category: 'frequent',
      url: '',
      unicode: emoji
    }))
  }

  const displayEmojis = getDisplayEmojis()

  const handleEmojiClick = (emoji: OpenMojiEmoji | string) => {
    const emojiValue = typeof emoji === 'string' ? emoji : emoji.unicode
    onEmojiSelect(emojiValue)
    onClose()
  }

  // Componente para renderizar emoji individual
  const EmojiItem = ({ emoji }: { emoji: OpenMojiEmoji }) => {
    const [imageError, setImageError] = useState(false)
    
    return (
      <button
        onClick={() => handleEmojiClick(emoji)}
        className="w-8 h-8 rounded-md hover:bg-blue-50 flex items-center justify-center text-lg transition-all duration-150 hover:scale-110"
        title={emoji.name}
      >
        {emoji.url && !imageError ? (
          <img
            src={emoji.url}
            alt={emoji.name}
            className="w-6 h-6"
            onError={() => setImageError(true)}
          />
        ) : (
          <span>{emoji.unicode}</span>
        )}
      </button>
    )
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={pickerRef}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.15 }}
          className={cn(
            "absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-xl border z-50",
            "w-80 h-96 overflow-hidden border-gray-200",
            className
          )}
        >
          {/* Header with search */}
          <div className="p-3 border-b bg-gray-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar emojis..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-8 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex h-full">
            {/* Categories sidebar */}
            {!searchQuery && (
              <div className="w-12 bg-gray-50 border-r flex flex-col py-2">
                {Object.entries(emojiCategories).map(([key, category]) => (
                  <button
                    key={key}
                    onClick={() => setActiveCategory(key)}
                    className={cn(
                      "w-8 h-8 mx-auto mb-1 rounded-md flex items-center justify-center text-lg transition-colors",
                      activeCategory === key
                        ? "bg-blue-100 shadow-sm"
                        : "hover:bg-gray-200"
                    )}
                    title={category.name}
                  >
                    {category.icon}
                  </button>
                ))}
              </div>
            )}

            {/* Emojis grid */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-2">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    <span className="ml-2 text-sm text-gray-500">Cargando emojis...</span>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-8 gap-1">
                      {displayEmojis.map((emoji, index) => (
                        <EmojiItem key={`${emoji.id}-${index}`} emoji={emoji} />
                      ))}
                    </div>
                    
                    {searchQuery && displayEmojis.length === 0 && !loading && (
                      <div className="text-center py-8 text-gray-500">
                        <p>No se encontraron emojis</p>
                        <p className="text-sm mt-1">Prueba con otros términos</p>
                      </div>
                    )}

                    {!searchQuery && displayEmojis.length === 0 && !loading && (
                      <div className="text-center py-8 text-gray-500">
                        <p>No hay emojis disponibles</p>
                        <p className="text-sm mt-1">Intenta con otra categoría</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}