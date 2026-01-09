package com.financial.ledger.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO to store reconciliation calculation results.
 * This ensures exports use the SAME values displayed on screen.
 */
public class ReconciliationResult {

    private String clientName;
    private String bankName;
    private LocalDate fromDate;
    private LocalDate toDate;
    private String period; // Formatted period string
    private double openingBalance;
    private double totalCredit;
    private double totalDebit;
    private double systemBalance;
    private double bankBalance;
    private double difference;
    private String matchStatus;
    private LocalDateTime generatedDateTime;
    private int transactionCount;

    public ReconciliationResult() {
        this.generatedDateTime = LocalDateTime.now();
    }

    // Constructor for creating from reconciliation calculation
    public ReconciliationResult(String clientName, String bankName, LocalDate fromDate, LocalDate toDate,
                               double openingBalance, double totalCredit, double totalDebit,
                               double systemBalance, double bankBalance, double difference,
                               String matchStatus, int transactionCount) {
        this.clientName = clientName;
        this.bankName = bankName != null ? bankName : "All Banks";
        this.fromDate = fromDate;
        this.toDate = toDate;
        this.openingBalance = openingBalance;
        this.totalCredit = totalCredit;
        this.totalDebit = totalDebit;
        this.systemBalance = systemBalance;
        this.bankBalance = bankBalance;
        this.difference = difference;
        this.matchStatus = matchStatus;
        this.transactionCount = transactionCount;
        this.generatedDateTime = LocalDateTime.now();

        // Format period string
        if (fromDate != null && toDate != null) {
            this.period = fromDate.format(java.time.format.DateTimeFormatter.ofPattern("dd MMMM yyyy")) +
                         " – " + toDate.format(java.time.format.DateTimeFormatter.ofPattern("dd MMMM yyyy"));
        } else {
            this.period = "N/A – N/A";
        }
    }

    // Getters and setters
    public String getClientName() { return clientName; }
    public void setClientName(String clientName) { this.clientName = clientName; }

    public String getBankName() { return bankName; }
    public void setBankName(String bankName) { this.bankName = bankName; }

    public LocalDate getFromDate() { return fromDate; }
    public void setFromDate(LocalDate fromDate) { this.fromDate = fromDate; }

    public LocalDate getToDate() { return toDate; }
    public void setToDate(LocalDate toDate) { this.toDate = toDate; }

    public String getPeriod() { return period; }
    public void setPeriod(String period) { this.period = period; }

    public double getOpeningBalance() { return openingBalance; }
    public void setOpeningBalance(double openingBalance) { this.openingBalance = openingBalance; }

    public double getTotalCredit() { return totalCredit; }
    public void setTotalCredit(double totalCredit) { this.totalCredit = totalCredit; }

    public double getTotalDebit() { return totalDebit; }
    public void setTotalDebit(double totalDebit) { this.totalDebit = totalDebit; }

    public double getSystemBalance() { return systemBalance; }
    public void setSystemBalance(double systemBalance) { this.systemBalance = systemBalance; }

    public double getBankBalance() { return bankBalance; }
    public void setBankBalance(double bankBalance) { this.bankBalance = bankBalance; }

    public double getDifference() { return difference; }
    public void setDifference(double difference) { this.difference = difference; }

    public String getMatchStatus() { return matchStatus; }
    public void setMatchStatus(String matchStatus) { this.matchStatus = matchStatus; }

    public LocalDateTime getGeneratedDateTime() { return generatedDateTime; }
    public void setGeneratedDateTime(LocalDateTime generatedDateTime) { this.generatedDateTime = generatedDateTime; }

    public int getTransactionCount() { return transactionCount; }
    public void setTransactionCount(int transactionCount) { this.transactionCount = transactionCount; }

    @Override
    public String toString() {
        return "ReconciliationResult{" +
                "clientName='" + clientName + '\'' +
                ", bankName='" + bankName + '\'' +
                ", period='" + period + '\'' +
                ", openingBalance=" + openingBalance +
                ", totalCredit=" + totalCredit +
                ", totalDebit=" + totalDebit +
                ", systemBalance=" + systemBalance +
                ", bankBalance=" + bankBalance +
                ", difference=" + difference +
                ", matchStatus='" + matchStatus + '\'' +
                ", transactionCount=" + transactionCount +
                ", generatedDateTime=" + generatedDateTime +
                '}';
    }
}
