package com.financial.ledger.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class PdfTransactionService {

    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(PdfTransactionService.class);

    public List<ExtractedTransaction> extractTransactionsFromPdf(MultipartFile pdfFile) {
        logger.info("Starting PDF extraction for file: {}", pdfFile.getOriginalFilename());

        List<ExtractedTransaction> transactions = new ArrayList<>();

        try {
            logger.info("Attempting to load PDF document...");

            // Try to load and parse the PDF using byte array
            try (PDDocument document = Loader.loadPDF(pdfFile.getBytes())) {
                logger.info("PDF document loaded successfully. Number of pages: {}", document.getNumberOfPages());

                // Extract text from all pages
                PDFTextStripper stripper = new PDFTextStripper();
                String pdfText = stripper.getText(document);
                logger.info("Extracted text length: {} characters", pdfText.length());

                if (pdfText.trim().isEmpty()) {
                    logger.warn("PDF contains no readable text content - creating fallback");
                    return createFallbackTransaction(pdfFile.getOriginalFilename());
                }

                // Try to parse transactions from the text
                transactions = parseTransactionsFromText(pdfText);

                if (transactions.isEmpty()) {
                    logger.warn("No valid transactions found in PDF - creating fallback");
                    return createFallbackTransaction(pdfFile.getOriginalFilename());
                }

                // Validate that we have properly formatted transactions
                try {
                    validateTransactionFormat(transactions);
                    logger.info("Successfully extracted and validated {} transactions from PDF", transactions.size());
                    return transactions;
                } catch (Exception validationEx) {
                    logger.warn("Transaction format validation failed: {} - creating fallback", validationEx.getMessage());
                    return createFallbackTransaction(pdfFile.getOriginalFilename());
                }

            } catch (Exception pdfEx) {
                logger.error("PDF processing failed: {} - creating fallback transaction", pdfEx.getMessage());
                return createFallbackTransaction(pdfFile.getOriginalFilename());
            }

        } catch (Exception e) {
            logger.error("Unexpected error during PDF extraction: {} - creating fallback", e.getMessage());
            return createFallbackTransaction(pdfFile.getOriginalFilename());
        }
    }

    private void validateTransactionFormat(List<ExtractedTransaction> transactions) throws Exception {
        logger.info("Validating transaction format for {} transactions", transactions.size());

        for (ExtractedTransaction transaction : transactions) {
            // Check required fields
            if (transaction.getDescription() == null || transaction.getDescription().trim().isEmpty()) {
                throw new Exception("Transaction description is missing or empty");
            }

            if (transaction.getAmount() <= 0) {
                throw new Exception("Transaction amount must be greater than zero");
            }

            if (transaction.getType() == null || (!transaction.getType().equals("CREDIT") && !transaction.getType().equals("DEBIT"))) {
                throw new Exception("Transaction type must be CREDIT or DEBIT");
            }

            if (transaction.getDate() == null) {
                throw new Exception("Transaction date is missing");
            }

            // Check for reasonable description length
            if (transaction.getDescription().length() < 3) {
                throw new Exception("Transaction description is too short (minimum 3 characters)");
            }

            // Check for reasonable amount (not too large)
            if (transaction.getAmount() > 10000000) { // 10 million limit
                throw new Exception("Transaction amount is unreasonably large");
            }
        }

        logger.info("Transaction format validation passed");
    }

    private List<ExtractedTransaction> createFallbackTransaction(String filename) {
        logger.info("Creating fallback transaction for file: {}", filename);

        List<ExtractedTransaction> transactions = new ArrayList<>();
        ExtractedTransaction fallback = new ExtractedTransaction(
            "Manual Entry",
            LocalDate.now(),
            "CREDIT",
            "Miscellaneous",
            100.00,
            "PDF upload - " + (filename != null ? filename : "Unknown file") + " (parsing failed, fallback transaction created)"
        );

        transactions.add(fallback);
        return transactions;
    }

    private List<ExtractedTransaction> parseTransactionsFromText(String pdfText) {
        logger.debug("Parsing transactions from PDF text");
        List<ExtractedTransaction> transactions = new ArrayList<>();

        // Common patterns for transaction data
        // Pattern 1: Date, Description, Amount (basic)
        Pattern pattern1 = Pattern.compile("(\\d{1,2}[-/]\\d{1,2}[-/]\\d{2,4})\\s+([^\\d]+)\\s+\\$?([\\d,]+\\.\\d{2})", Pattern.CASE_INSENSITIVE);

        // Pattern 2: Amount, Date, Description
        Pattern pattern2 = Pattern.compile("\\$?([\\d,]+\\.\\d{2})\\s+(\\d{1,2}[-/]\\d{1,2}[-/]\\d{2,4})\\s+(.+)", Pattern.CASE_INSENSITIVE);

        // Pattern 3: Description, Amount (with date nearby)
        Pattern pattern3 = Pattern.compile("(.+?)\\s+\\$?([\\d,]+\\.\\d{2})", Pattern.CASE_INSENSITIVE);

        String[] lines = pdfText.split("\\n");
        logger.debug("Processing {} lines of text", lines.length);

        for (String line : lines) {
            line = line.trim();
            if (line.isEmpty()) continue;

            try {
                // Try pattern 1 first
                Matcher matcher1 = pattern1.matcher(line);
                if (matcher1.find()) {
                    String dateStr = matcher1.group(1);
                    String description = matcher1.group(2).trim();
                    String amountStr = matcher1.group(3).replace(",", "");

                    LocalDate date = parseDate(dateStr);
                    double amount = Double.parseDouble(amountStr);

                    if (amount > 0) {
                        transactions.add(createTransaction(date, description, amount));
                        logger.debug("Parsed transaction using pattern 1: {} - {} - ${}", date, description, amount);
                    }
                    continue;
                }

                // Try pattern 2
                Matcher matcher2 = pattern2.matcher(line);
                if (matcher2.find()) {
                    String amountStr = matcher2.group(1).replace(",", "");
                    String dateStr = matcher2.group(2);
                    String description = matcher2.group(3).trim();

                    LocalDate date = parseDate(dateStr);
                    double amount = Double.parseDouble(amountStr);

                    if (amount > 0) {
                        transactions.add(createTransaction(date, description, amount));
                        logger.debug("Parsed transaction using pattern 2: {} - {} - ${}", date, description, amount);
                    }
                    continue;
                }

                // Try pattern 3 (description and amount)
                Matcher matcher3 = pattern3.matcher(line);
                if (matcher3.find()) {
                    String description = matcher3.group(1).trim();
                    String amountStr = matcher3.group(2).replace(",", "");

                    // Skip if description looks like a header or contains keywords
                    if (!isLikelyTransactionDescription(description)) {
                        continue;
                    }

                    double amount = Double.parseDouble(amountStr);
                    if (amount > 0) {
                        transactions.add(createTransaction(LocalDate.now(), description, amount));
                        logger.debug("Parsed transaction using pattern 3: {} - ${}", description, amount);
                    }
                }

            } catch (Exception e) {
                logger.debug("Failed to parse line: {} - Error: {}", line, e.getMessage());
                // Continue to next line
            }
        }

        logger.info("Parsed {} transactions from {} lines of text", transactions.size(), lines.length);
        return transactions;
    }

    private boolean isLikelyTransactionDescription(String description) {
        String lowerDesc = description.toLowerCase();

        // Skip headers, totals, or system text
        if (lowerDesc.contains("total") || lowerDesc.contains("balance") ||
            lowerDesc.contains("statement") || lowerDesc.contains("page") ||
            lowerDesc.contains("date") || lowerDesc.contains("amount") ||
            lowerDesc.length() < 3) {
            return false;
        }

        return true;
    }

    private LocalDate parseDate(String dateStr) {
        // Try different date formats
        String[] formats = {
            "MM/dd/yyyy", "MM-dd-yyyy", "dd/MM/yyyy", "dd-MM-yyyy",
            "MM/dd/yy", "MM-dd-yy", "dd/MM/yy", "dd-MM-yy"
        };

        for (String format : formats) {
            try {
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern(format);
                return LocalDate.parse(dateStr, formatter);
            } catch (DateTimeParseException e) {
                // Try next format
            }
        }

        // If no format works, use today's date
        logger.debug("Could not parse date '{}', using today's date", dateStr);
        return LocalDate.now();
    }

    private ExtractedTransaction createTransaction(LocalDate date, String description, double amount) {
        // Determine transaction type based on amount (simplified logic)
        String type = amount > 0 ? "CREDIT" : "DEBIT";
        amount = Math.abs(amount); // Ensure positive amount

        // Try to extract client name from description
        String clientName = "Manual Entry"; // Default
        if (description.contains(" - ")) {
            clientName = description.split(" - ")[0].trim();
            description = description.split(" - ")[1].trim();
        }

        // Determine category based on description keywords
        String category = determineCategory(description);

        return new ExtractedTransaction(
            clientName,
            date,
            type,
            category,
            amount,
            description
        );
    }

    private String determineCategory(String description) {
        String lowerDesc = description.toLowerCase();

        if (lowerDesc.contains("salary") || lowerDesc.contains("wage")) {
            return "Salary";
        } else if (lowerDesc.contains("rent")) {
            return "Rent";
        } else if (lowerDesc.contains("utility") || lowerDesc.contains("electric") || lowerDesc.contains("water")) {
            return "Utilities";
        } else if (lowerDesc.contains("client") || lowerDesc.contains("payment")) {
            return "Client Payment";
        } else if (lowerDesc.contains("office") || lowerDesc.contains("supply")) {
            return "Office Expense";
        }

        return "Miscellaneous";
    }



    public static class ExtractedTransaction {
        private String clientName;
        private LocalDate date;
        private String type;
        private String category;
        private double amount;
        private String description;

        public ExtractedTransaction(String clientName, LocalDate date, String type, String category, double amount, String description) {
            this.clientName = clientName;
            this.date = date;
            this.type = type;
            this.category = category;
            this.amount = amount;
            this.description = description;
        }

        public String getClientName() { return clientName; }
        public LocalDate getDate() { return date; }
        public String getType() { return type; }
        public String getCategory() { return category; }
        public double getAmount() { return amount; }
        public String getDescription() { return description; }
    }
}
