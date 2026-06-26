import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, X, User, ChevronDown, LogOut, Ticket, PlusCircle, LayoutDashboard, Wallet } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/events?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-eb-gray-border shadow-sm">
      <div className="max-w-8xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-eb-orange rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">E</span>
              </div>
              <span className="text-xl font-bold text-eb-orange hidden sm:block">EventHub</span>
            </Link>

            <form onSubmit={handleSearch} className="hidden md:flex items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-eb-gray-light" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-80 input-field pl-10 py-2"
                />
              </div>
            </form>
          </div>

          <nav className="hidden md:flex items-center gap-4">
            <Link to="/events" className="btn-ghost text-sm">
              Browse Events
            </Link>
            {user ? (
              <>
                {user.role === 'organizer' && (
                  <Link to="/events/create" className="btn-ghost text-sm flex items-center gap-1">
                    <PlusCircle className="w-4 h-4" />
                    Create Event
                  </Link>
                )}
                <Link to={user.role === 'organizer' ? '/dashboard' : '/tickets'} className="btn-ghost text-sm flex items-center gap-1">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-eb-gray-bg transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-eb-orange flex items-center justify-center text-white font-semibold text-sm">
                      {user.firstName[0]}{user.lastName[0]}
                    </div>
                    <ChevronDown className="w-4 h-4 text-eb-gray" />
                  </button>
                  {profileOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-eb-gray-border z-20 py-2">
                        <div className="px-4 py-3 border-b border-eb-gray-border">
                          <p className="font-semibold">{user.firstName} {user.lastName}</p>
                          <p className="text-sm text-eb-gray">{user.email}</p>
                        </div>
                        <Link to="/profile" className="flex items-center gap-3 px-4 py-2 hover:bg-eb-gray-bg text-sm" onClick={() => setProfileOpen(false)}>
                          <User className="w-4 h-4" /> Profile
                        </Link>
                        <Link to="/tickets" className="flex items-center gap-3 px-4 py-2 hover:bg-eb-gray-bg text-sm" onClick={() => setProfileOpen(false)}>
                          <Ticket className="w-4 h-4" /> My Tickets
                        </Link>
                        <Link to="/payment-accounts" className="flex items-center gap-3 px-4 py-2 hover:bg-eb-gray-bg text-sm" onClick={() => setProfileOpen(false)}>
                          <Wallet className="w-4 h-4" /> Payment Accounts
                        </Link>
                        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2 hover:bg-eb-gray-bg text-sm w-full text-left text-red-500">
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost text-sm">Log In</Link>
                <Link to="/signup" className="btn-primary text-sm !py-2 !px-5">Sign Up</Link>
              </>
            )}
          </nav>

          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-eb-gray-border bg-white">
          <div className="px-4 py-3">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-eb-gray-light" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full input-field pl-10 py-2"
                />
              </div>
            </form>
          </div>
          <div className="px-4 pb-4 space-y-1">
            <Link to="/events" className="block px-3 py-2 rounded-md hover:bg-eb-gray-bg" onClick={() => setMobileMenuOpen(false)}>Browse Events</Link>
            {user ? (
              <>
                {user.role === 'organizer' && (
                  <Link to="/events/create" className="block px-3 py-2 rounded-md hover:bg-eb-gray-bg" onClick={() => setMobileMenuOpen(false)}>Create Event</Link>
                )}
                <Link to="/dashboard" className="block px-3 py-2 rounded-md hover:bg-eb-gray-bg" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
                <Link to="/profile" className="block px-3 py-2 rounded-md hover:bg-eb-gray-bg" onClick={() => setMobileMenuOpen(false)}>Profile</Link>
                <Link to="/tickets" className="block px-3 py-2 rounded-md hover:bg-eb-gray-bg" onClick={() => setMobileMenuOpen(false)}>My Tickets</Link>
                <button onClick={handleLogout} className="block w-full text-left px-3 py-2 rounded-md hover:bg-eb-gray-bg text-red-500">Sign Out</button>
              </>
            ) : (
              <>
                <Link to="/login" className="block px-3 py-2 rounded-md hover:bg-eb-gray-bg" onClick={() => setMobileMenuOpen(false)}>Log In</Link>
                <Link to="/signup" className="block px-3 py-2 text-eb-orange font-semibold" onClick={() => setMobileMenuOpen(false)}>Sign Up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
