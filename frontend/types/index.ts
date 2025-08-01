// User Types
export interface User {
  id: string
  email: string
  username: string
  role: 'freelancer' | 'client' | 'admin' | 'mod' | 'superadmin'
  firstName: string
  lastName: string
  avatar?: string
  bio?: string
  location?: string
  timezone?: string
  language?: string
  emailVerified: boolean
  phoneVerified: boolean
  twoFactorEnabled: boolean
  createdAt: string
  updatedAt: string
}

export interface FreelancerProfile extends User {
  title: string
  description: string
  skills: string[]
  hourlyRate: number
  availability: 'available' | 'busy' | 'not_available'
  portfolioItems: PortfolioItem[]
  certifications: Certification[]
  languages: Language[]
  stats: FreelancerStats
  badges: Badge[]
}

export interface FreelancerStats {
  completedProjects: number
  totalEarnings: number
  averageRating: number
  totalReviews: number
  responseTime: number // in hours
  completionRate: number // percentage
}

// Service Types
export interface Service {
  id: string
  freelancerId: string
  categoryId: number
  title: string
  description: string
  tags: string[]
  packages: ServicePackage[]
  images: string[]
  videos?: string[]
  faqs: FAQ[]
  requirements: string[]
  stats: ServiceStats
  createdAt: string
  updatedAt: string
}

export interface ServicePackage {
  id: string
  name: 'basic' | 'standard' | 'premium'
  title: string
  description: string
  price: number
  deliveryTime: number // in days
  revisions: number
  features: string[]
}

export interface ServiceStats {
  orders: number
  reviews: number
  rating: number
  responseTime: number
  completionRate: number
}

// Order Types
export interface Order {
  id: string
  serviceId: string
  packageId: string
  freelancerId: string
  clientId: string
  status: OrderStatus
  price: number
  deliveryDate: string
  requirements: string
  attachments: string[]
  messages: Message[]
  deliveries: Delivery[]
  review?: Review
  createdAt: string
  updatedAt: string
}

export type OrderStatus = 
  | 'pending'
  | 'in_progress'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'disputed'

// Review Types
export interface Review {
  id: string
  orderId: string
  reviewerId: string
  revieweeId: string
  rating: number
  comment: string
  createdAt: string
}

// Message Types
export interface Message {
  id: string
  senderId: string
  recipientId: string
  content: string
  attachments?: string[]
  read: boolean
  createdAt: string
}

export interface Conversation {
  id: string
  participants: User[]
  lastMessage: Message
  unreadCount: number
  createdAt: string
  updatedAt: string
}

// Other Types
export interface PortfolioItem {
  id: string
  title: string
  description: string
  images: string[]
  link?: string
  createdAt: string
}

export interface Certification {
  id: string
  name: string
  issuer: string
  date: string
  link?: string
}

export interface Language {
  code: string
  name: string
  level: 'basic' | 'conversational' | 'fluent' | 'native'
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  color: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'exclusive'
  category: 'común' | 'confianza' | 'épico' | 'exclusivo' | 'habilidades' | 'legendario' | 'participación' | 'raro' | 'rendimiento' | 'trayectoria'
}

export interface FAQ {
  question: string
  answer: string
}

export interface Delivery {
  id: string
  orderId: string
  message: string
  files: string[]
  createdAt: string
}

export interface Category {
  id: number
  name: string
  slug: string
  icon: string
  subcategories?: Subcategory[]
}

export interface Subcategory {
  id: number
  name: string
  slug: string
}

export interface Notification {
  id: string
  userId: string
  type: 'order' | 'message' | 'review' | 'system' | 'payment'
  title: string
  message: string
  data?: any
  read: boolean
  createdAt: string
}

export interface Transaction {
  id: string
  userId: string
  type: 'deposit' | 'withdrawal' | 'payment' | 'refund'
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed'
  description: string
  createdAt: string
}

export interface Wallet {
  userId: string
  balance: number
  pendingBalance: number
  currency: string
  transactions: Transaction[]
}