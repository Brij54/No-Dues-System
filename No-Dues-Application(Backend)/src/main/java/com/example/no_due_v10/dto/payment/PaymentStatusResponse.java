package com.example.no_due_v10.dto.payment;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PaymentStatusResponse {
    private String status;
}
