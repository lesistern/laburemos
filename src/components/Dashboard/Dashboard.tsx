import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboardStore } from '../../store/dashboardStore';
import { DashboardLayout } from './DashboardLayout';
import { StatsCards } from './StatsCards';
import { ChartSection } from './ChartSection';
import { RecentActivity } from './RecentActivity';
import { QuickActions } from './QuickActions';
import { NotificationPanel } from './NotificationPanel';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import { ErrorBoundary } from '../UI/ErrorBoundary';
import { useAccessibility } from '../../hooks/useAccessibility';
import { DashboardProps, DashboardData } from './types';

/**
 * Dashboard Component
 * 
 * A comprehensive dashboard component with:
 * - TypeScript strict typing
 * - Zustand state management
 * - Framer Motion animations
 * - Full accessibility (WCAG AA)
 * - Mobile-first responsive design
 * - Error boundaries and loading states
 */
export const Dashboard: React.FC<DashboardProps> = ({
  userId,
  className = '',
  showNotifications = true,
  refreshInterval = 30000,
  onDataUpdate,
  'aria-label': ariaLabel = 'User Dashboard',
  ...props
}) => {
  const {
    data,
    loading,
    error,
    notifications,
    fetchDashboardData,
    clearError,
    markNotificationRead
  } = useDashboardStore();

  const { announceToScreenReader, focusManagement } = useAccessibility();

  // Fetch dashboard data on mount and set up refresh interval
  useEffect(() => {
    fetchDashboardData(userId);
    
    const interval = setInterval(() => {
      fetchDashboardData(userId);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [userId, refreshInterval, fetchDashboardData]);

  // Handle data updates
  useEffect(() => {
    if (data && onDataUpdate) {
      onDataUpdate(data);
    }
  }, [data, onDataUpdate]);

  // Announce updates to screen readers
  useEffect(() => {
    if (data && !loading) {
      announceToScreenReader('Dashboard data updated');
    }
  }, [data, loading, announceToScreenReader]);

  const handleRetry = useCallback(() => {
    clearError();
    fetchDashboardData(userId);
    announceToScreenReader('Retrying dashboard data fetch');
  }, [userId, clearError, fetchDashboardData, announceToScreenReader]);

  const handleNotificationRead = useCallback((notificationId: string) => {
    markNotificationRead(notificationId);
    announceToScreenReader('Notification marked as read');
  }, [markNotificationRead, announceToScreenReader]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
        staggerChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut' }
    }
  };

  if (error) {
    return (
      <motion.div
        className={`dashboard dashboard--error ${className}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        role="alert"
        aria-live="assertive"
        {...props}
      >
        <div className="dashboard__error">
          <h2 className="dashboard__error-title">
            Unable to load dashboard
          </h2>
          <p className="dashboard__error-message">{error}</p>
          <button
            className="dashboard__retry-button"
            onClick={handleRetry}
            aria-label="Retry loading dashboard data"
          >
            Try Again
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <ErrorBoundary>
      <DashboardLayout className={className} aria-label={ariaLabel} {...props}>
        <AnimatePresence mode="wait">
          {loading && !data ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="dashboard__loading"
              role="status"
              aria-live="polite"
              aria-label="Loading dashboard data"
            >
              <LoadingSpinner size="large" />
              <p className="dashboard__loading-text">Loading your dashboard...</p>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              className="dashboard__content"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              role="main"
              aria-label="Dashboard content"
            >
              {/* Stats Cards Section */}
              <motion.section
                className="dashboard__section dashboard__section--stats"
                variants={itemVariants}
                aria-labelledby="stats-heading"
              >
                <h2 id="stats-heading" className="dashboard__section-title sr-only">
                  Dashboard Statistics
                </h2>
                <StatsCards 
                  data={data?.stats}
                  loading={loading}
                  animate={true}
                />
              </motion.section>

              {/* Charts Section */}
              <motion.section
                className="dashboard__section dashboard__section--charts"
                variants={itemVariants}
                aria-labelledby="charts-heading"
              >
                <h2 id="charts-heading" className="dashboard__section-title">
                  Performance Analytics
                </h2>
                <ChartSection 
                  data={data?.charts}
                  loading={loading}
                  className="dashboard__charts"
                />
              </motion.section>

              {/* Main Content Grid */}
              <div className="dashboard__grid">
                {/* Recent Activity */}
                <motion.section
                  className="dashboard__section dashboard__section--activity"
                  variants={itemVariants}
                  aria-labelledby="activity-heading"
                >
                  <h2 id="activity-heading" className="dashboard__section-title">
                    Recent Activity
                  </h2>
                  <RecentActivity 
                    activities={data?.recentActivity}
                    loading={loading}
                    maxItems={10}
                  />
                </motion.section>

                {/* Quick Actions */}
                <motion.section
                  className="dashboard__section dashboard__section--actions"
                  variants={itemVariants}
                  aria-labelledby="actions-heading"
                >
                  <h2 id="actions-heading" className="dashboard__section-title">
                    Quick Actions
                  </h2>
                  <QuickActions 
                    actions={data?.quickActions}
                    onActionClick={(action) => {
                      announceToScreenReader(`${action.label} selected`);
                    }}
                  />
                </motion.section>

                {/* Notifications Panel */}
                {showNotifications && (
                  <motion.section
                    className="dashboard__section dashboard__section--notifications"
                    variants={itemVariants}
                    aria-labelledby="notifications-heading"
                  >
                    <h2 id="notifications-heading" className="dashboard__section-title">
                      Notifications
                      {notifications.filter(n => !n.read).length > 0 && (
                        <span 
                          className="dashboard__notification-badge"
                          aria-label={`${notifications.filter(n => !n.read).length} unread notifications`}
                        >
                          {notifications.filter(n => !n.read).length}
                        </span>
                      )}
                    </h2>
                    <NotificationPanel
                      notifications={notifications}
                      onMarkRead={handleNotificationRead}
                      onMarkAllRead={() => {
                        notifications.forEach(n => markNotificationRead(n.id));
                        announceToScreenReader('All notifications marked as read');
                      }}
                    />
                  </motion.section>
                )}
              </div>

              {/* Loading Overlay for Updates */}
              <AnimatePresence>
                {loading && data && (
                  <motion.div
                    className="dashboard__loading-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    role="status"
                    aria-live="polite"
                    aria-label="Updating dashboard data"
                  >
                    <div className="dashboard__loading-overlay-content">
                      <LoadingSpinner size="small" />
                      <span>Updating...</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skip Links for Accessibility */}
        <div className="dashboard__skip-links">
          <a 
            href="#stats-heading" 
            className="dashboard__skip-link"
            onClick={(e) => focusManagement.focusElement('#stats-heading')}
          >
            Skip to statistics
          </a>
          <a 
            href="#charts-heading" 
            className="dashboard__skip-link"
            onClick={(e) => focusManagement.focusElement('#charts-heading')}
          >
            Skip to charts
          </a>
          <a 
            href="#activity-heading" 
            className="dashboard__skip-link"
            onClick={(e) => focusManagement.focusElement('#activity-heading')}
          >
            Skip to recent activity
          </a>
        </div>
      </DashboardLayout>
    </ErrorBoundary>
  );
};

// Export for Storybook
export default Dashboard;