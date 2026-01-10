# Financial Ledger

A secure Financial Ledger & Reconciliation System built with Spring Boot (backend) and React (frontend).

## Project Structure

```
financial-ledger/
├── backend/                 # Spring Boot application
│   ├── src/
│   ├── Dockerfile          # Backend Docker configuration
│   ├── pom.xml
│   ├── .env               # Backend environment variables
│   └── .dockerignore      # Docker build optimization
├── frontend/               # React application
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── .env              # Frontend environment variables
│   └── .dockerignore     # Docker build optimization
├── scripts/               # Utility scripts
│   ├── deploy.sh          # Linux/Mac deployment script
│   ├── deploy.bat         # Windows deployment script
│   ├── debug_database.js  # Database debugging script
│   └── TestReconciliation.java # Test reconciliation script
├── docs/                  # Documentation
│   ├── DEPLOYMENT_README.md
│   └── DATABASE_README.md
├── resources/             # Project resources
│   └── data/              # Sample data files
│       ├── sample_transactions.csv
│       └── user_transactions.csv
├── backend/railway.json   # Railway deployment config
├── frontend/vercel.json   # Vercel deployment config
└── README.md              # This file
```

## Quick Start

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/financial-ledger.git
   cd financial-ledger
   ```

2. **Backend with Docker:**
   ```bash
   cd backend
   docker build -t financial-ledger-backend .
   docker run -p 8080:8080 --env-file .env financial-ledger-backend
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080

### Manual Setup

**Backend Build:**
```bash
# Option 1: Use the build script (Windows)
scripts/build.bat

# Option 2: Manual Maven build
cd backend
mvn clean package -DskipTests

# Option 3: Run directly (if JAR exists)
java -jar backend/target/ledger-1.0.0.jar
```

**Backend Development:**
```bash
cd backend
./mvnw spring-boot:run
```

**Frontend:**
```bash
cd frontend
npm install
npm start
```

### Build Scripts

The project includes automated scripts for easy building and deployment:

- **`scripts/build.bat`** - Build backend locally with Maven
- **`scripts/deploy.bat`** - Prepare for Railway/Vercel deployment
- **`scripts/deploy.sh`** - Linux/Mac deployment script

## Docker Setup

### Backend Docker Configuration

The backend uses a multi-stage Docker build for optimized production deployment:

```bash
# Build the backend image
cd backend
docker build -t financial-ledger-backend .

# Run with environment variables
docker run -p 8080:8080 --env-file .env financial-ledger-backend

# Or run with individual environment variables
docker run -p 8080:8080 \
  -e DATABASE_URL="jdbc:mysql://your-db-host:3306/fin_management" \
  -e DB_USERNAME="your-username" \
  -e DB_PASSWORD="your-password" \
  financial-ledger-backend
```

### Docker Build Stages

1. **Build Stage**: Uses Maven to compile and package the Spring Boot application
2. **Runtime Stage**: Uses OpenJDK 17 JRE to run the application with security best practices

### Environment Variables

The backend Docker container supports the following environment variables:
- `DATABASE_URL` - MySQL database connection string
- `DB_USERNAME` - Database username
- `DB_PASSWORD` - Database password
- `JWT_SECRET` - JWT signing secret
- `CORS_ALLOWED_ORIGINS` - Allowed CORS origins
- `SERVER_PORT` - Server port (default: 8080)

## Deployment

### Automated Deployment

Use the deployment scripts:

**Windows:**
```cmd
scripts\deploy.bat
```

**Linux/Mac:**
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### Manual Deployment

1. **Backend to Railway:**
   - Go to https://railway.app
   - Connect your GitHub repository
   - Set source directory to `backend/`
   - Add MySQL database
   - Configure environment variables

2. **Frontend to Vercel:**
   - Go to https://vercel.com
   - Connect your GitHub repository
   - Set root directory to `frontend/`
   - Configure environment variables

See `docs/DEPLOYMENT_README.md` for detailed instructions.

## Environment Variables

### Backend (Railway)
- `DATABASE_URL` - MySQL connection string (auto-provided)
- `JWT_SECRET` - JWT signing secret
- `FRONTEND_URL` - CORS allowed origin (Vercel URL)

### Frontend (Vercel)
- `REACT_APP_API_URL` - Backend API URL (Railway URL)

## Features

- User authentication and authorization
- Transaction management
- Bank reconciliation
- PDF report generation
- Audit logging
- Admin dashboard

## Technologies

- **Backend:** Spring Boot, Spring Security, JPA, MySQL, JWT
- **Frontend:** React, Axios, React Router
- **Deployment:** Railway, Vercel, Docker

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

This project is licensed under the MIT License.
