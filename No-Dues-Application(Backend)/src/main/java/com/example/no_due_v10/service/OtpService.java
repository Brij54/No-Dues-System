package com.example.no_due_v10.service;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    // Store OTP along with expiration time
    private final Map<String, OtpData> otpCache = new ConcurrentHashMap<>();
    private final Random random = new Random();

    public String generateOtp(String email) {
        // Generate a 6-digit OTP
        String otp = String.format("%06d", random.nextInt(1000000));
        
        // Expire in 10 minutes
        OtpData otpData = new OtpData(otp, LocalDateTime.now().plusMinutes(10));
        otpCache.put(email, otpData);
        
        return otp;
    }

    public boolean validateOtp(String email, String otp) {
        OtpData data = otpCache.get(email);
        if (data == null) {
            return false;
        }
        
        if (LocalDateTime.now().isAfter(data.expirationTime)) {
            otpCache.remove(email); // expired
            return false;
        }
        
        if (data.otp.equals(otp)) {
            otpCache.remove(email); // valid, remove it so it can't be reused
            return true;
        }
        
        return false;
    }

    private static class OtpData {
        String otp;
        LocalDateTime expirationTime;

        OtpData(String otp, LocalDateTime expirationTime) {
            this.otp = otp;
            this.expirationTime = expirationTime;
        }
    }
}
