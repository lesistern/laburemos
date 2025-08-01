import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationPanelProps, Notification } from './types';

/**
 * NotificationPanel Component
 * 
 * Displays user notifications with:
 * - Category filtering
 * - Mark as read functionality
 * - Priority indicators
 * - Expandable content
 * - Real-time updates
 * - Accessibility features
 */
export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onNotificationClick,
  maxItems = 10,
  showCategories = true,
  filter = [],
  className = '',
  'aria-label': ariaLabel = 'Notifications',
  ...props
}) => {
  const [expandedNotification, setExpandedNotification] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<Notification['category'] | 'all'>('all');
  const [showAll, setShowAll] = useState(false);

  // Filter and sort notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    // Apply category filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(notification => notification.category === activeFilter);
    }

    // Apply prop filter if provided
    if (filter.length > 0) {
      filtered = filtered.filter(notification => filter.includes(notification.category));
    }

    // Sort by priority and timestamp
    filtered = filtered.sort((a, b) => {
      // First sort by read status (unread first)
      if (a.read !== b.read) {
        return a.read ? 1 : -1;
      }

      // Then by priority
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      // Finally by timestamp (newest first)
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    // Limit items if not showing all
    if (!showAll && maxItems > 0) {
      filtered = filtered.slice(0, maxItems);
    }

    return filtered;
  }, [notifications, activeFilter, filter, showAll, maxItems]);

  // Get notification categories with counts
  const categories = useMemo(() => {
    const categoryCount = notifications.reduce((acc, notification) => {
      acc[notification.category] = (acc[notification.category] || 0) + 1;
      return acc;
    }, {} as Record<Notification['category'], number>);

    return [
      { value: 'all', label: 'All', count: notifications.length },
      { value: 'system', label: 'System', count: categoryCount.system || 0 },
      { value: 'project', label: 'Projects', count: categoryCount.project || 0 },
      { value: 'payment', label: 'Payments', count: categoryCount.payment || 0 },
      { value: 'review', label: 'Reviews', count: categoryCount.review || 0 },
      { value: 'message', label: 'Messages', count: categoryCount.message || 0 },
    ] as const;
  }, [notifications]);

  // Get unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Format relative time
  const formatRelativeTime = (timestamp: string): string => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - notificationTime.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  };

  // Get notification icon
  const getNotificationIcon = (type: Notification['type'], category: Notification['category']): string => {
    if (type === 'error') return 'alert-circle';
    if (type === 'warning') return 'alert-triangle';
    if (type === 'success') return 'check-circle';

    const categoryIcons = {
      system: 'settings',
      project: 'briefcase',
      payment: 'dollar-sign',
      review: 'star',
      message: 'message-circle',
    };

    return categoryIcons[category] || 'bell';
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      onMarkRead(notification.id);
    }

    if (onNotificationClick) {
      onNotificationClick(notification);
    }

    // Toggle expanded state
    setExpandedNotification(
      expandedNotification === notification.id ? null : notification.id
    );
  };

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent, notification: Notification) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleNotificationClick(notification);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03,
      },
    },
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      x: 20,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      x: -20,
      scale: 0.95,
      height: 0,
      marginBottom: 0,
      transition: {
        duration: 0.2,
      },
    },
  };

  const expandedVariants = {
    hidden: { 
      height: 0, 
      opacity: 0,
      marginTop: 0,
    },
    visible: {
      height: 'auto',
      opacity: 1,
      marginTop: 8,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
    exit: {
      height: 0,
      opacity: 0,
      marginTop: 0,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <div 
      className={`notification-panel ${className}`}
      role="region"
      aria-label={ariaLabel}
      {...props}
    >
      {/* Header */}
      <div className="notification-panel__header">
        <div className="notification-panel__title-section">
          <h3 className="notification-panel__title">
            Notifications
            {unreadCount > 0 && (
              <span 
                className="notification-panel__badge"
                aria-label={`${unreadCount} unread notifications`}
              >
                {unreadCount}
              </span>
            )}
          </h3>
        </div>

        {/* Actions */}
        <div className="notification-panel__actions">
          {unreadCount > 0 && onMarkAllRead && (
            <button
              className="notification-panel__mark-all-read"
              onClick={onMarkAllRead}
              aria-label="Mark all notifications as read"
              title="Mark all as read"
            >
              <i className="icon-check-circle" aria-hidden="true" />
              <span className="sr-only">Mark all as read</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Filters */}
      {showCategories && (
        <div 
          className="notification-panel__filters"
          role="tablist"
          aria-label="Notification categories"
        >
          {categories.map((category) => (
            <button
              key={category.value}
              className={`notification-panel__filter ${
                activeFilter === category.value ? 'notification-panel__filter--active' : ''
              }`}
              onClick={() => setActiveFilter(category.value)}
              role="tab"
              aria-selected={activeFilter === category.value}
              aria-controls="notification-list"
              disabled={category.count === 0}
            >
              {category.label}
              {category.count > 0 && (
                <span className="notification-panel__filter-count">
                  {category.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Notifications List */}
      <div 
        id="notification-list"
        className="notification-panel__list"
        role="tabpanel"
        aria-label={`${activeFilter} notifications`}
      >
        {filteredNotifications.length === 0 ? (
          <div className="notification-panel__empty">
            <i className="icon-bell-off notification-panel__empty-icon" aria-hidden="true" />
            <h4 className="notification-panel__empty-title">No notifications</h4>
            <p className="notification-panel__empty-description">
              {activeFilter === 'all' 
                ? 'You have no notifications at the moment.'
                : `No ${activeFilter} notifications found.`
              }
            </p>
          </div>
        ) : (
          <motion.div
            className="notification-panel__items"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence>
              {filteredNotifications.map((notification) => {
                const isExpanded = expandedNotification === notification.id;

                return (
                  <motion.article
                    key={notification.id}
                    className={`notification-item notification-item--${notification.type} notification-item--${notification.priority} ${
                      !notification.read ? 'notification-item--unread' : ''
                    }`}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    whileHover={{ scale: 1.01 }}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                    aria-describedby={`notification-${notification.id}-details`}
                    onClick={() => handleNotificationClick(notification)}
                    onKeyDown={(e) => handleKeyDown(e, notification)}
                  >
                    <div className="notification-item__content">
                      {/* Icon & Avatar */}
                      <div className="notification-item__media">
                        {notification.avatar ? (
                          <img
                            src={notification.avatar}
                            alt={`${notification.clientName || 'User'} avatar`}
                            className="notification-item__avatar"
                          />
                        ) : (
                          <div 
                            className="notification-item__icon"
                            role="img"
                            aria-label={`${notification.type} notification`}
                          >
                            <i className={`icon-${getNotificationIcon(notification.type, notification.category)}`} />
                          </div>
                        )}
                        
                        {/* Unread Indicator */}
                        {!notification.read && (
                          <div 
                            className="notification-item__unread-dot"
                            aria-label="Unread"
                          />
                        )}
                      </div>

                      {/* Main Content */}
                      <div className="notification-item__main">
                        <div className="notification-item__header">
                          <h4 className="notification-item__title">
                            {notification.title}
                          </h4>
                          
                          <time 
                            className="notification-item__time"
                            dateTime={notification.timestamp}
                            title={new Date(notification.timestamp).toLocaleString()}
                          >
                            {formatRelativeTime(notification.timestamp)}
                          </time>
                        </div>

                        <p className="notification-item__message">
                          {notification.message}
                        </p>

                        {/* Client Name */}
                        {notification.clientName && (
                          <span className="notification-item__client">
                            from {notification.clientName}
                          </span>
                        )}

                        {/* Action Button */}
                        {notification.actionUrl && notification.actionLabel && (
                          <div className="notification-item__actions">
                            <a
                              href={notification.actionUrl}
                              className="notification-item__action"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {notification.actionLabel}
                              <i className="icon-arrow-right" aria-hidden="true" />
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Priority Indicator */}
                      {notification.priority === 'high' && (
                        <div 
                          className="notification-item__priority"
                          aria-label="High priority"
                          title="High priority notification"
                        >
                          <i className="icon-alert-circle" />
                        </div>
                      )}

                      {/* Expand Indicator */}
                      <div className="notification-item__expand">
                        <i 
                          className={`icon-chevron-${isExpanded ? 'up' : 'down'}`}
                          aria-hidden="true"
                        />
                      </div>
                    </div>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          id={`notification-${notification.id}-details`}
                          className="notification-item__details"
                          variants={expandedVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                        >
                          <div className="notification-item__details-content">
                            <p>
                              <strong>Category:</strong> {notification.category}
                            </p>
                            <p>
                              <strong>Priority:</strong> {notification.priority}
                            </p>
                            <p>
                              <strong>Full Date:</strong> {new Date(notification.timestamp).toLocaleString()}
                            </p>
                            {!notification.read && (
                              <button
                                className="notification-item__mark-read"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onMarkRead(notification.id);
                                }}
                                aria-label="Mark this notification as read"
                              >
                                Mark as Read
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Show More/Less Button */}
      {notifications.length > maxItems && (
        <div className="notification-panel__controls">
          <button
            className="notification-panel__show-more"
            onClick={() => setShowAll(!showAll)}
            aria-expanded={showAll}
            aria-label={showAll ? 'Show less notifications' : 'Show all notifications'}
          >
            {showAll ? (
              <>
                Show Less
                <i className="icon-chevron-up" aria-hidden="true" />
              </>
            ) : (
              <>
                Show All ({notifications.length - maxItems} more)
                <i className="icon-chevron-down" aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      )}

      {/* Screen Reader Summary */}
      <div className="sr-only">
        <h3>Notifications Summary</h3>
        <p>
          {filteredNotifications.length} notifications shown.
          {unreadCount > 0 && ` ${unreadCount} unread.`}
          {activeFilter !== 'all' && ` Filtered by ${activeFilter}.`}
        </p>
      </div>
    </div>
  );
};

export default NotificationPanel;