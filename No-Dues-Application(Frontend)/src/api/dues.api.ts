import api from './axios';
import { API } from './endpoints';
import type { Due } from '../types/models';
import type { CreateDueRequest, UpdateDueRequest, ClearStudentDuesRequest } from '../types/api.types';

export const duesApi = {
  /** GET /api/dues — all dues (SUPERADMIN / DEPARTMENTADMIN / STUDENT) */
  getAll: () =>
    api.get<Due[]>(API.DUES.BASE),

  /** GET /api/dues — student's own dues */
  getMyDues: () =>
    api.get<Due[]>(API.DUES.BASE),

  /** POST /api/dues — create raw due entity (DEPARTMENTADMIN) */
  create: (data: Partial<Due>) =>
    api.post<Due>(API.DUES.BASE, data),

  /** GET /api/dues/:id */
  getById: (id: string) =>
    api.get<Due>(API.DUES.BY_ID(id)),

  /** DELETE /api/dues/:id (DEPARTMENTADMIN / SUPERADMIN) */
  delete: (id: string) =>
    api.delete(API.DUES.BY_ID(id)),

  /** POST /pa — create due for student (DEPARTMENTADMIN) */
  createForStudent: (data: CreateDueRequest) =>
    api.post<Due>(API.DUES.CREATE, data),

  /** PUT /api/dues/:id — update due (DEPARTMENTADMIN) */
  update: (id: string, data: UpdateDueRequest) =>
    api.put<Due>(API.DUES.BY_ID(id), data),

  /** POST /api/dues/clear — clear student dues (STUDENT) */
  clearStudentDues: (data: ClearStudentDuesRequest) =>
    api.post(API.DUES.CLEAR, data),

  /** GET /api/dues/api/super-admin/students/:id/dues (SUPERADMIN) */
  getDuesByStudent: (studentId: string) =>
    api.get<Due[]>(API.DUES.BY_STUDENT(studentId)),
};
