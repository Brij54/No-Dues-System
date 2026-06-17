package com.example.no_due_v10.controller;

import com.example.no_due_v10.dto.payment.PaymentRequest;
import com.example.no_due_v10.dto.payment.PaymentResponse;
import com.example.no_due_v10.dto.payment.PaymentStatusResponse;
import com.example.no_due_v10.repository.PaymentRepository;
import com.example.no_due_v10.service.KeycloakAuthService;
import com.example.no_due_v10.service.payment.PaymentGatewayService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.List;
import java.util.Optional;
import com.example.no_due_v10.service.PaymentService;
import com.example.no_due_v10.exception.BadRequestException;
import org.springframework.security.access.prepost.PreAuthorize;
import java.util.Map;
import java.security.Principal;
import org.springframework.web.bind.annotation.*;
import com.example.no_due_v10.entity.*;
import com.example.no_due_v10.dto.*;

@RestController()
@RequestMapping(value = "/api/payments")
public class PaymentController {

    @Autowired
    private PaymentGatewayService paymentGatewayService;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private KeycloakAuthService keycloakAuthService;

    @Value("${razorpay.key}")
    private String razorpayKey;

    @Autowired()
    private PaymentService paymentService;

    @PostMapping()
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Payment> createPayment(@RequestBody Payment entity) {
        return ResponseEntity.ok(paymentService.createPayment(entity));
    }

    @GetMapping()
    @PreAuthorize("hasAnyRole('SUPERADMIN','DEPARTMENTADMIN','STUDENT')")
    public ResponseEntity<List<Payment>> getAllPayments(Principal principal) {
        return ResponseEntity.ok(paymentService.getAllPayments(principal));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN','DEPARTMENTADMIN','STUDENT')")
    public ResponseEntity<Payment> getPaymentById(@PathVariable String id) {
        return paymentService.getPaymentById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<Payment> updatePayment(@PathVariable String id, @RequestBody Payment entity) {
        Payment updated = paymentService.updatePayment(id, entity);
        if (updated != null)
            return ResponseEntity.ok(updated);
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<Void> deletePayment(@PathVariable String id) {
        paymentService.deletePayment(id);
        return ResponseEntity.noContent().build();
    }

    /*
 * Operation    : Create Payment Record
 * Comment      : Endpoint for a student to submit a new payment record.
 */
    @PostMapping(value = "/create")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Payment> createPaymentRecord(@RequestBody CreatePaymentRequest request, Principal principal) {
        return ResponseEntity.ok(paymentService.createPaymentRecord(request, principal));
    }

    /*
 * Operation    : Verify and Process Payment
 * Comment      : Endpoint to verify a payment against the student's pending dues and update statuses accordingly. Accessible by SuperAdmin and DepartmentAdmin.
 */
    @PutMapping(value = "/{paymentId}/verify/{studentId}")
    @PreAuthorize("hasAnyRole('SUPERADMIN','DEPARTMENTADMIN')")
    public ResponseEntity<Payment> verifyAndProcessPayment(@PathVariable String paymentId, @PathVariable String studentId) {
        return ResponseEntity.ok(paymentService.verifyAndProcessPayment(paymentId, studentId));
    }

    /*
 * Operation    : Get Payments By Student
 * Comment      : SuperAdmin endpoint to retrieve all payment records for a specific student by their ID
 */
    @GetMapping(value = "/admin/students/{studentId}/payments")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<List<Payment>> getPaymentsByStudent(@PathVariable String studentId) {
        return ResponseEntity.ok(paymentService.getPaymentsByStudent(studentId));
    }

    /*
 * Operation    : Initiate Razorpay Payment
 * Comment      : Creates a Razorpay order for the authenticated student and returns checkout details.
 */
    @PostMapping(value = "/initiate/razorpay")
    public ResponseEntity<PaymentResponse> initiateRazorpayPayment(
            Principal principal,
            @RequestBody PaymentRequest request) {
        try {
            String studentId = keycloakAuthService.getUserId(principal);
            Payment payment = paymentGatewayService.initiatePayment(studentId, request.getAmount(), "razorpay");

            PaymentResponse response = PaymentResponse.builder()
                    .key(razorpayKey)
                    .gatewayOrderId(payment.getTransactionId())
                    .amount(payment.getAmountPaid())
                    .internalOrderId(payment.getId())
                    .build();

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(null);
        }
    }

    /*
 * Operation    : Get Payment Status
 * Comment      : Retrieves the current payment status for a given internal order ID.
 */
    @GetMapping(value = "/status/{orderId}")
    public ResponseEntity<PaymentStatusResponse> getPaymentStatus(@PathVariable String orderId) {
        Payment payment = paymentRepository.findById(orderId).orElse(null);
        if (payment == null) {
            return ResponseEntity.notFound().build();
        }
        
        // Self-healing: if the payment is not SUCCESS, sync status directly from the gateway
        if (!"SUCCESS".equals(payment.getPaymentStatus()) && payment.getTransactionId() != null) {
            paymentGatewayService.syncPaymentStatus(payment);
            // Reload updated payment details from DB
            payment = paymentRepository.findById(orderId).orElse(payment);
        }
        
        return ResponseEntity.ok(PaymentStatusResponse.builder().status(payment.getPaymentStatus()).build());
    }
}
