# AWS Deployment Information - LABUREMOS

## 🚀 Recursos AWS Creados

### EC2 Instance
- **Instance ID**: i-014e7a8e24ac2290d
- **Public IP**: 3.81.56.168
- **Instance Type**: t3.micro
- **Key Pair**: laburemos-key
- **Security Group**: sg-00099829a04cca633

### RDS PostgreSQL Database
- **DB Instance**: laburemos-db
- **Engine**: PostgreSQL 15.12
- **Instance Class**: db.t3.micro
- **Master Username**: postgres
- **Master Password**: Laburemos2025!
- **Storage**: 20 GB GP2
- **Publicly Accessible**: Yes

### S3 Bucket
- **Bucket Name**: laburemos-files-2025
- **Region**: us-east-1

### Security Group Rules
- **SSH (22)**: 0.0.0.0/0
- **HTTP (80)**: 0.0.0.0/0
- **NestJS API (3001)**: 0.0.0.0/0

## 📝 Comandos de Conexión

### SSH a EC2
```bash
ssh -i laburemos-key.pem ec2-user@3.81.56.168
```

### Verificar estado RDS
```bash
aws rds describe-db-instances --db-instance-identifier laburemos-db --query 'DBInstances[0].[DBInstanceStatus,Endpoint.Address]'
```

## 🔧 Configuración Backend

### Variables de entorno para NestJS
```env
NODE_ENV=production
DATABASE_URL=postgresql://postgres:Laburemos2025!@[RDS-ENDPOINT]:5432/laburemos
AWS_REGION=us-east-1
AWS_S3_BUCKET=laburemos-files-2025
JWT_SECRET=your-super-secure-jwt-secret
PORT=3001
```

### Script de despliegue EC2
```bash
#!/bin/bash
# Conectar a EC2
ssh -i laburemos-key.pem ec2-user@3.81.56.168

# En el servidor EC2:
sudo yum update -y
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs git
sudo npm install -g pm2

# Clonar repositorio (ajustar URL)
git clone https://github.com/tu-usuario/laburemos.git
cd laburemos/backend
npm install
npm run build

# Configurar variables de entorno
cp .env.example .env.production
nano .env.production  # Editar con valores de producción

# Iniciar con PM2
pm2 start dist/main.js --name "laburemos-backend" --env production
pm2 startup
pm2 save
```

## 📅 Creado: 2025-07-30