package com.example.no_due_v10.service;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.*;
import com.example.no_due_v10.repository.DepartmentRepository;
import org.springframework.http.ResponseEntity;
import com.example.no_due_v10.entity.*;
import com.example.no_due_v10.dto.*;
import com.example.no_due_v10.exception.*;
import java.time.*;

@Service()
public class DepartmentService {

    @Autowired()
    private DepartmentRepository departmentRepository;

    public List<Department> getAllDepartments() {
        return departmentRepository.findAll();
    }

    public Optional<Department> getDepartmentById(String id) {
        return departmentRepository.findById(id);
    }

    public void deleteDepartment(String id) {
        departmentRepository.deleteById(id);
    }

    /*
 * Operation    : Create Department
 * Comment      : Creates a new Department entity from the request DTO and persists it using the default save method.
 */
    public Department createDepartment(CreateDepartmentRequest request) {
        Department department = new Department();
        department.setId(request.getId());
        department.setName(request.getName());
        department.setDescription(request.getDescription());
        department.setIsActive(request.getIsActive());
        Department saved = departmentRepository.save(department);
        return saved;
    }

    /*
 * Operation    : Update Department
 * Comment      : Updates the name and/or description of an existing department. Uses default findById and save methods.
 */
    public Department updateDepartment(String id, UpdateDepartmentRequest request) {
        Department department = departmentRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Department not found"));
        if (request.getName() != null) {
            department.setName(request.getName());
        }
        if (request.getDescription() != null) {
            department.setDescription(request.getDescription());
        }
        return departmentRepository.save(department);
    }
}
