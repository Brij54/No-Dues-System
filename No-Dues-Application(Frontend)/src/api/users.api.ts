import api from './axios';
import { API } from './endpoints';
import type { User } from '../types/models';

export const usersApi = {
  /** GET /api/users — all users (SUPERADMIN) */
  getAll: () =>
    api.get<User[]>(API.USERS.BASE),

  /** POST /api/users — create user (SUPERADMIN) */
  create: (data: Partial<User>) =>
    api.post<User>(API.USERS.BASE, data),

  /** GET /api/users/:id (SUPERADMIN) */
  getById: (id: string) =>
    api.get<User>(API.USERS.BY_ID(id)),

  /** PUT /api/users/:id (SUPERADMIN) */
  update: (id: string, data: Partial<User>) =>
    api.put<User>(API.USERS.BY_ID(id), data),

  /** DELETE /api/users/:id (SUPERADMIN) */
  delete: (id: string) =>
    api.delete(API.USERS.BY_ID(id)),
};
