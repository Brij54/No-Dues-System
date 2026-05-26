package com.example.no_due_v10.dto;

import lombok.Builder;
import lombok.Data;

@Builder()
@Data()
public class StudentPendingDuesSummaryResponse {

    private Double totalPendingAmount;

    public Double getTotalPendingAmount() {
        return this.totalPendingAmount;
    }

    public void setTotalPendingAmount(Double totalPendingAmount) {
        this.totalPendingAmount = totalPendingAmount;
    }

    private String noDueStatus;

    public String getNoDueStatus() {
        return this.noDueStatus;
    }

    public void setNoDueStatus(String noDueStatus) {
        this.noDueStatus = noDueStatus;
    }

    public StudentPendingDuesSummaryResponse() {
    }

    public StudentPendingDuesSummaryResponse(Double totalPendingAmount, String noDueStatus) {
        this.totalPendingAmount = totalPendingAmount;
        this.noDueStatus = noDueStatus;
    }
}
