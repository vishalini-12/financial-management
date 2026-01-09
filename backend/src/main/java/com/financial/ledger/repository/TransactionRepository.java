package com.financial.ledger.repository;

import com.financial.ledger.model.Transaction;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    @Query("SELECT t FROM Transaction t WHERE t.userId = :userId ORDER BY t.date DESC")
    List<Transaction> findByUserId(@Param("userId") Long userId);

    @Query("SELECT t FROM Transaction t WHERE t.clientUsername = :clientUsername ORDER BY t.date DESC")
    List<Transaction> findByClientUsername(@Param("clientUsername") String clientUsername);

    @Query("SELECT t FROM Transaction t WHERE t.description LIKE CONCAT(:username, ' - %') ORDER BY t.date DESC")
    List<Transaction> findByClientUsernameInDescription(@Param("username") String username);

    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.userId = :userId AND t.type = 'CREDIT'")
    Double getTotalCredit(@Param("userId") Long userId);

    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.userId = :userId AND t.type = 'DEBIT'")
    Double getTotalDebit(@Param("userId") Long userId);

    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.clientName = :clientName AND t.type = 'CREDIT'")
    Double getTotalCreditByClient(@Param("clientName") String clientName);

    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.clientName = :clientName AND t.type = 'DEBIT'")
    Double getTotalDebitByClient(@Param("clientName") String clientName);

    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.clientUsername = :clientUsername AND t.status = 'PENDING'")
    Double getPendingAmountByClient(@Param("clientUsername") String clientUsername);

    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.clientName = :clientName AND t.type = 'CREDIT'")
    Double getTotalCreditByClientName(@Param("clientName") String clientName);

    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.clientName = :clientName AND t.type = 'DEBIT'")
    Double getTotalDebitByClientName(@Param("clientName") String clientName);

    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.status = 'PENDING'")
    Long getPendingTransactionCount();

    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.status = 'PENDING' AND t.clientUsername = :clientUsername")
    Long getPendingTransactionCountByClient(@Param("clientUsername") String clientUsername);

    @Query("SELECT t FROM Transaction t ORDER BY t.date DESC")
    List<Transaction> findRecentTransactions(Pageable pageable);

    @Query("SELECT t FROM Transaction t WHERE t.clientUsername = :clientUsername ORDER BY t.date DESC")
    List<Transaction> findRecentTransactionsByClient(@Param("clientUsername") String clientUsername, Pageable pageable);

    @Query("SELECT t FROM Transaction t WHERE t.userId = :userId ORDER BY t.date DESC")
    List<Transaction> findRecentTransactionsByUser(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT t FROM Transaction t ORDER BY t.date DESC")
    List<Transaction> findAllRecentTransactions(Pageable pageable);

    @Query("SELECT t FROM Transaction t ORDER BY t.createdAt DESC")
    List<Transaction> findAllOrderedByDateDesc();

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.type = 'CREDIT' AND t.status = 'COMPLETED'")
    Double getTotalCreditGlobal();

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.type = 'DEBIT' AND t.status = 'COMPLETED'")
    Double getTotalDebitGlobal();

    @Query("SELECT DISTINCT t.clientName FROM Transaction t WHERE t.clientName IS NOT NULL AND t.clientName != '' ORDER BY t.clientName")
    List<String> findDistinctClientNames();

    @Query("SELECT t FROM Transaction t ORDER BY t.date DESC")
    List<Transaction> findAllTransactions();

    @Query(value = "SELECT 1", nativeQuery = true)
    Integer testConnection();

    // Reconciliation-specific queries with proper filtering
    @Query("SELECT t FROM Transaction t WHERE t.clientName = :clientName AND t.status = 'COMPLETED' AND DATE(t.date) BETWEEN :fromDate AND :toDate ORDER BY t.date")
    List<Transaction> findTransactionsForReconciliation(@Param("clientName") String clientName, @Param("fromDate") LocalDate fromDate, @Param("toDate") LocalDate toDate);

    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.clientName = :clientName AND t.type = :type AND t.status = 'COMPLETED' AND DATE(t.date) BETWEEN :fromDate AND :toDate")
    Double getTotalAmountForReconciliation(@Param("clientName") String clientName, @Param("type") Transaction.Type type, @Param("fromDate") LocalDate fromDate, @Param("toDate") LocalDate toDate);
}
