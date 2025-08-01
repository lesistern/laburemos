import { Badge } from '@/types'

// Badge categories based on achievement type
export const BADGE_CATEGORIES = {
  COMUN: 'común',
  CONFIANZA: 'confianza',
  EPICO: 'épico',
  EXCLUSIVO: 'exclusivo', 
  HABILIDADES: 'habilidades',
  LEGENDARIO: 'legendario',
  PARTICIPACION: 'participación',
  RARO: 'raro',
  RENDIMIENTO: 'rendimiento',
  TRAYECTORIA: 'trayectoria',
} as const

export type BadgeCategory = typeof BADGE_CATEGORIES[keyof typeof BADGE_CATEGORIES]

// Badge mapping organized by categories
export const AVAILABLE_BADGES: Badge[] = [
  // EXCLUSIVO - Eventos únicos y fundadores
  {
    id: 'fundador-1',
    name: 'Fundador Nivel 1',
    description: 'Miembro fundador de LaburAR - Los primeros 100 usuarios',
    icon: '/badges/Exclusivo - Fundador 1.png',
    color: '#ec4899',
    rarity: 'exclusive',
    category: 'exclusivo'
  },
  {
    id: 'fundador-2',
    name: 'Fundador Nivel 2', 
    description: 'Fundador activo con múltiples proyectos completados',
    icon: '/badges/Exclusivo - Fundador 2.png',
    color: '#8b5cf6',
    rarity: 'exclusive',
    category: 'exclusivo'
  },
  {
    id: 'fundador-3',
    name: 'Fundador Nivel 3',
    description: 'Fundador élite con impacto significativo en la plataforma',
    icon: '/badges/Exclusivo - Fundador 3.png',
    color: '#3b82f6',
    rarity: 'exclusive',
    category: 'exclusivo'
  },
  {
    id: 'fundador-4',
    name: 'Fundador Legendario',
    description: 'Fundador con el mayor impacto en el crecimiento de LaburAR',
    icon: '/badges/Exclusivo - Fundador 4.png',
    color: '#f59e0b',
    rarity: 'exclusive',
    category: 'exclusivo'
  },
  {
    id: 'evento-unico-1',
    name: 'Evento Especial 2025',
    description: 'Participó en el evento de lanzamiento oficial',
    icon: '/badges/Exclusivo - Eventos únicos 1.png',
    color: '#ef4444',
    rarity: 'exclusive',
    category: 'exclusivo'
  },
  {
    id: 'evento-unico-2',
    name: 'Evento Beta 2024',
    description: 'Participó en la beta privada de LaburAR',
    icon: '/badges/Exclusivo - Eventos únicos 2.png',
    color: '#8b5cf6',
    rarity: 'exclusive',
    category: 'exclusivo'
  },
  {
    id: 'evento-unico-3',
    name: 'Evento Navideño 2024',
    description: 'Participó en el evento especial de Navidad',
    icon: '/badges/Exclusivo - Eventos únicos 3.png',
    color: '#dc2626',
    rarity: 'exclusive',
    category: 'exclusivo'
  },

  // LEGENDARIO - Los más altos logros
  {
    id: 'top-rated',
    name: 'Top Rated',
    description: 'Entre los freelancers mejor calificados de la plataforma',
    icon: '/badges/Legendario - Top Rated.png',
    color: '#fbbf24',
    rarity: 'legendary',
    category: 'legendario'
  },
  {
    id: 'perfeccionista-1',
    name: 'Perfeccionista',
    description: '100% de proyectos entregados sin revisiones',
    icon: '/badges/Legendario - Perfeccionista 1.png',
    color: '#f59e0b',
    rarity: 'legendary',
    category: 'legendario'
  },
  {
    id: 'perfeccionista-2',
    name: 'Perfeccionista Maestro',
    description: '50+ proyectos entregados perfectos sin revisiones',
    icon: '/badges/Legendario - Perfeccionista 2.png',
    color: '#d97706',
    rarity: 'legendary',
    category: 'legendario'
  },

  // EPICO - Logros importantes
  {
    id: '10-proyectos-1',
    name: '10 Proyectos',
    description: 'Completó exitosamente 10 proyectos',
    icon: '/badges/Epico - 10 proyectos 1.png',
    color: '#8b5cf6',
    rarity: 'epic',
    category: 'épico'
  },
  {
    id: '10-proyectos-2',
    name: '10 Proyectos Élite',
    description: '10 proyectos completados con calificación 5 estrellas',
    icon: '/badges/Epico - 10 proyectos 2.png',
    color: '#7c3aed',
    rarity: 'epic',
    category: 'épico'
  },
  {
    id: 'cliente-favorito-1',
    name: 'Cliente Favorito',
    description: 'Elegido como favorito por múltiples freelancers',
    icon: '/badges/Epico - Cliente Favorito 1.png',
    color: '#a855f7',
    rarity: 'epic',
    category: 'épico'
  },
  {
    id: 'cliente-favorito-2',
    name: 'Cliente Preferido',
    description: 'Cliente altamente valorado por la comunidad',
    icon: '/badges/Epico - Cliente Favorito 2.png',
    color: '#9333ea',
    rarity: 'epic',
    category: 'épico'
  },

  // RARO - Logros notables
  {
    id: '5-proyectos',
    name: '5 Proyectos',
    description: 'Completó exitosamente 5 proyectos',
    icon: '/badges/Raro - 5 proyectos.png',
    color: '#3b82f6',
    rarity: 'rare',
    category: 'raro'
  },
  {
    id: '5-proyectos-elite',
    name: '5 Proyectos Elite',
    description: '5 proyectos completados con alta calificación',
    icon: '/badges/Raro - 5 proyectos (2).png',
    color: '#2563eb',
    rarity: 'rare',
    category: 'raro'
  },
  {
    id: 'comunicador-1',
    name: 'Comunicador',
    description: 'Excelente comunicación con clientes',
    icon: '/badges/Raro - Comunicador 1.png',
    color: '#06b6d4',
    rarity: 'rare',
    category: 'raro'
  },
  {
    id: 'comunicador-2',
    name: 'Comunicador Experto',
    description: 'Comunicación excepcional valorada por clientes',
    icon: '/badges/Raro - Comunicador 2.png',
    color: '#0891b2',
    rarity: 'rare',
    category: 'raro'
  },

  // CONFIANZA - Verificaciones y confiabilidad
  {
    id: 'verificado-dni',
    name: 'Identidad Verificada',
    description: 'Verificó su identidad con documento oficial',
    icon: '/badges/Confianza - Verificado DNI.png',
    color: '#059669',
    rarity: 'rare',
    category: 'confianza'
  },
  {
    id: 'sin-reportes',
    name: 'Sin Reportes',
    description: 'Historial limpio sin reportes negativos',
    icon: '/badges/Confianza - Sin reportes.png',
    color: '#16a34a',
    rarity: 'rare',
    category: 'confianza'
  },
  {
    id: 'certificacion-habilidades',
    name: 'Certificación de Habilidades',
    description: 'Aprobó las certificaciones oficiales',
    icon: '/badges/Confianza - Certificacion Habilidades.png',
    color: '#0d9488',
    rarity: 'rare',
    category: 'confianza'
  },
  {
    id: 'vip-freelancer-1',
    name: 'VIP Freelancer Bronce',
    description: 'Freelancer VIP con beneficios especiales',
    icon: '/badges/Confianza - VIP Freelancer 1.png',
    color: '#7c2d12',
    rarity: 'epic',
    category: 'confianza'
  },
  {
    id: 'vip-freelancer-2',
    name: 'VIP Freelancer Plata',
    description: 'Freelancer VIP nivel plata',
    icon: '/badges/Confianza - VIP Freelancer 2.png',
    color: '#6b7280',
    rarity: 'epic',
    category: 'confianza'
  },
  {
    id: 'vip-freelancer-3',
    name: 'VIP Freelancer Oro',
    description: 'Freelancer VIP nivel oro',
    icon: '/badges/Confianza - VIP Freelancer 3.png',
    color: '#f59e0b',
    rarity: 'epic',
    category: 'confianza'
  },
  {
    id: 'vip-freelancer-4',
    name: 'VIP Freelancer Diamante',
    description: 'Freelancer VIP nivel diamante',
    icon: '/badges/Confianza - VIP Freelancer 4.png',
    color: '#3b82f6',
    rarity: 'epic',
    category: 'confianza'
  },
  {
    id: 'vip-cliente-1',
    name: 'VIP Cliente Bronce',
    description: 'Cliente VIP con beneficios especiales',
    icon: '/badges/Confianza - VIP Cliente 1.png',
    color: '#be185d',
    rarity: 'epic',
    category: 'confianza'
  },
  {
    id: 'vip-cliente-2',
    name: 'VIP Cliente Plata',
    description: 'Cliente VIP nivel plata',
    icon: '/badges/Confianza - VIP Cliente 2.png',
    color: '#db2777',
    rarity: 'epic',
    category: 'confianza'
  },
  {
    id: 'vip-cliente-3',
    name: 'VIP Cliente Oro',
    description: 'Cliente VIP nivel oro',
    icon: '/badges/Confianza - VIP Cliente 3.png',
    color: '#f59e0b',
    rarity: 'epic',
    category: 'confianza'
  },

  // TRAYECTORIA - Carrera y desarrollo profesional
  {
    id: 'primer-trabajo',
    name: 'Primer Trabajo',
    description: 'Completó su primer trabajo en la plataforma',
    icon: '/badges/Trayectoria - 1er trabajo completado.png',
    color: '#22c55e',
    rarity: 'common',
    category: 'trayectoria'
  },
  {
    id: 'estrella-mes',
    name: 'Estrella del Mes',
    description: 'Reconocido como la estrella del mes',
    icon: '/badges/Trayectoria - Estrella del mes.png',
    color: '#eab308',
    rarity: 'epic',
    category: 'trayectoria'
  },
  {
    id: 'top-freelancer-1',
    name: 'Top Freelancer',
    description: 'Entre los mejores freelancers de la plataforma',
    icon: '/badges/Trayectoria - Top Freelancer 1.png',
    color: '#dc2626',
    rarity: 'legendary',
    category: 'trayectoria'
  },
  {
    id: 'top-freelancer-2',
    name: 'Top Freelancer Elite',
    description: 'Freelancer de élite reconocido',
    icon: '/badges/Trayectoria - Top Freelancer 2.png',
    color: '#ef4444',
    rarity: 'legendary',
    category: 'trayectoria'
  },
  {
    id: 'veterano',
    name: 'Veterano',
    description: 'Más de 2 años activo en la plataforma',
    icon: '/badges/Trayectoria - Veterano.png',
    color: '#92400e',
    rarity: 'epic',
    category: 'trayectoria'
  },
  {
    id: 'freelancer-constante',
    name: 'Freelancer Constante',
    description: 'Actividad constante y confiable',
    icon: '/badges/Trayectoria - Freelancer Constante.png',
    color: '#059669',
    rarity: 'rare',
    category: 'trayectoria'
  },

  // RENDIMIENTO - Métricas de performance
  {
    id: 'entrega-puntual',
    name: 'Entrega Puntual',
    description: 'Siempre entrega los proyectos a tiempo',
    icon: '/badges/Rendimiento  - Entrega Puntual.png',
    color: '#059669',
    rarity: 'rare',
    category: 'rendimiento'
  },
  {
    id: 'completado-100-1',
    name: '100% Completado',
    description: 'Tasa de finalización del 100%',
    icon: '/badges/Rendimiento  - 100_ Completado 1.png',
    color: '#16a34a',
    rarity: 'epic',
    category: 'rendimiento'
  },
  {
    id: 'completado-100-2',
    name: '100% Completado Pro',
    description: 'Tasa de finalización perfecta mantenida',
    icon: '/badges/Rendimiento  - 100_ Completado 2.png',
    color: '#059669',
    rarity: 'epic',
    category: 'rendimiento'
  },
  {
    id: 'cliente-satisfecho',
    name: 'Cliente Satisfecho',
    description: 'Alta satisfacción de clientes',
    icon: '/badges/Rendimiento  - Cliente Satisfecho.png',
    color: '#0d9488',
    rarity: 'rare',
    category: 'rendimiento'
  },
  {
    id: 'recurrente',
    name: 'Cliente Recurrente',
    description: 'Mantiene clientes que regresan constantemente',
    icon: '/badges/Rendimiento  - Recurrente.png',
    color: '#7c3aed',
    rarity: 'rare',
    category: 'rendimiento'
  },
  {
    id: 'revisiones-minimas-1',
    name: 'Pocas Revisiones',
    description: 'Entrega trabajos con mínimas revisiones',
    icon: '/badges/Rendimiento  - Revisiones Minimas 1.png',
    color: '#16a34a',
    rarity: 'rare',
    category: 'rendimiento'
  },
  {
    id: 'revisiones-minimas-2',
    name: 'Sin Revisiones',
    description: 'Trabajos perfectos desde la primera entrega',
    icon: '/badges/Rendimiento  - Revisiones Minimas 2.png',
    color: '#059669',
    rarity: 'rare',
    category: 'rendimiento'
  },

  // HABILIDADES - Competencias técnicas
  {
    id: 'especialista-programador',
    name: 'Especialista en Programación',
    description: 'Experto verificado en desarrollo de software',
    icon: '/badges/Habilidades - Especialista Programador.png',
    color: '#1e40af',
    rarity: 'rare',
    category: 'habilidades'
  },
  {
    id: 'especialista-python',
    name: 'Especialista Python',
    description: 'Experto certificado en Python',
    icon: '/badges/Habilidades - Especialista Python.png',
    color: '#1d4ed8',
    rarity: 'rare',
    category: 'habilidades'
  },
  {
    id: 'especialista-html',
    name: 'Especialista HTML/CSS',
    description: 'Experto en desarrollo frontend',
    icon: '/badges/Habilidades - Especialista HTML.png',
    color: '#dc2626',
    rarity: 'rare',
    category: 'habilidades'
  },
  {
    id: 'especialista-photoshop',
    name: 'Especialista Photoshop',
    description: 'Experto certificado en Adobe Photoshop',
    icon: '/badges/Habilidades - Especialista Photoshop.png',
    color: '#1e40af',
    rarity: 'rare',
    category: 'habilidades'
  },
  {
    id: 'especialista-wordpress',
    name: 'Especialista WordPress',
    description: 'Experto en desarrollo con WordPress',
    icon: '/badges/Habilidades - Especialista WordPress.png',
    color: '#0073aa',
    rarity: 'rare',
    category: 'habilidades'
  },
  {
    id: 'multilingue',
    name: 'Multilingüe',
    description: 'Domina múltiples idiomas',
    icon: '/badges/Habilidades - Multilingue.png',
    color: '#7c2d12',
    rarity: 'rare',
    category: 'habilidades'
  },
  {
    id: 'creativo-destacado',
    name: 'Creativo Destacado',
    description: 'Reconocido por su creatividad excepcional',
    icon: '/badges/Habilidades - Creativo destacado.png',
    color: '#f59e0b', 
    rarity: 'epic',
    category: 'habilidades'
  },
  {
    id: 'especialista-arte',
    name: 'Especialista en Arte',
    description: 'Experto certificado en artes visuales',
    icon: '/badges/Habilidades - Especialista Arte.png',
    color: '#ec4899',
    rarity: 'rare',
    category: 'habilidades'
  },
  {
    id: 'especialista-legal',
    name: 'Especialista Legal',
    description: 'Experto en servicios legales',
    icon: '/badges/Habilidades - Especialista Legal.png',
    color: '#374151',
    rarity: 'rare',
    category: 'habilidades'
  },
  {
    id: 'solucionador-bugs',
    name: 'Solucionador de Bugs',
    description: 'Experto en debugging y resolución de problemas',
    icon: '/badges/Habilidades - Solucionador de Bugs.png',
    color: '#dc2626',
    rarity: 'epic',
    category: 'habilidades'
  },

  // PARTICIPACIÓN - Actividad en la comunidad
  {
    id: 'perfil-verificado',
    name: 'Perfil Verificado',
    description: 'Perfil completamente verificado',
    icon: '/badges/Participacion - Perfil Verificado.png',
    color: '#16a34a',
    rarity: 'common',
    category: 'participación'
  },
  {
    id: 'feedback',
    name: 'Buen Feedback',
    description: 'Proporciona feedback valioso',
    icon: '/badges/Participacion - Feedback.png',
    color: '#0d9488',
    rarity: 'common',
    category: 'participación'
  },
  {
    id: 'referidor',  
    name: 'Referidor',
    description: 'Ha referido nuevos usuarios a la plataforma',
    icon: '/badges/Participacion - Referidor.png',
    color: '#7c2d12',
    rarity: 'rare',
    category: 'participación'
  },
  {
    id: 'activo-foros',
    name: 'Activo en Foros',
    description: 'Participación activa en la comunidad',
    icon: '/badges/Participacion - Activo en Foros.png',
    color: '#0d9488',
    rarity: 'rare',
    category: 'participación'
  },

  // COMÚN - Logros básicos
  {
    id: 'perfil-completo',
    name: 'Perfil Completo',
    description: 'Completó toda la información de su perfil',
    icon: '/badges/Comun - Perfil Completo.png',
    color: '#6b7280',
    rarity: 'common',
    category: 'común'
  },
  {
    id: 'perfil-completo-2',
    name: 'Perfil Detallado',
    description: 'Perfil completo con información detallada',
    icon: '/badges/Comun - Perfil Completo 2.png',
    color: '#4b5563',
    rarity: 'common',
    category: 'común'
  },
  {
    id: 'primera-venta-1',
    name: 'Primera Venta',
    description: 'Completó su primer trabajo en LaburAR',
    icon: '/badges/Comun - Primera Venta 1.png',
    color: '#10b981',
    rarity: 'common',
    category: 'común'
  },
  {
    id: 'primera-venta-2',
    name: 'Primera Venta Exitosa',
    description: 'Primera venta con excelente calificación',
    icon: '/badges/Comun - Primera Venta 2.png',
    color: '#059669',
    rarity: 'common',
    category: 'común'
  }
]

// Helper function to get badges by category
export function getBadgesByCategory(category: BadgeCategory): Badge[] {
  return AVAILABLE_BADGES.filter(badge => badge.category === category)
}

// Helper function to get badges by rarity
export function getBadgesByRarity(rarity: Badge['rarity']): Badge[] {
  return AVAILABLE_BADGES.filter(badge => badge.rarity === rarity)
}

// Helper function to get badge by ID
export function getBadgeById(id: string): Badge | undefined {
  return AVAILABLE_BADGES.find(badge => badge.id === id)
}

// Get user's badges based on their profile/achievements
export function getUserBadges(user: any): Badge[] {
  const badges: Badge[] = []
  
  // Demo user gets ALL badges to showcase the system
  if (user?.email === 'lesistern@gmail.com') {
    // Return ALL available badges for demo
    return [...AVAILABLE_BADGES]
  }
  
  // For established users, add various badges based on achievements
  badges.push(getBadgeById('perfil-completo')!)
  badges.push(getBadgeById('primera-venta-1')!)
  badges.push(getBadgeById('5-proyectos')!)
  badges.push(getBadgeById('comunicador-1')!)
  badges.push(getBadgeById('entrega-puntual')!)
  badges.push(getBadgeById('especialista-programador')!)
  badges.push(getBadgeById('sin-reportes')!)
  badges.push(getBadgeById('top-freelancer-1')!)
  
  return badges.filter(Boolean)
}

// Get categories with badge counts
export function getCategoriesWithCounts(userBadges: Badge[]) {
  const categories = [
    'exclusivo', 'legendario', 'épico', 'trayectoria', 'rendimiento', 
    'confianza', 'habilidades', 'raro', 'participación', 'común'
  ] as const

  return categories.map(category => ({
    name: category,
    displayName: category.charAt(0).toUpperCase() + category.slice(1),
    badges: userBadges.filter(badge => badge.category === category),
    count: userBadges.filter(badge => badge.category === category).length,
    color: getCategoryColor(category)
  })).filter(cat => cat.count > 0)
}

// Get color for each category
function getCategoryColor(category: BadgeCategory): string {
  const colors = {
    'exclusivo': 'text-pink-600',
    'legendario': 'text-yellow-600', 
    'épico': 'text-purple-600',
    'trayectoria': 'text-red-600',
    'rendimiento': 'text-green-600',
    'confianza': 'text-blue-600',
    'habilidades': 'text-indigo-600',
    'raro': 'text-cyan-600',
    'participación': 'text-teal-600',
    'común': 'text-gray-600'
  }
  return colors[category] || 'text-gray-600'
}