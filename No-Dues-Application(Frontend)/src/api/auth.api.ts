import api from './axios';
import { API } from './endpoints';
import type { LoginRequest, LoginResponse } from '../types/auth.types';
import type { AssignRoleRequest, RegisterUserDto, UserResource } from '../types/api.types';

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<LoginResponse>(API.AUTH.LOGIN, data),

  register: (data: UserResource) =>
    api.post<string>(API.AUTH.REGISTER, data),

  logout: () =>
    api.post(API.AUTH.LOGOUT),

  addUser: (data: UserResource) =>
    api.post<string>(API.AUTH.ADD_USER, data),

  addUsers: (data: UserResource[]) =>
    api.post<string[]>(API.AUTH.ADD_USERS, data),

  assignRole: (data: AssignRoleRequest) =>
    api.post<string>(API.AUTH.ASSIGN_ROLE, data),

  assignRoleByAdmin: (data: AssignRoleRequest) =>
    api.post<string>(API.AUTH.ASSIGN_ROLE_BY_ADMIN, data),

  forgotPassword: (email: string) =>
    api.post<string>(API.AUTH.FORGOT_PASSWORD, { email }),

  resetPassword: (data: { email: string; otp: string; newPassword: string }) =>
    api.post<string>(API.AUTH.RESET_PASSWORD, data),
};
