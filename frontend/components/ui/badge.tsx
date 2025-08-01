import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80 hover:scale-105 active:scale-95",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:scale-105 active:scale-95",
        destructive:
          "border-transparent bg-red-500 text-white hover:bg-red-600 hover:scale-105 active:scale-95 shadow-sm",
        outline: 
          "text-foreground border-current hover:bg-gray-50 hover:scale-105 active:scale-95",
        success:
          "border-transparent bg-green-500 text-white hover:bg-green-600 hover:scale-105 active:scale-95 shadow-sm",
        warning:
          "border-transparent bg-yellow-500 text-white hover:bg-yellow-600 hover:scale-105 active:scale-95 shadow-sm",
        admin:
          "border-transparent bg-laburar-sky-blue-500 text-white hover:bg-laburar-sky-blue-600 hover:scale-105 active:scale-95 shadow-sm",
        mod:
          "border-transparent bg-orange-500 text-white hover:bg-orange-600 hover:scale-105 active:scale-95 shadow-sm",
        superadmin:
          "border-transparent bg-purple-600 text-white hover:bg-purple-700 hover:scale-105 active:scale-95 shadow-sm",
        new:
          "border-transparent bg-purple-500 text-white hover:bg-purple-600 hover:scale-105 active:scale-95 shadow-sm",
        info:
          "border-transparent bg-blue-500 text-white hover:bg-blue-600 hover:scale-105 active:scale-95 shadow-sm",
        neutral:
          "border-transparent bg-gray-500 text-white hover:bg-gray-600 hover:scale-105 active:scale-95 shadow-sm",
        // Light variants for better contrast when needed
        "success-light":
          "border-transparent bg-green-100 text-green-900 hover:bg-green-200 hover:scale-105 active:scale-95 border border-green-300",
        "warning-light":
          "border-transparent bg-yellow-100 text-yellow-900 hover:bg-yellow-200 hover:scale-105 active:scale-95 border border-yellow-300",
        "error-light":
          "border-transparent bg-red-100 text-red-900 hover:bg-red-200 hover:scale-105 active:scale-95 border border-red-300",
        "info-light":
          "border-transparent bg-blue-100 text-blue-900 hover:bg-blue-200 hover:scale-105 active:scale-95 border border-blue-300",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /**
   * Whether the badge should be clickable
   */
  clickable?: boolean
  /**
   * Icon to display before the text
   */
  icon?: React.ComponentType<{ className?: string }>
  /**
   * Icon to display after the text
   */
  iconAfter?: React.ComponentType<{ className?: string }>
  /**
   * Loading state
   */
  loading?: boolean
  /**
   * Pulse animation for notifications
   */
  pulse?: boolean
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ 
    className, 
    variant, 
    size, 
    clickable, 
    icon: Icon, 
    iconAfter: IconAfter, 
    loading, 
    pulse,
    children, 
    ...props 
  }, ref) => {
    const Component = clickable ? 'button' : 'div'
    
    return (
      <Component
        ref={ref}
        className={cn(
          badgeVariants({ variant, size }),
          clickable && 'cursor-pointer focus:ring-2 focus:ring-offset-2',
          pulse && 'animate-pulse',
          loading && 'cursor-wait',
          className
        )}
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        {...props}
      >
        {loading ? (
          <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin mr-1" />
        ) : Icon ? (
          <Icon className="w-3 h-3 mr-1" aria-hidden="true" />
        ) : null}
        
        {children}
        
        {IconAfter && !loading && (
          <IconAfter className="w-3 h-3 ml-1" aria-hidden="true" />
        )}
      </Component>
    )
  }
)

Badge.displayName = "Badge"

export { Badge, badgeVariants }