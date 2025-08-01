# Dashboard Component

A comprehensive, accessible, and performant React dashboard component built with TypeScript, Zustand state management, Framer Motion animations, and full accessibility support.

## Features

### 🎯 Core Features
- **Fully Typed**: Complete TypeScript integration with comprehensive interfaces
- **State Management**: Zustand store with persistent preferences and real-time updates
- **Animations**: Smooth transitions and micro-interactions with Framer Motion
- **Accessibility**: WCAG AA compliant with screen reader support and keyboard navigation
- **Responsive**: Mobile-first design with optimized breakpoints
- **Performance**: Optimized rendering with memoization and lazy loading

### 🎨 UI Components
- **Stats Cards**: Interactive statistical cards with growth indicators
- **Charts**: Dynamic charts with Chart.js integration (line/bar charts)
- **Activity Feed**: Real-time activity updates with filtering
- **Quick Actions**: Customizable action buttons with keyboard shortcuts
- **Notifications**: Real-time notification system with categories
- **Loading States**: Skeleton loaders and progress indicators

### ♿ Accessibility Features
- Screen reader announcements for dynamic content
- Keyboard navigation with arrow keys and tab support
- Skip links for quick navigation
- High contrast mode support
- Reduced motion support for vestibular disorders
- Proper ARIA labels and roles throughout

## Installation

```bash
npm install framer-motion zustand chart.js react-chartjs-2
npm install -D @testing-library/react @testing-library/jest-dom jest-axe
```

## Usage

### Basic Usage

```tsx
import { Dashboard } from './components/Dashboard/Dashboard';

function App() {
  return (
    <Dashboard 
      userId="user-123"
      showNotifications={true}
      refreshInterval={30000}
      onDataUpdate={(data) => console.log('Dashboard updated:', data)}
    />
  );
}
```

### With Custom Configuration

```tsx
import { Dashboard } from './components/Dashboard/Dashboard';

function App() {
  const handleDataUpdate = (data) => {
    // Handle dashboard data updates
    console.log('New data:', data);
  };

  return (
    <Dashboard 
      userId="user-123"
      showNotifications={true}
      refreshInterval={60000}
      compact={false}
      theme="dark"
      onDataUpdate={handleDataUpdate}
      className="custom-dashboard"
      aria-label="User Performance Dashboard"
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `userId` | `string` | **required** | Unique identifier for the user |
| `showNotifications` | `boolean` | `true` | Whether to display the notifications panel |
| `refreshInterval` | `number` | `30000` | Auto-refresh interval in milliseconds |
| `onDataUpdate` | `(data: DashboardData) => void` | - | Callback when dashboard data updates |
| `compact` | `boolean` | `false` | Enable compact layout mode |
| `theme` | `'light' \| 'dark' \| 'auto'` | `'auto'` | Color theme preference |
| `className` | `string` | `''` | Additional CSS classes |
| `aria-label` | `string` | `'User Dashboard'` | Accessible label for the dashboard |

## State Management

The dashboard uses Zustand for state management with the following structure:

```typescript
interface DashboardStore {
  // Data
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  notifications: Notification[];
  
  // Filters
  filters: {
    timeRange: '7d' | '30d' | '90d' | '1y';
    activityTypes: Activity['type'][];
    notificationCategories: Notification['category'][];
  };
  
  // Preferences (persisted)
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    autoRefresh: boolean;
    refreshInterval: number;
    compactMode: boolean;
    soundEnabled: boolean;
  };
  
  // Actions
  fetchDashboardData: (userId: string) => Promise<void>;
  updateStats: (stats: Partial<DashboardStats>) => void;
  markNotificationRead: (id: string) => void;
  // ... more actions
}
```

## Styling

The dashboard uses CSS custom properties for theming and follows a mobile-first approach:

```css
:root {
  --dashboard-primary: #3b82f6;
  --dashboard-success: #22c55e;
  --dashboard-warning: #f59e0b;
  --dashboard-danger: #ef4444;
  
  /* Responsive breakpoints */
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
}
```

### Custom Themes

```tsx
// Light theme (default)
<Dashboard userId="user-123" theme="light" />

// Dark theme
<Dashboard userId="user-123" theme="dark" />

// Auto theme (follows system preference)
<Dashboard userId="user-123" theme="auto" />
```

## Testing

The dashboard includes comprehensive tests covering:

### Unit Tests
```bash
npm test Dashboard.test.tsx
```

### Accessibility Tests
```bash
npm test -- --testNamePattern="accessibility"
```

### Performance Tests
```bash
npm test -- --testNamePattern="performance"
```

### Example Test
```typescript
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Dashboard } from './Dashboard';

test('dashboard has no accessibility violations', async () => {
  const { container } = render(<Dashboard userId="test-user" />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Storybook Documentation

View all dashboard variations in Storybook:

```bash
npm run storybook
```

Available stories:
- Default
- Loading State
- Error State
- Empty State
- Dark Theme
- Mobile View
- Accessibility Testing
- Performance Testing

## API Integration

The dashboard expects the following API endpoints:

### GET `/api/dashboard/:userId`
Returns complete dashboard data:

```typescript
interface DashboardApiResponse {
  success: boolean;
  data: {
    stats: DashboardStats;
    charts: ChartData;
    recentActivity: Activity[];
    quickActions: QuickAction[];
    notifications: Notification[];
    user: UserInfo;
    lastUpdated: string;
  };
}
```

### POST `/api/dashboard/notifications/:id/read`
Marks a notification as read:

```typescript
interface MarkReadResponse {
  success: boolean;
  message: string;
}
```

## Performance Optimization

The dashboard is optimized for performance with:

- **Memoization**: React.memo and useMemo for expensive calculations
- **Lazy Loading**: Components loaded on demand
- **Virtual Scrolling**: For large activity lists
- **Optimistic Updates**: Immediate UI updates with rollback on error
- **Efficient Re-renders**: Selective re-rendering based on data changes

## Accessibility Guidelines

### Keyboard Navigation
- `Tab`: Navigate between interactive elements
- `Arrow Keys`: Navigate within lists and charts
- `Enter/Space`: Activate buttons and links
- `Escape`: Close modals and dropdowns

### Screen Reader Support
- All interactive elements have proper labels
- Dynamic content changes are announced
- Loading states and errors are communicated
- Chart data is available in tabular format

### Visual Accessibility
- High contrast mode support
- Reduced motion preferences respected
- Focus indicators clearly visible
- Color is not the only means of conveying information

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Follow the existing code style and TypeScript patterns
2. Add tests for new features
3. Update Storybook stories for UI changes
4. Ensure accessibility compliance
5. Test across different devices and browsers

## License

MIT License - see LICENSE file for details