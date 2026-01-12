# Database Persistence Fix - Railway MySQL Issue

## 🚨 Problem
Your Railway MySQL database loses data after every deployment because Railway databases are **ephemeral** - they get destroyed and recreated on each deployment.

## ✅ Solution Applied

### 1. Configuration Changes
Modified `application.properties` to prevent automatic table recreation:

```properties
# Before (PROBLEMATIC)
spring.jpa.hibernate.ddl-auto=update
spring.sql.init.mode=always

# After (FIXED)
spring.jpa.hibernate.ddl-auto=none
spring.sql.init.mode=never
```

### 2. Manual Migration Script
Created `migration.sql` - run this **ONCE** manually to set up your database:

```bash
# Connect to your Railway MySQL database and run:
mysql -h [your-railway-host] -u [username] -p < backend/src/main/resources/migration.sql
```

## 🔄 Alternative Solutions (Recommended for Production)

### Option 1: Switch to Persistent Database (BEST)
Use a persistent database service instead of Railway:

- **PlanetScale** (MySQL-compatible, free tier available)
- **AWS RDS** (Production-grade)
- **Google Cloud SQL**
- **Azure Database for MySQL**

### Option 2: Railway Persistent Database
If you want to stay with Railway, upgrade to their persistent database service that maintains data between deployments.

### Option 3: Database Backups
If you must use ephemeral database:
- Create automated backups before deployments
- Restore data after each deployment

## 📋 Next Steps

1. **Deploy the configuration changes** (already done)
2. **Run the migration script ONCE** on your Railway database
3. **Test your application** - data should now persist between deployments
4. **Consider switching to a persistent database** for long-term reliability

## ⚠️ Important Notes

- Never set `spring.jpa.hibernate.ddl-auto=update` in production
- Never set `spring.sql.init.mode=always` in production
- The migration script contains default users:
  - Username: `admin`, Password: `admin123`
  - Username: `accountant`, Password: `accountant123`

## 🧪 Testing

After applying these changes:
1. Add some test data to your application
2. Redeploy your application
3. Verify that the data still exists

If data still disappears, you need to switch to a persistent database service.
