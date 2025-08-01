"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  TrendingUp, 
  Calendar,
  Bell,
  Settings,
  Search,
  Filter,
  Download,
  ChevronRight,
  MoreVertical,
  Activity,
  DollarSign,
  Eye,
  UserPlus,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

// TypeScript Interfaces
interface DashboardState {
  activeView: 'overview' | 'analytics' | 'users' | 'jobs';
  dateRange: 'week' | 'month' | 'quarter' | 'year';
  searchQuery: string;
  filters: {
    status: string[];
    category: string[];
    dateFrom: Date | null;
    dateTo: Date | null;
  };
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
}

interface Metric {
  label: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down';
  icon: React.ElementType;
  color: string;
}

interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

// Zustand Store
interface DashboardStore extends DashboardState {
  setActiveView: (view: DashboardState['activeView']) => void;
  setDateRange: (range: DashboardState['dateRange']) => void;
  setSearchQuery: (query: string) => void;
  updateFilters: (filters: Partial<DashboardState['filters']>) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const useDashboardStore = create<DashboardStore>()(
  persist(
    (set) => ({
      activeView: 'overview',
      dateRange: 'month',
      searchQuery: '',
      filters: {
        status: [],
        category: [],
        dateFrom: null,
        dateTo: null,
      },
      notifications: [],
      isLoading: false,
      error: null,
      
      setActiveView: (view) => set({ activeView: view }),
      setDateRange: (range) => set({ dateRange: range }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      updateFilters: (filters) => set((state) => ({
        filters: { ...state.filters, ...filters }
      })),
      addNotification: (notification) => set((state) => ({
        notifications: [
          {
            ...notification,
            id: crypto.randomUUID(),
            timestamp: new Date(),
          },
          ...state.notifications,
        ].slice(0, 10), // Keep only last 10 notifications
      })),
      markNotificationAsRead: (id) => set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
      })),
      clearNotifications: () => set({ notifications: [] }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      reset: () => set({
        activeView: 'overview',
        dateRange: 'month',
        searchQuery: '',
        filters: {
          status: [],
          category: [],
          dateFrom: null,
          dateTo: null,
        },
        notifications: [],
        isLoading: false,
        error: null,
      }),
    }),
    {
      name: 'dashboard-storage',
    }
  )
);

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
    },
  },
};

const cardHoverVariants = {
  hover: {
    scale: 1.02,
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
    transition: {
      type: 'spring',
      stiffness: 300,
    },
  },
};

// Mock Data Generator
const generateMockData = (dateRange: string): ChartData[] => {
  const dataPoints = dateRange === 'week' ? 7 : dateRange === 'month' ? 30 : dateRange === 'quarter' ? 90 : 365;
  return Array.from({ length: Math.min(dataPoints, 12) }, (_, i) => ({
    name: `Period ${i + 1}`,
    users: Math.floor(Math.random() * 1000) + 500,
    jobs: Math.floor(Math.random() * 500) + 200,
    applications: Math.floor(Math.random() * 2000) + 1000,
    revenue: Math.floor(Math.random() * 50000) + 20000,
  }));
};

// Metric Card Component
const MetricCard: React.FC<{ metric: Metric }> = ({ metric }) => {
  const Icon = metric.icon;
  const isPositive = metric.trend === 'up';
  
  return (
    <motion.div
      variants={cardHoverVariants}
      whileHover="hover"
      className="relative overflow-hidden"
    >
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
          <Icon className={`h-4 w-4 ${metric.color}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metric.value}</div>
          <div className="flex items-center text-xs text-muted-foreground">
            {isPositive ? (
              <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
            ) : (
              <ArrowDownRight className="mr-1 h-3 w-3 text-red-500" />
            )}
            <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
              {Math.abs(metric.change)}%
            </span>
            <span className="ml-1">from last period</span>
          </div>
        </CardContent>
        <motion.div
          className={`absolute inset-0 ${metric.color} opacity-5`}
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
      </Card>
    </motion.div>
  );
};

// Main Dashboard Component
export const Dashboard: React.FC = () => {
  const {
    activeView,
    dateRange,
    searchQuery,
    filters,
    notifications,
    isLoading,
    error,
    setActiveView,
    setDateRange,
    setSearchQuery,
    updateFilters,
    addNotification,
    markNotificationAsRead,
    setLoading,
    setError,
  } = useDashboardStore();

  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<'users' | 'jobs' | 'applications' | 'revenue'>('users');

  // Generate mock metrics
  const metrics: Metric[] = useMemo(() => [
    {
      label: 'Total Users',
      value: '125,430',
      change: 12.5,
      trend: 'up',
      icon: Users,
      color: 'text-blue-600',
    },
    {
      label: 'Active Jobs',
      value: '3,842',
      change: -2.3,
      trend: 'down',
      icon: Briefcase,
      color: 'text-green-600',
    },
    {
      label: 'Applications',
      value: '48,329',
      change: 18.7,
      trend: 'up',
      icon: Activity,
      color: 'text-purple-600',
    },
    {
      label: 'Revenue',
      value: '$248,750',
      change: 8.2,
      trend: 'up',
      icon: DollarSign,
      color: 'text-orange-600',
    },
  ], []);

  // Load data effect
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setChartData(generateMockData(dateRange));
        
        // Simulate a notification
        if (Math.random() > 0.7) {
          addNotification({
            title: 'New User Registered',
            message: 'A new employer has signed up',
            type: 'info',
            read: false,
          });
        }
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [dateRange, setLoading, setError, addNotification]);

  // Filtered data based on search
  const filteredData = useMemo(() => {
    if (!searchQuery) return chartData;
    return chartData.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [chartData, searchQuery]);

  // Pie chart data
  const pieData = [
    { name: 'Profesionales', value: 65, color: '#3B82F6' },
    { name: 'Empresas', value: 25, color: '#10B981' },
    { name: 'Freelancers', value: 10, color: '#8B5CF6' },
  ];

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case '1':
          setActiveView('overview');
          break;
        case '2':
          setActiveView('analytics');
          break;
        case '3':
          setActiveView('users');
          break;
        case '4':
          setActiveView('jobs');
          break;
        case '/':
          e.preventDefault();
          document.getElementById('dashboard-search')?.focus();
          break;
      }
    }
  }, [setActiveView]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8"
    >
      {/* Header */}
      <motion.header 
        variants={itemVariants}
        className="mb-8 bg-white rounded-lg shadow-sm p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back! Here's your overview.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="dashboard-search"
                type="search"
                placeholder="Search... (Ctrl+/)"
                className="pl-10 w-full sm:w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search dashboard"
              />
            </div>
            
            <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
              <SelectTrigger className="w-full sm:w-40" aria-label="Select date range">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
                <SelectItem value="quarter">Last Quarter</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Notifications">
                  <Bell className="h-4 w-4" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80" align="end">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No new notifications
                  </div>
                ) : (
                  <>
                    {notifications.slice(0, 5).map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        onClick={() => markNotificationAsRead(notification.id)}
                        className={`cursor-pointer ${!notification.read ? 'bg-blue-50' : ''}`}
                      >
                        <div className="flex flex-col gap-1 w-full">
                          <div className="flex justify-between items-start">
                            <span className="font-medium text-sm">{notification.title}</span>
                            <Badge variant={notification.type === 'error' ? 'destructive' : 'default'} className="text-xs">
                              {notification.type}
                            </Badge>
                          </div>
                          <span className="text-xs text-gray-600">{notification.message}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(notification.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="icon" aria-label="Settings">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Navigation Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeView} onValueChange={(value: any) => setActiveView(value)} className="mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="jobs" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">Jobs</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {metrics.map((metric, index) => (
                <motion.div
                  key={metric.label}
                  variants={itemVariants}
                  custom={index}
                >
                  <MetricCard metric={metric} />
                </motion.div>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Line Chart */}
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Growth Trend</CardTitle>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedMetric('users')}>
                            Show Users
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSelectedMetric('jobs')}>
                            Show Jobs
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSelectedMetric('applications')}>
                            Show Applications
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSelectedMetric('revenue')}>
                            Show Revenue
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardDescription>
                      {selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)} over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={filteredData}>
                        <defs>
                          <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey={selectedMetric}
                          stroke="#3B82F6"
                          fillOpacity={1}
                          fill="url(#colorGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Pie Chart */}
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle>User Distribution</CardTitle>
                    <CardDescription>Breakdown by user type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Recent Activity */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest platform activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { icon: UserPlus, text: 'New user registration', time: '2 minutes ago', color: 'text-blue-600' },
                      { icon: Briefcase, text: 'New job posted', time: '15 minutes ago', color: 'text-green-600' },
                      { icon: Eye, text: 'Profile view milestone', time: '1 hour ago', color: 'text-purple-600' },
                      { icon: DollarSign, text: 'Premium subscription', time: '3 hours ago', color: 'text-orange-600' },
                    ].map((activity, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className={`p-2 rounded-full bg-gray-100 ${activity.color}`}>
                          <activity.icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.text}</p>
                          <p className="text-xs text-gray-500">{activity.time}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6 mt-6">
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Analytics</CardTitle>
                  <CardDescription>Comprehensive platform metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={filteredData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="users" fill="#3B82F6" />
                      <Bar dataKey="jobs" fill="#10B981" />
                      <Bar dataKey="applications" fill="#8B5CF6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6 mt-6">
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage and monitor user accounts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Total Registered Users</h4>
                        <p className="text-2xl font-bold text-blue-600">125,430</p>
                      </div>
                      <Users className="h-8 w-8 text-gray-400" />
                    </div>
                    <Progress value={75} className="h-2" />
                    <p className="text-sm text-gray-600">75% of monthly target reached</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-6 mt-6">
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Job Listings</CardTitle>
                  <CardDescription>Monitor active job postings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Active Job Listings</h4>
                        <p className="text-2xl font-bold text-green-600">3,842</p>
                      </div>
                      <Briefcase className="h-8 w-8 text-gray-400" />
                    </div>
                    <Progress value={60} className="h-2" />
                    <p className="text-sm text-gray-600">60% filled in the last 30 days</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <div className="bg-white rounded-lg p-6 shadow-xl">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading dashboard data...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50"
          >
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Dashboard;