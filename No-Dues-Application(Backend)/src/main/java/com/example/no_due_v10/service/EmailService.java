package com.example.no_due_v10.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @org.springframework.beans.factory.annotation.Value("${spring.mail.username}")
    private String fromEmail;

    public void sendWelcomeEmail(String toEmail, String name, String password) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Welcome to No Dues Management System!");
            
            String body = String.format(
                "Hello %s,\n\n" +
                "Your account for the No Dues Management System has been created.\n\n" +
                "Your login credentials are as follows:\n" +
                "Username: %s\n" +
                "Temporary Password: %s\n\n" +
                "Please log in and you will be prompted to update this temporary password.\n\n" +
                "Best Regards,\n" +
                "No Dues Admin Team",
                name, toEmail, password
            );

            message.setText(body);
            mailSender.send(message);
            
            log.info("Welcome email sent successfully to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send welcome email to {}: {}", toEmail, e.getMessage());
            // We catch and log this so it doesn't rollback the entire transaction if SMTP fails
        }
    }

    public void sendOtpEmail(String toEmail, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Password Reset OTP - No Dues Management System");
            
            String body = String.format(
                "Hello,\n\n" +
                "We received a request to reset your password for the No Dues Management System.\n\n" +
                "Your One-Time Password (OTP) is: %s\n\n" +
                "This OTP is valid for 10 minutes.\n\n" +
                "If you did not request this, please ignore this email.\n\n" +
                "Best Regards,\n" +
                "No Dues Admin Team",
                otp
            );

            message.setText(body);
            mailSender.send(message);
            
            log.info("OTP email sent successfully to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send OTP email to {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Failed to send OTP email");
        }
    }

    public void sendPaymentConfirmationEmail(String toEmail, String studentName, Double amountPaid, String referenceNo, String paymentDateStr) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Payment Confirmation - No Dues Management System");
            
            String body = String.format(
                "Hello %s,\n\n" +
                "Thank you for your payment. Your transaction has been successfully processed.\n\n" +
                "Payment Details:\n" +
                "Amount Paid: Rs %.2f\n" +
                "Transaction Reference: %s\n" +
                "Payment Date: %s\n\n" +
                "Your student dashboard has been updated accordingly.\n\n" +
                "Best Regards,\n" +
                "No Dues Admin Team",
                studentName, amountPaid, referenceNo, paymentDateStr
            );

            message.setText(body);
            mailSender.send(message);
            
            log.info("Payment confirmation email sent successfully to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send payment confirmation email to {}: {}", toEmail, e.getMessage());
        }
    }
}
