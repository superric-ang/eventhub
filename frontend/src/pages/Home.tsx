import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowRight, TrendingUp, Users, Globe, Ticket, Shield, Smartphone } from 'lucide-react';
import { eventAPI } from '../services/api';
import EventCard from '../components/EventCard';
import LoadingSpinner from '../components/LoadingSpinner';

const categories = [
  { id: 'music', name: 'Music', image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=200&h=200&fit=crop' },
  { id: 'food_drink', name: 'Food & Drink', image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=200&h=200&fit=crop' },
  { id: 'performing_arts', name: 'Performing Arts', image: 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=200&h=200&fit=crop' },
  { id: 'tech', name: 'Tech', image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=200&h=200&fit=crop' },
  { id: 'community', name: 'Community', image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=200&h=200&fit=crop' },
  { id: 'sports_fitness', name: 'Sports & Fitness', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200&h=200&fit=crop' },
  { id: 'business', name: 'Business', image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=200&h=200&fit=crop' },
  { id: 'health_wellness', name: 'Health', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=200&h=200&fit=crop' },
];

export default function Home() {
  const navigate = useNavigate();
  const [featuredEvents, setFeaturedEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    eventAPI.getAll({ limit: 8, sort: '-startDate' })
      .then((res) => setFeaturedEvents(res.data.events))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/events?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-eb-dark via-purple-900 to-eb-dark overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1920&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }} />
        <div className="relative max-w-8xl mx-auto px-4 py-20 md:py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 leading-tight">
              Bring the world together through live experiences
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-8">
              Discover events that fuel your passions. Create, share, find and attend events that enrich your life.
            </p>
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-xl">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-lg text-eb-dark text-base focus:outline-none focus:ring-2 focus:ring-eb-orange"
                />
              </div>
              <button type="submit" className="btn-primary !py-4 !px-8 text-base rounded-lg">
                Search
              </button>
            </form>
            <div className="flex flex-wrap gap-4 mt-6 text-sm text-gray-400">
              <span>Popular:</span>
              {['Music', 'Food', 'Workshops', 'Concerts', 'Sports'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => navigate(`/events?search=${tag}`)}
                  className="hover:text-white transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-eb-gray-border">
        <div className="max-w-8xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <Globe className="w-8 h-8 text-eb-orange mx-auto mb-2" />
              <div className="text-2xl font-bold text-eb-dark">180+</div>
              <div className="text-sm text-eb-gray">Countries</div>
            </div>
            <div>
              <TrendingUp className="w-8 h-8 text-eb-orange mx-auto mb-2" />
              <div className="text-2xl font-bold text-eb-dark">4.7M+</div>
              <div className="text-sm text-eb-gray">Total Events</div>
            </div>
            <div>
              <Users className="w-8 h-8 text-eb-orange mx-auto mb-2" />
              <div className="text-2xl font-bold text-eb-dark">89M</div>
              <div className="text-sm text-eb-gray">Monthly Users</div>
            </div>
            <div>
              <Ticket className="w-8 h-8 text-eb-orange mx-auto mb-2" />
              <div className="text-2xl font-bold text-eb-dark">83M</div>
              <div className="text-sm text-eb-gray">Paid Tickets</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-8xl mx-auto px-4 py-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="section-title">Browse by Category</h2>
          <Link to="/events" className="text-eb-orange font-semibold text-sm hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/events?category=${cat.id}`}
              className="group text-center"
            >
              <div className="relative rounded-xl overflow-hidden mb-2 aspect-square">
                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
              </div>
              <span className="text-sm font-semibold text-eb-dark group-hover:text-eb-orange transition-colors">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Events */}
      <section className="bg-eb-gray-bg py-16">
        <div className="max-w-8xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="section-title">Upcoming Events</h2>
            <Link to="/events" className="text-eb-orange font-semibold text-sm hover:underline flex items-center gap-1">
              See All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredEvents.map((event) => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-8xl mx-auto px-4 py-16">
        <h2 className="section-title text-center mb-12">How EventHub Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-eb-orange-light rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-eb-orange" />
            </div>
            <h3 className="text-xl font-bold mb-2">Create Your Event</h3>
            <p className="text-eb-gray">Set up your event page in minutes with our powerful tools. Add ticket types, descriptions, and media.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-eb-orange-light rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-eb-orange" />
            </div>
            <h3 className="text-xl font-bold mb-2">Sell Tickets</h3>
            <p className="text-eb-gray">Reach millions of attendees on our marketplace. Built-in marketing tools help you promote effectively.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-eb-orange-light rounded-full flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-8 h-8 text-eb-orange" />
            </div>
            <h3 className="text-xl font-bold mb-2">Manage & Grow</h3>
            <p className="text-eb-gray">Use our organizer app for check-ins, track analytics, and build your community with every event.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-eb-orange to-orange-600 py-16">
        <div className="max-w-8xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Start creating events today
          </h2>
          <p className="text-orange-100 mb-8 text-lg max-w-2xl mx-auto">
            Join millions of organizers worldwide. No upfront fees — pay only when you sell tickets.
          </p>
          <Link to="/signup" className="inline-flex items-center gap-2 bg-white text-eb-orange font-bold px-8 py-4 rounded-lg hover:bg-orange-50 transition-colors text-lg">
            Get Started for Free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
