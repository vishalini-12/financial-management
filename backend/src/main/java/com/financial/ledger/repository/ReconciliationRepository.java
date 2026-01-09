package com.financial.ledger.repository;

import com.financial.ledger.model.Reconciliation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReconciliationRepository extends JpaRepository<Reconciliation, Long> {
}
