import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { paymentsApi } from '../../api/payment.api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function PaymentStatus() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>('PROCESSING');

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const checkStatus = async () => {
      if (!orderId) return;
      try {
        const res = await paymentsApi.getPaymentStatus(orderId);
        if (res.data.status === 'SUCCESS' || res.data.status === 'FAILED') {
          setStatus(res.data.status);
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Failed to get status', err);
      }
    };

    // Initial check
    checkStatus();

    // Poll every 3 seconds
    interval = setInterval(checkStatus, 3000);

    return () => clearInterval(interval);
  }, [orderId]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md p-8 text-center space-y-6 shadow-xl border-slate-100 dark:border-slate-800">
        {status === 'PROCESSING' && (
          <>
            <Loader2 className="w-16 h-16 animate-spin text-indigo-500 mx-auto" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Processing Payment</h2>
            <p className="text-slate-500 dark:text-slate-400">
              Please wait while we confirm your payment...
            </p>
          </>
        )}

        {status === 'SUCCESS' && (
          <>
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
            <h2 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">Payment Successful!</h2>
            <p className="text-slate-600 dark:text-slate-300">
              Your dues have been cleared successfully.
            </p>
            <Button className="w-full mt-4" onClick={() => navigate('/student')}>
              Back to Dashboard
            </Button>
          </>
        )}

        {status === 'FAILED' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto" />
            <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">Payment Failed</h2>
            <p className="text-slate-600 dark:text-slate-300">
              Your transaction could not be completed. Please try again.
            </p>
            <Button className="w-full mt-4" variant="danger" onClick={() => navigate('/student')}>
              Back to Dashboard
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
