import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create categories
  console.log('📦 Creating categories...');
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'programacion-tecnologia' },
      update: {},
      create: {
        name: 'Programación y Tecnología',
        slug: 'programacion-tecnologia',
        description: 'Desarrollo web, móvil, software y más',
        icon: 'code',
        displayOrder: 1,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'diseno-grafico' },
      update: {},
      create: {
        name: 'Diseño Gráfico',
        slug: 'diseno-grafico',
        description: 'Logos, branding, ilustraciones y más',
        icon: 'palette',
        displayOrder: 2,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'marketing-digital' },
      update: {},
      create: {
        name: 'Marketing Digital',
        slug: 'marketing-digital',
        description: 'SEO, SEM, redes sociales y publicidad online',
        icon: 'trending-up',
        displayOrder: 3,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'redaccion-traduccion' },
      update: {},
      create: {
        name: 'Redacción y Traducción',
        slug: 'redaccion-traduccion',
        description: 'Contenido, copywriting, traducción y edición',
        icon: 'edit',
        displayOrder: 4,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'video-animacion' },
      update: {},
      create: {
        name: 'Video y Animación',
        slug: 'video-animacion',
        description: 'Edición de video, animación 2D/3D y motion graphics',
        icon: 'video',
        displayOrder: 5,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'musica-audio' },
      update: {},
      create: {
        name: 'Música y Audio',
        slug: 'musica-audio',
        description: 'Producción musical, locución y edición de audio',
        icon: 'music',
        displayOrder: 6,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'negocios' },
      update: {},
      create: {
        name: 'Negocios',
        slug: 'negocios',
        description: 'Consultoría, planes de negocio y análisis',
        icon: 'briefcase',
        displayOrder: 7,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'datos-ia' },
      update: {},
      create: {
        name: 'Datos e IA',
        slug: 'datos-ia',
        description: 'Análisis de datos, machine learning e inteligencia artificial',
        icon: 'database',
        displayOrder: 8,
      },
    }),
  ]);

  console.log(`✅ Created ${categories.length} categories`);

  // Create admin user
  console.log('👤 Creating admin user...');
  const adminPassword = await bcrypt.hash('admin123', 12);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@laburemos.com.ar' },
    update: {},
    create: {
      email: 'admin@laburemos.com.ar',
      passwordHash: adminPassword,
      userType: 'ADMIN',
      firstName: 'Admin',
      lastName: 'LABUREMOS',
      emailVerified: true,
      isActive: true,
    },
  });

  console.log('✅ Created admin user');

  // Create sample badges
  console.log('🏆 Creating sample badges...');
  const badges = await Promise.all([
    prisma.badge.upsert({
      where: { name: 'Primera Venta' },
      update: {},
      create: {
        name: 'Primera Venta',
        description: 'Completó su primera venta exitosamente',
        icon: '🎉',
        color: '#10b981',
        rarity: 'COMMON',
        points: 100,
        requirements: { type: 'first_sale' },
      },
    }),
    prisma.badge.upsert({
      where: { name: 'Perfil Completo' },
      update: {},
      create: {
        name: 'Perfil Completo',
        description: 'Completó toda la información de su perfil',
        icon: '📝',
        color: '#3b82f6',
        rarity: 'COMMON',
        points: 50,
        requirements: { type: 'complete_profile' },
      },
    }),
    prisma.badge.upsert({
      where: { name: 'Top Freelancer' },
      update: {},
      create: {
        name: 'Top Freelancer',
        description: 'Mantiene una calificación excelente consistentemente',
        icon: '⭐',
        color: '#f59e0b',
        rarity: 'LEGENDARY',
        points: 1000,
        requirements: { type: 'top_rating', minRating: 4.8, minProjects: 20 },
      },
    }),
    prisma.badge.upsert({
      where: { name: 'Fundador' },
      update: {},
      create: {
        name: 'Fundador',
        description: 'Miembro fundador de la plataforma LABUREMOS',
        icon: '👑',
        color: '#8b5cf6',
        rarity: 'EXCLUSIVE',
        points: 500,
        requirements: { type: 'founder', joinedBefore: '2024-12-31' },
      },
    }),
  ]);

  console.log(`✅ Created ${badges.length} badges`);

  // Create demo freelancer
  console.log('👨‍💻 Creating demo freelancer...');
  const freelancerPassword = await bcrypt.hash('demo123', 12);
  
  const freelancerUser = await prisma.user.create({
    data: {
      email: 'freelancer@demo.com',
      passwordHash: freelancerPassword,
      userType: 'FREELANCER',
      firstName: 'Juan',
      lastName: 'Pérez',
      city: 'Buenos Aires',
      country: 'Argentina',
      emailVerified: true,
      isActive: true,
      freelancerProfile: {
        create: {
          title: 'Desarrollador Full Stack',
          professionalOverview: 'Desarrollador con 5 años de experiencia en React, Node.js y Python',
          skills: ['React', 'Node.js', 'Python', 'PostgreSQL', 'AWS'],
          experienceYears: 5,
          availability: 'FULL_TIME',
          responseTime: '< 1 hora',
        },
      },
    },
  });

  // Create a service for the freelancer
  const service = await prisma.service.create({
    data: {
      freelancerId: freelancerUser.id,
      categoryId: categories[0].id, // Programación y Tecnología
      title: 'Desarrollo de Aplicación Web Full Stack',
      description: 'Desarrollo completo de aplicaciones web con React y Node.js',
      priceType: 'FIXED',
      basePrice: 50000,
      deliveryTime: 14,
      revisionsIncluded: 3,
      tags: ['React', 'Node.js', 'Full Stack', 'Web Development'],
      isActive: true,
      packages: {
        create: [
          {
            packageType: 'BASIC',
            title: 'Landing Page',
            description: 'Landing page responsiva con hasta 5 secciones',
            price: 25000,
            deliveryTime: 7,
            revisions: 2,
            features: ['Diseño responsivo', '5 secciones', '2 revisiones'],
          },
          {
            packageType: 'STANDARD',
            title: 'Sitio Web Completo',
            description: 'Sitio web completo con panel de administración',
            price: 50000,
            deliveryTime: 14,
            revisions: 3,
            features: ['Diseño responsivo', 'Panel admin', '3 revisiones', 'SEO básico'],
            isPopular: true,
          },
          {
            packageType: 'PREMIUM',
            title: 'Aplicación Web Completa',
            description: 'Aplicación web full stack con todas las funcionalidades',
            price: 100000,
            deliveryTime: 30,
            revisions: 5,
            features: ['Aplicación completa', 'Base de datos', '5 revisiones', 'Deploy incluido', 'Soporte 30 días'],
          },
        ],
      },
    },
  });

  console.log('✅ Created demo freelancer and service');

  // Create demo client
  console.log('👩‍💼 Creating demo client...');
  const clientPassword = await bcrypt.hash('demo123', 12);
  
  const clientUser = await prisma.user.create({
    data: {
      email: 'client@demo.com',
      passwordHash: clientPassword,
      userType: 'CLIENT',
      firstName: 'María',
      lastName: 'González',
      city: 'Córdoba',
      country: 'Argentina',
      emailVerified: true,
      isActive: true,
    },
  });

  // Create a sample project
  const project = await prisma.project.create({
    data: {
      clientId: clientUser.id,
      freelancerId: freelancerUser.id,
      serviceId: service.id,
      title: 'Desarrollo de E-commerce',
      description: 'Necesito un e-commerce completo para mi tienda de ropa',
      budget: 75000,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: 'IN_PROGRESS',
      paymentStatus: 'ESCROW',
      startedAt: new Date(),
    },
  });

  console.log('✅ Created demo project');

  // Create sample notification
  await prisma.notification.create({
    data: {
      userId: freelancerUser.id,
      type: 'PROJECT_STARTED',
      title: 'Nuevo proyecto iniciado',
      message: 'Tu proyecto "Desarrollo de E-commerce" ha sido iniciado',
      data: { projectId: project.id },
    },
  });

  console.log('✅ Created sample notification');

  console.log('🎉 Database seeding completed successfully!');
  console.log(`
  Demo Accounts Created:
  
  👑 Admin:
  Email: admin@laburemos.com.ar
  Password: admin123
  
  👨‍💻 Freelancer:
  Email: freelancer@demo.com
  Password: demo123
  
  👩‍💼 Client:
  Email: client@demo.com
  Password: demo123
  `);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });