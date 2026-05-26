package com.example.no_due_v10.controller;

import com.example.no_due_v10.entity.Payment;
import com.example.no_due_v10.entity.PaymentTransaction;
import com.example.no_due_v10.entity.Student;
import com.example.no_due_v10.entity.Due;
import com.example.no_due_v10.repository.PaymentRepository;
import com.example.no_due_v10.repository.PaymentTransactionRepository;
import com.example.no_due_v10.repository.StudentRepository;
import com.example.no_due_v10.repository.DueRepository;
import com.example.no_due_v10.service.payment.PaymentProcessor;
import com.example.no_due_v10.service.payment.PaymentGatewayFactory;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/webhook")
public class WebhookController {

    @Autowired
    private PaymentGatewayFactory paymentGatewayFactory;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private PaymentTransactionRepository paymentTransactionRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private DueRepository dueRepository;

    @Autowired
    private com.example.no_due_v10.service.PaymentService paymentService;

    @PostMapping("/razorpay")
    @Transactional
    public ResponseEntity<String> handleRazorpayWebhook(
            @RequestBody String payload,
            @RequestHeader("X-Razorpay-Signature") String signature) {

        try {
            PaymentProcessor processor = paymentGatewayFactory.getPaymentProcessor("razorpay");
            processor.processWebhook(payload, signature);

            JSONObject jsonPayload = new JSONObject(payload);
            String event = jsonPayload.getString("event");
            JSONObject paymentEntity = jsonPayload.getJSONObject("payload").getJSONObject("payment").getJSONObject("entity");

            String razorpayOrderId = paymentEntity.getString("order_id");
            String razorpayPaymentId = paymentEntity.getString("id");

            Payment payment = paymentRepository.findByTransactionId(razorpayOrderId)
                    .orElse(null);

            if (payment == null) {
                return ResponseEntity.ok().build(); // Acknowledge to prevent retries if order not found
            }

            PaymentTransaction transaction = new PaymentTransaction();
            transaction.setPayment(payment);
            transaction.setGatewayOrderId(razorpayOrderId);
            transaction.setRazorpayPaymentId(razorpayPaymentId);
            transaction.setWebhookPayload(payload);
            transaction.setWebhookSignature(signature);

            if ("payment.captured".equals(event)) {
                paymentService.processSuccessfulPayment(payment, razorpayPaymentId, paymentEntity.optString("method", ""));
                transaction.setTransactionStatus("SUCCESS");
            } else if ("payment.failed".equals(event)) {
                payment.setPaymentStatus("FAILED");
                transaction.setTransactionStatus("FAILED");
                transaction.setFailureReason(paymentEntity.optString("error_description", "Payment failed"));
            }

            paymentRepository.save(payment);
            paymentTransactionRepository.save(transaction);

            return ResponseEntity.ok().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}
