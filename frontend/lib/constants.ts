export const APP_NAME = 'LABUREMOS'
export const APP_DESCRIPTION = 'Plataforma de Freelancers Profesional'

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  PROJECTS: '/projects',
  MESSAGES: '/messages',
  SERVICES: '/services',
  WALLET: '/wallet',
} as const

export const CATEGORIES = [
  { id: 1, name: 'Diseño y Creatividad', slug: 'diseno-creatividad', icon: 'Palette' },
  { id: 2, name: 'Programación y Tecnología', slug: 'programacion-tecnologia', icon: 'Code' },
  { id: 3, name: 'Marketing Digital', slug: 'marketing-digital', icon: 'TrendingUp' },
  { id: 4, name: 'Redacción y Traducción', slug: 'redaccion-traduccion', icon: 'PenTool' },
  { id: 5, name: 'Video y Animación', slug: 'video-animacion', icon: 'Video' },
  { id: 6, name: 'Música y Audio', slug: 'musica-audio', icon: 'Music' },
  { id: 7, name: 'Negocios', slug: 'negocios', icon: 'Briefcase' },
  { id: 8, name: 'Datos', slug: 'datos', icon: 'Database' },
] as const

export const POPULAR_SERVICES = [
  'Desarrollo Web',
  'Diseño de Logos',
  'Marketing en Redes Sociales',
  'Redacción de Contenido',
  'Edición de Video',
  'SEO',
  'E-commerce',
  'Apps Móviles',
  'Traducción',
  'Consultoría',
  'Fotografía',
  'Animación',
  'Diseño UI/UX',
  'WordPress',
  'React',
  'Node.js',
  'Python',
  'Copywriting',
  'Instagram Marketing',
  'Facebook Ads',
  'Google Ads',
  'Shopify',
  'Ilustración',
  'Branding',
] as const

export const SERVICE_PACKAGES = {
  BASIC: 'basic',
  STANDARD: 'standard',
  PREMIUM: 'premium',
} as const

export const ORDER_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  DELIVERED: 'delivered',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  DISPUTED: 'disputed',
} as const

export const USER_ROLES = {
  FREELANCER: 'freelancer',
  CLIENT: 'client',
  ADMIN: 'admin',
  MOD: 'mod',
  SUPERADMIN: 'superadmin',
} as const

export const CURRENCY = {
  CODE: 'ARS',
  SYMBOL: '$',
} as const

export const COMMISSION_RATE = 0.20 // 20%

export const BADGES = {
  FOUNDER: 'founder',
  TOP_RATED: 'top_rated',
  VERIFIED: 'verified',
  LEVEL_ONE: 'level_one',
  LEVEL_TWO: 'level_two',
} as const

export const NOTIFICATION_TYPES = {
  ORDER: 'order',
  MESSAGE: 'message',
  REVIEW: 'review',
  SYSTEM: 'system',
  PAYMENT: 'payment',
} as const