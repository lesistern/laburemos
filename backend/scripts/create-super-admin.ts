import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    console.log('🚀 Creando usuario SuperAdmin...');

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: 'lesistern@gmail.com' }
    });

    if (existingUser) {
      console.log('⚠️  Usuario ya existe. Actualizando permisos...');
      
      // Actualizar usuario existente a ADMIN
      const updatedUser = await prisma.user.update({
        where: { email: 'lesistern@gmail.com' },
        data: {
          userType: 'ADMIN',
          firstName: 'lesistern',
          lastName: 'SuperAdmin',
          isActive: true,
          emailVerified: true,
          phoneVerified: true,
          identityVerified: true,
          // Actualizar contraseña si es necesario
          passwordHash: await bcrypt.hash('Tyr1945@', 12),
        }
      });

      console.log('✅ Usuario actualizado exitosamente:');
      console.log(`   📧 Email: ${updatedUser.email}`);
      console.log(`   👤 Nombre: ${updatedUser.firstName} ${updatedUser.lastName}`);
      console.log(`   🛡️  Tipo: ${updatedUser.userType}`);
      console.log(`   🟢 Estado: ${updatedUser.isActive ? 'Activo' : 'Inactivo'}`);
      
      return updatedUser;
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash('Tyr1945@', 12);

    // Crear nuevo usuario SuperAdmin
    const superAdmin = await prisma.user.create({
      data: {
        email: 'lesistern@gmail.com',
        passwordHash: hashedPassword,
        userType: 'ADMIN',
        firstName: 'lesistern',
        lastName: 'SuperAdmin',
        phone: '+54 9 11 0000-0000',
        country: 'Argentina',
        city: 'Buenos Aires',
        stateProvince: 'Ciudad Autónoma de Buenos Aires',
        postalCode: '1000',
        address: 'Administración Central',
        bio: 'Administrador principal del sistema LaburAR. Acceso completo a todas las funcionalidades de la plataforma.',
        profileImage: 'https://ui-avatars.com/api/?name=lesistern+SuperAdmin&background=0ea5e9&color=fff&size=200',
        hourlyRate: 0,
        currency: 'ARS',
        language: 'es',
        timezone: 'America/Argentina/Buenos_Aires',
        emailVerified: true,
        phoneVerified: true,
        identityVerified: true,
        isActive: true,
        lastLogin: new Date(),
      }
    });

    // Crear wallet para el admin
    await prisma.wallet.create({
      data: {
        userId: superAdmin.id,
        balance: 0,
        pendingBalance: 0,
        currency: 'ARS'
      }
    });

    // Crear preferencias de notificaciones
    await prisma.notificationPreferences.create({
      data: {
        userId: superAdmin.id,
        emailNotifications: {
          newUsers: true,
          newProjects: true,
          payments: true,
          disputes: true,
          systemAlerts: true
        },
        pushNotifications: {
          critical: true,
          important: true,
          general: false
        },
        smsNotifications: {
          critical: true,
          security: true
        },
        frequency: 'REAL_TIME',
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        timezone: 'America/Argentina/Buenos_Aires',
        marketingEmails: false
      }
    });

    console.log('✅ SuperAdmin creado exitosamente:');
    console.log(`   📧 Email: ${superAdmin.email}`);
    console.log(`   🔑 Contraseña: Tyr1945@`);
    console.log(`   👤 Nombre: ${superAdmin.firstName} ${superAdmin.lastName}`);
    console.log(`   🛡️  Tipo: ${superAdmin.userType}`);
    console.log(`   🆔 ID: ${superAdmin.id}`);
    console.log(`   🟢 Estado: Activo y Verificado`);
    console.log('');
    console.log('🌐 Acceso al Panel Admin:');
    console.log('   🏠 Local: http://localhost:3000/admin');
    console.log('   ☁️  Producción: https://laburemos.com.ar/admin');
    console.log('');
    console.log('🎯 Funcionalidades disponibles:');
    console.log('   📊 Dashboard con métricas en tiempo real');
    console.log('   👥 Gestión completa de usuarios');
    console.log('   📂 Administración de categorías');
    console.log('   📈 Analíticas avanzadas');
    console.log('   🎫 Sistema de soporte y tickets');
    console.log('   🔧 Configuración del sistema');

    return superAdmin;

  } catch (error) {
    console.error('❌ Error creando SuperAdmin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
createSuperAdmin()
  .then(() => {
    console.log('🎉 ¡SuperAdmin configurado correctamente!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error en la configuración:', error);
    process.exit(1);
  });