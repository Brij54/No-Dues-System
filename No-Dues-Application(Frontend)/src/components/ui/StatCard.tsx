import { clsx } from 'clsx';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  color?: 'indigo' | 'emerald' | 'amber' | 'red' | 'slate';
  className?: string;
}

export default function StatCard({ title, value, icon: Icon, trend, color = 'indigo', className }: StatCardProps) {
  return (
    <div
      className={clsx(
        'bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 transition-all duration-200 hover:shadow-md',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</p>
        </div>
        <div
          className={clsx('p-2.5 rounded-xl', {
            'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400': color === 'indigo',
            'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400': color === 'emerald',
            'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400': color === 'amber',
            'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400': color === 'red',
            'bg-slate-50 text-slate-600 dark:bg-slate-700 dark:text-slate-400': color === 'slate',
          })}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          {trend.value >= 0 ? (
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-red-500" />
          )}
          <span className={trend.value >= 0 ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}>
            {trend.value >= 0 ? '+' : ''}{trend.value}%
          </span>
          <span className="text-slate-400">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
