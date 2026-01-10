package com.financial.ledger.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private CorsConfigurationSource corsConfigurationSource;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
            // ✅ ENABLE CORS with custom configuration
            .cors(cors -> cors.configurationSource(corsConfigurationSource))

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
