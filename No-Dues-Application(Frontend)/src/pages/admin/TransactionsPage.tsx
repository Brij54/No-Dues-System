import { useEffect, useState, useMemo } from 'react';
import { Search, RefreshCw, Download, Receipt, ChevronDown, ChevronRight } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { paymentsApi } from '../../api/payment.api';
import { formatCurrency, formatDateTime } from '../../utils/format';
import type { Payment } from '../../types/models';
import type { ColDef } from 'ag-grid-community';
import toast from 'react-hot-toast';

export default function TransactionsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await paymentsApi.getAll();
      setPayments(res.data);
    } catch {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const res = await paymentsApi.getAll();
      setPayments(res.data);
      toast.success('Transactions refreshed');
    } catch {
      toast.error('Failed to refresh');
    } finally {
      setRefreshing(false);
    }
  }



  const filteredPayments = useMemo(() => {
    let data = payments;
    if (statusFilter !== 'ALL') {
      data = data.filter((p) => p.paymentStatus?.toUpperCase() === statusFilter);
    }
    return data;
  }, [payments, statusFilter]);

  const statusOptions = ['ALL', 'SUCCESS', 'INITIATED', 'FAILED'];

  function getDisplayStatus(status?: string): string {
    const s = (status || '').toUpperCase();
    if (s === 'SUCCESS' || s === 'CLEARED' || s === 'NO_DUES') return 'SUCCESS';
    if (s === 'FAILED') return 'FAILED';
    if (s === 'PENDING' || s === 'CREATED' || s === 'INITIATED') return 'INITIATED';
    return s || 'UNKNOWN';
  }

  const getStatusStyle = (status: string) => {
    const s = status?.toUpperCase();
    if (s === 'SUCCESS') return { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' };
    if (s === 'FAILED') return { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' };
    if (s === 'INITIATED') return { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' };
    return { bg: 'bg-slate-50 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-400', dot: 'bg-slate-400' };
  };

  const columnDefs: ColDef<Payment>[] = [
    {
      headerName: 'Roll Number',
      minWidth: 140,
      valueGetter: (p: any) => p.data?.student?.rollNumber || '—',
    },
    {
      headerName: 'Student Name',
      minWidth: 180,
      valueGetter: (p: any) => p.data?.student?.name || '—',
    },
    {
      headerName: 'Student Email',
      minWidth: 220,
      valueGetter: (p: any) => p.data?.student?.email || '—',
    },
    {
      headerName: 'Paid Amount',
      field: 'amountPaid',
      minWidth: 140,
      valueFormatter: (p: any) => p.value != null ? formatCurrency(p.value) : '—',
      cellStyle: { fontFamily: 'monospace', fontWeight: 600 },
    },
    {
      headerName: 'Transaction ID',
      minWidth: 200,
      valueGetter: (p: any) => p.data?.transactionId || p.data?.transactionReference || p.data?.referenceNo || '—',
      cellStyle: { fontFamily: 'monospace', fontSize: '12px' },
    },
    {
      headerName: 'Payment Date',
      minWidth: 180,
      valueGetter: (p: any) => p.data?.paymentDate || p.data?.paymentTime || p.data?.createdAt || '',
      valueFormatter: (p: any) => p.value ? formatDateTime(p.value) : '—',
    },
    {
      headerName: 'Payment Status',
      field: 'paymentStatus',
      minWidth: 150,
      cellRenderer: (p: any) => {
        const displayStatus = getDisplayStatus(p.value);
        const style = getStatusStyle(displayStatus);
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
            {displayStatus === 'INITIATED' ? 'Initiated' : displayStatus === 'SUCCESS' ? 'Success' : displayStatus === 'FAILED' ? 'Failed' : displayStatus}
          </span>
        );
      },
    },
    {
      headerName: 'Payment Mode',
      field: 'paymentMode',
      minWidth: 130,
      valueGetter: (p: any) => p.data?.paymentMode || p.data?.paymentGateway || '—',
    },
    {
      headerName: 'Remarks',
      field: 'remarks',
      minWidth: 180,
      valueGetter: (p: any) => p.data?.remarks || '—',
    },
  ];

  const handleExportCsv = () => {
    const headers = ['Roll Number', 'Student Name', 'Student Email', 'Paid Amount', 'Transaction ID', 'Payment Date', 'Status', 'Mode', 'Remarks'];
    const rows = filteredPayments.map((p) => [
      p.student?.rollNumber || '',
      p.student?.name || '',
      p.student?.email || '',
      p.amountPaid?.toString() || '',
      p.transactionId || p.transactionReference || p.referenceNo || '',
      p.paymentDate || p.paymentTime || p.createdAt || '',
      getDisplayStatus(p.paymentStatus),
      p.paymentMode || p.paymentGateway || '',
      p.remarks || '',
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast.success('Transactions exported');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Transactions</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Loading transaction data...</p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} className="h-16" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Transactions</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {filteredPayments.length} transaction{filteredPayments.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              className="pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-56 text-slate-900 dark:text-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s}</option>
            ))}
          </select>

          {/* Actions */}
          <Button
            variant="outline"
            icon={<RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            Refresh
          </Button>
          <Button
            variant="outline"
            icon={<Download className="w-4 h-4" />}
            onClick={handleExportCsv}
          >
            Export
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: payments.length, color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300' },
          { label: 'Success', value: payments.filter((p) => getDisplayStatus(p.paymentStatus) === 'SUCCESS').length, color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' },
          { label: 'Initiated', value: payments.filter((p) => getDisplayStatus(p.paymentStatus) === 'INITIATED').length, color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' },
          { label: 'Failed', value: payments.filter((p) => getDisplayStatus(p.paymentStatus) === 'FAILED').length, color: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-xl p-4 ${stat.color} border border-slate-200/50 dark:border-slate-700/50`}>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{stat.label}</p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {filteredPayments.length === 0 ? (
        <EmptyState
          icon={<Receipt className="w-8 h-8" />}
          title="No transactions found"
          description={statusFilter !== 'ALL' ? `No ${statusFilter.toLowerCase()} transactions.` : 'Transaction records will appear here once payments are made.'}
        />
      ) : (
        <DataTable
          rowData={filteredPayments}
          columnDefs={columnDefs}
          loading={loading}
          quickFilterText={search}
          pageSize={25}
        />
      )}
    </div>
  );
}
