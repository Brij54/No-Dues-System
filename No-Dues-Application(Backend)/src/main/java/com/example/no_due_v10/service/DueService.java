package com.example.no_due_v10.service;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.*;
import com.example.no_due_v10.repository.DueRepository;
import org.springframework.http.ResponseEntity;
import java.security.Principal;
import com.example.no_due_v10.repository.UserRepository;
import com.example.no_due_v10.repository.StudentRepository;
import com.example.no_due_v10.repository.DepartmentRepository;
import com.example.no_due_v10.entity.*;
import com.example.no_due_v10.dto.*;
import com.example.no_due_v10.exception.*;
import java.time.*;

@Service()
public class DueService {

    @Autowired()
    private DueRepository dueRepository;
    public Due createDue(Due entity) {
        return dueRepository.save(entity);
    }

    public List<Due> getAllDues() {
        return dueRepository.findAll();
    }

    public List<Due> getDuesByDepartmentAdmin(String userId) {
        User admin = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));
        if (admin.getDepartment() != null) {
            return dueRepository.findByDepartmentId(admin.getDepartment().getId());
        }
        return new ArrayList<>();
    }

    public Optional<Due> getDueById(String id) {
        return dueRepository.findById(id);
    }

    public void deleteDue(String id) {
        dueRepository.deleteById(id);
    }

    @Autowired()
    private UserRepository userRepository;

    @Autowired()
    private StudentRepository studentRepository;

    @Autowired()
    private DepartmentRepository departmentRepository;

    @Autowired()
    private KeycloakAuthService keycloakAuthService;

    /*
 * Operation    : Create Due for Student
 * Comment      : Creates a new Due record for a student, linked to the DepartmentAdmin's department. Updates the student's totalPendingAmount and noDueStatus accordingly.
 */
    public Due createDueForStudent(CreateDueRequest request, Principal principal) {
        String userId = keycloakAuthService.getUserId(principal);
        User admin = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));

        Student student = studentRepository.findById(request.getStudentId()).orElseThrow(() -> new ResourceNotFoundException("Student not found"));

        // Resolve department: prefer admin's linked department, fall back to departmentId in request
        String deptId = (admin.getDepartment() != null)
                ? admin.getDepartment().getId()
                : request.getDepartmentId();

        if (deptId == null || deptId.isBlank()) {
            throw new BadRequestException(
                "Unable to determine department. Your account is not linked to a department. " +
                "Please contact your administrator or provide a departmentId in the request.");
        }

        Department department = departmentRepository.findById(deptId)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found: " + deptId));

        if (!department.getIsActive()) {
            throw new ConflictException("Department is not active");
        }

        // Self-heal: If the admin is not linked to a department in the DB, link them permanently now
        if (admin.getDepartment() == null) {
            admin.setDepartment(department);
            userRepository.save(admin);
        }
        // Determine the initial status: use request status if provided, otherwise default to "Dues-Pending"
        String initialStatus = (request.getStatus() != null) 
                ? request.getStatus() 
                : ((request.getAmount() != null && request.getAmount() == 0.0) ? "No-Dues" : "Dues-Pending");
        Due due = new Due();
        due.setDescription(request.getDescription());
        due.setAmount(request.getAmount() != null ? request.getAmount() : 0.0);
        due.setPaidAmount(0.0);
        due.setStatus(initialStatus);
        due.setCreatedAt(LocalDate.now());
        due.setStudent(student);
        due.setUser(admin);
        due.setDepartment(department);
        Due savedDue = dueRepository.save(due);

        // Recalculate total pending from DB to stay consistent
        Double totalPending = dueRepository.sumAllPendingAmountByStudentId(student.getId());
        student.setTotalPendingAmount(totalPending != null ? totalPending : 0.0);
        if (student.getTotalPendingAmount() > 0) {
            student.setNoDueStatus("PENDING");
        }
        studentRepository.save(student);
        return savedDue;
    }

    /*
 * Operation    : Update Due
 * Comment      : Updates description and/or amount of an existing Due record. Uses default findById and save from Spring Data JPA.
 */
    public Due updateDue(String dueId, UpdateDueRequest request, Principal principal) {
        String userId = keycloakAuthService.getUserId(principal);
        Due due = dueRepository.findById(dueId).orElseThrow(() -> new ResourceNotFoundException("Due not found"));
        if (request.getDescription() != null) {
            due.setDescription(request.getDescription());
        }
        if (request.getAmount() != null) {
            due.setAmount(request.getAmount());
        }
        
        double amt = due.getAmount() != null ? due.getAmount() : 0.0;
        double paid = due.getPaidAmount() != null ? due.getPaidAmount() : 0.0;
        
        if (amt > paid) {
            due.setStatus("Dues-Pending");
            due.setClearedAt(null);
        } else {
            if (request.getStatus() != null) {
                due.setStatus(request.getStatus());
                String st = request.getStatus().toLowerCase();
                if (st.equals("no_dues") || st.equals("no-dues") || st.equals("cleared")) {
                    due.setClearedAt(LocalDate.now());
                } else {
                    due.setClearedAt(null);
                }
            } else {
                due.setStatus("CLEARED");
                if (due.getClearedAt() == null) {
                    due.setClearedAt(LocalDate.now());
                }
            }
        }
        due.setUpdatedAt(LocalDate.now());
        Due savedDue = dueRepository.save(due);

        // Recalculate student's totalPendingAmount and noDueStatus using the new status-agnostic query
        if (due.getStudent() != null) {
            Student student = due.getStudent();
            Double rawPending = dueRepository.sumAllPendingAmountByStudentId(student.getId());
            double pending = rawPending != null ? rawPending : 0.0;
            student.setTotalPendingAmount(pending);
            if (pending <= 0.0) {
                // Check if all dues are NO_DUES or CLEARED
                List<Due> allStudentDues = dueRepository.findByStudentId(student.getId());
                boolean allCleared = allStudentDues.stream()
                        .allMatch(d -> {
                            String st = d.getStatus() != null ? d.getStatus().toLowerCase() : "";
                            return st.equals("no-dues") || st.equals("no_dues") || st.equals("cleared");
                        });
                student.setNoDueStatus(allCleared ? "CLEARED" : "PENDING");
            } else {
                student.setNoDueStatus("PENDING");
            }
            studentRepository.save(student);
        }

        return savedDue;
    }

    /*
 * Operation    : Clear Student Dues
 * Comment      : Verifies that the payment amount exactly matches the total pending dues for the authenticated student, then marks all pending dues as CLEARED with the current date.
 */
    public void clearStudentDues(ClearStudentDuesRequest request, Principal principal) {
        String userId = keycloakAuthService.getUserId(principal);
        Student student = studentRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("Student not found"));
        List<Due> pendingDues = dueRepository.findByStudentIdAndStatus(student.getId(), "PENDING");
        if (pendingDues.isEmpty()) {
            throw new BadRequestException("No pending dues found for student");
        }
        Double totalPending = pendingDues.stream().mapToDouble(Due::getAmount).sum();
        if (!request.getPaymentAmount().equals(totalPending)) {
            throw new BadRequestException("Payment amount does not exactly match total pending dues of " + totalPending);
        }
        LocalDate now = LocalDate.now();
        for (Due due : pendingDues) {
            due.setStatus("CLEARED");
            due.setClearedAt(now);
            due.setUpdatedAt(now);
        }
        dueRepository.saveAll(pendingDues);
        student.setTotalPendingAmount(0.0);
        student.setNoDueStatus("CLEARED");
        studentRepository.save(student);
    }

    /*
 * Operation    : Get Dues By Student
 * Comment      : Fetches all due records for the given student ID.
 */
    public List<Due> getDuesByStudent(String studentId) {
        List<Due> dues = dueRepository.findByStudentId(studentId);
        return dues;
    }
}
