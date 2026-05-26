export const Role = {
  SUPER_ADMIN: 'SUPERADMIN',
  DEPARTMENT_ADMIN: 'DEPARTMENTADMIN',
  STUDENT: 'STUDENT',
} as const;

export type RoleType = (typeof Role)[keyof typeof Role];

/** Well-known department name for FINANCE access checks */
export const FINANCE_DEPT_NAME = 'FINANCE';

export const DEPARTMENT_ROLES = [
  { key: 'academics', label: 'Academics Department' },
  { key: 'clubs', label: 'Clubs Department' },
  { key: 'finance', label: 'Finance Department' },
  { key: 'hostel', label: 'Hostel (Warden)' },
  { key: 'it', label: 'IT Department' },
  { key: 'library', label: 'Library (Librarian)' },
  { key: 'lab', label: 'Lab (Lab Assistant)' },
  { key: 'placement', label: 'Placement Committee' },
  { key: 'penalty', label: 'Penalty Department' },
  { key: 'sports', label: 'Sports (Coach)' },
  { key: 'pending_degree', label: 'Pending Degree' },
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
