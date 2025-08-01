import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { StatsCardsProps, DashboardStats } from './types';

interface StatCard {
  id: string;
  title: string;
  value: string | number;
  previousValue?: string | number;
  growth?: number;
  icon: string;
  color: 'primary' | 'success' | 'warning' | 'info';
  format: 'currency' | 'number' | 'percentage' | 'text';
  ariaLabel: string;
}

/**
 * StatsCards Component
 * 
 * Displays key dashboard statistics in an accessible card grid with:
 * - Animated transitions
 * - Growth indicators
 * - Loading states
 * - Responsive design
 * - Screen reader support
 */
export const StatsCards: React.FC<StatsCardsProps> = ({
  data,
  loading = false,
  animate = true,
  compact = false,
  showGrowth = true,
  className = '',
  'aria-label': ariaLabel = 'Dashboard statistics',
  ...props
}) => {
  // Format currency values
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format number values
  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  // Format percentage values
  const formatPercentage = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  // Calculate growth percentage
  const calculateGrowth = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Generate stat cards from data
  const statCards: StatCard[] = useMemo(() => {
    if (!data) return [];

    return [
      {
        id: 'total-earnings',
        title: 'Total Earnings',
        value: data.totalEarnings,
        previousValue: data.lastMonthEarnings,
        growth: data.earningsGrowth,
        icon: 'dollar-sign',
        color: 'success',
        format: 'currency',
        ariaLabel: `Total earnings: ${formatCurrency(data.totalEarnings)}`,
      },
      {
        id: 'active-projects',
        title: 'Active Projects',
        value: data.activeProjects,
        growth: data.projectsGrowth,
        icon: 'briefcase',
        color: 'primary',
        format: 'number',
        ariaLabel: `Active projects: ${data.activeProjects}`,
      },
      {
        id: 'completed-projects',
        title: 'Completed Projects',
        value: data.completedProjects,
        icon: 'check-circle',
        color: 'info',
        format: 'number',
        ariaLabel: `Completed projects: ${data.completedProjects}`,
      },
      {
        id: 'average-rating',
        title: 'Average Rating',
        value: data.averageRating,
        icon: 'star',
        color: 'warning',
        format: 'number',
        ariaLabel: `Average rating: ${data.averageRating} out of 5 stars`,
      },
      {
        id: 'response-time',
        title: 'Response Time',
        value: data.responseTime,
        icon: 'clock',
        color: 'info',
        format: 'text',
        ariaLabel: `Average response time: ${data.responseTime}`,
      },
      {
        id: 'profile-views',
        title: 'Profile Views',
        value: data.profileViews,
        growth: data.viewsGrowth,
        icon: 'eye',
        color: 'primary',
        format: 'number',
        ariaLabel: `Profile views: ${formatNumber(data.profileViews)}`,
      },
      {
        id: 'pending-payments',
        title: 'Pending Payments',
        value: data.pendingPayments,
        icon: 'credit-card',
        color: 'warning',
        format: 'currency',
        ariaLabel: `Pending payments: ${formatCurrency(data.pendingPayments)}`,
      },
      {
        id: 'this-month-earnings',
        title: 'This Month',
        value: data.thisMonthEarnings,
        previousValue: data.lastMonthEarnings,
        growth: calculateGrowth(data.thisMonthEarnings, data.lastMonthEarnings),
        icon: 'trending-up',
        color: 'success',
        format: 'currency',
        ariaLabel: `This month earnings: ${formatCurrency(data.thisMonthEarnings)}`,
      },
    ];
  }, [data]);

  // Format value based on type
  const formatValue = (value: string | number, format: StatCard['format']): string => {
    if (typeof value === 'string') return value;
    
    switch (format) {
      case 'currency':
        return formatCurrency(value);
      case 'number':
        return formatNumber(value);
      case 'percentage':
        return formatPercentage(value);
      default:
        return value.toString();
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const cardVariants = {
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
        duration: 0.4,
        ease: 'easeOut',
      },
    },
    hover: {
      y: -5,
      scale: 1.02,
      transition: {
        duration: 0.2,
        ease: 'easeOut',
      },
    },
  };

  const skeletonVariants = {
    loading: {
      opacity: [0.6, 1, 0.6],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  if (loading && !data) {
    return (
      <div 
        className={`stats-cards stats-cards--loading ${compact ? 'stats-cards--compact' : ''} ${className}`}
        role="status"
        aria-live="polite"
        aria-label="Loading statistics"
        {...props}
      >
        <motion.div 
          className="stats-cards__grid"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {Array.from({ length: 8 }).map((_, index) => (
            <motion.div
              key={`skeleton-${index}`}
              className="stats-card stats-card--skeleton"
              variants={cardVariants}
            >
              <div className="stats-card__content">
                <motion.div 
                  className="stats-card__icon-skeleton"
                  variants={skeletonVariants}
                  animate="loading"
                />
                <div className="stats-card__text">
                  <motion.div 
                    className="stats-card__title-skeleton"
                    variants={skeletonVariants}
                    animate="loading"
                  />
                  <motion.div 
                    className="stats-card__value-skeleton"
                    variants={skeletonVariants}
                    animate="loading"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    );
  }

  return (
    <div 
      className={`stats-cards ${compact ? 'stats-cards--compact' : ''} ${className}`}
      role="region"
      aria-label={ariaLabel}
      {...props}
    >
      <motion.div 
        className="stats-cards__grid"
        variants={animate ? containerVariants : undefined}
        initial={animate ? 'hidden' : undefined}
        animate={animate ? 'visible' : undefined}
      >
        {statCards.map((card) => (
          <motion.div
            key={card.id}
            className={`stats-card stats-card--${card.color}`}
            variants={animate ? cardVariants : undefined}
            whileHover={animate ? 'hover' : undefined}
            role="article"
            aria-label={card.ariaLabel}
            tabIndex={0}
          >
            <div className="stats-card__content">
              {/* Icon */}
              <div 
                className="stats-card__icon"
                role="img"
                aria-hidden="true"
              >
                <i className={`icon-${card.icon}`} />
              </div>

              {/* Text Content */}
              <div className="stats-card__text">
                <h3 className="stats-card__title">
                  {card.title}
                </h3>
                
                <div className="stats-card__value-container">
                  <span className="stats-card__value">
                    {formatValue(card.value, card.format)}
                  </span>
                  
                  {/* Growth Indicator */}
                  {showGrowth && card.growth !== undefined && (
                    <span 
                      className={`stats-card__growth ${
                        card.growth >= 0 ? 'stats-card__growth--positive' : 'stats-card__growth--negative'
                      }`}
                      aria-label={`Growth: ${formatPercentage(card.growth)}`}
                    >
                      <i 
                        className={`icon-${card.growth >= 0 ? 'trending-up' : 'trending-down'}`}
                        aria-hidden="true"
                      />
                      {formatPercentage(Math.abs(card.growth))}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Progress Bar for Certain Cards */}
            {card.id === 'average-rating' && typeof card.value === 'number' && (
              <div 
                className="stats-card__progress"
                role="progressbar"
                aria-valuenow={card.value}
                aria-valuemin={0}
                aria-valuemax={5}
                aria-label={`Rating progress: ${card.value} out of 5`}
              >
                <div 
                  className="stats-card__progress-fill"
                  style={{ width: `${(card.value / 5) * 100}%` }}
                />
              </div>
            )}

            {/* Loading Overlay */}
            {loading && (
              <div 
                className="stats-card__loading-overlay"
                role="status"
                aria-hidden="true"
              >
                <div className="stats-card__loading-spinner" />
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* Screen Reader Summary */}
      <div className="sr-only">
        <h2>Statistics Summary</h2>
        <ul>
          {statCards.map((card) => (
            <li key={card.id}>
              {card.title}: {formatValue(card.value, card.format)}
              {showGrowth && card.growth !== undefined && (
                <span>
                  , Growth: {formatPercentage(card.growth)}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default StatsCards;