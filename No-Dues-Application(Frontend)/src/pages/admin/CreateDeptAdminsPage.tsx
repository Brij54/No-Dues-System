import { useEffect, useState } from 'react';
import { Plus, Trash2, Mail, Phone, Building2, UserPlus, Info, ShieldAlert } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Avatar from '../../components/ui/Avatar';
import { departmentsApi } from '../../api/departments.api';
import { usersApi } from '../../api/users.api';
import { authApi } from '../../api/auth.api';
import type { Department, User } from '../../types/models';
import type { UserResource } from '../../types/api.types';
import toast from 'react-hot-toast';

export default function CreateDeptAdminsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [departmentId, setDepartmentId] = useState('');

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [deptRes, userRes] = await Promise.all([
        departmentsApi.getAll(),
        usersApi.getAll(),
      ]);
      setDepartments(deptRes.data);
      
      // Filter only users with role DEPARTMENTADMIN
      const deptAdmins = userRes.data.filter(
        (u) => u.role === 'DEPARTMENTADMIN'
      );
      setAdmins(deptAdmins);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load department administrators data.');
    } finally {
      setLoading(false);
    }
  }

  // Robust department name lookup from both the direct user object and the department hierarchy
  const getDepartmentForUser = (user: User) => {
    // 1. First, check if the department object is directly nested (fallback)
    const nestedDeptName = (user as any).department?.name;
    if (nestedDeptName) return nestedDeptName;

    // 2. Next, check department-to-users lists
    const matchedDept = departments.find((d) =>
      d.users?.some((u) => u.id === user.id)
    );
    if (matchedDept) return matchedDept.name;

    return '—';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !departmentId) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      
      // Construct the UserResource payload expected by the backend
      const payload: UserResource = {
        resourceName: 'User',
        authMap: {
          email: email.trim(),
          userName: email.trim(), // Use email as the username
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        },
        resourceMap: {
          name: fullName,
          email: email.trim(),
          phone: phone.trim() ? `+91 ${phone.trim()}` : undefined,
          role: 'DEPARTMENTADMIN',
          isActive: true,
          department: {
            id: departmentId,
          },
        },
      };

      // 1. Create the user in Keycloak and local DB via /auth/add_user
      await authApi.addUser(payload);
      
      // 2. Explicitly assign the Keycloak client role DEPARTMENTADMIN
      await authApi.assignRoleByAdmin({
        userName: email.trim(),
        roleName: 'DEPARTMENTADMIN',
      });

      // 3. Assign specific department role
      const selectedDept = departments.find(d => d.id === departmentId);
      if (selectedDept) {
        let deptRole = '';
        const deptName = selectedDept.name.toUpperCase();
        if (deptName.includes('PENALTY')) deptRole = 'PENALTY_DEPARTMENT';
        else if (deptName.includes('FINANCE')) deptRole = 'FINANCE_DEPARTMENT';
        else if (deptName.includes('HOSTEL') && deptName.includes('FEMALE')) deptRole = 'HOSTEL_FEMALE_WARDEN';
        else if (deptName.includes('HOSTEL') && deptName.includes('MALE')) deptRole = 'HOSTEL_MALE_WARDEN';
        else if (deptName.includes('HOSTEL')) deptRole = 'HOSTEL_WARDEN';
        else if (deptName.includes('IT')) deptRole = 'IT_DEPARTMENT';
        else if (deptName.includes('LAB') && deptName.includes('CEEMS')) deptRole = 'LAB_CEEMS_ASSISTANT';
        else if (deptName.includes('LAB') && deptName.includes('HIDES')) deptRole = 'LAB_HIDES_ASSISTANT';
        else if (deptName.includes('LAB') && deptName.includes('PHYSICS')) deptRole = 'LAB_PHYSICS_ASSISTANT';
        else if (deptName.includes('LAB')) deptRole = 'LAB_ASSISTANT';
        else if (deptName.includes('LIBRARY')) deptRole = 'LIBRARY_LIBRARIAN';
        else if (deptName.includes('PLACEMENT')) deptRole = 'PLACEMENT_COMMITTEE';
        else if (deptName.includes('SPORTS')) deptRole = 'SPORTS_COACH';
        else if (deptName.includes('CLUB')) deptRole = 'CLUBS_DEPARTMENT';
        else if (deptName.includes('ACADEMICS') && (deptName.includes('DT') || deptName.includes('M.TECH') || deptName.includes('IMTECH'))) deptRole = 'ACADEMICS_DT_DEPARTMENT';
        else if (deptName.includes('ACADEMICS') && (deptName.includes('MS') || deptName.includes('PHD') || deptName.includes('PH.D'))) deptRole = 'ACADEMICS_MS_PHD_DEPARTMENT';
        else if (deptName.includes('ACADEMICS')) deptRole = 'ACADEMICS_DEPARTMENT';
        else if (deptName.includes('PENDING DEGREE') || deptName.includes('PENDING_DEGREE')) deptRole = 'PENDING_DEGREE_DEPARTMENT';

        if (deptRole) {
          try {
            await authApi.assignRoleByAdmin({
              userName: email.trim(),
              roleName: deptRole,
            });
          } catch (roleErr) {
            console.error(`Failed to assign role ${deptRole}`, roleErr);
            toast.error(`Admin created, but failed to assign ${deptRole} role.`);
          }
        }
      }

      toast.success('Department Administrator created successfully! Welcome email sent.');
      
      // Reset form fields
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setDepartmentId('');
      
      // Reload lists
      await loadData();
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data || 'Failed to create department admin.';
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await usersApi.delete(deleteTarget.id);
      toast.success('Department Administrator deleted successfully.');
      setDeleteTarget(null);
      await loadData();
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to delete department admin.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Building2 className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          Department Admins
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Add new department administrators and assign them to active departments.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Form Column */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border border-slate-200/60 dark:border-slate-700/80 shadow-md">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <UserPlus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Register Admin</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name *"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={submitting}
                  required
                />
                <Input
                  label="Last Name *"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>

              <Input
                label="Email Address *"
                type="email"
                placeholder="john.doe@iiitb.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                required
              />

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Phone Number (Optional)
                </label>
                <div className="flex w-full rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-colors duration-200">
                  <div className="flex items-center px-3 bg-slate-50 dark:bg-slate-800 border-r border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 text-sm font-medium cursor-default">
                    🇮🇳 +91
                  </div>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      if (val.length <= 10) setPhone(val);
                    }}
                    disabled={submitting}
                    className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Select Department *
                </label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border text-sm transition-colors duration-200 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                  disabled={submitting || loading}
                  required
                >
                  <option value="">-- Choose a Department --</option>
                  {departments
                    .filter((d) => d.isActive)
                    .map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full"
                  loading={submitting}
                  icon={<Plus className="w-4 h-4" />}
                >
                  Create Admin
                </Button>
              </div>
            </form>
          </Card>

          {/* Info Card */}
          <Card className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 p-4">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-indigo-800 dark:text-indigo-300 space-y-1">
                <p className="font-semibold">Automatic Password Generation</p>
                <p className="leading-relaxed">
                  No password field is required. The system will automatically generate a secure, temporary password and email it directly to the new admin along with their login instructions.
                </p>
            
              </div>
            </div>
          </Card>
        </div>

        {/* Right Table Column */}
        <div className="lg:col-span-2">
          <Card className="border border-slate-200/60 dark:border-slate-700/80 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Department Administrators
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {admins.length} {admins.length === 1 ? 'admin' : 'admins'} registered
                </p>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3 py-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-14 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg"
                  />
                ))}
              </div>
            ) : admins.length === 0 ? (
              <div className="text-center py-16">
                <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                  No department administrators registered yet.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Use the registration form on the left to add your first administrator.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-700/60">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700/60">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold">Administrator</th>
                      <th className="text-left px-4 py-3 font-semibold">Department</th>
                      <th className="text-left px-4 py-3 font-semibold">Contact Info</th>
                      <th className="text-center px-4 py-3 font-semibold w-16">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-700 dark:text-slate-300">
                    {admins.map((admin) => (
                      <tr
                        key={admin.id}
                        className="hover:bg-slate-50/55 dark:hover:bg-slate-800/20 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={admin.name} size="sm" />
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 dark:text-white truncate">
                                {admin.name}
                              </p>
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 mt-0.5 border border-indigo-100/50 dark:border-indigo-900/30">
                                Dept Admin
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-4 h-4 text-slate-400" />
                            <span>{getDepartmentForUser(admin)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Mail className="w-3.5 h-3.5" />
                            <span className="truncate">{admin.email}</span>
                          </div>
                          {admin.phone && (
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <Phone className="w-3.5 h-3.5" />
                              <span>{admin.phone}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setDeleteTarget(admin)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition"
                            title="Delete Administrator"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Department Admin"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>
              Delete
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400 mb-2">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <span className="font-semibold text-sm">Warning: Irreversible Action</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Are you sure you want to delete <strong className="text-slate-800 dark:text-slate-100">{deleteTarget?.name}</strong>?
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            This will permanently remove their records from the system and revoke their login credentials inside Keycloak. This cannot be undone.
          </p>
        </div>
      </Modal>
    </div>
  );
}
