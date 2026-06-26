import { Link } from 'react-router-dom';
import { MapPin, Clock, Heart } from 'lucide-react';
import { format } from 'date-fns';

interface EventCardProps {
  event: any;
  onSave?: () => void;
  saved?: boolean;
}

export default function EventCard({ event, onSave, saved }: EventCardProps) {
  const formatDate = (date: string) => {
    try {
      if (event.format === 'online') return format(new Date(date), 'EEE, MMM d');
      return format(new Date(date), 'EEE, MMM d, yyyy');
    } catch {
      return date;
    }
  };

  const formatTime = (date: string) => {
    try {
      return format(new Date(date), 'h:mm a');
    } catch {
      return '';
    }
  };

  const getMinPrice = () => {
    const prices = event.ticketTiers?.filter((t: any) => !t.isFree).map((t: any) => t.price);
    if (!prices?.length) return 'Free';
    const min = Math.min(...prices);
    return min === 0 ? 'Free' : `From $${min.toFixed(2)}`;
  };

  const categoryLabels: Record<string, string> = {
    music: 'Music', food_drink: 'Food & Drink', performing_arts: 'Performing Arts',
    visual_arts: 'Visual Arts', sports_fitness: 'Sports & Fitness',
    health_wellness: 'Health & Wellness', tech: 'Tech', business: 'Business',
    charity_causes: 'Charity & Causes', community: 'Community',
    family_education: 'Family & Ed', fashion: 'Fashion', film_media: 'Film & Media',
    travel_outdoor: 'Travel & Outdoor', nightlife: 'Nightlife', other: 'Other',
  };

  return (
    <Link to={`/events/${event._id}`} className="card group">
      <div className="relative h-48 overflow-hidden">
        <img
          src={event.coverImage || `https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=300&fit=crop`}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-semibold capitalize">
          {categoryLabels[event.category] || event.category}
        </span>
        {onSave && (
          <button
            onClick={(e) => { e.preventDefault(); onSave(); }}
            className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
          >
            <Heart className={`w-4 h-4 ${saved ? 'fill-red-500 text-red-500' : 'text-eb-gray'}`} />
          </button>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-1 text-sm text-eb-orange font-semibold mb-1">
          <Clock className="w-3.5 h-3.5" />
          <span>
            {event.format === 'online' ? 'Online' : formatDate(event.startDate)}
            {event.format !== 'online' && ` at ${formatTime(event.startDate)}`}
          </span>
        </div>
        <h3 className="font-bold text-eb-dark mb-1 line-clamp-2 group-hover:text-eb-orange transition-colors">
          {event.title}
        </h3>
        <p className="text-sm text-eb-gray mb-1 line-clamp-1">{event.shortDescription}</p>
        {event.venue?.city && (
          <div className="flex items-center gap-1 text-sm text-eb-gray mb-3">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="line-clamp-1">{event.venue.city}{event.venue.country ? `, ${event.venue.country}` : ''}</span>
          </div>
        )}
        <div className="flex items-center justify-between pt-3 border-t border-eb-gray-border">
          <span className="font-bold text-eb-dark">{getMinPrice()}</span>
          <span className="text-xs text-eb-gray-light">{event.currentAttendees || 0} going</span>
        </div>
      </div>
    </Link>
  );
}
