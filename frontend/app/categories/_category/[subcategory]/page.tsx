'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { MotionCard } from '@/components/ui/card'
import { getCategoryBySlug, getSubcategoryBySlugs, getSubcategoryDetails } from '@/lib/categories-data'
import { ChevronLeft, ChevronRight, Search, Filter, Star, Clock, MapPin } from 'lucide-react'

// Mock services for demonstration
const mockServices = [
  {
    id: 1,
    title: 'Diseño profesional de logo y branding',
    description: 'Crearé un logo único y memorable para tu marca con manual de identidad',
    freelancer: {
      name: 'Ana Martínez',
      rating: 4.9,
      reviews: 156,
      location: 'Buenos Aires',
    },
    price: { from: 15000, to: 50000 },
    deliveryTime: 3,
    image: null,
  },
  {
    id: 2,
    title: 'Rediseño completo de marca empresarial',
    description: 'Renovación total de tu identidad corporativa con estrategia de marca',
    freelancer: {
      name: 'Carlos Ruiz',
      rating: 5.0,
      reviews: 89,
      location: 'Córdoba',
    },
    price: { from: 85000, to: 150000 },
    deliveryTime: 7,
    image: null,
  },
  {
    id: 3,
    title: 'Logo minimalista y moderno',
    description: 'Diseño de logo simple pero efectivo siguiendo las últimas tendencias',
    freelancer: {
      name: 'Lucía Fernández',
      rating: 4.8,
      reviews: 234,
      location: 'Rosario',
    },
    price: { from: 8000, to: 25000 },
    deliveryTime: 2,
    image: null,
  },
]

export default function SubcategoryPage() {
  const params = useParams()
  const categorySlug = params.category as string
  const subcategorySlug = params.subcategory as string
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('relevance')

  const category = getCategoryBySlug(categorySlug)
  const subcategory = getSubcategoryBySlugs(categorySlug, subcategorySlug)
  const subcategoryDetails = getSubcategoryDetails()[subcategorySlug]

  if (!category || !subcategory) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 py-12">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Subcategoría no encontrada</h1>
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle search
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-gray-600 mb-8">
            <Link href="/" className="hover:text-gray-900">Inicio</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/categories" className="hover:text-gray-900">Categorías</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href={`/categories/${category.slug}`} className="hover:text-gray-900">{category.name}</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">{subcategory.name}</span>
          </nav>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{subcategory.name}</h1>
            <p className="text-xl text-gray-600 mb-6">
              Encuentra los mejores freelancers especializados en {subcategory.name.toLowerCase()}
            </p>

            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <form onSubmit={handleSearch} className="mb-4">
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder={`Buscar servicios de ${subcategory.name.toLowerCase()}...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <Button type="submit">Buscar</Button>
                </div>
              </form>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filtros
                  </Button>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-1 border rounded-md text-sm"
                  >
                    <option value="relevance">Más relevantes</option>
                    <option value="price-low">Precio: menor a mayor</option>
                    <option value="price-high">Precio: mayor a menor</option>
                    <option value="rating">Mejor calificados</option>
                  </select>
                </div>
                <span className="text-sm text-gray-600">
                  {mockServices.length} servicios encontrados
                </span>
              </div>
            </div>
          </motion.div>

          {/* Services Available */}
          {subcategoryDetails?.services && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-8"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Servicios disponibles</h2>
              <div className="flex flex-wrap gap-2">
                {subcategoryDetails.services.map((service: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 cursor-pointer transition-colors"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Services Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockServices.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + index * 0.05 }}
              >
                <MotionCard className="h-full hover:shadow-lg transition-shadow">
                  {/* Service Image */}
                  <div className="h-48 bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center">
                    <span className="text-5xl">{category.emoji}</span>
                  </div>

                  {/* Service Content */}
                  <div className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {service.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {service.description}
                    </p>

                    {/* Freelancer Info */}
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center text-white font-semibold">
                        {service.freelancer.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{service.freelancer.name}</div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span>{service.freelancer.rating}</span>
                            <span>({service.freelancer.reviews})</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{service.freelancer.location}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Price and Delivery */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-600">Desde</div>
                        <div className="font-bold text-gray-900">
                          ${service.price.from.toLocaleString('es-AR')}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{service.deliveryTime} días</span>
                      </div>
                    </div>
                  </div>
                </MotionCard>
              </motion.div>
            ))}
          </div>

          {/* Load More */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mt-12"
          >
            <Button variant="outline" size="lg">
              Cargar más servicios
            </Button>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  )
}