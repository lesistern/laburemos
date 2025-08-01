# LaburAR - Credenciales de Base de Datos

## Informacion de la Base de Datos

### Credenciales de Desarrollo
```
Base de Datos: laburemos_db
Usuario: laburemos_user
Contrasena: Tyr1945@
Host: localhost
Puerto: 3306
```

### URL de Conexion
```
DATABASE_URL="mysql://laburemos_user:Tyr1945@localhost:3306/laburemos_db"
```

## Estructura de la Base de Datos

### 35 Tablas Implementadas
- Autenticacion: users, user_sessions, password_resets, refresh_tokens, freelancer_profiles
- Skills: skills, freelancer_skills, portfolio_items  
- Categorias: categories, services, service_packages
- Proyectos: projects, proposals, project_milestones
- Comunicacion: conversations, messages, video_calls
- Pagos: wallets, payment_methods, transactions, escrow_accounts, withdrawal_requests
- Reviews: reviews, review_responses, user_reputation
- Gamificacion: badge_categories, badges, user_badges, badge_milestones
- Archivos: file_uploads, project_attachments
- Notificaciones: notifications, notification_preferences
- Usuarios: favorites, saved_searches
- Soporte: disputes, dispute_messages, support_tickets, support_responses
- Analytics: activity_logs, user_analytics
- NDA: user_alpha (sistema de proteccion alpha)

### Datos Iniciales Incluidos
- Usuario admin: `contacto.laburemos@gmail.com` / `admin123`
- 8 categorias principales
- 10 skills basicos verificados
- 5 categorias de badges con 6 badges iniciales

## Comandos de Configuracion

### Crear Base de Datos Completa
```bash
# Metodo 1: Script automatico (recomendado)
cd D:\Laburar
.\create-database.bat

# Metodo 2: MySQL directo
mysql -u root -p < database\create_laburemos_db_complete.sql
```

### Configurar Backend
```bash
cd backend

# Generar cliente Prisma
npm run db:generate

# Aplicar migraciones (opcional)
npm run db:migrate

# Verificar conexion
npm run db:studio
```

## Acceso a la Base de Datos

### phpMyAdmin
- URL: http://localhost/phpmyadmin
- Usuario: `laburemos_user`
- Contrasena: `Tyr1945@`

### MySQL Workbench
- Hostname: localhost
- Port: 3306
- Username: laburemos_user
- Password: Tyr1945@
- Schema: laburemos_db

### Linea de Comandos
```bash
# Conectar a MySQL
mysql -u laburemos_user -p laburemos_db
# Contrasena: Tyr1945@

# Verificar tablas
SHOW TABLES;

# Verificar usuario admin
SELECT * FROM users WHERE user_type = 'admin';
```

## Permisos del Usuario

El usuario `laburemos_user` tiene TODOS LOS PERMISOS sobre la base de datos `laburemos_db`:
- SELECT, INSERT, UPDATE, DELETE
- CREATE, DROP, ALTER
- INDEX, REFERENCES
- EXECUTE (para procedures y functions)

## Seguridad

### Consideraciones de Seguridad
- Usuario especifico para la aplicacion (no root)
- Contrasena compleja con caracteres especiales
- Permisos limitados solo a la base de datos laburemos_db
- Conexion local solamente (localhost)

### Para Produccion
```sql
-- Crear usuario para produccion con IP especifica
CREATE USER 'laburemos_prod'@'IP_SERVIDOR' IDENTIFIED BY 'CONTRASENA_MAS_SEGURA';
GRANT ALL PRIVILEGES ON laburemos_db.* TO 'laburemos_prod'@'IP_SERVIDOR';
```

## Troubleshooting

### Error de Conexion
```bash
# Verificar si el usuario existe
mysql -u root -p -e "SELECT User, Host FROM mysql.user WHERE User='laburemos_user';"

# Recrear usuario si es necesario
mysql -u root -p -e "DROP USER IF EXISTS 'laburemos_user'@'localhost';"
mysql -u root -p -e "CREATE USER 'laburemos_user'@'localhost' IDENTIFIED BY 'Tyr1945@';"
mysql -u root -p -e "GRANT ALL PRIVILEGES ON laburemos_db.* TO 'laburemos_user'@'localhost';"
mysql -u root -p -e "FLUSH PRIVILEGES;"
```

### Verificar Configuracion
```bash
# Backend
cd backend
echo %DATABASE_URL%  # Windows
echo $DATABASE_URL   # Linux/Mac

# Probar conexion con Prisma
npx prisma db pull
```

---

**IMPORTANTE**: Manten estas credenciales seguras y no las compartas en repositorios publicos. Para produccion, usa variables de entorno y credenciales mas seguras.