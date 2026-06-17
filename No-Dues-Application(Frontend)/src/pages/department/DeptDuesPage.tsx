import { useEffect, useState, useCallback } from 'react';
import { Search, Pencil, CreditCard, CheckCircle, Clock, AlertCircle, Upload, Download } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import Drawer from '../../components/ui/Drawer';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Avatar from '../../components/ui/Avatar';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import FileUpload from '../../components/ui/FileUpload';
import ProgressBar from '../../components/ui/ProgressBar';
import Select from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/Badge';
import { duesApi } from '../../api/dues.api';
import { studentsApi } from '../../api/students.api';
import { departmentsApi } from '../../api/departments.api';
import { formatCurrency, formatDate } from '../../utils/format';
import type { Due, Department, Student } from '../../types/models';
import type { ColDef } from 'ag-grid-community';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
import { useAuthStore } from '../../store/auth.store';
import * as XLSX from 'xlsx';

// IMPORTANT - Status Architecture:
//   "No-Dues"      → uploaded/manual value; means student has no outstanding due
//   "Dues-Pending" → uploaded/manual value; means student has outstanding due
//
// Rule: pendingAmount = amount - paidAmount (from backend)
//
// Frontend must NOT transform or map status strings; send them exactly as stored.
// ─────────────────────────────────────────────────────────────────────────────

/** Values allowed in the Edit drawer (admin-selectable) */
const EDITABLE_STATUS_OPTIONS = [
  { value: 'Dues-Pending', label: 'Dues Pending', color: 'amber' },
  { value: 'No-Dues',      label: 'No Dues',      color: 'emerald' },
] as const;

/** Values accepted in bulk upload "No Dues Status" column */
const BULK_VALID_STATUSES = ['No-Dues', 'Dues-Pending'] as const;

// ─── Derived display helpers ──────────────────────────────────────────────────

/**
 * Compute the display pending amount.
 * pendingAmount = amount  (we don't track paidAmount per-due separately, so the
 * due amount IS the pending amount unless the backend clears it to 0).
 * A due is considered "paid/cleared" when its stored status contains "CLEARED"
 * (case-insensitive) or when amount === 0 and status signals no-dues.
 */
function computePendingAmount(due: Due): number {
  const s = (due.status ?? '').toLowerCase();
  // Treat as cleared (pending = 0) when backend marked it CLEARED or PAID
  if (s === 'cleared' || s === 'paid') return 0;
  return Math.max(0, (due.amount ?? 0) - (due.paidAmount ?? 0));
}

/**
 * Derive the display status for a due row.
 * Shows the stored status string exactly (no mapping), 
 * but normalizes legacy database statuses to match UI options.
 */
function deriveDisplayStatus(due: Due): string {
  const s = (due.status ?? '').toLowerCase();
  if (s === 'cleared') return 'No-Dues';
  if (s === 'pending') return 'Dues-Pending';
  return due.status ?? 'Dues-Pending';
}

/** Style tokens for a display status */
function statusStyle(displayStatus: string) {
  const s = displayStatus.toLowerCase();
  if (s === 'cleared' || s === 'no-dues' || s === 'no_dues') {
    return { bg: '#ecfdf5', dot: '#10b981', text: '#059669' };
  }
  if (s === 'dues-pending' || s === 'dues_pending' || s === 'pending') {
    return { bg: '#fffbeb', dot: '#f59e0b', text: '#d97706' };
  }
  // Unknown/legacy values
  return { bg: '#f1f5f9', dot: '#94a3b8', text: '#64748b' };
}

/** Human-readable label for a display status */
function statusLabel(displayStatus: string): string {
  const s = displayStatus.toLowerCase();
  if (s === 'cleared')                                     return 'Cleared';
  if (s === 'no-dues' || s === 'no_dues')                  return 'No Dues';
  if (s === 'dues-pending' || s === 'dues_pending')        return 'Dues Pending';
  if (s === 'pending')                                     return 'Dues Pending';
  return displayStatus; // show raw value for any unknown status
}

// ─── Bulk-upload row type ────────────────────────────────────────────────────
interface BulkRow {
  rollNumber:  string;
  description: string;
  amount:      number;
  /** Exact string from the "No Dues Status" column — sent as-is to backend */
  noDuesStatus: string;
  rowStatus:   'success' | 'failed';
  error?:      string;
}

// ─────────────────────────────────────────────────────────────────────────────

export default function DeptDuesPage() {
  // ─── Core data state ───
  const [dues,        setDues]        = useState<Due[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [students,    setStudents]    = useState<Student[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');

  // ─── Update Drawer state ───
  const [selected,    setSelected]    = useState<Due | null>(null);
  const [drawerOpen,  setDrawerOpen]  = useState(false);
  const [editAmount,  setEditAmount]  = useState('');
  const [editRemarks, setEditRemarks] = useState('');
  const [editStatus,  setEditStatus]  = useState<string>('Dues-Pending');
  const [saving,      setSaving]      = useState(false);

  // ─── Bulk Upload state ───
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkDeptId,     setBulkDeptId]     = useState('');
  const [bulkFile,       setBulkFile]       = useState<File | null>(null);
  const [bulkUploading,  setBulkUploading]  = useState(false);
  const [bulkProgress,   setBulkProgress]   = useState(0);
  const [bulkPreview,    setBulkPreview]    = useState<{
    data:         BulkRow[];
    successCount: number;
    failedCount:  number;
  } | null>(null);

  // ─── Auth / department filtering ───
  const authStore       = useAuthStore();
  const managedDeptNames = authStore.getManagedDepartments();
  const uploadKey = authStore.user?.sub ? `bulk_upload_dues_done_${authStore.user.sub}` : 'bulk_upload_dues_done';

  const adminDepartments = departments.filter((d) =>
    managedDeptNames.some((m) => {
      const roleUpper = m.toUpperCase();
      const deptUpper = d.name.toUpperCase();
      
      // 1. Direct precise mappings
      if (roleUpper === 'ACADEMICS_DT_DEPARTMENT' && deptUpper.includes('ACADEMICS') && (deptUpper.includes('DT') || deptUpper.includes('M.TECH') || deptUpper.includes('IMTECH'))) return true;
      if (roleUpper === 'ACADEMICS_MS_PHD_DEPARTMENT' && deptUpper.includes('ACADEMICS') && (deptUpper.includes('MS') || deptUpper.includes('PHD') || deptUpper.includes('PH.D'))) return true;
      if (roleUpper === 'LAB_CEEMS_ASSISTANT' && deptUpper.includes('LAB') && deptUpper.includes('CEEMS')) return true;
      if (roleUpper === 'LAB_HIDES_ASSISTANT' && deptUpper.includes('LAB') && deptUpper.includes('HIDES')) return true;
      if (roleUpper === 'LAB_PHYSICS_ASSISTANT' && deptUpper.includes('LAB') && deptUpper.includes('PHYSICS')) return true;
      if (roleUpper === 'HOSTEL_FEMALE_WARDEN' && deptUpper.includes('HOSTEL') && deptUpper.includes('FEMALE')) return true;
      if (roleUpper === 'HOSTEL_MALE_WARDEN' && deptUpper.includes('HOSTEL') && deptUpper.includes('MALE')) return true;
      
      // 2. Standard roles (fallback or legacy)
      if (roleUpper === 'CLUBS_DEPARTMENT' && deptUpper.includes('CLUB')) return true;
      if (roleUpper === 'FINANCE_DEPARTMENT' && deptUpper.includes('FINANCE')) return true;
      if (roleUpper === 'IT_DEPARTMENT' && deptUpper.includes('IT')) return true;
      if (roleUpper === 'LIBRARY_LIBRARIAN' && deptUpper.includes('LIBRARY')) return true;
      if (roleUpper === 'PLACEMENT_COMMITTEE' && deptUpper.includes('PLACEMENT')) return true;
      if (roleUpper === 'SPORTS_COACH' && deptUpper.includes('SPORTS')) return true;
      if (roleUpper === 'PENDING_DEGREE_DEPARTMENT' && deptUpper.includes('PENDING') && deptUpper.includes('DEGREE')) return true;
      if (roleUpper === 'PENALTY_DEPARTMENT' && deptUpper.includes('PENALTY')) return true;

      // 3. Backward compatibility split token fallback
      const roleTokens = roleUpper.split('_').filter(t => t && t !== 'DEPARTMENT' && t !== 'DEPT' && t !== 'ASSISTANT' && t !== 'WARDEN' && t !== 'LIBRARIAN' && t !== 'COACH' && t !== 'COMMITTEE');
      const deptTokens = deptUpper.split(/[\s_()&,./+-]+/).filter(t => t && t !== 'DEPARTMENT' && t !== 'DEPT' && t !== 'LAB' && t !== 'HOSTEL' && t !== 'ACADEMICS');
      if (roleTokens.length > 0 && deptTokens.length > 0) {
        return roleTokens.some(rt => deptTokens.some(dt => rt === dt));
      }
      return false;
    })
  );
  const availableDepts = adminDepartments.length > 0 ? adminDepartments : departments;

  useEffect(() => {
    if (availableDepts.length > 0) {
      setBulkDeptId((id) => id || availableDepts[0].id);
    }
  }, [departments, availableDepts]);

  // ─── Load Data ────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [duesRes, deptsRes, studentsRes] = await Promise.all([
        duesApi.getAll(),
        departmentsApi.getAll(),
        import('../../api/students.api')
          .then(m => m.studentsApi.getAll())
          .catch(() => ({ data: [] as Student[] })),
      ]);

      setDues(duesRes.data);
      setDepartments(deptsRes.data);

      // Clean up localStorage flag if no data is available
      if (duesRes.data.length === 0) {
        const currentUploadKey = authStore.user?.sub ? `bulk_upload_dues_done_${authStore.user.sub}` : 'bulk_upload_dues_done';
        localStorage.removeItem(currentUploadKey);
      }

      // Fallback: extract students from due records if the student list API fails
      let allStudents = studentsRes.data;
      if (!allStudents || allStudents.length === 0) {
        const map = new Map<string, Student>();
        duesRes.data.forEach(d => { if (d.student) map.set(d.student.rollNumber, d.student); });
        allStudents = Array.from(map.values());
      }
      setStudents(allStudents);
    } catch {
      toast.error('Failed to load dues data');
    } finally {
      setLoading(false);
    }
  }, [authStore.user?.sub]);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Update Drawer ────────────────────────────────────────────────────────
  function openDrawer(due: Due) {
    setSelected(due);
    setEditAmount(String(due.amount ?? 0));
    setEditRemarks(due.description ?? '');
    // Pre-select current status
    const s = (due.status ?? '').toLowerCase();
    const isNoDues = s === 'cleared' || s === 'no-dues' || s === 'no_dues';
    setEditStatus(isNoDues ? 'No-Dues' : 'Dues-Pending');
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setSelected(null);
  }

  async function handleUpdate() {
    if (!selected) return;
    setSaving(true);
    try {
      // Send status exactly as selected — no transformation
      await duesApi.update(selected.id, {
        description: editRemarks,
        amount:      Number(editAmount) || 0,
        status:      editStatus,
      });

      // Trigger backend recalculation (non-critical — backend updateDue already does it)
      if (selected.student?.id) {
        await studentsApi.recalculatePending(selected.student.id).catch(() => {});
      }

      toast.success('Due updated successfully');
      closeDrawer();
      await loadData();
    } catch {
      toast.error('Failed to update due');
    } finally {
      setSaving(false);
    }
  }

  // ─── Bulk Upload ──────────────────────────────────────────────────────────
  const downloadTemplate = async () => {
    try {
      const ExcelJS  = (await import('exceljs')).default || await import('exceljs');
      const fileSaver = await import('file-saver');
      const saveAs   = fileSaver.saveAs || (fileSaver as any).default?.saveAs;

      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Dues');

      ws.columns = [
        { header: 'Roll Number',   key: 'rollNumber',   width: 20 },
        { header: 'Name',          key: 'name',         width: 25 },
        { header: 'Email',         key: 'email',        width: 25 },
        { header: 'No Dues Status', key: 'noDuesStatus', width: 22 },
        { header: 'Amount',        key: 'amount',       width: 15 },
        { header: 'Remark',        key: 'remark',       width: 35 },
      ];

      // Column D (No Dues Status): dropdown with only the two allowed values
      for (let i = 2; i <= 1000; i++) {
        ws.getCell(`D${i}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: ['"No-Dues,Dues-Pending"'],
          showErrorMessage: true,
          errorTitle: 'Invalid Status',
          error: 'Please select "No-Dues" or "Dues-Pending" from the dropdown.',
        };
      }

      const buf  = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'dues_upload_template.xlsx');
      toast.success('Template downloaded');
    } catch (err) {
      console.error(err);
      toast.error('Failed to download template');
    }
  };

  const handleBulkPreview = async () => {
    if (!bulkFile) return;
    setBulkUploading(true);
    setBulkProgress(0);

    try {
      const buffer = await bulkFile.arrayBuffer();
      const wb     = XLSX.read(buffer, { type: 'array' });
      const ws     = wb.Sheets[wb.SheetNames[0]];
      const data   = XLSX.utils.sheet_to_json<any>(ws);

      const rows: BulkRow[] = [];

      for (let i = 0; i < data.length; i++) {
        const row         = data[i];
        const rollNumber  = (row['Roll Number']   || '').toString().trim();
        const description = (row['Remark']        || '').toString().trim();
        const rawAmount   = row['Amount'];
        const amount      = Number(rawAmount);
        // Preserve the status string exactly as typed in the spreadsheet
        const noDuesStatus = (row['No Dues Status'] || '').toString().trim();

        let rowStatus: 'success' | 'failed' = 'success';
        let error: string | undefined;

        if (!rollNumber) {
          rowStatus = 'failed';
          error     = 'Missing required field: Roll Number';
        } else if (rawAmount === undefined || rawAmount === null || rawAmount === '' || isNaN(amount) || amount < 0) {
          rowStatus = 'failed';
          error     = 'Amount must be a number greater than or equal to 0';
        } else if (noDuesStatus && !(BULK_VALID_STATUSES as readonly string[]).includes(noDuesStatus)) {
          rowStatus = 'failed';
          error     = `Invalid No Dues Status "${noDuesStatus}". Allowed: No-Dues, Dues-Pending.`;
        } else {
          const student = students.find(s => s.rollNumber.toLowerCase() === rollNumber.toLowerCase());
          if (!student) {
            rowStatus = 'failed';
            error     = 'Student not found with this Roll Number';
          }
        }

        rows.push({ rollNumber, description, amount, noDuesStatus, rowStatus, error });
        setBulkProgress(Math.round((i / Math.max(data.length - 1, 1)) * 50));
      }

      setBulkPreview({
        data:         rows,
        successCount: rows.filter(r => r.rowStatus === 'success').length,
        failedCount:  rows.filter(r => r.rowStatus === 'failed').length,
      });
    } catch {
      toast.error('Failed to parse file');
    } finally {
      setBulkUploading(false);
      setBulkProgress(50);
    }
  };

  const confirmBulkUpload = async () => {
    if (!bulkPreview) return;
    const valid = bulkPreview.data.filter(r => r.rowStatus === 'success');
    if (valid.length === 0) return;

    // Strategy 1 Check: Fail entire upload if there are any validation errors
    if (bulkPreview.failedCount > 0) {
      toast.error('Cannot proceed. Please fix all validation errors before uploading.');
      return;
    }

    setBulkUploading(true);
    let created = 0;
    let hasErrorOccurred = false;

    for (let i = 0; i < valid.length; i++) {
      const row     = valid[i];
      const student = students.find(s => s.rollNumber.toLowerCase() === row.rollNumber.toLowerCase());
      if (!student) {
        toast.error(`Student not found for roll number ${row.rollNumber}. Skipping.`);
        continue;
      }

      try {
        await duesApi.createForStudent({
          studentId:    student.id,
          description:  row.description,
          amount:       row.amount,
          status:       row.noDuesStatus || undefined,
          departmentId: bulkDeptId || undefined,
        } as any);
        created++;
      } catch (err: any) {
        hasErrorOccurred = true;
        toast.error(`Upload halted due to server error at row ${i + 1}.`);
        break; // Stop immediately under Strategy 1
      }
      setBulkProgress(50 + Math.round(((i + 1) / valid.length) * 50));
    }

    if (hasErrorOccurred) {
      setBulkUploading(false);
      setBulkProgress(0);
      await loadData();
      return;
    }

    toast.success(`Successfully uploaded all ${created} due record(s).`);
    localStorage.setItem(uploadKey, 'true');
    setBulkPreview(null);
    setBulkFile(null);
    setBulkUploading(false);
    setBulkProgress(0);
    setShowBulkUpload(false);
    await loadData();
  };

  // ─── Derived Stats (use computed pending amount) ──────────────────────────
  const pendingDues   = dues.filter(d => computePendingAmount(d) > 0);
  const clearedDues   = dues.filter(d => computePendingAmount(d) === 0);
  const totalPending  = pendingDues.reduce((s, d) => s + computePendingAmount(d), 0);

  // ─── AG Grid Column Definitions ──────────────────────────────────────────
  const columnDefs: ColDef<Due>[] = [
    {
      headerName: 'Roll Number',
      minWidth: 140,
      valueGetter: (p: any) => p.data?.student?.rollNumber || '—',
      cellStyle: { fontFamily: 'monospace', fontWeight: 500 },
    },
    {
      headerName: 'Student Name',
      minWidth: 160,
      valueGetter: (p: any) => p.data?.student?.name || '—',
    },
    {
      headerName: 'Email',
      minWidth: 200,
      valueGetter: (p: any) => p.data?.student?.email || '—',
    },
    {
      headerName: 'Department',
      minWidth: 140,
      valueGetter: (p: any) => p.data?.department?.name || '—',
    },
    {
      headerName: 'Amount',
      field: 'amount',
      minWidth: 120,
      valueFormatter: (p: any) => p.value != null ? formatCurrency(p.value) : '—',
      cellStyle: { fontFamily: 'monospace', fontWeight: 600 },
    },
    {
      // Pending Amount: ₹0 Cleared  OR  ₹<amount>
      headerName: 'Pending Amount',
      minWidth: 150,
      valueGetter: (p: any) => (p.data ? computePendingAmount(p.data) : 0),
      cellRenderer: (p: any) => {
        const pending = p.value as number;
        if (pending === 0) {
          return (
            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#059669' }}>
              {formatCurrency(0)}{' '}
              <span style={{ fontSize: '10px', fontWeight: 600, color: '#059669', opacity: 0.8 }}>
                Cleared
              </span>
            </span>
          );
        }
        return (
          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#dc2626' }}>
            {formatCurrency(pending)}
          </span>
        );
      },
    },
    {
      headerName: 'Due Status',
      field: 'status',
      minWidth: 160,
      valueGetter: (p: any) => (p.data ? deriveDisplayStatus(p.data) : '—'),
      cellRenderer: (p: any) => {
        const display = p.value as string;
        const style   = statusStyle(display);
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '2px 10px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 600,
              background: style.bg,
              color: style.text,
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: style.dot }} />
            {statusLabel(display)}
          </span>
        );
      },
    },
    {
      headerName: 'Remarks',
      field: 'description',
      minWidth: 200,
      valueGetter: (p: any) => p.data?.description || '—',
    },
    {
      headerName: 'Created',
      field: 'createdAt',
      minWidth: 120,
      valueFormatter: (p: any) => p.value ? formatDate(p.value) : '—',
    },
    {
      headerName: 'Actions',
      minWidth: 120,
      sortable: false,
      filter: false,
      cellRenderer: (p: any) => (
        <button
          onClick={(e) => { e.stopPropagation(); openDrawer(p.data); }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 transition-all duration-150"
        >
          <Pencil className="w-3.5 h-3.5" />
          Update
        </button>
      ),
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Student Dues</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            View and manage all student due records for your department
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, roll no, email..."
              className="pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64 text-slate-900 dark:text-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            icon={<Upload className="w-4 h-4" />}
            onClick={() => setShowBulkUpload(true)}
            disabled={localStorage.getItem(uploadKey) === 'true' && dues.length > 0}
            title={localStorage.getItem(uploadKey) === 'true' && dues.length > 0 ? "Bulk upload can only be performed once" : undefined}
          >
            Bulk Upload
          </Button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Records"        value={dues.length}              icon={CreditCard}   color="indigo"  />
        <StatCard title="Dues Pending"         value={pendingDues.length}       icon={Clock}        color="amber"   />
        <StatCard title="Cleared / No Dues"    value={clearedDues.length}       icon={CheckCircle}  color="emerald" />
        <StatCard title="Total Pending Amount" value={formatCurrency(totalPending)} icon={AlertCircle} color="red" />
      </div>

      {/* ── AG Grid Table ── */}
      <DataTable
        rowData={dues}
        columnDefs={columnDefs}
        loading={loading}
        quickFilterText={search}
        onRowClick={openDrawer}
      />

      {/* ════════════════════════════════════════════════════════════════════
          Update Due Drawer
          ════════════════════════════════════════════════════════════════════ */}
      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        title="Update Due Record"
        description={selected?.student ? `${selected.student.name} — ${selected.student.rollNumber}` : undefined}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={closeDrawer}>Cancel</Button>
            <Button onClick={handleUpdate} loading={saving}>Submit</Button>
          </>
        }
      >
        {selected && (
          <div className="space-y-6">

            {/* Student info header */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-200 dark:border-slate-600">
              <Avatar name={selected.student?.name || 'Unknown'} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold text-slate-900 dark:text-white truncate">
                  {selected.student?.rollNumber || '—'}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                  {selected.student?.email || '—'}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                  {selected.student?.name || '—'}
                </p>
              </div>
            </div>

            {/* Read-only info grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Department',      selected.department?.name || '—'],
                ['Created',         selected.createdAt ? formatDate(selected.createdAt) : '—'],
                ['Current Status',  statusLabel(deriveDisplayStatus(selected))],
                ['Pending Amount',  formatCurrency(computePendingAmount(selected))],
              ].map(([label, value]) => (
                <div
                  key={label as string}
                  className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-200/60 dark:border-slate-600/40"
                >
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 mb-1">
                    {label}
                  </p>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                    {String(value)}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700" />

            {/* Amount field */}
            <Input
              label="Amount (update only if the collectible amount changes)"
              type="number"
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              placeholder="0"
            />

            {/* Remarks field */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Remarks (if any)
              </label>
              <textarea
                value={editRemarks}
                onChange={(e) => setEditRemarks(e.target.value)}
                placeholder="e.g. Library Books: NIL & Internship/ Thesis Report: Submitted"
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-lg border text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0 border-slate-300 dark:border-slate-600 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition-colors duration-200"
              />
            </div>

            {/* Status selector — only No-Dues and Dues-Pending; CLEARED is auto-derived */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                No Dues Status
              </label>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                "Cleared" is set automatically when the student pays in full.
              </p>
              <div className="flex flex-wrap gap-2">
                {EDITABLE_STATUS_OPTIONS.map((opt) => {
                  const isActive = editStatus === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setEditStatus(opt.value)}
                      className={clsx(
                        'px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 border-2',
                        isActive && opt.color === 'amber'
                          ? 'bg-amber-50 text-amber-700 border-amber-400 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-600 shadow-sm'
                          : isActive && opt.color === 'emerald'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-400 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-600 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-600 dark:hover:bg-slate-700'
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        )}
      </Drawer>

      {/* ════════════════════════════════════════════════════════════════════
          Bulk Upload Drawer
          ════════════════════════════════════════════════════════════════════ */}
      <Drawer
        open={showBulkUpload}
        onClose={() => { setShowBulkUpload(false); setBulkPreview(null); setBulkFile(null); setBulkProgress(0); }}
        title="Bulk Dues Upload"
        size="lg"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => { setShowBulkUpload(false); setBulkPreview(null); setBulkFile(null); setBulkProgress(0); }}
            >
              Cancel
            </Button>
            {bulkPreview && (
              <Button
                icon={<CheckCircle className="w-4 h-4" />}
                onClick={confirmBulkUpload}
                loading={bulkUploading}
                disabled={bulkPreview.successCount === 0 || bulkPreview.failedCount > 0}
                title={bulkPreview.failedCount > 0 ? "Resolve all errors in preview to enable upload" : undefined}
              >
                Confirm Upload ({bulkPreview.successCount})
              </Button>
            )}
          </>
        }
      >
        <div className="space-y-6">

          {/* Warning Banner */}
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-300 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
            <div>
              <p className="text-sm font-bold">Important Notice</p>
              <p className="text-xs opacity-90 mt-0.5">
                Bulk upload can only be performed **once**. Please ensure that all records are complete and accurate before confirming the upload.
              </p>
            </div>
          </div>

          {/* Department selector */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            {availableDepts.length === 1 ? (
              <Input label="Upload Dues For Department *" value={availableDepts[0].name} disabled readOnly />
            ) : (
              <Select
                label="Upload Dues For Department *"
                value={bulkDeptId}
                onChange={(e) => setBulkDeptId(e.target.value)}
                options={availableDepts.map((d) => ({ value: d.id, label: d.name }))}
                placeholder="Select Department"
              />
            )}
          </div>

          {/* Template download (Disabled but not removed) */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 gap-4 opacity-50 pointer-events-none cursor-not-allowed select-none">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Excel Template Format</p>
              <p className="text-xs text-slate-500 mt-1">
                Download and fill the standard Excel template. Status column accepts only{' '}
                <strong>No-Dues</strong> or <strong>Dues-Pending</strong>.
              </p>
            </div>
            <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />} onClick={downloadTemplate} disabled>
              Download Template
            </Button>
          </div>

          {/* Column reference card */}
          <Card>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Expected Excel Columns</p>
            <div className="flex flex-wrap gap-2">
              {['Roll Number', 'Name', 'Email', 'No Dues Status', 'Amount', 'Remark'].map((col) => {
                const isRequired = col === 'Roll Number';
                return (
                  <span
                    key={col}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                      isRequired
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50'
                    }`}
                  >
                    {col}{isRequired ? ' *' : ''}
                  </span>
                );
              })}
            </div>
            <p className="text-xs text-slate-400 mt-2.5">
              * Required. <strong>No Dues Status</strong> accepts: <code>No-Dues</code> or <code>Dues-Pending</code>.
            </p>
          </Card>

          {/* File upload + preview trigger */}
          <Card>
            <FileUpload
              onFileSelect={setBulkFile}
              file={bulkFile}
              onClear={() => { setBulkFile(null); setBulkPreview(null); setBulkProgress(0); }}
            />
            {bulkFile && !bulkUploading && !bulkPreview && (
              <Button className="w-full mt-4" icon={<Upload className="w-4 h-4" />} onClick={handleBulkPreview}>
                Upload & Preview
              </Button>
            )}
            {bulkUploading && (
              <div className="mt-4">
                <ProgressBar
                  value={bulkProgress}
                  label={bulkProgress < 50 ? 'Validating file...' : 'Creating dues...'}
                  color="indigo"
                />
              </div>
            )}
          </Card>

          {/* Preview table */}
          {bulkPreview && (
            <Card>
              <div className="mb-4">
                <h3 className="text-md font-semibold text-slate-900 dark:text-white">Upload Preview</h3>
                <p className="text-xs text-slate-500 mt-1">
                  <span className="text-emerald-600 font-semibold">{bulkPreview.successCount} valid rows</span>
                  {' · '}
                  <span className="text-red-600 font-semibold">{bulkPreview.failedCount} failed rows</span>
                </p>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      {['Roll Number', 'No Dues Status', 'Amount', 'Remarks', 'Row Status'].map((h) => (
                        <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {bulkPreview.data.map((row, i) => (
                      <tr key={i} className={row.rowStatus === 'failed' ? 'bg-red-50/20 dark:bg-red-950/5' : ''}>
                        <td className="px-4 py-3 font-mono font-medium">{row.rollNumber || '—'}</td>
                        <td className="px-4 py-3">
                          {row.noDuesStatus ? (
                            <span
                              className={clsx(
                                'px-2 py-0.5 rounded-full text-[11px] font-semibold',
                                row.noDuesStatus === 'No-Dues'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                  : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                              )}
                            >
                              {row.noDuesStatus}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3 font-mono font-medium">{formatCurrency(row.amount)}</td>
                        <td className="px-4 py-3 max-w-[160px] truncate">{row.description || '—'}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={row.rowStatus} />
                          {row.error && (
                            <p className="text-[10px] text-red-500 mt-1 font-medium">{row.error}</p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

        </div>
      </Drawer>

    </div>
  );
}
