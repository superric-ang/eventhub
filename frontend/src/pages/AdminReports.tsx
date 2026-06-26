import { useEffect, useState } from 'react';
import { FileText, Download, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { adminAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function AdminReports() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    type: 'daily',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = () => {
    setLoading(true);
    adminAPI.getReports()
      .then((res) => setReports(res.data.reports || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.startDate || !form.endDate) {
      toast.error('Please select start and end dates');
      return;
    }
    setGenerating(true);
    try {
      const res = await adminAPI.generateReport(form.type, form.startDate, form.endDate);
      setReports((prev) => [res.data.report, ...prev]);
      toast.success('Report generated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-eb-dark mb-6">Reports</h1>

      <div className="bg-white border border-eb-gray-border rounded-xl p-6 mb-8">
        <h2 className="font-bold text-lg mb-4">Generate Report</h2>
        <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row items-end gap-4">
          <div className="w-full sm:w-44">
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="input-field"
            >
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
              <option value="annual">Annual</option>
            </select>
          </div>
          <div className="w-full sm:w-48">
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="input-field"
            />
          </div>
          <div className="w-full sm:w-48">
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              className="input-field"
            />
          </div>
          <button type="submit" disabled={generating} className="btn-primary w-full sm:w-auto">
            {generating ? 'Generating...' : 'Generate Report'}
          </button>
        </form>
      </div>

      <div className="bg-white border border-eb-gray-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-eb-gray-border">
          <h2 className="font-bold text-lg">Previous Reports</h2>
        </div>
        {reports.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-eb-gray-light mx-auto mb-3" />
            <p className="text-eb-gray">No reports generated yet</p>
          </div>
        ) : (
          <div className="divide-y divide-eb-gray-border">
            {reports.map((report) => (
              <div key={report._id}>
                <div
                  className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-eb-gray-bg"
                  onClick={() => setExpandedId(expandedId === report._id ? null : report._id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-eb-orange/10 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-eb-orange" />
                    </div>
                    <div>
                      <p className="font-semibold capitalize">{report.type} Report</p>
                      <p className="text-xs text-eb-gray flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {report.createdAt ? format(new Date(report.createdAt), 'MMM d, yyyy h:mm a') : '-'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-eb-gray">
                      {report.periodStart ? format(new Date(report.periodStart), 'MMM d') : '?'} - {report.periodEnd ? format(new Date(report.periodEnd), 'MMM d, yyyy') : '?'}
                    </span>
                    {expandedId === report._id ? <ChevronUp className="w-4 h-4 text-eb-gray" /> : <ChevronDown className="w-4 h-4 text-eb-gray" />}
                  </div>
                </div>
                {expandedId === report._id && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-eb-gray-border">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="font-semibold text-sm">Report Data</h4>
                    </div>
                    {report.data ? (
                      <div className="bg-white border border-eb-gray-border rounded-lg p-4 max-h-96 overflow-auto">
                        <pre className="text-xs font-mono whitespace-pre-wrap">{JSON.stringify(report.data, null, 2)}</pre>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white border border-eb-gray-border rounded-lg p-4 text-center">
                          <p className="text-2xl font-bold text-eb-dark">{report.summary?.totalEvents ?? 0}</p>
                          <p className="text-xs text-eb-gray">Total Events</p>
                        </div>
                        <div className="bg-white border border-eb-gray-border rounded-lg p-4 text-center">
                          <p className="text-2xl font-bold text-eb-dark">{report.summary?.totalOrders ?? 0}</p>
                          <p className="text-xs text-eb-gray">Total Orders</p>
                        </div>
                        <div className="bg-white border border-eb-gray-border rounded-lg p-4 text-center">
                          <p className="text-2xl font-bold text-eb-dark">${(report.summary?.totalRevenue ?? 0).toFixed(2)}</p>
                          <p className="text-xs text-eb-gray">Total Revenue</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
