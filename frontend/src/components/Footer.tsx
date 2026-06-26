import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Youtube, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-eb-dark text-white mt-20">
      <div className="max-w-8xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h4 className="font-bold mb-4">Use EventHub</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/how-it-works" className="hover:text-white">How It Works</Link></li>
              <li><Link to="/pricing" className="hover:text-white">Pricing</Link></li>
              <li><Link to="/mobile-app" className="hover:text-white">Mobile App</Link></li>
              <li><Link to="/checkin-app" className="hover:text-white">Check-In App</Link></li>
              <li><Link to="/community-guidelines" className="hover:text-white">Community Guidelines</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Plan Events</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/sell-tickets" className="hover:text-white">Sell Tickets</Link></li>
              <li><Link to="/event-management" className="hover:text-white">Event Management</Link></li>
              <li><Link to="/registration" className="hover:text-white">Event Registration</Link></li>
              <li><Link to="/online-rsvp" className="hover:text-white">RSVP Online</Link></li>
              <li><Link to="/event-payment" className="hover:text-white">Event Payment</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Find Events</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/events?city=singapore" className="hover:text-white">Singapore Events</Link></li>
              <li><Link to="/events?format=online" className="hover:text-white">Virtual Events</Link></li>
              <li><Link to="/events?category=music" className="hover:text-white">Music Events</Link></li>
              <li><Link to="/events?category=food_drink" className="hover:text-white">Food & Drink</Link></li>
              <li><Link to="/events?category=community" className="hover:text-white">Community Events</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Connect With Us</h4>
            <div className="flex gap-4 mb-6">
              <a href="#" className="text-gray-400 hover:text-white"><Facebook className="w-5 h-5" /></a>
              <a href="#" className="text-gray-400 hover:text-white"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="text-gray-400 hover:text-white"><Instagram className="w-5 h-5" /></a>
              <a href="#" className="text-gray-400 hover:text-white"><Youtube className="w-5 h-5" /></a>
            </div>
            <h4 className="font-bold mb-2">Contact Support</h4>
            <a href="mailto:support@eventhub.com" className="text-sm text-gray-400 hover:text-white flex items-center gap-2">
              <Mail className="w-4 h-4" /> support@eventhub.com
            </a>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} EventHub. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-white">Privacy</Link>
            <Link to="/terms" className="hover:text-white">Terms</Link>
            <Link to="/accessibility" className="hover:text-white">Accessibility</Link>
            <Link to="/cookies" className="hover:text-white">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
