import { useEffect, useState, useMemo } from 'react';
import { CreditCard, CheckCircle, Clock, Building2, HelpCircle, ArrowRight, AlertTriangle, Info, Bell, ClipboardList } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { SkeletonCard } from '../../components/ui/Skeleton';
import Drawer from '../../components/ui/Drawer';
import { studentsApi } from '../../api/students.api';
import { duesApi } from '../../api/dues.api';
import { paymentsApi, initiatePayment } from '../../api/payment.api';
import { feedbackApi } from '../../api/feedback.api';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/format';
import { loadRazorpayScript } from '../../utils/razorpay';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/auth.store';
import { useNavigate } from 'react-router-dom';
import type { Due, Payment } from '../../types/models';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [totalPending, setTotalPending] = useState(0);
  const [noDueStatus, setNoDueStatus] = useState('PENDING');
  const [duesByDept, setDuesByDept] = useState<Record<string, { pendingAmount: number; totalAmount: number; isCleared: boolean; remarks: string }>>({});
  const [isPaying, setIsPaying] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'CLEARED' | 'NA'>('ALL');
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [showPaymentsDrawer, setShowPaymentsDrawer] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(true);

  function computePendingAmount(due: Due): number {
    const s = (due.status ?? '').toLowerCase();
    if (s === 'cleared' || s === 'paid') return 0;
    return Math.max(0, (due.amount ?? 0) - (due.paidAmount ?? 0));
  }

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Check feedback submission status
      try {
        const feedbackStatusRes = await feedbackApi.checkStatus();
        setFeedbackSubmitted(feedbackStatusRes.data.submitted);
      } catch (err) {
        console.error('Failed to load feedback status', err);
      }

      const [summaryRes, allDuesRes, paymentsRes] = await Promise.allSettled([
        studentsApi.getDuesSummary(),
        duesApi.getAll(), // Will be filtered by backend based on JWT, or we filter here
        paymentsApi.getAll(), // Assuming this returns payments for the current student
      ]);

      if (summaryRes.status === 'fulfilled') {
        setTotalPending(summaryRes.value.data.totalPendingAmount || 0);
        setNoDueStatus(summaryRes.value.data.noDueStatus || 'PENDING');
      }

      if (paymentsRes.status === 'fulfilled') {
        setAllPayments(paymentsRes.value.data);
        setRecentPayments(paymentsRes.value.data.slice(0, 5)); // Show latest 5
      }

      if (allDuesRes.status === 'fulfilled') {
        const dues = allDuesRes.value.data;
        const grouped: Record<string, { pendingAmount: number; totalAmount: number; isCleared: boolean; remarks: string }> = {};

        let calculatedTotalPending = 0;

        // Group by department
        dues.forEach(d => {
          const deptName = d.department?.name || 'General';
          if (!grouped[deptName]) {
            grouped[deptName] = { pendingAmount: 0, totalAmount: 0, isCleared: true, remarks: '' };
          }

          const pending = computePendingAmount(d);
          calculatedTotalPending += pending;

          grouped[deptName].totalAmount += (d.amount ?? 0);

          if (d.status?.toUpperCase() !== 'CLEARED' && d.status?.toUpperCase() !== 'PAID' && pending > 0) {
            grouped[deptName].isCleared = false;
            grouped[deptName].pendingAmount += pending;
            grouped[deptName].remarks = d.description || 'Pending dues';
          } else {
            if (!grouped[deptName].remarks) {
              grouped[deptName].remarks = d.description || 'All dues cleared';
            }
          }
        });

        setTotalPending(calculatedTotalPending);

        // Set default departments if none exist for UI completeness
        const defaultDepts = [
          'Academics (DT, M.Tech & IMTech)',
          'Club',
          'Finance',
          'Hostel (Female)',
          'Hostel (Male)',
          'IT',
          'Library',
          'Lab (CEEMS)',
          'Lab (HIDES)',
          'Lab (Physics)',
          'Placement',
          'Sports',
          'Pending Degree',
          'Penalty',
          'Academics (MS & PHD)'
        ];
        defaultDepts.forEach(d => {
          if (!grouped[d]) {
            grouped[d] = { pendingAmount: 0, totalAmount: 0, isCleared: true, remarks: 'No dues assigned' };
          }
        });

        setDuesByDept(grouped);
      }
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }

  const handlePayment = async (amount: number, deptName?: string) => {
    setIsPaying(true);
    try {
      const res = await loadRazorpayScript();
      if (!res) {
        toast.error('Razorpay SDK failed to load. Are you online?');
        return;
      }

      const paymentRes = await initiatePayment({ amount });

      const options = {
        key: paymentRes.key,
        amount: (amount * 100).toString(),
        currency: "INR",
        name: "No Dues Management System",
        description: `Clearance Payment ${deptName ? 'for ' + deptName : 'Overall'}`,
        order_id: paymentRes.gatewayOrderId,
        handler: function () {
          toast.success("Payment Successful!");
          navigate(`/student/payment/status/${paymentRes.internalOrderId}`);
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: {
          color: "#4f46e5",
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();

      paymentObject.on('payment.failed', function () {
        toast.error('Payment failed. Please try again.');
      });

    } catch (err: any) {
      console.error(err);
      const errorMsg = err.response?.data?.message || 'Could not initiate payment';
      toast.error(errorMsg);
    } finally {
      setIsPaying(false);
    }
  };

  const deptEntries = Object.entries(duesByDept).map(([name, data]) => ({
    name,
    amount: data.isCleared && data.totalAmount > 0 ? data.totalAmount : data.pendingAmount,
    isCleared: data.isCleared,
    isPending: !data.isCleared && data.pendingAmount > 0,
    isNA: data.isCleared && data.totalAmount === 0 && data.remarks === 'No dues assigned',
    remarks: data.remarks
  }));

  const clearedCount = deptEntries.filter(d => d.isCleared && !d.isNA).length;
  const pendingCount = deptEntries.filter(d => d.isPending).length;
  const naCount = deptEntries.filter(d => d.isNA).length;
  const totalDepts = deptEntries.length;

  const pct = totalDepts > 0 ? Math.round(((clearedCount + naCount) / totalDepts) * 100) : 0;
  const isCleared = (noDueStatus === 'CLEARED' || totalPending === 0) && feedbackSubmitted;

  const filteredDepts = deptEntries.filter(d => {
    if (filter === 'ALL') return true;
    if (filter === 'PENDING') return d.isPending;
    if (filter === 'CLEARED') return d.isCleared && !d.isNA;
    if (filter === 'NA') return d.isNA;
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-6 p-4 max-w-7xl mx-auto">
        <SkeletonCard className="h-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto font-sans bg-[#fafafa] dark:bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between pt-4">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Welcome back, {user?.name?.split(' ')[0] || 'Student'}</p>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">No-Dues Dashboard</h1>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium
          ${isCleared
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400'
            : 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400'
          }`}
        >
          <span className={`w-2 h-2 rounded-full animate-pulse ${isCleared ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          {isCleared ? 'Fully Cleared' : 'Clearance Pending'}
        </div>
      </div>

      {/* Main Summary Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-8 justify-between relative overflow-hidden">
        {/* Background decorative blob */}
        <div className={`absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full blur-3xl opacity-50 z-0
          ${isCleared
            ? 'bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/20 dark:to-slate-800'
            : 'bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/20 dark:to-slate-800'
          }`}
        ></div>

        <div className="flex-1 relative z-10">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold mb-4 border
            ${totalPending > 0
              ? 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/50'
              : 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/50'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${totalPending > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
            {totalPending > 0 ? 'Dues Pending' : 'No Dues'}
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total pending amount</p>
          <div className="text-5xl font-extrabold text-slate-900 dark:text-white mt-1 mb-4 flex items-baseline">
            <span className="text-3xl text-slate-400 font-medium mr-1">₹</span>
            {totalPending}
          </div>
          <p className="text-slate-600 dark:text-slate-300 text-sm mb-6 max-w-md">
            {totalPending > 0
              ? <>You have <span className="font-semibold text-slate-900 dark:text-white">{pendingCount} departments</span> with pending dues. Pay them now to clear your dues. </>
              : <>All your dues are cleared. </>
            }
          </p>
          <div className="flex gap-3">
            <Button
              onClick={() => handlePayment(totalPending)}
              disabled={totalPending === 0 || isPaying}
              className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700 rounded-lg px-6 shadow-md transition-transform active:scale-95"
            >
              {isPaying ? 'Processing...' : 'Pay all dues'}
              {!isPaying && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        </div>

        <div className="w-px bg-slate-200 dark:bg-slate-700 hidden md:block z-10"></div>

        <div className="flex-1 relative z-10 pt-2">
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">No-dues completion</span>
            <span className="text-sm font-medium text-slate-500">{clearedCount + naCount}/{totalDepts} cleared</span>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full mb-6 overflow-hidden flex">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${pct}%` }}></div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2 h-2 bg-emerald-500 rounded-sm"></div>
                <span className="text-xl font-bold text-slate-900 dark:text-white">{clearedCount}</span>
              </div>
              <p className="text-xs text-slate-500">Cleared</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2 h-2 bg-amber-500 rounded-sm"></div>
                <span className="text-xl font-bold text-slate-900 dark:text-white">{pendingCount}</span>
              </div>
              <p className="text-xs text-slate-500">Pending</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2 h-2 bg-slate-400 rounded-sm"></div>
                <span className="text-xl font-bold text-slate-900 dark:text-white">{naCount}</span>
              </div>
              <p className="text-xs text-slate-500">N/A</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="space-y-3">
        {!feedbackSubmitted && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-amber-50 dark:bg-amber-950/30 p-5 rounded-2xl border border-amber-200 dark:border-amber-800/60 shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-amber-500 text-white rounded-xl flex-shrink-0">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-amber-900 dark:text-amber-400">Exit Survey Required</h4>
                <p className="text-xs text-amber-800/90 dark:text-amber-300/80 mt-1 max-w-2xl leading-relaxed">
                  You have not submitted the exit survey feedback form yet. Completing this survey is required for your final institute clearance.
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate('/student/feedback')}
              className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl px-5 text-xs font-bold shrink-0 shadow-sm transition-transform active:scale-95"
            >
              Fill Feedback Survey
            </Button>
          </div>
        )}

        {/* <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold">Payment updates may take up to 48 hours to reflect</h4>
            <p className="text-xs opacity-90 mt-0.5">If your payment status hasn't changed after 48 hours, please contact the respective department directly.</p>
          </div>
        </div> */}
      </div>

      {/* Recent Payments & Departments Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Departments */}
        <div className="lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Department Status</h2>
            </div>
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm text-sm overflow-x-auto">
              {['ALL', 'PENDING', 'CLEARED', 'NA'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${filter === f ? 'bg-slate-100 dark:bg-slate-700 font-medium text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50'}`}
                >
                  {f === 'ALL' ? 'All' : f === 'PENDING' ? 'Pending' : f === 'CLEARED' ? 'Cleared' : 'N/A'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredDepts.map((dept) => (
              <div key={dept.name} className={`bg-white dark:bg-slate-800 rounded-xl p-5 border transition-all hover:shadow-md flex flex-col h-full
                ${dept.isPending ? 'border-amber-200 dark:border-amber-800/50 shadow-sm' :
                  dept.isCleared && !dept.isNA ? 'border-emerald-200 dark:border-emerald-800/30' : 'border-slate-200 dark:border-slate-700'}
              `}>
                <div className="flex items-start gap-3 mb-4">
                  <div className={`p-2.5 rounded-lg shrink-0
                    ${dept.isPending ? 'bg-rose-50 text-rose-500 dark:bg-rose-900/20' :
                      dept.isCleared && !dept.isNA ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' :
                        'bg-slate-100 text-slate-500 dark:bg-slate-700'}
                  `}>
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white leading-tight">{dept.name}</h3>
                  </div>
                </div>

                <div className="mb-4 flex-1">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    {dept.isPending ? <AlertTriangle className="w-4 h-4 text-amber-500" /> :
                      dept.isCleared && !dept.isNA ? <CheckCircle className="w-4 h-4 text-emerald-500" /> :
                        <HelpCircle className="w-4 h-4 text-slate-400" />}
                    <span className={`text-sm font-semibold
                      ${dept.isPending ? 'text-amber-700 dark:text-amber-400' :
                        dept.isCleared && !dept.isNA ? 'text-emerald-700 dark:text-emerald-400' :
                          'text-slate-600 dark:text-slate-400'}
                    `}>
                      {dept.isPending ? 'Pending' : dept.isCleared && !dept.isNA ? 'Cleared' : 'Not applicable'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {dept.remarks}
                  </p>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <span className="font-bold font-mono text-slate-900 dark:text-white text-lg">₹{dept.amount}</span>
                  {/* {dept.isPending ? (
                    <>
                      <button
                        onClick={() => handlePayment(dept.amount, dept.name)}
                        className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1 group"
                      >
                        Pay now <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-slate-400">No action required</span>
                  )} */}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Recent Payments */}
        <div className="lg:col-span-1">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Recent Payments</h2>
          <Card padding="none" className="overflow-hidden">
            {recentPayments.length === 0 ? (
              <div className="p-6 text-center text-slate-500 dark:text-slate-400 text-sm">
                No recent payments found.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-[360px] overflow-y-auto custom-scrollbar">
                {recentPayments.map((p) => (
                  <div key={p.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold font-mono text-slate-900 dark:text-white">{formatCurrency(p.amountPaid)}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold
                        ${p.paymentStatus?.toUpperCase() === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' :
                          p.paymentStatus?.toUpperCase() === 'FAILED' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'}
                      `}>
                        {p.paymentStatus}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-slate-500">
                        {p.paymentDate || p.paymentTime ? formatDateTime(p.paymentDate || p.paymentTime) : 'Recently'}
                      </span>
                      <span className="text-xs font-mono text-slate-400">{p.transactionReference || p.id.slice(0, 8)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {allPayments.length > 0 && (
              <div className="p-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-center">
                <button
                  onClick={() => setShowPaymentsDrawer(true)}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 w-full"
                >
                  View all payments
                </button>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* All Payments History Drawer */}
      <Drawer
        open={showPaymentsDrawer}
        onClose={() => setShowPaymentsDrawer(false)}
        title="All Payments History"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">A detailed record of all payments made by you.</p>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  {['Amount', 'Status', 'Date & Time', 'Reference / Mode'].map((h) => (
                    <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {allPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(p.amountPaid)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold
                        ${p.paymentStatus?.toUpperCase() === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          p.paymentStatus?.toUpperCase() === 'FAILED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}
                      `}>
                        {p.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {p.paymentDate || p.paymentTime ? formatDateTime(p.paymentDate || p.paymentTime) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-mono text-slate-700 dark:text-slate-200">{p.transactionReference || p.id.slice(0, 8)}</p>
                      {p.paymentMode && (
                        <p className="text-[10px] text-slate-400 mt-0.5">{p.paymentMode}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
