'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { MotionCard } from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { useAuthStore } from '@/stores/auth-store'
import { 
  Wallet,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Eye,
  EyeOff,
  Download,
  Filter,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Briefcase
} from 'lucide-react'

const mockTransactions = [
  {
    id: 1,
    type: 'income',
    amount: 1500,
    description: 'Pago por Aplicación E-commerce',
    client: 'María González',
    project: 'Desarrollo Web Completo',
    status: 'completed',
    date: '2025-01-28T10:30:00Z',
    paymentMethod: 'Stripe'
  },
  {
    id: 2,
    type: 'income',
    amount: 800,
    description: 'Pago por Identidad Visual',
    client: 'Carlos Ruiz',
    project: 'Diseño de Marca',
    status: 'completed',
    date: '2025-01-25T14:20:00Z',
    paymentMethod: 'PayPal'
  },
  {
    id: 3,
    type: 'expense',
    amount: 29.99,
    description: 'Suscripción Pro LaburAR',
    client: 'LaburAR',
    project: 'Suscripción Mensual',
    status: 'completed',
    date: '2025-01-24T09:00:00Z',
    paymentMethod: 'Tarjeta **** 4532'
  },
  {
    id: 4,
    type: 'withdraw',
    amount: 1200,
    description: 'Retiro a cuenta bancaria',
    client: 'Banco Santander',
    project: 'Retiro de fondos',
    status: 'pending',
    date: '2025-01-23T16:45:00Z',
    paymentMethod: 'Transferencia'
  },
  {
    id: 5,
    type: 'income',
    amount: 600,
    description: 'Pago por Consultoría DB',
    client: 'Ana Martínez',
    project: 'Optimización Base de Datos',
    status: 'completed',
    date: '2025-01-20T11:15:00Z',
    paymentMethod: 'Stripe'
  }
]

const paymentMethods = [
  {
    id: 1,
    type: 'card',
    name: 'Visa **** 4532',
    isDefault: true,
    expiry: '12/26'
  },
  {
    id: 2,
    type: 'paypal',
    name: 'PayPal',
    email: 'usuario@email.com',
    isDefault: false
  },
  {
    id: 3,
    type: 'bank',
    name: 'Banco Santander',
    account: '**** 8901',
    isDefault: false
  }
]

export default function WalletPage() {
  const { user, isAuthenticated } = useAuthStore()
  const [transactions, setTransactions] = useState(mockTransactions)
  const [showBalance, setShowBalance] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selectedTab, setSelectedTab] = useState('transactions')

  if (!isAuthenticated || !user) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <MotionCard className="p-8 text-center">
            <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-black mb-2">Acceso Requerido</h2>
            <p className="text-black mb-4">Necesitas iniciar sesión para ver tu billetera.</p>
            <Button variant="gradient">Iniciar Sesión</Button>
          </MotionCard>
        </div>
        <Footer />
      </>
    )
  }

  const balance = 3250.75
  const pendingBalance = 450.00
  const totalEarnings = transactions
    .filter(t => t.type === 'income' && t.status === 'completed')
    .reduce((acc, t) => acc + t.amount, 0)

  const filteredTransactions = transactions.filter(transaction => {
    if (filter === 'all') return true
    if (filter === 'income') return transaction.type === 'income'
    if (filter === 'expense') return transaction.type === 'expense'
    if (filter === 'withdraw') return transaction.type === 'withdraw'
    return true
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'income':
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />
      case 'expense':
        return <ArrowUpRight className="h-4 w-4 text-red-600" />
      case 'withdraw':
        return <ArrowUpRight className="h-4 w-4 text-blue-600" />
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-black mb-2">Mi Billetera</h1>
          <p className="text-black">Gestiona tus pagos, retiros y métodos de pago</p>
        </motion.div>

        {/* Balance Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <MotionCard className="p-6 bg-gradient-to-r from-laburar-sky-blue-500 to-laburar-sky-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm mb-1">Balance Disponible</p>
                <div className="flex items-center gap-2">
                  {showBalance ? (
                    <p className="text-3xl font-bold">${balance.toLocaleString()}</p>
                  ) : (
                    <p className="text-3xl font-bold">****</p>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 h-6 w-6"
                    onClick={() => setShowBalance(!showBalance)}
                  >
                    {showBalance ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
              <Wallet className="h-8 w-8 text-white/80" />
            </div>
          </MotionCard>

          <MotionCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-black text-sm mb-1">Pagos Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">${pendingBalance.toLocaleString()}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </MotionCard>

          <MotionCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-black text-sm mb-1">Ingresos Totales</p>
                <p className="text-2xl font-bold text-green-600">${totalEarnings.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </MotionCard>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Button variant="gradient" className="p-6 h-auto flex-col gap-2">
            <ArrowDownLeft className="h-6 w-6" />
            <span>Retirar Fondos</span>
          </Button>
          <Button variant="outline" className="p-6 h-auto flex-col gap-2">
            <Plus className="h-6 w-6" />
            <span>Agregar Método</span>
          </Button>
          <Button variant="outline" className="p-6 h-auto flex-col gap-2">
            <Download className="h-6 w-6" />
            <span>Descargar Reporte</span>
          </Button>
          <Button variant="outline" className="p-6 h-auto flex-col gap-2">
            <Calendar className="h-6 w-6" />
            <span>Programar Retiro</span>
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <Button
            variant="ghost"
            className={`rounded-none border-b-2 px-6 py-3 ${
              selectedTab === 'transactions'
                ? 'border-laburar-sky-blue-500 text-laburar-sky-blue-600'
                : 'border-transparent text-gray-600'
            }`}
            onClick={() => setSelectedTab('transactions')}
          >
            Transacciones
          </Button>
          <Button
            variant="ghost"
            className={`rounded-none border-b-2 px-6 py-3 ${
              selectedTab === 'methods'
                ? 'border-laburar-sky-blue-500 text-laburar-sky-blue-600'
                : 'border-transparent text-gray-600'
            }`}
            onClick={() => setSelectedTab('methods')}
          >
            Métodos de Pago
          </Button>
        </div>

        {selectedTab === 'transactions' ? (
          <div>
            {/* Filters */}
            <div className="flex gap-4 mb-6">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
                size="sm"
              >
                Todas
              </Button>
              <Button
                variant={filter === 'income' ? 'default' : 'outline'}
                onClick={() => setFilter('income')}
                size="sm"
              >
                Ingresos
              </Button>
              <Button
                variant={filter === 'expense' ? 'default' : 'outline'}
                onClick={() => setFilter('expense')}
                size="sm"
              >
                Gastos
              </Button>
              <Button
                variant={filter === 'withdraw' ? 'default' : 'outline'}
                onClick={() => setFilter('withdraw')}
                size="sm"
              >
                Retiros
              </Button>
            </div>

            {/* Transactions List */}
            <div className="space-y-4">
              {filteredTransactions.map((transaction, index) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <MotionCard className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-gray-100">
                          {getTransactionIcon(transaction.type)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-black">{transaction.description}</h3>
                            {getStatusIcon(transaction.status)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {transaction.client}
                            </span>
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-3 w-3" />
                              {transaction.project}
                            </span>
                            <span className="flex items-center gap-1">
                              <CreditCard className="h-3 w-3" />
                              {transaction.paymentMethod}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className={`text-lg font-semibold ${
                          transaction.type === 'income' 
                            ? 'text-green-600' 
                            : transaction.type === 'expense'
                            ? 'text-red-600'
                            : 'text-blue-600'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(transaction.date)}
                        </p>
                      </div>
                    </div>
                  </MotionCard>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Payment Methods */}
            {paymentMethods.map((method, index) => (
              <motion.div
                key={method.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <MotionCard className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-gray-100">
                        <CreditCard className="h-6 w-6 text-gray-600" />
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-black">{method.name}</h3>
                          {method.isDefault && (
                            <span className="px-2 py-1 bg-laburar-sky-blue-100 text-laburar-sky-blue-700 text-xs rounded-full">
                              Predeterminado
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {method.type === 'card' && `Vence: ${method.expiry}`}
                          {method.type === 'paypal' && method.email}
                          {method.type === 'bank' && `Cuenta: ${method.account}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Editar
                      </Button>
                      {!method.isDefault && (
                        <Button variant="outline" size="sm" className="text-red-600">
                          Eliminar
                        </Button>
                      )}
                    </div>
                  </div>
                </MotionCard>
              </motion.div>
            ))}

            {/* Add New Method */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: paymentMethods.length * 0.1 }}
            >
              <MotionCard className="p-6 border-2 border-dashed border-gray-300 hover:border-laburar-sky-blue-300 transition-colors">
                <div className="text-center">
                  <Plus className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                  <h3 className="font-semibold text-black mb-1">Agregar Método de Pago</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Agrega una nueva tarjeta, cuenta bancaria o método de pago
                  </p>
                  <Button variant="gradient">
                    Agregar Método
                  </Button>
                </div>
              </MotionCard>
            </motion.div>
          </div>
        )}
      </div>
      </div>
      <Footer />
    </>
  )
}