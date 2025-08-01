# Instrucciones para Crear la Base de Datos

## Metodos Disponibles

### Metodo 1: Script Automatico (Recomendado)
```bash
cd D:\Laburar
.\create-database.bat
```

### Metodo 2: Script Simple (Si el principal falla)
```bash
cd D:\Laburar
.\create-database-simple.bat
```

### Metodo 3: phpMyAdmin (Manual)
1. Abre http://localhost/phpmyadmin
2. Clic en "Importar"
3. Selecciona el archivo: `database\create_laburemos_db_complete.sql`
4. Clic en "Continuar"

### Metodo 4: Linea de Comandos
```bash
# En CMD como administrador
cd D:\Laburar
mysql -u root -p < database\create_laburemos_db_complete.sql
# Presiona Enter (contrasena root vacia por defecto)
```

## Verificar la Instalacion

### Script de Verificacion
```bash
cd D:\Laburar
.\verify-database.bat
```

### Verificacion Manual
1. Abre http://localhost/phpmyadmin
2. Usuario: `laburemos_user`
3. Contrasena: `Tyr1945@`
4. Deberia mostrar la base de datos `laburemos_db` con 35 tablas

## Credenciales Finales

```
Base de datos: laburemos_db
Usuario: laburemos_user
Contrasena: Tyr1945@
Host: localhost
Puerto: 3306
```

## Solucion de Problemas

### Error: "MySQL no esta corriendo"
1. Abre XAMPP Control Panel
2. Inicia el servicio MySQL
3. Ejecuta el script nuevamente

### Error: "No se encontro XAMPP"
1. Instala XAMPP desde https://www.apachefriends.org/
2. O usa el Metodo 3 (phpMyAdmin)

### Error: "Archivo SQL no encontrado"
1. Verifica que existe: `database\create_laburemos_db_complete.sql`
2. Ejecuta desde la carpeta raiz del proyecto: `D:\Laburar`

### Error: "Access denied"
1. Verifica que MySQL este corriendo
2. Si tienes contrasena en root, usa: `mysql -u root -p < database\create_laburemos_db_complete.sql`

## Configuracion del Backend

Despues de crear la base de datos, configura el backend:

```bash
cd backend

# Copia la configuracion de desarrollo
copy .env.development .env

# Genera el cliente Prisma
npm run db:generate

# Verifica la conexion
npm run db:studio
```

## URL de Conexion para el Backend

```
DATABASE_URL="mysql://laburemos_user:Tyr1945@localhost:3306/laburemos_db"
```

Esta URL ya esta configurada en `.env.development` y se copiara automaticamente.