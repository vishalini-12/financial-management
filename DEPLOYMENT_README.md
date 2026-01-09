# Financial Ledger Deployment Guide

This guide will help you deploy the Financial Ledger application to Railway (backend + database) and Vercel (frontend).

## Prerequisites

1. GitHub account
2. Railway account (https://railway.app)
3. Vercel account (https://vercel.com)
4. Git repository with this project

## Step 1: Prepare Your Repository

Make sure your code is pushed to GitHub:

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

## Step 2: Deploy Backend to Railway

### 2.1 Create Railway Project

1. Go to https://railway.app and sign in
2. Click "New Project"
3. Choose "Deploy from GitHub repo"
4. Connect your GitHub account and select this repository
5. Choose the `backend/` directory as the source

### 2.2 Add MySQL Database

1. In your Railway project, click "Add Plugin"
2. Choose "MySQL" (not PostgreSQL)
3. The database will be automatically created with environment variables:
   - `DATABASE_URL` - Full connection string
   - `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`

### 2.3 Configure Environment Variables

In your Railway project settings, add these environment variables:

```
JWT_SECRET=your_secure_jwt_secret_here
FRONTEND_URL=https://your-vercel-app.vercel.app
```

### 2.4 Deploy Backend

1. Railway should automatically detect the `railway.json` and `pom.xml`
2. The build should start automatically
3. Once deployed, note the backend URL (e.g., `https://your-project.up.railway.app`)

## Step 3: Deploy Frontend to Vercel

### 3.1 Connect Repository

1. Go to https://vercel.com and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Create React App
   - **Root Directory**: `frontend/`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

### 3.2 Configure Environment Variables

In Vercel project settings, add:

```
REACT_APP_API_URL=https://your-railway-backend.up.railway.app
```

### 3.3 Deploy Frontend

1. Click "Deploy"
2. Vercel will build and deploy your React app
3. Once deployed, note the frontend URL (e.g., `https://your-app.vercel.app`)

## Step 4: Update CORS Configuration

### 4.1 Update Railway Environment Variables

In your Railway project, update the `FRONTEND_URL` environment variable:

```
FRONTEND_URL=https://your-vercel-app.vercel.app
```

### 4.2 Redeploy Backend

Trigger a new deployment in Railway to apply the CORS changes.

## Alternative: Docker Deployment

For local development or containerized deployment, you can use Docker:

### Prerequisites for Docker Deployment
- Docker installed
- Docker Compose installed

### Quick Start with Docker Compose

1. **Clone and navigate to the project:**
   ```bash
   git clone https://github.com/Vishaliniadba/financial-ledger-project.git
   cd financial-ledger-project
   ```

2. **Start all services:**
   ```bash
   docker-compose up -d
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - Database: localhost:3306

4. **View logs:**
   ```bash
   docker-compose logs -f
   ```

5. **Stop services:**
   ```bash
   docker-compose down
   ```

### Manual Docker Build

**Backend:**
```bash
cd backend
docker build -t financial-ledger-backend .
docker run -p 8080:8080 -e SPRING_DATASOURCE_URL=jdbc:mysql://your-db-host financial-ledger-backend
```

**Frontend:**
```bash
cd frontend
docker build -t financial-ledger-frontend .
docker run -p 3000:80 -e REACT_APP_API_URL=http://your-backend-url financial-ledger-frontend
```

## Step 5: Test Your Deployment

1. Visit your Vercel frontend URL (or http://localhost:3000 for Docker)
2. Try logging in with default credentials (if any exist)
3. Test all features to ensure they work with the deployed backend

## Environment Files

Copy the example environment files and configure them:

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

## Troubleshooting

### Backend Issues
- Check Railway logs for build/deployment errors
- Verify environment variables are set correctly
- Ensure database connection works

### Frontend Issues
- Check Vercel build logs
- Verify `REACT_APP_API_URL` is set correctly
- Clear browser cache if API calls fail

### CORS Issues
- Ensure `FRONTEND_URL` in Railway matches your Vercel domain exactly
- Check that Railway backend redeployed after CORS changes

## Default Credentials

If your application has default users, document them here for testing.

## Environment Variables Summary

### Railway (Backend):
- `DATABASE_URL` - Auto-provided by Railway MySQL
- `JWT_SECRET` - Your custom JWT secret
- `FRONTEND_URL` - Your Vercel app URL
- `PORT` - Auto-provided by Railway

### Vercel (Frontend):
- `REACT_APP_API_URL` - Your Railway backend URL

## Security Notes

- Change default JWT secret to a secure random string
- Consider enabling Railway's environment protection
- Review CORS settings for production security