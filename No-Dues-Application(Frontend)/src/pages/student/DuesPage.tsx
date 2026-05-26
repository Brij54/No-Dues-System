import { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { duesApi } from '../../api/dues.api';
import { formatCurrency, formatDate } from '../../utils/format';
import type { Due } from '../../types/models';
import toast from 'react-hot-toast';

export default function DuesPage() {
  const [dues, setDues] = useState<Due[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await duesApi.getMyDues();
        setDues(res.data);
      } catch {
        toast.error('Failed to load dues');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-white dark:bg-slate-800 rounded-xl animate-pulse" />)}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Dues</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">All your pending and cleared dues</p>
      </div>
      {dues.length === 0 ? (
        <EmptyState title="No dues found" description="You have no recorded dues." />
      ) : (
        <div className="space-y-3">
          {dues.map(due => (
            <Card key={due.id}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white">
                    {due.department?.name || 'General Due'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">{due.description || 'No description'}</p>
                  <p className="text-xs text-slate-400">Created: {formatDate(due.createdAt)}</p>
                </div>
                <div className="text-right space-y-1">
                  {due.amount != null && due.amount > 0 && (
                    <p className={`text-lg font-bold font-mono ${due.status?.toUpperCase() === 'CLEARED' || due.status?.toUpperCase() === 'PAID' ? 'text-slate-400 line-through' : 'text-red-600 dark:text-red-400'}`}>
                      {formatCurrency(Math.max(0, due.amount - (due.paidAmount || 0)))}
                    </p>
                  )}
                  <StatusBadge status={due.status || 'PENDING'} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
