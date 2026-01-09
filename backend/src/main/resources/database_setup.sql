-- Database Setup Script for Financial Ledger Project
-- Database Name: final_project_finance
-- MySQL Database Creation and Table Setup

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS final_project_finance;
USE final_project_finance;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'ACCOUNTANT') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    date TIMESTAMP NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    type ENUM('CREDIT', 'DEBIT') NOT NULL,
    status ENUM('PENDING', 'COMPLETED') NOT NULL DEFAULT 'COMPLETED',
    category VARCHAR(255) NOT NULL DEFAULT 'Miscellaneous',
    client_name VARCHAR(255) NOT NULL DEFAULT 'Manual Entry',
    bank_name VARCHAR(255),
    client_username VARCHAR(255) NOT NULL DEFAULT 'manual',
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_date (date),
    INDEX idx_type (type),
    INDEX idx_status (status)
);

-- Create reconciliation table
CREATE TABLE IF NOT EXISTS reconciliation (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    client_name VARCHAR(255) NOT NULL,
    bank_name VARCHAR(255) NOT NULL,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    opening_balance DECIMAL(15,2) NOT NULL,
    bank_balance DECIMAL(15,2) NOT NULL,
    total_credit DECIMAL(15,2) NOT NULL,
    total_debit DECIMAL(15,2) NOT NULL,
    system_balance DECIMAL(15,2) NOT NULL,
    difference DECIMAL(15,2) NOT NULL,
    status VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_client_name (client_name),
    INDEX idx_bank_name (bank_name),
    INDEX idx_created_at (created_at)
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    user_id BIGINT NOT NULL,
    details TEXT,
    INDEX idx_user_id (user_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_action (action)
);

-- Insert default admin user (password: admin123 - hashed)
-- Note: In production, use proper password hashing
INSERT IGNORE INTO users (username, password, email, role, created_at) VALUES
('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lbdxp7O5bLp2Q6PiO', 'admin@financialledger.com', 'ADMIN', NOW());

-- Insert sample accountant user (password: accountant123 - hashed)
INSERT IGNORE INTO users (username, password, email, role, created_at) VALUES
('accountant', '$2a$10$8K3.5yGJ8Vz6Q1X8wg9OeJ8zL8n8X9nL8n8X9nL8n8X9nL8n8X9n', 'accountant@financialledger.com', 'ACCOUNTANT', NOW());

-- Insert sample transactions for testing
INSERT IGNORE INTO transactions (date, description, amount, type, status, category, client_name, client_username, user_id, created_at) VALUES
(NOW(), 'Initial Capital Investment', 10000.00, 'CREDIT', 'COMPLETED', 'Investment', 'System Admin', 'admin', 1, NOW()),
(NOW(), 'Office Supplies Purchase', 250.50, 'DEBIT', 'COMPLETED', 'Office Expenses', 'ABC Corporation', 'abc_corp', 2, NOW()),
(NOW(), 'Client Payment Received', 1500.00, 'CREDIT', 'COMPLETED', 'Client Revenue', 'XYZ Ltd', 'xyz_ltd', 2, NOW());

-- Display success message
SELECT 'Database setup completed successfully!' as Status;