package com.example.no_due_v10.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Builder()
@Data()
public class CreatePaymentRequest {

    private Double amountPaid;

    public Double getAmountPaid() {
        return this.amountPaid;
    }

    public void setAmountPaid(Double amountPaid) {
        this.amountPaid = amountPaid;
    }

    private String transactionReference;

    public String getTransactionReference() {
        return this.transactionReference;
    }

    public void setTransactionReference(String transactionReference) {
        this.transactionReference = transactionReference;
    }

    private LocalDateTime paymentTime;

    public LocalDateTime getPaymentTime() {
        return this.paymentTime;
    }

    public void setPaymentTime(LocalDateTime paymentTime) {
        this.paymentTime = paymentTime;
    }

    private String paymentStatus;

    public String getPaymentStatus() {
        return this.paymentStatus;
    }

    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public CreatePaymentRequest() {
    }

    public CreatePaymentRequest(Double amountPaid, String transactionReference, LocalDateTime paymentTime, String paymentStatus) {
        this.amountPaid = amountPaid;
        this.transactionReference = transactionReference;
        this.paymentTime = paymentTime;
        this.paymentStatus = paymentStatus;
    }
}
