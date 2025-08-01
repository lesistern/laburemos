<?php
/**
 * LaburAR - Application Configuration
 * Main configuration file for the application
 */

return [
    // Application settings
    'name' => 'LaburAR',
    'version' => '1.0.0',
    'env' => $_ENV['APP_ENV'] ?? 'production',
    'debug' => $_ENV['APP_DEBUG'] ?? false,
    'url' => $_ENV['APP_URL'] ?? 'https://laburar.com',
    'timezone' => 'America/Argentina/Buenos_Aires',
    
    // Database configuration
    'database' => [
        'default' => 'mysql',
        'connections' => [
            'mysql' => [
                'driver' => 'mysql',
                'host' => $_ENV['DB_HOST'] ?? 'localhost',
                'port' => $_ENV['DB_PORT'] ?? '3306',
                'database' => $_ENV['DB_NAME'] ?? 'laburar_platform',
                'username' => $_ENV['DB_USER'] ?? 'root',
                'password' => $_ENV['DB_PASS'] ?? '',
                'charset' => 'utf8mb4',
                'collation' => 'utf8mb4_unicode_ci',
                'options' => [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                    PDO::ATTR_STRINGIFY_FETCHES => false,
                    PDO::MYSQL_ATTR_FOUND_ROWS => true,
                    PDO::ATTR_PERSISTENT => true,
                    PDO::ATTR_TIMEOUT => 5,
                ]
            ]
        ]
    ],
    
    // Security settings
    'security' => [
        'jwt_secret' => $_ENV['JWT_SECRET'] ?? 'your-super-secret-jwt-key-change-in-production',
        'jwt_ttl' => 3600, // 1 hour
        'bcrypt_rounds' => 12,
        'rate_limit' => [
            'login' => 5, // attempts per 15 minutes
            'api' => 60   // requests per minute
        ]
    ],
    
    // Cache configuration
    'cache' => [
        'default' => 'redis',
        'stores' => [
            'redis' => [
                'driver' => 'redis',
                'host' => $_ENV['REDIS_HOST'] ?? '127.0.0.1',
                'port' => $_ENV['REDIS_PORT'] ?? 6379,
                'password' => $_ENV['REDIS_PASSWORD'] ?? null,
                'database' => 0,
            ],
            'file' => [
                'driver' => 'file',
                'path' => __DIR__ . '/../storage/cache',
            ]
        ]
    ],
    
    // Session configuration
    'session' => [
        'driver' => 'redis',
        'lifetime' => 120, // minutes
        'expire_on_close' => false,
        'encrypt' => false,
        'files' => __DIR__ . '/../storage/sessions',
        'connection' => null,
        'table' => 'sessions',
        'store' => null,
        'lottery' => [2, 100],
        'cookie' => 'laburar_session',
        'path' => '/',
        'domain' => $_ENV['SESSION_DOMAIN'] ?? null,
        'secure' => $_ENV['SESSION_SECURE_COOKIE'] ?? false,
        'http_only' => true,
        'same_site' => 'lax',
    ],
    
    // Mail configuration
    'mail' => [
        'default' => 'smtp',
        'mailers' => [
            'smtp' => [
                'transport' => 'smtp',
                'host' => $_ENV['MAIL_HOST'] ?? 'smtp.gmail.com',
                'port' => $_ENV['MAIL_PORT'] ?? 587,
                'encryption' => $_ENV['MAIL_ENCRYPTION'] ?? 'tls',
                'username' => $_ENV['MAIL_USERNAME'],
                'password' => $_ENV['MAIL_PASSWORD'],
                'timeout' => null,
            ]
        ],
        'from' => [
            'address' => $_ENV['MAIL_FROM_ADDRESS'] ?? 'noreply@laburar.com',
            'name' => $_ENV['MAIL_FROM_NAME'] ?? 'LaburAR'
        ]
    ],
    
    // Argentine specific settings
    'argentine' => [
        'currency' => 'ARS',
        'tax_systems' => ['monotributo', 'responsable_inscripto', 'exento'],
        'provinces' => [
            'CABA' => 'Ciudad Autónoma de Buenos Aires',
            'BA' => 'Buenos Aires',
            'CAT' => 'Catamarca',
            'CHA' => 'Chaco',
            'CHU' => 'Chubut',
            'COR' => 'Córdoba',
            'COR' => 'Corrientes',
            'ER' => 'Entre Ríos',
            'FOR' => 'Formosa',
            'JUJ' => 'Jujuy',
            'LP' => 'La Pampa',
            'LR' => 'La Rioja',
            'MEN' => 'Mendoza',
            'MIS' => 'Misiones',
            'NEU' => 'Neuquén',
            'RN' => 'Río Negro',
            'SAL' => 'Salta',
            'SJ' => 'San Juan',
            'SL' => 'San Luis',
            'SC' => 'Santa Cruz',
            'SF' => 'Santa Fe',
            'SE' => 'Santiago del Estero',
            'TF' => 'Tierra del Fuego',
            'TUC' => 'Tucumán'
        ]
    ],
    
    // File upload settings
    'upload' => [
        'max_size' => 10485760, // 10MB
        'allowed_types' => ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'],
        'path' => __DIR__ . '/../storage/uploads',
        'url' => '/uploads'
    ],
    
    // Logging configuration
    'logging' => [
        'default' => 'stack',
        'channels' => [
            'stack' => [
                'driver' => 'stack',
                'channels' => ['single', 'daily'],
            ],
            'single' => [
                'driver' => 'single',
                'path' => __DIR__ . '/../storage/logs/laburar.log',
                'level' => 'debug',
            ],
            'daily' => [
                'driver' => 'daily',
                'path' => __DIR__ . '/../storage/logs/laburar.log',
                'level' => 'debug',
                'days' => 14,
            ]
        ]
    ]
];