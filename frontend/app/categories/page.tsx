'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { MAIN_CATEGORIES } from '@/lib/categories-data'
import { ChevronRight } from 'lucide-react'

export default function CategoriesPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Explora todas las categorías
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Encuentra el servicio perfecto explorando nuestras categorías especializadas
            </p>
          </motion.div>

          {/* Categories Grid - Boxes más pequeños con 4 columnas */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {MAIN_CATEGORIES.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link href={`/categories/${category.slug}`}>
                  <div className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden h-64 flex flex-col group cursor-pointer">
                    {/* Background Image Header con aspect ratio 16:9 */}
                    <div 
                      className="h-28 bg-cover bg-center relative" 
                      style={{ 
                        backgroundImage: `url(${category.bgImage})`,
                        aspectRatio: '16/9'
                      }}
                    >
                      <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-20 transition-all duration-300" />
                      <div className="absolute top-2 left-2 p-1.5 bg-white bg-opacity-90 rounded-md">
                        <span className="text-lg">{category.emoji}</span>
                      </div>
                      <div className="absolute top-2 right-2">
                        <ChevronRight className="w-4 h-4 text-white group-hover:text-blue-400 transition-colors" />
                      </div>
                    </div>

                    {/* Content - Más compacto */}
                    <div className="p-3 flex-1 flex flex-col">
                      <h2 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2 line-clamp-2">
                        {category.name}
                      </h2>

                      {/* Subcategories Preview - Solo 2 */}
                      <div className="space-y-1 flex-1">
                        {category.subcategories.slice(0, 2).map((subcategory) => (
                          <div
                            key={subcategory.id}
                            className="text-xs text-gray-600 hover:text-gray-900 transition-colors truncate"
                          >
                            {subcategory.name}
                          </div>
                        ))}
                        {category.subcategories.length > 2 && (
                          <div className="text-xs text-blue-600 font-medium">
                            +{category.subcategories.length - 2} más
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Hover Effect */}
                    <div className="absolute inset-0 bg-blue-500 bg-opacity-0 group-hover:bg-opacity-5 transition-all duration-300 pointer-events-none" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}