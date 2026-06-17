package com.example.no_due_v10.controller;

import com.example.no_due_v10.dto.StudentSummaryDTO;
import com.example.no_due_v10.dto.SummaryStatsDTO;
import com.example.no_due_v10.service.SummaryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller: Summary - No Dues
 *
 * Provides institution-wide consolidated views of student dues, payments,
 * and department-wise outstanding amounts.
 *
 * Access:
 *   SUPERADMIN          → full access
 *   FINANCE_DEPARTMENT  → read-only access (same data, no mutations here)
 *   All others          → 403 Forbidden
 */
@RestController
@RequestMapping("/api/summary")
public class SummaryController {

    @Autowired
    private SummaryService summaryService;

    /**
     * GET /api/summary/no-dues
     *
     * Returns one row per student with:
     *   - identity (rollNumber, name, email)
     *   - financial aggregates (totalDue, paidAmount, duesPending)
     *   - noDueStatus (CLEARED / DUES_PENDING)
     *   - pendingDegree flag
     *   - department-wise outstanding amounts (dynamic map)
     *
     * @return List<StudentSummaryDTO>
     */
    @GetMapping("/no-dues")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'FINANCE_DEPARTMENT')")
    public ResponseEntity<List<StudentSummaryDTO>> getNoDuesSummary() {
        return ResponseEntity.ok(summaryService.getSummary());
    }

    /**
     * GET /api/summary/no-dues/stats
     *
     * Returns institution-wide aggregate statistics:
     *   - totalStudents, clearedStudents, pendingStudents
     *   - totalDueAmount, totalPaidAmount, totalPendingAmount
     *
     * @return SummaryStatsDTO
     */
    @GetMapping("/no-dues/stats")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'FINANCE_DEPARTMENT')")
    public ResponseEntity<SummaryStatsDTO> getNoDuesStats() {
        return ResponseEntity.ok(summaryService.getStats());
    }
}
