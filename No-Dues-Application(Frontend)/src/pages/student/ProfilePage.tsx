import { useAuth } from '../../hooks/useAuth';
import Card from '../../components/ui/Card';
import Avatar from '../../components/ui/Avatar';

export default function ProfilePage() {
  const { user, isStudent } = useAuth();
  const name = user?.name || user?.preferred_username || 'User';

  const fields = [
    ['Username', user?.preferred_username || '—'],
    ['Email', user?.email || '—'],
    ['Full Name', name],
  ];

  if (!isStudent()) {
    const allowedRoles = [
      'SUPERADMIN',
      'DEPARTMENTADMIN',
      'STUDENT',
      'LIBRARY',
      'HOSTEL',
      'SPORTS',
      'IT',
      'FINANCE',
      'LAB',
      'ACADEMICS',
      'CLUBS',
      'PLACEMENT',
      'PENALTY',
      'PENDING_DEGREE'
    ];
    const cleanRoles = (user?.resource_access?.['backend-api']?.roles || [])
      .filter(r => allowedRoles.includes(r.toUpperCase()))
      .join(', ') || '—';
    fields.push(['Roles', cleanRoles]);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Profile</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Your account information</p>
      </div>
      <Card>
        <div className="flex items-center gap-5 mb-6">
          <Avatar name={name} size="lg" />
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{name}</h2>
            <p className="text-sm text-slate-500">{user?.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {fields.map(([label, value]) => (
            <div key={label}>
              <p className="text-xs text-slate-400 mb-1">{label}</p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{value}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
