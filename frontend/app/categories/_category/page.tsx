'use client'

import React from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { getCategoryBySlug, getSubcategoryDetails } from '@/lib/categories-data'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'

export default function CategoryPage() {
  const params = useParams()
  const categorySlug = params.category as string
  const category = getCategoryBySlug(categorySlug)
  const subcategoryDetails = getSubcategoryDetails()

  if (!category) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 py-8">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Categoría no encontrada</h1>
            <Link href="/categories">
              <Button variant="outline">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Volver a categorías
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-gray-600 mb-8">
            <Link href="/" className="hover:text-gray-900">Inicio</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/categories" className="hover:text-gray-900">Categorías</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">{category.name}</span>
          </nav>

          {/* Category Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <div className="flex items-center gap-4 mb-4">
              <span className="text-4xl md:text-5xl">{category.emoji}</span>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{category.name}</h1>
            </div>
            <p className="text-lg md:text-xl text-gray-600">
              Explora todos los servicios disponibles en {category.name.toLowerCase()}
            </p>
          </motion.div>

          {/* Subcategories Grid - Diseño compacto similar a /categories */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {category.subcategories.map((subcategory, index) => {
              const details = subcategoryDetails[subcategory.slug]
              
              return (
                <motion.div
                  key={subcategory.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                >
                  <Link href={`/categories/${category.slug}/${subcategory.slug}`}>
                    <div className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden h-56 flex flex-col group cursor-pointer">
                      {/* Header con gradiente */}
                      <div className="h-20 bg-gradient-to-br from-blue-50 to-blue-100 relative p-3 flex items-center justify-center">
                        <div className="absolute top-2 right-2">
                          <ChevronRight className="w-4 h-4 text-blue-600 group-hover:text-blue-800 transition-colors" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-center line-clamp-2 leading-tight">
                          {subcategory.name}
                        </h3>
                      </div>
                      
                      {/* Content - Servicios compactos */}
                      <div className="p-3 flex-1 flex flex-col">
                        {details?.services && (
                          <div className="space-y-1 flex-1">
                            {details.services.slice(0, 4).map((service: string, idx: number) => (
                              <div key={idx} className="text-xs text-gray-600 flex items-start gap-1.5 leading-tight">
                                <div className="w-1 h-1 bg-gray-400 rounded-full mt-1.5 flex-shrink-0" />
                                <span className="truncate">{service}</span>
                              </div>
                            ))}
                            {details.services.length > 4 && (
                              <div className="text-xs text-blue-600 font-medium pt-1">
                                +{details.services.length - 4} más
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Footer */}
                        <div className="pt-2 mt-auto">
                          <div className="text-xs text-blue-600 font-medium group-hover:text-blue-700 transition-colors">
                            Ver servicios →
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>

          {/* Popular Services Section */}
          {/* Servicios populares - Más compacto */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-12"
          >
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              Servicios populares en {category.name}
            </h2>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex flex-wrap gap-2">
                {category.subcategories.slice(0, 8).map((subcategory) => (
                  <Link
                    key={subcategory.id}
                    href={`/categories/${category.slug}/${subcategory.slug}`}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 rounded-full text-xs md:text-sm font-medium transition-colors"
                  >
                    {subcategory.name}
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  )
}