package com.example.no_due_v10.dto;

import lombok.Builder;
import lombok.Data;

@Builder()
@Data()
public class StudentDTO {

    private String id;

    public String getId() {
        return this.id;
    }

    public void setId(String id) {
        this.id = id;
    }

    private String name;

    public String getName() {
        return this.name;
    }

    public void setName(String name) {
        this.name = name;
    }

    private String email;

    public String getEmail() {
        return this.email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    private String rollNumber;

    public String getRollNumber() {
        return this.rollNumber;
    }

    public void setRollNumber(String rollNumber) {
        this.rollNumber = rollNumber;
    }

    private String phone;

    public String getPhone() {
        return this.phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    private String gender;

    public String getGender() {
        return this.gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

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

    public StudentDTO() {
    }

    public StudentDTO(String id, String name, String email, String rollNumber, String phone, String gender, Double totalPendingAmount, String noDueStatus) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.rollNumber = rollNumber;
        this.phone = phone;
        this.gender = gender;
        this.totalPendingAmount = totalPendingAmount;
        this.noDueStatus = noDueStatus;
    }
}
