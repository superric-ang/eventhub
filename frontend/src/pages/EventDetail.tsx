import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Clock, Calendar, Share2, Heart, User, Globe, Monitor, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { eventAPI, orderAPI, promoAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function EventDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({});
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoApplied, setPromoApplied] = useState('');
  const [showAttendeeForm, setShowAttendeeForm] = useState(false);
  const [attendeeInfo, setAttendeeInfo] = useState<Record<string, any>>({});
  const [isSaved, setIsSaved] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (id) {
      eventAPI.getById(id)
        .then((res) => setEvent(res.data.event))
        .catch(() => toast.error('Event not found'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleSave = async () => {
    if (!user) { toast.error('Please sign in to save events'); return; }
    try {
      await eventAPI.toggleSave(id!);
      setIsSaved(!isSaved);
      toast.success(isSaved ? 'Removed from saved' : 'Event saved!');
    } catch { toast.error('Failed to save event'); }
  };

  const handleQuantityChange = (tierId: string, delta: number) => {
    const tier = event.ticketTiers.find((t: any) => t._id === tierId);
    const current = selectedTickets[tierId] || 0;
    const newQty = Math.max(0, Math.min(current + delta, tier.maxPerOrder || 10, tier.quantity - tier.quantitySold));
    setSelectedTickets({ ...selectedTickets, [tierId]: newQty });
    setPromoApplied('');
    setPromoDiscount(0);
  };

  const totalTickets = Object.values(selectedTickets).reduce((a: number, b) => a + b, 0) as number;
  const subtotal = event?.ticketTiers?.reduce((sum: number, tier: any) =>
    sum + (selectedTickets[tier._id] || 0) * tier.price, 0) || 0;
  const serviceFee = subtotal * 0.037 + (totalTickets * 1.79);
  const paymentFee = subtotal * 0.029;
  const total = Math.max(0, subtotal + serviceFee + paymentFee - promoDiscount);

  const applyPromo = async () => {
    if (!promoCode.trim()) return;
    try {
      const res = await promoAPI.validate({ code: promoCode, eventId: id, orderAmount: subtotal });
      if (res.data.valid) {
        setPromoDiscount(res.data.promo.discountAmount);
        setPromoApplied(promoCode.toUpperCase());
        toast.success(`Promo applied! Save $${res.data.promo.discountAmount.toFixed(2)}`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid promo code');
    }
  };

  const handlePurchase = async () => {
    if (!user) { toast.error('Please sign in to purchase tickets'); return; }
    if (totalTickets === 0) { toast.error('Select at least one ticket'); return; }

    setPurchasing(true);
    try {
      const items = event.ticketTiers
        .filter((t: any) => (selectedTickets[t._id] || 0) > 0)
        .map((t: any) => ({ ticketTierId: t._id, quantity: selectedTickets[t._id] }));

      const attendeeDetails = event.ticketTiers
        .filter((t: any) => (selectedTickets[t._id] || 0) > 0)
        .map((t: any) => ({
          ticketTierId: t._id,
          tickets: Array.from({ length: selectedTickets[t._id] }, (_, i) => ({
            name: attendeeInfo[`${t._id}_name_${i}`] || `${user.firstName} ${user.lastName}`,
            email: attendeeInfo[`${t._id}_email_${i}`] || user.email,
          })),
        }));

      const res = await orderAPI.create({
        eventId: id,
        items,
        attendeeDetails,
        promoCode: promoApplied || undefined,
      });

      toast.success('Purchase successful! Check your tickets.');
      setSelectedTickets({});
      setShowAttendeeForm(false);
      setPromoApplied('');
      setPromoDiscount(0);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Purchase failed');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;
  if (!event) return <div className="text-center py-20"><h2 className="text-2xl font-bold">Event not found</h2></div>;

  const categoryLabels: Record<string, string> = {
    music: 'Music', food_drink: 'Food & Drink', performing_arts: 'Performing Arts',
    visual_arts: 'Visual Arts', sports_fitness: 'Sports & Fitness',
    health_wellness: 'Health & Wellness', tech: 'Tech', business: 'Business',
    charity_causes: 'Charity & Causes', community: 'Community',
    family_education: 'Family & Education', fashion: 'Fashion',
    film_media: 'Film & Media', travel_outdoor: 'Travel & Outdoor',
    nightlife: 'Nightlife', other: 'Other',
  };

  return (
    <div className="max-w-8xl mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="relative rounded-xl overflow-hidden mb-6 h-64 md:h-96">
            <img
              src={event.coverImage || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&h=600&fit=crop'}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <span className="absolute top-4 left-4 bg-white/90 px-3 py-1 rounded-full text-sm font-semibold capitalize">
              {categoryLabels[event.category] || event.category}
            </span>
            <button onClick={handleSave} className="absolute top-4 right-4 p-3 bg-white/90 rounded-full hover:bg-white transition-colors">
              <Heart className={`w-5 h-5 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-eb-dark mb-4">{event.title}</h1>

          <div className="flex flex-wrap gap-6 mb-8">
            <div className="flex items-start gap-2">
              <Calendar className="w-5 h-5 text-eb-orange mt-0.5" />
              <div>
                <p className="font-semibold">{format(new Date(event.startDate), 'EEEE, MMMM d, yyyy')}</p>
                <p className="text-sm text-eb-gray">{format(new Date(event.startDate), 'h:mm a')} - {format(new Date(event.endDate), 'h:mm a')}</p>
              </div>
            </div>
            {event.format !== 'online' && event.venue?.name && (
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-eb-orange mt-0.5" />
                <div>
                  <p className="font-semibold">{event.venue.name}</p>
                  <p className="text-sm text-eb-gray">{event.venue.address}, {event.venue.city}</p>
                </div>
              </div>
            )}
            {event.format === 'online' && (
              <div className="flex items-start gap-2">
                <Monitor className="w-5 h-5 text-eb-orange mt-0.5" />
                <div>
                  <p className="font-semibold">Online Event</p>
                  <p className="text-sm text-eb-gray">Join from anywhere</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 mb-8 p-4 bg-eb-gray-bg rounded-lg">
            <div className="w-12 h-12 rounded-full bg-eb-orange flex items-center justify-center text-white font-bold">
              {event.organizer?.firstName?.[0]}{event.organizer?.lastName?.[0]}
            </div>
            <div>
              <p className="font-semibold">{event.organizer?.firstName} {event.organizer?.lastName}</p>
              {event.organizer?.organizationName && (
                <p className="text-sm text-eb-gray">{event.organizer.organizationName}</p>
              )}
            </div>
          </div>

          <div className="prose max-w-none mb-8">
            <h2 className="text-xl font-bold mb-4">About This Event</h2>
            <p className="text-eb-gray leading-relaxed whitespace-pre-line">{event.description}</p>
          </div>

          {event.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {event.tags.map((tag: string) => (
                <Link key={tag} to={`/events?search=${tag}`} className="px-3 py-1 bg-eb-gray-bg rounded-full text-sm text-eb-dark hover:bg-gray-200">
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white border border-eb-gray-border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4">Tickets</h3>

            <div className="space-y-4 mb-6">
              {event.ticketTiers?.map((tier: any) => {
                const available = tier.quantity - tier.quantitySold;
                const qty = selectedTickets[tier._id] || 0;
                return (
                  <div key={tier._id} className="p-4 border border-eb-gray-border rounded-lg">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <h4 className="font-semibold">{tier.name}</h4>
                        {tier.description && <p className="text-sm text-eb-gray">{tier.description}</p>}
                      </div>
                      <span className="font-bold text-lg">{tier.isFree ? 'Free' : `$${tier.price.toFixed(2)}`}</span>
                    </div>
                    {tier.benefits?.length > 0 && (
                      <ul className="mt-2 text-xs text-eb-gray space-y-1">
                        {tier.benefits.map((b: string, i: number) => <li key={i} className="flex items-center gap-1">• {b}</li>)}
                      </ul>
                    )}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-eb-gray-border">
                      <span className="text-xs text-eb-gray">{available} available</span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleQuantityChange(tier._id, -1)}
                          disabled={qty === 0}
                          className="w-8 h-8 rounded-md border border-eb-gray-border flex items-center justify-center disabled:opacity-30 hover:bg-eb-gray-bg"
                        >-</button>
                        <span className="w-6 text-center font-semibold">{qty}</span>
                        <button
                          onClick={() => handleQuantityChange(tier._id, 1)}
                          disabled={available <= 0 || qty >= (tier.maxPerOrder || 10)}
                          className="w-8 h-8 rounded-md border border-eb-gray-border flex items-center justify-center disabled:opacity-30 hover:bg-eb-gray-bg"
                        >+</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalTickets > 0 && (
              <>
                {/* Promo Code */}
                <div className="mb-4">
                  {promoApplied ? (
                    <div className="flex items-center justify-between bg-green-50 text-green-700 px-3 py-2 rounded-md text-sm">
                      <span>Code "{promoApplied}" applied</span>
                      <button onClick={() => { setPromoApplied(''); setPromoDiscount(0); setPromoCode(''); }} className="text-green-700 hover:underline">Remove</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text" value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="Promo code" className="input-field py-2 text-sm flex-1"
                      />
                      <button onClick={applyPromo} className="btn-outline !py-2 !px-4 text-sm">Apply</button>
                    </div>
                  )}
                </div>

                {/* Pricing Summary */}
                <div className="space-y-2 text-sm border-t border-eb-gray-border pt-4 mb-4">
                  <div className="flex justify-between">
                    <span>Subtotal ({totalTickets} ticket{totalTickets > 1 ? 's' : ''})</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-eb-gray">
                    <span>Service fee</span>
                    <span>${serviceFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-eb-gray">
                    <span>Payment processing</span>
                    <span>${paymentFee.toFixed(2)}</span>
                  </div>
                  {promoDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-${promoDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t border-eb-gray-border">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                {!showAttendeeForm ? (
                  <button onClick={() => setShowAttendeeForm(true)} className="btn-primary w-full text-base">
                    Get Tickets
                  </button>
                ) : (
                  <div>
                    <h4 className="font-semibold mb-3">Attendee Information</h4>
                    {event.ticketTiers.filter((t: any) => (selectedTickets[t._id] || 0) > 0).map((tier: any) =>
                      Array.from({ length: selectedTickets[tier._id] }, (_, i) => (
                        <div key={`${tier._id}_${i}`} className="mb-3 p-3 border border-eb-gray-border rounded-lg">
                          <p className="text-xs font-semibold text-eb-gray mb-2">{tier.name} - Ticket {i + 1}</p>
                          <input
                            type="text" placeholder="Full Name"
                            value={attendeeInfo[`${tier._id}_name_${i}`] || ''}
                            onChange={(e) => setAttendeeInfo({ ...attendeeInfo, [`${tier._id}_name_${i}`]: e.target.value })}
                            className="input-field py-2 text-sm mb-2"
                          />
                          <input
                            type="email" placeholder="Email"
                            value={attendeeInfo[`${tier._id}_email_${i}`] || ''}
                            onChange={(e) => setAttendeeInfo({ ...attendeeInfo, [`${tier._id}_email_${i}`]: e.target.value })}
                            className="input-field py-2 text-sm"
                          />
                        </div>
                      ))
                    )}
                    <button onClick={handlePurchase} disabled={purchasing} className="btn-primary w-full text-base mt-2">
                      {purchasing ? 'Processing...' : `Pay $${total.toFixed(2)}`}
                    </button>
                  </div>
                )}
              </>
            )}

            {totalTickets === 0 && !showAttendeeForm && (
              <p className="text-center text-eb-gray text-sm py-2">Select tickets above to proceed</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
