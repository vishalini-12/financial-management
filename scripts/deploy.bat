@echo off
REM Financial Ledger Deployment Script for Windows
REM This script helps deploy the application to Railway and Vercel

echo 🚀 Financial Ledger Deployment Script
echo ====================================

REM Check if required tools are installed
echo [INFO] Checking dependencies...

where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed. Please install git first.
    pause
    exit /b 1
)

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed. Please install npm first.
    pause
    exit /b 1
)

REM Check for Maven (optional for Railway deployment)
where mvn >nul 2>nul
if %errorlevel% neq 0 (
    echo [WARNING] Maven not found. Local builds will use Docker/Railway.
    echo [INFO] For local Maven builds, run: cd backend ^&^& mvn clean package -DskipTests
) else (
    echo [INFO] Maven found - local builds available.
)

echo [INFO] All dependencies are installed.

REM Check if we're in the project root
if not exist "backend" (
    echo [ERROR] This script must be run from the project root directory.
    pause
    exit /b 1
)

if not exist "frontend" (
    echo [ERROR] This script must be run from the project root directory.
    pause
    exit /b 1
)

echo.
set /p deploy_backend="Do you want to deploy backend to Railway? (y/n): "
if /i "%deploy_backend%"=="y" (
    echo [INFO] Deploying backend to Railway...

    if not exist "deploy\railway\railway.json" (
        echo [ERROR] Railway configuration not found. Please ensure deploy\railway\railway.json exists.
        goto :end
    )

    REM Copy railway.json to backend directory for deployment
    copy deploy\railway\railway.json backend\ >nul

    echo [INFO] Backend prepared for Railway deployment.
    echo [WARNING] Please manually deploy via Railway dashboard:
    echo   1. Go to https://railway.app
    echo   2. Connect your GitHub repository
    echo   3. Set source directory to 'backend/'
    echo   4. Add MySQL database plugin
    echo   5. Configure environment variables:
    echo      - JWT_SECRET
    echo      - FRONTEND_URL

    REM Clean up
    del backend\railway.json
)

echo.
set /p deploy_frontend="Do you want to deploy frontend to Vercel? (y/n): "
if /i "%deploy_frontend%"=="y" (
    echo [INFO] Deploying frontend to Vercel...

    if not exist "deploy\vercel\vercel.json" (
        echo [ERROR] Vercel configuration not found. Please ensure deploy\vercel\vercel.json exists.
        goto :end
    )

    REM Copy vercel.json to frontend directory for deployment
    copy deploy\vercel\vercel.json frontend\ >nul

    echo [INFO] Frontend prepared for Vercel deployment.
    echo [WARNING] Please manually deploy via Vercel dashboard:
    echo   1. Go to https://vercel.com
    echo   2. Connect your GitHub repository
    echo   3. Set root directory to 'frontend/'
    echo   4. Configure environment variables:
    echo      - REACT_APP_API_URL

    REM Clean up
    del frontend\vercel.json
)

echo.
echo [INFO] Deployment preparation complete!
echo [WARNING] Remember to:
echo   1. Push your changes to GitHub
echo   2. Complete deployment in Railway/Vercel dashboards
echo   3. Update CORS settings after deployment

:end
pause