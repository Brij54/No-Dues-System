import { clsx } from 'clsx';

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'indigo' | 'emerald' | 'amber' | 'red';
  className?: string;
}

export default function ProgressBar({
  value,
  max = 100,
  label,
  showValue = true,
  size = 'md',
  color = 'indigo',
  className,
}: ProgressBarProps) {
  const pct = Math.min(Math.round((value / max) * 100), 100);

  return (
    <div className={clsx('space-y-1.5', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-sm">
          {label && <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>}
          {showValue && <span className="font-mono text-slate-500 dark:text-slate-400">{pct}%</span>}
        </div>
      )}
      <div
        className={clsx('w-full rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden', {
          'h-1.5': size === 'sm',
          'h-2.5': size === 'md',
          'h-4': size === 'lg',
        })}
      >
        <div
          className={clsx('h-full rounded-full transition-all duration-500 ease-out', {
            'bg-indigo-500': color === 'indigo',
            'bg-emerald-500': color === 'emerald',
            'bg-amber-500': color === 'amber',
            'bg-red-500': color === 'red',
          })}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
