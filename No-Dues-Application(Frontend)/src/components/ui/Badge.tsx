import { clsx } from 'clsx';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export default function Badge({ variant = 'default', children, className, dot = false }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full',
        {
          'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400': variant === 'success',
          'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400': variant === 'warning',
          'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400': variant === 'danger',
          'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400': variant === 'info',
          'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300': variant === 'default',
        },
        className
      )}
    >
      {dot && (
        <span
          className={clsx('w-1.5 h-1.5 rounded-full', {
            'bg-emerald-500': variant === 'success',
            'bg-amber-500': variant === 'warning',
            'bg-red-500': variant === 'danger',
            'bg-blue-500': variant === 'info',
            'bg-slate-400': variant === 'default',
          })}
        />
      )}
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase();
  let variant: BadgeProps['variant'] = 'default';
  let label = status;

  if (s === 'cleared' || s === 'approved' || s === 'active' || s === 'success') {
    variant = 'success';
    label = s === 'active' ? 'Active' : s === 'success' ? 'Success' : 'Cleared';
  } else if (s === 'pending' || s === 'review' || s === 'provisional') {
    variant = 'warning';
    label = s === 'provisional' ? 'Provisional' : 'Pending';
  } else if (s === 'overdue' || s === 'failed' || s === 'rejected' || s === 'inactive') {
    variant = 'danger';
    label = s === 'inactive' ? 'Inactive' : s === 'failed' ? 'Failed' : s === 'rejected' ? 'Rejected' : 'Overdue';
  } else if (s === 'na' || s === 'not applicable') {
    variant = 'default';
    label = 'N/A';
  }

  return <Badge variant={variant} dot>{label}</Badge>;
}
