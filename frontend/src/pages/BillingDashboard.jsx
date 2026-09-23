import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '../config';
import { 
  CreditCard, RefreshCw, FileText, CheckCircle2, Clock, 
  DollarSign, TrendingUp, X, UserPlus, Receipt, Banknote
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function BillingDashboard() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('unpaid'); // 'unpaid', 'paid', 'create'
  const [form, setForm] = useState({ patient_id: '', amount: '', description: '' });

  const fetchData = useCallback(async () => {
    try {
      const res = await fetchWithAuth('/billing/invoices');
      if (res.ok) setInvoices(await res.json());
    } catch (err) {
      console.error('Error fetching billing data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const unpaidInvoices = invoices.filter(i => i.status === 'Unpaid');
  const paidInvoices = invoices.filter(i => i.status === 'Paid');
  const totalRevenue = paidInvoices.reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalPending = unpaidInvoices.reduce((sum, i) => sum + (i.amount || 0), 0);

  const handlePayInvoice = async (invoiceId) => {
    try {
      const res = await fetchWithAuth(`/billing/${invoiceId}/pay`, { method: 'POST' });
      if (res.ok) {
        toast.success('Invoice marked as Paid!');
        fetchData();
      } else {
        toast.error('Failed to process payment');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!form.patient_id || !form.amount || !form.description) {
      toast.error('All fields are required');
      return;
    }
    try {
      const res = await fetchWithAuth('/billing/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: parseInt(form.patient_id),
          amount: parseFloat(form.amount),
          description: form.description
        })
      });
      if (res.ok) {
        toast.success('Invoice created successfully');
        setForm({ patient_id: '', amount: '', description: '' });
        setActiveTab('unpaid');
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.detail || 'Failed to create invoice');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <CreditCard className="text-blue-600" size={28} /> Billing & Accounts
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Invoice management, payments & revenue tracking</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-all shadow-md">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><Receipt size={12} /> Total Invoices</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{invoices.length}</p>
        </div>
        <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1"><Clock size={12} /> Unpaid</p>
          <p className="text-3xl font-black text-amber-600 mt-1">{unpaidInvoices.length}</p>
        </div>
        <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1"><Banknote size={12} /> Revenue Collected</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">Rs. {totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-red-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center gap-1"><TrendingUp size={12} /> Pending Amount</p>
          <p className="text-2xl font-black text-red-600 mt-1">Rs. {totalPending.toLocaleString()}</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 bg-white border border-slate-200 rounded-xl p-1.5 shadow-sm w-fit">
        {[
          { key: 'unpaid', label: `Unpaid (${unpaidInvoices.length})`, icon: <Clock size={14} /> },
          { key: 'paid', label: `Paid (${paidInvoices.length})`, icon: <CheckCircle2 size={14} /> },
          { key: 'create', label: 'Create Invoice', icon: <UserPlus size={14} /> }
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${
              activeTab === tab.key ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
            }`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Unpaid Invoices */}
      {activeTab === 'unpaid' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {unpaidInvoices.length === 0 ? (
            <div className="p-12 text-center">
              <CreditCard className="mx-auto text-slate-300 mb-3" size={48} />
              <h3 className="text-lg font-black text-slate-900">All Invoices Paid!</h3>
              <p className="text-sm text-slate-500 mt-1">No pending payments at this time.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-5 py-3 font-black text-xs text-slate-500 uppercase">Invoice #</th>
                    <th className="text-left px-5 py-3 font-black text-xs text-slate-500 uppercase">Patient</th>
                    <th className="text-left px-5 py-3 font-black text-xs text-slate-500 uppercase">Description</th>
                    <th className="text-right px-5 py-3 font-black text-xs text-slate-500 uppercase">Amount</th>
                    <th className="text-center px-5 py-3 font-black text-xs text-slate-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {unpaidInvoices.slice(0, 50).map(inv => (
                    <tr key={inv.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 font-black text-slate-900">INV-{inv.id}</td>
                      <td className="px-5 py-3 font-bold text-slate-700">{inv.patient_name || `Patient #${inv.patient_id}`}</td>
                      <td className="px-5 py-3 text-slate-600 font-medium truncate max-w-[200px]">{inv.description}</td>
                      <td className="px-5 py-3 font-black text-slate-900 text-right">Rs. {(inv.amount || 0).toLocaleString()}</td>
                      <td className="px-5 py-3 text-center">
                        <button onClick={() => handlePayInvoice(inv.id)}
                          className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-xs font-black hover:bg-emerald-700 transition-all">
                          Mark Paid
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Paid Invoices */}
      {activeTab === 'paid' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {paidInvoices.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle2 className="mx-auto text-slate-300 mb-3" size={48} />
              <h3 className="text-lg font-black text-slate-900">No Paid Invoices Yet</h3>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-5 py-3 font-black text-xs text-slate-500 uppercase">Invoice #</th>
                    <th className="text-left px-5 py-3 font-black text-xs text-slate-500 uppercase">Patient</th>
                    <th className="text-left px-5 py-3 font-black text-xs text-slate-500 uppercase">Description</th>
                    <th className="text-right px-5 py-3 font-black text-xs text-slate-500 uppercase">Amount</th>
                    <th className="text-center px-5 py-3 font-black text-xs text-slate-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paidInvoices.slice(0, 50).map(inv => (
                    <tr key={inv.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 font-black text-slate-900">INV-{inv.id}</td>
                      <td className="px-5 py-3 font-bold text-slate-700">{inv.patient_name || `Patient #${inv.patient_id}`}</td>
                      <td className="px-5 py-3 text-slate-600 font-medium truncate max-w-[200px]">{inv.description}</td>
                      <td className="px-5 py-3 font-black text-slate-900 text-right">Rs. {(inv.amount || 0).toLocaleString()}</td>
                      <td className="px-5 py-3 text-center">
                        <span className="bg-emerald-100 text-emerald-700 border border-emerald-300 px-3 py-1 rounded-full text-xs font-black">Paid ✓</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create Invoice Form */}
      {activeTab === 'create' && (
        <form onSubmit={handleCreateInvoice} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 max-w-2xl">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Receipt className="text-blue-600" size={20} /> Create New Invoice
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">Patient ID *</label>
              <input type="number" value={form.patient_id} onChange={e => setForm({...form, patient_id: e.target.value})}
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="Enter Patient ID" />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">Amount (Rs.) *</label>
              <input type="number" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="e.g., 2500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1">Description *</label>
            <input type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="e.g., OPD Consultation, Lab Tests, Room Charges" />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-black text-sm hover:bg-blue-700 transition-all shadow-md flex items-center justify-center gap-2">
            <CreditCard size={16} /> Generate Invoice
          </button>
        </form>
      )}
    </div>
  );
}
