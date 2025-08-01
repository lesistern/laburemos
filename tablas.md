# 📊 LABUREMOS - Análisis de Tablas de Base de Datos

## ✅ TABLAS EXISTENTES (20 tablas actuales)

### 👤 Usuarios y Autenticación
- `users` - Usuarios principales
- `user_sessions` - Sesiones activas
- `password_resets` - Reset de contraseñas
- `freelancer_profiles` - Perfiles de freelancers

### 💼 Servicios y Proyectos
- `services` - Servicios ofrecidos
- `service_packages` - Paquetes de servicios
- `projects` - Proyectos
- `project_milestones` - Hitos de proyectos
- `categories` - Categorías y subcategorías

### 💰 Pagos
- `transactions` - Transacciones
- `wallets` - Billeteras digitales

### 💬 Comunicación
- `messages` - Mensajes
- `notifications` - Notificaciones
- `reviews` - Reseñas y calificaciones

### 🏆 Gamificación
- `badges` - Insignias disponibles
- `user_badges` - Insignias obtenidas
- `badge_categories` - Categorías de insignias
- `badge_milestones` - Hitos para insignias

### 🔧 Sistema
- `activity_logs` - Logs de actividad
- `support_tickets` - Tickets de soporte

## ❌ TABLAS FALTANTES CRÍTICAS

### 🚨 ALTA PRIORIDAD (Bloquean funcionalidad core)

#### 1. **skills** - Catálogo de habilidades
```sql
- id, name, slug, category
- is_trending, usage_count
```
**Necesaria para**: Búsqueda de freelancers, matching de proyectos

#### 2. **freelancer_skills** - Habilidades por freelancer
```sql
- freelancer_id, skill_id
- proficiency_level (beginner/intermediate/advanced/expert)
- years_experience, endorsed_count
```
**Necesaria para**: Perfiles completos, filtros de búsqueda

#### 3. **portfolio_items** - Portfolio de trabajos
```sql
- freelancer_id, title, description
- media_files (JSON), project_url
- technologies_used, completion_date
```
**Necesaria para**: Mostrar trabajos previos, generar confianza

#### 4. **proposals** - Propuestas de trabajo
```sql
- project_id, freelancer_id
- cover_letter, proposed_amount, proposed_timeline
- status (pending/shortlisted/accepted/rejected)
```
**Necesaria para**: Sistema de ofertas en proyectos

#### 5. **file_uploads** - Gestión de archivos
```sql
- user_id, entity_type, entity_id
- file_name, file_size, storage_path
- cdn_url, is_public
```
**Necesaria para**: Subir archivos en proyectos, portfolios, chat

### ⚠️ MEDIA PRIORIDAD (Mejoran UX significativamente)

#### 6. **payment_methods** - Métodos de pago guardados
```sql
- user_id, type, provider
- last_four, brand, is_default
```
**Necesaria para**: Pagos rápidos, suscripciones

#### 7. **notification_preferences** - Preferencias de notificación
```sql
- user_id, email_notifications (JSON)
- push_notifications, notification_frequency
```
**Necesaria para**: Control de notificaciones por usuario

#### 8. **favorites** - Freelancers/servicios favoritos
```sql
- user_id, entity_type, entity_id
```
**Necesaria para**: Guardar favoritos, acceso rápido

#### 9. **saved_searches** - Búsquedas guardadas
```sql
- user_id, search_criteria (JSON)
- alert_frequency
```
**Necesaria para**: Alertas de nuevos proyectos/servicios

#### 10. **disputes** - Sistema de disputas
```sql
- project_id, initiator_id, reason
- status, resolution, evidence (JSON)
```
**Necesaria para**: Resolución de conflictos

### 💡 BAJA PRIORIDAD (Nice to have)

#### 11. **teams** - Equipos de trabajo
```sql
- owner_id, name, description
```

#### 12. **team_members** - Miembros de equipo
```sql
- team_id, user_id, role, permissions
```

#### 13. **api_keys** - API keys para integraciones
```sql
- user_id, key_hash, permissions
```

#### 14. **emojis** - Catálogo de 4,284 emojis
```sql
- unicode, name, category, keywords
```

#### 15. **conversion_tracking** - Analytics de conversión
```sql
- event_type, user_id, metadata
```

## 📋 TABLAS ADICIONALES EN CÓDIGO PERO NO EN BD

Encontradas en el análisis pero no implementadas:

### Del Backend NestJS:
- `refresh_tokens` - Para JWT refresh
- `stripe_customers` - Clientes de Stripe
- `withdrawal_requests` - Solicitudes de retiro

### Del Sistema Legacy PHP:
- `mercadopago_config` - Configuración MercadoPago
- `video_calls` - Registro de videollamadas
- `trust_signals` - Señales de confianza
- `network_connections` - Sistema "Mi Red"

## 🎯 RECOMENDACIONES DE IMPLEMENTACIÓN

### Fase 1 (Semana 1) - CRÍTICO
1. ✅ Crear tablas: `skills`, `freelancer_skills`, `portfolio_items`
2. ✅ Crear tablas: `proposals`, `file_uploads`
3. ✅ Migrar datos existentes si los hay

### Fase 2 (Semana 2) - IMPORTANTE
1. ⚠️ Crear tablas: `payment_methods`, `notification_preferences`
2. ⚠️ Crear tablas: `favorites`, `saved_searches`, `disputes`
3. ⚠️ Agregar índices de búsqueda optimizados

### Fase 3 (Mes 2) - MEJORAS
1. 💡 Implementar teams y team_members
2. 💡 Agregar api_keys para integraciones
3. 💡 Optimizar consultas con vistas materializadas

## 🔍 ÍNDICES RECOMENDADOS

```sql
-- Búsquedas principales
CREATE INDEX idx_freelancer_skills ON freelancer_skills(skill_id, proficiency_level);
CREATE INDEX idx_portfolio_category ON portfolio_items(category_id, is_featured);
CREATE INDEX idx_proposals_project ON proposals(project_id, status);
CREATE INDEX idx_file_entity ON file_uploads(entity_type, entity_id);
```

## ❓ DECISIONES PENDIENTES

1. **¿Usar JSON o tablas relacionales para skills?**
   - Recomendación: Tablas relacionales para mejor búsqueda

2. **¿Almacenamiento de archivos local o cloud (S3)?**
   - Recomendación: Cloud para escalabilidad

3. **¿Consolidar las 2 bases de datos (MySQL + PostgreSQL)?**
   - Recomendación: Sí, migrar todo a PostgreSQL

4. **¿Implementar soft deletes en todas las tablas?**
   - Recomendación: Sí, agregar deleted_at