# Financial Ledger

A secure Financial Ledger & Reconciliation System built with Spring Boot (backend) and React (frontend).

## Project Structure

```
financial-ledger/
├── backend/                 # Spring Boot application
│   ├── src/
│   ├── Dockerfile
│   ├── pom.xml
│   └── Procfile
├── frontend/                # React application
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   ├── package.json
│   └── node_modules/       # Dependencies
├── deploy/                  # Deployment configurations
│   ├── railway/
│   │   ├── railway.json    # Railway deployment config
│   │   └── Procfile        # Railway start command
│   └── vercel/
│       └── vercel.json     # Vercel deployment config
├── scripts/                 # Utility scripts
│   ├── deploy.sh           # Linux/Mac deployment script
│   ├── deploy.bat          # Windows deployment script
│   ├── debug_database.js   # Database debugging script
│   └── TestReconciliation.java # Test reconciliation script
├── docs/                   # Documentation
│   ├── DEPLOYMENT_README.md
│   └── DATABASE_README.md
├── resources/              # Project resources
│   └── data/               # Sample data files
│       ├── sample_transactions.csv
│       └── user_transactions.csv
├── docker/                 # Docker-related files
│   └── docker-compose.yml  # Local development setup
└── README.md               # This file
```

## Quick Start

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/financial-ledger.git
   cd financial-ledger
   ```

2. **Start with Docker Compose:**
   ```bash
   docker-compose up -d
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

### Prerequisites
- Docker and Docker Compose installed
- At least 4GB RAM available
- Ports 3000, 8080, and 3306 available

### Quick Start with Docker
```bash
# Clone the repository
git clone https://github.com/vishalini-12/financial-management.git
cd financial-management

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Individual Services
```bash
# Build and run backend only
cd backend
docker build -t financial-ledger-backend .
docker run -p 8080:8080 --env-file .env financial-ledger-backend

# Build and run frontend only
cd frontend
docker build -t financial-ledger-frontend .
docker run -p 3000:80 --env REACT_APP_API_URL=http://localhost:8080 financial-ledger-frontend

# Run MySQL database only
docker run -d --name mysql-financial -e MYSQL_ROOT_PASSWORD=Vish@1213 -e MYSQL_DATABASE=fin_management -p 3306:3306 mysql:8.0
```

### Docker Commands
```bash
# View running containers
docker ps

# View all containers
docker ps -a

# Stop specific container
docker stop <container_name>

# Remove containers
docker-compose down --volumes

# Rebuild after code changes
docker-compose up --build
```

### Environment Configuration
The Docker setup includes:
- **MySQL 8.0** database with persistent storage
- **Spring Boot** backend with health checks
- **React** frontend served by nginx
- **Automatic service discovery** between containers

### Troubleshooting
```bash
# Clear all Docker data (use with caution)
docker system prune -a --volumes

# View container logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mysql

# Access MySQL container
docker exec -it financial-ledger-mysql mysql -u root -p
```

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
