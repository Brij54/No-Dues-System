package com.example.no_due_v10.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Builder()
@Data()
public class PaymentDTO {

    private String id;

    public String getId() {
        return this.id;
    }

    public void setId(String id) {
        this.id = id;
    }

    private Double amountPaid;

    public Double getAmountPaid() {
        return this.amountPaid;
    }

    public void setAmountPaid(Double amountPaid) {
        this.amountPaid = amountPaid;
    }

    private String paymentStatus;

    public String getPaymentStatus() {
        return this.paymentStatus;
    }

    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    private LocalDateTime paymentTime;

    public LocalDateTime getPaymentTime() {
        return this.paymentTime;
    }

    public void setPaymentTime(LocalDateTime paymentTime) {
        this.paymentTime = paymentTime;
    }

    private String transactionReference;

    public String getTransactionReference() {
        return this.transactionReference;
    }

    public void setTransactionReference(String transactionReference) {
        this.transactionReference = transactionReference;
    }

    private String remarks;

    public String getRemarks() {
        return this.remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public PaymentDTO() {
    }

    public PaymentDTO(String id, Double amountPaid, String paymentStatus, LocalDateTime paymentTime, String transactionReference, String remarks) {
        this.id = id;
        this.amountPaid = amountPaid;
        this.paymentStatus = paymentStatus;
        this.paymentTime = paymentTime;
        this.transactionReference = transactionReference;
        this.remarks = remarks;
    }
}
