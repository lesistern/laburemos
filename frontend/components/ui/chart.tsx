'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Info,
  Download,
  Maximize2,
  Filter,
  Calendar,
  Eye,
  EyeOff
} from 'lucide-react'

export interface ChartDataPoint {
  label: string
  value: number
  color?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: number
  metadata?: Record<string, any>
}

export interface ChartProps {
  /**
   * Chart title
   */
  title?: string
  /**
   * Chart description
   */
  description?: string
  /**
   * Chart data
   */
  data: ChartDataPoint[]
  /**
   * Chart type
   */
  type?: 'bar' | 'line' | 'donut' | 'area'
  /**
   * Chart height
   */
  height?: string
  /**
   * Show values on bars/points
   */
  showValues?: boolean
  /**
   * Show trend indicators
   */
  showTrends?: boolean
  /**
   * Show legend
   */
  showLegend?: boolean
  /**
   * Allow data export
   */
  exportable?: boolean
  /**
   * Animated entrance
   */
  animated?: boolean
  /**
   * Color scheme
   */
  colorScheme?: 'default' | 'primary' | 'success' | 'warning' | 'error'
  /**
   * Custom colors array
   */
  colors?: string[]
  /**
   * Interactive hover effects
   */
  interactive?: boolean
  /**
   * Loading state
   */
  loading?: boolean
  /**
   * Empty state message
   */
  emptyMessage?: string
  /**
   * Additional actions in header
   */
  actions?: React.ReactNode
  /**
   * Click handler for data points
   */
  onDataPointClick?: (dataPoint: ChartDataPoint, index: number) => void
  /**
   * Custom formatter for values
   */
  valueFormatter?: (value: number) => string
  /**
   * Custom formatter for labels
   */
  labelFormatter?: (label: string) => string
  /**
   * Grid lines
   */
  showGrid?: boolean
  /**
   * Responsive design
   */
  responsive?: boolean
}

// Color schemes
const colorSchemes = {
  default: [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ],
  primary: [
    '#1E40AF', '#1E3A8A', '#1E3A8A', '#3730A3', '#4338CA',
    '#4F46E5', '#6366F1', '#7C3AED', '#8B5CF6', '#9333EA'
  ],
  success: [
    '#059669', '#047857', '#065F46', '#064E3B', '#10B981',
    '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5', '#ECFDF5'
  ],
  warning: [
    '#D97706', '#B45309', '#92400E', '#78350F', '#F59E0B',
    '#FBBF24', '#FCD34D', '#FDE68A', '#FEF3C7', '#FFFBEB'
  ],
  error: [
    '#DC2626', '#B91C1C', '#991B1B', '#7F1D1D', '#EF4444',
    '#F87171', '#FCA5A5', '#FECACA', '#FEE2E2', '#FEF2F2'
  ]
}

export const Chart: React.FC<ChartProps> = ({
  title,
  description,
  data,
  type = 'bar',
  height = 'h-64',
  showValues = true,
  showTrends = false,
  showLegend = true,
  exportable = false,
  animated = true,
  colorScheme = 'default',
  colors,
  interactive = true,
  loading = false,
  emptyMessage = 'No hay datos disponibles',
  actions,
  onDataPointClick,
  valueFormatter = (value) => value.toLocaleString(),
  labelFormatter = (label) => label,
  showGrid = true,
  responsive = true
}) => {
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null)
  const [hiddenSeries, setHiddenSeries] = useState<Set<number>>(new Set())
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart')

  // Get colors for data points
  const chartColors = colors || colorSchemes[colorScheme]
  
  // Filter visible data
  const visibleData = useMemo(() => 
    data.filter((_, index) => !hiddenSeries.has(index)),
    [data, hiddenSeries]
  )

  // Calculate max value for scaling
  const maxValue = useMemo(() => 
    Math.max(...visibleData.map(d => d.value), 0),
    [visibleData]
  )

  // Handle data point interaction
  const handleDataPointClick = (dataPoint: ChartDataPoint, index: number) => {
    setSelectedPoint(selectedPoint === index ? null : index)
    onDataPointClick?.(dataPoint, index)
  }

  // Toggle series visibility
  const toggleSeries = (index: number) => {
    const newHidden = new Set(hiddenSeries)
    if (newHidden.has(index)) {
      newHidden.delete(index)
    } else {
      newHidden.add(index)
    }
    setHiddenSeries(newHidden)
  }

  // Export data
  const handleExport = () => {
    const csvContent = [
      ['Label', 'Value', 'Trend', 'Trend Value'].join(','),
      ...data.map(item => [
        item.label,
        item.value,
        item.trend || '',
        item.trendValue || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title || 'chart'}-data.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Get trend icon
  const getTrendIcon = (trend?: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-3 h-3 text-green-500" />
      case 'down':
        return <TrendingDown className="w-3 h-3 text-red-500" />
      case 'neutral':
        return <Minus className="w-3 h-3 text-gray-400" />
      default:
        return null
    }
  }

  // Render bar chart
  const renderBarChart = () => (
    <div className="flex items-end justify-between space-x-1 h-full px-4 pb-4">
      {visibleData.map((item, index) => {
        const originalIndex = data.findIndex(d => d === item)
        const height = maxValue > 0 ? (item.value / maxValue) * 100 : 0
        const color = item.color || chartColors[originalIndex % chartColors.length]
        const isSelected = selectedPoint === originalIndex
        
        return (
          <motion.div
            key={`${item.label}-${originalIndex}`}
            className="flex-1 flex flex-col items-center group cursor-pointer"
            initial={animated ? { height: 0, opacity: 0 } : {}}
            animate={{ height: 'auto', opacity: 1 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            onClick={() => interactive && handleDataPointClick(item, originalIndex)}
          >
            {/* Value label */}
            {showValues && (
              <motion.div
                initial={animated ? { opacity: 0, y: 10 } : {}}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                className="mb-2 text-xs font-medium text-gray-600 group-hover:text-gray-900 transition-colors"
              >
                {valueFormatter(item.value)}
              </motion.div>
            )}
            
            {/* Bar */}
            <motion.div
              className={cn(
                'w-full rounded-t-md transition-all duration-200 relative overflow-hidden',
                interactive && 'hover:brightness-110 cursor-pointer',
                isSelected && 'ring-2 ring-offset-1 ring-laburar-sky-blue-500'
              )}
              style={{ 
                height: `${height}%`,
                backgroundColor: color,
                minHeight: height > 0 ? '4px' : '0px'
              }}
              initial={animated ? { scaleY: 0 } : {}}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.8, delay: index * 0.1, ease: 'easeOut' }}
              whileHover={interactive ? { scaleY: 1.05 } : {}}
            >
              {/* Hover overlay */}
              {interactive && (
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              )}
            </motion.div>
            
            {/* Label */}
            <motion.div
              initial={animated ? { opacity: 0 } : {}}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
              className="mt-2 text-xs text-gray-500 group-hover:text-gray-700 transition-colors text-center max-w-full"
            >
              <div className="truncate" title={labelFormatter(item.label)}>
                {labelFormatter(item.label)}
              </div>
              {showTrends && item.trend && (
                <div className="flex items-center justify-center mt-1 space-x-1">
                  {getTrendIcon(item.trend)}
                  {item.trendValue && (
                    <span className={cn('text-xs', {
                      'text-green-500': item.trend === 'up',
                      'text-red-500': item.trend === 'down',
                      'text-gray-400': item.trend === 'neutral'
                    })}>
                      {item.trendValue > 0 ? '+' : ''}{item.trendValue}%
                    </span>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )
      })}
    </div>
  )

  // Render table view
  const renderTableView = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 px-3 font-medium text-gray-600">Label</th>
            <th className="text-right py-2 px-3 font-medium text-gray-600">Valor</th>
            {showTrends && <th className="text-center py-2 px-3 font-medium text-gray-600">Tendencia</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <motion.tr
              key={`${item.label}-${index}`}
              initial={animated ? { opacity: 0, x: -20 } : {}}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={cn(
                'border-b border-gray-100 hover:bg-gray-50 transition-colors',
                hiddenSeries.has(index) && 'opacity-50'
              )}
            >
              <td className="py-2 px-3">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color || chartColors[index % chartColors.length] }}
                  />
                  <span>{labelFormatter(item.label)}</span>
                </div>
              </td>
              <td className="py-2 px-3 text-right font-medium">
                {valueFormatter(item.value)}
              </td>
              {showTrends && (
                <td className="py-2 px-3 text-center">
                  <div className="flex items-center justify-center space-x-1">
                    {getTrendIcon(item.trend)}
                    {item.trendValue && (
                      <span className={cn('text-xs', {
                        'text-green-500': item.trend === 'up',
                        'text-red-500': item.trend === 'down',
                        'text-gray-400': item.trend === 'neutral'
                      })}>
                        {item.trendValue > 0 ? '+' : ''}{item.trendValue}%
                      </span>
                    )}
                  </div>
                </td>
              )}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  // Render legend
  const renderLegend = () => (
    <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100">
      {data.map((item, index) => (
        <motion.button
          key={`legend-${index}`}
          onClick={() => toggleSeries(index)}
          className={cn(
            'flex items-center space-x-2 px-2 py-1 rounded-md text-sm transition-all duration-200',
            hiddenSeries.has(index) 
              ? 'opacity-50 hover:opacity-75' 
              : 'hover:bg-gray-50'
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div 
            className="w-3 h-3 rounded-full transition-all duration-200" 
            style={{ 
              backgroundColor: hiddenSeries.has(index) 
                ? '#d1d5db' 
                : item.color || chartColors[index % chartColors.length] 
            }}
          />
          <span className={cn(
            'font-medium transition-colors duration-200',
            hiddenSeries.has(index) ? 'text-gray-400' : 'text-gray-700'
          )}>
            {labelFormatter(item.label)}
          </span>
          {hiddenSeries.has(index) ? (
            <EyeOff className="w-3 h-3 text-gray-400" />
          ) : (
            <Eye className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100" />
          )}
        </motion.button>
      ))}
    </div>
  )

  if (loading) {
    return (
      <Card className={height}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-2" />
              {description && <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end space-x-2 h-32">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 bg-gray-200 rounded-t animate-pulse"
                style={{ height: `${Math.random() * 80 + 20}%` }}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card className={height}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-gray-400" />
            <span>{title || 'Gráfico'}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">{emptyMessage}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn(height, responsive && 'w-full')}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {title && (
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-laburar-sky-blue-600" />
                <span>{title}</span>
              </CardTitle>
            )}
            {description && (
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* View mode toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'px-2 py-1 text-xs',
                  viewMode === 'chart' && 'bg-white shadow-sm'
                )}
                onClick={() => setViewMode('chart')}
              >
                <BarChart3 className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'px-2 py-1 text-xs',
                  viewMode === 'table' && 'bg-white shadow-sm'
                )}
                onClick={() => setViewMode('table')}
              >
                <Eye className="w-3 h-3" />
              </Button>
            </div>

            {/* Export button */}
            {exportable && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="text-xs"
              >
                <Download className="w-3 h-3 mr-1" />
                Exportar
              </Button>
            )}

            {/* Custom actions */}
            {actions}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <AnimatePresence mode="wait">
          {viewMode === 'chart' ? (
            <motion.div
              key="chart"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              {type === 'bar' && renderBarChart()}
            </motion.div>
          ) : (
            <motion.div
              key="table"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {renderTableView()}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Legend */}
        {showLegend && viewMode === 'chart' && renderLegend()}
      </CardContent>
    </Card>
  )
}

export default Chart