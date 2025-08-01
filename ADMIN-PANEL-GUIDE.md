# 🛡️ Panel de Administración - LaburAR

## 🚀 **Acceso Rápido**

### **URLs del Panel Admin:**
- **🏠 Local (Desarrollo):** http://localhost:3000/admin
- **☁️ Producción (AWS):** https://laburemos.com.ar/admin

### **🔑 Credenciales SuperAdmin:**
```
📧 Email: lesistern@gmail.com
🔐 Contraseña: Tyr1945@
👤 Usuario: lesistern SuperAdmin
🛡️ Rol: ADMIN (acceso completo)
```

## 🎯 **Configuración Inicial**

### **1. Crear Usuario SuperAdmin**
```bash
# En el directorio backend
cd /mnt/d/Laburar/backend

# Ejecutar script de creación
npm run create-super-admin
```

### **2. Iniciar Servicios**
```bash
# Backend (Puerto 3001)
cd backend
npm run start:dev

# Frontend (Puerto 3000)  
cd frontend
npm run dev
```

### **3. Acceder al Panel**
1. Abrir http://localhost:3000
2. **Iniciar sesión** con las credenciales SuperAdmin
3. **Navegar** a http://localhost:3000/admin
4. ¡El panel se abrirá automáticamente!

## 📊 **Funcionalidades del Panel**

### **🏠 Dashboard Principal** (`/admin`)
- **Métricas en tiempo real:** usuarios online, ingresos diarios, proyectos activos
- **KPIs principales:** satisfacción cliente, retención usuarios, pagos exitosos
- **Actividad reciente:** últimas acciones del sistema
- **Top performers:** mejores freelancers del mes
- **Categorías populares:** más utilizadas
- **Alertas del sistema:** notificaciones importantes

### **👥 Gestión de Usuarios** (`/admin/users`)
- **Tabla completa** con todos los usuarios registrados
- **Filtros avanzados:** por tipo, estado, verificación, país, fecha
- **Búsqueda inteligente:** por nombre, email, ID
- **Acciones masivas:** activar, desactivar, verificar usuarios
- **Modal de detalles:** estadísticas completas por usuario
- **Exportación** de datos de usuarios

### **📂 Gestión de Categorías** (`/admin/categories`)
- **Vista jerárquica** con categorías padre-hijo
- **CRUD completo:** crear, editar, eliminar categorías
- **Estadísticas:** servicios por categoría, ingresos, proyectos
- **Reordenamiento:** drag & drop para cambiar orden
- **Estados:** activar/desactivar categorías
- **Iconos:** gestión visual de iconos

### **📈 Analíticas Avanzadas** (`/admin/analytics`)
- **Métricas de ingresos:** tendencias temporales y proyecciones
- **Análisis de usuarios:** adquisición, retención, engagement
- **Estadísticas de proyectos:** por estado, valor, categoría
- **Distribución geográfica:** usuarios por país/región
- **Top performers:** ranking por diferentes métricas
- **Exportación:** datos en CSV, Excel, PDF

### **🎫 Sistema de Soporte** (`/admin/support`)
- **Gestión de tickets:** ver, asignar, responder, cerrar
- **Prioridades:** crítico, alto, medio, bajo
- **Categorías:** técnico, facturación, disputa, general
- **Workflow completo:** abierto → pendiente → resuelto → cerrado
- **Asignación:** manual y automática a admins
- **Historial:** completo de conversaciones

### **🔧 Gestión de Proyectos** (`/admin/projects`) - *Próximamente*
- Vista de todos los proyectos
- Estados y seguimiento
- Resolución de disputas
- Métricas por proyecto

### **⚙️ Configuración del Sistema** (`/admin/settings`) - *Próximamente*
- Parámetros globales
- Configuración de pagos
- Políticas de la plataforma
- Configuración de emails

## 🛡️ **Seguridad y Permisos**

### **Middleware de Autenticación**
- **Protección automática** de todas las rutas `/admin/*`
- **Verificación de JWT** en cada solicitud
- **Validación de rol ADMIN** requerida
- **Redirección automática** si no tiene permisos

### **Niveles de Acceso**
```typescript
UserType.ADMIN = Acceso completo al panel
UserType.FREELANCER = Sin acceso
UserType.CLIENT = Sin acceso
```

### **Tokens JWT**
- **Validación en tiempo real** con cada request
- **Renovación automática** de tokens
- **Logout seguro** con invalidación

## 🔧 **Arquitectura Técnica**

### **Backend (NestJS)**
```
/backend/src/admin/
├── admin.controller.ts    # 32 endpoints REST
├── admin.service.ts       # Lógica de negocio
├── admin.module.ts        # Configuración del módulo
└── dto/                   # Validaciones y tipos
    ├── admin-dashboard.dto.ts
    ├── admin-users.dto.ts
    ├── admin-categories.dto.ts
    └── admin-analytics.dto.ts
```

### **Frontend (Next.js)**
```
/frontend/app/admin/
├── layout.tsx            # Layout principal con sidebar
├── page.tsx              # Dashboard principal
├── users/page.tsx        # Gestión de usuarios
├── categories/page.tsx   # Gestión de categorías
├── analytics/page.tsx    # Analíticas avanzadas
└── support/page.tsx      # Sistema de soporte
```

### **Componentes Reutilizables**
```
/frontend/components/admin/
├── AdminSidebar.tsx      # Navegación lateral
├── AdminHeader.tsx       # Header con perfil
├── AdminDashboard.tsx    # Métricas del dashboard
├── AdminTable.tsx        # Tablas de datos
└── AdminModal.tsx        # Modales de acciones
```

## 📱 **Responsive Design**

### **Desktop (>1024px)**
- **Sidebar fijo** con navegación completa
- **Tablas completas** con todas las columnas
- **Gráficos grandes** para analíticas
- **Modales amplios** para formularios

### **Tablet (768px - 1024px)**
- **Sidebar colapsable** con iconos
- **Tablas adaptadas** con columnas esenciales
- **Gráficos medianos** optimizados
- **Navegación touch-friendly**

### **Móvil (<768px)**
- **Sidebar overlay** que se oculta
- **Cards en lugar de tablas** para mejor UX
- **Gráficos compactos** legibles en móvil
- **Navegación por pestañas**

## 🎨 **Personalización Visual**

### **Paleta de Colores (LaburAR)**
```css
/* Colores principales */
--primary: laburar-sky-blue-600    /* #0284c7 */
--primary-light: laburar-sky-blue-50 /* #f0f9ff */
--primary-dark: laburar-sky-blue-900 /* #0c4a6e */

/* Estados */
--success: green-500               /* #22c55e */
--warning: yellow-500              /* #eab308 */
--danger: red-500                  /* #ef4444 */
--info: blue-500                   /* #3b82f6 */
```

### **Tipografía**
- **Headings:** Inter, font-bold, text-black
- **Body:** Inter, font-normal, text-gray-700  
- **Labels:** Inter, font-medium, text-gray-900

## 🚀 **Próximas Funcionalidades**

### **En Desarrollo**
- [ ] **Gestión de proyectos** completa
- [ ] **Configuración del sistema** avanzada
- [ ] **Reportes automáticos** por email
- [ ] **Notificaciones push** en tiempo real

### **Roadmap Futuro**
- [ ] **Dashboard personalizable** con widgets
- [ ] **Roles granulares** (moderador, soporte, etc.)
- [ ] **API para terceros** con webhooks
- [ ] **Integración con CRM** externo
- [ ] **Auditoría completa** de acciones
- [ ] **Backup automático** de configuraciones

## 🆘 **Soporte y Ayuda**

### **Logs del Sistema**
```bash
# Ver logs del backend
cd backend && npm run start:dev

# Ver logs del frontend  
cd frontend && npm run dev
```

### **Base de Datos**
```bash
# Abrir Prisma Studio
cd backend && npm run db:studio
```

### **Troubleshooting**
1. **No puedo acceder al panel:** Verificar rol ADMIN en la base de datos
2. **Panel no carga:** Verificar que el backend esté ejecutándose
3. **Datos no actualizan:** Limpiar caché del navegador
4. **Error de permisos:** Revisar token JWT válido

---

## ✅ **¡Panel Listo para Usar!**

El panel de administración está **100% funcional** y listo para gestionar completamente la plataforma LaburAR.

**¿Necesitas ayuda?** Revisa este documento o contacta al equipo de desarrollo.

🎉 **¡Disfruta administrando LaburAR!**