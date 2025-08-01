import { 
  DashboardData, 
  DashboardStore, 
  DashboardStats, 
  ChartData, 
  Activity, 
  QuickAction, 
  Notification 
} from '../components/Dashboard/types';

/**
 * Mock Data Utilities for Testing
 * 
 * Provides comprehensive mock data for dashboard components
 * including realistic test scenarios and edge cases
 */

// Mock Dashboard Stats
export const createMockStats = (overrides: Partial<DashboardStats> = {}): DashboardStats => ({
  totalEarnings: 15420,
  activeProjects: 8,
  completedProjects: 47,
  averageRating: 4.8,
  responseTime: '2.5 hours',
  profileViews: 1234,
  pendingPayments: 2850,
  thisMonthEarnings: 3250,
  lastMonthEarnings: 2890,
  earningsGrowth: 12.5,
  projectsGrowth: 15.2,
  viewsGrowth: -3.4,
  ...overrides,
});

// Mock Chart Data
export const createMockChartData = (overrides: Partial<ChartData> = {}): ChartData => {
  const generateDataPoints = (count: number, baseValue: number, variance: number) => {
    const points = [];
    const now = new Date();
    
    for (let i = count - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      points.push({
        date: date.toISOString(),
        value: Math.max(0, baseValue + (Math.random() - 0.5) * variance),
        label: date.toLocaleDateString(),
      });
    }
    
    return points;
  };

  return {
    earnings: generateDataPoints(30, 150, 50),
    projects: generateDataPoints(30, 2, 1),
    views: generateDataPoints(30, 45, 15),
    ratings: generateDataPoints(30, 4.5, 0.8),
    timeRange: '30d',
    ...overrides,
  };
};

// Mock Activities
export const createMockActivities = (count: number = 10): Activity[] => {
  const activityTypes: Activity['type'][] = ['project', 'payment', 'review', 'message', 'profile'];
  const statuses: Activity['status'][] = ['completed', 'pending', 'in-progress', 'cancelled'];
  const priorities: Activity['priority'][] = ['low', 'medium', 'high'];
  
  return Array.from({ length: count }, (_, i) => {
    const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    
    const baseActivity: Activity = {
      id: `activity-${i + 1}`,
      type,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Activity ${i + 1}`,
      description: `This is a description for ${type} activity number ${i + 1}`,
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      status,
      priority,
    };

    // Add type-specific properties
    if (type === 'payment') {
      return {
        ...baseActivity,
        amount: Math.floor(Math.random() * 1000) + 100,
        currency: 'USD',
      };
    }

    if (type === 'project') {
      return {
        ...baseActivity,
        projectId: `proj-${i + 1}`,
        clientName: `Client ${i + 1}`,
      };
    }

    if (type === 'review') {
      return {
        ...baseActivity,
        rating: Math.floor(Math.random() * 5) + 1,
        clientName: `Client ${i + 1}`,
      };
    }

    return baseActivity;
  });
};

// Mock Quick Actions
export const createMockQuickActions = (): QuickAction[] => [
  {
    id: 'create-project',
    label: 'Create Project',
    description: 'Start a new project proposal',
    icon: 'plus',
    color: 'primary',
    shortcut: 'Ctrl+N',
  },
  {
    id: 'view-messages',
    label: 'Messages',
    description: 'Check your inbox',
    icon: 'message-circle',
    color: 'info',
    badge: 3,
    shortcut: 'Ctrl+M',
  },
  {
    id: 'update-profile',
    label: 'Update Profile',
    description: 'Edit your profile information',
    icon: 'user',
    color: 'secondary',
  },
  {
    id: 'view-analytics',
    label: 'Analytics',
    description: 'View detailed analytics',
    icon: 'bar-chart',
    color: 'success',
    href: '/analytics',
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Manage your account settings',
    icon: 'settings',
    color: 'secondary',
    href: '/settings',
  },
  {
    id: 'support',
    label: 'Support',
    description: 'Get help and support',
    icon: 'help-circle',
    color: 'warning',
    href: '/support',
  },
];

// Mock Notifications
export const createMockNotifications = (count: number = 5): Notification[] => {
  const types: Notification['type'][] = ['info', 'success', 'warning', 'error'];
  const priorities: Notification['priority'][] = ['low', 'medium', 'high'];
  const categories: Notification['category'][] = ['system', 'project', 'payment', 'review', 'message'];
  
  return Array.from({ length: count }, (_, i) => {
    const type = types[Math.floor(Math.random() * types.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const isRead = Math.random() > 0.6; // 40% chance of being unread
    
    return {
      id: `notification-${i + 1}`,
      type,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Notification ${i + 1}`,
      message: `This is a ${type} notification message for testing purposes. It contains detailed information about the notification.`,
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      read: isRead,
      priority,
      category,
      clientName: Math.random() > 0.5 ? `Client ${i + 1}` : undefined,
      actionUrl: Math.random() > 0.5 ? `/action/${i + 1}` : undefined,
      actionLabel: Math.random() > 0.5 ? 'View Details' : undefined,
    };
  });
};

// Mock Complete Dashboard Data
export const createMockDashboardData = (overrides: Partial<DashboardData> = {}): DashboardData => ({
  stats: createMockStats(),
  charts: createMockChartData(),
  recentActivity: createMockActivities(15),
  quickActions: createMockQuickActions(),
  notifications: createMockNotifications(8),
  lastUpdated: new Date().toISOString(),
  user: {
    id: 'user-123',
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: 'https://via.placeholder.com/40x40',
    role: 'freelancer',
    verified: true,
    memberSince: '2023-01-15T00:00:00Z',
  },
  ...overrides,
});

// Mock Store
export const createMockStore = (overrides: Partial<DashboardStore> = {}): DashboardStore => ({
  data: null,
  loading: false,
  error: null,
  notifications: [],
  filters: {
    timeRange: '30d',
    activityTypes: [],
    notificationCategories: [],
  },
  preferences: {
    theme: 'auto',
    autoRefresh: true,
    refreshInterval: 30000,
    compactMode: false,
    soundEnabled: true,
  },
  
  // Actions
  fetchDashboardData: jest.fn(),
  updateStats: jest.fn(),
  addNotification: jest.fn(),
  markNotificationRead: jest.fn(),
  markAllNotificationsRead: jest.fn(),
  removeNotification: jest.fn(),
  setTimeRange: jest.fn(),
  setActivityFilter: jest.fn(),
  setNotificationFilter: jest.fn(),
  updatePreferences: jest.fn(),
  clearError: jest.fn(),
  reset: jest.fn(),
  
  ...overrides,
});

// Edge Cases and Error Scenarios
export const createEmptyMockData = (): DashboardData => ({
  stats: {
    totalEarnings: 0,
    activeProjects: 0,
    completedProjects: 0,
    averageRating: 0,
    responseTime: 'N/A',
    profileViews: 0,
    pendingPayments: 0,
    thisMonthEarnings: 0,
    lastMonthEarnings: 0,
    earningsGrowth: 0,
    projectsGrowth: 0,
    viewsGrowth: 0,
  },
  charts: {
    earnings: [],
    projects: [],
    views: [],
    ratings: [],
    timeRange: '30d',
  },
  recentActivity: [],
  quickActions: [],
  notifications: [],
  lastUpdated: new Date().toISOString(),
  user: {
    id: 'user-empty',
    name: 'Empty User',
    email: 'empty@example.com',
    role: 'freelancer',
    verified: false,
    memberSince: new Date().toISOString(),
  },
});

export const createLargeMockData = (): DashboardData => ({
  ...createMockDashboardData(),
  recentActivity: createMockActivities(100),
  notifications: createMockNotifications(50),
});

// Test Scenarios
export const testScenarios = {
  loading: {
    store: createMockStore({ loading: true, data: null }),
    description: 'Loading state with spinner',
  },
  
  error: {
    store: createMockStore({ 
      loading: false, 
      error: 'Failed to fetch dashboard data',
      data: null 
    }),
    description: 'Error state with retry button',
  },
  
  empty: {
    store: createMockStore({ 
      loading: false, 
      data: createEmptyMockData() 
    }),
    description: 'Empty state with no data',
  },
  
  normal: {
    store: createMockStore({ 
      loading: false, 
      data: createMockDashboardData() 
    }),
    description: 'Normal state with full data',
  },
  
  updating: {
    store: createMockStore({ 
      loading: true, 
      data: createMockDashboardData() 
    }),
    description: 'Updating state with existing data',
  },
  
  large: {
    store: createMockStore({ 
      loading: false, 
      data: createLargeMockData() 
    }),
    description: 'Large dataset for performance testing',
  },
};

// Utility Functions
export const generateRandomActivity = (overrides: Partial<Activity> = {}): Activity => {
  const activities = createMockActivities(1);
  return { ...activities[0], ...overrides };
};

export const generateRandomNotification = (overrides: Partial<Notification> = {}): Notification => {
  const notifications = createMockNotifications(1);
  return { ...notifications[0], ...overrides };
};

export const createMockApiResponse = <T>(data: T, success: boolean = true, error?: string) => ({
  success,
  data: success ? data : undefined,
  error: success ? undefined : error,
  message: success ? 'Success' : 'Error occurred',
  timestamp: new Date().toISOString(),
});

// Export default mock data for quick usage
export const defaultMockData = createMockDashboardData();
export const defaultMockStore = createMockStore({
  loading: false,
  data: defaultMockData,
});