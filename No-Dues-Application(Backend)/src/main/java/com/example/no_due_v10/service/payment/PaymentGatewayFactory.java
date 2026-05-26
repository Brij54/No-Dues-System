package com.example.no_due_v10.service.payment;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class PaymentGatewayFactory {

    @Autowired
    private Map<String, PaymentProcessor> paymentProcessors;

    public PaymentProcessor getPaymentProcessor(String gateway) {
        if ("razorpay".equalsIgnoreCase(gateway)) {
            return paymentProcessors.get("razorpayGateway");
        }
        throw new IllegalArgumentException("Unsupported payment gateway: " + gateway);
    }
}
