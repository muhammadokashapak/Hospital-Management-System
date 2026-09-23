import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '../config';
import { Hammer, RefreshCw, Plus, Clock, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MaintenanceDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('HVAC / AC');
  const [location, setLocation] = useState('');
  const [desc, setDesc] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetchWithAuth('/maintenance/orders');
      if (res.ok) setOrders(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!location || !desc) return toast.error('Location and description are required');
    try {
      const res = await fetchWithAuth(`/maintenance/orders?category=${encodeURIComponent(category)}&location=${encodeURIComponent(location)}&description=${encodeURIComponent(desc)}`, { method: 'POST' });
      if (res.ok) {
        toast.success('Facility work order logged');
        setLocation(''); setDesc('');
        fetchData();
      }
    } catch (err) { toast.error('Error logging work order'); }
  };

  if (loading) return <div className="flex items-center justify-center h-full"><RefreshCw className="animate-spin text-blue-600" size={32} /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Hammer className="text-amber-600" size={28} /> Maintenance & Facilities
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Building maintenance work orders (Plumbing, Electrical, HVAC) & SLA tracking</p>
        </div>
        <button onClick={fetchData} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs"><RefreshCw size={14} /></button>
      </div>

      <form onSubmit={handleAdd} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 max-w-2xl">
        <h3 className="text-sm font-black text-slate-900">Create Facility Work Order</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <select value={category} onChange={e => setCategory(e.target.value)} className="border border-slate-300 rounded-xl px-4 py-2 text-sm font-medium">
            <option>HVAC / AC</option><option>Electrical</option><option>Plumbing</option><option>Carpentry</option>
          </select>
          <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Location / Ward *" className="border border-slate-300 rounded-xl px-4 py-2 text-sm font-medium" />
        </div>
        <textarea rows={3} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description of repair required *" className="w-full border border-slate-300 rounded-xl p-3 text-sm font-medium resize-none" />
        <button type="submit" className="bg-amber-600 text-white px-6 py-2.5 rounded-xl font-black text-xs hover:bg-amber-700 transition-all shadow-md">Submit Work Order</button>
      </form>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-5 py-3 text-left font-black text-xs text-slate-500 uppercase">Category</th>
              <th className="px-5 py-3 text-left font-black text-xs text-slate-500 uppercase">Location</th>
              <th className="px-5 py-3 text-left font-black text-xs text-slate-500 uppercase">Description</th>
              <th className="px-5 py-3 text-center font-black text-xs text-slate-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id} className="border-b border-slate-100">
                <td className="px-5 py-3 font-black text-slate-900">{o.category}</td>
                <td className="px-5 py-3 font-bold text-slate-600">{o.location}</td>
                <td className="px-5 py-3 font-medium text-slate-600 max-w-[300px] truncate">{o.description}</td>
                <td className="px-5 py-3 text-center">
                  <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-black">{o.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
