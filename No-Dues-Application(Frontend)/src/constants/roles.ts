export const Role = {
  SUPER_ADMIN: 'SUPERADMIN',
  DEPARTMENT_ADMIN: 'DEPARTMENTADMIN',
  STUDENT: 'STUDENT',
} as const;

export type RoleType = (typeof Role)[keyof typeof Role];

/** Well-known department name for FINANCE access checks */
export const FINANCE_DEPT_NAME = 'FINANCE';

export const DEPARTMENT_ROLES = [
  { key: 'academics_dt_mtech_imtech', label: 'Academics (DT, M.Tech & IMTech)' },
  { key: 'club', label: 'Club' },
  { key: 'finance', label: 'Finance' },
  { key: 'hostel_female', label: 'Hostel (Female)' },
  { key: 'hostel_male', label: 'Hostel (Male)' },
  { key: 'it', label: 'IT' },
  { key: 'library', label: 'Library' },
  { key: 'lab_ceems', label: 'Lab (CEEMS)' },
  { key: 'lab_hides', label: 'Lab (HIDES)' },
  { key: 'lab_physics', label: 'Lab (Physics)' },
  { key: 'placement', label: 'Placement' },
  { key: 'sports', label: 'Sports' },
  { key: 'pending_degree', label: 'Pending Degree' },
  { key: 'penalty', label: 'Penalty' },
  { key: 'academics_ms_phd', label: 'Academics (MS & PHD)' },
] as const;

export const DUE_STATUS = {
  PENDING: 'PENDING',
  CLEARED: 'CLEARED',
} as const;

export const PAYMENT_STATUS = {
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  PENDING: 'PENDING',
  CLEARED: 'CLEARED',
  MISMATCH: 'MISMATCH',
  NO_DUES: 'NO_DUES',
} as const;

export const NO_DUE_STATUS = {
  PENDING: 'PENDING',
  CLEARED: 'CLEARED',
} as const;
