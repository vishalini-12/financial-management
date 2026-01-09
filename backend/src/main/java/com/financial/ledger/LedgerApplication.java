package com.financial.ledger;

import com.financial.ledger.model.AuditLog;
import com.financial.ledger.model.Transaction;
import com.financial.ledger.model.User;
import com.financial.ledger.repository.AuditLogRepository;
import com.financial.ledger.repository.TransactionRepository;
import com.financial.ledger.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.time.LocalDate;
import java.time.LocalDateTime;

@SpringBootApplication
public class LedgerApplication implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public static void main(String[] args) {
        System.out.println("🚀 Starting Financial Ledger Application...");
        System.out.println("📊 Connecting to H2 database: ./data/financial_ledger");
        System.out.println("🌐 Server will be available at: http://localhost:8080");
        System.out.println("🔗 H2 Console: http://localhost:8080/h2-console");
        System.out.println("📋 Default users: admin/admin, accountant/pass");
        SpringApplication.run(LedgerApplication.class, args);
    }

    @Override
    public void run(String... args) throws Exception {
        System.out.println("Initializing application...");

        User admin = null, accountant = null;

        // Check if users already exist (for H2 persistence)
        if (userRepository.count() == 0) {
            System.out.println("Creating default users...");

            // Create users only if they don't exist
            admin = new User("admin", passwordEncoder.encode("admin"), "admin@example.com", User.Role.ADMIN);
            accountant = new User("accountant", passwordEncoder.encode("pass"), "accountant@example.com", User.Role.ACCOUNTANT);

            admin = userRepository.save(admin);
            accountant = userRepository.save(accountant);

            System.out.println("Default users created:");
            System.out.println("- admin/admin (ID: " + admin.getId() + ")");
            System.out.println("- accountant/pass (ID: " + accountant.getId() + ")");
        } else {
            System.out.println("Users already exist, skipping user creation");
            // Get existing users for transaction creation (if needed)
            java.util.List<User> users = userRepository.findAll();
            for (User u : users) {
                if ("admin".equals(u.getUsername())) admin = u;
                else if ("accountant".equals(u.getUsername())) accountant = u;
            }
        }

        // FORCE CLEAN DATABASE - Delete all existing transactions to ensure clean slate
        System.out.println("🧹 FORCE CLEANING DATABASE - Removing all existing transactions");
        long deletedCount = transactionRepository.count();
        transactionRepository.deleteAll();
        System.out.println("Deleted " + deletedCount + " existing transactions");

        // Always load fresh data from CSV
        System.out.println("Loading fresh transactions from user_transactions.csv...");
        loadTransactionsFromCSV();

        // Create sample audit logs
        System.out.println("Creating sample audit logs...");
        createSampleAuditLogs(admin, accountant);

        System.out.println("   - Total users: " + userRepository.count());
        System.out.println("   - Total audit logs: " + auditLogRepository.count());

        // RESET AUTO-INCREMENT COUNTERS for clean IDs starting from 1
        System.out.println("Resetting auto-increment counters...");
        try {
            // Reset users table auto-increment to 1
            userRepository.resetAutoIncrement();
            System.out.println("Auto-increment counters reset successfully");
        } catch (Exception e) {
            System.out.println("Could not reset auto-increment counters (this is normal for some databases): " + e.getMessage());
        }

        System.out.println("Application ready - H2 database initialized successfully");
    }

    private void loadTransactionsFromCSV() {
        try {
            // Get the admin user for setting userId
            User admin = userRepository.findByUsername("admin").orElse(null);
            if (admin == null) {
                System.out.println("Admin user not found, cannot load CSV transactions");
                return;
            }

            // Load the CSV file from resources
            BufferedReader reader = new BufferedReader(
                new InputStreamReader(getClass().getClassLoader().getResourceAsStream("user_transactions.csv"))
            );

            String line;
            int lineNumber = 0;
            int transactionsLoaded = 0;

            while ((line = reader.readLine()) != null) {
                lineNumber++;
                System.out.println("Processing CSV line " + lineNumber + ": " + line);

                // Skip header row
                if (lineNumber == 1) {
                    System.out.println("Skipping header row");
                    continue;
                }

                // Skip empty lines
                if (line.trim().isEmpty()) {
                    continue;
                }

                try {
                    // Parse CSV line: date,type,client_name,description,category,status,amount
                    String[] parts = line.split(",");
                    if (parts.length < 7) {
                        System.out.println("Skipping invalid line " + lineNumber + " - not enough columns");
                        continue;
                    }

                    String dateStr = parts[0].trim();
                    String typeStr = parts[1].trim();
                    String clientNameStr = parts[2].trim();
                    String descriptionStr = parts[3].trim();
                    String categoryStr = parts[4].trim();
                    String statusStr = parts[5].trim();
                    String amountStr = parts[6].trim();

                    // Create transaction
                    Transaction transaction = new Transaction();

                    // Set date - handle invalid dates
                    LocalDateTime dateTime;
                    if ("########".equals(dateStr) || dateStr.isEmpty()) {
                        dateTime = LocalDateTime.now().minusDays(30); // Default to 30 days ago
                    } else {
                        try {
                            LocalDate date = LocalDate.parse(dateStr);
                            dateTime = date.atStartOfDay();
                        } catch (Exception e) {
                            dateTime = LocalDateTime.now().minusDays(30); // Default on parse error
                        }
                    }
                    transaction.setDate(dateTime);

                    // Set description
                    transaction.setDescription(descriptionStr);

                    // Set amount
                    try {
                        double amount = Double.parseDouble(amountStr);
                        transaction.setAmount(amount);
                    } catch (Exception e) {
                        System.out.println("Invalid amount '" + amountStr + "' on line " + lineNumber + ", skipping");
                        continue;
                    }

                    // Set type
                    if ("CREDIT".equalsIgnoreCase(typeStr)) {
                        transaction.setType(Transaction.Type.CREDIT);
                    } else if ("DEBIT".equalsIgnoreCase(typeStr)) {
                        transaction.setType(Transaction.Type.DEBIT);
                    } else {
                        System.out.println("Invalid type '" + typeStr + "' on line " + lineNumber + ", defaulting to CREDIT");
                        transaction.setType(Transaction.Type.CREDIT);
                    }

                    // Set category
                    transaction.setCategory(categoryStr.isEmpty() ? "Miscellaneous" : categoryStr);

                    // Set client name and username (same for simplicity)
                    transaction.setClientName(clientNameStr);
                    transaction.setClientUsername(clientNameStr);

                    // Set status
                    if ("COMPLETE".equalsIgnoreCase(statusStr) || "COMPLETED".equalsIgnoreCase(statusStr)) {
                        transaction.setStatus(Transaction.Status.COMPLETED);
                    } else {
                        transaction.setStatus(Transaction.Status.PENDING);
                    }

                    // Set user ID (admin)
                    transaction.setUserId(admin.getId());
                    transaction.setCreatedAt(LocalDateTime.now());

                    // Save transaction
                    Transaction saved = transactionRepository.save(transaction);
                    transactionsLoaded++;

                    System.out.println("Loaded transaction: " + saved.getDescription() +
                        " | Amount: $" + saved.getAmount() +
                        " | Type: " + saved.getType() +
                        " | Client: " + saved.getClientName() +
                        " | Status: " + saved.getStatus());

                } catch (Exception e) {
                    System.err.println("Error processing line " + lineNumber + ": " + e.getMessage());
                    // Continue with other lines
                }
            }

            reader.close();

            System.out.println("✅ CSV loading completed!");
            System.out.println("   - Lines processed: " + (lineNumber - 1)); // Subtract header
            System.out.println("   - Transactions loaded: " + transactionsLoaded);

        } catch (Exception e) {
            System.err.println("Error loading transactions from CSV: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void createSampleAuditLogs(User admin, User accountant) {
        if (admin == null || accountant == null) {
            System.out.println("Cannot create audit logs - users not found");
            return;
        }

        LocalDateTime now = LocalDateTime.now();

        // Create various audit log entries with different actions and statuses
        auditLogRepository.save(new AuditLog("LOGIN", now.minusHours(2), admin.getId(), "Admin user logged in successfully"));
        auditLogRepository.save(new AuditLog("VIEW_DASHBOARD", now.minusHours(1).minusMinutes(45), admin.getId(), "Accessed main dashboard"));
        auditLogRepository.save(new AuditLog("ADD_TRANSACTION", now.minusHours(1).minusMinutes(30), admin.getId(), "Created new transaction for client Tech Startup Inc"));
        auditLogRepository.save(new AuditLog("CSV_UPLOAD", now.minusHours(1).minusMinutes(15), admin.getId(), "Uploaded transaction data via CSV file"));
        auditLogRepository.save(new AuditLog("RECONCILIATION", now.minusHours(1), admin.getId(), "Performed bank reconciliation for account ending in 1234"));
        auditLogRepository.save(new AuditLog("EXPORT_REPORT", now.minusMinutes(45), admin.getId(), "Generated monthly financial report"));
        auditLogRepository.save(new AuditLog("VIEW_DASHBOARD", now.minusMinutes(30), accountant.getId(), "Accountant accessed dashboard"));
        auditLogRepository.save(new AuditLog("ADD_TRANSACTION", now.minusMinutes(20), accountant.getId(), "Added bookkeeping transaction for Local Business Co"));
        auditLogRepository.save(new AuditLog("PDF_UPLOAD", now.minusMinutes(10), accountant.getId(), "Uploaded PDF document for tax records"));
        auditLogRepository.save(new AuditLog("LOGIN", now.minusMinutes(5), accountant.getId(), "Accountant user logged in"));
        auditLogRepository.save(new AuditLog("VIEW_DASHBOARD", now.minusMinutes(2), accountant.getId(), "Viewed transaction summary"));
        auditLogRepository.save(new AuditLog("FAILED_LOGIN", now.minusDays(1).plusHours(2), admin.getId(), "Failed login attempt - invalid password"));
        auditLogRepository.save(new AuditLog("LOGOUT", now.minusHours(3), admin.getId(), "Admin user logged out"));
        auditLogRepository.save(new AuditLog("LOGOUT", now.minusHours(1), accountant.getId(), "Accountant user logged out"));
        auditLogRepository.save(new AuditLog("ADD_TRANSACTION", now.minusDays(2).plusHours(1), admin.getId(), "Created transaction for ABC Corporation"));
        auditLogRepository.save(new AuditLog("RECONCILIATION", now.minusDays(1).plusHours(4), accountant.getId(), "Completed reconciliation for XYZ Ltd"));

        System.out.println("Sample audit logs created successfully");
    }

    private void createSampleTransactions(User admin, User accountant, User user) {
        LocalDateTime now = LocalDateTime.now();
        Long adminId = admin.getId();
        Long accountantId = accountant.getId();
        Long userId = user.getId();

        // Admin transactions (global view)
        Transaction t1 = new Transaction();
        t1.setDate(now.minusDays(30));
        t1.setDescription("Office Supplies Purchase");
        t1.setAmount(1500.00);
        t1.setType(Transaction.Type.DEBIT);
        t1.setCategory("Office Expense");
        t1.setClientName("ABC Corporation");
        t1.setClientUsername("abc_corp");
        t1.setUserId(adminId);
        t1.setCreatedAt(now.minusDays(30));
        transactionRepository.save(t1);

        Transaction t2 = new Transaction();
        t2.setDate(now.minusDays(25));
        t2.setDescription("Client Payment Received");
        t2.setAmount(5000.00);
        t2.setType(Transaction.Type.CREDIT);
        t2.setCategory("Client Payment");
        t2.setClientName("XYZ Ltd");
        t2.setClientUsername("xyz_ltd");
        t2.setUserId(adminId);
        t2.setCreatedAt(now.minusDays(25));
        transactionRepository.save(t2);

        Transaction t3 = new Transaction();
        t3.setDate(now.minusDays(20));
        t3.setDescription("Software License Renewal");
        t3.setAmount(2500.00);
        t3.setType(Transaction.Type.DEBIT);
        t3.setCategory("Software");
        t3.setClientName("Tech Solutions Inc");
        t3.setClientUsername("tech_solutions");
        t3.setUserId(adminId);
        t3.setCreatedAt(now.minusDays(20));
        transactionRepository.save(t3);

        Transaction t4 = new Transaction();
        t4.setDate(now.minusDays(15));
        t4.setDescription("Consulting Services");
        t4.setAmount(3500.00);
        t4.setType(Transaction.Type.CREDIT);
        t4.setCategory("Consulting");
        t4.setClientName("Global Enterprises");
        t4.setClientUsername("global_ent");
        t4.setUserId(adminId);
        t4.setCreatedAt(now.minusDays(15));
        transactionRepository.save(t4);

        Transaction t5 = new Transaction();
        t5.setDate(now.minusDays(10));
        t5.setDescription("Marketing Campaign");
        t5.setAmount(1200.00);
        t5.setType(Transaction.Type.DEBIT);
        t5.setCategory("Marketing");
        t5.setClientName("Digital Marketing Co");
        t5.setClientUsername("digital_mkt");
        t5.setUserId(adminId);
        t5.setCreatedAt(now.minusDays(10));
        transactionRepository.save(t5);

        Transaction t6 = new Transaction();
        t6.setDate(now.minusDays(5));
        t6.setDescription("Monthly Salary Payment");
        t6.setAmount(8000.00);
        t6.setType(Transaction.Type.DEBIT);
        t6.setCategory("Salary");
        t6.setClientName("Employee Payroll");
        t6.setClientUsername("payroll");
        t6.setUserId(adminId);
        t6.setCreatedAt(now.minusDays(5));
        transactionRepository.save(t6);

        // Accountant transactions
        Transaction t7 = new Transaction();
        t7.setDate(now.minusDays(28));
        t7.setDescription("Tax Preparation Service");
        t7.setAmount(2200.00);
        t7.setType(Transaction.Type.CREDIT);
        t7.setCategory("Tax Services");
        t7.setClientName("Johnson & Associates");
        t7.setClientUsername("johnson_assoc");
        t7.setUserId(accountantId);
        t7.setCreatedAt(now.minusDays(28));
        transactionRepository.save(t7);

        Transaction t8 = new Transaction();
        t8.setDate(now.minusDays(22));
        t8.setDescription("Audit Fee Payment");
        t8.setAmount(1800.00);
        t8.setType(Transaction.Type.CREDIT);
        t8.setCategory("Audit Services");
        t8.setClientName("Smith Accounting");
        t8.setClientUsername("smith_acct");
        t8.setUserId(accountantId);
        t8.setCreatedAt(now.minusDays(22));
        transactionRepository.save(t8);

        Transaction t9 = new Transaction();
        t9.setDate(now.minusDays(18));
        t9.setDescription("Bookkeeping Services");
        t9.setAmount(950.00);
        t9.setType(Transaction.Type.CREDIT);
        t9.setCategory("Bookkeeping");
        t9.setClientName("Local Business Co");
        t9.setClientUsername("local_business");
        t9.setUserId(accountantId);
        t9.setCreatedAt(now.minusDays(18));
        transactionRepository.save(t9);

        Transaction t10 = new Transaction();
        t10.setDate(now.minusDays(12));
        t10.setDescription("Financial Planning Consultation");
        t10.setAmount(750.00);
        t10.setType(Transaction.Type.CREDIT);
        t10.setCategory("Financial Planning");
        t10.setClientName("Williams Family");
        t10.setClientUsername("williams_family");
        t10.setUserId(accountantId);
        t10.setCreatedAt(now.minusDays(12));
        transactionRepository.save(t10);

        // User transactions (transactions created for the user)
        Transaction t11 = new Transaction();
        t11.setDate(now.minusDays(7));
        t11.setDescription("user - Freelance Project Payment");
        t11.setAmount(2500.00);
        t11.setType(Transaction.Type.CREDIT);
        t11.setCategory("Freelance");
        t11.setClientName("user");
        t11.setClientUsername("user");
        t11.setUserId(adminId); // Created by admin for the user
        t11.setCreatedAt(now.minusDays(7));
        transactionRepository.save(t11);

        Transaction t12 = new Transaction();
        t12.setDate(now.minusDays(3));
        t12.setDescription("user - Consulting Fee");
        t12.setAmount(1800.00);
        t12.setType(Transaction.Type.CREDIT);
        t12.setCategory("Consulting");
        t12.setClientName("user");
        t12.setClientUsername("user");
        t12.setUserId(accountantId); // Created by accountant for the user
        t12.setCreatedAt(now.minusDays(3));
        transactionRepository.save(t12);

        Transaction t13 = new Transaction();
        t13.setDate(now.minusDays(1));
        t13.setDescription("user - Project Completion Bonus");
        t13.setAmount(500.00);
        t13.setType(Transaction.Type.CREDIT);
        t13.setCategory("Bonus");
        t13.setClientName("user");
        t13.setClientUsername("user");
        t13.setUserId(accountantId);
        t13.setCreatedAt(now.minusDays(1));
        transactionRepository.save(t13);

        // Recent transactions
        Transaction t14 = new Transaction();
        t14.setDate(now.minusHours(2));
        t14.setDescription("Website Development Service");
        t14.setAmount(3200.00);
        t14.setType(Transaction.Type.CREDIT);
        t14.setCategory("Web Development");
        t14.setClientName("Tech Startup Inc");
        t14.setClientUsername("tech_startup");
        t14.setUserId(adminId);
        t14.setCreatedAt(now.minusHours(2));
        transactionRepository.save(t14);

        Transaction t15 = new Transaction();
        t15.setDate(now.minusHours(1));
        t15.setDescription("Monthly Internet Bill");
        t15.setAmount(150.00);
        t15.setType(Transaction.Type.DEBIT);
        t15.setCategory("Utilities");
        t15.setClientName("ISP Provider");
        t15.setClientUsername("isp_provider");
        t15.setUserId(adminId);
        t15.setCreatedAt(now.minusHours(1));
        transactionRepository.save(t15);
    }

}
