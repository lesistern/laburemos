import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { within, userEvent } from '@storybook/testing-library';
import { expect } from '@storybook/jest';
import { Dashboard } from './Dashboard';
import { 
  createMockDashboardData, 
  createEmptyMockData, 
  createLargeMockData,
  testScenarios 
} from '../../test-utils/mockData';

// Mock the store for Storybook
const mockStore = {
  data: null,
  loading: false,
  error: null,
  notifications: [],
  filters: {
    timeRange: '30d' as const,
    activityTypes: [],
    notificationCategories: [],
  },
  preferences: {
    theme: 'auto' as const,
    autoRefresh: true,
    refreshInterval: 30000,
    compactMode: false,
    soundEnabled: true,
  },
  fetchDashboardData: action('fetchDashboardData'),
  updateStats: action('updateStats'),
  addNotification: action('addNotification'),
  markNotificationRead: action('markNotificationRead'),
  markAllNotificationsRead: action('markAllNotificationsRead'),
  removeNotification: action('removeNotification'),
  setTimeRange: action('setTimeRange'),
  setActivityFilter: action('setActivityFilter'),
  setNotificationFilter: action('setNotificationFilter'),
  updatePreferences: action('updatePreferences'),
  clearError: action('clearError'),
  reset: action('reset'),
};

// Mock the store hook
jest.mock('../../store/dashboardStore', () => ({
  useDashboardStore: () => mockStore,
}));

const meta = {
  title: 'Components/Dashboard',
  component: Dashboard,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# Dashboard Component

A comprehensive dashboard component with TypeScript, Zustand state management, 
Framer Motion animations, and full accessibility support.

## Features

- **TypeScript**: Fully typed with comprehensive interfaces
- **State Management**: Zustand store with persistent preferences
- **Animations**: Smooth transitions with Framer Motion
- **Accessibility**: WCAG AA compliant with screen reader support
- **Responsive**: Mobile-first design with breakpoint optimization
- **Testing**: Comprehensive test suite with Jest and Testing Library
- **Performance**: Optimized rendering and data handling

## Usage

\`\`\`tsx
import { Dashboard } from './Dashboard';

<Dashboard 
  userId="user-123"
  showNotifications={true}
  refreshInterval={30000}
  onDataUpdate={(data) => console.log('Data updated:', data)}
/>
\`\`\`
        `,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#f8fafc' },
        { name: 'dark', value: '#0f172a' },
      ],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    userId: {
      control: 'text',
      description: 'Unique identifier for the user',
    },
    showNotifications: {
      control: 'boolean',
      description: 'Whether to show the notifications panel',
    },
    refreshInterval: {
      control: { type: 'number', min: 1000, max: 300000, step: 1000 },
      description: 'Auto-refresh interval in milliseconds',
    },
    onDataUpdate: {
      action: 'onDataUpdate',
      description: 'Callback fired when dashboard data updates',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
    'aria-label': {
      control: 'text',
      description: 'Accessible label for the dashboard',
    },
  },
  args: {
    userId: 'story-user-123',
    showNotifications: true,
    refreshInterval: 30000,
    onDataUpdate: action('onDataUpdate'),
  },
} satisfies Meta<typeof Dashboard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default Story
export const Default: Story = {
  args: {},
  decorators: [
    (Story) => {
      // Mock successful data fetch
      mockStore.data = createMockDashboardData();
      mockStore.loading = false;
      mockStore.error = null;
      return <Story />;
    },
  ],
};

// Loading State
export const Loading: Story = {
  args: {},
  decorators: [
    (Story) => {
      mockStore.data = null;
      mockStore.loading = true;
      mockStore.error = null;
      return <Story />;
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'Dashboard in loading state with animated spinner.',
      },
    },
  },
};

// Error State
export const Error: Story = {
  args: {},
  decorators: [
    (Story) => {
      mockStore.data = null;
      mockStore.loading = false;
      mockStore.error = 'Failed to fetch dashboard data. Please check your connection.';
      return <Story />;
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'Dashboard error state with retry functionality.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const retryButton = await canvas.findByRole('button', { name: /try again/i });
    expect(retryButton).toBeInTheDocument();
  },
};

// Empty State
export const Empty: Story = {
  args: {},
  decorators: [
    (Story) => {
      mockStore.data = createEmptyMockData();
      mockStore.loading = false;
      mockStore.error = null;
      return <Story />;
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'Dashboard with empty data - new user experience.',
      },
    },
  },
};

// Without Notifications
export const WithoutNotifications: Story = {
  args: {
    showNotifications: false,
  },
  decorators: [
    (Story) => {
      mockStore.data = createMockDashboardData();
      mockStore.loading = false;
      mockStore.error = null;
      return <Story />;
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'Dashboard without the notifications panel.',
      },
    },
  },
};

// Compact Mode
export const Compact: Story = {
  args: {},
  decorators: [
    (Story) => {
      const data = createMockDashboardData();
      mockStore.data = data;
      mockStore.loading = false;
      mockStore.error = null;
      mockStore.preferences = {
        ...mockStore.preferences,
        compactMode: true,
      };
      return <Story />;
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'Compact dashboard layout for dense information display.',
      },
    },
  },
};

// Dark Theme
export const DarkTheme: Story = {
  args: {},
  decorators: [
    (Story) => {
      mockStore.data = createMockDashboardData();
      mockStore.loading = false;
      mockStore.error = null;
      return (
        <div data-theme="dark" style={{ minHeight: '100vh' }}>
          <Story />
        </div>
      );
    },
  ],
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: 'Dashboard with dark theme styling.',
      },
    },
  },
};

// Large Dataset
export const LargeDataset: Story = {
  args: {},
  decorators: [
    (Story) => {
      mockStore.data = createLargeMockData();
      mockStore.loading = false;
      mockStore.error = null;
      return <Story />;
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'Dashboard handling large datasets efficiently.',
      },
    },
  },
};

// Mobile Viewport
export const Mobile: Story = {
  args: {},
  decorators: [
    (Story) => {
      mockStore.data = createMockDashboardData();
      mockStore.loading = false;
      mockStore.error = null;
      return <Story />;
    },
  ],
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Dashboard optimized for mobile devices.',
      },
    },
  },
};

// Tablet Viewport
export const Tablet: Story = {
  args: {},
  decorators: [
    (Story) => {
      mockStore.data = createMockDashboardData();
      mockStore.loading = false;
      mockStore.error = null;
      return <Story />;
    },
  ],
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: 'Dashboard layout adapted for tablet screens.',
      },
    },
  },
};

// High Contrast
export const HighContrast: Story = {
  args: {},
  decorators: [
    (Story) => {
      mockStore.data = createMockDashboardData();
      mockStore.loading = false;
      mockStore.error = null;
      return (
        <div style={{ filter: 'contrast(150%)' }}>
          <Story />
        </div>
      );
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'Dashboard with high contrast for accessibility.',
      },
    },
  },
};

// Reduced Motion
export const ReducedMotion: Story = {
  args: {},
  decorators: [
    (Story) => {
      mockStore.data = createMockDashboardData();
      mockStore.loading = false;
      mockStore.error = null;
      
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });
      
      return <Story />;
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'Dashboard with reduced motion for accessibility.',
      },
    },
  },
};

// Interactive Testing
export const InteractiveTesting: Story = {
  args: {},
  decorators: [
    (Story) => {
      mockStore.data = createMockDashboardData();
      mockStore.loading = false;
      mockStore.error = null;
      return <Story />;
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Test dashboard renders
    expect(canvas.getByRole('main')).toBeInTheDocument();
    
    // Test stats cards are present
    const statsCards = await canvas.findAllByText(/\$|projects|rating|views/i);
    expect(statsCards.length).toBeGreaterThan(0);
    
    // Test sections are present
    expect(canvas.getByText('Performance Analytics')).toBeInTheDocument();
    expect(canvas.getByText('Recent Activity')).toBeInTheDocument();
    expect(canvas.getByText('Quick Actions')).toBeInTheDocument();
    
    // Test notification interaction if present
    const notificationElements = canvas.queryAllByText(/notification/i);
    if (notificationElements.length > 0) {
      await userEvent.click(notificationElements[0]);
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive testing story with automated play function.',
      },
    },
  },
};

// Accessibility Testing
export const AccessibilityTesting: Story = {
  args: {
    'aria-label': 'Dashboard for accessibility testing',
  },
  decorators: [
    (Story) => {
      mockStore.data = createMockDashboardData();
      mockStore.loading = false;
      mockStore.error = null;
      return <Story />;
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Test ARIA labels
    expect(canvas.getByLabelText('Dashboard for accessibility testing')).toBeInTheDocument();
    
    // Test headings hierarchy
    const headings = canvas.getAllByRole('heading');
    expect(headings.length).toBeGreaterThan(0);
    
    // Test skip links (they should be focusable)
    const skipLinks = canvas.queryAllByText(/skip to/i);
    if (skipLinks.length > 0) {
      skipLinks[0].focus();
      expect(skipLinks[0]).toHaveFocus();
    }
    
    // Test keyboard navigation
    await userEvent.tab();
    expect(document.activeElement).toBeInTheDocument();
  },
  parameters: {
    docs: {
      description: {
        story: 'Dashboard tested for accessibility compliance.',
      },
    },
  },
};

// Performance Testing
export const PerformanceTesting: Story = {
  args: {},
  decorators: [
    (Story) => {
      const startTime = performance.now();
      mockStore.data = createLargeMockData();
      mockStore.loading = false;
      mockStore.error = null;
      
      const result = <Story />;
      const endTime = performance.now();
      
      console.log(`Dashboard render time: ${endTime - startTime}ms`);
      return result;
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'Dashboard performance testing with large dataset.',
      },
    },
  },
};

// Custom Theme
export const CustomTheme: Story = {
  args: {},
  decorators: [
    (Story) => {
      mockStore.data = createMockDashboardData();
      mockStore.loading = false;
      mockStore.error = null;
      
      return (
        <div 
          style={{
            '--dashboard-primary': '#8b5cf6',
            '--dashboard-success': '#10b981',
            '--dashboard-warning': '#f59e0b',
            '--dashboard-danger': '#ef4444',
          } as React.CSSProperties}
        >
          <Story />
        </div>
      );
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'Dashboard with custom color theme using CSS variables.',
      },
    },
  },
};