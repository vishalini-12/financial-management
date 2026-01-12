# 🚀 Railway MySQL Persistent Storage Setup Guide

## 🔥 Why MySQL Data Disappears After Redeploy

### Root Causes:
1. **Railway's Default Behavior**: Railway databases are **ephemeral** by default
2. **Spring Boot Configuration**: `ddl-auto=update` recreates tables
3. **SQL Init Mode**: `sql.init.mode=always` re-runs data scripts
4. **No Volume Mount**: Data isn't persisted to persistent storage

## 🛠️ Solution: Configure Railway with Persistent Storage

### Step 1: Upgrade to Railway Persistent Database

#### Option A: Railway Dashboard (Recommended)
1. Go to your Railway project dashboard
2. Navigate to your MySQL database service
3. Click "Settings" → "Upgrade to Persistent Storage"
4. Choose storage size (minimum 1GB for production)
5. **Cost**: ~$5-10/month depending on size

#### Option B: Railway CLI
```bash
# Connect to Railway
railway login

# Link to your project
railway link

# Add persistent volume to database service
railway add --name mysql-persistent

# Configure volume size
railway variables set MYSQL_VOLUME_SIZE=5GB
```

### Step 2: Verify Persistent Storage
```bash
# Check if volume is attached
railway volume list

# Should show something like:
# mysql-data    5GB    attached
```

## ⚙️ Production-Safe application.properties

Your `application.properties` is now configured for production:

```properties
# ===========================================
# MYSQL DATABASE CONFIGURATION (RAILWAY)
# ===========================================
spring.datasource.url=${DATABASE_URL:jdbc:mysql://mysql.railway.internal:3306/railway?useSSL=true&requireSSL=true&serverTimezone=UTC&allowPublicKeyRetrieval=true}
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
spring.datasource.username=${DB_USERNAME:root}
spring.datasource.password=${DB_PASSWORD:oRJZwEopJZhRPGAURAPBtKcMjovtpuzz}

# CRITICAL SETTINGS FOR DATA PERSISTENCE
spring.jpa.hibernate.ddl-auto=none        # Never recreate tables
spring.sql.init.mode=never                # Never run init scripts
spring.jpa.show-sql=false                 # Disable SQL logging in production

# Connection pool for production
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=5
```

## 🔧 Render Environment Variables Setup

### Step 1: Access Render Dashboard
1. Go to your Render service dashboard
2. Click on your backend service
3. Go to "Environment" tab

### Step 2: Set Required Environment Variables

#### Critical Database Variables:
```
DATABASE_URL=jdbc:mysql://mysql.railway.internal:3306/railway?useSSL=true&requireSSL=true&serverTimezone=UTC&allowPublicKeyRetrieval=true
DB_USERNAME=your_railway_mysql_username
DB_PASSWORD=your_railway_mysql_password
```

#### Security Variables:
```
JWT_SECRET=your_secure_256_bit_jwt_secret_here
CORS_ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
```

#### Application Variables:
```
APP_NAME=financial-ledger-backend
PORT=8080
JPA_DDL_AUTO=none
SQL_INIT_MODE=never
```

### Step 3: Generate Secure JWT Secret
```bash
# Generate a secure 256-bit secret
openssl rand -base64 32

# Example output: aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890abcdef=
```

## 🚫 Ensure NO Fallback Databases

### ✅ What Your Config Prevents:
- ❌ **H2 Database**: `spring.h2.console.enabled=false`
- ❌ **Table Recreation**: `spring.jpa.hibernate.ddl-auto=none`
- ❌ **Data Wiping**: `spring.sql.init.mode=never`
- ❌ **In-memory DB**: No H2 or Derby dependencies

### ✅ What Your Config Ensures:
- ✅ **MySQL Only**: Forces Railway MySQL connection
- ✅ **SSL Required**: `useSSL=true&requireSSL=true`
- ✅ **Timezone Handling**: `serverTimezone=UTC`
- ✅ **Connection Pooling**: HikariCP with production settings

## 🧪 Verification Steps

### Step 1: Test Data Persistence
```bash
# 1. Add test data via your app
# 2. Check database has data
mysql -h mysql.railway.internal -u username -p database_name -e "SELECT COUNT(*) FROM transactions;"

# 3. Redeploy backend on Render
# 4. Check data still exists
mysql -h mysql.railway.internal -u username -p database_name -e "SELECT COUNT(*) FROM transactions;"

# 5. Redeploy frontend on Vercel (should not affect data)
mysql -h mysql.railway.internal -u username -p database_name -e "SELECT COUNT(*) FROM transactions;"
```

### Step 2: Verify Configuration
```bash
# Check Render environment variables are set
curl https://your-render-app.onrender.com/actuator/health

# Check database connection
curl https://your-render-app.onrender.com/api/transactions/test-connection
```

### Step 3: Monitor Logs
```bash
# Check Render logs for any database errors
# Should see: "HikariPool-1 - Starting..." (successful connection)
# Should NOT see: "Creating table..." or "Running script..."
```

## 🎯 Final Checklist

### ✅ Railway Configuration:
- [ ] Persistent storage volume attached (1GB+)
- [ ] Database credentials correct
- [ ] SSL enabled

### ✅ Render Configuration:
- [ ] All environment variables set
- [ ] JWT secret is 256-bit random
- [ ] CORS origins include Vercel domain

### ✅ Spring Boot Configuration:
- [ ] `ddl-auto=none` (not `update`)
- [ ] `sql.init.mode=never` (not `always`)
- [ ] H2 console disabled
- [ ] Connection pool configured

### ✅ Testing:
- [ ] Data persists after backend redeploy
- [ ] Data persists after frontend redeploy
- [ ] No ERR_CONNECTION_REFUSED errors
- [ ] All API endpoints working

## 🚨 Emergency Recovery

If data disappears despite these settings:

### Option 1: Database Backup
```bash
# Export data before redeploy
mysqldump -h mysql.railway.internal -u username -p database_name > backup.sql

# Import after redeploy
mysql -h mysql.railway.internal -u username -p database_name < backup.sql
```

### Option 2: Switch to AWS RDS
- More reliable persistence
- Automatic backups
- Higher availability

---

## 📞 Support
If data still disappears:
1. Check Railway volume is properly attached
2. Verify environment variables in Render
3. Check Spring Boot logs for database errors
4. Consider upgrading to AWS RDS for guaranteed persistence

**Your MySQL data will now persist permanently! 🎉**
