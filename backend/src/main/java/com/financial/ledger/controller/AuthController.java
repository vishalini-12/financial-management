package com.financial.ledger.controller;

import com.financial.ledger.config.JwtUtil;
import com.financial.ledger.model.User;
import com.financial.ledger.repository.UserRepository;
import com.financial.ledger.service.AuditService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private AuditService auditService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");

        User user = userRepository.findByUsername(username).orElse(null);
        if (user != null && passwordEncoder.matches(password, user.getPassword())) {
            // AUDIT LOG: Successful login
            auditService.logAction("USER_LOGIN", user.getId(),
                String.format("User logged in: %s (%s)", user.getUsername(), user.getRole()));

            String token = jwtUtil.generateToken(username, user.getRole().name());
            return ResponseEntity.ok(Map.of("token", token, "role", user.getRole().name()));
        } else {
            // AUDIT LOG: Failed login attempt
            auditService.logAction("LOGIN_FAILED", null,
                String.format("Failed login attempt for username: %s", username));
        }
        return ResponseEntity.badRequest().body("Invalid credentials");
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody User user) {
        System.out.println("=== REGISTER API HIT ===");
        System.out.println("Username: " + user.getUsername());
        System.out.println("Email: " + user.getEmail());
        System.out.println("Role: " + user.getRole());

        // Check if username already exists
        User existingUser = userRepository.findByUsername(user.getUsername()).orElse(null);
        if (existingUser != null) {
            System.out.println("❌ ERROR: Username already exists: " + user.getUsername());
            return ResponseEntity.badRequest().body("Username already exists");
        }

        System.out.println("Password length before encoding: " + user.getPassword().length());

        try {
            System.out.println("Encoding password...");
            String encodedPassword = passwordEncoder.encode(user.getPassword());
            user.setPassword(encodedPassword);
            System.out.println("Password encoded successfully");

            System.out.println("Calling userRepository.save()...");
            User savedUser = userRepository.save(user);
            System.out.println("User saved with ID: " + savedUser.getId());
            System.out.println("Username saved: " + savedUser.getUsername());

            System.out.println("✅ VERIFICATION: User saved successfully");
            System.out.println("=== REGISTER SUCCESS ===");
            return ResponseEntity.ok("User registered");
        } catch (Exception e) {
            System.err.println("=== REGISTER FAILED ===");
            System.err.println("Unexpected error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Registration failed: " + e.getMessage());
        }
    }
}
