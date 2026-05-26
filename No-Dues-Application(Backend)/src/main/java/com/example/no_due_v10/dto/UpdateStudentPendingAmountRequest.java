package com.example.no_due_v10.dto;

import lombok.Builder;
import lombok.Data;

@Builder()
@Data()
public class UpdateStudentPendingAmountRequest {

    private String studentId;

    public String getStudentId() {
        return this.studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }

    private Double additionalAmount;

    public Double getAdditionalAmount() {
        return this.additionalAmount;
    }

    public void setAdditionalAmount(Double additionalAmount) {
        this.additionalAmount = additionalAmount;
    }

    public UpdateStudentPendingAmountRequest() {
    }

    public UpdateStudentPendingAmountRequest(String studentId, Double additionalAmount) {
        this.studentId = studentId;
        this.additionalAmount = additionalAmount;
    }
}
