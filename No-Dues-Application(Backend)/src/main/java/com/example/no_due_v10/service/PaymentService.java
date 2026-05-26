package com.example.no_due_v10.service;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import com.example.no_due_v10.repository.PaymentRepository;
import com.example.no_due_v10.repository.DueRepository;
import org.springframework.http.ResponseEntity;
import java.security.Principal;
import com.example.no_due_v10.repository.StudentRepository;
import com.example.no_due_v10.entity.*;
import com.example.no_due_v10.dto.*;
import java.time.*;

@Service()
public class PaymentService {

    @Autowired()
    private PaymentRepository paymentRepository;

    @Autowired()
    private DueRepository dueRepository;

    @Autowired()
    private EmailService emailService;

    public Payment createPayment(Payment entity) {
        return paymentRepository.save(entity);
    }

    public List<Payment> getAllPayments(Principal principal) {
        org.springframework.security.core.Authentication authentication =
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        boolean isSuperAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equalsIgnoreCase("ROLE_SUPERADMIN"));

        if (isSuperAdmin) {
            return paymentRepository.findAll();
        }

        boolean isStudent = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equalsIgnoreCase("ROLE_STUDENT"));

        if (isStudent) {
            String studentId = keycloakAuthService.getUserId(principal);

            return paymentRepository.findByStudentId(studentId);
        }
        return new ArrayList<>();
    }

    public Optional<Payment> getPaymentById(String id) {
        return paymentRepository.findById(id);
    }

    public Payment updatePayment(String id, Payment entity) {
        if (paymentRepository.existsById(id)) {
            entity.setId(id);
            return paymentRepository.save(entity);
        }
        return null;
    }

    public void deletePayment(String id) {
        paymentRepository.deleteById(id);
    }

    @Autowired()
    private KeycloakAuthService keycloakAuthService;

    /*
 * Operation    : Create Payment Record
 * Comment      : Creates a new Payment record for the authenticated student with the provided payment details.
 */
    public Payment createPaymentRecord(CreatePaymentRequest request, Principal principal) {
        String userId = keycloakAuthService.getUserId(principal);
        Student student = studentRepository.findById(userId).orElseThrow(() -> new RuntimeException("Student not found"));
        Payment payment = new Payment();
        payment.setAmountPaid(request.getAmountPaid());
        payment.setTransactionReference(request.getTransactionReference());
        payment.setPaymentTime(request.getPaymentTime());
        payment.setPaymentStatus(request.getPaymentStatus());
        Payment savedPayment = paymentRepository.save(payment);
        return savedPayment;
    }

    @Autowired()
    private StudentRepository studentRepository;

    /*
 * Operation    : Verify and Process Payment
 * Comment      : Compares amountPaid against student's totalPendingAmount and sets paymentStatus to CLEARED, MISMATCH, or NO_DUES. Updates student's noDueStatus accordingly.
 */
    @Transactional
    public Payment verifyAndProcessPayment(String paymentId, String studentId) {
        Payment payment = paymentRepository.findByIdWithStudent(paymentId).orElseThrow(() -> new RuntimeException("Payment not found with id: " + paymentId));
        Student student = studentRepository.findStudentById(studentId).orElseThrow(() -> new RuntimeException("Student not found with id: " + studentId));
        
        Double amountPaid = payment.getAmountPaid();
        Double totalPendingAmount = student.getTotalPendingAmount();
        
        if (totalPendingAmount == null || totalPendingAmount == 0.0) {
            payment.setPaymentStatus("NO_DUES");
            student.setNoDueStatus("CLEARED");
        } else if (amountPaid != null) {
            // Use the same robust partial-deduction logic as online processing
            payment.setPaymentStatus("CLEARED");
            payment.setPaymentDate(LocalDateTime.now());
            
            // Update individual Due records to CLEARED/reduced amount
            List<Due> allDues = dueRepository.findByStudentId(student.getId());
            List<Due> pendingDues = new ArrayList<>();
            for (Due d : allDues) {
                if (d.getStatus() != null && !d.getStatus().equalsIgnoreCase("CLEARED") && !d.getStatus().equalsIgnoreCase("NO_DUES") && !d.getStatus().equalsIgnoreCase("NO-DUES")) {
                    double amt = d.getAmount() != null ? d.getAmount() : 0.0;
                    double paid = d.getPaidAmount() != null ? d.getPaidAmount() : 0.0;
                    if (amt - paid > 0) {
                        pendingDues.add(d);
                    }
                }
            }
            double remainingPayment = amountPaid;
            LocalDate localNow = LocalDate.now();
            for (Due due : pendingDues) {
                if (remainingPayment <= 0.001) {
                    break;
                }
                double dueAmount = due.getAmount() != null ? due.getAmount() : 0.0;
                double duePaidAmount = due.getPaidAmount() != null ? due.getPaidAmount() : 0.0;
                double pending = dueAmount - duePaidAmount;
                if (pending <= 0) {
                    continue;
                }
                if (pending <= remainingPayment + 0.01) {
                    remainingPayment -= pending;
                    due.setPaidAmount(dueAmount);
                    due.setStatus("CLEARED");
                    due.setClearedAt(localNow);
                    due.setUpdatedAt(localNow);
                    dueRepository.save(due);
                } else {
                    due.setPaidAmount(duePaidAmount + remainingPayment);
                    due.setUpdatedAt(localNow);
                    dueRepository.save(due);
                    remainingPayment = 0.0;
                }
            }
            
            // Recalculate student total pending amount AFTER dues are updated
            Double rawPending = dueRepository.sumAllPendingAmountByStudentId(student.getId());
            double pending = rawPending != null ? rawPending : 0.0;
            student.setTotalPendingAmount(pending);
            student.setNoDueStatus(pending <= 0.0 ? "CLEARED" : "PENDING");
            
            sendConfirmationEmail(student, amountPaid, payment.getTransactionReference() != null ? payment.getTransactionReference() : payment.getId(), payment.getPaymentDate());
            
        } else {
            payment.setPaymentStatus("MISMATCH");
            student.setNoDueStatus("PENDING");
        }
        
        studentRepository.save(student);
        Payment savedPayment = paymentRepository.save(payment);
        return savedPayment;
    }

    @Transactional
    public void processSuccessfulPayment(Payment payment, String referenceNo, String paymentMode) {
        if ("SUCCESS".equals(payment.getPaymentStatus())) {
            return; // Already processed
        }
        payment.setPaymentStatus("SUCCESS");
        payment.setPaymentDate(LocalDateTime.now());
        payment.setReferenceNo(referenceNo);
        payment.setPaymentMode(paymentMode);

        Student student = payment.getStudent();
        if (student != null) {

            // Update individual Due records to CLEARED/reduced amount
            List<Due> allDues = dueRepository.findByStudentId(student.getId());
            List<Due> pendingDues = new ArrayList<>();
            for (Due d : allDues) {
                if (d.getStatus() != null && !d.getStatus().equalsIgnoreCase("CLEARED") && !d.getStatus().equalsIgnoreCase("NO_DUES") && !d.getStatus().equalsIgnoreCase("NO-DUES")) {
                    double amt = d.getAmount() != null ? d.getAmount() : 0.0;
                    double paid = d.getPaidAmount() != null ? d.getPaidAmount() : 0.0;
                    if (amt - paid > 0) {
                        pendingDues.add(d);
                    }
                }
            }
            double remainingPayment = payment.getAmountPaid() != null ? payment.getAmountPaid() : 0.0;
            LocalDate localNow = LocalDate.now();
            for (Due due : pendingDues) {
                if (remainingPayment <= 0.001) {
                    break;
                }
                double dueAmount = due.getAmount() != null ? due.getAmount() : 0.0;
                double duePaidAmount = due.getPaidAmount() != null ? due.getPaidAmount() : 0.0;
                double pending = dueAmount - duePaidAmount;
                if (pending <= 0) {
                    continue;
                }
                if (pending <= remainingPayment + 0.01) {
                    remainingPayment -= pending;
                    due.setPaidAmount(dueAmount);
                    due.setStatus("CLEARED");
                    due.setClearedAt(localNow);
                    due.setUpdatedAt(localNow);
                    dueRepository.save(due);
                } else {
                    due.setPaidAmount(duePaidAmount + remainingPayment);
                    due.setUpdatedAt(localNow);
                    dueRepository.save(due);
                    remainingPayment = 0.0;
                }
            }
            
            // Recalculate student total pending amount AFTER dues are updated
            Double rawPending = dueRepository.sumAllPendingAmountByStudentId(student.getId());
            double pending = rawPending != null ? rawPending : 0.0;
            student.setTotalPendingAmount(pending);
            student.setNoDueStatus(pending <= 0.0 ? "CLEARED" : "PENDING");
            studentRepository.save(student);
            
            sendConfirmationEmail(student, payment.getAmountPaid(), referenceNo != null ? referenceNo : payment.getId(), payment.getPaymentDate());
        }
        paymentRepository.save(payment);
    }

    /*
 * Operation    : Get Payments By Student
 * Comment      : Validates that the student exists, then retrieves all payment records for that student
 */
    public List<Payment> getPaymentsByStudent(String studentId) {
        Student student = studentRepository.findById(studentId).orElseThrow(() -> new RuntimeException("Student not found with id: " + studentId));
        List<Payment> payments = paymentRepository.findByStudentId(studentId);
        return payments;
    }

    private void sendConfirmationEmail(Student student, Double amountPaid, String referenceNo, LocalDateTime paymentDate) {
        if (student != null && student.getEmail() != null) {
            String dateStr = paymentDate != null 
                ? paymentDate.format(java.time.format.DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a")) 
                : LocalDate.now().toString();
            emailService.sendPaymentConfirmationEmail(student.getEmail(), student.getName(), amountPaid, referenceNo, dateStr);
        }
    }
}
