// ── Summary - No Dues — TypeScript types ─────────────────────────────────────

/**
 * One row in the Summary table — maps 1:1 to backend StudentSummaryDTO.
 *
 * departmentAmounts is a dynamic map: deptName → outstanding amount.
 * New departments added by Super Admin will appear here automatically.
 */
export interface StudentSummaryRow {
  studentId: string;
  rollNumber: string;
  name: string;
  email: string;

  /** Sum of all due.amount assigned to this student. */
  totalDue: number;

  /** Sum of all successful payments made by this student. */
  paidAmount: number;

  /**
   * Outstanding balance (non-cleared dues).
   * = SUM(due.amount - due.paidAmount) for non-cleared dues
   */
  duesPending: number;

  /**
   * "CLEARED"      if duesPending === 0
   * "DUES_PENDING" if duesPending > 0
   */
  noDueStatus: 'CLEARED' | 'DUES_PENDING';

  /** true if the student has a pending amount in the "Pending Degree" department. */
  pendingDegree: boolean;

  /**
   * Dynamic department amounts map.
   * Key = department name (as stored in DB), Value = outstanding amount.
   */
  departmentAmounts: Record<string, number>;
}

/**
 * Institution-wide aggregate stats for the dashboard cards.
 * Maps 1:1 to backend SummaryStatsDTO.
 */
export interface SummaryStats {
  totalStudents: number;
  clearedStudents: number;
  pendingStudents: number;
  totalDueAmount: number;
  totalPaidAmount: number;
  totalPendingAmount: number;
}

// ── Filter state types ────────────────────────────────────────────────────────

export interface SummaryFilters {
  search: string;
  noDueStatus: 'ALL' | 'CLEARED' | 'DUES_PENDING';
  department: string; // department name or '' for All
}
