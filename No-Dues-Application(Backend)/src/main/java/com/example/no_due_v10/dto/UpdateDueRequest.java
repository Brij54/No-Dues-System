package com.example.no_due_v10.dto;

import lombok.Builder;
import lombok.Data;

@Builder()
@Data()
public class UpdateDueRequest {

    private String description;

    public String getDescription() {
        return this.description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    private Double amount;

    public Double getAmount() {
        return this.amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    private String status;

    public String getStatus() {
        return this.status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public UpdateDueRequest() {
    }

    public UpdateDueRequest(String description, Double amount, String status) {
        this.description = description;
        this.amount = amount;
        this.status = status;
    }
}
