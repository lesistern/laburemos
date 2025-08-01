import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ChartData as ChartJSData,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { ChartSectionProps, ChartData } from './types';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * ChartSection Component
 * 
 * Displays interactive charts for dashboard analytics with:
 * - Multiple chart types (line, bar)
 * - Time range controls
 * - Responsive design
 * - Accessibility features
 * - Loading states and animations
 */
export const ChartSection: React.FC<ChartSectionProps> = ({
  data,
  loading = false,
  height = 400,
  showControls = true,
  defaultTimeRange = '30d',
  onTimeRangeChange,
  className = '',
  'aria-label': ariaLabel = 'Dashboard charts',
  ...props
}) => {
  const [activeChart, setActiveChart] = useState<'earnings' | 'projects' | 'views' | 'ratings'>('earnings');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [timeRange, setTimeRange] = useState<ChartData['timeRange']>(defaultTimeRange);
  const chartRef = useRef<ChartJS<'line' | 'bar'>>(null);

  // Handle time range change
  const handleTimeRangeChange = useCallback((newRange: ChartData['timeRange']) => {
    setTimeRange(newRange);
    if (onTimeRangeChange) {
      onTimeRangeChange(newRange);
    }
  }, [onTimeRangeChange]);

  // Chart configuration
  const chartOptions: ChartOptions<'line' | 'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif',
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: (context) => {
            const date = new Date(context[0].label);
            return date.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });
          },
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            
            if (activeChart === 'earnings') {
              return `${label}: $${value.toLocaleString()}`;
            } else if (activeChart === 'ratings') {
              return `${label}: ${value.toFixed(1)}/5.0`;
            } else {
              return `${label}: ${value.toLocaleString()}`;
            }
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
            family: 'Inter, system-ui, sans-serif',
          },
          callback: function(value, index) {
            const date = new Date(this.getLabelForValue(value as number));
            return date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            size: 11,
            family: 'Inter, system-ui, sans-serif',
          },
          callback: function(value) {
            if (activeChart === 'earnings') {
              return `$${(value as number).toLocaleString()}`;
            } else if (activeChart === 'ratings') {
              return `${value}/5`;
            } else {
              return (value as number).toLocaleString();
            }
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6,
        borderWidth: 2,
        hoverBorderWidth: 3,
      },
      line: {
        borderWidth: 2,
        tension: 0.1,
      },
      bar: {
        borderRadius: 4,
        borderSkipped: false,
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart',
    },
  };

  // Generate chart data
  const generateChartData = (chartKey: keyof ChartData): ChartJSData<'line' | 'bar'> => {
    if (!data || !data[chartKey]) {
      return {
        labels: [],
        datasets: [],
      };
    }

    const chartData = data[chartKey];
    const labels = chartData.map(point => point.date);
    const values = chartData.map(point => point.value);

    const colors = {
      earnings: {
        primary: 'rgba(34, 197, 94, 0.8)',
        secondary: 'rgba(34, 197, 94, 0.1)',
        border: 'rgba(34, 197, 94, 1)',
      },
      projects: {
        primary: 'rgba(59, 130, 246, 0.8)',
        secondary: 'rgba(59, 130, 246, 0.1)',
        border: 'rgba(59, 130, 246, 1)',
      },
      views: {
        primary: 'rgba(168, 85, 247, 0.8)',
        secondary: 'rgba(168, 85, 247, 0.1)',
        border: 'rgba(168, 85, 247, 1)',
      },
      ratings: {
        primary: 'rgba(245, 158, 11, 0.8)',
        secondary: 'rgba(245, 158, 11, 0.1)',
        border: 'rgba(245, 158, 11, 1)',
      },
    };

    const colorScheme = colors[chartKey];

    return {
      labels,
      datasets: [
        {
          label: chartKey.charAt(0).toUpperCase() + chartKey.slice(1),
          data: values,
          borderColor: colorScheme.border,
          backgroundColor: chartType === 'line' ? colorScheme.secondary : colorScheme.primary,
          fill: chartType === 'line',
          tension: 0.1,
        },
      ],
    };
  };

  // Time range options
  const timeRangeOptions = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '1y', label: '1 Year' },
  ] as const;

  // Chart type options
  const chartTypeOptions = [
    { value: 'line', label: 'Line', icon: 'trending-up' },
    { value: 'bar', label: 'Bar', icon: 'bar-chart' },
  ] as const;

  // Active chart options
  const chartOptions_active = [
    { value: 'earnings', label: 'Earnings', icon: 'dollar-sign', color: 'success' },
    { value: 'projects', label: 'Projects', icon: 'briefcase', color: 'primary' },
    { value: 'views', label: 'Views', icon: 'eye', color: 'purple' },
    { value: 'ratings', label: 'Ratings', icon: 'star', color: 'warning' },
  ] as const;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
      },
    },
  };

  const chartVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.3,
      },
    },
  };

  if (loading && !data) {
    return (
      <motion.div
        className={`chart-section chart-section--loading ${className}`}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        role="status"
        aria-live="polite"
        aria-label="Loading charts"
        {...props}
      >
        <div className="chart-section__skeleton">
          <div className="chart-section__skeleton-header">
            <div className="chart-section__skeleton-tabs" />
            <div className="chart-section__skeleton-controls" />
          </div>
          <div 
            className="chart-section__skeleton-chart"
            style={{ height: `${height}px` }}
          />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`chart-section ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      role="region"
      aria-label={ariaLabel}
      {...props}
    >
      {/* Controls */}
      {showControls && (
        <div className="chart-section__controls">
          {/* Chart Type Selector */}
          <div className="chart-section__chart-tabs">
            {chartOptions_active.map((option) => (
              <button
                key={option.value}
                className={`chart-section__tab ${
                  activeChart === option.value ? 'chart-section__tab--active' : ''
                } chart-section__tab--${option.color}`}
                onClick={() => setActiveChart(option.value)}
                aria-pressed={activeChart === option.value}
                aria-label={`Show ${option.label} chart`}
              >
                <i className={`icon-${option.icon}`} aria-hidden="true" />
                <span>{option.label}</span>
              </button>
            ))}
          </div>

          {/* Controls Group */}
          <div className="chart-section__controls-group">
            {/* Time Range Selector */}
            <div className="chart-section__time-range">
              <label 
                htmlFor="time-range-select"
                className="chart-section__control-label sr-only"
              >
                Select time range
              </label>
              <select
                id="time-range-select"
                className="chart-section__select"
                value={timeRange}
                onChange={(e) => handleTimeRangeChange(e.target.value as ChartData['timeRange'])}
                aria-label="Select time range for chart data"
              >
                {timeRangeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Chart Type Toggle */}
            <div className="chart-section__chart-type">
              {chartTypeOptions.map((option) => (
                <button
                  key={option.value}
                  className={`chart-section__type-button ${
                    chartType === option.value ? 'chart-section__type-button--active' : ''
                  }`}
                  onClick={() => setChartType(option.value)}
                  aria-pressed={chartType === option.value}
                  aria-label={`Switch to ${option.label} chart`}
                  title={`${option.label} Chart`}
                >
                  <i className={`icon-${option.icon}`} aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Chart Container */}
      <div className="chart-section__chart-container">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeChart}-${chartType}`}
            className="chart-section__chart-wrapper"
            variants={chartVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ height: `${height}px` }}
          >
            {chartType === 'line' ? (
              <Line
                ref={chartRef}
                data={generateChartData(activeChart)}
                options={chartOptions}
                aria-label={`${activeChart} line chart for the last ${timeRange}`}
              />
            ) : (
              <Bar
                ref={chartRef}
                data={generateChartData(activeChart)}
                options={chartOptions}
                aria-label={`${activeChart} bar chart for the last ${timeRange}`}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Loading Overlay */}
        {loading && data && (
          <div 
            className="chart-section__loading-overlay"
            role="status"
            aria-live="polite"
            aria-label="Updating chart data"
          >
            <div className="chart-section__loading-spinner" />
          </div>
        )}
      </div>

      {/* Chart Data Summary for Screen Readers */}
      <div className="sr-only">
        <h3>Chart Data Summary</h3>
        <p>
          Showing {activeChart} data for the last {timeRange} in {chartType} chart format.
        </p>
        {data && data[activeChart] && (
          <ul>
            {data[activeChart].slice(-5).map((point, index) => (
              <li key={index}>
                {new Date(point.date).toLocaleDateString()}: {point.value}
                {activeChart === 'earnings' && ' dollars'}
                {activeChart === 'ratings' && ' out of 5 stars'}
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
};

export default ChartSection;