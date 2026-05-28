import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useAuthStore } from "../store/auth.store";

import { Role } from "../constants/roles";
import Avatar from "../components/ui/Avatar";
import ThemeToggle from "../components/ui/ThemeToggle";
import iiitBLogo from "../images/IIITB_logo1.png";
import {
  LayoutDashboard,
  Users,
  Upload,
  Building2,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  CreditCard,
  Receipt,
  Menu,
  ClipboardList,
} from "lucide-react";
import { clsx } from "clsx";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

function getSidebarItems(
  role: string | null,
  isFinanceDept: boolean,
): NavItem[] {
  if (role === Role.SUPER_ADMIN) {
    return [
      {
        label: "Dashboard",
        path: "/admin",
        icon: <LayoutDashboard className="w-5 h-5" />,
      },
      {
        label: "Students",
        path: "/admin/students",
        icon: <GraduationCap className="w-5 h-5" />,
      },

      {
        label: "Departments",
        path: "/admin/departments",
        icon: <Building2 className="w-5 h-5" />,
      },
      {
        label: "Create Department Admins",
        path: "/admin/create-dept-admins",
        icon: <Users className="w-5 h-5" />,
      },
      {
        label: "Transactions",
        path: "/admin/transactions",
        icon: <Receipt className="w-5 h-5" />,
      },
      {
        label: "Settings",
        path: "/admin/settings",
        icon: <Settings className="w-5 h-5" />,
      },
    ];
  }
  if (role === Role.DEPARTMENT_ADMIN) {
    const items: NavItem[] = [
      {
        label: "Dashboard",
        path: "/department",
        icon: <LayoutDashboard className="w-5 h-5" />,
      },
      {
        label: "Student Dues",
        path: "/department/dues",
        icon: <GraduationCap className="w-5 h-5" />,
      },
    ];
    // Only show Transactions for FINANCE department admins
    if (isFinanceDept) {
      items.push({
        label: "Transactions",
        path: "/department/transactions",
        icon: <Receipt className="w-5 h-5" />,
      });
    }
    items.push({
      label: "Settings",
      path: "/department/settings",
      icon: <Settings className="w-5 h-5" />,
    });
    return items;
  }
  // STUDENT
  return [
    {
      label: "Dashboard",
      path: "/student",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      label: "Feedback Form",
      path: "/student/feedback",
      icon: <ClipboardList className="w-5 h-5" />,
    },
    {
      label: "Profile",
      path: "/student/profile",
      icon: <Users className="w-5 h-5" />,
    },
  ];
}

export default function DashboardLayout() {
  const { user, logout, getPrimaryRole, isFinanceDeptAdmin } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const primaryRole = getPrimaryRole();
  const navItems = getSidebarItems(primaryRole, isFinanceDeptAdmin());

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const getDepartmentLabel = (): string => {
    const managedDepts = useAuthStore.getState().getManagedDepartments();
    if (managedDepts.length === 0) return "";

    const roleUpper = managedDepts[0].toUpperCase();

    // Exact matches
    if (roleUpper === 'ACADEMICS_DT_DEPARTMENT') return "Academics (DT)";
    if (roleUpper === 'ACADEMICS_MS_PHD_DEPARTMENT') return "Academics (MS & PHD)";
    if (roleUpper === 'LAB_CEEMS_ASSISTANT') return "Lab (CEEMS)";
    if (roleUpper === 'LAB_HIDES_ASSISTANT') return "Lab (HIDES)";
    if (roleUpper === 'LAB_PHYSICS_ASSISTANT') return "Lab (Physics)";
    if (roleUpper === 'HOSTEL_FEMALE_WARDEN') return "Hostel (Female)";
    if (roleUpper === 'HOSTEL_MALE_WARDEN') return "Hostel (Male)";
    if (roleUpper === 'CLUBS_DEPARTMENT') return "Club";
    if (roleUpper === 'FINANCE_DEPARTMENT') return "Finance";
    if (roleUpper === 'IT_DEPARTMENT') return "IT";
    if (roleUpper === 'LIBRARY_LIBRARIAN') return "Library";
    if (roleUpper === 'PLACEMENT_COMMITTEE') return "Placement";
    if (roleUpper === 'SPORTS_COACH') return "Sports";
    if (roleUpper === 'PENDING_DEGREE_DEPARTMENT') return "Pending Degree";
    if (roleUpper === 'PENALTY_DEPARTMENT') return "Penalty";

    // Fallback cleaning
    return roleUpper
      .replace(/_DEPARTMENT$/, "")
      .replace(/_ASSISTANT$/, "")
      .replace(/_WARDEN$/, "")
      .replace(/_LIBRARIAN$/, "")
      .replace(/_COACH$/, "")
      .replace(/_COMMITTEE$/, "")
      .split("_")
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  const deptLabel = primaryRole === Role.DEPARTMENT_ADMIN ? getDepartmentLabel() : "";

  const roleLabel =
    primaryRole === Role.SUPER_ADMIN
      ? "Super Admin"
      : primaryRole === Role.DEPARTMENT_ADMIN
        ? (deptLabel ? `${deptLabel} Admin` : "Department Admin")
        : "Student";

  const userName =
    user?.name || user?.preferred_username || user?.email || "User";

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300",
          collapsed ? "w-[72px]" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Brand */}
        <div className="h-16 flex items-center gap-3 px-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
            <img
              src={iiitBLogo}
              alt="IIIT-B Logo"
              className="w-full h-full object-contain"
            />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                No-Dues
              </p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                {roleLabel}
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={
                item.path === "/admin" ||
                item.path === "/department" ||
                item.path === "/student"
              }
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white",
                )
              }
            >
              {item.icon}
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle + user */}
        <div className="border-t border-slate-200 dark:border-slate-700 p-2 space-y-2 flex-shrink-0">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-full p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-white transition"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>

          {!collapsed && (
            <div className="flex items-center gap-3 px-2 py-2">
              <Avatar name={userName} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                  {userName}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className={clsx(
              "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition",
              collapsed && "justify-center",
            )}
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-6 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="hidden sm:flex items-center gap-2 pl-2 ml-2 border-l border-slate-200 dark:border-slate-700">
              <Avatar name={userName} size="sm" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                  {userName}
                </p>
                <p className="text-xs text-slate-400 truncate">{roleLabel}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-[1400px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
