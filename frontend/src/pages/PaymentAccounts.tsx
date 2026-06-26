import { useEffect, useState } from 'react';
import { Plus, Banknote, Smartphone, Check, Trash2, Star, X, CreditCard } from 'lucide-react';
import { paymentAccountAPI } from '../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

interface PaymentAccount {
  _id: string;
  accountType: 'bank' | 'paynow';
  accountName: string;
  bankName?: string;
  accountNumber?: string;
  branchCode?: string;
  paynowNumber?: string;
  paynowType?: 'mobile' | 'uen' | 'email';
  isDefault: boolean;
}

type AccountType = 'bank' | 'paynow';

const initialForm = {
  accountType: 'bank' as AccountType,
  accountName: '',
  bankName: '',
  accountNumber: '',
  branchCode: '',
  paynowNumber: '',
  paynowType: 'mobile' as 'mobile' | 'uen' | 'email',
  isDefault: false,
};

export default function PaymentAccounts() {
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const fetchAccounts = () => {
    setLoading(true);
    paymentAccountAPI.getMine()
      .then((res) => setAccounts(res.data.accounts || []))
      .catch(() => toast.error('Failed to load payment accounts'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await paymentAccountAPI.create(form);
      toast.success('Payment account added!');
      setShowForm(false);
      setForm(initialForm);
      fetchAccounts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add account');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this payment account?')) return;
    try {
      await paymentAccountAPI.delete(id);
      toast.success('Account removed');
      fetchAccounts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove account');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await paymentAccountAPI.setDefault(id);
      toast.success('Default account updated');
      fetchAccounts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to set default');
    }
  };

  const maskAccountNumber = (num: string) => {
    if (num.length <= 4) return num;
    return '•'.repeat(Math.min(num.length - 4, 8)) + num.slice(-4);
  };

  const maskPaynow = (val: string) => {
    if (val.length <= 4) return val;
    return '•'.repeat(Math.min(val.length - 4, 6)) + val.slice(-4);
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-eb-dark">Payment Accounts</h1>
          <p className="text-eb-gray mt-1">Manage accounts for receiving payouts and refunds</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Account
        </button>
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-16 bg-white border border-eb-gray-border rounded-xl">
          <CreditCard className="w-16 h-16 text-eb-gray-light mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No payment accounts</h3>
          <p className="text-eb-gray mb-4">Add a bank account or PayNow to receive payouts</p>
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm flex items-center gap-2 mx-auto">
            <Plus className="w-4 h-4" /> Add Payment Account
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {accounts.map((account) => (
            <div key={account._id} className="bg-white border border-eb-gray-border rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 ${
                    account.accountType === 'bank' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                  }`}>
                    {account.accountType === 'bank' ? <Banknote className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{account.accountName}</h3>
                      {account.isDefault && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium bg-eb-orange/10 text-eb-orange px-2 py-0.5 rounded-full">
                          <Star className="w-3 h-3 fill-current" /> Default
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        account.accountType === 'bank'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {account.accountType === 'bank' ? 'Bank Account' : 'PayNow'}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-eb-gray">
                      {account.accountType === 'bank' ? (
                        <span>{account.bankName} — {account.accountNumber ? maskAccountNumber(account.accountNumber) : ''}</span>
                      ) : (
                        <span>{account.paynowType?.toUpperCase()} — {account.paynowNumber ? maskPaynow(account.paynowNumber) : ''}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!account.isDefault && (
                    <button
                      onClick={() => handleSetDefault(account._id)}
                      className="text-sm text-eb-orange hover:underline flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Set as Default
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(account._id)}
                    className="text-sm text-red-500 hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-eb-gray-border">
              <h2 className="text-xl font-bold">Add Payment Account</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-eb-gray-bg rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">Account Type</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, accountType: 'bank' })}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md border-2 text-sm font-medium transition-colors ${
                      form.accountType === 'bank'
                        ? 'border-eb-orange bg-eb-orange/5 text-eb-orange'
                        : 'border-eb-gray-border text-eb-gray hover:border-eb-gray'
                    }`}
                  >
                    <Banknote className="w-4 h-4" /> Bank Account
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, accountType: 'paynow' })}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md border-2 text-sm font-medium transition-colors ${
                      form.accountType === 'paynow'
                        ? 'border-eb-orange bg-eb-orange/5 text-eb-orange'
                        : 'border-eb-gray-border text-eb-gray hover:border-eb-gray'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" /> PayNow
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Account Name</label>
                <input
                  type="text"
                  value={form.accountName}
                  onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                  className="input-field"
                  placeholder={form.accountType === 'bank' ? 'e.g. Personal Savings' : 'e.g. My PayNow'}
                  required
                />
              </div>

              {form.accountType === 'bank' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Bank Name</label>
                    <input type="text" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} className="input-field" placeholder="e.g. DBS, OCBC, UOB" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Account Number</label>
                    <input type="text" value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} className="input-field" placeholder="e.g. 123-456-789-0" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Branch Code</label>
                    <input type="text" value={form.branchCode} onChange={(e) => setForm({ ...form, branchCode: e.target.value })} className="input-field" placeholder="e.g. 001" />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">PayNow Number / Identifier</label>
                    <input type="text" value={form.paynowNumber} onChange={(e) => setForm({ ...form, paynowNumber: e.target.value })} className="input-field" placeholder="e.g. 91234567" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Type</label>
                    <select
                      value={form.paynowType}
                      onChange={(e) => setForm({ ...form, paynowType: e.target.value as 'mobile' | 'uen' | 'email' })}
                      className="input-field"
                    >
                      <option value="mobile">Mobile</option>
                      <option value="uen">UEN</option>
                      <option value="email">Email</option>
                    </select>
                  </div>
                </>
              )}

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                  className="w-4 h-4 rounded border-eb-gray-border text-eb-orange focus:ring-eb-orange/20"
                />
                <span className="text-sm font-medium">Set as default payment account</span>
              </label>

              <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Saving...' : 'Save Account'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost flex-1">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
