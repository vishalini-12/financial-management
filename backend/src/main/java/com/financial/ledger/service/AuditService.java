package com.financial.ledger.service;

import com.financial.ledger.model.AuditLog;
import com.financial.ledger.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service
public class AuditService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    public void logAction(String action, Long userId, String details) {
        AuditLog auditLog = new AuditLog(action, LocalDateTime.now(), userId, details);
        auditLogRepository.save(auditLog);
    }
}
