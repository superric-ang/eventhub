import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { eventAPI } from '../services/api';
import toast from 'react-hot-toast';

const categories = [
  'music', 'food_drink', 'performing_arts', 'visual_arts', 'sports_fitness',
  'health_wellness', 'tech', 'business', 'charity_causes', 'community',
  'family_education', 'fashion', 'film_media', 'travel_outdoor', 'nightlife', 'other',
];

export default function CreateEvent() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', shortDescription: '', description: '', category: 'music',
    format: 'in_person' as 'in_person' | 'online' | 'hybrid',
    startDate: '', endDate: '', timezone: 'Asia/Singapore',
    venue: { name: '', address: '', city: '', country: 'SG', zipCode: '' },
    onlineDetails: { platform: 'Zoom', url: '', instructions: '' },
    tags: [] as string[],
    maxAttendees: 0, isPrivate: false,
    settings: { refundPolicy: 'no_refunds', refundDays: 0, requireApproval: false, waitlistEnabled: false },
    ticketTiers: [{ name: 'General Admission', description: '', price: 0, quantity: 100, maxPerOrder: 10, isFree: true, benefits: [] as string[] }],
  });
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [tagInput, setTagInput] = useState('');

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm({ ...form, tags: [...form.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => setForm({ ...form, tags: form.tags.filter((t) => t !== tag) });

  const addTicketTier = () => {
    setForm({
      ...form,
      ticketTiers: [...form.ticketTiers, { name: '', description: '', price: 0, quantity: 100, maxPerOrder: 10, isFree: true, benefits: [] as string[] }],
    });
  };

  const updateTicketTier = (index: number, field: string, value: any) => {
    const tiers = [...form.ticketTiers];
    (tiers[index] as any)[field] = value;
    if (field === 'isFree' && value === true) {
      tiers[index].price = 0;
    }
    setForm({ ...form, ticketTiers: tiers });
  };

  const removeTicketTier = (index: number) => {
    if (form.ticketTiers.length > 1) {
      setForm({ ...form, ticketTiers: form.ticketTiers.filter((_, i) => i !== index) });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      const data = {
        ...form,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        maxAttendees: form.maxAttendees || undefined,
      };
      fd.append('data', JSON.stringify(data));
      Object.entries(data).forEach(([key, val]) => {
        if (key === 'ticketTiers' || key === 'tags' || key === 'settings' || key === 'venue' || key === 'onlineDetails') {
          fd.append(key, JSON.stringify(val));
        } else {
          fd.append(key, String(val));
        }
      });
      if (coverImage) fd.append('coverImage', coverImage);

      const res = await eventAPI.create(fd);
      toast.success('Event created successfully!');
      navigate(`/events/${res.data.event._id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create event');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-eb-gray hover:text-eb-dark mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h1 className="text-3xl font-bold text-eb-dark mb-2">Create Event</h1>
      <p className="text-eb-gray mb-8">Fill in the details to create your event listing</p>

      {/* Steps */}
      <div className="flex items-center gap-2 mb-8">
        {['Basic Info', 'Details', 'Tickets', 'Review'].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <button
              onClick={() => setStep(i + 1)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step >= i + 1 ? 'bg-eb-orange text-white' : 'bg-eb-gray-bg text-eb-gray'
              }`}
            >
              {i + 1}
            </button>
            <span className={`text-sm hidden sm:block ${step >= i + 1 ? 'text-eb-dark font-semibold' : 'text-eb-gray'}`}>
              {label}
            </span>
            {i < 3 && <div className={`w-8 h-0.5 ${step > i + 1 ? 'bg-eb-orange' : 'bg-eb-gray-border'}`} />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-white border border-eb-gray-border rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Basic Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Event Title *</label>
                  <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" placeholder="Enter event title" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Category *</label>
                    <select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field">
                      {categories.map((c) => <option key={c} value={c}>{c.replace('_', ' & ').replace(/\b\w/g, (l) => l.toUpperCase())}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Format *</label>
                    <select required value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value as any })} className="input-field">
                      <option value="in_person">In Person</option>
                      <option value="online">Online</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Short Description</label>
                  <input type="text" value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} className="input-field" placeholder="Brief description (max 500 chars)" maxLength={500} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Full Description *</label>
                  <textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={6} className="input-field" placeholder="Detailed description of your event" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cover Image</label>
                  <input type="file" accept="image/*" onChange={(e) => setCoverImage(e.target.files?.[0] || null)} className="input-field py-2" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-eb-gray-border rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Date & Time</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date & Time *</label>
                  <input type="datetime-local" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date & Time *</label>
                  <input type="datetime-local" required value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="input-field" />
                </div>
              </div>
            </div>

            {(form.format === 'in_person' || form.format === 'hybrid') && (
              <div className="bg-white border border-eb-gray-border rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4">Venue</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Venue Name</label>
                    <input type="text" value={form.venue.name} onChange={(e) => setForm({ ...form, venue: { ...form.venue, name: e.target.value } })} className="input-field" placeholder="Venue or location name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Address</label>
                    <input type="text" value={form.venue.address} onChange={(e) => setForm({ ...form, venue: { ...form.venue, address: e.target.value } })} className="input-field" placeholder="Street address" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">City</label>
                      <input type="text" value={form.venue.city} onChange={(e) => setForm({ ...form, venue: { ...form.venue, city: e.target.value } })} className="input-field" placeholder="City" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Country</label>
                      <input type="text" value={form.venue.country} onChange={(e) => setForm({ ...form, venue: { ...form.venue, country: e.target.value } })} className="input-field" placeholder="SG" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Postal Code</label>
                      <input type="text" value={form.venue.zipCode} onChange={(e) => setForm({ ...form, venue: { ...form.venue, zipCode: e.target.value } })} className="input-field" placeholder="Postal" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(form.format === 'online' || form.format === 'hybrid') && (
              <div className="bg-white border border-eb-gray-border rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4">Online Event Details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Platform</label>
                    <input type="text" value={form.onlineDetails.platform} onChange={(e) => setForm({ ...form, onlineDetails: { ...form.onlineDetails, platform: e.target.value } })} className="input-field" placeholder="Zoom, Google Meet, etc." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Stream URL</label>
                    <input type="url" value={form.onlineDetails.url} onChange={(e) => setForm({ ...form, onlineDetails: { ...form.onlineDetails, url: e.target.value } })} className="input-field" placeholder="https://..." />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-white border border-eb-gray-border rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Tags</h2>
              <div className="flex gap-2 mb-3">
                <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} className="input-field flex-1" placeholder="Add a tag and press Enter" />
                <button type="button" onClick={addTag} className="btn-outline !py-2 !px-4">Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-eb-orange-light text-eb-orange rounded-full text-sm">
                    #{tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500">&times;</button>
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white border border-eb-gray-border rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Event Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Max Attendees (0 = unlimited)</label>
                  <input type="number" min="0" value={form.maxAttendees} onChange={(e) => setForm({ ...form, maxAttendees: parseInt(e.target.value) || 0 })} className="input-field" />
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="isPrivate" checked={form.isPrivate} onChange={(e) => setForm({ ...form, isPrivate: e.target.checked })} className="w-4 h-4 text-eb-orange rounded" />
                  <label htmlFor="isPrivate" className="text-sm">Private event (not listed in search)</label>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Refund Policy</label>
                  <select value={form.settings.refundPolicy} onChange={(e) => setForm({ ...form, settings: { ...form.settings, refundPolicy: e.target.value } })} className="input-field">
                    <option value="no_refunds">No Refunds</option>
                    <option value="7_days">7 Days Before Event</option>
                    <option value="3_days">3 Days Before Event</option>
                    <option value="24_hours">24 Hours Before Event</option>
                    <option value="anytime">Anytime Before Event</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white border border-eb-gray-border rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Ticket Tiers</h2>
              <button type="button" onClick={addTicketTier} className="btn-outline !py-2 !px-4 text-sm flex items-center gap-1">
                <Plus className="w-4 h-4" /> Add Tier
              </button>
            </div>
            <div className="space-y-4">
              {form.ticketTiers.map((tier, index) => (
                <div key={index} className="p-4 border border-eb-gray-border rounded-lg relative">
                  {form.ticketTiers.length > 1 && (
                    <button type="button" onClick={() => removeTicketTier(index)} className="absolute top-4 right-4 text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-1">Name *</label>
                      <input type="text" required value={tier.name} onChange={(e) => updateTicketTier(index, 'name', e.target.value)} className="input-field py-2 text-sm" placeholder="General Admission" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Quantity *</label>
                      <input type="number" required min="1" value={tier.quantity} onChange={(e) => updateTicketTier(index, 'quantity', parseInt(e.target.value) || 0)} className="input-field py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Price</label>
                      <input type="number" min="0" step="0.01" value={tier.price} disabled={tier.isFree} onChange={(e) => updateTicketTier(index, 'price', parseFloat(e.target.value) || 0)} className="input-field py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Max Per Order</label>
                      <input type="number" min="1" value={tier.maxPerOrder} onChange={(e) => updateTicketTier(index, 'maxPerOrder', parseInt(e.target.value) || 1)} className="input-field py-2 text-sm" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={tier.isFree} onChange={(e) => updateTicketTier(index, 'isFree', e.target.checked)} className="w-4 h-4 text-eb-orange rounded" />
                      Free ticket
                    </label>
                  </div>
                  <div className="mt-2">
                    <input type="text" value={tier.description} onChange={(e) => updateTicketTier(index, 'description', e.target.value)} className="input-field py-2 text-sm" placeholder="Ticket description (optional)" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="bg-white border border-eb-gray-border rounded-xl p-6">
            <h2 className="text-xl font-bold mb-6">Review Your Event</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-sm text-eb-gray">Title:</span> <p className="font-semibold">{form.title}</p></div>
                <div><span className="text-sm text-eb-gray">Category:</span> <p className="font-semibold capitalize">{form.category.replace('_', ' & ')}</p></div>
                <div><span className="text-sm text-eb-gray">Format:</span> <p className="font-semibold capitalize">{form.format.replace('_', ' ')}</p></div>
                <div><span className="text-sm text-eb-gray">Start:</span> <p className="font-semibold">{form.startDate ? new Date(form.startDate).toLocaleString() : '-'}</p></div>
                {form.venue.city && <div><span className="text-sm text-eb-gray">Location:</span> <p className="font-semibold">{form.venue.city}, {form.venue.country}</p></div>}
                <div><span className="text-sm text-eb-gray">Ticket Tiers:</span> <p className="font-semibold">{form.ticketTiers.length} tier{form.ticketTiers.length > 1 ? 's' : ''}</p></div>
              </div>
              <div className="space-y-2">
                {form.ticketTiers.map((tier, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-eb-gray-bg rounded-lg text-sm">
                    <span className="font-semibold">{tier.name}</span>
                    <span>{tier.isFree ? 'Free' : `$${tier.price.toFixed(2)}`} x {tier.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-8">
          {step > 1 ? (
            <button type="button" onClick={() => setStep(step - 1)} className="btn-outline">Previous</button>
          ) : <div />}
          {step < 4 ? (
            <button type="button" onClick={() => setStep(step + 1)} className="btn-primary">Next</button>
          ) : (
            <button type="submit" disabled={saving} className="btn-primary text-base">
              {saving ? 'Creating...' : 'Create Event'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
