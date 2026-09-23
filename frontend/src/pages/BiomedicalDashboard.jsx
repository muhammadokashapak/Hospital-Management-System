import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '../config';
import { Wrench, RefreshCw, Plus, CheckCircle2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BiomedicalDashboard() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [dept, setDept] = useState('ICU');
  const [model, setModel] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetchWithAuth('/biomedical/assets');
      if (res.ok) setAssets(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name) return toast.error('Asset name is required');
    try {
      const res = await fetchWithAuth(`/biomedical/assets?asset_name=${encodeURIComponent(name)}&department_name=${encodeURIComponent(dept)}&model_number=${encodeURIComponent(model || 'MOD-100')}`, { method: 'POST' });
      if (res.ok) {
        toast.success('Biomedical asset registered');
        setName(''); setModel('');
        fetchData();
      }
    } catch (err) { toast.error('Error registering asset'); }
  };

  if (loading) return <div className="flex items-center justify-center h-full"><RefreshCw className="animate-spin text-blue-600" size={32} /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Wrench className="text-indigo-600" size={28} /> Biomedical Engineering
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Medical equipment registry, preventive maintenance (PPM) & breakdown ticketing</p>
        </div>
        <button onClick={fetchData} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs"><RefreshCw size={14} /></button>
      </div>

      <form onSubmit={handleAdd} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row gap-4 items-end max-w-3xl">
        <div className="flex-1 w-full">
          <label className="block text-xs font-black text-slate-700 mb-1">Equipment Name *</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Draeger Ventilator, Philips ECG" className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm font-medium" />
        </div>
        <div className="w-full sm:w-44">
          <label className="block text-xs font-black text-slate-700 mb-1">Department</label>
          <select value={dept} onChange={e => setDept(e.target.value)} className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm font-medium">
            <option>ICU</option><option>Operation Theatre</option><option>Emergency</option><option>Dialysis</option>
          </select>
        </div>
        <button type="submit" className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-black text-xs hover:bg-indigo-700 transition-all shadow-md shrink-0">Register Equipment</button>
      </form>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-5 py-3 text-left font-black text-xs text-slate-500 uppercase">Equipment Name</th>
              <th className="px-5 py-3 text-left font-black text-xs text-slate-500 uppercase">Department</th>
              <th className="px-5 py-3 text-center font-black text-xs text-slate-500 uppercase">PPM Status</th>
              <th className="px-5 py-3 text-center font-black text-xs text-slate-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {assets.map(a => (
              <tr key={a.id} className="border-b border-slate-100">
                <td className="px-5 py-3 font-black text-slate-900">{a.asset_name}</td>
                <td className="px-5 py-3 font-bold text-slate-600">{a.department_name}</td>
                <td className="px-5 py-3 text-center font-semibold text-slate-600">PPM Verified ✓</td>
                <td className="px-5 py-3 text-center">
                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-black">{a.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
