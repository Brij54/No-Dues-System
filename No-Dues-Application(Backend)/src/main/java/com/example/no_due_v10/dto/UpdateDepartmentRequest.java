package com.example.no_due_v10.dto;

import lombok.Builder;
import lombok.Data;

@Builder()
@Data()
public class UpdateDepartmentRequest {

    private String name;

    public String getName() {
        return this.name;
    }

    public void setName(String name) {
        this.name = name;
    }

    private String description;

    public String getDescription() {
        return this.description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public UpdateDepartmentRequest() {
    }

    public UpdateDepartmentRequest(String name, String description) {
        this.name = name;
        this.description = description;
    }
}
