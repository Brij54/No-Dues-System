package com.example.no_due_v10.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.List;
import java.util.Optional;
import com.example.no_due_v10.service.DepartmentService;
import org.springframework.security.access.prepost.PreAuthorize;
import java.util.Map;
import org.springframework.web.bind.annotation.*;
import com.example.no_due_v10.entity.*;
import com.example.no_due_v10.dto.*;

@RestController()
@RequestMapping(value = "/api/departments")
public class DepartmentController {

    @Autowired()
    private DepartmentService departmentService;

    @GetMapping()
    @PreAuthorize("hasAnyRole('SUPERADMIN','DEPARTMENTADMIN','STUDENT')")
    public ResponseEntity<List<Department>> getAllDepartments() {
        return ResponseEntity.ok(departmentService.getAllDepartments());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN','DEPARTMENTADMIN','STUDENT')")
    public ResponseEntity<Department> getDepartmentById(@PathVariable String id) {
        return departmentService.getDepartmentById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<Void> deleteDepartment(@PathVariable String id) {
        departmentService.deleteDepartment(id);
        return ResponseEntity.noContent().build();
    }

    /*
 * Operation    : Create Department
 * Comment      : Accepts a CreateDepartmentRequest body and delegates to DepartmentService to persist the new department. Returns the created department with HTTP 201.
 */
    @PostMapping(value = "")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<Department> createDepartment(@RequestBody CreateDepartmentRequest request) {
        return ResponseEntity.ok(departmentService.createDepartment(request));
    }

    /*
 * Operation    : Update Department
 * Comment      : Endpoint for SuperAdmin to update an existing department's details.
 */
    @PutMapping(value = "/{id}")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<Department> updateDepartment(@PathVariable String id, @RequestBody UpdateDepartmentRequest request) {
        return ResponseEntity.ok(departmentService.updateDepartment(id, request));
    }
}
