# LaburAR Frontend - Aplicación Next.js 14

Aplicación frontend moderna para LaburAR construida con Next.js 14, TypeScript, Tailwind CSS y Framer Motion.

## 🚀 Características

- **Next.js 14** con App Router
- **TypeScript** con tipos estrictos
- **Tailwind CSS** con diseño personalizado
- **Framer Motion** para animaciones fluidas
- **Zustand** para gestión de estado
- **Radix UI** para componentes accesibles
- **React Hook Form** con validación Zod
- **Efectos Liquid Glass** recreados con CSS
- **Diseño responsive** y mobile-first
- **Componentes reutilizables** y tipados

## 📦 Instalación

1. **Navegar al directorio frontend:**
   ```bash
   cd /mnt/c/xampp/htdocs/Laburar/frontend
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   # o
   yarn install
   ```

3. **Ejecutar en modo desarrollo:**
   ```bash
   npm run dev
   # o
   yarn dev
   ```

4. **Abrir en el navegador:**
   ```
   http://localhost:3000
   ```

## 🏗️ Scripts Disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Build de producción
- `npm run start` - Servidor de producción
- `npm run lint` - Linter ESLint
- `npm run type-check` - Verificación de tipos TypeScript

## 📁 Estructura del Proyecto

```
frontend/
├── app/                    # App Router de Next.js 14
│   ├── dashboard/          # Página del dashboard
│   ├── marketplace/        # Página del marketplace
│   ├── globals.css         # Estilos globales
│   ├── layout.tsx          # Layout principal
│   └── page.tsx           # Página principal
├── components/             # Componentes reutilizables
│   ├── auth/              # Componentes de autenticación
│   ├── home/              # Componentes de la página principal
│   ├── layout/            # Componentes de layout
│   └── ui/                # Componentes UI base
├── hooks/                  # Custom hooks
├── lib/                    # Utilidades y constantes
├── stores/                 # Stores de Zustand
├── types/                  # Definiciones de tipos TypeScript
└── README.md              # Este archivo
```

## 🎨 Componentes Implementados

### UI Components
- **Button** - Botón con variantes (default, outline, ghost, glass, gradient)
- **Card** - Tarjeta con soporte para liquid glass
- **Input** - Campo de entrada con estados de error
- **Label** - Etiqueta accesible
- **Modal** - Modal con animaciones y variante glass
- **Toast** - Notificaciones con múltiples variantes
- **DropdownMenu** - Menú desplegable completo

### Layout Components
- **Header** - Navegación principal con menú móvil
- **Footer** - Pie de página con enlaces y newsletter
- **UserMenu** - Menú de usuario con dropdown

### Auth Components
- **LoginForm** - Formulario de inicio de sesión
- **RegisterForm** - Formulario de registro con validación

### Home Components
- **Hero** - Sección principal con búsqueda
- **Features** - Características de la plataforma
- **Categories** - Categorías de servicios
- **HowItWorks** - Proceso de 4 pasos
- **Testimonials** - Testimonios de clientes
- **CallToAction** - Llamada a la acción final

### Pages
- **HomePage** - Página principal completa
- **DashboardPage** - Panel de usuario con estadísticas
- **MarketplacePage** - Marketplace con filtros y búsqueda

## 🎯 Funcionalidades

### Autenticación
- Sistema de login/registro con validación
- Gestión de estado con Zustand
- Persistencia de sesión
- Formularios con React Hook Form + Zod

### UI/UX
- Efectos liquid glass recreados con CSS
- Animaciones fluidas con Framer Motion
- Diseño responsive móvil-first
- Modo claro/oscuro (configurado)
- Componentes accesibles (WCAG)

### Estado Global
- **AuthStore** - Autenticación y usuario
- **UIStore** - Estado de la interfaz

### Características Técnicas
- TypeScript estricto
- ESLint configurado
- Tailwind CSS con configuración personalizada
- Componentes completamente tipados
- Patrones de diseño modernos

## 🔧 Configuración

### Variables de Entorno
Crear archivo `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXTPUBLIC_APP_URL=http://localhost:3000
```

### Tailwind CSS
La configuración incluye:
- Colores personalizados de LaburAR
- Efectos liquid glass
- Animaciones personalizadas
- Utilidades extras

## 🎨 Liquid Glass Effects

Los efectos liquid glass están implementados con CSS puro:

```css
.liquid-glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

## 📱 Responsive Design

- **Mobile First** - Diseño optimizado para móviles
- **Breakpoints** - sm, md, lg, xl, 2xl
- **Touch Targets** - Botones de 44px mínimo
- **Navegación móvil** - Menú hamburguesa animado

## 🧪 Testing (Pendiente)

```bash
# Jest y Testing Library (a implementar)
npm run test
npm run test:watch
npm run test:coverage
```

## 📚 Storybook (Pendiente)

```bash
# Storybook para documentación de componentes
npm run storybook
npm run build-storybook
```

## 🚀 Deploy

### Vercel (Recomendado)
```bash
npm run build
# Deploy automático con git push
```

### Docker
```dockerfile
# Dockerfile incluido para containerización
docker build -t laburar-frontend .
docker run -p 3000:3000 laburar-frontend
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Crear Pull Request

## 📝 Próximos Pasos

- [ ] Implementar testing con Jest/Testing Library
- [ ] Configurar Storybook para documentación
- [ ] Agregar más páginas (Profile, Settings, etc.)
- [ ] Implementar internacionalización (i18n)
- [ ] Optimizaciones de performance
- [ ] PWA capabilities
- [ ] E2E testing con Playwright

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 👥 Equipo

Desarrollado con ❤️ por el equipo de LaburAR

---

**Nota**: Esta es una aplicación frontend completa y funcional con componentes modernos, animaciones fluidas y un diseño profesional. Todos los componentes están completamente tipados con TypeScript y siguen las mejores prácticas de React y Next.js.