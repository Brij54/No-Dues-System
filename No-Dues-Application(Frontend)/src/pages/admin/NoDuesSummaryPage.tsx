import {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, GridApi } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import {
  Search,
  Download,
  RefreshCw,
  Users,
  CheckCircle,
  Clock,
  TrendingDown,
  DollarSign,
  BarChart3,
  Filter,
  X,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

import { summaryApi } from '../../api/summary.api';
import { formatCurrency } from '../../utils/format';
import type { StudentSummaryRow, SummaryStats } from '../../types/summary.types';

ModuleRegistry.registerModules([AllCommunityModule]);

// ─── Constants ────────────────────────────────────────────────────────────────

const AUTO_REFRESH_INTERVAL_MS = 60_000; // 60 seconds

// ─── Cell renderer helpers ────────────────────────────────────────────────────

function NoDueStatusCell({ value }: { value: string }) {
  const isCleared = value === 'CLEARED';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '2px 10px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        background: isCleared ? '#ecfdf5' : '#fffbeb',
        color: isCleared ? '#059669' : '#d97706',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: isCleared ? '#10b981' : '#f59e0b',
        }}
      />
      {isCleared ? 'Cleared' : 'Dues Pending'}
    </span>
  );
}

function CurrencyCell({ value }: { value: number }) {
  const isZero = !value || value === 0;
  return (
    <span
      style={{
        fontFamily: 'monospace',
        fontWeight: 700,
        color: isZero ? '#059669' : '#dc2626',
      }}
    >
      {formatCurrency(value ?? 0)}
    </span>
  );
}

function PendingDegreeCell({ value }: { value: boolean }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        background: value ? '#fef2f2' : '#f0fdf4',
        color: value ? '#dc2626' : '#16a34a',
      }}
    >
      {value ? 'Yes' : 'No'}
    </span>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function SummaryCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24" />
          <div className="h-7 bg-slate-200 dark:bg-slate-700 rounded w-20 mt-2" />
        </div>
        <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-xl" />
      </div>
    </div>
  );
}

// ─── Summary stat card ────────────────────────────────────────────────────────

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'indigo' | 'emerald' | 'amber' | 'red' | 'violet' | 'blue';
  sub?: string;
}

function SummaryCard({ title, value, icon, color, sub }: SummaryCardProps) {
  const colors = {
    indigo:  { bg: 'bg-indigo-50 dark:bg-indigo-900/30',  text: 'text-indigo-600 dark:text-indigo-400',  ring: 'ring-indigo-100 dark:ring-indigo-900' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-100 dark:ring-emerald-900' },
    amber:   { bg: 'bg-amber-50 dark:bg-amber-900/30',   text: 'text-amber-600 dark:text-amber-400',   ring: 'ring-amber-100 dark:ring-amber-900' },
    red:     { bg: 'bg-red-50 dark:bg-red-900/30',       text: 'text-red-600 dark:text-red-400',       ring: 'ring-red-100 dark:ring-red-900' },
    violet:  { bg: 'bg-violet-50 dark:bg-violet-900/30', text: 'text-violet-600 dark:text-violet-400', ring: 'ring-violet-100 dark:ring-violet-900' },
    blue:    { bg: 'bg-blue-50 dark:bg-blue-900/30',     text: 'text-blue-600 dark:text-blue-400',     ring: 'ring-blue-100 dark:ring-blue-900' },
  };
  const c = colors[color];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">{title}</p>
          <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white truncate">{value}</p>
          {sub && <p className="text-xs text-slate-400 dark:text-slate-500">{sub}</p>}
        </div>
        <div className={clsx('p-2.5 rounded-xl ring-1', c.bg, c.text, c.ring)}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NoDuesSummaryPage() {
  const gridRef = useRef<AgGridReact<StudentSummaryRow>>(null);

  // ── Data state ──
  const [rows,    setRows]    = useState<StudentSummaryRow[]>([]);
  const [stats,   setStats]   = useState<SummaryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // ── Filter state ──
  const [filters, setFilters] = useState<{
    search: string;
    noDueStatus: 'ALL' | 'CLEARED' | 'DUES_PENDING';
  }>({
    search: '',
    noDueStatus: 'ALL',
  });

  // ── Derived: all unique department names (dynamic) ──
  const allDepartments = useMemo(() => {
    const deptSet = new Set<string>();
    rows.forEach(r => Object.keys(r.departmentAmounts ?? {}).forEach(d => deptSet.add(d)));
    return Array.from(deptSet).sort();
  }, [rows]);

  // ── Derived: filtered rows for the grid & cards ──
  const filteredRows = useMemo(() => {
    let data = rows;
    if (filters.noDueStatus !== 'ALL') {
      data = data.filter(r => r.noDueStatus === filters.noDueStatus);
    }
    // search is handled by AG Grid quickFilterText
    return data;
  }, [rows, filters.noDueStatus]);

  // ── Derived: stats computed from filtered rows ──
  const filteredStats = useMemo(() => {
    const totalStudents  = filteredRows.length;
    const cleared        = filteredRows.filter(r => r.noDueStatus === 'CLEARED').length;
    const pending        = totalStudents - cleared;
    const totalDue       = filteredRows.reduce((s, r) => s + (r.totalDue ?? 0), 0);
    const totalPaid      = filteredRows.reduce((s, r) => s + (r.paidAmount ?? 0), 0);
    const totalPending   = filteredRows.reduce((s, r) => s + (r.duesPending ?? 0), 0);
    return { totalStudents, cleared, pending, totalDue, totalPaid, totalPending };
  }, [filteredRows]);

  // ── Load data ──
  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [summaryRes, statsRes] = await Promise.all([
        summaryApi.getSummary(),
        summaryApi.getStats(),
      ]);
      setRows(summaryRes.data);
      setStats(statsRes.data);
      setLastRefreshed(new Date());
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to load summary data';
      setError(msg);
      if (!silent) toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Initial load ──
  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Auto-refresh every 60 seconds ──
  useEffect(() => {
    const timer = setInterval(() => loadData(true), AUTO_REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [loadData]);

  // ── AG Grid column definitions ──
  const columnDefs = useMemo<ColDef<StudentSummaryRow>[]>(() => {
    const fixedCols: ColDef<StudentSummaryRow>[] = [
      // Student details
      {
        headerName: 'Roll Number',
        field: 'rollNumber',
        minWidth: 140,
        pinned: 'left',
        cellStyle: { fontFamily: 'monospace', fontWeight: 600 },
        sort: 'asc',
      },
      {
        headerName: 'Student Name',
        field: 'name',
        minWidth: 180,
        sortable: true,
        cellStyle: { fontWeight: 500 },
      },
      {
        headerName: 'Email',
        field: 'email',
        minWidth: 220,
        cellStyle: { color: '#64748b' },
      },
      // Financial summary
      {
        headerName: 'Total Due',
        field: 'totalDue',
        minWidth: 130,
        sortable: true,
        cellRenderer: (p: any) => <CurrencyCell value={p.value} />,
      },
      {
        headerName: 'Dues Pending',
        field: 'duesPending',
        minWidth: 140,
        sortable: true,
        cellRenderer: (p: any) => <CurrencyCell value={p.value} />,
      },
      {
        headerName: 'Paid Amount',
        field: 'paidAmount',
        minWidth: 130,
        sortable: true,
        cellRenderer: (p: any) => (
          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#059669' }}>
            {formatCurrency(p.value ?? 0)}
          </span>
        ),
      },
    ];

    // Dynamic department columns — one per unique department name in the dataset
    const deptCols: ColDef<StudentSummaryRow>[] = allDepartments.map(deptName => ({
      headerName: deptName,
      minWidth: 130,
      sortable: true,
      valueGetter: (p: any) => p.data?.departmentAmounts?.[deptName] ?? 0,
      cellRenderer: (p: any) => <CurrencyCell value={p.value} />,
    }));

    const trailingCols: ColDef<StudentSummaryRow>[] = [
      {
        headerName: 'Pending Degree',
        field: 'pendingDegree',
        minWidth: 140,
        sortable: true,
        cellRenderer: (p: any) => <PendingDegreeCell value={p.value} />,
      },
      {
        headerName: 'No Due Status',
        field: 'noDueStatus',
        minWidth: 150,
        sortable: true,
        pinned: 'right',
        cellRenderer: (p: any) => <NoDueStatusCell value={p.value} />,
      },
    ];

    return [...fixedCols, ...deptCols, ...trailingCols];
  }, [allDepartments]);

  const defaultColDef = useMemo<ColDef>(() => ({
    sortable: true,
    resizable: true,
    filter: true,
    minWidth: 100,
    flex: 1,
  }), []);

  // ── Export handlers ──
  const exportCSV = useCallback(() => {
    if (!filteredRows.length) { toast.error('No data to export'); return; }

    const depts = allDepartments;
    const headers = [
      'Roll Number', 'Student Name', 'Email',
      'Total Due', 'Dues Pending', 'Paid Amount',
      ...depts,
      'Pending Degree', 'No Due Status',
    ];

    const csvRows = filteredRows.map(r => [
      r.rollNumber,
      r.name,
      r.email,
      r.totalDue ?? 0,
      r.duesPending ?? 0,
      r.paidAmount ?? 0,
      ...depts.map(d => r.departmentAmounts?.[d] ?? 0),
      r.pendingDegree ? 'Yes' : 'No',
      r.noDueStatus === 'CLEARED' ? 'Cleared' : 'Dues Pending',
    ]);

    const csvContent = [headers, ...csvRows]
      .map(row => row.map(v => `"${v}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `no-dues-summary-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  }, [filteredRows, allDepartments]);

  const exportExcel = useCallback(() => {
    if (!filteredRows.length) { toast.error('No data to export'); return; }

    const depts = allDepartments;
    const headers = [
      'Roll Number', 'Student Name', 'Email',
      'Total Due', 'Dues Pending', 'Paid Amount',
      ...depts,
      'Pending Degree', 'No Due Status',
    ];

    const data = filteredRows.map(r => ({
      'Roll Number':   r.rollNumber,
      'Student Name':  r.name,
      'Email':         r.email,
      'Total Due':     r.totalDue ?? 0,
      'Dues Pending':  r.duesPending ?? 0,
      'Paid Amount':   r.paidAmount ?? 0,
      ...Object.fromEntries(depts.map(d => [d, r.departmentAmounts?.[d] ?? 0])),
      'Pending Degree': r.pendingDegree ? 'Yes' : 'No',
      'No Due Status':  r.noDueStatus === 'CLEARED' ? 'Cleared' : 'Dues Pending',
    }));

    const ws = XLSX.utils.json_to_sheet(data, { header: [...headers] });

    // Auto-width columns
    const colWidths = headers.map(h => ({ wch: Math.max(h.length + 2, 12) }));
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'No-Dues Summary');
    XLSX.writeFile(wb, `no-dues-summary-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('Excel exported successfully');
  }, [filteredRows, allDepartments]);

  // ── Clear all filters ──
  const clearFilters = () => {
    setFilters({ search: '', noDueStatus: 'ALL' });
  };
  const hasActiveFilters = filters.noDueStatus !== 'ALL' || filters.search !== '';

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Summary — No Dues</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 ml-10">
            Institution-wide consolidated view of all student dues and payments
            {lastRefreshed && (
              <span className="ml-2 text-xs text-slate-400">
                · Last updated {lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => loadData()}
            disabled={loading}
            id="summary-refresh-btn"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition disabled:opacity-50"
          >
            <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} />
            Refresh
          </button>
          <button
            onClick={exportCSV}
            id="summary-export-csv-btn"
            disabled={loading || !filteredRows.length}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
          <button
            onClick={exportExcel}
            id="summary-export-excel-btn"
            disabled={loading || !filteredRows.length}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Excel
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      {loading && !rows.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <SummaryCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <SummaryCard
            title="Total Students"
            value={filteredStats.totalStudents}
            icon={<Users className="w-5 h-5" />}
            color="indigo"
            sub={`of ${stats?.totalStudents ?? 0} total`}
          />
          <SummaryCard
            title="Cleared"
            value={filteredStats.cleared}
            icon={<CheckCircle className="w-5 h-5" />}
            color="emerald"
            sub={filteredStats.totalStudents > 0 ? `${Math.round((filteredStats.cleared / filteredStats.totalStudents) * 100)}% clearance` : '—'}
          />
          <SummaryCard
            title="Pending"
            value={filteredStats.pending}
            icon={<Clock className="w-5 h-5" />}
            color="amber"
          />
          <SummaryCard
            title="Total Due"
            value={formatCurrency(filteredStats.totalDue)}
            icon={<DollarSign className="w-5 h-5" />}
            color="blue"
          />
          <SummaryCard
            title="Total Paid"
            value={formatCurrency(filteredStats.totalPaid)}
            icon={<TrendingDown className="w-5 h-5" />}
            color="violet"
          />
          <SummaryCard
            title="Total Pending"
            value={formatCurrency(filteredStats.totalPending)}
            icon={<BarChart3 className="w-5 h-5" />}
            color="red"
          />
        </div>
      )}

      {/* ── Filter Bar ── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">

          {/* Global search */}
          <div className="relative flex-1 min-w-[220px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="summary-search-input"
              type="text"
              placeholder="Search name, roll no, email..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder-slate-400"
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            />
          </div>

          {/* No Due Status filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex-shrink-0">Status:</span>
            {(['ALL', 'CLEARED', 'DUES_PENDING'] as const).map(s => (
              <button
                key={s}
                id={`summary-status-filter-${s.toLowerCase()}`}
                onClick={() => setFilters(f => ({ ...f, noDueStatus: s }))}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 border',
                  filters.noDueStatus === s
                    ? s === 'CLEARED'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700'
                      : s === 'DUES_PENDING'
                        ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-600 dark:hover:bg-slate-700'
                )}
              >
                {s === 'ALL' ? 'All' : s === 'CLEARED' ? 'Cleared' : 'Dues Pending'}
              </button>
            ))}
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              id="summary-clear-filters-btn"
              className="inline-flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600 dark:text-red-400 transition"
            >
              <X className="w-3.5 h-3.5" />
              Clear filters
            </button>
          )}

          {/* Result count */}
          <span className="ml-auto text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">
            {filteredRows.length} student{filteredRows.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* ── Error State ── */}
      {error && !loading && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300">
          <div className="flex-1">
            <p className="text-sm font-semibold">Failed to load summary</p>
            <p className="text-xs mt-0.5 opacity-80">{error}</p>
          </div>
          <button
            onClick={() => loadData()}
            className="text-xs font-medium underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── AG Grid Table ── */}
      <div
        className="ag-theme-custom rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700"
        style={{ height: '600px' }}
        id="summary-grid-container"
      >
        <AgGridReact<StudentSummaryRow>
          ref={gridRef}
          rowData={filteredRows}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          pagination={true}
          paginationPageSize={25}
          paginationPageSizeSelector={[10, 25, 50, 100]}
          loading={loading}
          animateRows={true}
          rowSelection="single"
          quickFilterText={filters.search}
          suppressCellFocus={true}
          overlayNoRowsTemplate={
            loading
              ? '<span></span>'
              : '<span style="padding: 20px; color: #94a3b8; font-size: 14px;">No students found matching the current filters.</span>'
          }
        />
      </div>

    </div>
  );
}
