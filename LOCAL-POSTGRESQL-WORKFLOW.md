# LABUREMOS - Local PostgreSQL Development Workflow

Complete guide for local-first PostgreSQL development with AWS RDS synchronization.

## 🎯 Overview

This workflow allows you to:
- Develop locally with PostgreSQL using pgAdmin4
- Synchronize data bidirectionally with AWS RDS
- Maintain consistent schema across environments
- Use local-first development approach

## 📋 Prerequisites

### Required Software
- **PostgreSQL 15+** with pgAdmin4
- **Node.js 18+** 
- **Git Bash** or PowerShell (for sync scripts)
- **AWS CLI** (for production access)

### Environment Variables
```bash
# Set AWS RDS password for sync operations
set AWS_RDS_PASSWORD=your_actual_aws_rds_password
```

## 🚀 Quick Setup (First Time)

### 1. PostgreSQL Installation & Setup
```bash
# Run the setup script
cd D:\Laburar
.\scripts\setup-local-postgresql.bat

# This will:
# ✅ Check PostgreSQL installation
# ✅ Start PostgreSQL service
# ✅ Create 'laburemos' database
# ✅ Verify connection
```

### 2. Environment Configuration
```bash
# Configure local development environment
.\scripts\setup-local-env.bat

# This will:
# ✅ Create optimized .env file
# ✅ Install dependencies
# ✅ Verify Prisma configuration
```

### 3. Schema Conversion (MySQL → PostgreSQL)
```bash
# Convert existing schema to PostgreSQL
.\scripts\convert-mysql-to-postgresql.bat

# This will:
# ✅ Backup original MySQL schema
# ✅ Convert field types to PostgreSQL
# ✅ Generate new Prisma client
```

### 4. Database Migration
```bash
cd backend

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Optional: Seed with test data
npm run db:seed
```

## 🔧 pgAdmin4 Configuration

### Connection Setup
1. Open **pgAdmin4**
2. Right-click **Servers** → **Create** → **Server...**
3. **General Tab:**
   - Name: `LABUREMOS Local`
4. **Connection Tab:**
   - Host: `localhost`
   - Port: `5432`
   - Database: `laburemos`
   - Username: `postgres`
   - Password: `postgres`
5. **Save** and connect

### Alternative Connection (AWS RDS)
1. Create second server: `LABUREMOS AWS RDS`
2. **Connection Tab:**
   - Host: `laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com`
   - Port: `5432`
   - Database: `laburemos`
   - Username: `postgres`
   - Password: `[your AWS RDS password]`
   - SSL Mode: `Require`

## 💻 Daily Development Workflow

### 1. Start Local Development
```bash
cd D:\Laburar

# Start local development environment
.\start-windows.bat

# Or start backend only
cd backend
npm run start:dev
```

### 2. Database Operations
```bash
cd backend

# Open database GUI
npm run db:studio

# Check migration status
npm run db:status

# Create new migration
npm run db:migrate:dev --name description-of-changes

# Reset database (DEV ONLY!)
npm run db:reset
```

### 3. Schema Changes
```bash
# 1. Edit prisma/schema.prisma
# 2. Generate new client
npm run db:generate

# 3. Create migration
npm run db:migrate:dev --name your-migration-name

# 4. Apply to local database
# (automatic with db:migrate:dev)
```

## 🔄 Data Synchronization

### Local → AWS RDS (Deploy Changes)
```bash
# ⚠️ WARNING: Overwrites AWS RDS with local data
.\scripts\sync-local-to-aws.bat

# Use when:
# - You've made changes locally
# - Ready to deploy to production
# - Want to sync local development data
```

### AWS RDS → Local (Get Production Data)
```bash
# ⚠️ WARNING: Overwrites local data with AWS RDS
.\scripts\sync-aws-to-local.bat

# Use when:
# - Want to work with production data locally
# - Need to debug production issues
# - Starting new development with fresh data
```

### Sync Process Details
Both sync scripts automatically:
1. ✅ **Test connections** to both databases
2. ✅ **Create backups** before any changes
3. ✅ **Export/import data** safely
4. ✅ **Verify operation** success
5. ✅ **Provide rollback** instructions

## 📁 File Structure

```
D:\Laburar/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Main database schema
│   │   ├── migrations/            # Database migrations
│   │   └── seed.ts               # Test data seeder
│   ├── .env                      # Local environment config
│   └── package.json              # Updated with db scripts
├── database/
│   └── local-postgresql-config.json  # pgAdmin4 config reference
├── scripts/
│   ├── setup-local-postgresql.bat    # Initial PostgreSQL setup
│   ├── setup-local-env.bat          # Environment configuration
│   ├── convert-mysql-to-postgresql.bat # Schema conversion
│   ├── sync-local-to-aws.bat        # Local → AWS sync
│   └── sync-aws-to-local.bat        # AWS → Local sync
└── backups/                      # Automatic database backups
    ├── local_backup_YYYY-MM-DD_HH-MM-SS.sql
    ├── aws_backup_YYYY-MM-DD_HH-MM-SS.sql
    └── [timestamped backups]
```

## 🛠️ Available npm Scripts

### Database Management
```bash
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Run development migrations
npm run db:migrate:prod  # Deploy migrations to production
npm run db:studio        # Open database GUI
npm run db:seed          # Seed with test data
npm run db:reset         # Reset database (DEV ONLY!)
npm run db:status        # Check migration status
```

### Development
```bash
npm run start:dev        # Start development server
npm run build            # Build for production
npm run test             # Run tests
npm run lint             # Lint code
```

## 🔒 Security & Best Practices

### Environment Variables
- ✅ Use `.env` for local development
- ✅ Set `AWS_RDS_PASSWORD` as environment variable
- ❌ Never commit real passwords to Git
- ✅ Use different secrets for dev/prod

### Database Access
- ✅ Local PostgreSQL for development
- ✅ AWS RDS for production
- ✅ Always backup before sync operations
- ❌ Never run sync scripts without understanding impact

### Migration Safety
- ✅ Test migrations locally first
- ✅ Review generated SQL before applying
- ✅ Backup production before deploying
- ❌ Never run `db:reset` in production

## 🚨 Troubleshooting

### PostgreSQL Connection Issues
```bash
# Check if PostgreSQL is running
sc query postgresql-x64-15

# Start PostgreSQL service
net start postgresql-x64-15

# Test connection
psql -U postgres -c "SELECT version();"
```

### Prisma Issues
```bash
# Clear Prisma cache
npx prisma generate --force

# Reset Prisma client
rm -rf node_modules/.prisma
npm run db:generate
```

### Sync Script Issues
```bash
# Check AWS RDS password
echo %AWS_RDS_PASSWORD%

# Test AWS connection manually
psql -h laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com -U postgres -d laburemos
```

### Migration Conflicts
```bash
# Check migration status
npm run db:status

# Reset and reapply (DEV ONLY!)
npm run db:reset
npm run db:migrate
```

## 📊 Monitoring & Maintenance

### Daily Checks
- ✅ PostgreSQL service running
- ✅ Local database accessible
- ✅ No pending migrations
- ✅ Backups directory has recent files

### Weekly Tasks
- 🗄️ Review and clean old backups
- 📊 Check database performance
- 🔄 Sync with production if needed
- 📝 Update documentation if schema changed

## 🎯 Next Steps

1. **Start Development**: Run setup scripts and begin coding
2. **Schema Changes**: Edit `schema.prisma` and create migrations
3. **Data Management**: Use pgAdmin4 for complex queries
4. **Production Sync**: Use sync scripts when ready to deploy
5. **Monitoring**: Set up regular backup and sync schedules

## 🔗 Useful Links

- **pgAdmin4 Documentation**: https://www.pgadmin.org/docs/
- **Prisma Documentation**: https://www.prisma.io/docs/
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/
- **AWS RDS PostgreSQL**: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html

---

**Created**: 2025-08-01  
**Updated**: 2025-08-01  
**Version**: 1.0  
**Status**: ✅ Complete and Ready for Use