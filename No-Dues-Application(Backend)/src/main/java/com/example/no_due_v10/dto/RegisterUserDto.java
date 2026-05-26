package com.example.no_due_v10.dto;

import lombok.Data;

@Data
public class RegisterUserDto {

    private String email;
    private String password;
    private String firstName;
    private String lastName;
}
