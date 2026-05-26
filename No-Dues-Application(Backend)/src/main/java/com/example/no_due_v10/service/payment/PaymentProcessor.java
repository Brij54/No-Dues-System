package com.example.no_due_v10.service.payment;

public interface PaymentProcessor {
    String createOrder(Double amount, String internalOrderId) throws Exception;
    void processWebhook(String payload, String signature) throws Exception;
    String getStatus(String gatewayOrderId) throws Exception;
}
