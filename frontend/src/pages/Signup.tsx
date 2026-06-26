import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '',
    confirmPassword: '', role: 'attendee' as 'attendee' | 'organizer',
    organizationName: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await register({
        firstName: form.firstName, lastName: form.lastName,
        email: form.email, password: form.password,
        role: form.role, organizationName: form.organizationName,
      });
      toast.success('Account created successfully!');
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-eb-gray-bg py-12">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-eb-orange rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">E</span>
          </div>
          <h1 className="text-2xl font-bold text-eb-dark">Create Account</h1>
          <p className="text-eb-gray mt-1">Join EventHub today</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-eb-dark mb-1">First Name</label>
              <input type="text" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="input-field" placeholder="John" />
            </div>
            <div>
              <label className="block text-sm font-medium text-eb-dark mb-1">Last Name</label>
              <input type="text" required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="input-field" placeholder="Doe" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-eb-dark mb-1">Email</label>
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-eb-dark mb-1">Password</label>
            <input type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input-field" placeholder="Min. 8 characters" />
          </div>
          <div>
            <label className="block text-sm font-medium text-eb-dark mb-1">Confirm Password</label>
            <input type="password" required value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} className="input-field" placeholder="Confirm your password" />
          </div>
          <div>
            <label className="block text-sm font-medium text-eb-dark mb-2">I want to...</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, role: 'attendee', organizationName: '' })}
                className={`p-3 rounded-md border-2 text-center transition-colors ${form.role === 'attendee' ? 'border-eb-orange bg-eb-orange-light' : 'border-eb-gray-border hover:border-eb-gray'}`}
              >
                <span className="text-sm font-semibold">Attend Events</span>
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, role: 'organizer' })}
                className={`p-3 rounded-md border-2 text-center transition-colors ${form.role === 'organizer' ? 'border-eb-orange bg-eb-orange-light' : 'border-eb-gray-border hover:border-eb-gray'}`}
              >
                <span className="text-sm font-semibold">Create Events</span>
              </button>
            </div>
          </div>
          {form.role === 'organizer' && (
            <div>
              <label className="block text-sm font-medium text-eb-dark mb-1">Organization Name (Optional)</label>
              <input type="text" value={form.organizationName} onChange={(e) => setForm({ ...form, organizationName: e.target.value })} className="input-field" placeholder="Your org or brand name" />
            </div>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full text-base">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p className="text-center mt-6 text-sm text-eb-gray">
          Already have an account?{' '}
          <Link to="/login" className="text-eb-orange font-semibold hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
