import { clsx } from 'clsx';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export default function LoadingSpinner({ size = 'md', className, label }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className={clsx('flex flex-col items-center justify-center gap-3', className)}>
      <div
        className={clsx(
          'rounded-full border-slate-200 dark:border-slate-700 border-t-indigo-500 animate-spin',
          sizeClasses[size]
        )}
      />
      {label && (
        <p className="text-sm text-slate-500 dark:text-slate-400 animate-pulse">{label}</p>
      )}
    </div>
  );
}
