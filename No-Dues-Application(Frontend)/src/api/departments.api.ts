import api from './axios';
import { API } from './endpoints';
import type { Department } from '../types/models';
import type { CreateDepartmentRequest, UpdateDepartmentRequest } from '../types/api.types';

export const departmentsApi = {
  /** GET /api/departments — all departments */
  getAll: () =>
    api.get<Department[]>(API.DEPARTMENTS.BASE),

  /** GET /api/departments/:id */
  getById: (id: string) =>
    api.get<Department>(API.DEPARTMENTS.BY_ID(id)),

  /** POST /api/departments — create department (SUPERADMIN) */
  create: (data: CreateDepartmentRequest) =>
    api.post<Department>(API.DEPARTMENTS.BASE, data),

  /** PUT /api/departments/:id — update department (SUPERADMIN) */
  update: (id: string, data: UpdateDepartmentRequest) =>
    api.put<Department>(API.DEPARTMENTS.BY_ID(id), data),

  /** DELETE /api/departments/:id (SUPERADMIN) */
  delete: (id: string) =>
    api.delete(API.DEPARTMENTS.BY_ID(id)),
};
