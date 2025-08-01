'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Badge } from '@/types'

interface BadgeDisplayProps {
  badge: Badge
  size?: 'sm' | 'md' | 'lg'
  showTooltip?: boolean
}

const rarityConfig = {
  common: {
    border: 'border-gray-300',
    bg: 'bg-gray-100',
    glow: '',
    animation: '',
  },
  rare: {
    border: 'border-blue-400',
    bg: 'bg-blue-50',
    glow: 'shadow-lg shadow-blue-200/50',
    animation: 'hover:scale-105',
  },
  epic: {
    border: 'border-purple-400',
    bg: 'bg-purple-50',
    glow: 'shadow-lg shadow-purple-200/50',
    animation: 'hover:scale-105 hover:rotate-1',
  },
  legendary: {
    border: 'border-yellow-400',
    bg: 'bg-yellow-50',
    glow: 'shadow-xl shadow-yellow-200/60',
    animation: 'hover:scale-110 hover:-rotate-1',
  },
  exclusive: {
    border: 'border-pink-400',
    bg: 'bg-gradient-to-br from-pink-50 to-purple-50',
    glow: 'shadow-xl shadow-pink-200/70',
    animation: 'hover:scale-110 hover:rotate-2',
  },
}

const sizeConfig = {
  sm: {
    container: 'w-12 h-12',
    image: 'w-8 h-8',
    text: 'text-xs',
  },
  md: {
    container: 'w-16 h-16',
    image: 'w-12 h-12',
    text: 'text-sm',
  },
  lg: {
    container: 'w-20 h-20',
    image: 'w-16 h-16',
    text: 'text-base',
  },
}

export function BadgeDisplay({ 
  badge, 
  size = 'md', 
  showTooltip = true 
}: BadgeDisplayProps) {
  const rarity = rarityConfig[badge.rarity]
  const sizeStyles = sizeConfig[size]

  const badgeElement = (
    <motion.div
      className={`
        relative ${sizeStyles.container} rounded-full 
        border-2 ${rarity.border} ${rarity.bg} ${rarity.glow}
        flex items-center justify-center cursor-pointer
        transition-all duration-300 ease-out
        ${rarity.animation}
      `}
      whileHover={{ 
        scale: badge.rarity === 'legendary' || badge.rarity === 'exclusive' ? 1.15 : 1.08,
        rotate: badge.rarity === 'exclusive' ? 5 : badge.rarity === 'legendary' ? -3 : 0
      }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Animated background for legendary and exclusive */}
      {(badge.rarity === 'legendary' || badge.rarity === 'exclusive') && (
        <motion.div
          className="absolute inset-0 rounded-full opacity-20"
          style={{
            background: badge.rarity === 'legendary' 
              ? 'conic-gradient(from 0deg, #fbbf24, #f59e0b, #d97706, #fbbf24)'
              : 'conic-gradient(from 0deg, #ec4899, #8b5cf6, #3b82f6, #ec4899)'
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
      )}
      
      {/* Badge image */}
      <img
        src={badge.icon}
        alt={badge.name}
        className={`${sizeStyles.image} object-contain relative z-10`}
      />
      
      {/* Sparkle effect for rare and above */}
      {badge.rarity !== 'common' && (
        <>
          <motion.div
            className="absolute top-0 right-0 w-2 h-2 bg-yellow-300 rounded-full"
            animate={{
              opacity: [0, 1, 0],
              scale: [0.5, 1.2, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: 0,
            }}
          />
          <motion.div
            className="absolute bottom-1 left-0 w-1.5 h-1.5 bg-blue-300 rounded-full"
            animate={{
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              delay: 0.6,
            }}
          />
          <motion.div
            className="absolute top-2 left-1 w-1 h-1 bg-purple-300 rounded-full"
            animate={{
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              delay: 1.2,
            }}
          />
          {(badge.rarity === 'legendary' || badge.rarity === 'exclusive') && (
            <motion.div
              className="absolute bottom-0 right-1 w-1.5 h-1.5 bg-pink-300 rounded-full"
              animate={{
                opacity: [0, 1, 0],
                scale: [0.5, 1.3, 0.5],
              }}
              transition={{
                duration: 1.3,
                repeat: Infinity,
                delay: 0.3,
              }}
            />
          )}
        </>
      )}
    </motion.div>
  )

  if (!showTooltip) {
    return badgeElement
  }

  return (
    <div className="relative group">
      {badgeElement}
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
        <div className="bg-black text-white text-sm rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
          <div className="font-semibold">{badge.name}</div>
          <div className="text-xs text-gray-300 capitalize">{badge.rarity}</div>
          <div className="text-xs mt-1">{badge.description}</div>
          
          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2">
            <div className="border-4 border-transparent border-t-black"></div>
          </div>
        </div>
      </div>
    </div>
  )
}