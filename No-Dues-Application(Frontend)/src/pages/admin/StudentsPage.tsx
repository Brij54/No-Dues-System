import { useEffect, useState, useMemo } from 'react';
import { Search, Download, Upload, CheckCircle, AlertTriangle } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import EmptyState from '../../components/ui/EmptyState';
import Avatar from '../../components/ui/Avatar';
import Drawer from '../../components/ui/Drawer';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import FileUpload from '../../components/ui/FileUpload';
import ProgressBar from '../../components/ui/ProgressBar';
import { StatusBadge } from '../../components/ui/Badge';
import { studentsApi } from '../../api/students.api';
import { authApi } from '../../api/auth.api';
import { formatCurrency } from '../../utils/format';
import type { Student } from '../../types/models';
import type { ColDef } from 'ag-grid-community';
import toast from 'react-hot-toast';

interface PreviewRow {
  rollNumber: string;
  name: string;
  email: string;
  gender: string;
  status: 'success' | 'failed';
  error?: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Bulk Upload State
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<{ data: PreviewRow[]; successCount: number; failedCount: number } | null>(null);

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    setLoading(true);
    try {
      const res = await studentsApi.getAll();
      setStudents(res.data);
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  }

  const columnDefs = useMemo<ColDef<Student>[]>(() => [
    { headerName: 'Name', field: 'name', minWidth: 180, cellStyle: { fontWeight: 500 } },
    { headerName: 'Email', field: 'email', minWidth: 200, cellStyle: { color: '#64748b' } },
    { headerName: 'Roll Number', field: 'rollNumber', minWidth: 140, cellStyle: { fontFamily: 'monospace', fontWeight: 500 } },
    { headerName: 'Gender', field: 'gender', minWidth: 120, valueGetter: (p: any) => p.data?.gender || '—' },
    {
      headerName: 'Pending Amount',
      field: 'totalPendingAmount',
      minWidth: 160,
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
            {formatCurrency(pending ?? 0)}
          </span>
        );
      },
    },
    {
      headerName: 'No-Due Status',
      field: 'noDueStatus',
      minWidth: 140,
      cellRenderer: (params: any) => {
        const rawStatus = params.value ?? '';
        const s = rawStatus.toLowerCase();
        const isNoDues = s === 'no-dues' || s === 'no_dues' || s === 'cleared';
        
        let label = rawStatus || 'Dues Pending';
        if (isNoDues) label = 'No Dues';
        else if (s === 'dues-pending' || s === 'dues_pending' || s === 'pending') label = 'Dues Pending';

        return (
          <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: isNoDues ? '#ecfdf5' : '#fffbeb', color: isNoDues ? '#059669' : '#d97706' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: isNoDues ? '#10b981' : '#f59e0b' }}></span>
              {label}
            </span>
          </div>
        );
      },
    },
  ], []);

  const exportCsv = () => {
    const header = 'Roll Number,Name,Email,Gender,Pending Amount,No-Due Status\n';
    const rows = students.map(s =>
      `${s.rollNumber},${s.name},${s.email},${s.gender || ''},${s.totalPendingAmount ?? 0},${s.noDueStatus ?? 'PENDING'}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'students.csv';
    a.click();
    toast.success('CSV exported');
  };

  // Bulk Upload Functions
  const downloadTemplate = () => {
    const csv = 'Roll Number,Name,Email,Gender\nMT24001,John Doe,john@iiitb.ac.in,Male';
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'student_upload_template.csv';
    a.click();
    toast.success('Template downloaded');
  };

  const handleUploadPreview = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    const rows: PreviewRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
      const rollNumber = values[0] || '';
      const name = values[1] || '';
      const email = values[2] || '';
      const gender = values[3] || '';

      const isValid = !!(rollNumber && name && email);
      rows.push({
        rollNumber,
        name,
        email,
        gender,
        status: isValid ? 'success' : 'failed',
        error: !isValid ? 'Missing required fields (Roll Number, Name, Email)' : undefined,
      });
      setProgress(Math.round((i / (lines.length - 1)) * 100));
    }

    setPreview({
      data: rows,
      successCount: rows.filter(r => r.status === 'success').length,
      failedCount: rows.filter(r => r.status === 'failed').length,
    });
    setUploading(false);
    setProgress(100);
  };

  const confirmUpload = async () => {
    if (!preview) return;
    const valid = preview.data.filter(r => r.status === 'success');
    if (valid.length === 0) return;

    setUploading(true);
    setProgress(10);

    try {
      const payload = valid.map(row => {
        const firstName = row.name.split(' ')[0] || '';
        const lastName = row.name.substring(firstName.length).trim() || ' ';
        return {
          resourceName: 'Student',
          authMap: {
            email: row.email,
            userName: row.email,
            firstName,
            lastName,
            password: 'Password@123'
          },
          resourceMap: {
            name: row.name,
            email: row.email,
            gender: row.gender,
            rollNumber: row.rollNumber,
            totalPendingAmount: 0.0,
            noDueStatus: 'PENDING',
          }
        };
      });

      setProgress(40);
      const response = await authApi.addUsers(payload);
      setProgress(80);

      let created = 0;
      let failed = 0;
      const detailMessages: string[] = [];

      response.data.forEach(res => {
        if (res.includes('User created successfully')) {
          created++;
        } else {
          failed++;
          detailMessages.push(res);
        }
      });

      if (failed > 0) {
        toast.error(`${failed} users failed or already existed.`);
        console.warn('Failed bulk uploads:', detailMessages);
      }
      if (created > 0) {
        toast.success(`${created} students created successfully!`);
        localStorage.setItem('bulk_upload_students_done', 'true');
      }

      setPreview(null);
      setFile(null);
      setShowBulkUpload(false);
      loadStudents();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to perform bulk upload.');
    } finally {
      setProgress(0);
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Students</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage all student records</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search students..."
              className="pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64 text-slate-900 dark:text-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={<Upload className="w-4 h-4" />}
            onClick={() => setShowBulkUpload(true)}
            disabled={students.length > 0 || localStorage.getItem('bulk_upload_students_done') === 'true'}
            title={students.length > 0 || localStorage.getItem('bulk_upload_students_done') === 'true' ? "Bulk upload can only be performed once" : undefined}
          >
            Bulk Upload
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<Download className="w-4 h-4" />}
            onClick={exportCsv}
          >
            Export CSV
          </Button>
        </div>
      </div>

      <DataTable
        rowData={students}
        columnDefs={columnDefs}
        loading={loading}
        quickFilterText={search}
        onRowClick={(row) => setSelectedStudent(row)}
      />

      {/* Student Detail Drawer */}
      <Drawer
        open={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        title="Student Details"
        description={selectedStudent?.rollNumber}
      >
        {selectedStudent && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar name={selectedStudent.name} size="lg" />
              <div>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">{selectedStudent.name}</p>
                <p className="text-sm text-slate-500">{selectedStudent.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                ['Roll Number', selectedStudent.rollNumber],
                ['Gender', selectedStudent.gender || '—'],
                ['Pending Amount', formatCurrency(selectedStudent.totalPendingAmount ?? 0)],
                ['No-Due Status', (() => {
                  const s = (selectedStudent.noDueStatus || '').toLowerCase();
                  if (s === 'no-dues' || s === 'no_dues' || s === 'cleared') return 'No Dues';
                  return 'Dues Pending';
                })()],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <p className="text-xs text-slate-400 mb-1">{label}</p>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{value as string}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Drawer>

      {/* Bulk Upload Drawer */}
      <Drawer
        open={showBulkUpload}
        onClose={() => {
          setShowBulkUpload(false);
          setPreview(null);
          setFile(null);
          setProgress(0);
        }}
        title="Bulk Upload Students"
        size="lg"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setShowBulkUpload(false);
                setPreview(null);
                setFile(null);
                setProgress(0);
              }}
            >
              Cancel
            </Button>
            {preview && (
              <Button
                icon={<CheckCircle className="w-4 h-4" />}
                onClick={confirmUpload}
                loading={uploading}
                disabled={preview.successCount === 0}
              >
                Confirm Upload ({preview.successCount})
              </Button>
            )}
          </>
        }
      >
        <div className="space-y-6">

          {/* Warning Banner */}
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-300 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
            <div>
              <p className="text-sm font-bold">Important Notice</p>
              <p className="text-xs opacity-90 mt-0.5">
                Bulk upload can only be performed **once**. Please ensure that all records are complete and accurate before confirming the upload.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                CSV Template Format
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Download and fill the standard CSV template. Accounts will be created automatically.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={<Download className="w-4 h-4" />}
              onClick={downloadTemplate}
            >
              Download Template
            </Button>
          </div>

          <Card>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Expected CSV Columns
            </p>
            <div className="flex flex-wrap gap-2">
              {['Roll Number', 'Name', 'Email', 'Gender'].map((col, i) => (
                <span
                  key={col}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                    i < 3
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50'
                  }`}
                >
                  {col}{i < 3 ? ' *' : ''}
                </span>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2.5">* Required fields</p>
          </Card>

          <Card>
            <FileUpload
              onFileSelect={setFile}
              file={file}
              onClear={() => {
                setFile(null);
                setPreview(null);
                setProgress(0);
              }}
            />
            {file && !uploading && !preview && (
              <Button
                className="w-full mt-4"
                icon={<Upload className="w-4 h-4" />}
                onClick={handleUploadPreview}
              >
                Upload & Preview
              </Button>
            )}
            {uploading && (
              <div className="mt-4">
                <ProgressBar
                  value={progress}
                  label="Processing..."
                  color="indigo"
                />
              </div>
            )}
          </Card>

          {preview && (
            <Card>
              <div className="mb-4">
                <h3 className="text-md font-semibold text-slate-900 dark:text-white">
                  Upload Preview
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  <span className="text-emerald-600 font-semibold">
                    {preview.successCount} valid rows
                  </span>
                  {' · '}
                  <span className="text-red-600 font-semibold">
                    {preview.failedCount} failed rows
                  </span>
                </p>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      {['Roll Number', 'Name', 'Email', 'Gender', 'Status'].map((h) => (
                        <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {preview.data.map((row, i) => (
                      <tr key={i} className={row.status === 'failed' ? 'bg-red-50/20 dark:bg-red-950/5' : ''}>
                        <td className="px-4 py-3 font-mono font-medium text-slate-700 dark:text-slate-200">{row.rollNumber}</td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{row.name}</td>
                        <td className="px-4 py-3 text-slate-500">{row.email}</td>
                        <td className="px-4 py-3 text-slate-500">{row.gender || '—'}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={row.status} />
                          {row.error && <p className="text-[10px] text-red-500 mt-1 font-medium">{row.error}</p>}
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
