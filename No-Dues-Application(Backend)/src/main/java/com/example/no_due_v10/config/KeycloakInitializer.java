package com.example.no_due_v10.config;

import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.ClientResource;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.RolesResource;
import org.keycloak.representations.idm.ClientRepresentation;
import org.keycloak.representations.idm.ProtocolMapperRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import lombok.extern.slf4j.Slf4j;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;


@Slf4j
@Configuration
public class KeycloakInitializer implements CommandLineRunner {

    private final Keycloak keycloakAdmin;

   @Value("${keycloak.realm}")
   private String realm;

   @Value("${keycloak.default-role}")
   private String keycloakDefaultRole;

   @Value("${keycloak.admin.client-id}")
   private String adminClientId;

    /**
     * Roles are read from application.yml at runtime (keycloak.roles).
     * The SpEL expression splits the comma-separated string into a List.
     * Example YAML:  keycloak.roles: ADMIN,DOCTOR,RECEPTIONIST
     */
    @Value("#{'${keycloak.roles}'.split(',')}")
    private List<String> roles;

    public KeycloakInitializer(Keycloak keycloakAdmin) {
        this.keycloakAdmin = keycloakAdmin;
    }

    @Override
    public void run(String... args) {
        try {
            RealmResource realmResource = keycloakAdmin.realm(realm);

            // Find client
            List<ClientRepresentation> clients =
                realmResource.clients().findByClientId(adminClientId);

            if (clients.isEmpty()) {
                throw new RuntimeException("Client not found: " + adminClientId);
            }

            // Internal UUID
            String clientUuid = clients.get(0).getId();

            // Client resource
            ClientResource clientResource =
                realmResource.clients().get(clientUuid);

            // Client roles resource
            RolesResource rolesResource = clientResource.roles();

            List<String> existingRoles = rolesResource.list().stream()
                .map(RoleRepresentation::getName)
                .toList();

            // Create roles read from application.yml (keycloak.roles)
            for (String role : roles) {
                createRoleIfNotExists(rolesResource, existingRoles, role);
            }



            // Create custom_id protocol mapper on the client
            createCustomIdProtocolMapper(clientResource);

            // Set default role for the realm
            try {
                RoleRepresentation defaultRole =
                    rolesResource.get(keycloakDefaultRole).toRepresentation();
                realmResource.roles()
                    .get("default-roles-" + realm.toLowerCase())
                    .addComposites(List.of(defaultRole));
                log.info("Set default realm role: {}", keycloakDefaultRole);
            } catch (Exception e) {
                log.warn("Could not set default role '{}': {}", keycloakDefaultRole, e.getMessage());
            }

            log.info("Keycloak role initialization complete.");
        } catch (Exception e) {
            log.error("Failed to initialize Keycloak roles. Ensure Keycloak is running and admin credentials are correct.", e);
        }
    }

    // -------------------------------------------------------------------------
    // ROLE HELPERS
    // -------------------------------------------------------------------------

    private void createRoleIfNotExists(
        RolesResource rolesResource,
        List<String> existingRoles,
        String roleName
    ) {
        if (!existingRoles.contains(roleName)) {
            RoleRepresentation role = new RoleRepresentation();
            role.setName(roleName);
            role.setDescription("Client Role: " + roleName);
            rolesResource.create(role);
            log.info("Created client role: {}", roleName);
        } else {
            log.info("Client role already exists: {}", roleName);
        }
    }



    // -------------------------------------------------------------------------
    // PROTOCOL MAPPER – custom_id claim in tokens
    // -------------------------------------------------------------------------

    /**
     * Creates an OIDC protocol mapper on the client so the {@code custom_id}
     * user attribute is included in access tokens, ID tokens and userinfo
     * responses.
     *
     * <p>Step 2 of 2 for {@code custom_id} support.
     */
    private void createCustomIdProtocolMapper(ClientResource clientResource) {
        try {
            List<ProtocolMapperRepresentation> existing =
                clientResource.getProtocolMappers().getMappers();

            boolean exists = existing.stream()
                .anyMatch(m -> "custom_id".equals(m.getName()));

            if (!exists) {
                ProtocolMapperRepresentation mapper = new ProtocolMapperRepresentation();
                mapper.setName("custom_id");
                mapper.setProtocol("openid-connect");
                mapper.setProtocolMapper("oidc-usermodel-attribute-mapper");

                Map<String, String> config = new HashMap<>();
                config.put("user.attribute",       "custom_id");
                config.put("claim.name",            "custom_id");
                config.put("jsonType.label",        "String");
                config.put("id.token.claim",        "true");
                config.put("access.token.claim",    "true");
                config.put("userinfo.token.claim",  "true");
                mapper.setConfig(config);

                clientResource.getProtocolMappers().createMapper(mapper);
                log.info("Created protocol mapper for 'custom_id'.");
            } else {
                log.info("Protocol mapper 'custom_id' already exists.");
            }
        } catch (Exception e) {
            log.warn("Could not create protocol mapper for 'custom_id': {}", e.getMessage());
        }
    }
}
