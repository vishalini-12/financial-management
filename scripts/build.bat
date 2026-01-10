@echo off
REM Local Build Script for Financial Ledger
REM This script builds the backend locally using Maven

echo 🔨 Financial Ledger Local Build Script
echo ======================================

REM Check if Maven is installed
where mvn >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Maven is not installed or not in PATH.
    echo [INFO] Please install Maven from: https://maven.apache.org/download.cgi
    echo [INFO] Or use Docker for building: docker build -t financial-ledger-backend backend/
    pause
    exit /b 1
)

echo [INFO] Maven found. Starting build...

REM Navigate to backend directory and build
cd backend
if %errorlevel% neq 0 (
    echo [ERROR] Cannot find backend directory. Run this script from project root.
    pause
    exit /b 1
)

echo [INFO] Building backend with Maven...
mvn clean package -DskipTests

if %errorlevel% neq 0 (
    echo [ERROR] Build failed! Check the errors above.
    cd ..
    pause
    exit /b 1
)

echo.
echo [SUCCESS] Build completed successfully!
echo [INFO] JAR file created at: backend/target/ledger-1.0.0.jar
echo [INFO] To run locally: java -jar backend/target/ledger-1.0.0.jar

cd ..
pause