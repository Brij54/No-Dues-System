import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { isTokenExpired } from '../utils/jwt';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export default function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { isAuthenticated, accessToken, hasRole, clearAuth } = useAuthStore();

  // Check token expiration
  if (accessToken && isTokenExpired(accessToken)) {
    clearAuth();
    return <Navigate to="/login" replace />;
  }

  if (!isAuthenticated || !accessToken) {
    return <Navigate to="/login" replace />;
  }

  // Check role access
  if (requiredRoles && requiredRoles.length > 0) {
    const hasAccess = requiredRoles.some((role) => hasRole(role));
    if (!hasAccess) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
}
