import { useEffect, useState } from 'react';
import { CreditCard, CheckCircle, Clock } from 'lucide-react';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import EmptyState from '../../components/ui/EmptyState';
import { duesApi } from '../../api/dues.api';
import { formatCurrency, formatDate } from '../../utils/format';
import type { ColDef } from 'ag-grid-community';
import toast from 'react-hot-toast';
import type { Due } from '../../types/models';

import { useAuthStore } from '../../store/auth.store';

export default function DeptDashboard() {
  const [dues, setDues] = useState<Due[]>([]);
  const [loading, setLoading] = useState(true);
  const getManagedDepartments = useAuthStore(state => state.getManagedDepartments);

  useEffect(() => {
    async function load() {
      try {
        const res = await duesApi.getAll();
        setDues(res.data);
      } catch {
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [getManagedDepartments]);

  // Derived stats using pending-amount logic (matches DeptDuesPage)
  // A due is "pending" when its amount > 0 and status is not CLEARED/paid
  function computePending(d: Due): number {
    const s = (d.status ?? '').toLowerCase();
    if (s === 'cleared' || s === 'paid') return 0;
    return Math.max(0, (d.amount ?? 0) - (d.paidAmount ?? 0));
  }

  const pendingDues = dues.filter(d => computePending(d) > 0);
  const clearedDues = dues.filter(d => computePending(d) === 0);
  const totalAmount = pendingDues.reduce((s, d) => s + computePending(d), 0);

  const columnDefs: ColDef<Due>[] = [
    {
      headerName: 'Roll Number',
      minWidth: 150,
      valueGetter: (p: any) => p.data?.student?.rollNumber || '—',
    },
    {
      headerName: 'Description',
      field: 'description',
      minWidth: 200,
    },
    {
      headerName: 'Amount',
      field: 'amount',
      minWidth: 120,
      valueFormatter: (p: any) => p.value != null ? formatCurrency(p.value) : '—',
      cellStyle: { fontFamily: 'monospace', fontWeight: 600 },
    },
    {
      headerName: 'Status',
      field: 'status',
      minWidth: 130,
      cellRenderer: (p: any) => {
        const rawStatus = p.data?.status ?? '';
        const s = rawStatus.toLowerCase();
        const isCleared = s === 'cleared' || s === 'paid' || (p.data && (p.data.amount === 0));
        const isNoDues = s === 'no-dues' || s === 'no_dues';
        const isPending = !isCleared;

        let label = rawStatus;
        if (isCleared) label = 'Cleared';
        else if (isNoDues) label = 'No Dues';
        else if (s === 'dues-pending' || s === 'dues_pending' || s === 'pending') label = 'Dues Pending';

        return (
          <span style={{
            color: isCleared || isNoDues ? '#059669' : '#d97706',
            fontWeight: 600,
          }}>
            {label}
          </span>
        );
      },
    },
    {
      headerName: 'Created',
      field: 'createdAt',
      minWidth: 120,
      valueFormatter: (p: any) => p.value ? formatDate(p.value) : '—',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Department Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Overview of department dues and clearances</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Dues Assigned" value={dues.length} icon={CreditCard} color="indigo" />
        <StatCard title="Pending Records" value={pendingDues.length} icon={Clock} color="amber" />
        <StatCard title="Cleared Records" value={clearedDues.length} icon={CheckCircle} color="emerald" />
        <StatCard title="Pending Amount" value={formatCurrency(totalAmount)} icon={CreditCard} color="red" />
      </div>
      {/* <Card padding="none">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Dues</h2>
        </div>
        {dues.length === 0 && !loading ? (
          <EmptyState title="No recent dues" description="Dues created by this department will appear here." />
        ) : (
          <DataTable rowData={dues} columnDefs={columnDefs} loading={loading} height="400px" />
        )}
      </Card> */}
    </div>
  );
}
