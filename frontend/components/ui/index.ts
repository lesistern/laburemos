// Barrel exports for UI components
// This provides consistent, centralized imports for all UI components

// Badge components
export { Badge, badgeVariants } from './badge'
export type { BadgeProps } from './badge'
export { BadgeDisplay } from './badge-display'

// Card components
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './card'

// Button components
export { Button, buttonVariants } from './button'
export type { ButtonProps } from './button'

// Input components
export { Input } from './input'
export type { InputProps } from './input'

// Checkbox components
export { Checkbox } from './checkbox'

// Modal components
export { Modal } from './modal'

// Dropdown Menu components
export { DropdownMenu } from './dropdown-menu'

// Usage examples:
// import { Badge, BadgeDisplay, Button, Card, Input } from '@/components/ui'
// 
// For specific components:
// import { Badge } from '@/components/ui/badge'        // Standard UI badge
// import { BadgeDisplay } from '@/components/ui/badge-display'  // Achievement badges