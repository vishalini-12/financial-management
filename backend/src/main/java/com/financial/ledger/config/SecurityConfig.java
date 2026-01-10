package com.financial.ledger.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.http.SessionCreationPolicy;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
            // ✅ ENABLE CORS (do NOT disable it)
            .cors(cors -> {})

            // ✅ Disable CSRF for REST APIs
            .csrf(csrf -> csrf.disable())

            // ✅ Stateless session for JWT
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            // ✅ Authorization rules
            .authorizeHttpRequests(auth -> auth
                // ✅ Allow CORS preflight
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // ✅ Public endpoints
                .requestMatchers(
                    "/",
                    "/index.html",
                    "/manifest.json",
                    "/favicon.ico",
                    "/static/**",
                    "/api/auth/**",
                    "/actuator/health"
                ).permitAll()

                // 🔐 Secure everything else
                .anyRequest().authenticated()
            );

        return http.build();
    }
}
