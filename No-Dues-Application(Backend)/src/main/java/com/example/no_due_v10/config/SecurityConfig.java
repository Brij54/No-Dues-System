package com.example.no_due_v10.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.DefaultOAuth2AuthenticatedPrincipal;
import org.springframework.security.oauth2.core.OAuth2AuthenticatedPrincipal;
import org.springframework.security.oauth2.server.resource.introspection.NimbusOpaqueTokenIntrospector;
import org.springframework.security.oauth2.server.resource.introspection.OpaqueTokenIntrospector;
import org.springframework.security.web.SecurityFilterChain;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Value("${" + "spring.security.oauth2.resourceserver.opaquetoken.introspection-uri}")
    private String introspectionUri;

    @Value("${" + "spring.security.oauth2.resourceserver.opaquetoken.client-id}")
    private String clientId;

    @Value("${" + "spring.security.oauth2.resourceserver.opaquetoken.client-secret}")
    private String clientSecret;

    /**
     * Main security filter chain.
     *  - /auth/register and /auth/login are open (no token required)
     *  - Everything else requires a valid Keycloak Token
     *  - Session is STATELESS — no server-side session, safe for REST APIs
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authorizeHttpRequests(authorize -> authorize
                .requestMatchers("/auth/register", "/auth/login", "/auth/assign-role","/auth/register","/auth/forgot-password", "/auth/reset-password", "/api/payments/initiate/**", "/api/payments/status/**", "/api/webhook/**").permitAll()
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .opaqueToken(opaque -> opaque
                    .introspectionUri(introspectionUri)
                    .introspectionClientCredentials(clientId, clientSecret)
                    .introspector(customOpaqueTokenIntrospector())
                )
            );

        return http.build();
    }

    /**
     * Custom Introspector that extracts Keycloak realm-level roles and maps
     * them into Spring Security GrantedAuthority objects (e.g., ROLE_ADMIN).
     */
    @Bean
    public OpaqueTokenIntrospector customOpaqueTokenIntrospector() {
        return new OpaqueTokenIntrospector() {
            private final OpaqueTokenIntrospector delegate =
                    new NimbusOpaqueTokenIntrospector(introspectionUri, clientId, clientSecret);

          @Override
          public OAuth2AuthenticatedPrincipal introspect(String token) {

              OAuth2AuthenticatedPrincipal principal = delegate.introspect(token);

              // Extract client roles from resource_access
              Map<String, Object> resourceAccess =
                      principal.getAttribute("resource_access");

              List<String> clientRoles = Collections.emptyList();

              if (resourceAccess != null && resourceAccess.containsKey(clientId)) {

                  Map<String, Object> client =
                          (Map<String, Object>) resourceAccess.get(clientId);

                  if (client.containsKey("roles")) {
                      clientRoles = (List<String>) client.get("roles");
                  }
              }

              Collection<GrantedAuthority> authorities =
                      clientRoles.stream()
                              .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                              .collect(Collectors.toList());

              return new DefaultOAuth2AuthenticatedPrincipal(
                      principal.getName(),
                      principal.getAttributes(),
                      authorities
              );
          }
        };
    }
}
