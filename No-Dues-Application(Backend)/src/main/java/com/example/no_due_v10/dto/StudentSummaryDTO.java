package com.example.no_due_v10.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.Map;

/**
 * DTO: Student-level No-Dues summary row.
 * Carries per-student financial aggregates and department-wise outstanding amounts.
 * Used by SummaryController → GET /api/summary/no-dues.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentSummaryDTO {

    // ── Student identity ──────────────────────────────────────────────────────
    private String studentId;
    private String rollNumber;
    private String name;
    private String email;

    // ── Financial aggregates ──────────────────────────────────────────────────

    /** Sum of ALL due.amount assigned to this student (across all departments). */
    private Double totalDue;

    /** Sum of amountPaid across all successful payments made by this student. */
    private Double paidAmount;

    /**
     * Outstanding balance = totalDue - paidAmount (clamped to 0 if negative).
     * Computed as SUM(due.amount - due.paidAmount) for non-cleared dues.
     */
    private Double duesPending;

    // ── Status ────────────────────────────────────────────────────────────────

    /**
     * "CLEARED"      if duesPending == 0
     * "DUES_PENDING" if duesPending > 0
     */
    private String noDueStatus;

    /**
     * true if the student has a non-zero pending amount in the "Pending Degree" department.
     */
    private Boolean pendingDegree;

    // ── Department-wise outstanding amounts ───────────────────────────────────

    /**
     * Map of departmentName → outstanding amount for that department.
     * Only departments with dues assigned to this student are included.
     * Dynamic: new departments added by Super Admin appear here automatically.
     */
    @Builder.Default
    private Map<String, Double> departmentAmounts = new HashMap<>();
}
