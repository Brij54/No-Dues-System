package com.example.no_due_v10.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;

@Builder()
@Data()
public class DueDTO {

    private String id;

    public String getId() {
        return this.id;
    }

    public void setId(String id) {
        this.id = id;
    }

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

    private LocalDate createdAt;

    public LocalDate getCreatedAt() {
        return this.createdAt;
    }

    public void setCreatedAt(LocalDate createdAt) {
        this.createdAt = createdAt;
    }

    private LocalDate updatedAt;

    public LocalDate getUpdatedAt() {
        return this.updatedAt;
    }

    public void setUpdatedAt(LocalDate updatedAt) {
        this.updatedAt = updatedAt;
    }

    private LocalDate clearedAt;

    public LocalDate getClearedAt() {
        return this.clearedAt;
    }

    public void setClearedAt(LocalDate clearedAt) {
        this.clearedAt = clearedAt;
    }

    public DueDTO() {
    }

    public DueDTO(String id, String description, Double amount, String status, LocalDate createdAt, LocalDate updatedAt, LocalDate clearedAt) {
        this.id = id;
        this.description = description;
        this.amount = amount;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.clearedAt = clearedAt;
    }
}
