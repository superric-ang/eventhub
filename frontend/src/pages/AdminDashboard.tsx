import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, ShoppingCart, DollarSign, LayoutDashboard, UserCheck, Wallet, FileText, Settings, ArrowUpRight } from 'lucide-react';
import { adminAPI, orderAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminAPI.getStats(),
      orderAPI.getAll({ limit: 10 }),
    ])
      .then(([statsRes, ordersRes]) => {
        setStats(statsRes.data);
        setOrders(ordersRes.data.orders || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner size="lg" />;

  const summaryCards = [
    { label: 'Total Users', value: stats?.totalUsers ?? 0, icon: Users, color: 'bg-blue-100 text-blue-600' },
    { label: 'Total Events', value: stats?.totalEvents ?? 0, icon: Calendar, color: 'bg-green-100 text-green-600' },
    { label: 'Total Orders', value: stats?.totalOrders ?? 0, icon: ShoppingCart, color: 'bg-purple-100 text-purple-600' },
    { label: 'Total Revenue', value: `$${(stats?.totalRevenue ?? 0).toFixed(2)}`, icon: DollarSign, color: 'bg-orange-100 text-orange-600' },
  ];

  const quickLinks = [
    { path: '/admin/users', label: 'Users', icon: UserCheck, desc: 'Manage users and roles' },
    { path: '/admin/payouts', label: 'Payouts', icon: Wallet, desc: 'Process organizer payouts' },
    { path: '/admin/reports', label: 'Reports', icon: FileText, desc: 'Generate and view reports' },
    { path: '/admin/settings', label: 'Settings', icon: Settings, desc: 'Configure app settings' },
  ];

  const categories = stats?.eventsByCategory ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-eb-dark mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {summaryCards.map((card) => (
          <div key={card.label} className="bg-white border border-eb-gray-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-eb-dark">{card.value}</p>
            <p className="text-sm text-eb-gray">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white border border-eb-gray-border rounded-xl p-6">
          <h3 className="font-bold text-lg mb-4">Recent Orders</h3>
          {orders.length === 0 ? (
            <p className="text-eb-gray text-sm">No orders yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-eb-gray border-b border-eb-gray-border">
                    <th className="pb-3 font-semibold">Order</th>
                    <th className="pb-3 font-semibold hidden sm:table-cell">Buyer</th>
                    <th className="pb-3 font-semibold hidden md:table-cell">Date</th>
                    <th className="pb-3 font-semibold text-right">Amount</th>
                    <th className="pb-3 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-eb-gray-border">
                  {orders.map((order) => (
                    <tr key={order._id} className="text-sm hover:bg-eb-gray-bg">
                      <td className="py-3 font-mono">{order.orderNumber}</td>
                      <td className="py-3 hidden sm:table-cell">{order.buyer?.firstName} {order.buyer?.lastName}</td>
                      <td className="py-3 text-eb-gray hidden md:table-cell">
                        {order.createdAt ? format(new Date(order.createdAt), 'MMM d, yyyy') : '-'}
                      </td>
                      <td className="py-3 text-right font-semibold">${order.grandTotal?.toFixed(2)}</td>
                      <td className="py-3 text-right">
                        <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                          order.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>{order.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {orders.length > 0 && (
            <Link to="/admin/users" className="text-eb-orange text-sm hover:underline mt-3 inline-flex items-center gap-1">
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        <div className="bg-white border border-eb-gray-border rounded-xl p-6">
          <h3 className="font-bold text-lg mb-4">Events by Category</h3>
          {categories.length === 0 ? (
            <p className="text-eb-gray text-sm">No data</p>
          ) : (
            <div className="space-y-3">
              {categories.map((cat: any, i: number) => {
                const maxCount = Math.max(...categories.map((c: any) => c.count));
                const pct = maxCount > 0 ? (cat.count / maxCount) * 100 : 0;
                const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-red-500'];
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium capitalize">{cat._id || 'Uncategorized'}</span>
                      <span className="text-eb-gray">{cat.count}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div className={`${colors[i % colors.length]} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-eb-gray-border rounded-xl p-6">
        <h3 className="font-bold text-lg mb-4">Quick Links</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="flex items-start gap-4 p-4 rounded-lg border border-eb-gray-border hover:border-eb-orange hover:bg-eb-orange/5 transition-colors"
            >
              <div className="w-10 h-10 bg-eb-orange/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <link.icon className="w-5 h-5 text-eb-orange" />
              </div>
              <div>
                <p className="font-semibold text-eb-dark">{link.label}</p>
                <p className="text-xs text-eb-gray">{link.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
