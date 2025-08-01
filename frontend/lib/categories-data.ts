export interface Subcategory {
  id: string
  name: string
  slug: string
}

export interface Category {
  id: string
  name: string
  slug: string
  emoji: string
  bgImage: string
  subcategories: Subcategory[]
}

export const MAIN_CATEGORIES: Category[] = [
  {
    id: 'tendencias',
    name: 'Tendencias',
    slug: 'tendencias',
    emoji: '🔥',
    bgImage: 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=640&h=360&fit=crop&auto=format',
    subcategories: [
      { id: 'publica-tu-libro', name: 'Publica tu libro', slug: 'publica-tu-libro' },
      { id: 'crea-tu-sitio-web', name: 'Crea tu sitio web', slug: 'crea-tu-sitio-web' },
      { id: 'crea-tu-marca', name: 'Crea tu marca', slug: 'crea-tu-marca' },
      { id: 'encontrar-un-trabajo', name: 'Encontrar un trabajo', slug: 'encontrar-un-trabajo' },
      { id: 'servicios-de-ia', name: 'Servicios de IA', slug: 'servicios-de-ia' },
    ]
  },
  {
    id: 'artes-graficas-diseno',
    name: 'Artes gráficas y diseño',
    slug: 'artes-graficas-diseno',
    emoji: '🎨',
    bgImage: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=640&h=360&fit=crop&auto=format',
    subcategories: [
      { id: 'logo-identidad-marca', name: 'Logo e identidad de marca', slug: 'logo-identidad-marca' },
      { id: 'arte-ilustraciones', name: 'Arte e ilustraciones', slug: 'arte-ilustraciones' },
      { id: 'diseno-aplicaciones-sitios-web', name: 'Diseño de aplicaciones y sitios web', slug: 'diseno-aplicaciones-sitios-web' },
      { id: 'producto-gaming', name: 'Producto y gaming', slug: 'producto-gaming' },
      { id: 'diseno-impresion', name: 'Diseño de impresión', slug: 'diseno-impresion' },
      { id: 'libros-ebooks', name: 'Libros y eBooks', slug: 'libros-ebooks' },
      { id: 'diseno-visual', name: 'Diseño visual', slug: 'diseno-visual' },
      { id: 'diseno-marketing', name: 'Diseño de marketing', slug: 'diseno-marketing' },
      { id: 'arquitectura-diseno-construccion', name: 'Arquitectura y diseño de construcción', slug: 'arquitectura-diseno-construccion' },
      { id: 'moda-merchandise', name: 'Moda y merchandise', slug: 'moda-merchandise' },
      { id: 'diseno-3d', name: 'Diseño 3D', slug: 'diseno-3d' },
      { id: 'varios', name: 'Varios', slug: 'varios-diseno' },
    ]
  },
  {
    id: 'programacion-tecnologia',
    name: 'Programación y tecnología',
    slug: 'programacion-tecnologia',
    emoji: '💻',
    bgImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=640&h=360&fit=crop&auto=format',
    subcategories: [
      { id: 'desarrollo-sitios-web', name: 'Desarrollo de sitios web', slug: 'desarrollo-sitios-web' },
      { id: 'idiomas-marcos', name: 'Idiomas y marcos', slug: 'idiomas-marcos' },
      { id: 'desarrollo-ia', name: 'Desarrollo de IA', slug: 'desarrollo-ia' },
      { id: 'vibecode', name: 'VibeCode', slug: 'vibecode' },
      { id: 'desarrollo-aplicaciones-moviles', name: 'Desarrollo de aplicaciones móviles', slug: 'desarrollo-aplicaciones-moviles' },
      { id: 'desarrollo-chatbots', name: 'Desarrollo de chatbots', slug: 'desarrollo-chatbots' },
      { id: 'desarrollo-videojuegos', name: 'Desarrollo de videojuegos', slug: 'desarrollo-videojuegos' },
      { id: 'nube-ciberseguridad', name: 'Nube y ciberseguridad', slug: 'nube-ciberseguridad' },
      { id: 'desarrollo-software', name: 'Desarrollo de software', slug: 'desarrollo-software' },
      { id: 'blockchain-criptomonedas', name: 'Blockchain y criptomonedas', slug: 'blockchain-criptomonedas' },
      { id: 'varios', name: 'Varios', slug: 'varios-tecnologia' },
    ]
  },
  {
    id: 'marketing-digital',
    name: 'Marketing digital',
    slug: 'marketing-digital',
    emoji: '📈',
    bgImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=640&h=360&fit=crop&auto=format',
    subcategories: [
      { id: 'posicionamiento-buscadores', name: 'Posicionamiento en buscadores', slug: 'posicionamiento-buscadores' },
      { id: 'redes-sociales', name: 'Redes sociales', slug: 'redes-sociales' },
      { id: 'especifico-canal', name: 'Específico de canal', slug: 'especifico-canal' },
      { id: 'metodos-tecnicas', name: 'Métodos y técnicas', slug: 'metodos-tecnicas' },
      { id: 'escala-marketing-ia', name: 'Escala tu marketing con IA', slug: 'escala-marketing-ia' },
      { id: 'analisis-estrategia', name: 'Análisis y estrategia', slug: 'analisis-estrategia' },
      { id: 'industria-fines-especificos', name: 'Industria y fines específicos', slug: 'industria-fines-especificos' },
    ]
  },
  {
    id: 'video-animacion',
    name: 'Video y animación',
    slug: 'video-animacion',
    emoji: '🎬',
    bgImage: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=640&h=360&fit=crop&auto=format',
    subcategories: [
      { id: 'edicion-postproduccion', name: 'Edición y postproducción', slug: 'edicion-postproduccion' },
      { id: 'videos-sociales-marketing', name: 'Videos sociales y de marketing', slug: 'videos-sociales-marketing' },
      { id: 'graficos-animados', name: 'Gráficos animados', slug: 'graficos-animados' },
      { id: 'videos-presentador', name: 'Videos de presentador', slug: 'videos-presentador' },
      { id: 'animacion', name: 'Animación', slug: 'animacion' },
      { id: 'produccion-cinematografica', name: 'Producción cinematográfica', slug: 'produccion-cinematografica' },
      { id: 'videos-explicativos', name: 'Videos explicativos', slug: 'videos-explicativos' },
      { id: 'videos-productos', name: 'Videos de productos', slug: 'videos-productos' },
      { id: 'video-ia', name: 'Video de IA', slug: 'video-ia' },
      { id: 'varios', name: 'Varios', slug: 'varios-video' },
    ]
  },
  {
    id: 'escritura-traduccion',
    name: 'Escritura y traducción',
    slug: 'escritura-traduccion',
    emoji: '✍️',
    bgImage: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=640&h=360&fit=crop&auto=format',
    subcategories: [
      { id: 'redaccion-contenido', name: 'Redacción de contenido', slug: 'redaccion-contenido' },
      { id: 'edicion-critica', name: 'Edición y crítica', slug: 'edicion-critica' },
      { id: 'libros-libros-electronicos', name: 'Libros y libros electrónicos', slug: 'libros-libros-electronicos' },
      { id: 'redaccion-profesional', name: 'Redacción profesional', slug: 'redaccion-profesional' },
      { id: 'contenido-negocios-marketing', name: 'Contenido para negocios y marketing', slug: 'contenido-negocios-marketing' },
      { id: 'traduccion-transcripcion', name: 'Traducción y transcripción', slug: 'traduccion-transcripcion' },
      { id: 'contenido-especifico-industria', name: 'Contenido específico de la industria', slug: 'contenido-especifico-industria' },
      { id: 'varios', name: 'Varios', slug: 'varios-escritura' },
    ]
  },
  {
    id: 'musica-audio',
    name: 'Música y audio',
    slug: 'musica-audio',
    emoji: '🎵',
    bgImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=640&h=360&fit=crop&auto=format',
    subcategories: [
      { id: 'produccion-escritura-musical', name: 'Producción y escritura musical', slug: 'produccion-escritura-musical' },
      { id: 'ingenieria-audio-postproduccion', name: 'Ingeniería de audio y posproducción', slug: 'ingenieria-audio-postproduccion' },
      { id: 'voz-off-narracion', name: 'Voz en off y narración', slug: 'voz-off-narracion' },
      { id: 'streaming-audio', name: 'Streaming y audio', slug: 'streaming-audio' },
      { id: 'dj', name: 'DJ', slug: 'dj' },
      { id: 'diseno-sonido', name: 'Diseño de sonido', slug: 'diseno-sonido' },
      { id: 'lecciones-transcripciones', name: 'Lecciones y transcripciones', slug: 'lecciones-transcripciones' },
    ]
  },
  {
    id: 'negocios',
    name: 'Negocios',
    slug: 'negocios',
    emoji: '💼',
    bgImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=640&h=360&fit=crop&auto=format',
    subcategories: [
      { id: 'constitucion-empresas-consultoria', name: 'Constitución de empresas y consultoría', slug: 'constitucion-empresas-consultoria' },
      { id: 'operaciones-gestion', name: 'Operaciones y gestión', slug: 'operaciones-gestion' },
      { id: 'servicios-juridicos', name: 'Servicios jurídicos', slug: 'servicios-juridicos' },
      { id: 'ventas-atencion-cliente', name: 'Ventas y atención al cliente', slug: 'ventas-atencion-cliente' },
      { id: 'datos-business-intelligence', name: 'Datos y Business Intelligence', slug: 'datos-business-intelligence' },
      { id: 'varios', name: 'Varios', slug: 'varios-negocios' },
    ]
  },
  {
    id: 'finanzas',
    name: 'Finanzas',
    slug: 'finanzas',
    emoji: '💰',
    bgImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=640&h=360&fit=crop&auto=format',
    subcategories: [
      { id: 'servicios-contabilidad', name: 'Servicios de contabilidad', slug: 'servicios-contabilidad' },
      { id: 'finanzas-corporativas', name: 'Finanzas corporativas', slug: 'finanzas-corporativas' },
      { id: 'consultoria-fiscal', name: 'Consultoría fiscal', slug: 'consultoria-fiscal' },
      { id: 'planificacion-analisis-financiero', name: 'Planificación y análisis financiero', slug: 'planificacion-analisis-financiero' },
      { id: 'finanzas-personales-gestion-patrimonial', name: 'Finanzas personales y gestión patrimonial', slug: 'finanzas-personales-gestion-patrimonial' },
      { id: 'recaudacion-fondos', name: 'Recaudación de fondos', slug: 'recaudacion-fondos' },
      { id: 'banking', name: 'Banking', slug: 'banking' },
    ]
  },
  {
    id: 'servicios-ia',
    name: 'Servicios de IA',
    slug: 'servicios-ia',
    emoji: '🤖',
    bgImage: 'https://images.unsplash.com/photo-1555255707-c07966088b7b?w=640&h=360&fit=crop&auto=format',
    subcategories: [
      { id: 'desarrollo-aplicaciones-moviles-ia', name: 'Desarrollo de aplicaciones móviles con IA', slug: 'desarrollo-aplicaciones-moviles-ia' },
      { id: 'datos', name: 'Datos', slug: 'datos' },
      { id: 'artistas-ia', name: 'Artistas de IA', slug: 'artistas-ia' },
      { id: 'ia-negocios', name: 'IA para negocios', slug: 'ia-negocios' },
      { id: 'video-ia', name: 'Video de IA', slug: 'video-ia-servicios' },
      { id: 'audio-ia', name: 'Audio con IA', slug: 'audio-ia' },
      { id: 'contenido-ia', name: 'Contenido de IA', slug: 'contenido-ia' },
    ]
  },
  {
    id: 'crecimiento-personal',
    name: 'Crecimiento personal',
    slug: 'crecimiento-personal',
    emoji: '🌱',
    bgImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=640&h=360&fit=crop&auto=format',
    subcategories: [
      { id: 'superacion-personal', name: 'Superación personal', slug: 'superacion-personal' },
      { id: 'moda-estilo', name: 'Moda y estilo', slug: 'moda-estilo' },
      { id: 'bienestar-fitness', name: 'Bienestar y fitness', slug: 'bienestar-fitness' },
      { id: 'videojuegos', name: 'Videojuegos', slug: 'videojuegos' },
      { id: 'ocio-pasatiempos', name: 'Ocio y pasatiempos', slug: 'ocio-pasatiempos' },
      { id: 'varios', name: 'Varios', slug: 'varios-personal' },
    ]
  },
  {
    id: 'consultoria',
    name: 'Consultoría',
    slug: 'consultoria',
    emoji: '👔',
    bgImage: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=640&h=360&fit=crop&auto=format',
    subcategories: [
      { id: 'consultores-empresariales', name: 'Consultores empresariales', slug: 'consultores-empresariales' },
      { id: 'estrategia-marketing', name: 'Estrategia de marketing', slug: 'estrategia-marketing' },
      { id: 'consultoria-datos', name: 'Consultoría de datos', slug: 'consultoria-datos' },
      { id: 'coaching-asesoramiento', name: 'Coaching y asesoramiento', slug: 'coaching-asesoramiento' },
      { id: 'consultoria-tecnologia', name: 'Consultoría de tecnología', slug: 'consultoria-tecnologia' },
      { id: 'tutoria', name: 'Tutoría', slug: 'tutoria' },
    ]
  },
  {
    id: 'datos',
    name: 'Datos',
    slug: 'datos',
    emoji: '📊',
    bgImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=640&h=360&fit=crop&auto=format',
    subcategories: [
      { id: 'ciencia-datos-aprendizaje-automatico', name: 'Ciencia de datos y aprendizaje automático', slug: 'ciencia-datos-aprendizaje-automatico' },
      { id: 'analisis-visualizacion-datos', name: 'Análisis y visualización de datos', slug: 'analisis-visualizacion-datos' },
      { id: 'recopilacion-datos', name: 'Recopilación de datos', slug: 'recopilacion-datos' },
      { id: 'gestion-datos', name: 'Gestión de datos', slug: 'gestion-datos' },
      { id: 'bases-datos-ingenieria', name: 'Bases de datos e ingeniería', slug: 'bases-datos-ingenieria' },
    ]
  },
  {
    id: 'fotografia',
    name: 'Fotografía',
    slug: 'fotografia',
    emoji: '📷',
    bgImage: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=640&h=360&fit=crop&auto=format',
    subcategories: [
      { id: 'productos-estilo-vida', name: 'Productos y estilo de vida', slug: 'productos-estilo-vida' },
      { id: 'personas-escenas', name: 'Personas y escenas', slug: 'personas-escenas' },
      { id: 'fotografos-locales', name: 'Fotógrafos locales', slug: 'fotografos-locales' },
      { id: 'varios', name: 'Varios', slug: 'varios-fotografia' },
    ]
  },
]

// Helper function to get all subcategories details
export function getSubcategoryDetails(): Record<string, any> {
  const subcategoriesMap: Record<string, any> = {
    // Tendencias subcategories
    'publica-tu-libro': {
      name: 'Publica tu libro',
      services: [
        'Diseño de libros',
        'Edición de libros',
        'Marketing de libros y libros electrónicos',
        'Ilustraciones de libros infantiles',
        'Lector beta',
        'Convertir a libro electrónico',
        'Escritura de libros electrónicos',
      ]
    },
    'crea-tu-sitio-web': {
      name: 'Crea tu sitio web',
      services: [
        'E-commerce & Dropshipping',
        'Shopify',
        'WordPress',
        'Diseño web',
        'Marketing para e-commerce',
      ]
    },
    'crea-tu-marca': {
      name: 'Crea tu marca',
      services: [
        'Estrategia de marca',
        'Guías de estilo para marcas',
        'Administración de redes sociales',
        'Diseños para medios sociales',
        'Videos UGC',
        'Anuncios y comerciales en video',
        'Redes sociales pagas',
      ]
    },
    'encontrar-un-trabajo': {
      name: 'Encontrar un trabajo',
      services: [
        'Redacción de currículums',
        'Diseño de currículums',
        'Buscar y aplicar',
        'Preparación para entrevistas',
        'Consultoría en carreras',
        'Perfiles de LinkedIn',
      ]
    },
    'servicios-de-ia': {
      name: 'Servicios de IA',
      services: [
        'Sitios web y software con IA',
        'Aplicaciones móviles de IA',
        'Automatizaciones y agentes de IA',
        'Entrenamiento del modelo de datos',
        'Consultoría tecnológica con IA',
        'Optimización del motor generativo',
      ]
    },

    // Artes gráficas y diseño subcategories
    'logo-identidad-marca': {
      name: 'Logo e identidad de marca',
      services: [
        'Diseño de logos',
        'Guías de estilo para marcas',
        'Tarjetas de presentación y papelería',
        'Fuentes y tipografía',
        'Dirección de arte',
        'Herramienta Logo Maker',
      ]
    },
    'arte-ilustraciones': {
      name: 'Arte e ilustraciones',
      services: [
        'Ilustraciones',
        'Artistas de IA',
        'Diseño de avatar de IA',
        'Retratos y caricaturas',
        'Ilustraciones de cómics',
        'Ilustración de dibujos animados',
        'Storyboards',
        'Diseño de portada de álbumes',
        'Diseño de patrones',
        'Diseño de tatuajes',
      ]
    },
    'diseno-aplicaciones-sitios-web': {
      name: 'Diseño de aplicaciones y sitios web',
      services: [
        'Diseño web',
        'Diseño de aplicaciones',
        'Diseño UX',
        'Diseño de landing page',
        'Diseño de íconos',
      ]
    },
    'producto-gaming': {
      name: 'Producto y gaming',
      services: [
        'Diseño industrial y de productos',
        'Modelado de personajes',
        'Game art',
        'Artes gráficas para Streamers',
      ]
    },
    'diseno-impresion': {
      name: 'Diseño de impresión',
      services: [
        'Diseño de folletos',
        'Diseño de flyers',
        'Diseño de packaging y etiquetas',
        'Diseño de pósteres',
        'Diseño de catálogos',
        'Diseño de menús',
      ]
    },
    'libros-ebooks': {
      name: 'Libros y eBooks',
      services: [
        'Diseño de libros',
        'Portadas de libros',
        'Diseño y composición de libros',
        'Ilustraciones de libros infantiles',
        'Ilustración de cómics',
      ]
    },
    'diseno-visual': {
      name: 'Diseño visual',
      services: [
        'Edición de imágenes',
        'Edición de imágenes con IA',
        'Diseño de presentaciones',
        'Diseño de currículums',
        'Diseño de infografías',
        'Vectorización',
      ]
    },
    'diseno-marketing': {
      name: 'Diseño de marketing',
      services: [
        'Diseños para redes sociales',
        'Diseño de correo electrónico',
        'Banners web',
        'Diseño de carteles',
      ]
    },
    'arquitectura-diseno-construccion': {
      name: 'Arquitectura y diseño de construcción',
      services: [
        'Arquitectura y diseño de interiores',
        'Paisajismo',
        'Ingeniería de edificación',
        'Diseño de iluminación',
      ]
    },
    'moda-merchandise': {
      name: 'Moda y merchandise',
      services: [
        'Camisetas y artículos de promoción',
        'Diseño de moda',
        'Diseño de joyas',
      ]
    },
    'diseno-3d': {
      name: 'Diseño 3D',
      services: [
        'Arquitectura 3D',
        'Diseño industrial en 3D',
        'Moda y prendas de vestir en 3D',
        'Personajes para impresión 3D',
        'Paisaje 3D',
        'Game art en 3D',
        'Diseño de joyas en 3D',
      ]
    },
    'varios-diseno': {
      name: 'Varios',
      services: [
        'Consejos de diseño',
      ]
    },

    // Programación y tecnología subcategories
    'desarrollo-sitios-web': {
      name: 'Desarrollo de sitios web',
      services: [
        'Sitio web comercial',
        'Desarrollo de e-commerce',
        'Sitios web personalizados',
        'Landing pages',
        'Sitios web Dropshipping',
        'Plataformas de sitios web',
        'WordPress',
        'Shopify',
        'Wix',
        'Webflow',
        'Bubble',
        'Mantenimiento del sitio web',
        'Personalización del sitio web',
        'Corrección de errores',
        'Copia de seguridad y migración',
        'Optimización de velocidad',
      ]
    },
    'idiomas-marcos': {
      name: 'Idiomas y marcos',
      services: [
        'Python',
        'React',
        'Java',
        'React Native',
        'Flutter',
      ]
    },
    'desarrollo-ia': {
      name: 'Desarrollo de IA',
      services: [
        'Sitios web y software con IA',
        'Aplicaciones móviles de IA',
        'Integraciones de IA',
        'Automatizaciones y agentes de IA',
        'Perfeccionamiento de la IA',
        'Consultoría tecnológica con IA',
      ]
    },
    'vibecode': {
      name: 'VibeCode',
      services: [
        'Desarrollo y MVP',
        'Solución de problemas y mejoras',
        'Implementaciones y DevOps',
      ]
    },
    'desarrollo-aplicaciones-moviles': {
      name: 'Desarrollo de aplicaciones móviles',
      services: [
        'Desarrollo multiplataforma',
        'Desarrollo de aplicaciones para Android',
        'Desarrollo de aplicaciones para iOS',
        'Mantenimiento de aplicaciones móviles',
      ]
    },
    'desarrollo-chatbots': {
      name: 'Desarrollo de chatbots',
      services: [
        'Chatbots de IA',
        'Chatbot basados en reglas',
      ]
    },
    'desarrollo-videojuegos': {
      name: 'Desarrollo de videojuegos',
      services: [
        'Unreal Engine',
        'Unity',
        'Roblox',
        'Fivem',
      ]
    },
    'nube-ciberseguridad': {
      name: 'Nube y ciberseguridad',
      services: [
        'Cloud Computing',
        'DevOps Engineering',
        'Cybersecurity',
      ]
    },
    'desarrollo-software': {
      name: 'Desarrollo de software',
      services: [
        'Aplicaciones web',
        'Automatizaciones y flujos de trabajo',
        'API e integraciones',
        'Bases de datos',
        'QA y revisión',
        'Pruebas de usuario',
      ]
    },
    'blockchain-criptomonedas': {
      name: 'Blockchain y criptomonedas',
      services: [
        'Aplicaciones descentralizadas (dApps)',
        'Criptomonedas y tokens',
      ]
    },
    'varios-tecnologia': {
      name: 'Varios',
      services: [
        'Ingeniería electrónica',
        'Support & IT',
        'Creación de modelos',
        'Etiquetado y anotación de datos',
        'Conversión de archivos',
      ]
    },

    // Marketing digital subcategories
    'posicionamiento-buscadores': {
      name: 'Posicionamiento en buscadores',
      services: [
        'Posicionamiento web (SEO)',
        'Optimización del motor generativo',
        'Marketing de motores de búsqueda (SEM)',
        'SEO local',
        'SEO para E-commerce',
        'SEO de video',
      ]
    },
    'redes-sociales': {
      name: 'Redes sociales',
      services: [
        'Marketing para redes sociales',
        'Redes sociales pagas',
        'Comercio en redes sociales',
        'Marketing de influencia',
        'Community management',
      ]
    },
    'especifico-canal': {
      name: 'Específico de canal',
      services: [
        'TikTok Shop',
        'Campaña de Facebook Ads',
        'Marketing en instagram',
        'Google SEM',
        'Marketing shopify',
      ]
    },
    'metodos-tecnicas': {
      name: 'Métodos y técnicas',
      services: [
        'Video marketing',
        'Marketing para e-commerce',
        'Email marketing',
        'Automatizaciones de correo electrónico',
        'Automatizaciones de marketing',
        'Publicación de invitados',
        'Marketing de afiliados',
        'Publicidad display',
        'Relaciones públicas',
        'Crowdfunding',
        'SMS Marketing',
      ]
    },
    'escala-marketing-ia': {
      name: 'Escala tu marketing con IA',
      services: [
        'Estrategia de prompts de IA para marketing',
        'Diseño de personalidad de marca',
        'Personalización de email marketing',
        'Gestión de campañas impulsada por IA',
        'Automatización y licitaciones de anuncios impulsadas por IA',
      ]
    },
    'analisis-estrategia': {
      name: 'Análisis y estrategia',
      services: [
        'Estrategia de marketing',
        'Conceptos e ideas de marketing',
        'Optimización de la tasa de conversión (CRO)',
        'Branding y marketing responsables',
        'Web analytics',
        'Asesoramiento de marketing',
      ]
    },
    'industria-fines-especificos': {
      name: 'Industria y fines específicos',
      services: [
        'Promoción musical',
        'Marketing de pódcast',
        'Marketing de aplicaciones móviles',
        'Marketing de libros y libros electrónicos',
      ]
    },

    // Video y animación subcategories
    'edicion-postproduccion': {
      name: 'Edición y postproducción',
      services: [
        'Edición de video',
        'Efectos visuales',
        'Videoarte',
        'Videos de intros y outros',
        'Edición de plantillas de video',
        'Subtítulos y leyendas',
      ]
    },
    'videos-sociales-marketing': {
      name: 'Videos sociales y de marketing',
      services: [
        'Anuncios y comerciales en video',
        'Videos en redes sociales',
        'Videos musicales',
        'Videos de diapositivas',
      ]
    },
    'graficos-animados': {
      name: 'Gráficos animados',
      services: [
        'Animación de logos',
        'Lottie y Animación web',
        'Animación de texto',
      ]
    },
    'videos-presentador': {
      name: 'Videos de presentador',
      services: [
        'Videos UGC',
        'Videos de presentadores',
        'Anuncios UGC',
        'Videos de UGC para TikTok',
      ]
    },
    'animacion': {
      name: 'Animación',
      services: [
        'Animación de personajes',
        'GIF animados',
        'Animación para niños',
        'Animación para Streamers',
        'Montaje',
        'Animación de NFT',
      ]
    },
    'produccion-cinematografica': {
      name: 'Producción cinematográfica',
      services: [
        'Camarógrafos',
        'Producción cinematográfica',
      ]
    },
    'videos-explicativos': {
      name: 'Videos explicativos',
      services: [
        'Video explicativo animado',
        'Explicaciones con imágenes reales',
        'Screencasting',
        'Producción de video de eLearning',
        'Videos de crowdfunding',
      ]
    },
    'videos-productos': {
      name: 'Videos de productos',
      services: [
        'Animación de productos en 3D',
        'Videos de productos para e-commerce',
        'Videos corporativos',
        'Vistas previas de aplicaciones y sitios web',
      ]
    },
    'video-ia': {
      name: 'Video de IA',
      services: [
        'Videoarte con IA',
        'Videos musicales de IA',
        'Avatares de video con IA',
      ]
    },
    'varios-video': {
      name: 'Varios',
      services: [
        'Avatares virtuales y para Streaming',
        'De artículo a video',
        'Tráileres para videojuegos',
        'Grabaciones y guías para videojuegos',
        'Videos de meditación',
        'Promociones inmobiliarias',
        'Tráileres para libros',
        'Consejos para video',
      ]
    },

    // Escritura y traducción subcategories
    'redaccion-contenido': {
      name: 'Redacción de contenido',
      services: [
        'Artículos y blogs',
        'Estrategia de contenido',
        'Contenido para sitios web',
        'Redacción de guiones',
        'Escritura creativa',
        'Redacción de pódcast',
        'Redacción de discursos',
        'Investigación y resúmenes',
      ]
    },
    'edicion-critica': {
      name: 'Edición y crítica',
      services: [
        'Corrección y edición de textos',
        'Apoyo académico',
        'Edición de contenido de IA',
        'Consejos de escritura',
      ]
    },
    'libros-libros-electronicos': {
      name: 'Libros y libros electrónicos',
      services: [
        'Escritura de libros electrónicos',
        'Edición de libros',
        'Lector beta',
        'Traducción de libros y traducción literaria',
      ]
    },
    'redaccion-profesional': {
      name: 'Redacción profesional',
      services: [
        'Redacción de currículums',
        'Cartas de presentación',
        'Perfiles de LinkedIn',
        'Descripciones de puestos de trabajo',
      ]
    },
    'contenido-negocios-marketing': {
      name: 'Contenido para negocios y marketing',
      services: [
        'Tono de voz de la marca',
        'Nombres comerciales y eslóganes',
        'Estudio de casos',
        'Descripciones de productos',
        'Texto del anuncio',
        'Texto para ventas',
        'Texto para correos electrónicos',
        'Redacción creativa en redes sociales',
        'Comunicados de prensa',
        'UX Writing',
        'Desarrollo de contenido de eLearning',
        'Escritura técnica',
        'Escritura a mano',
      ]
    },
    'traduccion-transcripcion': {
      name: 'Traducción y transcripción',
      services: [
        'Traducción',
        'Localización',
        'Transcripción',
        'Interpretación',
      ]
    },
    'contenido-especifico-industria': {
      name: 'Contenido específico de la industria',
      services: [
        'Negocios, finanzas y derecho',
        'Salud y medicina',
        'Internet y tecnología',
        'Noticias y política',
        'Marketing',
        'Bienes Raíces',
      ]
    },
    'varios-escritura': {
      name: 'Varios',
      services: [
        'Desarrollo de contenido de eLearning',
        'Escritura técnica',
        'Escritura a mano',
      ]
    },

    // Música y audio subcategories
    'produccion-escritura-musical': {
      name: 'Producción y escritura musical',
      services: [
        'Productores de música',
        'Compositores',
        'Cantantes y vocalistas',
        'Músicos de sesión',
        'Compositores de canciones',
        'Jingles e introducciones',
        'Canciones personalizadas',
      ]
    },
    'ingenieria-audio-postproduccion': {
      name: 'Ingeniería de audio y posproducción',
      services: [
        'Mezcla y masterización',
        'Edición de audio',
        'Afinación vocal',
      ]
    },
    'voz-off-narracion': {
      name: 'Voz en off y narración',
      services: [
        'Voz en off y narración',
        'Entrega en 24 horas',
        'Voice over de mujer',
        'Voice over de hombre',
        'Voice over en inglés',
        'Voice over en portugués',
        'Voice over en otros idiomas',
      ]
    },
    'streaming-audio': {
      name: 'Streaming y audio',
      services: [
        'Producción de pódcast',
        'Producción de audiolibros',
        'Producción de anuncios de audio',
        'Síntesis de voz e IA',
      ]
    },
    'dj': {
      name: 'DJ',
      services: [
        'Drops y etiquetas de DJ',
        'Mezcla de DJ',
        'Remix',
      ]
    },
    'diseno-sonido': {
      name: 'Diseño de sonido',
      services: [
        'Diseño de sonido',
        'Música de meditación',
        'Audio Logo y Sonic Branding',
        'Parches y muestras personalizadas',
        'Desarrollo de complementos de audio',
      ]
    },
    'lecciones-transcripciones': {
      name: 'Lecciones y transcripciones',
      services: [
        'Clases de música en línea',
        'Transcripción de música',
        'Consejos de música y audio',
      ]
    },

    // Resto de categorías básicas (para completar la estructura)
    'constitucion-empresas-consultoria': {
      name: 'Constitución de empresas y consultoría',
      services: [
        'Constitución y registro de empresas',
        'Estudio de mercado',
        'Planes de negocios',
        'Consultoría de negocios',
        'Consultoría en RR. HH.',
        'Consultoría de IA',
      ]
    },
    'operaciones-gestion': {
      name: 'Operaciones y gestión',
      services: [
        'Asistente virtual',
        'Gestión de proyectos',
        'Gestión de software',
        'Gestión de comercio electrónico',
        'Gestión de la cadena de suministro',
        'Asesoramiento sobre aduanas y aranceles',
        'Gestión de eventos',
        'Gestión de producto',
      ]
    },
    'servicios-juridicos': {
      name: 'Servicios jurídicos',
      services: [
        'Servicios jurídicos',
        'Gestión de propiedad intelectual',
        'Contratos y documentos legales',
        'Investigación legal',
        'Asesoría legal general',
      ]
    },
    'ventas-atencion-cliente': {
      name: 'Ventas y atención al cliente',
      services: [
        'Ventas',
        'Gestión de experiencia del cliente (CXM)',
        'Generación de leads',
        'Ingeniería GTM',
        'Centro de atención telefónica y llamadas',
        'Atención al cliente',
      ]
    },
    'datos-business-intelligence': {
      name: 'Datos y Business Intelligence',
      services: [
        'Visualización de datos',
        'Análisis de datos',
        'Extracción de datos',
      ]
    },
    'varios-negocios': {
      name: 'Varios',
      services: [
        'Presentaciones',
        'Investigaciones online',
        'Consultoría sobre sostenibilidad',
        'Diseño del concepto del juego',
      ]
    },
  }

  return subcategoriesMap
}

// Get category by slug
export function getCategoryBySlug(slug: string): Category | undefined {
  return MAIN_CATEGORIES.find(cat => cat.slug === slug)
}

// Get subcategory by slugs
export function getSubcategoryBySlugs(categorySlug: string, subcategorySlug: string): Subcategory | undefined {
  const category = getCategoryBySlug(categorySlug)
  if (!category) return undefined
  return category.subcategories.find(sub => sub.slug === subcategorySlug)
}