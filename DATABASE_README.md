# Database Setup for Financial Ledger Project

## Overview
This document provides instructions for setting up the MySQL database for the Financial Ledger project.

## Database Configuration

### Database Details
- **Database Name**: `final_project_finance`
- **Username**: `root`
- **Password**: `Vish@1213`
- **Host**: `localhost`
- **Port**: `3306`

### Database Tables

The database contains the following tables based on the project models:

#### 1. `users` Table
- **Purpose**: Stores user account information
- **Primary Key**: `id` (BIGINT, AUTO_INCREMENT)
- **Fields**:
  - `username` (VARCHAR(255), UNIQUE, NOT NULL)
  - `password` (VARCHAR(255), NOT NULL) - BCrypt hashed
  - `email` (VARCHAR(255), NOT NULL)
  - `role` (ENUM: 'ADMIN', 'ACCOUNTANT', NOT NULL)
  - `created_at` (TIMESTAMP)
  - `updated_at` (TIMESTAMP)

#### 2. `transactions` Table
- **Purpose**: Stores all financial transactions
- **Primary Key**: `id` (BIGINT, AUTO_INCREMENT)
- **Fields**:
  - `date` (TIMESTAMP, NOT NULL)
  - `description` (TEXT, NOT NULL)
  - `amount` (DECIMAL(15,2), NOT NULL)
  - `type` (ENUM: 'CREDIT', 'DEBIT', NOT NULL)
  - `status` (ENUM: 'PENDING', 'COMPLETED', NOT NULL, DEFAULT 'COMPLETED')
  - `category` (VARCHAR(255), NOT NULL, DEFAULT 'Miscellaneous')
  - `client_name` (VARCHAR(255), NOT NULL, DEFAULT 'Manual Entry')
  - `bank_name` (VARCHAR(255), NULL)
  - `client_username` (VARCHAR(255), NOT NULL, DEFAULT 'manual')
  - `user_id` (BIGINT, NOT NULL) - References the user who created the transaction
  - `created_at` (TIMESTAMP, NOT NULL)

#### 3. `reconciliation` Table
- **Purpose**: Stores bank reconciliation records
- **Primary Key**: `id` (BIGINT, AUTO_INCREMENT)
- **Fields**:
  - `client_name` (VARCHAR(255), NOT NULL)
  - `bank_name` (VARCHAR(255), NOT NULL)
  - `from_date` (DATE, NOT NULL)
  - `to_date` (DATE, NOT NULL)
  - `opening_balance` (DECIMAL(15,2), NOT NULL)
  - `bank_balance` (DECIMAL(15,2), NOT NULL)
  - `total_credit` (DECIMAL(15,2), NOT NULL)
  - `total_debit` (DECIMAL(15,2), NOT NULL)
  - `system_balance` (DECIMAL(15,2), NOT NULL)
  - `difference` (DECIMAL(15,2), NOT NULL)
  - `status` (VARCHAR(255), NOT NULL)
  - `created_at` (TIMESTAMP, NOT NULL)

#### 4. `audit_logs` Table
- **Purpose**: Stores audit logs for system activities
- **Primary Key**: `id` (BIGINT, AUTO_INCREMENT)
- **Fields**:
  - `action` (VARCHAR(255), NOT NULL)
  - `timestamp` (TIMESTAMP, NOT NULL)
  - `user_id` (BIGINT, NOT NULL)
  - `details` (TEXT, NULL)

## Setup Instructions

### Prerequisites
- MySQL Server installed and running
- MySQL client tools installed

### Step 1: Run Database Setup Script
The database setup script is located at `backend/src/main/resources/database_setup.sql`

Execute the script using:
```bash
mysql -u root -pVish@1213 < backend/src/main/resources/database_setup.sql
```

### Step 2: Verify Installation
Check that all tables were created and sample data was inserted:
```bash
mysql -u root -pVish@1213 -e "USE final_project_finance; SHOW TABLES;"
mysql -u root -pVish@1213 -e "USE final_project_finance; SELECT COUNT(*) as users FROM users; SELECT COUNT(*) as transactions FROM transactions;"
```

### Step 3: Application Configuration
The Spring Boot application is configured to connect to MySQL automatically. The configuration is in `backend/src/main/resources/application.properties`:

```properties
# Database Configuration (MySQL Database)
spring.datasource.url=jdbc:mysql://localhost:3306/final_project_finance?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=Vish@1213
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA/Hibernate Configuration
spring.jpa.database-platform=org.hibernate.dialect.MySQL8Dialect
spring.jpa.hibernate.ddl-auto=update
```

## Sample Data

The setup script includes sample data:

### Default Users
1. **Admin User**
   - Username: `admin`
   - Password: `admin123` (BCrypt hashed)
   - Email: `admin@financialledger.com`
   - Role: `ADMIN`

2. **Accountant User**
   - Username: `accountant`
   - Password: `accountant123` (BCrypt hashed)
   - Email: `accountant@financialledger.com`
   - Role: `ACCOUNTANT`

### Sample Transactions
- Initial Capital Investment ($10,000.00 CREDIT)
- Office Supplies Purchase ($250.50 DEBIT)
- Client Payment Received ($1,500.00 CREDIT)

## Database Indexes

The following indexes have been created for optimal performance:

- `transactions`: `idx_user_id`, `idx_date`, `idx_type`, `idx_status`
- `reconciliation`: `idx_client_name`, `idx_bank_name`, `idx_created_at`
- `audit_logs`: `idx_user_id`, `idx_timestamp`, `idx_action`

## Security Notes

- Passwords are stored using BCrypt hashing
- Database credentials are configured in application.properties
- In production, consider using environment variables for sensitive data

## Troubleshooting

### Connection Issues
- Ensure MySQL server is running
- Verify credentials are correct
- Check if port 3306 is accessible

### Table Creation Issues
- Ensure the user has CREATE DATABASE and CREATE TABLE privileges
- Check for existing tables with the same names

### Application Startup Issues
- Verify the MySQL Connector/J dependency is in pom.xml
- Check application.properties configuration
- Ensure the database server is accessible from the application

## Maintenance

### Backup
Regular database backups are recommended:
```bash
mysqldump -u root -pVish@1213 final_project_finance > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore
To restore from backup:
```bash
mysql -u root -pVish@1213 final_project_finance < backup_file.sql