package com.financial.ledger.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Column(nullable = false)
    private LocalDateTime date;

    @NotBlank
    @Column(nullable = false)
    private String description;

    @NotNull
    @Positive
    @Column(nullable = false)
    private Double amount;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Type type;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.COMPLETED;

    @NotNull
    @Column(nullable = false)
    private String category;

    // CRITICAL: clientName MUST ALWAYS be a String containing the client name
    // NEVER store User objects or any other objects in this field
    // This field is used for client display and must contain readable text only
    // Examples: "sandhiya", "ABC Corporation", "Manual Entry"
    // NOT: User objects, null values, or object references
    @NotNull
    @Column(nullable = false)
    private String clientName;

    @Column(name = "bank_name", nullable = true)
    private String bankName;

    @NotNull
    @Column(nullable = false)
    private String clientUsername;

    // IMPORTANT: userId is NOT auto-incrementing!
    // It stores the ID of the user who created this transaction
    // All transactions by the same user will have the same userId value
    // Example: All accountant transactions have userId = 2
    @NotNull
    @Column(nullable = false)
    private Long userId;

    @NotNull
    @Column(nullable = false)
    private LocalDateTime createdAt;

    public enum Type {
        CREDIT, DEBIT
    }

    public enum Status {
        PENDING, COMPLETED
    }

    // Constructors
    public Transaction() {
        // Set defaults for required fields
        this.status = Status.COMPLETED;
        this.category = "Miscellaneous";
        this.clientName = "Manual Entry";
        this.clientUsername = "manual";
        this.createdAt = LocalDateTime.now();
    }

    public Transaction(LocalDateTime date, String description, Double amount, Type type, Long userId) {
        this();
        this.date = date;
        this.description = description;
        this.amount = amount;
        this.type = type;
        this.userId = userId;
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

    public Type getType() { return type; }
    public void setType(Type type) { this.type = type; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getClientName() { return clientName; }
    public void setClientName(String clientName) { this.clientName = clientName; }

    public String getBankName() { return bankName; }
    public void setBankName(String bankName) { this.bankName = bankName; }

    public String getClientUsername() { return clientUsername; }
    public void setClientUsername(String clientUsername) { this.clientUsername = clientUsername; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
