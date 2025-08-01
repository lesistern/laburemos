import React from 'react'

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
        <h2 className="text-lg font-semibold text-gray-700 mb-2">
          Cargando...
        </h2>
        <p className="text-gray-500 text-sm">
          Espera un momento mientras preparamos todo
        </p>
      </div>
    </div>
  )
}