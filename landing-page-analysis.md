# LaburAR Landing Page Structure Analysis

## File Locations

### Main Landing Page
- **File**: `/frontend/app/page.tsx`
- **Purpose**: Main landing page component for LaburAR

### Header Component
- **File**: `/frontend/components/layout/header.tsx`
- **Purpose**: Global header with navigation and search functionality

## Landing Page Structure

### 1. Hero Section
```tsx
<section className="relative bg-gradient-to-br from-blue-50 to-white py-20">
```
- **Background**: Gradient from blue-50 to white
- **Content**: Title, subtitle, search box, and CTA buttons

#### Search Box Component
```tsx
<div className="bg-white rounded-lg shadow-lg p-6 mb-12">
  <div className="flex flex-col md:flex-row gap-4">
    {/* Job search input */}
    {/* Location input */}
    {/* Search button */}
  </div>
  {/* Popular searches tags */}
</div>
```
- **Layout**: Flex container with responsive columns
- **Inputs**: Job search and location search with icons
- **Popular searches**: Badge components for quick access

#### CTA Grid (grid-cols-2)
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
  {/* "Busco Trabajo" Card */}
  {/* "Busco Empleados" Card */}
</div>
```
- **Grid**: 1 column on mobile, 2 columns on desktop
- **Cards**: Interactive cards with hover effects
- **CTAs**: "Crear CV Gratis" and "Publicar Empleo"

### 2. Stats Section
```tsx
<section className="py-16 bg-gray-50">
  <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
```
- **Background**: Gray-50
- **Grid**: 2 columns mobile, 4 columns desktop
- **Stats**: Companies, Professionals, Jobs, Satisfaction

### 3. "¿Cómo funciona?" Section
```tsx
<section className="py-20">
  <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
    ¿Cómo funciona?
  </h2>
```
- **Layout**: Two-column grid for job seekers and employers
- **Content**: Step-by-step process with numbered circles
- **Colors**: Blue for job seekers, green for employers

### 4. Featured Jobs Section
```tsx
<section className="py-20 bg-gray-50">
```
- **Background**: Gray-50
- **Grid**: 3-column layout for job cards
- **Note**: This section has the "mt-20 pt-16 border-t border-gray-200" styling in some versions

### 5. Testimonials Section
```tsx
<section className="py-20">
```
- **Grid**: 3-column layout for testimonial cards
- **Rating**: 5-star ratings using Star component

### 6. CTA Section
```tsx
<section className="py-20 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
```
- **Background**: Blue gradient
- **CTAs**: Two buttons for job seekers and employers

## Header Component Structure

### Search Functionality in Header
The header component includes:
- Mobile menu toggle
- Logo/brand
- Navigation links
- Search icon/functionality (to be implemented)
- User menu/authentication buttons

## Key Classes and Patterns

### Responsive Grids
- `grid grid-cols-1 md:grid-cols-2` - Two column layout
- `grid grid-cols-2 md:grid-cols-4` - Four column layout
- `grid md:grid-cols-2 lg:grid-cols-3` - Three column layout

### Section Styling
- Hero: `bg-gradient-to-br from-blue-50 to-white py-20`
- Alternate sections: `bg-gray-50`
- Section padding: `py-16` or `py-20`

### Container Pattern
```tsx
<div className="container mx-auto px-4">
  <div className="max-w-6xl mx-auto">
```

## Components Used
- Button (from UI library)
- Card, CardHeader, CardContent, CardDescription, CardTitle
- Badge
- Input
- Icons: Search, Briefcase, Users, MapPin, Clock, Star

## Color Scheme (LaburAR Brand Colors)
- **Sky Blue** (Primary): `laburar-sky-blue-500` (#6CACE4) - Main brand color
  - Full palette: 50-950 shades available
- **Yellow** (Secondary): `laburar-yellow-500` (#FFB81C) - Accent color
  - Full palette: 50-950 shades available
- **Brown** (Tertiary): `laburar-brown-700` (#7D4016) - Support color
  - Full palette: 50-950 shades available
- **White**: `laburar-white` (#FFFFFF) - Base color
- **Gray Scale**: Default Tailwind gray (50-950)
- **Note**: These are the official LaburAR brand colors defined in the Tailwind configuration.

## Recommendations for Dashboard Component

Based on this landing page structure, a Dashboard component should:

1. **Maintain consistency** with the existing design system
2. **Use the same grid patterns** (grid-cols-2, responsive breakpoints)
3. **Follow the color scheme** (laburar-sky-blue, laburar-yellow, laburar-brown, gray scale)
4. **Implement similar card patterns** with hover effects
5. **Use the existing UI components** (Button, Card, Badge, etc.)
6. **Apply consistent spacing** (py-16/py-20 for sections)
7. **Include proper TypeScript types** for all props and state
8. **Add animations** using Framer Motion similar to hover effects
9. **Ensure accessibility** with proper ARIA labels and keyboard navigation
10. **Write comprehensive tests** for all interactive elements