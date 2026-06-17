package com.example.no_due_v10.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO: Institution-wide summary statistics for the No-Dues Summary dashboard.
 * Used by SummaryController → GET /api/summary/no-dues/stats.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SummaryStatsDTO {

    /** Total number of students in the system. */
    private Integer totalStudents;

    /** Number of students with noDueStatus == CLEARED (duesPending == 0). */
    private Integer clearedStudents;

    /** Number of students with duesPending > 0. */
    private Integer pendingStudents;

    /** Sum of all due.amount across all students and all departments. */
    private Double totalDueAmount;

    /** Sum of all successful payments across all students. */
    private Double totalPaidAmount;

    /** Total outstanding balance = totalDueAmount - totalPaidAmount (non-cleared dues). */
    private Double totalPendingAmount;
}
