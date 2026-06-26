import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Ticket, Users, TrendingUp, Eye, Calendar, ExternalLink } from 'lucide-react';
import { eventAPI, orderAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { format } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'orders'>('overview');

  useEffect(() => {
    Promise.all([
      eventAPI.getAll({ myEvents: 'true', status: 'all', limit: 50 }),
      orderAPI.getAll({ limit: 50 }),
    ])
      .then(([eventsRes, ordersRes]) => {
        setEvents(eventsRes.data.events || []);
        setOrders(ordersRes.data.orders || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalTicketsSold = events.reduce((sum, e) => sum + (e.currentAttendees || 0), 0);
  const totalRevenue = orders
    .filter((o) => o.status === 'confirmed')
    .reduce((sum, o) => sum + o.grandTotal, 0);
  const totalViews = events.reduce((sum, e) => sum + (e.views || 0), 0);
  const upcomingEvents = events.filter(
    (e) => e.status === 'published' && new Date(e.startDate) > new Date()
  ).length;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'events', label: 'My Events' },
    { id: 'orders', label: 'Orders' },
  ];

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="max-w-8xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-eb-dark">Dashboard</h1>
          <p className="text-eb-gray">Welcome back, {user?.firstName}!</p>
        </div>
        {user?.role === 'organizer' && (
          <Link to="/events/create" className="btn-primary flex items-center gap-2">
            <PlusCircle className="w-5 h-5" /> Create Event
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-eb-gray-border mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-eb-orange text-eb-orange'
                : 'border-transparent text-eb-gray hover:text-eb-dark'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white border border-eb-gray-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <p className="text-2xl font-bold">{events.length}</p>
              <p className="text-sm text-eb-gray">Total Events</p>
              {upcomingEvents > 0 && <p className="text-xs text-green-600 mt-1">{upcomingEvents} upcoming</p>}
            </div>
            <div className="bg-white border border-eb-gray-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Ticket className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <p className="text-2xl font-bold">{totalTicketsSold}</p>
              <p className="text-sm text-eb-gray">Tickets Sold</p>
            </div>
            <div className="bg-white border border-eb-gray-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
              <p className="text-sm text-eb-gray">Total Revenue</p>
            </div>
            <div className="bg-white border border-eb-gray-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-5 h-5 text-orange-600" />
                </div>
              </div>
              <p className="text-2xl font-bold">{totalViews}</p>
              <p className="text-sm text-eb-gray">Total Views</p>
            </div>
          </div>

          {events.length > 0 && (
            <div className="bg-white border border-eb-gray-border rounded-xl p-6">
              <h3 className="font-bold text-lg mb-4">Recent Events</h3>
              <div className="space-y-3">
                {events.slice(0, 5).map((event) => (
                  <Link key={event._id} to={`/events/${event._id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-eb-gray-bg transition-colors">
                    <div className="flex items-center gap-3">
                      <img
                        src={event.coverImage || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=64&h=64&fit=crop'}
                        alt={event.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-semibold">{event.title}</p>
                        <p className="text-xs text-eb-gray">{event.currentAttendees || 0} attendees · {event.views || 0} views</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        event.status === 'published' ? 'bg-green-100 text-green-700' :
                        event.status === 'draft' ? 'bg-gray-100 text-gray-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {event.status}
                      </span>
                      <ExternalLink className="w-4 h-4 text-eb-gray" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'events' && (
        <div>
          {events.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="w-16 h-16 text-eb-gray-light mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No events yet</h3>
              <p className="text-eb-gray mb-4">Create your first event to get started</p>
              <Link to="/events/create" className="btn-primary">Create Event</Link>
            </div>
          ) : (
            <div className="bg-white border border-eb-gray-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-eb-gray-bg">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-eb-gray">Event</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-eb-gray hidden md:table-cell">Date</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-eb-gray hidden sm:table-cell">Tickets</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-eb-gray">Status</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-eb-gray">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-eb-gray-border">
                  {events.map((event) => (
                    <tr key={event._id} className="hover:bg-eb-gray-bg">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={event.coverImage || ''} alt="" className="w-10 h-10 rounded object-cover hidden sm:block" />
                          <div>
                            <p className="font-semibold text-sm">{event.title}</p>
                            <p className="text-xs text-eb-gray">{event.venue?.city || 'Online'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-eb-gray hidden md:table-cell">
                        {event.startDate ? format(new Date(event.startDate), 'MMM d, yyyy') : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm hidden sm:table-cell">
                        {event.currentAttendees || 0} / {event.maxAttendees || '∞'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                          event.status === 'published' ? 'bg-green-100 text-green-700' :
                          event.status === 'draft' ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-600'
                        }`}>{event.status}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link to={`/events/${event._id}`} className="text-eb-orange text-sm hover:underline">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <div>
          {orders.length === 0 ? (
            <div className="text-center py-16">
              <Ticket className="w-16 h-16 text-eb-gray-light mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
              <p className="text-eb-gray">Orders will appear here when attendees purchase tickets</p>
            </div>
          ) : (
            <div className="bg-white border border-eb-gray-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-eb-gray-bg">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-eb-gray">Order</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-eb-gray hidden md:table-cell">Buyer</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-eb-gray hidden sm:table-cell">Date</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-eb-gray">Amount</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-eb-gray">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-eb-gray-border">
                  {orders.map((order) => (
                    <tr key={order._id} className="hover:bg-eb-gray-bg">
                      <td className="px-4 py-3 text-sm font-mono">{order.orderNumber}</td>
                      <td className="px-4 py-3 text-sm hidden md:table-cell">{order.buyer?.firstName} {order.buyer?.lastName}</td>
                      <td className="px-4 py-3 text-sm text-eb-gray hidden sm:table-cell">
                        {order.createdAt ? format(new Date(order.createdAt), 'MMM d') : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold">${order.grandTotal?.toFixed(2)}</td>
                      <td className="px-4 py-3">
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
        </div>
      )}
    </div>
  );
}
