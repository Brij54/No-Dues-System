package com.example.no_due_v10.service;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.*;
import com.example.no_due_v10.repository.StudentRepository;
import org.springframework.http.ResponseEntity;
import java.security.Principal;
import com.example.no_due_v10.repository.DueRepository;
import com.example.no_due_v10.entity.*;
import com.example.no_due_v10.dto.*;
import java.time.*;

@Service()
public class StudentService {

    @Autowired()
    private StudentRepository studentRepository;

    public Student createStudent(Student entity) {
        return studentRepository.save(entity);
    }

    public Optional<Student> getStudentById(String id) {
        return studentRepository.findById(id);
    }

    public Student updateStudent(String id, Student entity) {
        if (studentRepository.existsById(id)) {
            entity.setId(id);
            return studentRepository.save(entity);
        }
        return null;
    }

    public void deleteStudent(String id) {
        studentRepository.deleteById(id);
    }

    /*
 * Operation    : Update Student Pending Amount and No-Due Status
 * Comment      : Recalculates totalPendingAmount by adding the new due amount to the existing pending amount, and sets noDueStatus to PENDING.
 */
    public Student updateStudentPendingAmountAndDueStatus(UpdateStudentPendingAmountRequest request) {
        Student student = studentRepository.findById(request.getStudentId()).orElseThrow(() -> new RuntimeException("Student not found with id: " + request.getStudentId()));
        Double currentPending = student.getTotalPendingAmount() != null ? student.getTotalPendingAmount() : 0.0;
        student.setTotalPendingAmount(currentPending + request.getAdditionalAmount());
        student.setNoDueStatus("PENDING");
        return studentRepository.save(student);
    }

    /*
 * Operation    : Update Student No Due Status
 * Comment      : Recalculates and updates the noDueStatus of a student based on their current totalPendingAmount. Sets status to CLEARED if no pending amount, otherwise PENDING.
 */
    public void updateStudentNoDueStatus(String studentId) {
        Student student = studentRepository.findById(studentId).orElseThrow(() -> new RuntimeException("Student not found"));
        Double totalPending = student.getTotalPendingAmount();
        if (totalPending != null && totalPending <= 0.0) {
            student.setNoDueStatus("CLEARED");
        } else {
            student.setNoDueStatus("PENDING");
        }
        studentRepository.save(student);
    }

    @Autowired()
    private KeycloakAuthService keycloakAuthService;

    /*
 * Operation    : Get Student Pending Dues Summary
 * Comment      : Fetches the authenticated student's totalPendingAmount and noDueStatus using their Keycloak-derived userId.
 */
    public StudentPendingDuesSummaryResponse getStudentPendingDuesSummary(Principal principal) {
        String userId = keycloakAuthService.getUserId(principal);
        Student student = studentRepository.findById(userId).orElseThrow(() -> new RuntimeException("Student not found"));
        StudentPendingDuesSummaryResponse response = new StudentPendingDuesSummaryResponse();
        response.setTotalPendingAmount(student.getTotalPendingAmount());
        response.setNoDueStatus(student.getNoDueStatus());
        return response;
    }

    @Autowired()
    private DueRepository dueRepository;

    /*
 * Operation    : Update Student Total Pending Amount
 * Comment      : Recalculates the student's totalPendingAmount by summing all non-cleared Due records and updates noDueStatus accordingly.
 */
    public Student updateStudentTotalPendingAmount(String studentId) {
        Student student = studentRepository.findById(studentId).orElseThrow(() -> new RuntimeException("Student not found with id: " + studentId));
        // Use the status-agnostic sum query
        Double rawPending = dueRepository.sumAllPendingAmountByStudentId(studentId);
        double totalPending = rawPending != null ? rawPending : 0.0;
        student.setTotalPendingAmount(totalPending);
        if (totalPending <= 0.0) {
            student.setNoDueStatus("CLEARED");
        } else {
            student.setNoDueStatus("PENDING");
        }
        return studentRepository.save(student);
    }

    /*
 * Operation    : Get All Students
 * Comment      : Retrieves all Student records for Super Admin overview including noDueStatus and totalPendingAmount.
 */
    public List<Student> getAllStudents() {
        List<Student> students = studentRepository.findAll();
        return students;
    }
}
