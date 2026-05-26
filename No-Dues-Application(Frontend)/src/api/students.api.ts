import api from './axios';
import { API } from './endpoints';
import type { Student } from '../types/models';
import type {
  UpdateStudentPendingAmountRequest,
  StudentPendingDuesSummaryResponse,
} from '../types/api.types';

export const studentsApi = {
  /** GET /api/students — all students (SUPERADMIN) */
  getAll: () =>
    api.get<Student[]>(API.STUDENTS.BASE),

  /** POST /api/students — create student (SUPERADMIN) */
  create: (data: Partial<Student>) =>
    api.post<Student>(API.STUDENTS.BASE, data),

  /** GET /api/students/:id */
  getById: (id: string) =>
    api.get<Student>(API.STUDENTS.BY_ID(id)),

  /** PUT /api/students/:id (SUPERADMIN) */
  update: (id: string, data: Partial<Student>) =>
    api.put<Student>(API.STUDENTS.BY_ID(id), data),

  /** DELETE /api/students/:id (SUPERADMIN) */
  delete: (id: string) =>
    api.delete(API.STUDENTS.BY_ID(id)),

  /** PUT /api/students/pending-amount — update pending amount (DEPARTMENTADMIN / SUPERADMIN) */
  updatePendingAmount: (data: UpdateStudentPendingAmountRequest) =>
    api.put<Student>(API.STUDENTS.PENDING_AMOUNT, data),

  /** PUT /api/students/:id/no-due-status — recalculate noDueStatus (DEPARTMENTADMIN / SUPERADMIN) */
  updateNoDueStatus: (studentId: string) =>
    api.put(API.STUDENTS.NO_DUE_STATUS(studentId)),

  /** GET /api/students/me/dues/summary — pending dues summary for current student */
  getDuesSummary: () =>
    api.get<StudentPendingDuesSummaryResponse>(API.STUDENTS.DUES_SUMMARY),

  /** PUT /api/students/:id/recalculate-pending — recalculate total pending */
  recalculatePending: (studentId: string) =>
    api.put<Student>(API.STUDENTS.RECALCULATE(studentId)),
};
