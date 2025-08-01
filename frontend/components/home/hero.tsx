'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalTrigger,
} from '@/components/ui/modal'
import { RegisterForm } from '@/components/auth/register-form'
import { Search, Play, Star, Users, Award, TrendingUp } from 'lucide-react'
import { ROUTES } from '@/lib/constants'

const stats = [
  {
    icon: Users,
    value: '50K+',
    label: 'Freelancers activos',
  },
  {
    icon: Award,
    value: '100K+',
    label: 'Proyectos completados',
  },
  {
    icon: Star,
    value: '4.9',
    label: 'Calificación promedio',
  },
  {
    icon: TrendingUp,
    value: '95%',
    label: 'Satisfacción del cliente',
  },
]

const videos = [
  {
    src: '/assets/img/videos/2887463-hd_1920_1080_25fps.mp4',
    credit: 'Video por ',
    author: 'Bedrijfsfilmspecialist.nl',
    url: 'https://www.pexels.com/video/a-computer-monitor-flashing-digital-information-2887463/'
  },
  {
    src: '/assets/img/videos/4463164-hd_1920_1080_25fps.mp4',
    credit: 'Video por ',
    author: 'Antoni Shkraba Studio',
    url: 'https://www.pexels.com/video/woman-painting-on-her-canvas-4463164/'
  },
  {
    src: '/assets/img/videos/5092427-hd_1920_1080_30fps.mp4',
    credit: 'Video por ',
    author: 'Gilmer Diaz Estela',
    url: 'https://www.pexels.com/video/professional-doing-video-editing-and-mixing-5092427/'
  },
  {
    src: '/assets/img/videos/6271217-hd_1920_1080_25fps.mp4',
    credit: 'Video por ',
    author: 'Ivan Samkov',
    url: 'https://www.pexels.com/video/close-up-of-dslr-camera-6271217/'
  },
]

export function Hero() {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle search logic here
    console.log('Search:', searchQuery)
  }

  const handleVideoEnd = () => {
    setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % videos.length)
  }

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load()
    }
  }, [currentVideoIndex])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          muted
          playsInline
          onEnded={handleVideoEnd}
          key={currentVideoIndex}
        >
          <source src={videos[currentVideoIndex].src} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        {/* Video overlay for better text readability */}
        <div className="absolute inset-0 bg-black/30" />
        
        {/* Gradient overlay for better visual integration */}
        <div className="absolute inset-0 bg-gradient-to-br from-laburar-sky-blue-400/25 to-laburar-sky-blue-700/35" />
        
        {/* Video indicators */}
        <div className="absolute bottom-6 left-6 flex space-x-2 z-10">
          {videos.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentVideoIndex(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentVideoIndex
                  ? 'bg-white shadow-lg'
                  : 'bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Reproducir video ${index + 1}`}
            />
          ))}
        </div>
        
        {/* Video credits */}
        <div className="absolute bottom-6 left-6 z-10 mt-3 ml-0" style={{marginTop: '2.5rem'}}>
          <div className="text-xs text-white/80 bg-black/30 backdrop-blur-sm px-2 py-1 rounded">
            {videos[currentVideoIndex].credit}
            <a 
              href={videos[currentVideoIndex].url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white/90 hover:text-white underline transition-colors"
            >
              {videos[currentVideoIndex].author}
            </a>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Title and Subtitle */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-laburar-white/95 to-laburar-sky-blue-50/90 backdrop-blur-sm border border-laburar-sky-blue-300/50 text-sm font-medium text-gray-700 mb-6 shadow-lg">
              <Star className="w-4 h-4 mr-2 text-laburar-yellow-500" />
              Plataforma #1 de Freelancers
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
              Encuentra el{' '}
              <span className="bg-gradient-to-r from-laburar-sky-blue-400 to-laburar-sky-blue-600 bg-clip-text text-transparent drop-shadow-lg">
                talento perfecto
              </span>{' '}
              para tu proyecto
            </h1>

            {/* Subtitle */}
            <p className="text-xl text-gray-100 mb-8 max-w-2xl drop-shadow-md">
              Conecta con freelancers profesionales de todo el mundo. Desde diseño web hasta marketing digital, encuentra exactamente lo que necesitas.
            </p>
          </div>
        
          {/* Right Column - Rest of Content */}
          <div className="text-center lg:text-left">

            {/* Stats - Moved above search bar with improved design */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {stats.map((stat, index) => {
                const Icon = stat.icon
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group relative bg-gradient-to-br from-laburar-white/95 to-laburar-sky-blue-50/90 backdrop-blur-md rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 border border-laburar-sky-blue-200/50 hover:border-laburar-sky-blue-400/50"
                  >
                    {/* Background decoration */}
                    <div className="absolute inset-0 bg-gradient-to-br from-laburar-sky-blue-400/10 to-laburar-yellow-400/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-center lg:justify-start mb-3">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-laburar-yellow-400 to-laburar-yellow-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="text-3xl font-bold bg-gradient-to-r from-laburar-sky-blue-600 to-laburar-sky-blue-700 bg-clip-text text-transparent">{stat.value}</div>
                      <div className="text-sm font-medium text-gray-600 mt-1">{stat.label}</div>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Search Bar */}
            <form
              onSubmit={handleSearch}
              className="flex flex-col sm:flex-row gap-4 mb-8 max-w-2xl"
            >
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar servicios (ej: diseño de logos, desarrollo web...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 text-lg border-2 border-laburar-sky-blue-200 rounded-xl bg-gradient-to-r from-laburar-white/95 to-laburar-sky-blue-50/90 backdrop-blur-sm focus:border-laburar-sky-blue-500 focus:outline-none transition-all shadow-lg text-gray-700 placeholder:text-gray-500"
                />
              </div>
              <Button
                type="submit"
                variant="gradient"
                size="lg"
                className="h-14 px-8 text-lg font-semibold"
              >
                Buscar
              </Button>
            </form>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Modal>
                <ModalTrigger asChild>
                  <Button variant="gradient" size="xl" className="group">
                    Empezar ahora
                    <TrendingUp className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </ModalTrigger>
                <ModalContent>
                  <ModalHeader>
                    <ModalTitle>Crear Cuenta</ModalTitle>
                  </ModalHeader>
                  <RegisterForm />
                </ModalContent>
              </Modal>
              
              <Button variant="outline" size="xl" className="group bg-gradient-to-r from-laburar-white/90 to-laburar-sky-blue-50/80 backdrop-blur-sm shadow-lg border-laburar-sky-blue-300/50 text-gray-700 hover:from-laburar-white/95 hover:to-laburar-sky-blue-100/90" onClick={() => window.location.href = '/como-funciona'}>
                <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Ver cómo funciona
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}