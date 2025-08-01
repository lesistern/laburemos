import { ReactNode } from 'react';

// Base interfaces
export interface BaseProps {
  className?: string;
  children?: ReactNode;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

// Dashboard Data Types
export interface DashboardStats {
  totalEarnings: number;
  activeProjects: number;
  completedProjects: number;
  averageRating: number;
  responseTime: string;
  profileViews: number;
  pendingPayments: number;
  thisMonthEarnings: number;
  lastMonthEarnings: number;
  earningsGrowth: number;
  projectsGrowth: number;
  viewsGrowth: number;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
  color?: string;
}

export interface ChartData {
  earnings: ChartDataPoint[];
  projects: ChartDataPoint[];
  views: ChartDataPoint[];
  ratings: ChartDataPoint[];
  timeRange: '7d' | '30d' | '90d' | '1y';
}

export interface Activity {
  id: string;
  type: 'project' | 'payment' | 'review' | 'message' | 'profile';
  title: string;
  description: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'in-progress' | 'cancelled';
  amount?: number;
  currency?: string;
  projectId?: string;
  clientName?: string;
  rating?: number;
  icon?: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  badge?: number;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  shortcut?: string;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  priority: 'low' | 'medium' | 'high';
  category: 'system' | 'project' | 'payment' | 'review' | 'message';
  avatar?: string;
  clientName?: string;
}

export interface DashboardData {
  stats: DashboardStats;
  charts: ChartData;
  recentActivity: Activity[];
  quickActions: QuickAction[];
  notifications: Notification[];
  lastUpdated: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: 'freelancer' | 'client' | 'admin';
    verified: boolean;
    memberSince: string;
  };
}

// Component Props
export interface DashboardProps extends BaseProps {
  userId: string;
  showNotifications?: boolean;
  refreshInterval?: number;
  onDataUpdate?: (data: DashboardData) => void;
  compact?: boolean;
  theme?: 'light' | 'dark' | 'auto';
}

export interface DashboardLayoutProps extends BaseProps {
  header?: ReactNode;
  sidebar?: ReactNode;
  footer?: ReactNode;
  loading?: boolean;
}

export interface StatsCardsProps extends BaseProps {
  data?: DashboardStats;
  loading?: boolean;
  animate?: boolean;
  compact?: boolean;
  showGrowth?: boolean;
}

export interface ChartSectionProps extends BaseProps {
  data?: ChartData;
  loading?: boolean;
  height?: number;
  showControls?: boolean;
  defaultTimeRange?: ChartData['timeRange'];
  onTimeRangeChange?: (range: ChartData['timeRange']) => void;
}

export interface RecentActivityProps extends BaseProps {
  activities?: Activity[];
  loading?: boolean;
  maxItems?: number;
  showAll?: boolean;
  onActivityClick?: (activity: Activity) => void;
  filter?: Activity['type'][];
}

export interface QuickActionsProps extends BaseProps {
  actions?: QuickAction[];
  onActionClick?: (action: QuickAction) => void;
  layout?: 'grid' | 'list' | 'compact';
  showIcons?: boolean;
  showDescriptions?: boolean;
}

export interface NotificationPanelProps extends BaseProps {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead?: () => void;
  onNotificationClick?: (notification: Notification) => void;
  maxItems?: number;
  showCategories?: boolean;
  filter?: Notification['category'][];
}

// Store Types
export interface DashboardState {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  notifications: Notification[];
  filters: {
    timeRange: ChartData['timeRange'];
    activityTypes: Activity['type'][];
    notificationCategories: Notification['category'][];
  };
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    autoRefresh: boolean;
    refreshInterval: number;
    compactMode: boolean;
    soundEnabled: boolean;
  };
}

export interface DashboardActions {
  fetchDashboardData: (userId: string) => Promise<void>;
  updateStats: (stats: Partial<DashboardStats>) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  removeNotification: (id: string) => void;
  setTimeRange: (range: ChartData['timeRange']) => void;
  setActivityFilter: (types: Activity['type'][]) => void;
  setNotificationFilter: (categories: Notification['category'][]) => void;
  updatePreferences: (preferences: Partial<DashboardState['preferences']>) => void;
  clearError: () => void;
  reset: () => void;
}

export type DashboardStore = DashboardState & DashboardActions;

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface DashboardApiResponse extends ApiResponse<DashboardData> {}

// Animation Types
export interface AnimationVariants {
  hidden: {
    opacity: number;
    y?: number;
    x?: number;
    scale?: number;
  };
  visible: {
    opacity: number;
    y?: number;
    x?: number;
    scale?: number;
    transition?: {
      duration?: number;
      delay?: number;
      ease?: string;
      staggerChildren?: number;
    };
  };
  exit?: {
    opacity: number;
    y?: number;
    x?: number;
    scale?: number;
    transition?: {
      duration?: number;
      ease?: string;
    };
  };
}

// Accessibility Types
export interface A11yProps {
  role?: string;
  'aria-live'?: 'off' | 'polite' | 'assertive';
  'aria-atomic'?: boolean;
  'aria-relevant'?: string;
  'aria-busy'?: boolean;
  'aria-expanded'?: boolean;
  'aria-selected'?: boolean;
  'aria-checked'?: boolean;
  'aria-pressed'?: boolean;
  'aria-hidden'?: boolean;
  'aria-disabled'?: boolean;
  'aria-readonly'?: boolean;
  'aria-required'?: boolean;
  'aria-invalid'?: boolean | 'false' | 'true' | 'grammar' | 'spelling';
  'aria-owns'?: string;
  'aria-controls'?: string;
  'aria-activedescendant'?: string;
  'aria-haspopup'?: boolean | 'false' | 'true' | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  'aria-setsize'?: number;
  'aria-posinset'?: number;
  tabIndex?: number;
}

// Theme Types
export interface ThemeColors {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  light: string;
  dark: string;
  background: string;
  surface: string;
  onBackground: string;
  onSurface: string;
  onPrimary: string;
  onSecondary: string;
}

export interface ThemeSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xxl: string;
}

export interface ThemeBreakpoints {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xxl: string;
}

export interface Theme {
  colors: ThemeColors;
  spacing: ThemeSpacing;
  breakpoints: ThemeBreakpoints;
  borderRadius: string;
  boxShadow: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  transition: {
    fast: string;
    normal: string;
    slow: string;
  };
}

// Error Types
export interface DashboardError extends Error {
  code?: string;
  details?: Record<string, unknown>;
  timestamp?: string;
  userId?: string;
}

// Test Types
export interface MockDashboardData extends Partial<DashboardData> {
  __mock?: boolean;
  __testId?: string;
}

export interface TestUtils {
  renderWithProviders: (component: ReactNode) => any;
  createMockStore: (initialState?: Partial<DashboardState>) => DashboardStore;
  createMockData: (overrides?: Partial<DashboardData>) => MockDashboardData;
  waitForLoadingToFinish: () => Promise<void>;
  fireUserEvent: any;
  axe: any;
}