'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Menu, X, User, Bell } from 'lucide-react';
import { useScrollDetection } from '@/hooks/useScrollDetection';

interface HeaderProps {
  heroSearchRef?: React.RefObject<HTMLElement>;
}

/**
 * Header Component with Scroll-Based Search Detection
 * 
 * Features:
 * - Automatic search box appearance when scrolling past hero section
 * - Smooth transitions and animations
 * - LaburAR brand colors (sky-blue, yellow, brown)
 * - Responsive design and accessibility
 * - TypeScript support
 */
const ScrollHeader: React.FC<HeaderProps> = ({ heroSearchRef }) => {
  const { isScrolled, showHeaderSearch } = useScrollDetection({ heroSearchRef });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Handle search logic here
      console.log('Searching for:', searchQuery);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-sky-100' 
            : 'bg-transparent'
        }`}
        role="banner"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link 
                href="/" 
                className="flex items-center space-x-2"
                aria-label="LaburAR Home"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-sky-400 to-sky-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">L</span>
                </div>
                <span className={`font-bold text-xl transition-colors ${
                  isScrolled ? 'text-gray-900' : 'text-white'
                }`}>
                  Labur<span className="text-yellow-500">AR</span>
                </span>
              </Link>
            </div>

            {/* Header Search Box - Desktop */}
            <div 
              className={`hidden md:flex items-center flex-1 max-w-md mx-8 transition-all duration-300 ${
                showHeaderSearch 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 -translate-y-2 pointer-events-none'
              }`}
              aria-hidden={!showHeaderSearch}
            >
              <form onSubmit={handleSearch} className="w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar trabajos, empresas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full bg-white border border-gray-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 rounded-lg outline-none transition-all"
                    aria-label="Buscar trabajos"
                  />
                </div>
              </form>
            </div>

            {/* Navigation - Desktop */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link 
                href="/trabajos" 
                className={`transition-colors hover:text-sky-600 ${
                  isScrolled ? 'text-gray-700' : 'text-white/90'
                }`}
              >
                Trabajos
              </Link>
              <Link 
                href="/empresas" 
                className={`transition-colors hover:text-sky-600 ${
                  isScrolled ? 'text-gray-700' : 'text-white/90'
                }`}
              >
                Empresas
              </Link>
              <Link 
                href="/sobre-nosotros" 
                className={`transition-colors hover:text-sky-600 ${
                  isScrolled ? 'text-gray-700' : 'text-white/90'
                }`}
              >
                Acerca de
              </Link>
            </nav>

            {/* User Actions - Desktop */}
            <div className="hidden md:flex items-center space-x-4">
              <button
                className={`p-2 rounded-lg transition-colors ${
                  isScrolled 
                    ? 'text-gray-700 hover:text-sky-600 hover:bg-sky-50' 
                    : 'text-white/90 hover:text-white hover:bg-white/10'
                }`}
                aria-label="Notificaciones"
              >
                <Bell className="w-4 h-4" />
              </button>
              <button
                className={`p-2 rounded-lg transition-colors ${
                  isScrolled 
                    ? 'text-gray-700 hover:text-sky-600 hover:bg-sky-50' 
                    : 'text-white/90 hover:text-white hover:bg-white/10'
                }`}
                aria-label="Perfil de usuario"
              >
                <User className="w-4 h-4" />
              </button>
              <button className="bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg">
                Publicar Trabajo
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={toggleMobileMenu}
                className={`p-2 rounded-lg transition-colors ${
                  isScrolled 
                    ? 'text-gray-700 hover:text-sky-600' 
                    : 'text-white/90 hover:text-white'
                }`}
                aria-label="Menú de navegación"
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div 
          className={`md:hidden transition-all duration-300 overflow-hidden ${
            isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="bg-white/95 backdrop-blur-md border-t border-sky-100 px-4 py-4 space-y-4">
            {/* Mobile Search */}
            <div 
              className={`transition-all duration-300 ${
                showHeaderSearch ? 'block' : 'hidden'
              }`}
            >
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar trabajos, empresas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full bg-white border border-gray-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 rounded-lg outline-none"
                    aria-label="Buscar trabajos"
                  />
                </div>
              </form>
            </div>

            {/* Mobile Navigation */}
            <nav className="space-y-3">
              <Link 
                href="/trabajos" 
                className="block text-gray-700 hover:text-sky-600 py-2 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Trabajos
              </Link>
              <Link 
                href="/empresas" 
                className="block text-gray-700 hover:text-sky-600 py-2 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Empresas
              </Link>
              <Link 
                href="/sobre-nosotros" 
                className="block text-gray-700 hover:text-sky-600 py-2 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Acerca de
              </Link>
            </nav>

            {/* Mobile User Actions */}
            <div className="flex items-center space-x-3 pt-3 border-t border-gray-200">
              <button className="flex items-center text-gray-700 hover:text-sky-600 py-2 transition-colors">
                <Bell className="w-4 h-4 mr-2" />
                Notificaciones
              </button>
              <button className="flex items-center text-gray-700 hover:text-sky-600 py-2 transition-colors">
                <User className="w-4 h-4 mr-2" />
                Perfil
              </button>
            </div>

            <button
              className="w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white py-2 rounded-lg transition-all duration-200"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Publicar Trabajo
            </button>
          </div>
        </div>
      </header>

      {/* Spacer to prevent content from hiding behind fixed header */}
      <div className="h-16" />
    </>
  );
};

export default ScrollHeader;