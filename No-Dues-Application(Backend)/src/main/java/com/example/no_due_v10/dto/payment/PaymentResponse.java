package com.example.no_due_v10.dto.payment;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PaymentResponse {
    private String key;
    private String gatewayOrderId;
    private Double amount;
    private String internalOrderId;
}
