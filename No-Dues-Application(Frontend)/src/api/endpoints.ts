const BASE = '/api';

export const API = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    ADD_USER: '/auth/add_user',
    ADD_USERS: '/auth/add_users',
    ASSIGN_ROLE: '/auth/assign-role',
    ASSIGN_ROLE_BY_ADMIN: '/auth/assign-role-by-admin',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  STUDENTS: {
    BASE: `${BASE}/students`,
    BY_ID: (id: string) => `${BASE}/students/${id}`,
    PENDING_AMOUNT: `${BASE}/students/pending-amount`,
    NO_DUE_STATUS: (id: string) => `${BASE}/students/${id}/no-due-status`,
    DUES_SUMMARY: `${BASE}/students/me/dues/summary`,
    RECALCULATE: (id: string) => `${BASE}/students/${id}/recalculate-pending`,
  },
  DEPARTMENTS: {
    BASE: `${BASE}/departments`,
    BY_ID: (id: string) => `${BASE}/departments/${id}`,
  },
  USERS: {
    BASE: `${BASE}/users`,
    BY_ID: (id: string) => `${BASE}/users/${id}`,
  },
  DUES: {
    BASE: `${BASE}/dues`,
    BY_ID: (id: string) => `${BASE}/dues/${id}`,
    CREATE: `${BASE}/dues/create`,
    CLEAR: `${BASE}/dues/clear`,
    BY_STUDENT: (studentId: string) => `${BASE}/dues/api/super-admin/students/${studentId}/dues`,
  },
  PAYMENTS: {
    BASE: `${BASE}/payments`,
    BY_ID: (id: string) => `${BASE}/payments/${id}`,
    CREATE: `${BASE}/payments/create`,
    VERIFY: (paymentId: string, studentId: string) => `${BASE}/payments/${paymentId}/verify/${studentId}`,
    BY_STUDENT: (studentId: string) => `${BASE}/payments/admin/students/${studentId}/payments`,
    INITIATE: `${BASE}/payments/initiate/razorpay`,
    STATUS: (orderId: string) => `${BASE}/payments/status/${orderId}`,
  },
} as const;
