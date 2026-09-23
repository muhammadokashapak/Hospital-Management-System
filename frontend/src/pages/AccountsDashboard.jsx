import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '../config';
import { Landmark, RefreshCw, Plus, DollarSign, TrendingUp, TrendingDown, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AccountsDashboard() {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Medical Supplies');

  const fetchData = useCallback(async () => {
    try {
      const [eRes, sRes] = await Promise.all([
        fetchWithAuth('/accounts/expenses'),
        fetchWithAuth('/accounts/summary')
      ]);
      if (eRes.ok) setExpenses(await eRes.json());
      if (sRes.ok) setSummary(await sRes.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!title || !amount) return toast.error('Title and amount are required');
    try {
      const res = await fetchWithAuth(`/accounts/expenses?category=${encodeURIComponent(category)}&title=${encodeURIComponent(title)}&amount=${amount}`, { method: 'POST' });
      if (res.ok) {
        toast.success('Expense recorded');
        setTitle(''); setAmount('');
        fetchData();
      }
    } catch (err) { toast.error('Error adding expense'); }
  };

  if (loading) return <div className="flex items-center justify-center h-full"><RefreshCw className="animate-spin text-blue-600" size={32} /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Landmark className="text-emerald-600" size={28} /> Accounts & General Ledger
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Hospital financial accounting, expense ledgers & profit/loss tracking</p>
        </div>
        <button onClick={fetchData} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs"><RefreshCw size={14} /></button>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-emerald-600 uppercase flex items-center gap-1"><TrendingUp size={12} /> Total Revenue</p>
            <p className="text-3xl font-black text-emerald-600 mt-1">Rs. {(summary.total_income || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white border border-red-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-red-600 uppercase flex items-center gap-1"><TrendingDown size={12} /> Total Expenses</p>
            <p className="text-3xl font-black text-red-600 mt-1">Rs. {(summary.total_expenses || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white border border-blue-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-blue-600 uppercase flex items-center gap-1"><DollarSign size={12} /> Net Operating Income</p>
            <p className="text-3xl font-black text-blue-600 mt-1">Rs. {(summary.net_profit || 0).toLocaleString()}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleAddExpense} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row gap-4 items-end max-w-3xl">
        <div className="flex-1 w-full">
          <label className="block text-xs font-black text-slate-700 mb-1">Expense Title *</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Oxygen Cylinders Refill" className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm font-medium" />
        </div>
        <div className="w-full sm:w-44">
          <label className="block text-xs font-black text-slate-700 mb-1">Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)} className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm font-medium">
            <option>Medical Supplies</option>
            <option>Utility & Electric</option>
            <option>Payroll</option>
            <option>Facility Maintenance</option>
          </select>
        </div>
        <div className="w-full sm:w-36">
          <label className="block text-xs font-black text-slate-700 mb-1">Amount (Rs.) *</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="5000" className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm font-medium" />
        </div>
        <button type="submit" className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-black text-xs hover:bg-emerald-700 transition-all shadow-md shrink-0 flex items-center gap-1">
          <Plus size={14} /> Record Expense
        </button>
      </form>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-5 py-3 text-left font-black text-xs text-slate-500 uppercase">Expense Title</th>
              <th className="px-5 py-3 text-left font-black text-xs text-slate-500 uppercase">Category</th>
              <th className="px-5 py-3 text-right font-black text-xs text-slate-500 uppercase">Amount</th>
              <th className="px-5 py-3 text-center font-black text-xs text-slate-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map(e => (
              <tr key={e.id} className="border-b border-slate-100">
                <td className="px-5 py-3 font-black text-slate-900">{e.title}</td>
                <td className="px-5 py-3 font-bold text-slate-600">{e.category}</td>
                <td className="px-5 py-3 font-black text-slate-900 text-right">Rs. {(e.amount || 0).toLocaleString()}</td>
                <td className="px-5 py-3 text-center">
                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-black">Paid</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
