package com.example.no_due_v10.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.List;
import java.util.Optional;
import com.example.no_due_v10.service.StudentService;
import org.springframework.security.access.prepost.PreAuthorize;
import java.util.Map;
import java.security.Principal;
import org.springframework.web.bind.annotation.*;
import com.example.no_due_v10.entity.*;
import com.example.no_due_v10.dto.*;

@RestController()
@RequestMapping(value = "/api/students")
public class StudentController {

    @Autowired()
    private StudentService studentService;

    @PostMapping()
    @PreAuthorize("hasAnyRole('SUPERADMIN','DEPARTMENTADMIN')")
    public ResponseEntity<Student> createStudent(@RequestBody Student entity) {
        return ResponseEntity.ok(studentService.createStudent(entity));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN','DEPARTMENTADMIN','STUDENT')")
    public ResponseEntity<Student> getStudentById(@PathVariable String id) {
        return studentService.getStudentById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<Student> updateStudent(@PathVariable String id, @RequestBody Student entity) {
        Student updated = studentService.updateStudent(id, entity);
        if (updated != null)
            return ResponseEntity.ok(updated);
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<Void> deleteStudent(@PathVariable String id) {
        studentService.deleteStudent(id);
        return ResponseEntity.noContent().build();
    }

    /*
 * Operation    : Update Student Pending Amount and No-Due Status
 * Comment      : Accepts a request body with studentId and additionalAmount, delegates to service to update totalPendingAmount and noDueStatus, and returns the updated Student.
 */
    @PutMapping(value = "/pending-amount")
    @PreAuthorize("hasAnyRole('DEPARTMENTADMIN','SUPERADMIN')")
    public ResponseEntity<Student> updateStudentPendingAmountAndDueStatus(@RequestBody UpdateStudentPendingAmountRequest request) {
        return ResponseEntity.ok(studentService.updateStudentPendingAmountAndDueStatus(request));
    }

    /*
 * Operation    : Update Student No Due Status
 * Comment      : Endpoint to update the noDueStatus of a student after a due update. Accessible by DepartmentAdmin and SuperAdmin.
 */
    @PutMapping(value = "/{studentId}/no-due-status")
    @PreAuthorize("hasAnyRole('DEPARTMENTADMIN','SUPERADMIN')")
    public void updateStudentNoDueStatus(@PathVariable String studentId) {
        studentService.updateStudentNoDueStatus(studentId);
    }

    /*
 * Operation    : Get Student Pending Dues Summary
 * Comment      : Returns the authenticated student's pending dues summary including totalPendingAmount and noDueStatus.
 */
    @GetMapping(value = "/me/dues/summary")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<StudentPendingDuesSummaryResponse> getStudentPendingDuesSummary(Principal principal) {
        return ResponseEntity.ok(studentService.getStudentPendingDuesSummary(principal));
    }

    /*
 * Operation    : Update Student Total Pending Amount
 * Comment      : Triggers recalculation and update of the student's total pending amount based on current Due records.
 */
    @PutMapping(value = "/{studentId}/recalculate-pending")
    @PreAuthorize("hasAnyRole('STUDENT','DEPARTMENTADMIN','SUPERADMIN')")
    public ResponseEntity<Student> updateStudentTotalPendingAmount(@PathVariable String studentId) {
        return ResponseEntity.ok(studentService.updateStudentTotalPendingAmount(studentId));
    }

    /*
 * Operation    : Get All Students
 * Comment      : Endpoint for Super Admin to retrieve all students across all departments.
 */
    @GetMapping(value = "")
    @PreAuthorize("hasAnyRole('SUPERADMIN','DEPARTMENTADMIN')")
    public ResponseEntity<List<Student>> getAllStudents() {
        return ResponseEntity.ok(studentService.getAllStudents());
    }
}
