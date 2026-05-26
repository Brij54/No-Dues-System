import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Role } from '../constants/roles';
import ProtectedRoute from './ProtectedRoute';
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuthStore } from '../store/auth.store';

// Auth pages
import LoginPage from '../pages/auth/LoginPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import UnauthorizedPage from '../pages/auth/UnauthorizedPage';

// Admin pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import StudentsPage from '../pages/admin/StudentsPage';
import DepartmentsPage from '../pages/admin/DepartmentsPage';
import TransactionsPage from '../pages/admin/TransactionsPage';
import CreateDeptAdminsPage from '../pages/admin/CreateDeptAdminsPage';

// Student pages
import StudentDashboard from '../pages/student/StudentDashboard';
import DuesPage from '../pages/student/DuesPage';
import ProfilePage from '../pages/student/ProfilePage';
import PaymentStatus from '../pages/student/PaymentStatus';

// Department pages
import DeptDashboard from '../pages/department/DeptDashboard';
import DeptDuesPage from '../pages/department/DeptDuesPage';

function RootRedirect() {
  const { isAuthenticated, getPrimaryRole } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const role = getPrimaryRole();
  if (role === Role.SUPER_ADMIN) return <Navigate to="/admin" replace />;
  if (role === Role.DEPARTMENT_ADMIN) return <Navigate to="/department" replace />;
  return <Navigate to="/student" replace />;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root redirect */}
        <Route index element={<RootRedirect />} />

        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        {/* Unauthorized */}
        <Route path="unauthorized" element={<UnauthorizedPage />} />

        {/* Super Admin routes */}
        <Route
          element={
            <ProtectedRoute requiredRoles={[Role.SUPER_ADMIN]}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="admin/students" element={<StudentsPage />} />
          <Route path="admin/departments" element={<DepartmentsPage />} />
          <Route path="admin/create-dept-admins" element={<CreateDeptAdminsPage />} />
          <Route path="admin/transactions" element={<TransactionsPage />} />
          <Route path="admin/settings" element={<ProfilePage />} />
        </Route>

        {/* Student routes */}
        <Route
          element={
            <ProtectedRoute requiredRoles={[Role.STUDENT]}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="student" element={<StudentDashboard />} />
          <Route path="student/dues" element={<DuesPage />} />
          <Route path="student/profile" element={<ProfilePage />} />
          <Route path="student/payment/status/:orderId" element={<PaymentStatus />} />
        </Route>

        {/* Department Admin routes */}
        <Route
          element={
            <ProtectedRoute requiredRoles={[Role.DEPARTMENT_ADMIN]}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="department" element={<DeptDashboard />} />
          <Route path="department/dues" element={<DeptDuesPage />} />
          <Route path="department/transactions" element={<TransactionsPage />} />
          <Route path="department/settings" element={<ProfilePage />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
