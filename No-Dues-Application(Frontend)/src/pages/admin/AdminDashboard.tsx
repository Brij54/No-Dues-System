import { useEffect, useState } from 'react';
import { GraduationCap, Building2, CheckCircle, Clock, AlertTriangle, TrendingUp, Receipt } from 'lucide-react';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import ProgressBar from '../../components/ui/ProgressBar';
import { SkeletonCard } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import { studentsApi } from '../../api/students.api';
import { departmentsApi } from '../../api/departments.api';
import { duesApi } from '../../api/dues.api';
import { paymentsApi } from '../../api/payment.api';
import { formatCurrency } from '../../utils/format';
import toast from 'react-hot-toast';
import type { Student, Department, Due, Payment } from '../../types/models';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    clearedStudents: 0,
    pendingStudents: 0,
    totalDepartments: 0,
    totalPendingDues: 0,
    totalPayments: 0,
  });
  const [deptSummary, setDeptSummary] = useState<{ name: string; totalDues: number; clearedDues: number; pendingDues: number; pendingAmount: number }[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const [studentsRes, deptsRes, duesRes, paymentsRes] = await Promise.allSettled([
        studentsApi.getAll(),
        departmentsApi.getAll(),
        duesApi.getAll(),
        paymentsApi.getAll(),
      ]);

      const students: Student[] = studentsRes.status === 'fulfilled' ? studentsRes.value.data : [];
      const departments: Department[] = deptsRes.status === 'fulfilled' ? deptsRes.value.data : [];
      const dues: Due[] = duesRes.status === 'fulfilled' ? duesRes.value.data : [];
      const payments: Payment[] = paymentsRes.status === 'fulfilled' ? paymentsRes.value.data : [];

      const cleared = students.filter((s) => s.noDueStatus?.toUpperCase() === 'CLEARED').length;
      const pending = students.length - cleared;
      const totalPending = students.reduce((sum, s) => sum + (s.totalPendingAmount || 0), 0);

      setStats({
        totalStudents: students.length,
        clearedStudents: cleared,
        pendingStudents: pending,
        totalDepartments: departments.length,
        totalPendingDues: totalPending,
        totalPayments: payments.length,
      });

      // Build department summary from dues data
      const deptMap = new Map<string, { name: string; totalDues: number; clearedDues: number; pendingDues: number; pendingAmount: number }>();
      for (const due of dues) {
        const deptName = due.department?.name || 'Unknown';
        const entry = deptMap.get(deptName) || { name: deptName, totalDues: 0, clearedDues: 0, pendingDues: 0, pendingAmount: 0 };
        entry.totalDues++;
        if (due.status?.toUpperCase() === 'CLEARED') {
          entry.clearedDues++;
        } else {
          entry.pendingDues++;
          entry.pendingAmount += due.amount || 0;
        }
        deptMap.set(deptName, entry);
      }
      setDeptSummary(Array.from(deptMap.values()));
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Welcome to the Super Admin console</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Overview of the No-Dues Management System</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={stats.totalStudents} icon={GraduationCap} color="indigo" />
        <StatCard title="Cleared" value={stats.clearedStudents} icon={CheckCircle} color="emerald" />
        <StatCard title="Pending" value={stats.pendingStudents} icon={Clock} color="amber" />
        <StatCard title="Departments" value={stats.totalDepartments} icon={Building2} color="slate" />
      </div>

      {/* Pending dues amount */}
      <Card>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Total Pending Dues</h2>
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-2xl font-bold font-mono">{formatCurrency(stats.totalPendingDues)}</span>
          </div>
        </div>
        <ProgressBar
          value={stats.clearedStudents}
          max={stats.totalStudents || 1}
          label="Overall clearance progress"
          color={stats.clearedStudents === stats.totalStudents ? 'emerald' : 'indigo'}
        />
      </Card>

      {/* Department-wise clearance */}
      {/* <Card>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-5">Department-wise Clearance</h2>
        {deptSummary.length === 0 ? (
          <EmptyState
            icon={<Building2 className="w-8 h-8" />}
            title="No department data"
            description="Department-wise breakdown will appear once dues are assigned."
          />
        ) : (
          <div className="space-y-4">
            {deptSummary.map((dept, idx) => {
              const total = dept.totalDues || 0;
              const cleared = dept.clearedDues || 0;
              const pct = total > 0 ? Math.round((cleared / total) * 100) : 0;
              return (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-40 flex-shrink-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                      {dept.name}
                    </p>
                  </div>
                  <div className="flex-1">
                    <div className="h-7 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden relative">
                      <div
                        className={`h-full rounded-lg transition-all duration-700 ${pct === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-end pr-3 text-xs font-semibold font-mono text-slate-600 dark:text-slate-300">
                        {pct}%
                      </span>
                    </div>
                  </div>
                  <div className="w-24 text-right flex-shrink-0">
                    <p className="text-xs font-medium text-emerald-600">{cleared} cleared</p>
                    <p className="text-xs text-slate-400">{dept.pendingDues} pending</p>
                  </div>
                  <div className="w-28 text-right flex-shrink-0">
                    <p className="text-sm font-semibold font-mono text-slate-700 dark:text-slate-200">
                      {formatCurrency(dept.pendingAmount)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card> */}

      {/* Quick stats */}
      <Card>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Quick Stats</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{stats.totalPayments}</p>
              <p className="text-xs text-slate-500">Total Payments</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {stats.totalStudents > 0 ? Math.round((stats.clearedStudents / stats.totalStudents) * 100) : 0}%
              </p>
              <p className="text-xs text-slate-500">Clearance Rate</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-500">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{stats.totalDepartments}</p>
              <p className="text-xs text-slate-500">Active Departments</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
