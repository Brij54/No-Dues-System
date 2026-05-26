package com.example.no_due_v10.dto;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Builder()
@Data()
@NoArgsConstructor
@AllArgsConstructor
public class CreateDueRequest {

    private String studentId;
    private String departmentId;
    private String description;
    private Double amount;
    private String status;
}
