# Financial Ledger Deployment Guide

## Overview
This project consists of a Spring Boot backend and React frontend, designed for financial transaction management and reconciliation.

## Prerequisites
- Java 17
- Maven 3.6+
- Node.js 16+
- MySQL database
- Git

## Backend Deployment (Railway)

### 1. Environment Variables
Set the following environment variables in Railway:

```
DATABASE_URL=jdbc:mysql://mysql.railway.internal:3306/railway
DB_USERNAME=root
DB_PASSWORD=[Your MySQL password]
JWT_SECRET=RZwIqkcRGCAJQQKjwnlGpWQJw5+SlgaKG+5GHbcrHHI=
CORS_ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
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

### 2. CORS Configuration
Configure CORS in Railway service settings:
- Go to Railway dashboard > Service > Settings
- Look for "CORS" or "Allowed Origins"
- Add: `https://your-vercel-app.vercel.app`

If service-level CORS is not available, the environment variable `CORS_ALLOWED_ORIGINS` should work after redeployment.

### 3. Database Setup
The application will automatically create tables and insert default users on startup.

Default credentials:
- Admin: `admin` / `admin123`
- Accountant: `accountant` / `accountant123`

## Frontend Deployment (Vercel)

### 1. Environment Variables
Set in Vercel dashboard:
```
REACT_APP_API_URL=https://your-railway-app.railway.app
```

### 2. Build Configuration
The `vercel.json` is configured for React deployment.

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
