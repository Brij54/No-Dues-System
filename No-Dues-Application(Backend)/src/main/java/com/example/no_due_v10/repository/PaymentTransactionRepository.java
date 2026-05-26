package com.example.no_due_v10.repository;

import com.example.no_due_v10.entity.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, String> {
    PaymentTransaction findByGatewayOrderId(String gatewayOrderId);
    PaymentTransaction findByRazorpayPaymentId(String razorpayPaymentId);
}
