# 🗂️ LaburAR - Diagrama ER Simplificado (Para Visualización)

## 📊 Diagrama Principal - Core Tables

```mermaid
erDiagram
    %% USUARIOS CORE
    users {
        int id PK
        varchar email UK
        varchar password_hash
        enum user_type
        varchar first_name
        varchar last_name
        decimal wallet_balance
        timestamp created_at
    }
    
    freelancer_profiles {
        int id PK
        int user_id FK
        text bio
        varchar title
        decimal hourly_rate
        decimal rating_average
        int total_projects
    }
    
    %% HABILIDADES (FALTANTE)
    skills {
        int id PK
        varchar name UK
        varchar category
        boolean is_trending
    }
    
    freelancer_skills {
        int id PK
        int freelancer_id FK
        int skill_id FK
        enum proficiency_level
        int years_experience
    }
    
    %% SERVICIOS
    categories {
        int id PK
        varchar name
        varchar slug UK
        int parent_id FK
    }
    
    services {
        int id PK
        int freelancer_id FK
        int category_id FK
        varchar title
        decimal base_price
        boolean is_active
    }
    
    service_packages {
        int id PK
        int service_id FK
        enum package_type
        decimal price
        int delivery_time
    }
    
    %% PROYECTOS
    projects {
        int id PK
        int client_id FK
        int freelancer_id FK
        varchar title
        decimal budget_min
        decimal budget_max
        enum status
    }
    
    proposals {
        int id PK
        int project_id FK
        int freelancer_id FK
        decimal proposed_amount
        enum status
    }
    
    %% PAGOS
    wallets {
        int id PK
        int user_id FK
        decimal balance
        decimal pending_balance
    }
    
    transactions {
        int id PK
        int from_user_id FK
        int to_user_id FK
        decimal amount
        enum status
    }
    
    %% COMUNICACIÓN
    messages {
        int id PK
        int sender_id FK
        int receiver_id FK
        text message_content
        boolean is_read
    }
    
    %% REVIEWS
    reviews {
        int id PK
        int project_id FK
        int reviewer_id FK
        int reviewee_id FK
        int rating
        text comment
    }
    
    %% BADGES
    badges {
        int id PK
        varchar name
        enum rarity
        boolean is_active
    }
    
    user_badges {
        int id PK
        int user_id FK
        int badge_id FK
        timestamp earned_at
    }
    
    %% ARCHIVOS (FALTANTE)
    file_uploads {
        int id PK
        int user_id FK
        varchar entity_type
        int entity_id
        varchar file_name
        varchar storage_path
    }
    
    %% RELACIONES PRINCIPALES
    users ||--o| freelancer_profiles : has
    users ||--o{ freelancer_skills : has
    users ||--o{ services : offers
    users ||--o{ projects : creates
    users ||--o{ proposals : submits
    users ||--o| wallets : owns
    users ||--o{ transactions : participates
    users ||--o{ messages : sends
    users ||--o{ reviews : writes
    users ||--o{ user_badges : earns
    users ||--o{ file_uploads : uploads
    
    skills ||--o{ freelancer_skills : defines
    categories ||--o{ services : categorizes
    categories ||--o{ categories : parent_of
    services ||--o{ service_packages : has
    projects ||--o{ proposals : receives
    projects ||--o{ reviews : generates
    badges ||--o{ user_badges : awarded_as
```

## 📋 Tablas por Módulo (Vista Organizacional)

```mermaid
graph TB
    subgraph "👤 USUARIOS"
        A[users]
        B[freelancer_profiles]
        C[user_sessions]
    end
    
    subgraph "🎯 SKILLS (FALTANTE)"
        D[skills]
        E[freelancer_skills]
        F[portfolio_items]
    end
    
    subgraph "💼 SERVICIOS"
        G[categories]
        H[services]
        I[service_packages]
    end
    
    subgraph "📋 PROYECTOS"
        J[projects]
        K[proposals - FALTANTE]
        L[project_milestones]
    end
    
    subgraph "💰 PAGOS"
        M[wallets]
        N[transactions]
        O[payment_methods - FALTANTE]
    end
    
    subgraph "💬 COMUNICACIÓN"
        P[messages]
        Q[conversations]
        R[notifications]
    end
    
    subgraph "⭐ REVIEWS"
        S[reviews]
        T[user_reputation]
    end
    
    subgraph "🏆 BADGES"
        U[badges]
        V[user_badges]
        W[badge_categories]
    end
    
    subgraph "📁 ARCHIVOS (FALTANTE)"
        X[file_uploads]
    end
    
    subgraph "🔧 SISTEMA"
        Y[activity_logs]
        Z[support_tickets]
    end
    
    A --> B
    A --> E
    A --> H
    A --> J
    A --> K
    A --> M
    A --> P
    A --> S
    A --> V
    A --> X
    
    D --> E
    G --> H
    G --> G
    H --> I
    J --> K
    J --> S
    U --> V
```

## 📊 Estado de Implementación

```mermaid
pie title Tablas por Estado
    "Implementadas (20)" : 44
    "Faltantes Críticas (10)" : 22
    "Faltantes Opcionales (15)" : 34
```

## 🚨 Prioridades de Implementación

```mermaid
graph LR
    subgraph "🔴 CRÍTICO - Semana 1"
        A[skills]
        B[freelancer_skills]
        C[portfolio_items]
        D[proposals]
        E[file_uploads]
    end
    
    subgraph "🟡 IMPORTANTE - Semana 2"
        F[payment_methods]
        G[notification_preferences]
        H[favorites]
        I[disputes]
    end
    
    subgraph "🟢 OPCIONAL - Mes 2"
        J[teams]
        K[api_keys]
        L[conversion_tracking]
    end
    
    A --> F
    B --> F
    C --> F
    D --> F
    E --> F
    
    F --> J
    G --> J
    H --> J
    I --> J
```