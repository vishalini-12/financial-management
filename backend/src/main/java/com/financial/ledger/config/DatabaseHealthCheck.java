package com.financial.ledger.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseHealthCheck {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void checkDatabaseConnection() {
        try {
            System.out.println("=== DATABASE CONNECTION CHECK ===");

            // Test basic connectivity
            Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            System.out.println("✅ Database connection successful (test query result: " + result + ")");

            // Check if tables exist
            try {
                Integer userCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM users", Integer.class);
                Integer transactionCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM transactions", Integer.class);
                Integer reconciliationCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM client_reconciliation", Integer.class);

                System.out.println("📊 Database status:");
                System.out.println("   - Users table: " + userCount + " records");
                System.out.println("   - Transactions table: " + transactionCount + " records");
                System.out.println("   - Client reconciliation table: " + reconciliationCount + " records");

            } catch (Exception e) {
                System.out.println("⚠️  Tables may not exist yet, will be created by Hibernate: " + e.getMessage());
            }

            System.out.println("=== DATABASE READY ===");

        } catch (Exception e) {
            System.err.println("❌ DATABASE CONNECTION FAILED!");
            System.err.println("Error: " + e.getMessage());
            System.err.println("Please ensure:");
            System.err.println("1. MySQL server is running");
            System.err.println("2. Database 'financial_ledger_db' exists or can be created");
            System.err.println("3. MySQL credentials are correct (root/Vish@1213)");
            System.err.println("4. MySQL port 3306 is accessible");
            throw new RuntimeException("Database connection failed", e);
        }
    }
}
