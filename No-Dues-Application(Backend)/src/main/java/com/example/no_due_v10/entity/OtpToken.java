package com.example.no_due_v10.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Persists OTP tokens in the shared MySQL database so that all backend
 * pods/instances see the same OTP regardless of which pod handled the
 * forgot-password request.
 */
@Entity
@Table(name = "otp_tokens", indexes = {
        @Index(name = "idx_otp_email", columnList = "email")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OtpToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false, length = 6)
    private String otp;

    @Column(nullable = false)
    private LocalDateTime expiresAt;
}
