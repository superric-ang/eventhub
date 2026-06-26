import { Routes, Route, Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import EventList from './pages/EventList';
import EventDetail from './pages/EventDetail';
import CreateEvent from './pages/CreateEvent';
import Dashboard from './pages/Dashboard';
import Tickets from './pages/Tickets';
import Profile from './pages/Profile';
import PaymentAccounts from './pages/PaymentAccounts';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminPayouts from './pages/AdminPayouts';
import AdminReports from './pages/AdminReports';
import AdminSettings from './pages/AdminSettings';
import LoadingSpinner from './components/LoadingSpinner';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner size="lg" />;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

function OrganizerRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner size="lg" />;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'organizer' && user.role !== 'admin') return <Navigate to="/" />;
  return <>{children}</>;
}

function AdminLayout() {
  const location = useLocation();
  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: 'LayoutDashboard' },
    { path: '/admin/users', label: 'Users', icon: 'Users' },
    { path: '/admin/payouts', label: 'Payouts', icon: 'Wallet' },
    { path: '/admin/reports', label: 'Reports', icon: 'FileText' },
    { path: '/admin/settings', label: 'Settings', icon: 'Settings' },
  ];

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <aside className="w-64 bg-eb-dark text-white p-6 hidden md:block">
        <h2 className="text-lg font-bold mb-6">Admin Console</h2>
        <nav className="space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-eb-orange text-white' : 'text-gray-300 hover:bg-white/10'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex-1 bg-eb-gray-bg p-6">
        <Outlet />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/events" element={<EventList />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route
            path="/events/create"
            element={
              <OrganizerRoute>
                <CreateEvent />
              </OrganizerRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tickets"
            element={
              <ProtectedRoute>
                <Tickets />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment-accounts"
            element={
              <ProtectedRoute>
                <PaymentAccounts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="payouts" element={<AdminPayouts />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
          <Route path="*" element={
            <div className="text-center py-20">
              <h2 className="text-2xl font-bold text-eb-dark mb-2">404</h2>
              <p className="text-eb-gray">Page not found</p>
            </div>
          } />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
