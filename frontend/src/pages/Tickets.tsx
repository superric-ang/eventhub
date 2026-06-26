import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Calendar, MapPin, Download } from 'lucide-react';
import { orderAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function Tickets() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderAPI.getAll({ limit: 50 })
      .then((res) => setOrders(res.data.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner size="lg" />;

  const upcomingOrders = orders.filter((o) => o.status === 'confirmed' && new Date(o.event?.startDate) > new Date());
  const pastOrders = orders.filter((o) => o.status === 'confirmed' && new Date(o.event?.startDate) <= new Date());
  const cancelledOrders = orders.filter((o) => o.status === 'cancelled');

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-eb-dark mb-2">My Tickets</h1>
      <p className="text-eb-gray mb-8">View and manage all your event tickets</p>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <Ticket className="w-16 h-16 text-eb-gray-light mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No tickets yet</h3>
          <p className="text-eb-gray mb-4">Browse events and get your tickets today!</p>
          <Link to="/events" className="btn-primary">Browse Events</Link>
        </div>
      ) : (
        <div className="space-y-8">
          {upcomingOrders.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4">Upcoming Events ({upcomingOrders.length})</h2>
              <div className="space-y-4">
                {upcomingOrders.map((order) => (
                  <OrderCard key={order._id} order={order} />
                ))}
              </div>
            </div>
          )}

          {pastOrders.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4">Past Events ({pastOrders.length})</h2>
              <div className="space-y-4">
                {pastOrders.map((order) => (
                  <OrderCard key={order._id} order={order} />
                ))}
              </div>
            </div>
          )}

          {cancelledOrders.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4">Cancelled ({cancelledOrders.length})</h2>
              <div className="space-y-4">
                {cancelledOrders.map((order) => (
                  <OrderCard key={order._id} order={order} cancelled />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OrderCard({ order, cancelled }: { order: any; cancelled?: boolean }) {
  const event = order.event;

  return (
    <div className={`bg-white border rounded-xl overflow-hidden ${cancelled ? 'border-red-200 opacity-70' : 'border-eb-gray-border'}`}>
      <div className="flex flex-col sm:flex-row">
        <div className="sm:w-48 h-32 sm:h-auto flex-shrink-0">
          <img
            src={event?.coverImage || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=300&h=200&fit=crop'}
            alt={event?.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold text-lg">{event?.title || 'Event'}</h3>
                <div className="flex items-center gap-2 text-sm text-eb-gray mt-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {event?.startDate
                      ? format(new Date(event.startDate), 'EEE, MMM d, yyyy · h:mm a')
                      : 'Date TBD'}
                  </span>
                </div>
                {event?.venue?.city && (
                  <div className="flex items-center gap-2 text-sm text-eb-gray mt-1">
                    <MapPin className="w-4 h-4" />
                    <span>{event.venue.city}{event.venue.country ? `, ${event.venue.country}` : ''}</span>
                  </div>
                )}
              </div>
              <span className="font-bold text-lg text-eb-orange">${order.grandTotal?.toFixed(2)}</span>
            </div>
            <div className="mt-3 space-y-1">
              {order.items?.map((item: any, i: number) => (
                <div key={i} className="text-sm text-eb-gray">
                  {item.quantity}x {item.ticketTierName} — ${item.totalPrice.toFixed(2)}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4 pt-3 border-t border-eb-gray-border">
            <span className={`text-xs px-2 py-1 rounded-full capitalize ${
              order.status === 'confirmed' ? 'bg-green-100 text-green-700' :
              order.status === 'cancelled' ? 'bg-red-100 text-red-600' :
              'bg-yellow-100 text-yellow-700'
            }`}>{order.status}</span>
            <span className="text-xs text-eb-gray font-mono">#{order.orderNumber}</span>
            {order.status === 'confirmed' && (
              <Link
                to={`/orders/${order.orderNumber}`}
                className="ml-auto text-eb-orange text-sm hover:underline flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> View Ticket
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
