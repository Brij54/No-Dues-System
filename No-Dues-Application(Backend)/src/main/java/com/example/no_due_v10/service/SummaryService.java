package com.example.no_due_v10.service;

import com.example.no_due_v10.dto.StudentSummaryDTO;
import com.example.no_due_v10.dto.SummaryStatsDTO;
import com.example.no_due_v10.entity.Department;
import com.example.no_due_v10.entity.Student;
import com.example.no_due_v10.repository.DepartmentRepository;
import com.example.no_due_v10.repository.DueRepository;
import com.example.no_due_v10.repository.PaymentRepository;
import com.example.no_due_v10.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service: Summary - No Dues
 *
 * Builds per-student and institution-wide aggregated summaries using
 * exactly 3 optimised JPQL queries — no N+1, no lazy-loading loops.
 *
 * Query plan:
 *   Q0 → departmentRepository.findAll()      : all active department names (column headers)
 *   Q1 → findDeptPendingAmountsGrouped()     : studentId × deptName × pendingAmt
 *   Q2 → findTotalDueAmountByStudent()       : studentId × totalDueAmt
 *   Q3 → findTotalPaidAmountByStudent()      : studentId × totalPaidAmt
 *   Q4 → studentRepository.findAll()         : all students (identity data)
 *
 * Every student's departmentAmounts map is pre-seeded with 0.0 for ALL active
 * departments, so columns for departments with 100% cleared dues still appear.
 *
 * All assembly is done in-memory in O(N) passes with HashMap lookups.
 */
@Service
public class SummaryService {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private DueRepository dueRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    // ─── Status constants ─────────────────────────────────────────────────────

    private static final String CLEARED     = "CLEARED";
    private static final String DUES_PENDING = "DUES_PENDING";

    private static final String PENDING_DEGREE_DEPT = "PENDING DEGREE";

    // ─── Public API ───────────────────────────────────────────────────────────

    /**
     * Returns one {@link StudentSummaryDTO} per student, with all financial
     * aggregates and department-wise outstanding amounts populated.
     */
    public List<StudentSummaryDTO> getSummary() {

        // ── Q0: all active department names (always show every dept as a column) ──
        // This is the key fix: departments whose dues are all cleared still appear.
        List<String> allDeptNames = departmentRepository.findAll().stream()
            .filter(d -> Boolean.TRUE.equals(d.getIsActive()))
            .map(Department::getName)
            .sorted()
            .collect(Collectors.toList());

        // ── Q1: dept-wise outstanding amounts ────────────────────────────────
        // Each row: [studentId(String), deptName(String), pendingAmt(Double)]
        List<Object[]> deptRows = dueRepository.findDeptPendingAmountsGrouped();

        // studentId → (deptName → pendingAmt)
        Map<String, Map<String, Double>> deptAmountByStudent = new HashMap<>();
        // studentId → sum of all dept pending amounts (= total duesPending)
        Map<String, Double> pendingByStudent = new HashMap<>();

        for (Object[] row : deptRows) {
            String studentId = (String) row[0];
            String deptName  = (String) row[1];
            Double amt       = toDouble(row[2]);

            deptAmountByStudent
                .computeIfAbsent(studentId, k -> new HashMap<>())
                .put(deptName, amt);

            pendingByStudent.merge(studentId, amt, Double::sum);
        }

        // ── Q2: total due amounts per student ────────────────────────────────
        // Each row: [studentId(String), totalDue(Double)]
        List<Object[]> dueRows = dueRepository.findTotalDueAmountByStudent();
        Map<String, Double> totalDueByStudent = new HashMap<>();
        for (Object[] row : dueRows) {
            totalDueByStudent.put((String) row[0], toDouble(row[1]));
        }

        // ── Q3: total paid amounts per student ───────────────────────────────
        // Each row: [studentId(String), totalPaid(Double)]
        List<Object[]> payRows = paymentRepository.findTotalPaidAmountByStudent();
        Map<String, Double> totalPaidByStudent = new HashMap<>();
        for (Object[] row : payRows) {
            totalPaidByStudent.put((String) row[0], toDouble(row[1]));
        }

        // ── Q4: all students ─────────────────────────────────────────────────
        List<Student> students = studentRepository.findAll();

        // ── Assemble DTOs ─────────────────────────────────────────────────────
        List<StudentSummaryDTO> result = new ArrayList<>(students.size());

        for (Student s : students) {
            String id = s.getId();

            double totalDue     = totalDueByStudent.getOrDefault(id, 0.0);
            double paidAmount   = totalPaidByStudent.getOrDefault(id, 0.0);
            double duesPending  = Math.max(0.0, pendingByStudent.getOrDefault(id, 0.0));

            String noDueStatus  = (duesPending == 0.0) ? CLEARED : DUES_PENDING;

            // Pre-seed with ALL department names = 0.0, then override with actual pending amounts.
            // This guarantees every department column appears for every student,
            // even when all their dues for that department are cleared.
            Map<String, Double> deptAmounts = new HashMap<>();
            for (String deptName : allDeptNames) {
                deptAmounts.put(deptName, 0.0);
            }
            Map<String, Double> actualPending = deptAmountByStudent.getOrDefault(id, new HashMap<>());
            deptAmounts.putAll(actualPending);

            // pendingDegree: true if there is an outstanding amount in the "Pending Degree" department
            boolean pendingDegree = deptAmounts.entrySet().stream()
                .anyMatch(e -> e.getKey().toUpperCase().contains(PENDING_DEGREE_DEPT)
                               && e.getValue() > 0);

            result.add(StudentSummaryDTO.builder()
                .studentId(id)
                .rollNumber(s.getRollNumber())
                .name(s.getName())
                .email(s.getEmail())
                .totalDue(totalDue)
                .paidAmount(paidAmount)
                .duesPending(duesPending)
                .noDueStatus(noDueStatus)
                .pendingDegree(pendingDegree)
                .departmentAmounts(deptAmounts)
                .build());
        }

        return result;
    }

    /**
     * Returns institution-wide aggregate statistics for the summary dashboard cards.
     * Reuses the same 3 queries as getSummary() without re-fetching student objects.
     */
    public SummaryStatsDTO getStats() {

        // ── Q2: total due amounts ────────────────────────────────────────────
        List<Object[]> dueRows = dueRepository.findTotalDueAmountByStudent();
        double totalDueAmount = dueRows.stream()
            .mapToDouble(r -> toDouble(r[1]))
            .sum();

        // ── Q3: total paid amounts ───────────────────────────────────────────
        List<Object[]> payRows = paymentRepository.findTotalPaidAmountByStudent();
        double totalPaidAmount = payRows.stream()
            .mapToDouble(r -> toDouble(r[1]))
            .sum();

        // ── Q1: dept pending totals → total pending per student ──────────────
        List<Object[]> deptRows = dueRepository.findDeptPendingAmountsGrouped();
        Map<String, Double> pendingByStudent = new HashMap<>();
        for (Object[] row : deptRows) {
            pendingByStudent.merge((String) row[0], toDouble(row[2]), Double::sum);
        }
        double totalPendingAmount = pendingByStudent.values().stream()
            .mapToDouble(Double::doubleValue)
            .sum();

        // ── Q4: student counts ───────────────────────────────────────────────
        List<Student> students = studentRepository.findAll();
        int totalStudents   = students.size();
        int clearedStudents = 0;
        int pendingStudents = 0;

        for (Student s : students) {
            double pending = Math.max(0.0, pendingByStudent.getOrDefault(s.getId(), 0.0));
            if (pending == 0.0) {
                clearedStudents++;
            } else {
                pendingStudents++;
            }
        }

        return SummaryStatsDTO.builder()
            .totalStudents(totalStudents)
            .clearedStudents(clearedStudents)
            .pendingStudents(pendingStudents)
            .totalDueAmount(totalDueAmount)
            .totalPaidAmount(totalPaidAmount)
            .totalPendingAmount(totalPendingAmount)
            .build();
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /** Safely casts an Object[] element to Double (handles Long, BigDecimal, Double). */
    private double toDouble(Object val) {
        if (val == null) return 0.0;
        if (val instanceof Double)                        return (Double) val;
        if (val instanceof Number)                        return ((Number) val).doubleValue();
        return 0.0;
    }
}
