package com.financial.ledger.model;

import java.time.LocalDateTime;

public class TransactionDTO {
    private Long id;
    private LocalDateTime date;
    private String description;
    private Double amount;
    private String type;
    private String status;
    private String category;
    // CRITICAL: clientName MUST ALWAYS be a String - NEVER a User object
    // This DTO ensures frontend receives readable client names only
    private String clientName;
    private String clientUsername;
    private Long userId;
    private LocalDateTime createdAt;

    // Default constructor
    public TransactionDTO() {}

    // Constructor from Transaction entity - clientName is stored as String in database
    public TransactionDTO(Transaction transaction) {
        this.id = transaction.getId();
        this.date = transaction.getDate();
        this.description = transaction.getDescription();
        this.amount = transaction.getAmount();
        this.type = transaction.getType() != null ? transaction.getType().name() : null;
        this.status = transaction.getStatus() != null ? transaction.getStatus().name() : null;
        this.category = transaction.getCategory();

        // RULE 2: clientName is stored ONLY as String in database
        // NEVER a User object - always transaction.getClientName()
        this.clientName = transaction.getClientName();

        this.clientUsername = transaction.getClientUsername();
        this.userId = transaction.getUserId();
        this.createdAt = transaction.getCreatedAt();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDateTime getDate() { return date; }
    public void setDate(LocalDateTime date) { this.date = date; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getClientName() { return clientName; }
    public void setClientName(String clientName) { this.clientName = clientName; }

    public String getClientUsername() { return clientUsername; }
    public void setClientUsername(String clientUsername) { this.clientUsername = clientUsername; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
