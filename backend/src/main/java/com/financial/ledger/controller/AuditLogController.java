package com.financial.ledger.controller;

import com.financial.ledger.model.AuditLog;
import com.financial.ledger.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class AuditLogController {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @GetMapping("/audit-logs")
    public ResponseEntity<List<Map<String, Object>>> getAuditLogs() {
        List<AuditLog> auditLogs = auditLogRepository.findAll();
        List<Map<String, Object>> result = auditLogs.stream().map(log -> {
            Map<String, Object> auditLogMap = new java.util.HashMap<>();
            auditLogMap.put("id", log.getId());
            auditLogMap.put("timestamp", log.getTimestamp());
            auditLogMap.put("action", log.getAction());
            auditLogMap.put("module", extractModuleFromAction(log.getAction()));
            auditLogMap.put("description", log.getDetails() != null ? log.getDetails() : "");
            auditLogMap.put("status", determineStatus(log.getAction()));

            return auditLogMap;
        }).toList();

        return ResponseEntity.ok(result);
    }

    private String extractModuleFromAction(String action) {
        if (action == null) return "System";

        // Map actions to modules based on common patterns
        if (action.contains("LOGIN") || action.contains("LOGOUT") || action.contains("FAILED")) {
            return "Authentication";
        } else if (action.contains("TRANSACTION")) {
            return "Transactions";
        } else if (action.contains("RECONCILIATION")) {
            return "Reconciliation";
        } else if (action.contains("CSV") || action.contains("PDF") || action.contains("EXPORT") || action.contains("REPORT")) {
            return "Reports";
        } else if (action.contains("DASHBOARD")) {
            return "Dashboard";
        } else {
            return "System";
        }
    }

    private String determineStatus(String action) {
        if (action == null) return "SUCCESS";

        // Determine status based on action type
        if (action.contains("FAILED") || action.contains("ERROR")) {
            return "FAILED";
        } else {
            return "SUCCESS";
        }
    }
}