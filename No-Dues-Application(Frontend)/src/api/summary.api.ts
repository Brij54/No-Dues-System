import api from './axios';
import { API } from './endpoints';
import type { StudentSummaryRow, SummaryStats } from '../types/summary.types';

export const summaryApi = {
  /**
   * GET /api/summary/no-dues
   * Returns one row per student with financial aggregates and dept-wise amounts.
   * Accessible by: SUPERADMIN, FINANCE_DEPARTMENT admin.
   */
  getSummary: () =>
    api.get<StudentSummaryRow[]>(API.SUMMARY.NO_DUES),

  /**
   * GET /api/summary/no-dues/stats
   * Returns institution-wide aggregate stats for the dashboard cards.
   * Accessible by: SUPERADMIN, FINANCE_DEPARTMENT admin.
   */
  getStats: () =>
    api.get<SummaryStats>(API.SUMMARY.STATS),
};
