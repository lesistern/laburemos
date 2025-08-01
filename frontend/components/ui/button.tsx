import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-gradient-to-r from-laburar-sky-blue-500 to-laburar-sky-blue-600 text-white hover:from-laburar-sky-blue-600 hover:to-laburar-sky-blue-700',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90',
        outline:
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground text-foreground',
        secondary:
          'bg-secondary text-white hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground text-foreground',
        login: 'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50',
        link: 'text-primary underline-offset-4 hover:underline',
        glass:
          'bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white',
        gradient:
          'bg-gradient-to-r from-laburar-sky-blue-500 to-laburar-sky-blue-600 text-white hover:from-laburar-sky-blue-600 hover:to-laburar-sky-blue-700 shadow-lg',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        xl: 'h-12 px-10 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    
    // When using asChild with loading state, we need to avoid multiple children
    if (asChild && loading) {
      console.warn('Button: Cannot use loading state with asChild prop. Loading state ignored.')
    }
    
    const buttonContent = (
      <>
        {!asChild && loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </>
    )
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {asChild ? children : buttonContent}
      </Comp>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }