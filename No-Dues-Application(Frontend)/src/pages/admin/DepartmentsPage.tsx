import { useEffect, useState } from 'react';
import { Plus, Search, Trash2, Eye } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Drawer from '../../components/ui/Drawer';
import Input from '../../components/ui/Input';
import { StatusBadge } from '../../components/ui/Badge';
import { departmentsApi } from '../../api/departments.api';
import type { Department } from '../../types/models';
// formatDate removed — Department entity has no date fields
import toast from 'react-hot-toast';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptDesc, setNewDeptDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [viewDept, setViewDept] = useState<Department | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);

  useEffect(() => { loadDepartments(); }, []);

  async function loadDepartments() {
    setLoading(true);
    try {
      const res = await departmentsApi.getAll();
      setDepartments(res.data);
    } catch {
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!newDeptName.trim()) return;
    setCreating(true);
    try {
      await departmentsApi.create({ name: newDeptName, description: newDeptDesc, isActive: true });
      toast.success('Department created');
      setShowCreate(false);
      setNewDeptName('');
      setNewDeptDesc('');
      loadDepartments();
    } catch {
      toast.error('Failed to create department');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await departmentsApi.delete(deleteTarget.id);
      toast.success('Department deleted');
      setDeleteTarget(null);
      loadDepartments();
    } catch {
      toast.error('Failed to delete department');
    }
  }

  const filtered = departments.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Departments</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage departments and their admins</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48 text-slate-900 dark:text-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>
            Add Department
          </Button>
        </div>
      </div>

      {/* Department grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-40 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-slate-400">No departments found</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(dept => (
            <Card key={dept.id} hover onClick={() => setViewDept(dept)} className="cursor-pointer">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">{dept.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{dept.description || 'No description'}</p>
                </div>
                <StatusBadge status={dept.isActive ? 'active' : 'inactive'} />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {dept.isActive ? 'Active' : 'Inactive'}
                </span>
                <div className="flex gap-1">
                  <button className="p-1.5 rounded-md text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition" onClick={(e) => { e.stopPropagation(); setViewDept(dept); }}>
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition" onClick={(e) => { e.stopPropagation(); setDeleteTarget(dept); }}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create Department"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={creating}>Create</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Department Name" placeholder="e.g. Library, IT Department" value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} />
          <Input label="Description (optional)" placeholder="Brief description" value={newDeptDesc} onChange={(e) => setNewDeptDesc(e.target.value)} />
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Department"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </>
        }
      >
        <p className="text-sm text-slate-500">
          Are you sure you want to delete <strong className="text-slate-700 dark:text-slate-200">{deleteTarget?.name}</strong>? This action cannot be undone.
        </p>
      </Modal>

      {/* Detail Drawer */}
      <Drawer open={!!viewDept} onClose={() => setViewDept(null)} title="Department Details">
        {viewDept && (
          <div className="space-y-4">
            {[
              ['Name', viewDept.name],
              ['Description', viewDept.description || '—'],
              ['Status', viewDept.isActive ? 'Active' : 'Inactive'],
            ].map(([label, value]) => (
              <div key={label as string}>
                <p className="text-xs text-slate-400 mb-1">{label}</p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{value as string}</p>
              </div>
            ))}
          </div>
        )}
      </Drawer>
    </div>
  );
}
