package com.example.no_due_v10.service;

import com.example.no_due_v10.entity.OtpToken;
import com.example.no_due_v10.repository.OtpTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

/**
 * Database-backed OTP service.
 *
 * OTPs are persisted in the shared MySQL database so every backend pod
 * sees the same token regardless of which instance handled the
 * forgot-password request. This replaces the previous in-memory
 * ConcurrentHashMap approach which failed under multi-instance deployments.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OtpService {

    private final OtpTokenRepository otpTokenRepository;
    private final Random random = new Random();

    /**
     * Generates and persists a 6-digit OTP for the given email.
     * Any previous OTPs for that email are replaced.
     */
    @Transactional
    public String generateOtp(String email) {
        // Remove any existing OTPs for this email so only one is valid at a time
        otpTokenRepository.deleteAllByEmail(email);

        String otp = String.format("%06d", random.nextInt(1_000_000));

        OtpToken token = OtpToken.builder()
                .email(email)
                .otp(otp)
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .build();

        otpTokenRepository.save(token);
        log.info("OTP generated and persisted for email: {}", email);
        return otp;
    }

    /**
     * Validates the OTP for the given email.
     * Returns true only if the OTP exists, matches, and has not expired.
     * Deletes the OTP from the database after a successful validation
     * so it cannot be reused.
     */
    @Transactional
    public boolean validateOtp(String email, String otp) {
        Optional<OtpToken> optionalToken = otpTokenRepository.findTopByEmailOrderByExpiresAtDesc(email);

        if (optionalToken.isEmpty()) {
            log.warn("No OTP found in DB for email: {}", email);
            return false;
        }

        OtpToken token = optionalToken.get();

        if (LocalDateTime.now().isAfter(token.getExpiresAt())) {
            log.warn("OTP expired for email: {}", email);
            otpTokenRepository.deleteAllByEmail(email);
            return false;
        }

        if (!token.getOtp().equals(otp)) {
            log.warn("OTP mismatch for email: {}", email);
            return false;
        }

        // Valid — consume it so it can't be reused
        otpTokenRepository.deleteAllByEmail(email);
        log.info("OTP validated and consumed for email: {}", email);
        return true;
    }

    /**
     * Scheduled cleanup: purge expired OTP rows every 30 minutes.
     * Keeps the otp_tokens table lean.
     */
    @Scheduled(fixedDelay = 30 * 60 * 1000)
    @Transactional
    public void purgeExpiredOtps() {
        otpTokenRepository.deleteExpired(LocalDateTime.now());
        log.debug("Purged expired OTP records from database");
    }
}
