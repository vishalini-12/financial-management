financial-ledger/
│
├── README.md
├── .gitignore
│
├── backend/                         # 🔥 Spring Boot Backend
│   │
│   ├── pom.xml                      # Maven configuration
│   ├── Dockerfile                   # Backend Docker build
│   ├── Procfile                     # Railway start command
│   ├── .dockerignore
│   ├── .env                         # Local env vars (NOT committed)
│   │
│   ├── src/
│   │   ├── main/
│   │   │   │
│   │   │   ├── java/
│   │   │   │   └── com/
│   │   │   │       └── financial/
│   │   │   │           └── ledger/
│   │   │   │               │
│   │   │   │               ├── LedgerApplication.java   # @SpringBootApplication
│   │   │   │               │
│   │   │   │               ├── config/                  # 🔐 Configurations
│   │   │   │               │   ├── SecurityConfig.java
│   │   │   │               │   ├── CorsConfig.java
│   │   │   │               │   ├── JwtUtil.java
│   │   │   │               │   └── DatabaseHealthCheck.java
│   │   │   │               │
│   │   │   │               ├── controller/              # 🌐 REST APIs
│   │   │   │               │   ├── AuthController.java
│   │   │   │               │   ├── AdminController.java
│   │   │   │               │   ├── TransactionController.java
│   │   │   │               │   ├── ReconciliationController.java
│   │   │   │               │   └── AuditLogController.java
│   │   │   │               │
│   │   │   │               ├── service/                 # ⚙ Business Logic
│   │   │   │               │   ├── UserDetailsServiceImpl.java
│   │   │   │               │   ├── AuditService.java
│   │   │   │               │   ├── PdfTransactionService.java
│   │   │   │               │   ├── ReconciliationService.java
│   │   │   │               │   └── ReconciliationExportService.java
│   │   │   │               │
│   │   │   │               ├── repository/              # 🗄 JPA Repos
│   │   │   │               │   ├── UserRepository.java
│   │   │   │               │   ├── TransactionRepository.java
│   │   │   │               │   ├── AuditLogRepository.java
│   │   │   │               │   └── ReconciliationRepository.java
│   │   │   │               │
│   │   │   │               └── model/                   # 📦 Entities / DTOs
│   │   │   │                   ├── User.java
│   │   │   │                   ├── Transaction.java
│   │   │   │                   ├── AuditLog.java
│   │   │   │                   ├── Reconciliation.java
│   │   │   │                   └── TransactionDTO.java
│   │   │   │
│   │   │   └── resources/
│   │   │       ├── application.properties
│   │   │       ├── database_setup.sql
│   │   │       └── user_transactions.csv
│   │   │
│   │   └── test/
│   │       └── java/com/financial/ledger/
│   │           └── LedgerApplicationTests.java
│   │
│   └── target/                      # Maven build output
│
├── frontend/                        # 🎨 React Frontend
│   │
│   ├── package.json
│   ├── Dockerfile
│   ├── nginx.conf
│   │
│   ├── public/
│   │   ├── index.html
│   │   ├── favicon.ico
│   │   └── manifest.json
│   │
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       ├── App.js
│       ├── index.js
│       └── *.css
│
├── deploy/                          # 🚀 Deployment configs
│   │
│   ├── railway/
│   │   ├── railway.json
│   │   └── Procfile
│   │
│   └── vercel/
│       └── vercel.json
│
├── scripts/                         # Utility scripts
│   ├── deploy.sh
│   ├── deploy.bat
│   └── debug_database.js
│
└── docs/
    ├── DEPLOYMENT_README.md
    └── DATABASE_README.md