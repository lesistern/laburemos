import React from 'react';
import { motion } from 'framer-motion';
import { QuickActionsProps, QuickAction } from './types';

/**
 * QuickActions Component
 * 
 * Displays quick action buttons for common dashboard tasks with:
 * - Keyboard shortcuts
 * - Badge notifications
 * - Disabled states
 * - Multiple layout options
 * - Accessibility features
 */
export const QuickActions: React.FC<QuickActionsProps> = ({
  actions = [],
  onActionClick,
  layout = 'grid',
  showIcons = true,
  showDescriptions = true,
  className = '',
  'aria-label': ariaLabel = 'Quick actions',
  ...props
}) => {
  // Handle action click
  const handleActionClick = (action: QuickAction) => {
    if (action.disabled) return;

    if (action.onClick) {
      action.onClick();
    }

    if (onActionClick) {
      onActionClick(action);
    }

    // Navigate if href is provided
    if (action.href && !action.onClick) {
      window.location.href = action.href;
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent, action: QuickAction) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleActionClick(action);
    }
  };

  // Get action color class
  const getActionColorClass = (color: QuickAction['color']): string => {
    const colorMap = {
      primary: 'quick-action--primary',
      secondary: 'quick-action--secondary',
      success: 'quick-action--success',
      warning: 'quick-action--warning',
      danger: 'quick-action--danger',
    };
    return colorMap[color || 'primary'];
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
  };

  if (actions.length === 0) {
    return (
      <div 
        className={`quick-actions quick-actions--empty ${className}`}
        role="region"
        aria-label={ariaLabel}
        {...props}
      >
        <div className="quick-actions__empty">
          <i className="icon-zap quick-actions__empty-icon" aria-hidden="true" />
          <h3 className="quick-actions__empty-title">No quick actions available</h3>
          <p className="quick-actions__empty-description">
            Quick actions will appear here when available.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`quick-actions quick-actions--${layout} ${className}`}
      role="region"
      aria-label={ariaLabel}
      {...props}
    >
      <motion.div 
        className="quick-actions__container"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {actions.map((action) => {
          const Component = action.href && !action.onClick ? 'a' : 'button';
          
          return (
            <motion.div
              key={action.id}
              className="quick-actions__item-wrapper"
              variants={itemVariants}
              whileHover={{ 
                scale: action.disabled ? 1 : 1.05,
                transition: { duration: 0.2 }
              }}
              whileTap={{ 
                scale: action.disabled ? 1 : 0.95,
                transition: { duration: 0.1 }
              }}
            >
              <Component
                className={`quick-action ${getActionColorClass(action.color)} ${
                  action.disabled ? 'quick-action--disabled' : ''
                } ${layout === 'compact' ? 'quick-action--compact' : ''}`}
                onClick={Component === 'button' ? () => handleActionClick(action) : undefined}
                onKeyDown={(e) => handleKeyDown(e, action)}
                href={Component === 'a' ? action.href : undefined}
                disabled={Component === 'button' ? action.disabled : undefined}
                aria-disabled={action.disabled}
                aria-describedby={showDescriptions ? `action-${action.id}-desc` : undefined}
                title={action.shortcut ? `${action.label} (${action.shortcut})` : action.label}
                role={Component === 'a' ? 'button' : undefined}
              >
                <div className="quick-action__content">
                  {/* Icon */}
                  {showIcons && (
                    <div 
                      className="quick-action__icon"
                      role="img"
                      aria-label={`${action.label} icon`}
                    >
                      <i className={`icon-${action.icon}`} />
                      
                      {/* Badge */}
                      {action.badge && action.badge > 0 && (
                        <span 
                          className="quick-action__badge"
                          aria-label={`${action.badge} notifications`}
                        >
                          {action.badge > 99 ? '99+' : action.badge}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Text Content */}
                  <div className="quick-action__text">
                    <span className="quick-action__label">
                      {action.label}
                    </span>
                    
                    {showDescriptions && action.description && (
                      <span 
                        id={`action-${action.id}-desc`}
                        className="quick-action__description"
                      >
                        {action.description}
                      </span>
                    )}
                  </div>

                  {/* Keyboard Shortcut */}
                  {action.shortcut && (
                    <div className="quick-action__shortcut">
                      <kbd className="quick-action__kbd">
                        {action.shortcut}
                      </kbd>
                    </div>
                  )}

                  {/* External Link Indicator */}
                  {action.href && action.href.startsWith('http') && (
                    <i 
                      className="icon-external-link quick-action__external"
                      aria-label="Opens in new window"
                    />
                  )}
                </div>

                {/* Ripple Effect */}
                <div className="quick-action__ripple" />

                {/* Loading State */}
                {action.disabled && (
                  <div 
                    className="quick-action__loading"
                    role="status"
                    aria-hidden="true"
                  >
                    <div className="quick-action__spinner" />
                  </div>
                )}
              </Component>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Keyboard Shortcuts Legend */}
      {actions.some(action => action.shortcut) && (
        <div className="quick-actions__shortcuts">
          <details className="quick-actions__shortcuts-details">
            <summary className="quick-actions__shortcuts-summary">
              Keyboard Shortcuts
              <i className="icon-keyboard" aria-hidden="true" />
            </summary>
            <div className="quick-actions__shortcuts-content">
              <h4 className="quick-actions__shortcuts-title">Available Shortcuts</h4>
              <dl className="quick-actions__shortcuts-list">
                {actions
                  .filter(action => action.shortcut && !action.disabled)
                  .map(action => (
                    <div key={action.id} className="quick-actions__shortcut-item">
                      <dt className="quick-actions__shortcut-key">
                        <kbd>{action.shortcut}</kbd>
                      </dt>
                      <dd className="quick-actions__shortcut-desc">
                        {action.label}
                      </dd>
                    </div>
                  ))}
              </dl>
            </div>
          </details>
        </div>
      )}

      {/* Screen Reader Summary */}
      <div className="sr-only">
        <h3>Quick Actions Summary</h3>
        <p>
          {actions.length} quick actions available.
          {actions.filter(a => a.disabled).length > 0 && 
            ` ${actions.filter(a => a.disabled).length} actions are currently disabled.`
          }
        </p>
        <ul>
          {actions.map(action => (
            <li key={action.id}>
              {action.label}
              {action.disabled && ' (disabled)'}
              {action.badge && action.badge > 0 && ` (${action.badge} notifications)`}
              {action.shortcut && ` - Shortcut: ${action.shortcut}`}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default QuickActions;