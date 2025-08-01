import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RecentActivityProps, Activity } from './types';

/**
 * RecentActivity Component
 * 
 * Displays recent user activities with:
 * - Filterable activity types
 * - Expandable details
 * - Time formatting
 * - Status indicators
 * - Accessibility features
 */
export const RecentActivity: React.FC<RecentActivityProps> = ({
  activities = [],
  loading = false,
  maxItems = 10,
  showAll = false,
  onActivityClick,
  filter = [],
  className = '',
  'aria-label': ariaLabel = 'Recent activity',
  ...props
}) => {
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);
  const [showAllActivities, setShowAllActivities] = useState(showAll);

  // Filter and limit activities
  const filteredActivities = useMemo(() => {
    let filtered = activities;

    // Apply type filter
    if (filter.length > 0) {
      filtered = filtered.filter(activity => filter.includes(activity.type));
    }

    // Sort by timestamp (newest first)
    filtered = filtered.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Limit items if not showing all
    if (!showAllActivities && maxItems > 0) {
      filtered = filtered.slice(0, maxItems);
    }

    return filtered;
  }, [activities, filter, showAllActivities, maxItems]);

  // Format relative time
  const formatRelativeTime = (timestamp: string): string => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - activityTime.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    } else {
      return activityTime.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: activityTime.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get activity icon
  const getActivityIcon = (type: Activity['type']): string => {
    const iconMap = {
      project: 'briefcase',
      payment: 'dollar-sign',
      review: 'star',
      message: 'message-circle',
      profile: 'user',
    };
    return iconMap[type];
  };

  // Get activity color
  const getActivityColor = (type: Activity['type'], status: Activity['status']): string => {
    if (status === 'cancelled') return 'danger';
    
    const colorMap = {
      project: 'primary',
      payment: 'success',
      review: 'warning',
      message: 'info',
      profile: 'secondary',
    };
    return colorMap[type];
  };

  // Get status indicator
  const getStatusIndicator = (status: Activity['status']) => {
    const statusMap = {
      completed: { icon: 'check-circle', color: 'success', label: 'Completed' },
      pending: { icon: 'clock', color: 'warning', label: 'Pending' },
      'in-progress': { icon: 'play-circle', color: 'info', label: 'In Progress' },
      cancelled: { icon: 'x-circle', color: 'danger', label: 'Cancelled' },
    };
    return statusMap[status];
  };

  // Handle activity click
  const handleActivityClick = (activity: Activity) => {
    if (onActivityClick) {
      onActivityClick(activity);
    }
    
    // Toggle expanded state
    setExpandedActivity(expandedActivity === activity.id ? null : activity.id);
  };

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent, activity: Activity) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleActivityClick(activity);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      x: -20,
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
      x: 20,
      scale: 0.95,
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
      marginTop: 12,
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

  if (loading) {
    return (
      <div 
        className={`recent-activity recent-activity--loading ${className}`}
        role="status"
        aria-live="polite"
        aria-label="Loading recent activities"
        {...props}
      >
        <motion.div 
          className="recent-activity__list"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {Array.from({ length: 5 }).map((_, index) => (
            <motion.div
              key={`skeleton-${index}`}
              className="recent-activity__item recent-activity__item--skeleton"
              variants={itemVariants}
            >
              <div className="recent-activity__skeleton-icon" />
              <div className="recent-activity__skeleton-content">
                <div className="recent-activity__skeleton-title" />
                <div className="recent-activity__skeleton-description" />
                <div className="recent-activity__skeleton-time" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    );
  }

  if (filteredActivities.length === 0) {
    return (
      <div 
        className={`recent-activity recent-activity--empty ${className}`}
        role="status"
        aria-live="polite"
        {...props}
      >
        <div className="recent-activity__empty">
          <i className="icon-activity recent-activity__empty-icon" aria-hidden="true" />
          <h3 className="recent-activity__empty-title">No recent activity</h3>
          <p className="recent-activity__empty-description">
            Your recent activities will appear here once you start using the platform.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`recent-activity ${className}`}
      role="region"
      aria-label={ariaLabel}
      {...props}
    >
      <motion.div 
        className="recent-activity__list"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence>
          {filteredActivities.map((activity) => {
            const statusInfo = getStatusIndicator(activity.status);
            const isExpanded = expandedActivity === activity.id;

            return (
              <motion.article
                key={activity.id}
                className={`recent-activity__item recent-activity__item--${getActivityColor(activity.type, activity.status)} ${
                  activity.priority === 'high' ? 'recent-activity__item--high-priority' : ''
                }`}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                aria-describedby={`activity-${activity.id}-details`}
                onClick={() => handleActivityClick(activity)}
                onKeyDown={(e) => handleKeyDown(e, activity)}
              >
                <div className="recent-activity__item-content">
                  {/* Icon */}
                  <div 
                    className="recent-activity__icon"
                    role="img"
                    aria-label={`${activity.type} activity`}
                  >
                    <i className={`icon-${getActivityIcon(activity.type)}`} />
                  </div>

                  {/* Main Content */}
                  <div className="recent-activity__content">
                    <div className="recent-activity__header">
                      <h4 className="recent-activity__title">
                        {activity.title}
                      </h4>
                      
                      {/* Status Badge */}
                      <span 
                        className={`recent-activity__status recent-activity__status--${statusInfo.color}`}
                        aria-label={`Status: ${statusInfo.label}`}
                      >
                        <i 
                          className={`icon-${statusInfo.icon}`} 
                          aria-hidden="true"
                        />
                        <span className="sr-only">{statusInfo.label}</span>
                      </span>
                    </div>

                    <p className="recent-activity__description">
                      {activity.description}
                    </p>

                    <div className="recent-activity__meta">
                      <time 
                        className="recent-activity__time"
                        dateTime={activity.timestamp}
                        title={new Date(activity.timestamp).toLocaleString()}
                      >
                        {formatRelativeTime(activity.timestamp)}
                      </time>

                      {activity.amount && (
                        <span className="recent-activity__amount">
                          {formatCurrency(activity.amount)}
                        </span>
                      )}

                      {activity.clientName && (
                        <span className="recent-activity__client">
                          by {activity.clientName}
                        </span>
                      )}

                      {activity.rating && (
                        <span 
                          className="recent-activity__rating"
                          aria-label={`Rating: ${activity.rating} out of 5 stars`}
                        >
                          <i className="icon-star" aria-hidden="true" />
                          {activity.rating}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expand Indicator */}
                  <div className="recent-activity__expand">
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
                      id={`activity-${activity.id}-details`}
                      className="recent-activity__details"
                      variants={expandedVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      <div className="recent-activity__details-content">
                        {activity.projectId && (
                          <p>Project ID: {activity.projectId}</p>
                        )}
                        
                        <p>
                          <strong>Type:</strong> {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                        </p>
                        
                        <p>
                          <strong>Priority:</strong> {activity.priority?.charAt(0).toUpperCase() + activity.priority?.slice(1) || 'Normal'}
                        </p>
                        
                        <p>
                          <strong>Full Date:</strong> {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.article>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Show More/Less Button */}
      {activities.length > maxItems && (
        <div className="recent-activity__controls">
          <button
            className="recent-activity__show-more"
            onClick={() => setShowAllActivities(!showAllActivities)}
            aria-expanded={showAllActivities}
            aria-label={showAllActivities ? 'Show less activities' : 'Show all activities'}
          >
            {showAllActivities ? (
              <>
                Show Less
                <i className="icon-chevron-up" aria-hidden="true" />
              </>
            ) : (
              <>
                Show All ({activities.length - maxItems} more)
                <i className="icon-chevron-down" aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      )}

      {/* Screen Reader Summary */}
      <div className="sr-only">
        <h3>Activity Summary</h3>
        <p>
          Showing {filteredActivities.length} of {activities.length} activities.
          {filter.length > 0 && ` Filtered by: ${filter.join(', ')}.`}
        </p>
      </div>
    </div>
  );
};

export default RecentActivity;