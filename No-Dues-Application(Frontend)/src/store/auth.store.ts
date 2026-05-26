import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../api/auth.api';
import { decodeToken, isTokenExpired } from '../utils/jwt';
import type { DecodedToken } from '../types/auth.types';
import { Role, FINANCE_DEPT_NAME } from '../constants/roles';

interface AuthStore {
  accessToken: string | null;
  refreshToken: string | null;
  user: DecodedToken | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setTokens: (access: string, refresh: string) => void;
  clearAuth: () => void;
  hasRole: (role: string) => boolean;
  getRoles: () => string[];
  getPrimaryRole: () => string | null;
  getManagedDepartments: () => string[];
  isFinanceDeptAdmin: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        const response = await authApi.login({ userName: email, password });
        const { access_token, refresh_token } = response.data;
        const decoded = decodeToken(access_token);

        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);

        set({
          accessToken: access_token,
          refreshToken: refresh_token,
          user: decoded,
          isAuthenticated: true,
        });
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch {
          // silently fail — we clear local state regardless
        }
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
        });
      },

      setTokens: (access: string, refresh: string) => {
        const decoded = decodeToken(access);
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        set({
          accessToken: access,
          refreshToken: refresh,
          user: decoded,
          isAuthenticated: !!decoded && !isTokenExpired(access),
        });
      },

      clearAuth: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
        });
      },

      hasRole: (role: string) => {
        const { user, accessToken } = get();
        if (!user || !accessToken || isTokenExpired(accessToken)) return false;
        const roles = user.resource_access?.['backend-api']?.roles ?? [];
        return roles.includes(role);
      },

      getRoles: () => {
        const { user } = get();
        return user?.resource_access?.['backend-api']?.roles ?? [];
      },

      getPrimaryRole: () => {
        const roles = get().getRoles();
        if (roles.includes(Role.SUPER_ADMIN)) return Role.SUPER_ADMIN;
        if (roles.includes(Role.DEPARTMENT_ADMIN)) return Role.DEPARTMENT_ADMIN;
        if (roles.includes(Role.STUDENT)) return Role.STUDENT;
        return null;
      },

      getManagedDepartments: () => {
        const roles = get().getRoles();
        const baseRoles = [Role.SUPER_ADMIN, Role.DEPARTMENT_ADMIN, Role.STUDENT];
        return roles.filter((role: string) => !baseRoles.includes(role as any));
      },

      /**
       * Returns true if the user is a DEPARTMENT_ADMIN who manages the FINANCE department.
       * Checks both Keycloak roles (department names) and base role.
       */
      isFinanceDeptAdmin: () => {
        const { hasRole, getManagedDepartments } = get();
        if (!hasRole(Role.DEPARTMENT_ADMIN)) return false;
        const depts = getManagedDepartments();
        return depts.some(
          (d) => d.toUpperCase().includes(FINANCE_DEPT_NAME)
        );
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
