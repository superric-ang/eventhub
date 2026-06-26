import { useEffect, useState } from 'react';
import { Search, ChevronDown, ChevronUp, Shield, Mail, Calendar, User } from 'lucide-react';
import { adminAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [changingRole, setChangingRole] = useState<string | null>(null);

  useEffect(() => {
    adminAPI.getUsers()
      .then((res) => setUsers(res.data.users || []))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  const handleRoleChange = async (userId: string, role: string) => {
    setChangingRole(userId);
    try {
      await adminAPI.updateUserRole(userId, role);
      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, role } : u)));
      toast.success('User role updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    } finally {
      setChangingRole(null);
    }
  };

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.firstName?.toLowerCase().includes(q) ||
      u.lastName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-eb-dark">Users</h1>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-eb-gray" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      <div className="bg-white border border-eb-gray-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-eb-gray-bg">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-semibold text-eb-gray">User</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-eb-gray hidden md:table-cell">Email</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-eb-gray">Role</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-eb-gray hidden sm:table-cell">Joined</th>
              <th className="text-right px-4 py-3 text-sm font-semibold text-eb-gray">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-eb-gray-border">
            {filtered.map((user) => (
              <>
                <tr
                  key={user._id}
                  className="hover:bg-eb-gray-bg cursor-pointer"
                  onClick={() => setExpandedId(expandedId === user._id ? null : user._id)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-eb-orange flex items-center justify-center text-white font-bold text-xs">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-eb-gray md:hidden">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-eb-gray hidden md:table-cell">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                      user.role === 'organizer' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{user.role}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-eb-gray hidden sm:table-cell">
                    {user.createdAt ? format(new Date(user.createdAt), 'MMM d, yyyy') : '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {expandedId === user._id ? <ChevronUp className="w-4 h-4 text-eb-gray inline" /> : <ChevronDown className="w-4 h-4 text-eb-gray inline" />}
                  </td>
                </tr>
                {expandedId === user._id && (
                  <tr key={`${user._id}-details`}>
                    <td colSpan={5} className="px-4 py-4 bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-eb-gray uppercase font-semibold mb-1">Details</p>
                          <div className="space-y-1 text-sm">
                            <p className="flex items-center gap-2"><User className="w-3.5 h-3.5 text-eb-gray" /> {user.firstName} {user.lastName}</p>
                            <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-eb-gray" /> {user.email}</p>
                            <p className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-eb-gray" /> Joined {user.createdAt ? format(new Date(user.createdAt), 'MMM d, yyyy') : '-'}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-eb-gray uppercase font-semibold mb-1">Change Role</p>
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-eb-gray" />
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user._id, e.target.value)}
                              disabled={changingRole === user._id}
                              className="input-field py-1.5 text-sm"
                            >
                              <option value="attendee">Attendee</option>
                              <option value="organizer">Organizer</option>
                              <option value="admin">Admin</option>
                            </select>
                            {changingRole === user._id && <LoadingSpinner size="sm" />}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-eb-gray uppercase font-semibold mb-1">ID</p>
                          <p className="text-xs font-mono text-eb-gray">{user._id}</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-eb-gray-light mx-auto mb-3" />
            <p className="text-eb-gray">No users found</p>
          </div>
        )}
      </div>

      <p className="text-xs text-eb-gray mt-3">
        Showing {filtered.length} of {users.length} users
      </p>
    </div>
  );
}
