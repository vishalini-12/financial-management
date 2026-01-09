package com.financial.ledger.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "reconciliation")
public class Reconciliation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "client_name", nullable = false)
    private String clientName;

    @Column(name = "bank_name", nullable = false)
    private String bankName;

    @Column(name = "from_date", nullable = false)
    private LocalDate fromDate;

    @Column(name = "to_date", nullable = false)
    private LocalDate toDate;

    @Column(name = "opening_balance", nullable = false)
    private Double openingBalance;

    @Column(name = "bank_balance", nullable = false)
    private Double bankBalance;

    @Column(name = "total_credit", nullable = false)
    private Double totalCredit;

    @Column(name = "total_debit", nullable = false)
    private Double totalDebit;

    @Column(name = "system_balance", nullable = false)
    private Double systemBalance;

    @Column(nullable = false)
    private Double difference;

    @Column(nullable = false)
    private String status;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    // Constructors
    public Reconciliation() {
        this.createdAt = LocalDateTime.now();
    }

    public Reconciliation(String clientName, String bankName, LocalDate fromDate, LocalDate toDate, Double openingBalance, Double bankBalance,
                         Double totalCredit, Double totalDebit, Double systemBalance, Double difference, String status) {
        this.clientName = clientName;
        this.bankName = bankName;
        this.fromDate = fromDate;
        this.toDate = toDate;
        this.openingBalance = openingBalance;
        this.bankBalance = bankBalance;
        this.totalCredit = totalCredit;
        this.totalDebit = totalDebit;
        this.systemBalance = systemBalance;
        this.difference = difference;
        this.status = status;
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getClientName() { return clientName; }
    public void setClientName(String clientName) { this.clientName = clientName; }

    public String getBankName() { return bankName; }
    public void setBankName(String bankName) { this.bankName = bankName; }

    public LocalDate getFromDate() { return fromDate; }
    public void setFromDate(LocalDate fromDate) { this.fromDate = fromDate; }

    public LocalDate getToDate() { return toDate; }
    public void setToDate(LocalDate toDate) { this.toDate = toDate; }

    public Double getOpeningBalance() { return openingBalance; }
    public void setOpeningBalance(Double openingBalance) { this.openingBalance = openingBalance; }

    public Double getBankBalance() { return bankBalance; }
    public void setBankBalance(Double bankBalance) { this.bankBalance = bankBalance; }

    public Double getTotalCredit() { return totalCredit; }
    public void setTotalCredit(Double totalCredit) { this.totalCredit = totalCredit; }

    public Double getTotalDebit() { return totalDebit; }
    public void setTotalDebit(Double totalDebit) { this.totalDebit = totalDebit; }

    public Double getSystemBalance() { return systemBalance; }
    public void setSystemBalance(Double systemBalance) { this.systemBalance = systemBalance; }

    public Double getDifference() { return difference; }
    public void setDifference(Double difference) { this.difference = difference; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
