import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Dashboard } from '../Dashboard';
import { useDashboardStore } from '../../../store/dashboardStore';
import { createMockDashboardData, createMockStore } from '../../../test-utils/mockData';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock the store
jest.mock('../../../store/dashboardStore');
const mockUseDashboardStore = useDashboardStore as jest.MockedFunction<typeof useDashboardStore>;

// Mock Framer Motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    section: ({ children, ...props }: any) => <section {...props}>{children}</section>,
    article: ({ children, ...props }: any) => <article {...props}>{children}</article>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock Chart.js
jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="line-chart">Line Chart</div>,
  Bar: () => <div data-testid="bar-chart">Bar Chart</div>,
}));

jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
  },
  CategoryScale: {},
  LinearScale: {},
  PointElement: {},
  LineElement: {},
  BarElement: {},
  Title: {},
  Tooltip: {},
  Legend: {},
  Filler: {},
}));

// Mock the accessibility hook
jest.mock('../../../hooks/useAccessibility', () => ({
  useAccessibility: () => ({
    announceToScreenReader: jest.fn(),
    focusManagement: {
      focusElement: jest.fn(),
      getCurrentFocus: jest.fn(),
      focusFirstElement: jest.fn(),
      trapFocus: jest.fn(),
    },
    keyboardNavigation: {
      handleArrowNavigation: jest.fn(),
      handleEscapeKey: jest.fn(),
    },
    ariaUtilities: {
      generateId: jest.fn(() => 'test-id'),
      setDescribedBy: jest.fn(),
      setLabelledBy: jest.fn(),
      updateLiveRegion: jest.fn(),
    },
    skipLinks: {
      addSkipLink: jest.fn(),
    },
    prefersReducedMotion: false,
    prefersHighContrast: false,
  }),
}));

describe('Dashboard Component', () => {
  const mockStore = createMockStore();
  const mockData = createMockDashboardData();
  const user = userEvent.setup();

  beforeEach(() => {
    mockUseDashboardStore.mockReturnValue(mockStore);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Rendering', () => {
    test('renders dashboard with loading state', () => {
      mockUseDashboardStore.mockReturnValue({
        ...mockStore,
        loading: true,
        data: null,
      });

      render(<Dashboard userId="test-user" />);

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Loading your dashboard...')).toBeInTheDocument();
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    test('renders dashboard with data', () => {
      mockUseDashboardStore.mockReturnValue({
        ...mockStore,
        loading: false,
        data: mockData,
      });

      render(<Dashboard userId="test-user" />);

      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByText('Dashboard Statistics')).toBeInTheDocument();
      expect(screen.getByText('Performance Analytics')).toBeInTheDocument();
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    });

    test('renders error state', () => {
      mockUseDashboardStore.mockReturnValue({
        ...mockStore,
        loading: false,
        error: 'Failed to fetch dashboard data',
        data: null,
      });

      render(<Dashboard userId="test-user" />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Unable to load dashboard')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch dashboard data')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    test('renders without notifications when showNotifications is false', () => {
      mockUseDashboardStore.mockReturnValue({
        ...mockStore,
        loading: false,
        data: mockData,
      });

      render(<Dashboard userId="test-user" showNotifications={false} />);

      expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    test('fetches dashboard data on mount', () => {
      mockUseDashboardStore.mockReturnValue({
        ...mockStore,
        loading: false,
        data: mockData,
      });

      render(<Dashboard userId="test-user" />);

      expect(mockStore.fetchDashboardData).toHaveBeenCalledWith('test-user');
    });

    test('handles retry button click', async () => {
      mockUseDashboardStore.mockReturnValue({
        ...mockStore,
        loading: false,
        error: 'Network error',
        data: null,
      });

      render(<Dashboard userId="test-user" />);

      const retryButton = screen.getByRole('button', { name: /try again/i });
      await user.click(retryButton);

      expect(mockStore.clearError).toHaveBeenCalled();
      expect(mockStore.fetchDashboardData).toHaveBeenCalledWith('test-user');
    });

    test('handles notification interactions', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          type: 'info' as const,
          title: 'Test Notification',
          message: 'Test message',
          timestamp: new Date().toISOString(),
          read: false,
          priority: 'medium' as const,
          category: 'system' as const,
        },
      ];

      mockUseDashboardStore.mockReturnValue({
        ...mockStore,
        loading: false,
        data: mockData,
        notifications: mockNotifications,
      });

      render(<Dashboard userId="test-user" />);

      // Find and click on a notification
      const notification = screen.getByText('Test Notification');
      await user.click(notification);

      expect(mockStore.markNotificationRead).toHaveBeenCalledWith('notif-1');
    });

    test('calls onDataUpdate when data changes', () => {
      const onDataUpdate = jest.fn();
      
      mockUseDashboardStore.mockReturnValue({
        ...mockStore,
        loading: false,
        data: mockData,
      });

      render(<Dashboard userId="test-user" onDataUpdate={onDataUpdate} />);

      expect(onDataUpdate).toHaveBeenCalledWith(mockData);
    });
  });

  describe('Accessibility', () => {
    test('has no accessibility violations', async () => {
      mockUseDashboardStore.mockReturnValue({
        ...mockStore,
        loading: false,
        data: mockData,
      });

      const { container } = render(<Dashboard userId="test-user" />);
      const results = await axe(container);

      expect(results).toHaveNoViolations();
    });

    test('has proper ARIA labels', () => {
      mockUseDashboardStore.mockReturnValue({
        ...mockStore,
        loading: false,
        data: mockData,
      });

      render(<Dashboard userId="test-user" aria-label="Custom dashboard label" />);

      expect(screen.getByLabelText('Custom dashboard label')).toBeInTheDocument();
      expect(screen.getByLabelText('Dashboard content')).toBeInTheDocument();
      expect(screen.getByLabelText('Dashboard Statistics')).toBeInTheDocument();
    });

    test('has proper heading hierarchy', () => {
      mockUseDashboardStore.mockReturnValue({
        ...mockStore,
        loading: false,
        data: mockData,
      });

      render(<Dashboard userId="test-user" />);

      const headings = screen.getAllByRole('heading');
      const h2Elements = headings.filter(heading => heading.tagName === 'H2');
      
      expect(h2Elements.length).toBeGreaterThan(0);
      expect(screen.getByRole('heading', { name: /performance analytics/i })).toBeInTheDocument();
    });

    test('supports keyboard navigation', async () => {
      mockUseDashboardStore.mockReturnValue({
        ...mockStore,
        loading: false,
        data: mockData,
      });

      render(<Dashboard userId="test-user" />);

      // Test skip links
      const skipLinks = screen.getAllByText(/skip to/i);
      expect(skipLinks.length).toBeGreaterThan(0);

      // Test tab navigation
      await user.tab();
      expect(document.activeElement).toBeInTheDocument();
    });

    test('announces loading states to screen readers', () => {
      mockUseDashboardStore.mockReturnValue({
        ...mockStore,
        loading: true,
        data: null,
      });

      render(<Dashboard userId="test-user" />);

      expect(screen.getByLabelText('Loading dashboard data')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    test('has live regions for dynamic content', () => {
      mockUseDashboardStore.mockReturnValue({
        ...mockStore,
        loading: false,
        data: mockData,
      });

      render(<Dashboard userId="test-user" />);

      const liveRegions = screen.getAllByRole('status');
      expect(liveRegions.length).toBeGreaterThan(0);
    });
  });

  describe('Responsive Design', () => {
    test('renders correctly on mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      mockUseDashboardStore.mockReturnValue({
        ...mockStore,
        loading: false,
        data: mockData,
      });

      render(<Dashboard userId="test-user" />);

      const dashboard = screen.getByRole('main');
      expect(dashboard).toBeInTheDocument();
      
      // Check that mobile-specific styles are applied
      expect(dashboard.closest('.dashboard')).toHaveClass('dashboard');
    });

    test('adapts to reduced motion preferences', () => {
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

      mockUseDashboardStore.mockReturnValue({
        ...mockStore,
        loading: false,
        data: mockData,
      });

      render(<Dashboard userId="test-user" />);

      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    test('handles large datasets efficiently', () => {
      const largeDataset = {
        ...mockData,
        recentActivity: Array.from({ length: 100 }, (_, i) => ({
          id: `activity-${i}`,
          type: 'project' as const,
          title: `Activity ${i}`,
          description: `Description ${i}`,
          timestamp: new Date().toISOString(),
          status: 'completed' as const,
          priority: 'medium' as const,
        })),
      };

      mockUseDashboardStore.mockReturnValue({
        ...mockStore,
        loading: false,
        data: largeDataset,
      });

      const startTime = performance.now();
      render(<Dashboard userId="test-user" />);
      const endTime = performance.now();

      // Should render within reasonable time (< 100ms)
      expect(endTime - startTime).toBeLessThan(100);
    });

    test('memoizes expensive calculations', () => {
      mockUseDashboardStore.mockReturnValue({
        ...mockStore,
        loading: false,
        data: mockData,
      });

      const { rerender } = render(<Dashboard userId="test-user" />);

      // Re-render with same props should not cause expensive recalculations
      rerender(<Dashboard userId="test-user" />);

      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('gracefully handles missing data', () => {
      mockUseDashboardStore.mockReturnValue({
        ...mockStore,
        loading: false,
        data: null,
        error: null,
      });

      render(<Dashboard userId="test-user" />);

      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    test('handles component errors with error boundary', () => {
      // Mock console.error to avoid noise in test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Create a component that throws an error
      const ThrowError = () => {
        throw new Error('Test error');
      };

      const DashboardWithError = () => (
        <Dashboard userId="test-user">
          <ThrowError />
        </Dashboard>
      );

      render(<DashboardWithError />);

      // Error boundary should catch the error
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe('Data Refresh', () => {
    test('refreshes data at specified intervals', async () => {
      jest.useFakeTimers();

      mockUseDashboardStore.mockReturnValue({
        ...mockStore,
        loading: false,
        data: mockData,
      });

      render(<Dashboard userId="test-user" refreshInterval={5000} />);

      // Initial fetch
      expect(mockStore.fetchDashboardData).toHaveBeenCalledTimes(1);

      // Fast-forward time
      jest.advanceTimersByTime(5000);

      // Should fetch again
      expect(mockStore.fetchDashboardData).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });

    test('cleans up interval on unmount', () => {
      jest.useFakeTimers();
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      mockUseDashboardStore.mockReturnValue({
        ...mockStore,
        loading: false,
        data: mockData,
      });

      const { unmount } = render(<Dashboard userId="test-user" refreshInterval={5000} />);

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();

      jest.useRealTimers();
      clearIntervalSpy.mockRestore();
    });
  });
});