package com.example.no_due_v10.controller;

import com.example.no_due_v10.dto.KeycloakAuthResponse;
import com.example.no_due_v10.dto.LoginUserDto;
import com.example.no_due_v10.dto.RegisterUserDto;
import com.example.no_due_v10.dto.UserResource;
import com.example.no_due_v10.service.EmailService;
import com.example.no_due_v10.service.KeycloakAuthService;
import com.example.no_due_v10.service.OtpService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RestController;


import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final KeycloakAuthService keycloakAuthService;
    private final OtpService otpService;
    private final EmailService emailService;

    /**
     * Registers a new user in Keycloak, stores the Keycloak user ID in the local
     * database, and returns an access token for immediate use.
     *
     * POST /auth/register
     *Add user (/add-user) - user added by admin
     */
    @PreAuthorize("hasRole('SUPERADMIN')")
    @PostMapping("/add_user")
     public ResponseEntity<String> addUser(@RequestBody UserResource userResource) {
            String result = keycloakAuthService.addUser(userResource);
            if ("User already exists".equals(result)) {
                return ResponseEntity.status(409).body(result);
            }
            return ResponseEntity.ok(result);
        }

    @PreAuthorize("hasRole('SUPERADMIN')")
    @PostMapping("/add_users")
    public ResponseEntity<List<String>> addUsers(@RequestBody List<UserResource> userResources) {
        List<String> results =
                keycloakAuthService.addUsers(userResources);

        boolean hasFailure = results.stream()
                .anyMatch(r ->
                        r.contains("Failed")
                                || r.contains("already exists"));

        if (hasFailure) {

            return ResponseEntity.status(HttpStatus.MULTI_STATUS)
                    .body(results);
        }

        return ResponseEntity.ok(results);
    }

    /**
     * Dynamically adds a new resource entity to the database and creates a corresponding
     * user in Keycloak with the entity ID as a custom attribute.
     *
     * POST /auth/register
     *User self register (/register)
     */
    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody UserResource userResource) {
        String result = keycloakAuthService.register(userResource);
        if ("User already exists".equals(result)) {
            return ResponseEntity.status(409).body(result);
        }
        return ResponseEntity.ok(result);
    }

    /**
     * Authenticates the user against Keycloak via the ROPC grant and returns
     * an access token + refresh token.
     *
     * POST /auth/login
     */
    @PostMapping("/login")
    public ResponseEntity<KeycloakAuthResponse> login(@RequestBody LoginUserDto loginUserDto) {
        KeycloakAuthResponse response = keycloakAuthService.login(loginUserDto);
        return ResponseEntity.ok(response);
    }

    /**
     * Revokes the current session/token in Keycloak.
     *
     * POST /auth/logout
     * Header: Authorization: Bearer <token>
     */
    @PostMapping("/logout")
    public ResponseEntity<String> logout(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        keycloakAuthService.logout(authHeader);
        return ResponseEntity.ok("Logged out successfully.");
    }

    /**
     * Assigns a Keycloak realm role to the user identified by email.
     *
     * POST /auth/assign-role
     * Body: { "email": "user@example.com", "roleName": "ADMIN" }
     */
    @PreAuthorize("hasRole('SUPERADMIN')")
    @PostMapping("/assign-role-by-admin")
    public ResponseEntity<String> assignRoleByAdmin(@RequestBody Map<String, String> body) {
        String userName    = body.get("userName");
        String roleName = body.get("roleName");
        keycloakAuthService.assignClientRole(userName, roleName);
        return ResponseEntity.ok("Role '" + roleName + "' assigned to user '" + userName + "' successfully.");
    }

    @PostMapping("/assign-role")
    public ResponseEntity<String> assignRole(@RequestBody Map<String, String> body) {
        String userName    = body.get("userName");
        String roleName = body.get("roleName");
        keycloakAuthService.assignClientRole(userName, roleName);
        return ResponseEntity.ok("Role '" + roleName + "' assigned to user '" + userName + "' successfully.");
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body("Email is required");
        }

        String otp = otpService.generateOtp(email);
        emailService.sendOtpEmail(email, otp);
        return ResponseEntity.ok("OTP sent to email successfully");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String otp = body.get("otp");
        String newPassword = body.get("newPassword");

        if (email == null || otp == null || newPassword == null) {
            return ResponseEntity.badRequest().body("Email, OTP, and newPassword are required");
        }

        boolean isValid = otpService.validateOtp(email, otp);
        if (!isValid) {
            return ResponseEntity.status(400).body("Invalid or expired OTP");
        }

        try {
            keycloakAuthService.resetUserPassword(email, newPassword);
            return ResponseEntity.ok("Password reset successfully");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to reset password: " + e.getMessage());
        }
    }
}
