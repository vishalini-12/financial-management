package com.financial.ledger.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.concurrent.TimeUnit;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${cors.allowed-origins}")
    private String allowedOrigins;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
            // ✅ Enable CORS using the dedicated CorsConfigurationSource bean
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // ✅ Disable CSRF for stateless REST APIs
            .csrf(csrf -> csrf.disable())

            // ✅ Stateless session policy for JWT
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            // ✅ Authorization rules with explicit OPTIONS permission
            .authorizeHttpRequests(auth -> auth
                // Explicitly permit OPTIONS for all paths (preflight requests)
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // Permit public access to specified paths
                .requestMatchers(
                    "/",                     // React root
                    "/index.html",           // SPA entry
                    "/manifest.json",        // PWA manifest
                    "/favicon.ico",          // Favicon
                    "/static/**",            // Static assets
                    "/api/auth/**",          // Login / Register endpoints
                    "/actuator/health"       // Railway health check
                ).permitAll()
                .anyRequest().authenticated()
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // ✅ Allow origins from cors.allowed-origins property (no wildcards, no preview URLs)
        configuration.setAllowedOrigins(Arrays.asList(allowedOrigins.split(",")));

        // ✅ Allow HTTP methods including OPTIONS for preflight
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));

        // ✅ Allow all headers (*)
        configuration.setAllowedHeaders(Arrays.asList("*"));

        // ✅ Allow credentials for cookies/auth headers
        configuration.setAllowCredentials(true);

        // ✅ Expose Authorization header to frontend
        configuration.setExposedHeaders(Arrays.asList("Authorization"));

        // ✅ Set preflight cache time (1 hour)
        configuration.setMaxAge(TimeUnit.HOURS.toSeconds(1));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}
