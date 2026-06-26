import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, X } from 'lucide-react';
import { eventAPI } from '../services/api';
import EventCard from '../components/EventCard';
import LoadingSpinner from '../components/LoadingSpinner';

const categoryOptions = [
  { value: '', label: 'All Categories' },
  { value: 'music', label: 'Music' }, { value: 'food_drink', label: 'Food & Drink' },
  { value: 'performing_arts', label: 'Performing Arts' }, { value: 'visual_arts', label: 'Visual Arts' },
  { value: 'sports_fitness', label: 'Sports & Fitness' }, { value: 'health_wellness', label: 'Health' },
  { value: 'tech', label: 'Tech' }, { value: 'business', label: 'Business' },
  { value: 'charity_causes', label: 'Charity' }, { value: 'community', label: 'Community' },
  { value: 'family_education', label: 'Family' }, { value: 'nightlife', label: 'Nightlife' },
];

const formatOptions = [
  { value: '', label: 'All Formats' },
  { value: 'in_person', label: 'In Person' },
  { value: 'online', label: 'Online' },
  { value: 'hybrid', label: 'Hybrid' },
];

export default function EventList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    format: searchParams.get('format') || '',
    city: searchParams.get('city') || '',
  });

  const fetchEvents = async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page, limit: 12, sort: '-startDate' };
      if (filters.search) params.search = filters.search;
      if (filters.category) params.category = filters.category;
      if (filters.format) params.format = filters.format;
      if (filters.city) params.city = filters.city;
      const res = await eventAPI.getAll(params);
      setEvents(res.data.events);
      setPagination(res.data.pagination);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const format = searchParams.get('format') || '';
    const city = searchParams.get('city') || '';
    setFilters({ search, category, format, city });
    fetchEvents(1);
  }, [searchParams]);

  const applyFilters = () => {
    const params: Record<string, string> = {};
    if (filters.search) params.search = filters.search;
    if (filters.category) params.category = filters.category;
    if (filters.format) params.format = filters.format;
    if (filters.city) params.city = filters.city;
    setSearchParams(params);
  };

  const clearFilters = () => {
    setFilters({ search: '', category: '', format: '', city: '' });
    setSearchParams({});
  };

  const hasActiveFilters = filters.search || filters.category || filters.format || filters.city;

  return (
    <div className="max-w-8xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-eb-dark">Discover Events</h1>
          <p className="text-eb-gray mt-1">{pagination.total} events found</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="btn-outline !py-2 !px-4 text-sm flex items-center gap-2"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {hasActiveFilters && <span className="w-2 h-2 bg-eb-orange rounded-full" />}
        </button>
      </div>

      {showFilters && (
        <div className="bg-eb-gray-bg rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2"><Filter className="w-4 h-4" /> Filters</h3>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-sm text-eb-orange hover:underline flex items-center gap-1">
                <X className="w-3 h-3" /> Clear All
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-eb-gray-light" />
                <input
                  type="text" value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Search events..." className="input-field pl-9 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} className="input-field py-2 text-sm">
                {categoryOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Format</label>
              <select value={filters.format} onChange={(e) => setFilters({ ...filters, format: e.target.value })} className="input-field py-2 text-sm">
                {formatOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <input
                type="text" value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                placeholder="e.g. Singapore" className="input-field py-2 text-sm"
              />
            </div>
          </div>
          <button onClick={applyFilters} className="btn-primary mt-4 !py-2 !px-6 text-sm">
            Apply Filters
          </button>
        </div>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : events.length === 0 ? (
        <div className="text-center py-16">
          <h3 className="text-xl font-semibold text-eb-dark mb-2">No events found</h3>
          <p className="text-eb-gray">Try adjusting your filters or search terms</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {events.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>

          {pagination.pages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-12">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => fetchEvents(page)}
                  className={`w-10 h-10 rounded-md text-sm font-medium transition-colors ${
                    page === pagination.page
                      ? 'bg-eb-orange text-white'
                      : 'bg-white border border-eb-gray-border text-eb-dark hover:bg-eb-gray-bg'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
