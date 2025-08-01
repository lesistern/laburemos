import React from 'react';
import { motion } from 'framer-motion';
import { DashboardLayoutProps } from './types';

/**
 * DashboardLayout Component
 * 
 * Provides the main layout structure for the dashboard with:
 * - Responsive grid layout
 * - Mobile-first design
 * - Semantic HTML structure
 * - Accessibility features
 */
export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  header,
  sidebar,
  footer,
  loading = false,
  className = '',
  'aria-label': ariaLabel = 'Dashboard layout',
  ...props
}) => {
  return (
    <div 
      className={`dashboard-layout ${className}`}
      role="main"
      aria-label={ariaLabel}
      {...props}
    >
      {/* Header Section */}
      {header && (
        <header className="dashboard-layout__header">
          {header}
        </header>
      )}

      {/* Main Content Area */}
      <div className="dashboard-layout__container">
        {/* Sidebar */}
        {sidebar && (
          <aside 
            className="dashboard-layout__sidebar"
            role="complementary"
            aria-label="Dashboard navigation"
          >
            {sidebar}
          </aside>
        )}

        {/* Main Content */}
        <main 
          className="dashboard-layout__main"
          role="main"
          aria-label="Dashboard main content"
        >
          <motion.div
            className="dashboard-layout__content"
            initial={{ opacity: loading ? 0.7 : 1 }}
            animate={{ opacity: loading ? 0.7 : 1 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Footer Section */}
      {footer && (
        <footer className="dashboard-layout__footer">
          {footer}
        </footer>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div 
          className="dashboard-layout__loading-overlay"
          role="status"
          aria-live="polite"
          aria-label="Content loading"
        >
          <div className="dashboard-layout__loading-backdrop" />
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;