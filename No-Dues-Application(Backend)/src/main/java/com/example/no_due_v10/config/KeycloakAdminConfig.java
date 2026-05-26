package com.example.no_due_v10.config;

import org.keycloak.OAuth2Constants;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class KeycloakAdminConfig {

    @Value("${keycloak.auth-server-url}")
    private String authServerUrl;

    @Value("${keycloak.realm}")
    private String realm;

    @Value("${keycloak.admin.client-id}")
    private String adminClientId;

    @Value("${keycloak.admin.client-secret}")
    private String adminClientSecret;

    @Bean
    public Keycloak keycloakAdminClient() {
        // Create custom JAX-RS client and register ContextResolver to ignore unrecognized properties
        javax.ws.rs.client.Client client = javax.ws.rs.client.ClientBuilder.newClient();
        client.register(new javax.ws.rs.ext.ContextResolver<com.fasterxml.jackson.databind.ObjectMapper>() {
            private final com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper()
                    .configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

            @Override
            public com.fasterxml.jackson.databind.ObjectMapper getContext(Class<?> type) {
                return mapper;
            }
        });

        return KeycloakBuilder.builder()
                .serverUrl(authServerUrl)
                .realm(realm)
                .grantType(OAuth2Constants.CLIENT_CREDENTIALS)
                .clientId(adminClientId)
                .clientSecret(adminClientSecret)
                .resteasyClient(client)
                .build();
    }
}
