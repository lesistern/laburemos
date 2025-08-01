'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  CreditCard,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Building2,
  User,
  Receipt,
  FileText,
  ExternalLink,
  Shield
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { DropdownMenu } from '@/components/ui/dropdown-menu'
import { Modal } from '@/components/ui/modal'

// Mock data based on database schema
const mockTransactions = [
  {
    id: 1,
    userId: 1,
    projectId: 1,
    type: 'PAYMENT',
    amount: 15000,
    currency: 'ARS',
    paymentMethod: 'credit_card',
    paymentGateway: 'mercadopago',
    gatewayTransactionId: 'MP-12345678',
    status: 'COMPLETED',
    description: 'Pago por desarrollo web corporativo',
    processedAt: new Date('2024-01-20T14:30:00'),
    createdAt: new Date('2024-01-20T14:25:00'),
    user: {
      id: 1,
      firstName: 'María',
      lastName: 'González',
      email: 'maria.gonzalez@techcorp.com',
      userType: 'CLIENT'
    },
    project: {
      id: 1,
      title: 'Desarrollo de sitio web corporativo',
      client: { firstName: 'María', lastName: 'González' },
      freelancer: { firstName: 'Carlos', lastName: 'Mendoza' }
    },
    metadata: {
      cardLastFour: '4532',
      cardBrand: 'visa',
      installments: 1,
      fee: 750
    }
  },
  {
    id: 2,
    userId: 4,
    projectId: 2,
    type: 'WITHDRAWAL',
    amount: 7650,
    currency: 'ARS',
    paymentMethod: 'bank_transfer',
    paymentGateway: 'internal',
    gatewayTransactionId: 'WTH-87654321',
    status: 'PROCESSING',
    description: 'Retiro de ganancias - Diseño de identidad',
    processedAt: null,
    createdAt: new Date('2024-01-25T16:45:00'),
    user: {
      id: 4,
      firstName: 'Ana',
      lastName: 'Rodríguez',
      email: 'ana.rodriguez@design.com',
      userType: 'FREELANCER'
    },
    project: {
      id: 2,
      title: 'Diseño de identidad corporativa',
      client: { firstName: 'Luis', lastName: 'García' },
      freelancer: { firstName: 'Ana', lastName: 'Rodríguez' }
    },
    metadata: {
      bankAccount: '****1234',
      bankName: 'Banco Nación',
      cbu: '0110****00001234567890'
    }
  },
  {
    id: 3,
    userId: 5,
    projectId: 3,
    type: 'REFUND',
    amount: 12000,
    currency: 'ARS',
    paymentMethod: 'credit_card',
    paymentGateway: 'stripe',
    gatewayTransactionId: 'RF-11223344',
    status: 'COMPLETED',
    description: 'Reembolso por disputa - Marketing digital',
    processedAt: new Date('2024-01-28T11:20:00'),
    createdAt: new Date('2024-01-28T10:15:00'),
    user: {
      id: 5,
      firstName: 'Patricia',
      lastName: 'López',
      email: 'patricia.lopez@ecommerce.com',
      userType: 'CLIENT'
    },
    project: {
      id: 3,
      title: 'Campaña de marketing digital',
      client: { firstName: 'Patricia', lastName: 'López' },
      freelancer: { firstName: 'Diego', lastName: 'Martín' }
    },
    metadata: {
      refundReason: 'Disputa resuelta a favor del cliente',
      originalTransactionId: 'MP-55667788'
    }
  },
  {
    id: 4,
    userId: 2,
    projectId: 4,
    type: 'FEE',
    amount: 1250,
    currency: 'ARS',
    paymentMethod: 'auto_deduction',
    paymentGateway: 'internal',
    gatewayTransactionId: 'FEE-99887766',
    status: 'COMPLETED',
    description: 'Comisión de plataforma - 5%',
    processedAt: new Date('2024-01-30T09:00:00'),
    createdAt: new Date('2024-01-30T09:00:00'),
    user: {
      id: 2,
      firstName: 'Carlos',
      lastName: 'Mendoza',
      email: 'carlos.mendoza@email.com',
      userType: 'FREELANCER'
    },
    project: {
      id: 4,
      title: 'Aplicación móvil para delivery',
      client: { firstName: 'Roberto', lastName: 'Silva' },
      freelancer: { firstName: 'Carlos', lastName: 'Mendoza' }
    },
    metadata: {
      feePercentage: 5,
      originalAmount: 25000
    }
  },
  {
    id: 5,
    userId: 7,
    projectId: 5,
    type: 'PAYMENT',
    amount: 6000,
    currency: 'ARS',
    paymentMethod: 'debit_card',
    paymentGateway: 'mercadopago',
    gatewayTransactionId: 'MP-44556677',
    status: 'FAILED',
    description: 'Pago por auditoría de seguridad',
    processedAt: null,
    createdAt: new Date('2024-01-31T13:15:00'),
    user: {
      id: 7,
      firstName: 'Roberto',
      lastName: 'Silva',
      email: 'roberto.silva@foodtech.com',
      userType: 'CLIENT'
    },
    project: {
      id: 5,
      title: 'Auditoría de seguridad web',
      client: { firstName: 'Roberto', lastName: 'Silva' },
      freelancer: { firstName: 'Alejandro', lastName: 'Ruiz' }
    },
    metadata: {
      errorCode: 'insufficient_funds',
      errorMessage: 'Fondos insuficientes',
      retryCount: 2
    }
  }
]

const mockWallets = [
  {
    id: 1,
    userId: 2,
    balance: 45000,
    pendingBalance: 12000,
    currency: 'ARS',
    lastWithdrawal: new Date('2024-01-20T10:00:00'),
    user: {
      firstName: 'Carlos',
      lastName: 'Mendoza',
      email: 'carlos.mendoza@email.com',
      userType: 'FREELANCER'
    }
  },
  {
    id: 2,
    userId: 4,
    balance: 28500,
    pendingBalance: 7650,
    currency: 'ARS',
    lastWithdrawal: new Date('2024-01-15T14:30:00'),
    user: {
      firstName: 'Ana',
      lastName: 'Rodríguez',
      email: 'ana.rodriguez@design.com',
      userType: 'FREELANCER'
    }
  },
  {
    id: 3,
    userId: 6,
    balance: 67800,
    pendingBalance: 15500,
    currency: 'ARS',
    lastWithdrawal: new Date('2024-01-25T16:45:00'),
    user: {
      firstName: 'Diego',
      lastName: 'Martín',
      email: 'diego.martin@marketing.com',
      userType: 'FREELANCER'
    }
  }
]

const transactionTypeColors = {
  PAYMENT: 'bg-green-100 text-green-800',
  WITHDRAWAL: 'bg-blue-100 text-blue-800',
  REFUND: 'bg-orange-100 text-orange-800',
  FEE: 'bg-purple-100 text-purple-800'
}

const transactionTypeLabels = {
  PAYMENT: 'Pago',
  WITHDRAWAL: 'Retiro',
  REFUND: 'Reembolso',
  FEE: 'Comisión'
}

const transactionStatusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800'
}

const transactionStatusLabels = {
  PENDING: 'Pendiente',
  PROCESSING: 'Procesando',
  COMPLETED: 'Completado',
  FAILED: 'Fallido',
  CANCELLED: 'Cancelado'
}

const paymentMethodIcons = {
  credit_card: CreditCard,
  debit_card: CreditCard,
  bank_transfer: Building2,
  auto_deduction: Wallet
}

export default function PaymentsManagement() {
  const [transactions, setTransactions] = useState(mockTransactions)
  const [wallets, setWallets] = useState(mockWallets)
  const [filteredTransactions, setFilteredTransactions] = useState(mockTransactions)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    gateway: 'all',
    dateRange: 'all'
  })
  const [selectedTransactions, setSelectedTransactions] = useState<number[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [activeTab, setActiveTab] = useState('transactions')
  const [isLoading, setIsLoading] = useState(false)

  // Statistics
  const stats = {
    totalTransactions: transactions.length,
    totalVolume: transactions.filter(t => t.status === 'COMPLETED').reduce((sum, t) => sum + t.amount, 0),
    totalPayments: transactions.filter(t => t.type === 'PAYMENT' && t.status === 'COMPLETED').reduce((sum, t) => sum + t.amount, 0),
    totalWithdrawals: transactions.filter(t => t.type === 'WITHDRAWAL' && t.status === 'COMPLETED').reduce((sum, t) => sum + t.amount, 0),
    totalFees: transactions.filter(t => t.type === 'FEE' && t.status === 'COMPLETED').reduce((sum, t) => sum + t.amount, 0),
    pendingTransactions: transactions.filter(t => t.status === 'PENDING').length,
    failedTransactions: transactions.filter(t => t.status === 'FAILED').length,
    totalWalletBalance: wallets.reduce((sum, w) => sum + w.balance, 0),
    totalPendingBalance: wallets.reduce((sum, w) => sum + w.pendingBalance, 0)
  }

  // Filter transactions
  useEffect(() => {
    let filtered = transactions

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(transaction => 
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.gatewayTransactionId?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(transaction => transaction.type === filters.type)
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(transaction => transaction.status === filters.status)
    }

    // Gateway filter
    if (filters.gateway !== 'all') {
      filtered = filtered.filter(transaction => transaction.paymentGateway === filters.gateway)
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date()
      const days = {
        '7': 7,
        '30': 30,
        '90': 90
      }[filters.dateRange]
      
      if (days) {
        const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
        filtered = filtered.filter(transaction => new Date(transaction.createdAt) >= cutoff)
      }
    }

    setFilteredTransactions(filtered)
  }, [transactions, searchTerm, filters])

  const handleSelectTransaction = (transactionId: number) => {
    if (selectedTransactions.includes(transactionId)) {
      setSelectedTransactions(selectedTransactions.filter(id => id !== transactionId))
    } else {
      setSelectedTransactions([...selectedTransactions, transactionId])
    }
  }

  const handleSelectAll = () => {
    if (selectedTransactions.length === filteredTransactions.length) {
      setSelectedTransactions([])
    } else {
      setSelectedTransactions(filteredTransactions.map(transaction => transaction.id))
    }
  }

  const handleBulkAction = async (action: string) => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Update transactions based on action
    const updatedTransactions = transactions.map(transaction => {
      if (selectedTransactions.includes(transaction.id)) {
        switch (action) {
          case 'retry':
            return { ...transaction, status: 'PROCESSING' }
          case 'cancel':
            return { ...transaction, status: 'CANCELLED' }
          default:
            return transaction
        }
      }
      return transaction
    })
    
    setTransactions(updatedTransactions)
    setSelectedTransactions([])
    setIsLoading(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount)
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDateShort = (date: Date | string | null) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('es-AR', {
      month: 'short',
      day: 'numeric'
    })
  }

  const getPaymentMethodIcon = (method: string) => {
    const IconComponent = paymentMethodIcons[method as keyof typeof paymentMethodIcons] || CreditCard
    return IconComponent
  }

  const getGatewayDisplayName = (gateway: string) => {
    const names = {
      mercadopago: 'MercadoPago',
      stripe: 'Stripe',
      internal: 'Interno'
    }
    return names[gateway as keyof typeof names] || gateway
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Pagos</h1>
          <p className="text-gray-600 mt-1">
            Administra transacciones, pagos y billeteras de la plataforma
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'transactions'
                ? 'border-laburar-sky-blue-500 text-laburar-sky-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Transacciones
          </button>
          <button
            onClick={() => setActiveTab('wallets')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'wallets'
                ? 'border-laburar-sky-blue-500 text-laburar-sky-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Billeteras
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analytics'
                ? 'border-laburar-sky-blue-500 text-laburar-sky-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Analíticas
          </button>
        </nav>
      </div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Volumen total</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalVolume)}</p>
                <p className="text-sm text-gray-500 mt-1 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
                  +12.5% vs mes anterior
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Comisiones</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalFees)}</p>
                <p className="text-sm text-gray-500 mt-1 flex items-center">
                  <ArrowUpRight className="w-4 h-4 mr-1 text-green-500" />
                  Ingresos plataforma
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Receipt className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Billeteras activas</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalWalletBalance)}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {formatCurrency(stats.totalPendingBalance)} pendiente
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Problemas</p>
                <p className="text-3xl font-bold text-gray-900">{stats.pendingTransactions + stats.failedTransactions}</p>
                <p className="text-sm text-gray-500 mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1 text-orange-500" />
                  Requieren atención
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <>
          {/* Filters and Search */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar transacciones..."
                      className="pl-10 w-full sm:w-80"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className={showFilters ? 'bg-gray-100' : ''}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filtros
                  </Button>
                </div>

                {selectedTransactions.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                      {selectedTransactions.length} seleccionadas
                    </span>
                    <Button size="sm" variant="outline" onClick={() => handleBulkAction('retry')}>
                      Reintentar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleBulkAction('cancel')}>
                      Cancelar
                    </Button>
                  </div>
                )}
              </div>

              {/* Expanded Filters */}
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-gray-200"
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de transacción
                      </label>
                      <select
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        value={filters.type}
                        onChange={(e) => setFilters({...filters, type: e.target.value})}
                      >
                        <option value="all">Todos</option>
                        <option value="PAYMENT">Pagos</option>
                        <option value="WITHDRAWAL">Retiros</option>
                        <option value="REFUND">Reembolsos</option>
                        <option value="FEE">Comisiones</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estado
                      </label>
                      <select
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        value={filters.status}
                        onChange={(e) => setFilters({...filters, status: e.target.value})}
                      >
                        <option value="all">Todos</option>
                        <option value="PENDING">Pendiente</option>
                        <option value="PROCESSING">Procesando</option>
                        <option value="COMPLETED">Completado</option>
                        <option value="FAILED">Fallido</option>
                        <option value="CANCELLED">Cancelado</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gateway de pago
                      </label>
                      <select
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        value={filters.gateway}
                        onChange={(e) => setFilters({...filters, gateway: e.target.value})}
                      >
                        <option value="all">Todos</option>
                        <option value="mercadopago">MercadoPago</option>
                        <option value="stripe">Stripe</option>
                        <option value="internal">Interno</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha
                      </label>
                      <select
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        value={filters.dateRange}
                        onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
                      >
                        <option value="all">Todas las fechas</option>
                        <option value="7">Últimos 7 días</option>
                        <option value="30">Últimos 30 días</option>
                        <option value="90">Últimos 90 días</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Transactions Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Transacciones ({filteredTransactions.length})</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedTransactions.length === filteredTransactions.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-6 font-medium text-gray-500 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedTransactions.length === filteredTransactions.length && filteredTransactions.length > 0}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th className="text-left py-3 px-6 font-medium text-gray-500 text-sm">ID</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-500 text-sm">Usuario</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-500 text-sm">Tipo</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-500 text-sm">Monto</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-500 text-sm">Gateway</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-500 text-sm">Estado</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-500 text-sm">Fecha</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-500 text-sm">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredTransactions.map((transaction) => {
                      const PaymentIcon = getPaymentMethodIcon(transaction.paymentMethod)
                      
                      return (
                        <motion.tr
                          key={transaction.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-4 px-6">
                            <input
                              type="checkbox"
                              checked={selectedTransactions.includes(transaction.id)}
                              onChange={() => handleSelectTransaction(transaction.id)}
                              className="rounded border-gray-300"
                            />
                          </td>
                          
                          <td className="py-4 px-6">
                            <div>
                              <p className="font-medium text-gray-900">#{transaction.id}</p>
                              <p className="text-xs text-gray-500">{transaction.gatewayTransactionId}</p>
                            </div>
                          </td>
                          
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-gradient-to-r from-laburar-sky-blue-500 to-laburar-sky-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                                {transaction.user.firstName[0]}{transaction.user.lastName[0]}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 text-sm">
                                  {transaction.user.firstName} {transaction.user.lastName}
                                </p>
                                <p className="text-xs text-gray-500">{transaction.user.email}</p>
                              </div>
                            </div>
                          </td>
                          
                          <td className="py-4 px-6">
                            <Badge className={transactionTypeColors[transaction.type]}>
                              {transactionTypeLabels[transaction.type]}
                            </Badge>
                          </td>
                          
                          <td className="py-4 px-6">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {formatCurrency(transaction.amount)}
                              </p>
                              <div className="flex items-center space-x-1 mt-1">
                                <PaymentIcon className="w-3 h-3 text-gray-400" />
                                <span className="text-xs text-gray-500">
                                  {transaction.metadata?.cardLastFour && `****${transaction.metadata.cardLastFour}`}
                                  {transaction.metadata?.bankAccount && transaction.metadata.bankAccount}
                                </span>
                              </div>
                            </div>
                          </td>
                          
                          <td className="py-4 px-6">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {getGatewayDisplayName(transaction.paymentGateway)}
                              </p>
                              <p className="text-xs text-gray-500">{transaction.paymentMethod}</p>
                            </div>
                          </td>
                          
                          <td className="py-4 px-6">
                            <Badge className={transactionStatusColors[transaction.status]}>
                              {transactionStatusLabels[transaction.status]}
                            </Badge>
                          </td>
                          
                          <td className="py-4 px-6">
                            <div>
                              <p className="text-sm text-gray-900">{formatDateShort(transaction.createdAt)}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(transaction.createdAt).toLocaleTimeString('es-AR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </p>
                            </div>
                          </td>
                          
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedTransaction(transaction)
                                  setShowTransactionModal(true)
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              
                              <DropdownMenu
                                trigger={
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                }
                                items={[
                                  {
                                    label: 'Ver detalles',
                                    onClick: () => {
                                      setSelectedTransaction(transaction)
                                      setShowTransactionModal(true)
                                    },
                                    icon: Eye
                                  },
                                  {
                                    label: 'Ver en gateway',
                                    onClick: () => console.log('Ver en gateway', transaction.id),
                                    icon: ExternalLink,
                                    disabled: transaction.paymentGateway === 'internal'
                                  },
                                  {
                                    label: 'Generar recibo',
                                    onClick: () => console.log('Generar recibo', transaction.id),
                                    icon: FileText
                                  }
                                ]}
                              />
                            </div>
                          </td>
                        </motion.tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Wallets Tab */}
      {activeTab === 'wallets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wallets.map((wallet) => (
            <motion.div
              key={wallet.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {wallet.user.firstName[0]}{wallet.user.lastName[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {wallet.user.firstName} {wallet.user.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{wallet.user.userType}</p>
                      </div>
                    </div>
                    <Wallet className="w-5 h-5 text-gray-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">Saldo disponible</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(wallet.balance)}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">Saldo pendiente</p>
                      <p className="text-lg font-semibold text-yellow-600">{formatCurrency(wallet.pendingBalance)}</p>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Último retiro:</span>
                        <span className="text-gray-900">{formatDateShort(wallet.lastWithdrawal)}</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        Ver historial
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        Procesar retiro
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Volumen de transacciones por tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Pagos</span>
                  </div>
                  <span className="font-semibold">{formatCurrency(stats.totalPayments)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Retiros</span>  
                  </div>
                  <span className="font-semibold">{formatCurrency(stats.totalWithdrawals)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Comisiones</span>
                  </div>
                  <span className="font-semibold">{formatCurrency(stats.totalFees)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribución por gateway</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'MercadoPago', count: transactions.filter(t => t.paymentGateway === 'mercadopago').length, color: 'bg-blue-500' },
                  { name: 'Stripe', count: transactions.filter(t => t.paymentGateway === 'stripe').length, color: 'bg-purple-500' },
                  { name: 'Interno', count: transactions.filter(t => t.paymentGateway === 'internal').length, color: 'bg-gray-500' }
                ].map((gateway) => (
                  <div key={gateway.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 ${gateway.color} rounded-full`}></div>
                      <span className="text-sm text-gray-600">{gateway.name}</span>
                    </div>
                    <span className="font-semibold">{gateway.count} transacciones</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transaction Detail Modal */}
      {showTransactionModal && selectedTransaction && (
        <Modal
          isOpen={showTransactionModal}
          onClose={() => setShowTransactionModal(false)}
          title={`Transacción #${selectedTransaction.id}`}
          size="large"
        >
          <div className="space-y-6">
            {/* Transaction Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Información de la transacción</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">ID de transacción:</span>
                    <span className="text-sm font-medium">#{selectedTransaction.id}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">ID del gateway:</span>
                    <span className="text-sm font-medium">{selectedTransaction.gatewayTransactionId}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Tipo:</span>
                    <Badge className={transactionTypeColors[selectedTransaction.type]} size="sm">
                      {transactionTypeLabels[selectedTransaction.type]}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Estado:</span>
                    <Badge className={transactionStatusColors[selectedTransaction.status]} size="sm">
                      {transactionStatusLabels[selectedTransaction.status]}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Monto:</span>
                    <span className="text-sm font-semibold">{formatCurrency(selectedTransaction.amount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Método de pago:</span>
                    <span className="text-sm">{selectedTransaction.paymentMethod}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Gateway:</span>
                    <span className="text-sm">{getGatewayDisplayName(selectedTransaction.paymentGateway)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Usuario y proyecto</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Usuario:</p>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-laburar-sky-blue-500 to-laburar-sky-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {selectedTransaction.user.firstName[0]}{selectedTransaction.user.lastName[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {selectedTransaction.user.firstName} {selectedTransaction.user.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{selectedTransaction.user.email}</p>
                        <Badge className={selectedTransaction.user.userType === 'CLIENT' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'} size="sm">
                          {selectedTransaction.user.userType}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {selectedTransaction.project && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Proyecto relacionado:</p>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="font-medium text-gray-900">{selectedTransaction.project.title}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Cliente: {selectedTransaction.project.client.firstName} {selectedTransaction.project.client.lastName}
                        </p>
                        <p className="text-sm text-gray-600">
                          Freelancer: {selectedTransaction.project.freelancer.firstName} {selectedTransaction.project.freelancer.lastName}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Metadata */}
            {selectedTransaction.metadata && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Información adicional</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(selectedTransaction.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Cronología</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Creada: {formatDate(selectedTransaction.createdAt)}</p>
                  </div>
                </div>
                {selectedTransaction.processedAt && (
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Procesada: {formatDate(selectedTransaction.processedAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button variant="outline">
                Ver en gateway
              </Button>
              <Button variant="outline">
                Generar recibo
              </Button>
              <Button onClick={() => setShowTransactionModal(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}