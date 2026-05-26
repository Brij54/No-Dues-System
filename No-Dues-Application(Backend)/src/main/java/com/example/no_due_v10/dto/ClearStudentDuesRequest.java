package com.example.no_due_v10.dto;

import lombok.Builder;
import lombok.Data;

@Builder()
@Data()
public class ClearStudentDuesRequest {

    private Double paymentAmount;

    public Double getPaymentAmount() {
        return this.paymentAmount;
    }

    public void setPaymentAmount(Double paymentAmount) {
        this.paymentAmount = paymentAmount;
    }

    public ClearStudentDuesRequest() {
    }

    public ClearStudentDuesRequest(Double paymentAmount) {
        this.paymentAmount = paymentAmount;
    }
}
