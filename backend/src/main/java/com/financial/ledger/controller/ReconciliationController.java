package com.financial.ledger.controller;

import com.financial.ledger.model.Reconciliation;
import com.financial.ledger.repository.ReconciliationRepository;
import com.financial.ledger.service.ReconciliationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/reconciliation")
public class ReconciliationController {

    @Autowired
    private ReconciliationService reconciliationService;

    @Autowired
    private ReconciliationRepository reconciliationRepository;

    @PostMapping("/calculate")
    public ResponseEntity<?> calculateReconciliation(@RequestBody Map<String, Object> request) {
        try {
            System.out.println("=== RECONCILIATION CALCULATE REQUEST RECEIVED ===");
            System.out.println("Request data: " + request);

            // Extract and validate inputs
            String clientName = (String) request.get("clientName");
            String bankName = (String) request.get("bankName");
            String fromDateStr = (String) request.get("fromDate");
            String toDateStr = (String) request.get("toDate");
            Double openingBalance = Double.valueOf(request.get("openingBalance").toString());
            Double bankBalance = Double.valueOf(request.get("bankBalance").toString());

            System.out.println("Client Name: " + clientName);
            System.out.println("Bank Name: " + bankName);
            System.out.println("From Date: " + fromDateStr);
            System.out.println("To Date: " + toDateStr);
            System.out.println("Opening Balance: " + openingBalance);
            System.out.println("Bank Balance: " + bankBalance);

            // Validate required fields
            if (clientName == null || clientName.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Client name is required"
                ));
            }

            if (bankName == null || bankName.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Bank name is required"
                ));
            }

            if (fromDateStr == null || fromDateStr.trim().isEmpty() ||
                toDateStr == null || toDateStr.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "From date and to date are required"
                ));
            }

            LocalDate fromDate = LocalDate.parse(fromDateStr.trim());
            LocalDate toDate = LocalDate.parse(toDateStr.trim());

            if (fromDate.isAfter(toDate)) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "From date cannot be after to date"
                ));
            }

            // STEP 1: Calculate reconciliation using the service
            Map<String, Object> calculationResults = reconciliationService.calculateReconciliation(
                clientName, bankName, fromDate, toDate, openingBalance, bankBalance);

            // STEP 2: Validate calculations (optional debugging)
            boolean validationPassed = reconciliationService.validateReconciliation(calculationResults);
            if (!validationPassed) {
                System.out.println("⚠️ WARNING: Reconciliation calculation validation failed!");
            }

            // STEP 3: Save reconciliation record
            Reconciliation savedReconciliation = reconciliationService.saveReconciliation(calculationResults);

            // STEP 4: Return response
            Map<String, Object> response = new HashMap<>();
            response.put("reconciliationId", savedReconciliation.getId());
            response.put("clientName", calculationResults.get("clientName"));
            response.put("bankName", calculationResults.get("bankName"));
            response.put("totalCredit", calculationResults.get("totalCredit"));
            response.put("totalDebit", calculationResults.get("totalDebit"));
            response.put("systemBalance", calculationResults.get("systemBalance"));
            response.put("bankBalance", calculationResults.get("bankBalance"));
            response.put("difference", calculationResults.get("difference"));
            response.put("status", calculationResults.get("status"));

            System.out.println("=== RECONCILIATION CALCULATION COMPLETED SUCCESSFULLY ===");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("Error calculating reconciliation: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Failed to calculate reconciliation: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getReconciliationById(@PathVariable Long id) {
        try {
            System.out.println("=== GET RECONCILIATION BY ID REQUEST RECEIVED ===");
            System.out.println("Reconciliation ID: " + id);

            var reconciliationOpt = reconciliationRepository.findById(id);
            if (reconciliationOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Reconciliation reconciliation = reconciliationOpt.get();

            // Return reconciliation data
            Map<String, Object> response = new HashMap<>();
            response.put("id", reconciliation.getId());
            response.put("clientName", reconciliation.getClientName());
            response.put("bankName", reconciliation.getBankName());
            response.put("fromDate", reconciliation.getFromDate().toString());
            response.put("toDate", reconciliation.getToDate().toString());
            response.put("openingBalance", reconciliation.getOpeningBalance());
            response.put("bankBalance", reconciliation.getBankBalance());
            response.put("totalCredit", reconciliation.getTotalCredit());
            response.put("totalDebit", reconciliation.getTotalDebit());
            response.put("systemBalance", reconciliation.getSystemBalance());
            response.put("difference", reconciliation.getDifference());
            response.put("status", reconciliation.getStatus());
            response.put("createdAt", reconciliation.getCreatedAt().toString());

        return ResponseEntity.ok(response);

    } catch (Exception e) {
        System.err.println("Error retrieving reconciliation: " + e.getMessage());
        e.printStackTrace();
        return ResponseEntity.badRequest().body(Map.of(
            "success", false,
            "message", "Failed to retrieve reconciliation: " + e.getMessage()
        ));
    }
    }

    @GetMapping
public ResponseEntity<List<Map<String, Object>>> getAllReconciliations() {
    try {
        List<Reconciliation> reconciliations = reconciliationRepository.findAll();

        List<Map<String, Object>> result = reconciliations.stream()
            .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt())) // Most recent first
            .map(reconciliation -> {
                Map<String, Object> reconciliationMap = new HashMap<>();
                reconciliationMap.put("id", reconciliation.getId());
                reconciliationMap.put("clientName", reconciliation.getClientName());
                reconciliationMap.put("bankName", reconciliation.getBankName());
                reconciliationMap.put("fromDate", reconciliation.getFromDate().toString());
                reconciliationMap.put("toDate", reconciliation.getToDate().toString());
                reconciliationMap.put("openingBalance", reconciliation.getOpeningBalance());
                reconciliationMap.put("bankBalance", reconciliation.getBankBalance());
                reconciliationMap.put("totalCredit", reconciliation.getTotalCredit());
                reconciliationMap.put("totalDebit", reconciliation.getTotalDebit());
                reconciliationMap.put("systemBalance", reconciliation.getSystemBalance());
                reconciliationMap.put("difference", reconciliation.getDifference());
                reconciliationMap.put("status", reconciliation.getStatus());
                reconciliationMap.put("createdAt", reconciliation.getCreatedAt().toString());

                return reconciliationMap;
            })
            .toList();

        return ResponseEntity.ok(result);

    } catch (Exception e) {
        System.err.println("Error retrieving reconciliations: " + e.getMessage());
        e.printStackTrace();
        return ResponseEntity.badRequest().body(List.of());
    }
}
}
