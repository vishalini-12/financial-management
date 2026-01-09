package com.financial.ledger.service;

import com.financial.ledger.model.Reconciliation;
import com.financial.ledger.model.Transaction;
import com.financial.ledger.repository.ReconciliationRepository;
import com.financial.ledger.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReconciliationService {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private ReconciliationRepository reconciliationRepository;

    /**
     * Calculate reconciliation for a client within a date range
     * @param clientName The client name (case-insensitive, trimmed)
     * @param bankName The bank name
     * @param fromDate Start date (inclusive)
     * @param toDate End date (inclusive)
     * @param openingBalance Opening balance for the period
     * @param bankBalance Bank balance to compare against
     * @return Map containing reconciliation results
     */
    @Transactional(readOnly = true)
    public Map<String, Object> calculateReconciliation(String clientName, String bankName,
                                                      LocalDate fromDate, LocalDate toDate,
                                                      double openingBalance, double bankBalance) {

        System.out.println("=== RECONCILIATION SERVICE CALCULATION ===");
        System.out.println("Client: '" + clientName + "', Bank: '" + bankName + "'");
        System.out.println("Date Range: " + fromDate + " to " + toDate);
        System.out.println("Opening Balance: $" + openingBalance + ", Bank Balance: $" + bankBalance);

        // Normalize client name for consistent matching
        String normalizedClientName = clientName.trim();
        System.out.println("Normalized client name: '" + normalizedClientName + "'");

        // STEP 1: Fetch transactions for reconciliation using the new repository method
        List<Transaction> transactions = transactionRepository.findTransactionsForReconciliation(
            normalizedClientName, fromDate, toDate);

        System.out.println("Found " + transactions.size() + " transactions for client '" + normalizedClientName + "'");

        // STEP 2: Log all transactions for debugging
        for (Transaction t : transactions) {
            System.out.println("  Transaction ID=" + t.getId() + ", Date=" + t.getDate().toLocalDate() +
                             ", Type=" + t.getType() + ", Amount=$" + t.getAmount() +
                             ", Status=" + t.getStatus() + ", Client='" + t.getClientName() + "'");
        }

        // STEP 3: Calculate totals using precise database queries
        Double totalCredit = transactionRepository.getTotalAmountForReconciliation(
            normalizedClientName, Transaction.Type.CREDIT, fromDate, toDate);
        Double totalDebit = transactionRepository.getTotalAmountForReconciliation(
            normalizedClientName, Transaction.Type.DEBIT, fromDate, toDate);

        // Handle null values
        double credit = totalCredit != null ? totalCredit : 0.0;
        double debit = totalDebit != null ? totalDebit : 0.0;

        System.out.println("Calculated totals from database queries:");
        System.out.println("  Total Credit: $" + credit);
        System.out.println("  Total Debit: $" + debit);

        // STEP 4: Calculate derived values with precise rounding
        double systemBalance = roundToTwoDecimals(openingBalance + credit - debit);
        double difference = roundToTwoDecimals(systemBalance - bankBalance);
        String status = Math.abs(difference) < 0.01 ? "MATCHED" : "UNMATCHED";

        System.out.println("Final calculations:");
        System.out.println("  System Balance: $" + systemBalance + " (Opening $" + openingBalance + " + Credit $" + credit + " - Debit $" + debit + ")");
        System.out.println("  Difference: $" + difference + " (System $" + systemBalance + " - Bank $" + bankBalance + ")");
        System.out.println("  Status: " + status);

        // STEP 5: Return results
        Map<String, Object> results = new HashMap<>();
        results.put("clientName", normalizedClientName);
        results.put("bankName", bankName);
        results.put("fromDate", fromDate);
        results.put("toDate", toDate);
        results.put("openingBalance", openingBalance);
        results.put("bankBalance", bankBalance);
        results.put("totalCredit", credit);
        results.put("totalDebit", debit);
        results.put("systemBalance", systemBalance);
        results.put("difference", difference);
        results.put("status", status);
        results.put("transactionCount", transactions.size());
        results.put("transactions", transactions);

        return results;
    }

    /**
     * Save reconciliation results to database
     * @param calculationResults Results from calculateReconciliation method
     * @return Saved Reconciliation entity
     */
    @Transactional
    public Reconciliation saveReconciliation(Map<String, Object> calculationResults) {
        System.out.println("=== SAVING RECONCILIATION TO DATABASE ===");

        Reconciliation reconciliation = new Reconciliation(
            (String) calculationResults.get("clientName"),
            (String) calculationResults.get("bankName"),
            (LocalDate) calculationResults.get("fromDate"),
            (LocalDate) calculationResults.get("toDate"),
            (Double) calculationResults.get("openingBalance"),
            (Double) calculationResults.get("bankBalance"),
            (Double) calculationResults.get("totalCredit"),
            (Double) calculationResults.get("totalDebit"),
            (Double) calculationResults.get("systemBalance"),
            (Double) calculationResults.get("difference"),
            (String) calculationResults.get("status")
        );

        Reconciliation saved = reconciliationRepository.save(reconciliation);

        System.out.println("Reconciliation saved with ID: " + saved.getId());
        System.out.println("Saved values - Credit: $" + saved.getTotalCredit() +
                         ", Debit: $" + saved.getTotalDebit() +
                         ", System: $" + saved.getSystemBalance() +
                         ", Difference: $" + saved.getDifference() +
                         ", Status: " + saved.getStatus());

        return saved;
    }

    /**
     * Validate reconciliation calculation by comparing with manual calculation
     * @param calculationResults Results from calculateReconciliation method
     * @return true if validation passes
     */
    public boolean validateReconciliation(Map<String, Object> calculationResults) {
        System.out.println("=== VALIDATING RECONCILIATION CALCULATION ===");

        @SuppressWarnings("unchecked")
        List<Transaction> transactions = (List<Transaction>) calculationResults.get("transactions");
        double openingBalance = (Double) calculationResults.get("openingBalance");
        double bankBalance = (Double) calculationResults.get("bankBalance");

        // Manual calculation from transaction list
        double manualCredit = transactions.stream()
            .filter(t -> t.getType() == Transaction.Type.CREDIT)
            .mapToDouble(Transaction::getAmount)
            .sum();

        double manualDebit = transactions.stream()
            .filter(t -> t.getType() == Transaction.Type.DEBIT)
            .mapToDouble(Transaction::getAmount)
            .sum();

        double manualSystemBalance = roundToTwoDecimals(openingBalance + manualCredit - manualDebit);
        double manualDifference = roundToTwoDecimals(manualSystemBalance - bankBalance);

        // Compare with database query results
        double queryCredit = (Double) calculationResults.get("totalCredit");
        double queryDebit = (Double) calculationResults.get("totalDebit");
        double querySystemBalance = (Double) calculationResults.get("systemBalance");
        double queryDifference = (Double) calculationResults.get("difference");

        boolean creditMatch = Math.abs(manualCredit - queryCredit) < 0.01;
        boolean debitMatch = Math.abs(manualDebit - queryDebit) < 0.01;
        boolean systemMatch = Math.abs(manualSystemBalance - querySystemBalance) < 0.01;
        boolean differenceMatch = Math.abs(manualDifference - queryDifference) < 0.01;

        System.out.println("Validation Results:");
        System.out.println("  Manual Credit: $" + manualCredit + " vs Query: $" + queryCredit + " - " + (creditMatch ? "✓" : "✗"));
        System.out.println("  Manual Debit: $" + manualDebit + " vs Query: $" + queryDebit + " - " + (debitMatch ? "✓" : "✗"));
        System.out.println("  Manual System: $" + manualSystemBalance + " vs Query: $" + querySystemBalance + " - " + (systemMatch ? "✓" : "✗"));
        System.out.println("  Manual Difference: $" + manualDifference + " vs Query: $" + queryDifference + " - " + (differenceMatch ? "✓" : "✗"));

        boolean allMatch = creditMatch && debitMatch && systemMatch && differenceMatch;
        System.out.println("Overall validation: " + (allMatch ? "PASSED ✓" : "FAILED ✗"));

        return allMatch;
    }

    /**
     * Helper method to round to 2 decimal places
     */
    private double roundToTwoDecimals(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}