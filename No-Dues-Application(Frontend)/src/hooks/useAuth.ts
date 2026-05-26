import { useAuthStore } from '../store/auth.store';
import { useCallback } from 'react';
import { Role } from '../constants/roles';

export function useAuth() {
  const store = useAuthStore();

  const isSuperAdmin = useCallback(
    () => store.hasRole(Role.SUPER_ADMIN),
    [store]
  );

  const isDepartmentAdmin = useCallback(
    () => store.hasRole(Role.DEPARTMENT_ADMIN),
    [store]
  );

  const isStudent = useCallback(
    () => store.hasRole(Role.STUDENT),
    [store]
  );

  const isFinanceDeptAdmin = useCallback(
    () => store.isFinanceDeptAdmin(),
    [store]
  );

  return {
    ...store,
    isSuperAdmin,
    isDepartmentAdmin,
    isStudent,
    isFinanceDeptAdmin,
  };
}
