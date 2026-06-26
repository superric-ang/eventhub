import { useEffect, useState } from 'react';
import { Wallet, CheckCircle, Ban, Filter, DollarSign } from 'lucide-react';
import { adminAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const statusStyles: Record<string, string> = {
  pending: 'bg-orange-100 text-orange-700',
  approved: 'bg-green-100 text-green-700',
  paid: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-600',
};

export default function AdminPayouts() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPayouts();
  }, []);

  const fetchPayouts = () => {
    setLoading(true);
    adminAPI.getPayouts()
      .then((res) => setPayouts(res.data.payouts || []))
      .catch(() => toast.error('Failed to load payouts'))
      .finally(() => setLoading(false));
  };

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      await adminAPI.approvePayout(id);
      setPayouts((prev) => prev.map((p) => (p._id === id ? { ...p, status: 'approved' } : p)));
      toast.success('Payout approved');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to approve payout');
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkPaid = async (id: string) => {
    setProcessingId(id);
    try {
      await adminAPI.markPayoutPaid(id);
      setPayouts((prev) => prev.map((p) => (p._id === id ? { ...p, status: 'paid' } : p)));
      toast.success('Payout marked as paid');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to mark payout');
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = statusFilter === 'all' ? payouts : payouts.filter((p) => p.status === statusFilter);

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-eb-dark">Payouts</h1>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-eb-gray" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field py-1.5 text-sm w-40"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-eb-gray-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-eb-gray-bg">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-semibold text-eb-gray">Event</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-eb-gray hidden lg:table-cell">Organizer</th>
              <th className="text-right px-4 py-3 text-sm font-semibold text-eb-gray">Amount</th>
              <th className="text-right px-4 py-3 text-sm font-semibold text-eb-gray hidden sm:table-cell">Fee</th>
              <th className="text-right px-4 py-3 text-sm font-semibold text-eb-gray hidden sm:table-cell">Net</th>
              <th className="text-right px-4 py-3 text-sm font-semibold text-eb-gray hidden md:table-cell">Tickets</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-eb-gray">Status</th>
              <th className="text-right px-4 py-3 text-sm font-semibold text-eb-gray">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-eb-gray-border">
            {filtered.map((payout) => (
              <tr key={payout._id} className="hover:bg-eb-gray-bg">
                <td className="px-4 py-3">
                  <p className="font-semibold text-sm">{payout.event?.title || 'Unknown Event'}</p>
                  <p className="text-xs text-eb-gray">{payout.event?.venue?.city || ''}</p>
                </td>
                <td className="px-4 py-3 text-sm hidden lg:table-cell">
                  {payout.organizer?.firstName} {payout.organizer?.lastName}
                </td>
                <td className="px-4 py-3 text-right font-semibold">${payout.totalAmount?.toFixed(2)}</td>
                <td className="px-4 py-3 text-right text-sm text-eb-gray hidden sm:table-cell">${payout.fee?.toFixed(2)}</td>
                <td className="px-4 py-3 text-right font-semibold hidden sm:table-cell">${payout.netAmount?.toFixed(2)}</td>
                <td className="px-4 py-3 text-right text-sm hidden md:table-cell">{payout.ticketsSold ?? 0}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full capitalize ${statusStyles[payout.status] || 'bg-gray-100 text-gray-600'}`}>
                    {payout.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {payout.status === 'pending' && (
                      <button
                        onClick={() => handleApprove(payout._id)}
                        disabled={processingId === payout._id}
                        className="btn-ghost text-green-600 text-xs flex items-center gap-1"
                      >
                        {processingId === payout._id ? <LoadingSpinner size="sm" /> : <><CheckCircle className="w-3.5 h-3.5" /> Approve</>}
                      </button>
                    )}
                    {payout.status === 'approved' && (
                      <button
                        onClick={() => handleMarkPaid(payout._id)}
                        disabled={processingId === payout._id}
                        className="btn-ghost text-blue-600 text-xs flex items-center gap-1"
                      >
                        {processingId === payout._id ? <LoadingSpinner size="sm" /> : <><DollarSign className="w-3.5 h-3.5" /> Mark Paid</>}
                      </button>
                    )}
                    {payout.status === 'paid' && (
                      <span className="text-xs text-eb-gray">Completed</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Wallet className="w-12 h-12 text-eb-gray-light mx-auto mb-3" />
            <p className="text-eb-gray">No payouts found</p>
          </div>
        )}
      </div>
    </div>
  );
}
