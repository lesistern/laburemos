import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const seedCategories = async () => {
  console.log('🌱 Seeding categories...');

  const categories = [
    {
      name: 'Desarrollo Web',
      slug: 'desarrollo-web',
      description: 'Servicios de desarrollo web frontend y backend',
      icon: 'code',
      displayOrder: 1,
      children: [
        {
          name: 'Frontend',
          slug: 'frontend',
          description: 'Desarrollo de interfaces de usuario',
          icon: 'monitor',
          displayOrder: 1,
        },
        {
          name: 'Backend',
          slug: 'backend',
          description: 'Desarrollo de APIs y servidores',
          icon: 'server',
          displayOrder: 2,
        },
        {
          name: 'Full Stack',
          slug: 'full-stack',
          description: 'Desarrollo completo de aplicaciones web',
          icon: 'layers',
          displayOrder: 3,
        },
      ],
    },
    {
      name: 'Desarrollo Móvil',
      slug: 'desarrollo-movil',
      description: 'Aplicaciones para iOS y Android',
      icon: 'smartphone',
      displayOrder: 2,
      children: [
        {
          name: 'iOS',
          slug: 'ios',
          description: 'Desarrollo para iPhone y iPad',
          icon: 'apple',
          displayOrder: 1,
        },
        {
          name: 'Android',
          slug: 'android',
          description: 'Desarrollo para dispositivos Android',
          icon: 'android',
          displayOrder: 2,
        },
        {
          name: 'React Native',
          slug: 'react-native',
          description: 'Aplicaciones multiplataforma con React Native',
          icon: 'react',
          displayOrder: 3,
        },
      ],
    },
    {
      name: 'Diseño Gráfico',
      slug: 'diseno-grafico',
      description: 'Servicios de diseño visual y gráfico',
      icon: 'palette',
      displayOrder: 3,
      children: [
        {
          name: 'Logos e Identidad',
          slug: 'logos-identidad',
          description: 'Diseño de logotipos e identidad corporativa',
          icon: 'brand',
          displayOrder: 1,
        },
        {
          name: 'Diseño Web',
          slug: 'diseno-web',
          description: 'Diseño de interfaces y experiencia de usuario',
          icon: 'layout',
          displayOrder: 2,
        },
        {
          name: 'Ilustración',
          slug: 'ilustracion',
          description: 'Ilustraciones digitales y tradicionales',
          icon: 'brush',
          displayOrder: 3,
        },
      ],
    },
    {
      name: 'Marketing Digital',
      slug: 'marketing-digital',
      description: 'Servicios de marketing y publicidad online',
      icon: 'trending-up',
      displayOrder: 4,
      children: [
        {
          name: 'SEO',
          slug: 'seo',
          description: 'Optimización para motores de búsqueda',
          icon: 'search',
          displayOrder: 1,
        },
        {
          name: 'Redes Sociales',
          slug: 'redes-sociales',
          description: 'Gestión de redes sociales y contenido',
          icon: 'share',
          displayOrder: 2,
        },
        {
          name: 'Google Ads',
          slug: 'google-ads',
          description: 'Campañas publicitarias en Google',
          icon: 'target',
          displayOrder: 3,
        },
      ],
    },
    {
      name: 'Redacción y Contenido',
      slug: 'redaccion-contenido',
      description: 'Servicios de escritura y creación de contenido',
      icon: 'edit',
      displayOrder: 5,
      children: [
        {
          name: 'Copywriting',
          slug: 'copywriting',
          description: 'Redacción publicitaria y comercial',
          icon: 'pen-tool',
          displayOrder: 1,
        },
        {
          name: 'Blog y Artículos',
          slug: 'blog-articulos',
          description: 'Redacción de artículos y contenido web',
          icon: 'file-text',
          displayOrder: 2,
        },
        {
          name: 'Traducción',
          slug: 'traduccion',
          description: 'Servicios de traducción multiidioma',
          icon: 'globe',
          displayOrder: 3,
        },
      ],
    },
    {
      name: 'Consultoría',
      slug: 'consultoria',
      description: 'Servicios de consultoría empresarial',
      icon: 'briefcase',
      displayOrder: 6,
      children: [
        {
          name: 'Estrategia de Negocio',
          slug: 'estrategia-negocio',
          description: 'Consultoría en estrategia empresarial',
          icon: 'chess',
          displayOrder: 1,
        },
        {
          name: 'Finanzas',
          slug: 'finanzas',
          description: 'Consultoría financiera y contable',
          icon: 'dollar-sign',
          displayOrder: 2,
        },
        {
          name: 'Recursos Humanos',
          slug: 'recursos-humanos',
          description: 'Consultoría en gestión de personal',
          icon: 'users',
          displayOrder: 3,
        },
      ],
    },
  ];

  for (const categoryData of categories) {
    const { children, ...parentData } = categoryData;
    
    const parent = await prisma.category.upsert({
      where: { slug: parentData.slug },
      update: parentData,
      create: parentData,
    });

    if (children) {
      for (const childData of children) {
        await prisma.category.upsert({
          where: { slug: childData.slug },
          update: { ...childData, parentId: parent.id },
          create: { ...childData, parentId: parent.id },
        });
      }
    }
  }

  console.log('✅ Categories seeded successfully');
};