# Header Component with Scroll-Based Search

A responsive header component for LaburAR that automatically shows a search box when the user scrolls past the hero search section.

## Features

- ✅ **Automatic scroll detection** - Search box appears when scrolling past hero section
- ✅ **Smooth animations** - Uses CSS transitions and transforms
- ✅ **LaburAR brand colors** - Sky-blue (#0ea5e9), yellow (#eab308), and complementary colors
- ✅ **Responsive design** - Mobile-first approach with responsive breakpoints
- ✅ **Accessibility compliant** - ARIA attributes, keyboard navigation, screen reader support
- ✅ **TypeScript support** - Fully typed with proper interfaces
- ✅ **Performance optimized** - Throttled scroll events using requestAnimationFrame

## File Structure

```
/frontend/
├── components/
│   ├── layout/
│   │   ├── header.tsx                 # Main header component
│   │   └── README.md                  # This documentation
│   └── examples/
│       └── page-with-header.tsx       # Usage example
└── hooks/
    └── useScrollDetection.ts          # Custom scroll detection hook
```

## Usage

### Basic Usage

```tsx
import Header from '@/components/layout/header';

export default function MyPage() {
  return (
    <div>
      <Header />
      {/* Your page content */}
    </div>
  );
}
```

### Advanced Usage with Hero Section Reference

```tsx
import React, { useRef } from 'react';
import Header from '@/components/layout/header';

export default function HomePage() {
  const heroSearchRef = useRef<HTMLDivElement>(null);

  return (
    <div>
      <Header heroSearchRef={heroSearchRef} />
      
      <section className="hero">
        {/* Hero content */}
        <div ref={heroSearchRef} className="hero-search">
          {/* Your hero search component */}
        </div>
      </section>
      
      {/* Rest of your content */}
    </div>
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `heroSearchRef` | `React.RefObject<HTMLElement>` | No | Reference to the hero search element. If provided, the header search will appear when scrolling past this element. |

## Components Structure

### Header Component (`header.tsx`)

The main header component includes:

- **Logo**: LaburAR branding with consistent styling
- **Search Box**: Appears/disappears based on scroll position
- **Navigation**: Desktop and mobile navigation menus
- **User Actions**: Notifications, profile, and CTA button
- **Mobile Menu**: Collapsible mobile navigation

### Scroll Detection Hook (`useScrollDetection.ts`)

Custom React hook that handles:

- Scroll event listening with performance optimization
- Hero section position calculation
- Smooth state transitions
- Cleanup on component unmount

## Styling

The component uses Tailwind CSS classes with LaburAR brand colors:

- **Primary**: Sky blue (`sky-400` to `sky-600`)
- **Accent**: Yellow (`yellow-500`)
- **Text**: Brown/gray tones for readability
- **Background**: White with blur effects when scrolled

### Key Classes

```css
/* Header background when scrolled */
bg-white/95 backdrop-blur-md shadow-lg border-b border-sky-100

/* Search box transition */
transition-all duration-300 opacity-100 translate-y-0
opacity-0 -translate-y-2 pointer-events-none

/* Brand colors */
from-sky-400 to-sky-600  /* Logo gradient */
text-yellow-500          /* Brand accent */
hover:text-sky-600       /* Interactive elements */
```

## Accessibility Features

- **ARIA attributes**: Proper labels and roles
- **Keyboard navigation**: All interactive elements accessible via keyboard
- **Screen reader support**: Hidden content properly marked with `aria-hidden`
- **Focus management**: Visible focus indicators
- **Semantic HTML**: Proper use of `header`, `nav`, and other semantic elements

## Performance Optimizations

- **Throttled scroll events**: Uses `requestAnimationFrame` to prevent excessive re-renders
- **Passive event listeners**: Improves scroll performance
- **Conditional rendering**: Search box only rendered when needed
- **CSS transforms**: Uses GPU-accelerated transforms for smooth animations

## Browser Support

- Chrome/Edge 88+
- Firefox 78+
- Safari 14+
- Mobile browsers with modern CSS support

## Customization

### Changing Scroll Thresholds

```tsx
const { isScrolled, showHeaderSearch } = useScrollDetection({ 
  heroSearchRef,
  threshold: 100,    // Custom threshold when no hero ref
  offset: 150        // Custom offset from hero element
});
```

### Custom Search Handler

```tsx
const handleSearch = (e: React.FormEvent) => {
  e.preventDefault();
  const query = searchQuery.trim();
  if (query) {
    // Your custom search logic
    router.push(`/search?q=${encodeURIComponent(query)}`);
  }
};
```

## Testing

To test the scroll behavior:

1. Start with the page at the top (search box hidden in header)
2. Scroll down past the hero section
3. Observe the header search box fade in smoothly
4. Scroll back up to see it fade out
5. Test on mobile devices for responsive behavior

## Integration with Next.js

Works seamlessly with Next.js 13+ and the app router:

```tsx
// app/layout.tsx
import Header from '@/components/layout/header';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
```

## Troubleshooting

### Search box not appearing
- Check that `heroSearchRef` is properly attached to an element
- Verify the element has content and is visible
- Check console for any JavaScript errors

### Smooth transitions not working
- Ensure Tailwind CSS is properly configured
- Check that `transition-all duration-300` classes are applied
- Verify browser supports CSS transforms

### Mobile menu issues
- Test on actual mobile devices, not just browser dev tools
- Check that touch events are working properly
- Verify responsive breakpoints are correct

## Future Enhancements

- [ ] Search suggestions/autocomplete
- [ ] User authentication integration
- [ ] Notifications dropdown
- [ ] Theme switching support
- [ ] Multi-language support
- [ ] Advanced search filters