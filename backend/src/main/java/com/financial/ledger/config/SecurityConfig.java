package com.financial.ledger.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
            // ✅ ENABLE CORS
            .cors()
            .and()

            // ❌ Disable CSRF for APIs
            .csrf().disable()

            .authorizeHttpRequests(auth -> auth
                // ✅ Public endpoints
                .requestMatchers(
                    "/api/auth/**",
                    "/manifest.json",
                    "/favicon.ico"
                ).permitAll()

                // 🔐 Everything else protected
                .anyRequest().authenticated()
            );

        return http.build();
    }
}
