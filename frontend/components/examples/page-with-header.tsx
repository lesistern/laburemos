'use client';

import React, { useRef } from 'react';
import Header from '../layout/header';
import { Search } from 'lucide-react';

const PageWithHeader: React.FC = () => {
  const heroSearchRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen">
      {/* Header with scroll detection */}
      <Header heroSearchRef={heroSearchRef} />

      {/* Hero Section with Search */}
      <section className="bg-gradient-to-br from-sky-400 via-sky-500 to-sky-600 min-h-screen flex items-center justify-center">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Encuentra el trabajo de tus sueños
          </h1>
          <p className="text-xl text-white/90 mb-8">
            Conecta con las mejores oportunidades laborales en Argentina
          </p>

          {/* Hero Search Box - This is the reference point */}
          <div 
            ref={heroSearchRef}
            className="max-w-2xl mx-auto"
          >
            <form className="flex flex-col md:flex-row gap-3 bg-white rounded-lg p-2 shadow-lg">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="¿Qué trabajo estás buscando?"
                  className="w-full pl-10 pr-4 py-3 rounded-md border-0 focus:ring-2 focus:ring-sky-400 outline-none"
                />
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ciudad o provincia"
                  className="w-full md:w-48 px-4 py-3 rounded-md border-0 focus:ring-2 focus:ring-sky-400 outline-none"
                />
              </div>
              <button 
                type="submit"
                className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-yellow-900 font-semibold px-8 py-3 rounded-md transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Buscar
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Content Section - This is where the scroll detection becomes visible */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Cómo funciona
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-sky-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">1. Busca</h3>
              <p className="text-gray-600">
                Utiliza nuestra herramienta de búsqueda para encontrar oportunidades que se ajusten a tu perfil.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📝</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">2. Aplica</h3>
              <p className="text-gray-600">
                Envía tu CV y carta de presentación directamente a través de nuestra plataforma.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤝</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">3. Conecta</h3>
              <p className="text-gray-600">
                Recibe respuestas de empleadores y programa entrevistas para conseguir tu trabajo ideal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Additional content to demonstrate scroll behavior */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Ofertas destacadas
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-semibold mb-2">Desarrollador Frontend</h3>
                <p className="text-gray-600 mb-2">TechCorp Argentina</p>
                <p className="text-gray-500 mb-4">Buenos Aires, Argentina</p>
                <div className="flex justify-between items-center">
                  <span className="text-sky-600 font-semibold">$80,000 - $120,000</span>
                  <button className="bg-sky-600 text-white px-4 py-2 rounded-md hover:bg-sky-700 transition-colors">
                    Ver más
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default PageWithHeader;