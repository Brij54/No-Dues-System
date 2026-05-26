package com.example.no_due_v10.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.List;
import java.util.Optional;
import com.example.no_due_v10.service.DueService;
import org.springframework.security.access.prepost.PreAuthorize;
import java.util.Map;
import java.security.Principal;
import org.springframework.web.bind.annotation.*;
import com.example.no_due_v10.entity.*;
import com.example.no_due_v10.dto.*;

@RestController()
@RequestMapping(value = "/api/dues")
public class DueController {

    @Autowired()
    private DueService dueService;

    @PostMapping()
    @PreAuthorize("hasRole('DEPARTMENTADMIN','STUDENT')")
    public ResponseEntity<Due> createDue(@RequestBody Due entity) {
        return ResponseEntity.ok(dueService.createDue(entity));
    }

    @Autowired()
    private com.example.no_due_v10.service.KeycloakAuthService keycloakAuthService;

    @GetMapping()
    @PreAuthorize("hasAnyRole('SUPERADMIN','DEPARTMENTADMIN','STUDENT')")
    public ResponseEntity<List<Due>> getAllDues(Principal principal) {
        org.springframework.security.core.Authentication authentication = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            
        boolean isSuperAdmin = authentication.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equalsIgnoreCase("ROLE_SUPERADMIN"));
            
        if (isSuperAdmin) {
            return ResponseEntity.ok(dueService.getAllDues());
        }

        boolean isDeptAdmin = authentication.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equalsIgnoreCase("ROLE_DEPARTMENTADMIN"));
            
        if (isDeptAdmin && principal != null) {
            String adminId = keycloakAuthService.getUserId(principal);
            return ResponseEntity.ok(dueService.getDuesByDepartmentAdmin(adminId));
        }

        boolean isStudent = authentication.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equalsIgnoreCase("ROLE_STUDENT"));
            
//        if (isStudent && principal != null) {
        if (!isSuperAdmin && !isDeptAdmin && isStudent && principal != null) {
            String studentId = keycloakAuthService.getUserId(principal);
            return ResponseEntity.ok(dueService.getDuesByStudent(studentId));
        }
        
        return ResponseEntity.ok(dueService.getAllDues());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN','DEPARTMENTADMIN','STUDENT')")
    public ResponseEntity<Due> getDueById(@PathVariable String id) {
        return dueService.getDueById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('DEPARTMENTADMIN','SUPERADMIN')")
    public ResponseEntity<Void> deleteDue(@PathVariable String id) {
        dueService.deleteDue(id);
        return ResponseEntity.noContent().build();
    }

    /*
 * Operation    : Create Due for Student
 * Comment      : Endpoint for DepartmentAdmin to create a new due for a specific student. Delegates to DueService.
 */
    @PostMapping(value = "/create")
    @PreAuthorize("hasAnyRole('DEPARTMENTADMIN','LIBRARY_LIBRARIAN')")
    public ResponseEntity<Due> createDueForStudent(@RequestBody CreateDueRequest request, Principal principal) {
        return ResponseEntity.ok(dueService.createDueForStudent(request, principal));
    }

    /*
 * Operation    : Update Due
 * Comment      : Accepts dueId as path variable and UpdateDueRequest as request body. Delegates to DueService.updateDue and returns updated Due wrapped in ResponseEntity.
 */
    @PutMapping(value = "/{dueId}")
    @PreAuthorize("hasRole('DEPARTMENTADMIN')")
    public ResponseEntity<Due> updateDue(@PathVariable String dueId, @RequestBody UpdateDueRequest request, Principal principal) {
        return ResponseEntity.ok(dueService.updateDue(dueId, request, principal));
    }

    /*
 * Operation    : Clear Student Dues
 * Comment      : Endpoint for authenticated students to clear all their pending dues by providing an exact payment amount.
 */
    @PostMapping(value = "/clear")
    @PreAuthorize("hasRole('STUDENT')")
    public void clearStudentDues(@RequestBody ClearStudentDuesRequest request, Principal principal) {
        dueService.clearStudentDues(request, principal);
    }

    /*
 * Operation    : Get Dues By Student
 * Comment      : Endpoint for Super Admin to retrieve all due records for a specific student.
 */
    @GetMapping(value = "/super-admin/students/{studentId}/dues")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<List<Due>> getDuesByStudent(@PathVariable String studentId) {
        return ResponseEntity.ok(dueService.getDuesByStudent(studentId));
    }
}
