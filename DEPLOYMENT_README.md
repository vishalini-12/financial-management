# Financial Ledger Deployment Guide

## Overview
This project consists of a Spring Boot backend and React frontend, designed for financial transaction management and reconciliation.

**Deployment Architecture:**
- **Frontend:** Vercel
- **Backend:** Render
- **Database:** Railway (MySQL)

## Prerequisites
- Java 17
- Maven 3.6+
- Node.js 16+
- MySQL database (Railway)
- Git
- Vercel account
- Render account
- Railway account

## Database Setup (Railway)

### 1. Create MySQL Database on Railway
1. Go to [Railway.app](https://railway.app) and create an account
2. Create a new project
3. Add a MySQL database service
4. Note down the connection details from Railway dashboard:
   - Host
   - Port
   - Database name
   - Username
   - Password

### 2. Database Configuration
The application will automatically create tables and insert default users on startup.

Default credentials:
- Admin: `admin` / `admin123`
- Accountant: `accountant` / `accountant123`

## Backend Deployment (Render)

### 1. Prepare Backend for Render
The `backend/render.yaml` file is configured for Docker deployment on Render.

### 2. Deploy to Render
1. Go to [Render.com](https://render.com) and create an account
2. Connect your GitHub repository
3. Create a new Web Service
4. Select your repository and configure:
   - **Runtime:** Docker
   - **Dockerfile Path:** `./Dockerfile` (at root level)
5. The service will automatically build and deploy using your Dockerfile

### 3. Environment Variables
Set the following environment variables in Render dashboard:

```
DATABASE_URL=jdbc:mysql://[RAILWAY_HOST]:[RAILWAY_PORT]/[DATABASE_NAME]
DB_USERNAME=[RAILWAY_USERNAME]
DB_PASSWORD=[RAILWAY_PASSWORD]
PORT=10000
JWT_SECRET=RZwIqkcRGCAJQQKjwnlGpWQJw5+SlgaKG+5GHbcrHHI=
CORS_ALLOWED_ORIGINS=https://[your-vercel-app].vercel.app
JPA_DDL_AUTO=update
JPA_PLATFORM=org.hibernate.dialect.MySQLDialect
JPA_SHOW_SQL=false
JWT_EXPIRATION=86400000
MULTIPART_ENABLED=true
MULTIPART_MAX_FILE_SIZE=10MB
MULTIPART_MAX_REQUEST_SIZE=10MB
MULTIPART_THRESHOLD=2KB
SQL_INIT_MODE=always
```

## Frontend Deployment (Vercel)

### 1. Deploy to Vercel
1. Go to [Vercel.com](https://vercel.com) and create an account
2. Connect your GitHub repository
3. Import the `frontend` folder as a project
4. Vercel will automatically detect it as a React app

### 2. Environment Variables
Set in Vercel dashboard:
```
REACT_APP_API_BASE_URL=https://[your-render-app].onrender.com
```

### 3. Build Configuration
The `frontend/vercel.json` is configured for proper routing.

## Local Development

### Backend
```bash
cd backend
mvn spring-boot:run
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## API Endpoints

### Authentication
- POST `/api/auth/register` - User registration
- POST `/api/auth/login` - User login

### Transactions
- GET `/api/transactions` - Get transactions
- POST `/api/transactions` - Create transaction
- PUT `/api/transactions/{id}` - Update transaction
- DELETE `/api/transactions/{id}` - Delete transaction

### Users (Admin only)
- GET `/api/admin/users` - Get all users
- POST `/api/admin/users` - Create user
- PUT `/api/admin/users/{id}` - Update user
- DELETE `/api/admin/users/{id}` - Delete user

### Audit Logs
- GET `/api/audit/logs` - Get audit logs

### Reconciliation
- GET `/api/reconciliation` - Get reconciliations
- POST `/api/reconciliation` - Create reconciliation
- GET `/api/reconciliation/{id}` - Get reconciliation details
- GET `/api/reconciliation/{id}/export` - Export reconciliation

### Reports
- GET `/api/reports/transactions` - Get transaction reports
- GET `/api/reports/export` - Export reports

## Security Features
- JWT-based authentication
- Role-based authorization (ADMIN, ACCOUNTANT)
- CORS protection
- Input validation
- Audit logging

## Troubleshooting

### CORS Issues
- Ensure CORS_ALLOWED_ORIGINS includes your frontend URL
- Check Railway service-level CORS settings
- Verify environment variables are applied after redeployment

### Database Connection
- Verify DATABASE_URL is correct
- Ensure MySQL service is running
- Check database credentials

### Authentication Issues
- Verify JWT_SECRET is set correctly
- Check if default users exist in database
- Ensure CORS allows frontend origin

## Support
For issues, check application logs in Railway dashboard and browser console for frontend errors.
