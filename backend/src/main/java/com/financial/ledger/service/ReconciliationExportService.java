package com.financial.ledger.service;

import com.financial.ledger.model.ReconciliationResult;
import org.springframework.stereotype.Service;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.time.format.DateTimeFormatter;

@Service
public class ReconciliationExportService {

    public void exportToCSV(ReconciliationResult result, HttpServletResponse response) throws IOException {
        response.setContentType("text/csv");
        response.setHeader("Content-Disposition", "attachment; filename=\"reconciliation_" +
            result.getClientName() + "_" + result.getGeneratedDateTime().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".csv\"");

        PrintWriter writer = response.getWriter();

        // Write CSV header - EXACT order as specified (removed Period From and Period To)
        writer.println("Client Name,Bank Name,Opening Balance,Total Credit,Total Debit,System Balance,Bank Balance,Difference,Status,Generated DateTime");

        // Write CSV data - use EXACT values from ReconciliationResult with proper column mapping
        writer.printf("%s,%s,%.2f,%.2f,%.2f,%.2f,%.2f,%.2f,%s,%s%n",
            escapeCSV(result.getClientName()),
            escapeCSV(result.getBankName()),
            result.getOpeningBalance(),
            result.getTotalCredit(),
            result.getTotalDebit(),
            result.getSystemBalance(),
            result.getBankBalance(),
            result.getDifference(),
            result.getMatchStatus(),
            result.getGeneratedDateTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
        );

        writer.flush();
    }

    public void exportToExcel(ReconciliationResult result, HttpServletResponse response) throws IOException {
        // For Excel, use tab-separated format with proper date formatting to prevent ####### display
        response.setContentType("application/vnd.ms-excel");
        response.setHeader("Content-Disposition", "attachment; filename=\"reconciliation_" +
            result.getClientName() + "_" + result.getGeneratedDateTime().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".xls\"");

        PrintWriter writer = response.getWriter();

        // Excel-compatible header - EXACT order as specified (removed Period From and Period To)
        writer.println("Client Name\tBank Name\tOpening Balance\tTotal Credit\tTotal Debit\tSystem Balance\tBank Balance\tDifference\tStatus\tGenerated DateTime");

        // Write data - use EXACT values from ReconciliationResult with proper column mapping
        // Format numeric values to 2 decimal places and dates properly for Excel
        writer.printf("%s\t%s\t%.2f\t%.2f\t%.2f\t%.2f\t%.2f\t%.2f\t%s\t%s%n",
            result.getClientName(),
            result.getBankName(),
            result.getOpeningBalance(),
            result.getTotalCredit(),
            result.getTotalDebit(),
            result.getSystemBalance(),
            result.getBankBalance(),
            result.getDifference(),
            result.getMatchStatus(),
            result.getGeneratedDateTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
        );

        writer.flush();
    }

    public void exportToPDF(ReconciliationResult result, HttpServletResponse response) throws IOException {
        response.setContentType("application/pdf");
        response.setHeader("Content-Disposition", "attachment; filename=\"reconciliation_" +
            result.getClientName() + "_" + result.getGeneratedDateTime().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".pdf\"");

        PrintWriter writer = response.getWriter();

        // Simple HTML to PDF content (in a real implementation, you'd use a PDF library like iText)
        writer.println("<html><head><title>Reconciliation Report</title></head><body>");
        writer.println("<h1>Client Reconciliation Report</h1>");

        writer.println("<table border='1' style='border-collapse: collapse;'>");
        writer.println("<tr><th>Field</th><th>Value</th></tr>");

        writer.printf("<tr><td>Client Name</td><td>%s</td></tr>%n", result.getClientName());
        writer.printf("<tr><td>Bank Name</td><td>%s</td></tr>%n", result.getBankName());
        writer.printf("<tr><td>Opening Balance</td><td>$%.2f</td></tr>%n", result.getOpeningBalance());
        writer.printf("<tr><td>Total Credit</td><td>$%.2f</td></tr>%n", result.getTotalCredit());
        writer.printf("<tr><td>Total Debit</td><td>$%.2f</td></tr>%n", result.getTotalDebit());
        writer.printf("<tr><td>System Balance</td><td>$%.2f</td></tr>%n", result.getSystemBalance());
        writer.printf("<tr><td>Bank Balance</td><td>$%.2f</td></tr>%n", result.getBankBalance());
        writer.printf("<tr><td>Difference</td><td>$%.2f</td></tr>%n", result.getDifference());
        writer.printf("<tr><td>Status</td><td>%s</td></tr>%n", result.getMatchStatus());
        writer.printf("<tr><td>Generated DateTime</td><td>%s</td></tr>%n",
            result.getGeneratedDateTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));

        writer.println("</table>");
        writer.println("</body></html>");

        writer.flush();
    }

    private String escapeCSV(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
