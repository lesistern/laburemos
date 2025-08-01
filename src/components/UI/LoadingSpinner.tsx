import React from 'react';
import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'white';
  className?: string;
  'aria-label'?: string;
}

/**
 * LoadingSpinner Component
 * 
 * An accessible loading spinner with:
 * - Multiple sizes
 * - Color variants
 * - Smooth animations
 * - Screen reader support
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = 'primary',
  className = '',
  'aria-label': ariaLabel = 'Loading',
  ...props
}) => {
  const sizeClasses = {
    small: 'loading-spinner--small',
    medium: 'loading-spinner--medium',
    large: 'loading-spinner--large',
  };

  const colorClasses = {
    primary: 'loading-spinner--primary',
    secondary: 'loading-spinner--secondary',
    white: 'loading-spinner--white',
  };

  return (
    <div 
      className={`loading-spinner ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
      {...props}
    >
      <motion.div
        className="loading-spinner__circle"
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <svg
          className="loading-spinner__svg"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            className="loading-spinner__track"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
            strokeOpacity="0.2"
          />
          <circle
            className="loading-spinner__progress"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="62.83185307179586"
            strokeDashoffset="47.12389230384689"
          />
        </svg>
      </motion.div>
      <span className="sr-only">{ariaLabel}</span>
    </div>
  );
};

export default LoadingSpinner;